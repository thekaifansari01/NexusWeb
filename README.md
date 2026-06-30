# Nexus - Secure AI Assistant Integration

<p align="center">
  <img src="https://img.shields.io/badge/version-1.2.0-blue.svg" alt="Version 1.2.0" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Groq-00B4D8?style=flat&logo=groq&logoColor=white" alt="Groq" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" />
</p>

## 📌 Overview

**Nexus** is a secure, embeddable AI assistant platform that turns your website into a conversational knowledge base. It provides a lightweight widget that integrates with Groq's powerful language models while ensuring your API keys remain secure through encryption and strict domain whitelisting.

> 🔐 **Secure by Design** — Your Groq API key is never exposed to the frontend. Nexus uses a separate, domain-restricted key for widget communication.

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔑 **Vault-Grade Security** | Groq API keys are encrypted and stored securely; Nexus keys are separate for frontend use |
| 🌐 **Domain Whitelisting** | Each Nexus key is restricted to authorized domains, preventing misuse |
| 🎨 **Zero Friction Integration** | Add a single script tag to your HTML; the widget auto-adapts to your site's theme |
| 👤 **User Management** | Google OAuth authentication with Firebase integration |
| 📊 **Dashboard Control** | Manage API keys, authorized domains, and Groq API key in one place |
| ⚡ **Real-time Stats** | Track active keys, revoked keys, and domain usage at a glance |
| 🔄 **Key Lifecycle Management** | Create, revoke, activate, and delete API keys with instant updates |
| 🛡️ **CORS Protection** | Backend verifies request origins against your authorized domains |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Browser                         │
│  ┌─────────────┐    ┌─────────────┐    ┌───────────────────┐  │
│  │   Website   │───▶│  Nexus      │    │   Dashboard       │  │
│  │   with      │    │  Widget     │    │   (Dashboard UI)  │  │
│  │   Script    │    │  (iframe)   │    │                   │  │
│  └─────────────┘    └──────┬──────┘    └────────┬──────────┘  │
└─────────────────────────────┼────────────────────┼─────────────┘
                              │                    │
                              ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Firebase Backend                        │
│  ┌─────────────┐    ┌─────────────┐    ┌───────────────────┐  │
│  │   Auth      │    │  Firestore  │    │   Serverless      │  │
│  │   (Google)  │    │  Database   │    │   Functions       │  │
│  └─────────────┘    └─────────────┘    └────────┬──────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                                    │
                                                    ▼
                                          ┌─────────────────────┐
                                          │   Groq API          │
                                          │   (LLM Inference)   │
                                          └─────────────────────┘
```

### Data Flow

1. **User Authentication** → Firebase Auth (Google OAuth)
2. **Key Management** → Firestore storage with user-based security rules
3. **Chat Requests** → Frontend → Serverless Function → Groq API → Response
4. **Security** → Origin verification against authorized domains

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (for local development)
- Python 3.9+ (for serverless function)
- Firebase account with project setup
- Groq API key

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/thekaifansari01/NexusWeb.git
cd NexusWeb
```

#### 2. Firebase Configuration

Create a Firebase project and obtain your configuration:

```javascript
// src/config/firebase.js
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};
```

#### 3. Set Up Firebase Security Rules

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /apiKeys/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /authorizedDomains/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /userGroqKeys/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

#### 4. Deploy Serverless Function

The `chat.py` file is designed for Vercel serverless functions:

```bash
# Create a vercel.json file
{
  "functions": {
    "api/chat.py": {
      "runtime": "python3.9"
    }
  },
  "rewrites": [{ "source": "/api/(.*)", "destination": "/api/$1" }]
}
```

Set environment variables in Vercel:

```env
FIREBASE_SERVICE_ACCOUNT=your_service_account_json
# Or individually:
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key
```

#### 5. Integrate the Widget

Add the Nexus widget to your website:

```html
<!-- Add this script to your HTML -->
<script>
  window.NEXUS_CONFIG = {
    apiKey: 'your-nexus-key',
    position: 'bottom-right', // or 'bottom-left'
    theme: 'dark', // or 'light'
    greeting: 'Hello! How can I help you?'
  };
</script>
<script src="https://cdn.nexus.ai/widget.js"></script>
```

## 📁 Project Structure

