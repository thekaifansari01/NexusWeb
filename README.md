# Nexus – Secure AI Assistant Integration

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/thekaifansari01/NexusWeb/releases)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Groq](https://img.shields.io/badge/Groq-00B4D8?style=flat&logo=groq&logoColor=white)](https://groq.com)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2020-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com)

---

## 📌 Overview

**Nexus** is a turn‑key, self‑hosted AI assistant platform that transforms any website into a conversational knowledge base. It provides a lightweight, embeddable widget that leverages **Groq**’s ultra‑fast LLMs (Llama 3, Mixtral, and more) to answer user questions based on your site’s content – all while keeping your API keys secure through encryption and strict domain whitelisting.

> 🔐 **Secure by design** – Your Groq API key is never exposed to the frontend. Nexus uses a separate, domain‑restricted key (Nexus Key) for widget communication. The backend verifies every request’s origin, ensuring that only your authorized domains can use your keys.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔑 **Vault‑Grade Security** | Groq API keys are stored encrypted and kept separate from the public‑facing Nexus Keys. |
| 🌐 **Domain Whitelisting** | Each Nexus Key is restricted to a list of authorized domains (up to 10) – preventing misuse even if the key leaks. |
| 🧩 **Zero‑Friction Integration** | Drop a single `<script>` tag into your HTML. The widget automatically scrapes your page content, adapts to your theme, and provides instant context‑aware answers. |
| 👤 **User Management** | Google OAuth (Firebase) with session cookies (HttpOnly, Secure, SameSite=Strict) – no passwords to manage. |
| 📊 **Dashboard Control** | Manage Nexus Keys, domains, and your Groq API key from a single, polished interface. |
| ⚡ **Real‑time Stats** | Track active/revoked keys, domain usage, and request logs – all updated live. |
| 🔄 **Full Lifecycle Management** | Create, copy, revoke, activate, or permanently delete keys; toggle domains on/off. |
| 🛡️ **CORS & Origin Enforcement** | Backend verifies `Origin`/`Referer` headers against your whitelist before processing any AI request. |
| 🚦 **Rate Limiting** | Prevents abuse when generating new Nexus Keys (5 per day per user) and when deleting accounts (2 per day). |
| 🤖 **Multi‑Model Support** | Choose from `llama3-8b-8192` (default), `llama3-70b-8192`, or `mixtral-8x7b-32768` directly from the widget configuration. |
| 🖼️ **File Attachments** | Users can attach images; the widget can forward them to the AI (if the model supports vision). |
| 🌙 **Theme Auto‑Detection** | The widget automatically matches your site’s dark/light theme (with manual override). |
| 👤 **Profile Management** | View and manage your account information directly from the Settings tab. |
| 🔐 **Password Change** | Email/Password users can update their password securely with re‑authentication. |
| 🗑️ **Account Deletion** | Permanently delete your account and all associated data (keys, domains, usage logs, sessions) with CAPTCHA verification and rate limiting. |
| 🖥️ **Smart Session Management** | View active sessions with parsed device info (OS, Browser, Device Type), last active time, IP, and location. |
| 🔓 **Log Out All Others** | One‑click button to revoke all sessions except your current device. |
| 🔄 **Live Refresh** | Refresh session list without reloading the page. |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Browser                             │
│  ┌─────────────┐    ┌─────────────┐    ┌───────────────────────┐  │
│  │   Website   │───▶│  Nexus      │    │   Dashboard           │  │
│  │   with      │    │  Widget     │    │   (Dashboard UI)      │  │
│  │   Script    │    │  (iframe)   │    │                       │  │
│  └─────────────┘    └──────┬──────┘    └───────────┬───────────┘  │
└─────────────────────────────┼───────────────────────┼─────────────┘
                              │                       │
                              ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Vercel (Serverless)                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │             Python HTTP Handlers (api/*.py)                │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐  │   │
│  │  │ auth.py     │  │ chat.py     │  │ session.py        │  │   │
│  │  │ (session    │  │ (AI proxy,  │  │ (list/revoke      │  │   │
│  │  │ creation)   │  │ key mgmt)   │  │  sessions)        │  │   │
│  │  └─────────────┘  └──────┬──────┘  └───────────────────┘  │   │
│  │  ┌─────────────┐  ┌──────┴──────┐  ┌───────────────────┐  │   │
│  │  │ user.py     │  │ groq.py     │  │ userService.py    │  │   │
│  │  │ (account    │  │ (key vault) │  │ (data deletion)   │  │   │
│  │  │ deletion)   │  └─────────────┘  └───────────────────┘  │   │
│  │  └─────────────┘                                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
└───────────────────────────────┼─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Firebase Backend                            │
│  ┌─────────────┐    ┌─────────────┐    ┌───────────────────────┐  │
│  │   Auth      │    │  Firestore  │    │   Security Rules      │  │
│  │   (Google)  │    │  Database   │    │   (user‑scoped)       │  │
│  └─────────────┘    └──────┬──────┘    └───────────────────────┘  │
└─────────────────────────────┼─────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   Groq API          │
                    │   (LLM Inference)   │
                    └─────────────────────┘
```

### Data Flow (Chat Request)

1. **User** sends a message through the widget.
2. **Widget** scrapes current page content (via Readability + Turndown) and sends a `POST` request to `/api/chat` with the Nexus Key and message.
3. **Backend** (`chat.py`) validates:
   - The Nexus Key exists and is active.
   - The request’s `Origin`/`Referer` matches a domain in the user’s whitelist.
   - The user has a Groq API key stored.
4. **Backend** forwards the request to Groq with the user’s key and returns the response.
5. **Usage** is logged to Firestore (`usageLogs`, `userDailyUsage`) for analytics.

---

## 🧰 Tech Stack

### Frontend
- **HTML5** – semantic markup.
- **CSS** – Tailwind CSS (CDN) + custom `styles.css`, `dashboard.css`.
- **JavaScript (ES Modules)** – pure JS, no frameworks.
- **Phosphor Icons** – clean, scalable icons.
- **Firebase v9** – client‑side auth (`auth`, `firestore`).
- **Google Identity Services** – One‑Tap sign‑in.
- **Cloudflare Turnstile** – CAPTCHA for key generation and account deletion.

### Backend
- **Python 3.9+** – using `http.server` for serverless functions on Vercel.
- **Firebase Admin SDK** – authentication, Firestore database.
- **PyJWT** – session token creation/verification.
- **Requests** – Groq API and Turnstile verification.
- **UUID** – session ID generation.
- **Cryptography** – Fernet symmetric encryption for Groq API keys.
- **User‑Agent Parsing** – Custom parser for device/browser/OS identification in session logs.

### Infrastructure
- **Vercel** – hosting and serverless functions.
- **Firebase** – authentication and NoSQL database.
- **Groq** – AI inference provider.
- **Cloudflare Turnstile** – bot mitigation.
- **Resend** – transactional email service for notifications.

---

## 🚀 Getting Started

### Prerequisites

- Python 3.9+ (for local function development)
- Firebase project with **Authentication (Google)** and **Firestore** enabled.
- Groq API key (obtain from [Groq Console](https://console.groq.com)).
- Vercel account (for deployment) – optional for local testing.
- Resend API key (for email notifications – optional).

---

### 1. Clone the Repository

```bash
git clone https://github.com/thekaifansari01/NexusWeb.git
cd NexusWeb
```

---

### 2. Firebase Configuration

Create a Firebase project and enable **Authentication** (Google sign‑in) and **Firestore**.

#### Client Configuration (`src/config/firebase.js`)

Replace the placeholder values with your project’s configuration:

```javascript
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

#### Server‑side Credentials

You need to provide Firebase service account credentials to the backend (for Firestore Admin SDK). You have two options:

**Option A** – Environment variable `FIREBASE_SERVICE_ACCOUNT` (JSON string)  
**Option B** – Separate environment variables:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- (Optional) `FIREBASE_PRIVATE_KEY_ID`, `FIREBASE_CLIENT_ID`

> ⚠️ **Important**: Never commit service account keys to version control. Use environment variables or secrets in your deployment platform.

---

### 3. Firestore Security Rules

Set up basic security rules to protect user data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /apiKeys/{keyId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid && request.resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    match /authorizedDomains/{domainId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid && request.resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    match /userGroqKeys/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    match /usageLogs/{logId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if false;
    }
    match /userDailyUsage/{dailyId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if false;
    }
    match /active_sessions/{sessionId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid && request.resource.data.userId == request.auth.uid;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

### 4. Environment Variables (Backend)

Set these in your deployment environment (Vercel) or create a `.env` file for local development:

```env
# Firebase (either full JSON or individual fields)
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
# OR
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@...com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Cookie signing secret (must be strong, 32+ chars)
COOKIE_SECRET=your-super-secret-cookie-key

# Cloudflare Turnstile
TURNSTILE_SECRET_KEY=your-turnstile-secret-key

# Encryption key for Groq API keys (Fernet symmetric key)
ENCRYPTION_KEY=your-fernet-encryption-key

# Email service (Resend)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=onboarding@resend.dev
```

---

### 5. Deploy to Vercel

The project is structured for Vercel:

- Static files (`.html`, `src/`, `assets/`) are served as‑is.
- Python functions in `/api` are automatically deployed as serverless functions.

Create a `vercel.json` (optional, but recommended):

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ],
  "functions": {
    "api/*.py": {
      "runtime": "python3.9"
    }
  }
}
```

Then:

```bash
vercel --prod
```

> **Note**: Make sure all environment variables are added in the Vercel project settings.

---

### 6. Integrate the Widget

Add the Nexus widget to your website by including the following snippet (replace `YOUR_NEXUS_KEY` with a key generated from your dashboard):

```html
<!-- Configuration -->
<script>
  window.NexusConfig = {
    apiKey: 'YOUR_NEXUS_KEY',
    theme: 'auto',          // 'dark', 'light', or 'auto'
    botName: 'Nexus AI',
    greeting: '👋 Hello! How can I assist you?',
    model: 'llama3-8b-8192' // Optional, defaults to this
  };
</script>

<!-- Load the widget (CDN) -->
<script defer src="https://cdn.jsdelivr.net/npm/nexus-web-assistant@2.2.0/dist/nexus-assistant.min.js"></script>
```

The widget will appear as a floating chat button on your page, ready to answer questions based on your content.

---

## 📚 API Reference

All endpoints are relative to your deployed domain (e.g., `https://your-domain.vercel.app`).

### Authentication & Session

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/session` | `POST` | Creates a session from a Firebase ID token. Returns a secure, HttpOnly cookie. |
| `/api/auth/logout` | `POST` | Revokes the current session and clears the cookie. |
| `/api/auth/me` | `GET` | Returns the current user’s UID and session ID (requires valid cookie). |
| `/api/session` | `GET` | Lists all active sessions with parsed device info (OS, Browser, Type), last active time, IP, and location. |
| `/api/session` | `DELETE` | Revokes a specific session (body: `{ "sessionId": "..." }`) or all other sessions (body: `{ "revokeAll": true }`). |

### AI Proxy & Key Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | `POST` | **AI proxy** – accepts `nexusKey`, `messages`, `model` (optional). Also used for **creating a new Nexus Key** when payload contains `name` and `captchaToken` (requires authentication via cookie). |

#### Chat Request Example

```json
{
  "nexusKey": "nxs_abc123...",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "What is Nexus?" }
  ],
  "model": "llama3-8b-8192"
}
```

#### Chat Response

Returns the raw Groq API response (success 200) or an error object.

### Account Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user` | `DELETE` | Permanently deletes the authenticated user's account, including all data (API keys, domains, usage logs, sessions, Firebase Auth user) after CAPTCHA verification. Rate limited to 2 deletions per day. |

#### Account Deletion Request Example

```json
{
  "captchaToken": "turnstile_token_here"
}
```

### Groq Key Vault

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/groq` | `GET` | Checks if the authenticated user has a saved Groq API key. |
| `/api/groq` | `POST` | Saves an encrypted Groq API key for the authenticated user. |
| `/api/groq` | `DELETE` | Deletes the user's stored Groq API key. |

---

## 🔒 Security Model

Nexus employs multiple layers of security to protect your data and infrastructure:

1. **Separation of Keys**  
   - **Groq API Key** – stored encrypted in Firestore and never exposed to the client.  
   - **Nexus Key** – used by the widget; can be revoked independently without affecting your Groq key.

2. **Domain Whitelisting**  
   - Every chat request is validated against the `Origin` or `Referer` header.  
   - Only domains you explicitly add to your account can use your Nexus Key.

3. **HttpOnly, Secure, SameSite Cookies**  
   - Session cookies are not accessible via JavaScript, preventing XSS theft.  
   - Cookies are only sent over HTTPS and restricted to same‑site requests.

4. **JWT Signing**  
   - Session tokens are signed with a server‑side secret (`COOKIE_SECRET`) – no session data is stored in the database.

5. **Rate Limiting**  
   - Users can generate at most 5 Nexus Keys per day.  
   - Users can request account deletion at most 2 times per day.

6. **CAPTCHA Protection**  
   - Cloudflare Turnstile ensures that key creation and account deletion requests come from real users, not bots.

7. **Firestore Security Rules**  
   - Ensure that users can only access documents they own.

8. **CORS**  
   - Proper CORS headers are set for all API responses.

9. **Encryption**  
   - Groq API keys are encrypted using Fernet (symmetric encryption) before storage.

10. **Re‑authentication for Critical Actions**  
    - Password change requires current password verification.  
    - Account deletion requires CAPTCHA verification.

---

## 📁 Project Structure

```
NexusWeb/
├── index.html                     # Landing page
├── dashboard.html                 # User dashboard
├── activity.html                  # Session management page
├── demo.html                      # Live demo page
├── documentation.html             # Full documentation
├── pricing.html                   # Pricing (free) page
├── privacyPolicy.html             # Privacy policy
├── termsConditions.html           # Terms of Service
├── 404.html                       # Custom 404
├── assets/                        # Static assets (favicon, images)
├── src/
│   ├── css/
│   │   ├── styles.css             # Global styles
│   │   └── dashboard.css          # Dashboard‑specific styles
│   ├── js/
│   │   ├── app.js                 # Main entry for landing/demo
│   │   ├── dashboard.js           # Dashboard logic
│   │   ├── activity.js            # Session activity page
│   │   ├── modules/
│   │   │   ├── auth.js            # Firebase auth helpers
│   │   │   ├── firestore.js       # Firestore CRUD operations
│   │   │   └── ui.js              # Toast notifications, UI helpers
│   └── config/
│       └── firebase.js            # Firebase client configuration
├── api/                           # Python serverless functions
│   ├── auth/
│   │   └── index.py               # Session creation/logout/me
│   ├── chat/
│   │   └── index.py               # AI proxy + key creation
│   ├── groq/
│   │   └── index.py               # Groq key vault (GET/POST/DELETE)
│   ├── session/
│   │   └── index.py               # GET/DELETE /api/session
│   ├── user/
│   │   └── index.py               # DELETE /api/user (account deletion)
│   ├── core/
│   │   ├── config.py              # Firebase init, JWT helper, cookie utils
│   │   ├── crypto_utils.py        # Encryption/decryption utilities
│   │   └── middleware.py          # Cookie parsing & verification
│   └── services/
│       ├── chatService.py         # Core AI logic, domain check, logging
│       ├── emailService.py        # Email notifications (Resend)
│       ├── keyService.py          # Key creation, CAPTCHA, rate limiting
│       ├── sessionService.py      # Session listing/revocation/parsing
│       └── userService.py         # User data deletion logic
└── README.md                      # This file
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository.
2. **Create** a feature branch: `git checkout -b feature/your-feature-name`.
3. **Commit** your changes with clear messages.
4. **Push** to the branch.
5. **Open** a Pull Request against `main`.

### Development Guidelines

- Use **ES Modules** (`import`/`export`) for JavaScript.
- Follow the **Google JavaScript Style Guide**.
- Write **meaningful commit messages**.
- Update **documentation** when adding features.
- Test changes locally before submitting.

---

## 📄 License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Groq](https://groq.com) – for their lightning‑fast LPU inference.
- [Firebase](https://firebase.google.com) – for providing a robust backend.
- [Tailwind CSS](https://tailwindcss.com) – for making styling a joy.
- [Phosphor Icons](https://phosphoricons.com) – for the beautiful icon set.
- [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) – for bot protection.
- [Resend](https://resend.com) – for transactional email delivery.

---

## 📬 Contact & Support

- **GitHub Issues**: [Report a bug](https://github.com/thekaifansari01/NexusWeb/issues) or request a feature.
- **Email**: [kaif.ansari.global@gmail.com](mailto:kaif.ansari.global@gmail.com)
- **GitHub Profile**: [thekaifansari01](https://github.com/thekaifansari01)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/thekaifansari01">Kaif Ansari</a>
</p>

<p align="center">
  <a href="https://github.com/thekaifansari01/NexusWeb/stargazers">⭐ Star us on GitHub</a> ·
  <a href="https://github.com/thekaifansari01/NexusWeb/issues">Report Bug</a> ·
  <a href="https://github.com/thekaifansari01/NexusWeb/issues">Request Feature</a>
</p>