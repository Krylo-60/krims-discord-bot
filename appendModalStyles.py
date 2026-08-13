extra_css = """

/* ➕ Link Account Button & Modal Styling */
.nav-actions {
    display: flex;
    align-items: center;
    gap: 20px;
}

.btn-link-account {
    background: linear-gradient(135deg, #00f2ff, #0088ff);
    color: #000;
    font-weight: 800;
    font-size: 0.95rem;
    padding: 10px 22px;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    box-shadow: 0 0 15px rgba(0, 242, 255, 0.4);
    transition: all 0.3s ease;
}

.btn-link-account:hover {
    transform: translateY(-2px) scale(1.03);
    box-shadow: 0 0 25px rgba(0, 242, 255, 0.7);
}

/* Modal Overlay */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(4, 7, 13, 0.85);
    backdrop-filter: blur(12px);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 20px;
}

.modal-card {
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid var(--accent-cyan);
    border-radius: var(--radius-lg);
    width: 100%;
    max-width: 480px;
    padding: 32px;
    box-shadow: 0 0 40px rgba(0, 242, 255, 0.25);
    animation: modalPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.modal-large {
    max-width: 750px;
}

@keyframes modalPop {
    from { opacity: 0; transform: scale(0.9) translateY(20px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.modal-header h2 {
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--accent-cyan);
}

.btn-close {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 1.2rem;
    cursor: pointer;
    transition: color 0.2s;
}

.btn-close:hover {
    color: #ff4d4d;
}

.modal-subtitle {
    font-size: 0.88rem;
    color: var(--text-muted);
    line-height: 1.5;
    margin-bottom: 24px;
}

.input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 20px;
}

.input-group label {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-main);
}

.input-group input {
    background: rgba(8, 12, 20, 0.8);
    border: 1px solid rgba(0, 242, 255, 0.2);
    border-radius: var(--radius-md);
    padding: 14px 16px;
    color: #fff;
    font-size: 1rem;
    outline: none;
    transition: border-color 0.3s, box-shadow 0.3s;
}

.input-group input:focus {
    border-color: var(--accent-cyan);
    box-shadow: 0 0 12px rgba(0, 242, 255, 0.3);
}

.modal-alert {
    padding: 12px 16px;
    border-radius: var(--radius-md);
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 20px;
}

.modal-alert.success {
    background: rgba(0, 255, 119, 0.15);
    border: 1px solid var(--accent-green);
    color: var(--accent-green);
}

.modal-alert.error {
    background: rgba(255, 77, 77, 0.15);
    border: 1px solid #ff4d4d;
    color: #ff4d4d;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 10px;
}

.btn-cancel {
    background: rgba(255, 255, 255, 0.08);
    color: var(--text-muted);
    border: none;
    padding: 12px 20px;
    border-radius: var(--radius-md);
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
}

.btn-cancel:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
}

.btn-submit {
    background: linear-gradient(135deg, #00f2ff, #0088ff);
    color: #000;
    border: none;
    padding: 12px 24px;
    border-radius: var(--radius-md);
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 0 15px rgba(0, 242, 255, 0.3);
    transition: all 0.3s ease;
}

.btn-submit:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 25px rgba(0, 242, 255, 0.6);
}
"""

with open(r'C:\Users\naina\.gemini\antigravity\scratch\krylosmp-player-portal\styles.css', 'a', encoding='utf-8') as f:
    f.write(extra_css)

print("SUCCESS: Appended modal styles to styles.css!")
