 import { initializeApp } from "firebase/app";
        import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
        import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

        const firebaseConfig = {
            apiKey: "AIzaSyAEptheO-640PV6s7lbDZ_4pxkRoCXe_VE",
            authDomain: "www.trynexus.site",
            projectId: "nexuswebassistant",
            storageBucket: "nexuswebassistant.firebasestorage.app",
            messagingSenderId: "69132729895",
            appId: "1:69132729895:web:1fc74209c95486e241d802",
            measurementId: "G-WEPDV083FB"
        };
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);

        const sidebarAvatar = document.getElementById('sidebarAvatar');
        const sidebarName = document.getElementById('sidebarName');
        const sidebarEmail = document.getElementById('sidebarEmail');
        const sidebarSignOut = document.getElementById('sidebarSignOut');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const closeMobileMenuBtn = document.getElementById('closeMobileMenuBtn');
        const sidebar = document.getElementById('sidebarMenu');
        const loadingOverlay = document.getElementById('loadingOverlay');

        const keySelect = document.getElementById('keySelect');
        const botName = document.getElementById('botName');
        const greeting = document.getElementById('greeting');
        const themeSelect = document.getElementById('themeSelect');
        const modelSelect = document.getElementById('modelSelect');
        const systemPrompt = document.getElementById('systemPrompt');
        
        const previewContainer = document.getElementById('previewContainer');
        const previewLoader = document.getElementById('previewLoader');
        const scriptContent = document.getElementById('scriptContent');
        const copyScriptBtn = document.getElementById('copyScriptBtn');

        const tabPreview = document.getElementById('tab-preview');
        const tabCode = document.getElementById('tab-code');
        const panePreview = document.getElementById('pane-preview');
        const paneCode = document.getElementById('pane-code');

        let currentUser = null;
        let keys = [];
        let selectedKey = '';

        const WIDGET_CDN = 'https://cdn.jsdelivr.net/npm/nexus-web-assistant@3.1.0/dist/nexus-assistant.min.js';

        tabPreview.addEventListener('click', () => {
            tabPreview.classList.add('border-primary', 'text-primary');
            tabPreview.classList.remove('border-transparent', 'text-zinc-500');
            tabCode.classList.remove('border-primary', 'text-primary');
            tabCode.classList.add('border-transparent', 'text-zinc-500');
            panePreview.classList.remove('hidden');
            paneCode.classList.add('hidden');
        });

        tabCode.addEventListener('click', () => {
            tabCode.classList.add('border-primary', 'text-primary');
            tabCode.classList.remove('border-transparent', 'text-zinc-500');
            tabPreview.classList.remove('border-primary', 'text-primary');
            tabPreview.classList.add('border-transparent', 'text-zinc-500');
            paneCode.classList.remove('hidden');
            panePreview.classList.add('hidden');
        });

        function updateSidebar(user) {
            if (!user) return;
            const displayName = user.displayName || user.email?.split('@')[0] || 'User';
            sidebarAvatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=a855f7&color=fff&size=40`;
            sidebarName.textContent = displayName;
            sidebarEmail.textContent = user.email || 'user@example.com';
        }

        function loadKeys(user) {
            const q = query(collection(db, 'apiKeys'), where('userId', '==', user.uid));
            return getDocs(q).then(snapshot => {
                const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                return items.filter(k => k.status === 'active');
            });
        }

        function populateKeySelect(keysArray) {
            keySelect.innerHTML = '';
            if (keysArray.length === 0) {
                const opt = document.createElement('option');
                opt.value = '';
                opt.textContent = 'No active keys';
                keySelect.appendChild(opt);
                return;
            }
            keysArray.forEach(k => {
                const opt = document.createElement('option');
                opt.value = k.key;
                opt.textContent = `${k.name} (${k.key.slice(0,8)}...)`;
                keySelect.appendChild(opt);
            });
            keySelect.value = keysArray[0]?.key || '';
            selectedKey = keySelect.value;
        }

        function getConfig() {
            return {
                apiKey: keySelect.value,
                botName: botName.value.trim() || 'Nexus AI',
                greeting: greeting.value.trim() || '👋 Hello! How can I assist you?',
                theme: themeSelect.value,
                model: modelSelect.value,
                systemPrompt: systemPrompt.value.trim()
            };
        }

        function generateScript(config) {
            const lines = [];
            lines.push(`<script>`);
            lines.push(`  window.NexusConfig = {`);
            lines.push(`    apiKey: '${config.apiKey}',`);
            lines.push(`    model: '${config.model}',`);
            lines.push(`    botName: '${config.botName.replace(/'/g, "\\'")}',`);
            lines.push(`    greeting: '${config.greeting.replace(/'/g, "\\'")}',`);
            lines.push(`    theme: '${config.theme}'${config.systemPrompt ? ',' : ''}`);
            if (config.systemPrompt) {
                lines.push(`    systemPrompt: '${config.systemPrompt.replace(/'/g, "\\'")}'`);
            }
            lines.push(`  };`);
            lines.push(`<\/script>`);
            lines.push(`<script defer src="${WIDGET_CDN}"><\/script>`);
            return lines.join('\n');
        }

        function updatePreview(config) {
            const oldFrame = previewContainer.querySelector('.preview-frame.active');
            
            if (!config.apiKey) {
                if (oldFrame) {
                    oldFrame.srcdoc = '<html><body style="background:#0c0c0e;color:#71717a;display:flex;align-items:center;justify-content:center;font-family:system-ui;font-size:14px;font-weight:600;margin:0;height:100vh;overflow:hidden;">Select an API key to initialize preview</body></html>';
                }
                scriptContent.textContent = '';
                return;
            }
            
            scriptContent.textContent = generateScript(config);
            if (window.Prism) {
                Prism.highlightElement(scriptContent);
            }

            const isDark = config.theme === 'light' ? false : true;
            
            const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { 
      margin: 0; 
      height: 100vh; 
      background: ${isDark ? '#0c0c0e' : '#f4f4f5'}; 
      font-family: system-ui, -apple-system, sans-serif;
      overflow: hidden; 
      box-sizing: border-box;
  }
  .dummy-website {
      padding: 40px 60px;
      max-width: 900px;
      margin: 0;
      opacity: ${isDark ? '0.05' : '0.1'};
      pointer-events: none;
      color: ${isDark ? '#ffffff' : '#000000'};
  }
  .skeleton-box { background: currentColor; border-radius: 8px; margin-bottom: 20px; }
</style>
</head>
<body>

<div class="dummy-website">
    <div class="skeleton-box" style="height: 40px; width: 35%; margin-bottom: 40px;"></div>
    <div class="skeleton-box" style="height: 16px; width: 100%;"></div>
    <div class="skeleton-box" style="height: 16px; width: 85%;"></div>
    <div class="skeleton-box" style="height: 16px; width: 92%; margin-bottom: 50px;"></div>
    <div class="skeleton-box" style="height: 180px; width: 100%; border-radius: 16px;"></div>
</div>

<script>
window.NexusConfig = {
  apiKey: '${config.apiKey}',
  model: '${config.model}',
  botName: '${config.botName.replace(/'/g, "\\'")}',
  greeting: '${config.greeting.replace(/'/g, "\\'")}',
  theme: '${config.theme}',
  ${config.systemPrompt ? `systemPrompt: '${config.systemPrompt.replace(/'/g, "\\'")}',` : ''}
};
<\/script>
<script defer src="${WIDGET_CDN}"><\/script>
</body>
</html>`;

            previewLoader.style.opacity = '1';
            
            const newFrame = document.createElement('iframe');
            newFrame.className = 'preview-frame';
            newFrame.sandbox = 'allow-scripts allow-modals allow-same-origin';
            
            newFrame.onload = () => {
                newFrame.classList.add('active');
                previewLoader.style.opacity = '0';
                
                if (oldFrame && oldFrame !== newFrame) {
                    oldFrame.classList.remove('active');
                    setTimeout(() => {
                        if (oldFrame.parentNode) {
                            oldFrame.parentNode.removeChild(oldFrame);
                        }
                    }, 400);
                }
            };

            newFrame.srcdoc = html;
            previewContainer.appendChild(newFrame);
        }

        function debounce(fn, ms = 300) {
            let timer;
            return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
        }

        const debouncedUpdate = debounce(() => {
            const config = getConfig();
            updatePreview(config);
        }, 300);

        function initListeners() {
            [botName, greeting, themeSelect, modelSelect, systemPrompt].forEach(el => {
                el.addEventListener('input', debouncedUpdate);
                el.addEventListener('change', debouncedUpdate);
            });
            keySelect.addEventListener('change', () => {
                selectedKey = keySelect.value;
                debouncedUpdate();
            });
            copyScriptBtn.addEventListener('click', () => {
                const text = scriptContent.textContent;
                navigator.clipboard.writeText(text).then(() => {
                    copyScriptBtn.innerHTML = '<i class="ph-bold ph-check"></i> Copied!';
                    copyScriptBtn.classList.add('copied');
                    setTimeout(() => {
                        copyScriptBtn.innerHTML = '<i class="ph-bold ph-copy"></i> Copy';
                        copyScriptBtn.classList.remove('copied');
                    }, 2000);
                }).catch(() => {});
            });
        }

        function initAuth() {
            onAuthStateChanged(auth, async (user) => {
                if (!user) {
                    window.location.href = '/login';
                    return;
                }
                currentUser = user;
                updateSidebar(user);
                try {
                    const activeKeys = await loadKeys(user);
                    keys = activeKeys;
                    populateKeySelect(keys);
                    if (keys.length > 0) {
                        keySelect.value = keys[0].key;
                        selectedKey = keys[0].key;
                    }
                    debouncedUpdate();
                } catch (e) {
                }
                loadingOverlay.style.display = 'none';
            });
        }

        sidebarSignOut.addEventListener('click', () => signOut(auth));
        mobileMenuBtn.addEventListener('click', () => sidebar.classList.toggle('hidden'));
        closeMobileMenuBtn.addEventListener('click', () => sidebar.classList.add('hidden'));

        initListeners();
        initAuth();