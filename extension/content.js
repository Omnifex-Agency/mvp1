
// content.js
// Listens for messages from popup or background to get selection OR show feedback

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 1. Get Selection Request
    if (request.action === "getSelection") {
        const selection = window.getSelection().toString().trim();
        const title = document.title;
        const url = window.location.href;

        sendResponse({
            selection: selection || "",
            title: title,
            url: url
        });
    }

    // 2. Show Toast Request
    if (request.action === "showToast") {
        showToast(request.message, request.status);
    }
});


// Injectable Toast UI (Shadow DOM to prevent CSS leaks)
function showToast(message, status) {
    const existing = document.getElementById('highlight-agent-toast-host');
    if (existing) existing.remove();

    const host = document.createElement('div');
    host.id = 'highlight-agent-toast-host';
    host.style.all = 'initial'; // Reset styles
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });

    // Premium CSS
    const style = document.createElement('style');
    style.textContent = `
        .toast {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #09090b;
            border: 1px solid #27272a;
            color: #f4f4f5;
            padding: 12px 20px;
            border-radius: 12px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
            z-index: 2147483647; /* Max Z-Index */
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .toast.visible {
            opacity: 1;
            transform: translateY(0);
        }

        .icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            border-radius: 50%;
        }

        .success .icon {
            background: rgba(16, 185, 129, 0.1);
            color: #34d399;
        }

        .error .icon {
            background: rgba(239, 68, 68, 0.1);
            color: #f87171;
        }
    `;

    // SVG Icons
    const checkIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    const errorIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

    const iconHtml = status === 'success' ? checkIcon : errorIcon;
    const toastClass = status === 'success' ? 'toast success' : 'toast error';

    const toast = document.createElement('div');
    toast.className = toastClass;
    toast.innerHTML = `
        <div class="icon">${iconHtml}</div>
        <span>${message}</span>
    `;

    shadow.appendChild(style);
    shadow.appendChild(toast);

    // Animate In
    setTimeout(() => toast.classList.add('visible'), 10);

    // Animate Out
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => host.remove(), 400);
    }, 4000);
}
