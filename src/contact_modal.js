/**
 * Giallovision Core - Self-Contained Contact Modal Component
 */
(function () {
    // 1. Scoped CSS Injection (Guarantees legibility across all pages)
    const modalStyles = `
        .modal-overlay {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
            display: none; align-items: center; justify-content: center; z-index: 9999;
        }
        .modal-overlay.active { display: flex !important; }
        .modal-content {
            position: relative; width: 90%; max-width: 550px;
            background: #090e13; border: 1px solid rgba(0, 180, 216, 0.3);
            border-radius: 8px; padding: 35px 30px; box-sizing: border-box;
            box-shadow: 0 20px 50px rgba(0,0,0,0.9), inset 0 0 20px rgba(0, 180, 216, 0.05);
            color: #f8fafc; font-family: 'Roboto', sans-serif;
        }
        .close-modal {
            position: absolute; top: 15px; right: 20px; background: none; border: none;
            color: #64748b; font-family: monospace; font-size: 14px; cursor: pointer; transition: color 0.2s;
        }
        .close-modal:hover { color: #ffb703; }
        .modal-content h2 { color: #00b4d8; font-size: 1.8rem; margin: 0 0 10px 0; font-weight: 700; letter-spacing: 1px; }
        .modal-content p { color: #64748b; font-size: 0.95rem; margin-bottom: 25px; line-height: 1.4; }
        
        .input-row { display: flex; gap: 15px; margin-bottom: 15px; }
        .input-row input { flex: 1; }
        
        .modal-content input[type="text"], 
        .modal-content input[type="email"], 
        .modal-content select, 
        .modal-content textarea {
            width: 100%; padding: 12px; margin-bottom: 15px;
            background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.12);
            color: #f8fafc; border-radius: 4px; font-family: 'Roboto', sans-serif;
            font-size: 0.95rem; box-sizing: border-box; transition: border-color 0.3s;
        }
        
        /* FIX: High contrast option dropdowns for all browsers */
        .modal-content select option {
            background-color: #090e13 !important;
            color: #00f0ff !important;
        }
        .modal-content select option[disabled] {
            color: #64748b !important;
        }
        
        .modal-content input:focus, .modal-content select:focus, .modal-content textarea:focus {
            outline: none; border-color: #00b4d8; background: rgba(0, 180, 216, 0.08);
        }
        
        .timeline-wrapper { margin-bottom: 25px; text-align: left; }
        .timeline-wrapper label { display: block; font-size: 0.85rem; color: #64748b; margin-bottom: 10px; }
        .radio-group { display: flex; gap: 10px; justify-content: space-between; }
        .radio-group input[type="radio"] { display: none; }
        .radio-group label {
            flex: 1; text-align: center; padding: 10px; background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.12); border-radius: 4px; cursor: pointer; transition: all 0.2s;
            color: #f8fafc; font-size: 0.9rem;
        }
        .radio-group input[type="radio"]:checked + label {
            background: #00b4d8; color: #000; font-weight: bold; border-color: #00b4d8;
            box-shadow: 0 0 15px rgba(0, 180, 216, 0.4);
        }
        
        .transmit-btn {
            width: 100%; padding: 15px; background: rgba(0, 180, 216, 0.12); border: 1px solid #00b4d8;
            color: #00b4d8; font-family: monospace; font-size: 1rem; font-weight: bold;
            border-radius: 4px; cursor: pointer; transition: all 0.3s;
        }
        .transmit-btn:hover { background: #00b4d8; color: #000; box-shadow: 0 0 20px rgba(0, 180, 216, 0.4); }
        
        @media (max-width: 768px) {
            .modal-content { width: 95%; padding: 25px 20px; }
            .input-row { flex-direction: column; gap: 0; }
        }
    `;

    // 2. Component Markup
    const modalHTML = `
    <div id="contactModal" class="modal-overlay">
        <div class="modal-content">
            <button class="close-modal" id="closeContactModalBtn">[X] CLOSE</button>
            
            <h2>INITIATE SIGNAL</h2>
            <p>Connecting your technical requirements to high-performance architecture.</p>

            <form id="contact-ui">
                <div class="input-row">
                    <input type="text" name="name" placeholder="Full Name" required>
                    <input type="email" name="email" placeholder="Email Address" required>
                </div>

                <select name="scope" required>
                    <option value="" disabled selected>Select Project Scope...</option>
                    <option value="Technical Systems & Media Pipelines">Technical Systems & Media Pipelines</option>
                    <option value="Nodal Workflow Design & AI Frameworks">Nodal Workflow Design & AI Frameworks</option>
                    <option value="Live Media Operations & System Engineering">Live Media Operations & System Engineering</option>
                    <option value="Ansible Automation & Docker Infrastructure">Ansible Automation & Docker Infrastructure</option>
                    <option value="CAD Pre-Vis & Code Execution">CAD Pre-Vis & Code Execution</option>
                </select>

                <textarea name="details" placeholder="Project Details" rows="4" required></textarea>

                <div class="timeline-wrapper">
                    <label>Timeline / Urgency Level (1 = Flexible, 5 = Immediate)</label>
                    <div class="radio-group">
                        <input type="radio" id="modal_t1" name="urgency" value="1" required><label for="modal_t1">1</label>
                        <input type="radio" id="modal_t2" name="urgency" value="2"><label for="modal_t2">2</label>
                        <input type="radio" id="modal_t3" name="urgency" value="3"><label for="modal_t3">3</label>
                        <input type="radio" id="modal_t4" name="urgency" value="4"><label for="modal_t4">4</label>
                        <input type="radio" id="modal_t5" name="urgency" value="5"><label for="modal_t5">5</label>
                    </div>
                </div>

                <button type="submit" class="transmit-btn">> TRANSMIT INQUIRY</button>
            </form>

            <div id="success-ui" style="display:none; text-align:center; padding: 40px 0;">
                <h3 style="color: #00b4d8;">[ SIGNAL RECEIVED ]</h3>
                <p style="color: #64748b;">Your inquiry has been successfully routed to the core server.</p>
            </div>
        </div>
    </div>
    `;

    // 3. Mount Component and Attach Event Listeners
    function initContactModal() {
        if (document.getElementById('contactModal')) return;

        // Inject Styles
        const styleEl = document.createElement('style');
        styleEl.innerHTML = modalStyles;
        document.head.appendChild(styleEl);

        // Inject Markup
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.getElementById('contactModal');
        const closeBtn = document.getElementById('closeContactModalBtn');
        const form = document.getElementById('contact-ui');

        // Toggle Helpers
        window.openContactModal = function() { modal.classList.add('active'); };
        window.closeContactModal = function() { modal.classList.remove('active'); };

        closeBtn.addEventListener('click', window.closeContactModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) window.closeContactModal();
        });

        // Event Delegation: Open modal on any element with data-modal="contact" or href="#contact" or class "contact-trigger"
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('[data-modal="contact"], a[href="#contact"], .contact-trigger, #contactNavBtn');
            if (trigger) {
                e.preventDefault();
                window.openContactModal();
            }
        });

        // Submit Handler
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('.transmit-btn');
            btn.innerText = "> TRANSMITTING...";

            const payload = {
                name: form.querySelector('[name="name"]').value,
                email: form.querySelector('[name="email"]').value,
                scope: form.querySelector('[name="scope"]').value,
                details: form.querySelector('[name="details"]').value,
                urgency: form.querySelector('[name="urgency"]:checked')?.value || "1"
            };

            const WORKER_URL = "https://gvis-l4g0.joseph-giallombardo.workers.dev/api/contact";

            try {
                const response = await fetch(WORKER_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    form.style.display = 'none';
                    document.getElementById('success-ui').style.display = 'block';
                } else {
                    alert("[ERR] Transmission failed.");
                    btn.innerText = "> TRANSMIT INQUIRY";
                }
            } catch (err) {
                alert("[ERR] Network anomaly detected.");
                btn.innerText = "> TRANSMIT INQUIRY";
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initContactModal);
    } else {
        initContactModal();
    }
})();