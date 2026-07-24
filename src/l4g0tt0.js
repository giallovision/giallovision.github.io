// ==========================================
// L4G0TT0 SYNTHETIC OPS WIDGET
// Automatically injects HTML, CSS, Logic, and Memory
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    
    const WORKER_URL = "https://gvis-l4g0.joseph-giallombardo.workers.dev/";

    // 1. INJECT THE CSS STYLES
    const style = document.createElement('style');
    style.innerHTML = `
        #ai-toggle-btn {
            position: fixed; bottom: 25px; right: 25px; z-index: 9999;
            background: rgba(9, 14, 19, 0.8); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 4px; padding: 12px 20px;
            color: #00b4d8; font-family: monospace; font-size: 0.9rem; font-weight: bold;
            cursor: pointer; transition: all 0.3s; box-shadow: 0 10px 30px rgba(0,0,0,0.8);
        }
        #ai-toggle-btn:hover { background: #00b4d8; color: #000; box-shadow: 0 0 15px rgba(0, 180, 216, 0.4); }

        #gvis-chat-container {
            position: fixed; bottom: 80px; right: 25px; width: 350px; height: 500px; z-index: 9999;
            background: rgba(9, 14, 19, 0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.9), inset 0 0 20px rgba(33, 54, 77, 0.5);
            display: none; flex-direction: column; overflow: hidden; font-family: 'Roboto', sans-serif;
            transform: translateY(20px); opacity: 0; 
            transition: width 0.35s cubic-bezier(0.19, 1, 0.22, 1), 
                        height 0.35s cubic-bezier(0.19, 1, 0.22, 1), 
                        transform 0.3s ease, 
                        opacity 0.3s ease;
        }
        #gvis-chat-container.is-open { display: flex; transform: translateY(0); opacity: 1; }
        #gvis-chat-container.expanded {
            width: 50vw !important; height: 75vh !important; bottom: 25px !important; right: 25px !important;
            box-shadow: 0 0 30px rgba(0, 180, 216, 0.25), 0 30px 80px rgba(0, 0, 0, 0.95);
        }

        .chat-header {
            padding: 12px 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.4);
            white-space: nowrap;
        }
        .chat-header-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
        .chat-title { font-family: monospace; font-weight: bold; color: #ffb703; font-size: 0.78rem; letter-spacing: 0.5px; }
        
        .chat-action-btn { 
            background: none; border: none; color: #64748b; font-family: monospace; 
            font-size: 0.75rem; cursor: pointer; transition: 0.2s; padding: 2px 4px;
        }
        .chat-action-btn:hover { color: #00b4d8; }
        #transmit-sow-btn { color: #00b4d8; font-weight: bold; }
        #transmit-sow-btn:hover { color: #ffb703; }

        .chat-messages { flex-grow: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; }
        .msg { padding: 12px 16px; border-radius: 6px; font-size: 0.9rem; line-height: 1.5; max-width: 85%; }
        
        .msg-ai { background: rgba(255, 255, 255, 0.03); border-left: 2px solid #ffb703; color: #f8fafc; align-self: flex-start; border-radius: 0 6px 6px 0; }
        .msg-user { background: rgba(0, 180, 216, 0.1); border-right: 2px solid #00b4d8; color: #00b4d8; align-self: flex-end; border-radius: 6px 0 0 6px; text-align: right; }
        .msg-system { background: rgba(33, 54, 77, 0.5); border-left: 2px solid #00b4d8; color: #f8fafc; align-self: center; text-align: center; font-size: 0.8rem; width: 90%; }

        .chat-input-area { padding: 15px; border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; gap: 10px; background: rgba(0,0,0,0.3); }
        .chat-input-area input {
            flex-grow: 1; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);
            color: #f8fafc; padding: 10px; border-radius: 4px; font-family: 'Roboto', sans-serif; font-size: 0.9rem; transition: 0.3s; outline: none;
        }
        .chat-input-area input:focus { border-color: #00b4d8; background: rgba(0, 180, 216, 0.05); }

        #send-btn { background: #21364d83; border: 1px solid #00b4d8; color: #00b4d8; font-weight: bold; border-radius: 4px; padding: 0 15px; cursor: pointer; transition: 0.3s; }
        #send-btn:hover { background: #00b4d8; color: #000; box-shadow: 0 0 15px rgba(0, 180, 216, 0.4); }
        .typing { font-family: monospace; color: #64748b; font-size: 0.8rem; border-left: 2px solid #64748b; }

        @media (max-width: 768px) {
            #gvis-chat-container { width: calc(100% - 40px); right: 20px; bottom: 80px; height: 60vh; }
            #gvis-chat-container.expanded { width: calc(100% - 40px) !important; height: 85vh !important; right: 20px !important; bottom: 20px !important; }
        }
    `;
    document.head.appendChild(style);

    // 2. INJECT THE HTML STRUCTURE
    const widgetHTML = `
        <button id="ai-toggle-btn">[ INIT // L4G0TT0 ]</button>
        <div id="gvis-chat-container">
            <div class="chat-header">
                <span class="chat-title">L4G0TT0 // OPS</span>
                <div class="chat-header-actions">
                    <button class="chat-action-btn" id="transmit-sow-btn" title="Send chat to Engineering">[ ⇪ SUBMIT CHAT ]</button>
                    <button class="chat-action-btn" id="expand-ai-btn" title="Expand">[ ⤢ ]</button>
                    <button class="chat-action-btn" id="close-ai-btn" title="Close">[X]</button>
                </div>
            </div>
            <div class="chat-messages" id="chat-messages"></div>
            
            <!-- Standard Chat Input -->
            <div class="chat-input-area" id="standard-input-area">
                <input type="text" id="chat-input" placeholder="Query parameters..." autocomplete="off" />
                <button id="send-btn">></button>
            </div>

            <!-- Email Capture Input (Hidden by default) -->
            <div class="chat-input-area" id="email-capture-area" style="display:none; background: rgba(0, 180, 216, 0.1); border-top: 1px solid #00b4d8;">
                <input type="email" id="sow-email-input" placeholder="Enter your email to dispatch..." required />
                <button id="send-sow-btn" style="color: #ffb703; border-color: #ffb703;">SEND</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', widgetHTML);

    // 3. LOGIC & EVENT LISTENERS
    const chatContainer = document.getElementById('gvis-chat-container');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const toggleBtn = document.getElementById('ai-toggle-btn');
    const sowEmailInput = document.getElementById('sow-email-input');
    
    // UI Panels
    const standardInputArea = document.getElementById('standard-input-area');
    const emailCaptureArea = document.getElementById('email-capture-area');

    // === MEMORY SYSTEM (sessionStorage) ===
    function saveChat() {
        sessionStorage.setItem('l4g0_memory', chatMessages.innerHTML);
    }
    
    function loadChat() {
        const saved = sessionStorage.getItem('l4g0_memory');
        if (saved) {
            chatMessages.innerHTML = saved;
        } else {
            appendMessage("Signal established. I am L4G0TT0. Let's design some infrastructure. How can I assist?", 'msg-ai', null, false);
        }
    }
    
    function appendMessage(text, className, id = null, save = true) {
        const div = document.createElement('div');
        div.className = 'msg ' + className;
        div.innerText = text;
        if (id) div.id = id;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        if (save) saveChat();
    }

    // Initialize Memory
    loadChat();

    // === TOGGLES ===
    toggleBtn.addEventListener('click', () => {
        if (chatContainer.classList.contains('is-open')) {
            chatContainer.classList.remove('is-open');
            setTimeout(() => chatContainer.style.display = 'none', 300); 
        } else {
            chatContainer.style.display = 'flex';
            setTimeout(() => chatContainer.classList.add('is-open'), 10); 
            chatInput.focus();
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    });

    document.getElementById('close-ai-btn').addEventListener('click', () => toggleBtn.click());
    
    document.getElementById('expand-ai-btn').addEventListener('click', () => {
        const isExp = chatContainer.classList.toggle('expanded');
        document.getElementById('expand-ai-btn').innerText = isExp ? '[ ⤡ ]' : '[ ⤢ ]';
        setTimeout(() => chatMessages.scrollTop = chatMessages.scrollHeight, 350);
    });

    // === AI CHAT LOGIC ===
    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        appendMessage(text, 'msg-user');
        chatInput.value = '';
        const typingId = 'typing-' + Date.now();
        appendMessage('> Thinking...', 'msg-ai typing', typingId, false);

        try {
            const response = await fetch(WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            const data = await response.json();
            document.getElementById(typingId)?.remove();
            
            if (data.reply) appendMessage(data.reply, 'msg-ai');
            else if (data.error) appendMessage(`[ERR] ${data.error}`, 'msg-ai');
        } catch (err) {
            document.getElementById(typingId)?.remove();
            appendMessage("ERR: Connection to core server failed.", 'msg-ai');
        }
    }

    document.getElementById('send-btn').addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });

    // === SOW TRANSMIT LOGIC ===
    document.getElementById('transmit-sow-btn').addEventListener('click', () => {
        // Swap inputs
        standardInputArea.style.display = 'none';
        emailCaptureArea.style.display = 'flex';
        appendMessage("[SYSTEM] Ready to transmit scope to engineering. Please enter your email address below to lock in the transcript.", 'msg-system');
        sowEmailInput.focus();
    });

    async function submitTranscript() {
        const email = sowEmailInput.value.trim();
        if (!email || !email.includes('@')) return alert("Invalid signal origin. Provide a valid email.");

        // Scrape current chat for the payload
        let transcript = "";
        document.querySelectorAll('.msg').forEach(msg => {
            if (msg.classList.contains('typing') || msg.classList.contains('msg-system')) return;
            const role = msg.classList.contains('msg-user') ? 'USER' : 'L4G0TT0';
            transcript += `${role}:\n${msg.innerText}\n\n`;
        });

        // Use the existing Contact API Endpoint
        const payload = {
            name: "L4G0TT0 Chat Session",
            email: email,
            scope: "L4G0TT0 Chat Transcript",
            details: "TRANSCRIPT LOG:\n\n" + transcript,
            urgency: "3"
        };

        document.getElementById('send-sow-btn').innerText = "...";

        try {
            // Note: Update to '/api/contact' if routing through your worker, or use absolute URL
            await fetch('/api/contact', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            
            appendMessage("[SYSTEM] Transcript successfully dispatched to Joseph. Awaiting further directives.", 'msg-system');
            
            // Revert UI
            emailCaptureArea.style.display = 'none';
            standardInputArea.style.display = 'flex';
            sowEmailInput.value = "";
            document.getElementById('send-sow-btn').innerText = "SEND";
            
        } catch (err) {
            alert("[ERR] Transmission failed.");
            document.getElementById('send-sow-btn').innerText = "SEND";
        }
    }

    document.getElementById('send-sow-btn').addEventListener('click', submitTranscript);
    sowEmailInput.addEventListener('keypress', e => { if (e.key === 'Enter') submitTranscript(); });
});