```
NexusWeb/
├── index.html                 # Landing page
├── dashboard.html             # User dashboard
├── src/
│   ├── css/
│   │   ├── styles.css         # Global styles
│   │   └── dashboard.css      # Dashboard-specific styles
│   ├── js/
│   │   ├── app.js             # Main entry point
│   │   ├── dashboard.js       # Dashboard logic
│   │   ├── modules/
│   │   │   ├── auth.js        # Firebase authentication
│   │   │   ├── firestore.js   # Firestore CRUD operations
│   │   │   └── ui.js          # UI helpers and toast notifications
│   └── config/
│       └── firebase.js        # Firebase configuration
├── api/
│   └── chat.py                # Vercel serverless function (Groq proxy)
├── package.json
└── README.md
```

## 💻 Usage

### Dashboard Features

#### API Key Management

- **Create Keys**: Generate new Nexus API keys with custom names
- **Copy Keys**: One-click copy to clipboard
- **Revoke/Activate**: Toggle key status instantly
- **Delete**: Permanently remove keys

#### Domain Management

- **Add Domains**: Whitelist domains for API key usage (max 10)
- **Activate/Deactivate**: Control domain access
- **Remove Domains**: Delete from whitelist

#### Groq API Key Storage

- **Secure Storage**: Encrypted storage of your Groq API key
- **View/Hide**: Toggle visibility with password masking
- **Delete**: Remove stored key when needed

### Chat API Endpoint

The serverless function at `/api/chat` accepts:

```json
{
  "nexusKey": "your-nexus-key",
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "model": "llama3-8b-8192"
}
```

Response:

```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      }
    }
  ]
}
```

## 🛠️ Technology Stack

| Category | Technologies |
|----------|--------------|
| **Frontend** | HTML5, CSS3, JavaScript (ES Modules), Tailwind CSS |
| **UI Framework** | Plus Jakarta Sans font, Phosphor Icons |
| **Authentication** | Firebase Auth (Google OAuth) |
| **Database** | Firebase Firestore |
| **Backend** | Python 3.9, Flask-like serverless |
| **LLM Provider** | Groq API |
| **Hosting** | Vercel (frontend + serverless) |
| **Package Management** | importmap with CDN dependencies |

## 🔧 Configuration

### Environment Variables (Serverless)

| Variable | Description | Required |
|----------|-------------|----------|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account JSON (base64 or raw) | Conditional |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Conditional |
| `FIREBASE_CLIENT_EMAIL` | Service account email | Conditional |
| `FIREBASE_PRIVATE_KEY` | Service account private key | Conditional |
| `FIREBASE_PRIVATE_KEY_ID` | Private key ID | Optional |
| `FIREBASE_CLIENT_ID` | Client ID | Optional |

### Client-side Configuration

```javascript
// Firebase config in src/config/firebase.js
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  // ... other config
};
```

## 🚨 Troubleshooting

### Common Issues

#### 1. "Permission denied" errors in Firestore

**Solution**: Ensure your Firebase security rules allow read/write for authenticated users and match the user ID.

```javascript
// Check user ownership in rules
allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
```

#### 2. "Domain not authorized" in chat API

**Solution**: Add the domain to your authorized domains list in the dashboard. Domain must match the origin exactly (without protocol, www., or trailing slash).

#### 3. Missing Firestore Index

If you see an error about a missing index, create it using the URL provided in the error message:

```bash
# Example error URL
https://console.firebase.google.com/v1/r/project/your-project/firestore/indexes?create_composite=...
```

#### 4. Groq API Key Not Working

- Verify the key is correct and active in your Groq account
- Check that you've saved it in the dashboard
- Ensure the key has proper permissions for the models you're using

#### 5. CORS Issues

The serverless function includes CORS headers. If you're testing locally, ensure your origin is whitelisted:

```python
# In chat.py - already handles this
self.send_header('Access-Control-Allow-Origin', '*')
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- Use **ES Modules** (`import`/`export`) for JavaScript
- Follow **Google JavaScript Style Guide**
- Write **clear commit messages**
- Update **documentation** when adding features
- Test your changes thoroughly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Groq](https://groq.com/) for providing fast LLM inference
- [Firebase](https://firebase.google.com/) for backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Phosphor Icons](https://phosphoricons.com/) for beautiful icons

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/thekaifansari01">Kaif Ansari</a>
</p>

<p align="center">
  <a href="https://github.com/thekaifansari01/NexusWeb/issues">Report Bug</a> ·
  <a href="https://github.com/thekaifansari01/NexusWeb/issues">Request Feature</a>
</p>