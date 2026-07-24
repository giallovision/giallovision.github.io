// ==========================================
// L4G0TT0 SYNTHETIC OPS WIDGET
// Automatically injects HTML, CSS, and Logic
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
            /* Added smooth scaling transitions for expand/contract */
            transition: width 0.35s cubic-bezier(0.19, 1, 0.22, 1), 
                        height 0.35s cubic-bezier(0.19, 1, 0.22, 1), 
                        transform 0.3s ease, 
                        opacity 0.3s ease;
        }
        #gvis-chat-container.is-open { display: flex; transform: translateY(0); opacity: 1; }

        /* --- EXPANDED STATE (50% SCREEN SIZE) --- */
        #gvis-chat-container.expanded {
            width: 50vw !important;
            height: 75vh !important;
            bottom: 25px !important;
            right: 25px !important;
            box-shadow: 0 0 30px rgba(0, 180, 216, 0.25), 0 30px 80px rgba(0, 0, 0, 0.95);
        }

        .chat-header {
            padding: 12px 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.4);
            white-space: nowrap;
        }
        .chat-header-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
        .chat-title { 
            font-family: monospace; font-weight: bold; color: #ffb703; 
            font-size: 0.78rem; letter-spacing: 0.5px; overflow: hidden; text-overflow: ellipsis; 
        }

        .chat-action-btn { 
            background: none; border: none; color: #64748b; font-family: monospace; 
            font-size: 0.75rem; cursor: pointer; transition: 0.2s; padding: 2px 4px;
        }
        .chat-action-btn:hover { color: #00b4d8; }

        .chat-messages { flex-grow: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; }
        .msg { padding: 12px 16px; border-radius: 6px; font-size: 0.9rem; line-height: 1.5; max-width: 85%; }
        
        .msg-ai { 
            background: rgba(255, 255, 255, 0.03); border-left: 2px solid #ffb703; 
            color: #f8fafc; align-self: flex-start; border-radius: 0 6px 6px 0; 
        }
        .msg-user { 
            background: rgba(0, 180, 216, 0.1); border-right: 2px solid #00b4d8; 
            color: #00b4d8; align-self: flex-end; border-radius: 6px 0 0 6px; text-align: right; 
        }

        .chat-input-area { padding: 15px; border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; gap: 10px; background: rgba(0,0,0,0.3); }
        
        #chat-input {
            flex-grow: 1; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);
            color: #f8fafc; padding: 10px; border-radius: 4px; font-family: 'Roboto', sans-serif; font-size: 0.9rem; transition: 0.3s; outline: none;
        }
        #chat-input:focus { border-color: #00b4d8; background: rgba(0, 180, 216, 0.05); }

        #send-btn {
            background: #21364d83; border: 1px solid #00b4d8; color: #00b4d8; font-family: monospace; 
            font-weight: bold; border-radius: 4px; padding: 0 15px; cursor: pointer; transition: 0.3s;
        }
        #send-btn:hover { background: #00b4d8; color: #000; box-shadow: 0 0 15px rgba(0, 180, 216, 0.4); }

        .typing { font-family: monospace; color: #64748b; font-size: 0.8rem; border-left: 2px solid #64748b; }
        
        .chat-disclaimer { 
            font-size: 0.7rem; 
            color: #64748b; 
            text-align: center; 
            padding: 5px 15px 10px; 
            background: rgba(0,0,0,0.3); 
        }

        /* Mobile Viewport Responsiveness */
        @media (max-width: 768px) {
            #gvis-chat-container { width: calc(100% - 40px); right: 20px; bottom: 80px; height: 60vh; }
            #gvis-chat-container.expanded { 
                width: calc(100% - 40px) !important; 
                height: 85vh !important; 
                right: 20px !important; 
                bottom: 20px !important; 
            }
        }
    `;
    document.head.appendChild(style);

    // 2. INJECT THE HTML STRUCTURE
    const widgetHTML = `
        <button id="ai-toggle-btn">[ INIT // L4G0TT0 ]</button>
        <div id="gvis-chat-container">
            <div class="chat-header">
                <span class="chat-title">L4G0TT0 // SYNTHETIC OPS</span>
                <div class="chat-header-actions">
                    <button class="chat-action-btn" id="expand-ai-btn" title="Expand/Contract Chat">[ ⤢ EXPAND ]</button>
                    <button class="chat-action-btn" id="close-ai-btn" title="Close Chat">[X]</button>
                </div>
            </div>
            <div class="chat-messages" id="chat-messages">
                <div class="msg msg-ai">Signal established. I am L4G0TT0, Giallovision's containerized intelligence instance. How can I assist you today?</div>
            </div>
            <div class="chat-input-area">
                <input type="text" id="chat-input" placeholder="Query parameters..." autocomplete="off" />
                <button id="send-btn">></button>
            </div>
            
            <div class="chat-disclaimer">
                Your chats aren't used to improve our models. L4G0TT0 is AI and can make mistakes.
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', widgetHTML);

    // 3. WIDGET LOGIC & EVENT LISTENERS
    const chatContainer = document.getElementById('gvis-chat-container');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const toggleBtn = document.getElementById('ai-toggle-btn');
    const closeBtn = document.getElementById('close-ai-btn');
    const expandBtn = document.getElementById('expand-ai-btn');

    function toggleChat() {
        if (chatContainer.classList.contains('is-open')) {
            chatContainer.classList.remove('is-open');
            setTimeout(() => chatContainer.style.display = 'none', 300); 
        } else {
            chatContainer.style.display = 'flex';
            setTimeout(() => chatContainer.classList.add('is-open'), 10); 
            chatInput.focus();
        }
    }

    function toggleExpand() {
        const isExpanded = chatContainer.classList.toggle('expanded');
        expandBtn.innerText = isExpanded ? '[ ⤡ CONTRACT ]' : '[ ⤢ EXPAND ]';
        
        // Recalibrate scroll offset after resize transition completes
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 350);
    }

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        appendMessage(text, 'msg-user');
        chatInput.value = '';

        const typingId = 'typing-' + Date.now();
        appendMessage('> Thinking...', 'msg-ai typing', typingId);

        try {
            const response = await fetch(WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            const data = await response.json();
            const typingEl = document.getElementById(typingId);
            if (typingEl) typingEl.remove();
            
            if (data.reply) {
                appendMessage(data.reply, 'msg-ai');
            } else if (data.error) {
                appendMessage(`[ERR] ${data.error}`, 'msg-ai');
            }
        } catch (err) {
            const typingEl = document.getElementById(typingId);
            if (typingEl) typingEl.remove();
            appendMessage("ERR: Connection to core server failed.", 'msg-ai');
        }
    }

    function appendMessage(text, className, id = null) {
        const div = document.createElement('div');
        div.className = 'msg ' + className;
        div.innerText = text;
        if (id) div.id = id;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    toggleBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);
    expandBtn.addEventListener('click', toggleExpand);
    chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });
    sendBtn.addEventListener('click', sendMessage);
});