
// popup.js with Supabase (REST API Mode)
// Removed unused import

// We bundle Supabase via CDN import or bundled file for MVP. 
// Since MV3 doesn't support remote code easily, the correct way is to bundle supabase.js 
// OR simpler: Use raw fetch since Supabase API is just REST. 
// For "Principal Architect" level, we use raw fetch to avoid bundling issues without Webpack.

// Local Backend URL
const BACKEND_URL = "http://localhost:8080";

document.addEventListener('DOMContentLoaded', async () => {
    // If opened as a window, ensure size (sometimes chrome.windows.create is buggy on size)
    if (window.innerHeight < 680) {
        window.resizeTo(400, 680);
    }

    const storage = await chrome.storage.local.get(['email', 'draftSelection', 'draftTitle', 'draftUrl']);

    if (!storage.email) {
        // Auto-login as anonymous for now (User Request)
        chrome.storage.local.set({ email: 'anonymous@omnifex.com' });
        showView('main-view');
        checkAI();
    } else {
        showView('main-view');
        showView('main-view');
        // Prefill
        if (storage.draftSelection) {
            document.getElementById('content').value = storage.draftSelection;
            document.getElementById('title').value = storage.draftTitle || "";
            window.currentUrl = storage.draftUrl;
            chrome.action.setBadgeText({ text: "" });
            await chrome.storage.local.remove(['draftSelection', 'draftTitle', 'draftUrl']);
        } else {
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab?.id) {
                    try {
                        const response = await chrome.tabs.sendMessage(tab.id, { action: "getSelection" });
                        if (response) {
                            document.getElementById('content').value = response.selection;
                            document.getElementById('title').value = response.title;
                            window.currentUrl = response.url;
                        }
                    } catch (e) {
                        console.log("No content script response", e);
                    }
                }
            } catch (e) {
                console.log("Tab query error", e);
            }
        }
    }

    // Setup
    document.getElementById('save-setup').addEventListener('click', () => {
        const email = document.getElementById('user-email').value;
        if (email) {
            chrome.storage.local.set({ email }, () => showView('main-view'));
        }
    });

    document.getElementById('save-btn').addEventListener('click', saveAlert);


    // Date Logic
    document.querySelectorAll('.chip').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.chip').forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
            document.getElementById('custom-date').value = "";
            window.selectedOffset = parseInt(e.target.dataset.days);
        });
    });

    document.getElementById('custom-date').addEventListener('change', () => {
        document.querySelectorAll('.chip').forEach(b => b.classList.remove('selected'));
        window.selectedOffset = null;
    });

    // AI Listeners Removed
});



function showView(id) {
    document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}


async function saveAlert() {
    const statusEl = document.getElementById('status');

    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;

    // Validation 1: No Selection
    if (!content || !content.trim()) {
        statusEl.textContent = "Error: Please select text first.";
        statusEl.style.color = "red";
        return;
    }

    statusEl.textContent = "Saving...";

    const storage = await chrome.storage.local.get(['email']);
    const format = document.querySelector('input[name="format"]:checked').value;

    // Date Calc
    let reminderDate;
    if (window.selectedOffset) {
        const d = new Date();
        d.setDate(d.getDate() + window.selectedOffset);
        reminderDate = d.toISOString().split('T')[0];
    } else {
        const custom = document.getElementById('custom-date').value;
        if (custom) {
            // Validation 2: Past Date
            if (new Date(custom) < new Date().setHours(0, 0, 0, 0)) {
                statusEl.textContent = "Error: Date cannot be in the past.";
                statusEl.style.color = "red";
                return;
            }
            reminderDate = custom;
        }
    }

    if (!reminderDate) {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        reminderDate = d.toISOString().split('T')[0];
    }

    // HIDE immediately functionality: Send to background and close
    const payload = {
        email: storage.email || "anonymous@omnifex.com",
        title: title || "Untitled Snippet",
        content,
        sourceUrl: window.currentUrl || "",
        format, // 'full', 'summary', 'quiz'
        reminderDate,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    // Offload to background so we can close immediately
    chrome.runtime.sendMessage({ action: 'save_alert', data: payload });
    window.close();
}
