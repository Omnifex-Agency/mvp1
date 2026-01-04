
// popup.js with Supabase (REST API Mode)
// Removed unused import

// We bundle Supabase via CDN import or bundled file for MVP. 
// Since MV3 doesn't support remote code easily, the correct way is to bundle supabase.js 
// OR simpler: Use raw fetch since Supabase API is just REST. 
// For "Principal Architect" level, we use raw fetch to avoid bundling issues without Webpack.

const SUPABASE_URL = "https://ztwcpkaunjtaftvdirqd.supabase.co";
const SUPABASE_KEY = "sb_publishable_ku_dam8A40EUXl5ss8SQww_EX_MCmWB";

document.addEventListener('DOMContentLoaded', async () => {
    // If opened as a window, ensure size (sometimes chrome.windows.create is buggy on size)
    if (window.innerHeight < 600) {
        window.resizeTo(360, 650);
    }

    const storage = await chrome.storage.local.get(['email', 'draftSelection', 'draftTitle', 'draftUrl']);

    if (!storage.email) {
        // Auto-login as anonymous for now (User Request)
        chrome.storage.local.set({ email: 'anonymous@omnifex.com' });
        showView('main-view');
        checkAI();
    } else {
        showView('main-view');
        checkAI();
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

    // AI Listeners
    document.getElementById('ai-summary-btn').addEventListener('click', () => runAITask('summary'));
    document.getElementById('ai-quiz-btn').addEventListener('click', () => runAITask('quiz'));
});

async function checkAI() {
    try {
        if (!window.ai) return;

        // Check capabilities
        const canSummarize = await window.ai.canCreateTextSession();
        if (canSummarize === 'readily') {
            document.getElementById('ai-tools').classList.remove('hidden');
        }
    } catch (e) {
        console.log("AI check failed", e);
    }
}

// Always show AI tools
document.getElementById('ai-tools').classList.remove('hidden');

async function runAITask(type) {
    const contentEl = document.getElementById('content');
    const longText = contentEl.value;

    const btnId = type === 'summary' ? 'ai-summary-btn' : 'ai-quiz-btn';
    const btn = document.getElementById(btnId);

    if (!longText || longText.length < 10) {
        alert("Text too short for AI!");
        return;
    }

    const originalText = btn.innerHTML;
    btn.textContent = "Processing...";
    btn.disabled = true;

    try {
        const response = await chrome.runtime.sendMessage({
            action: 'trigger_ai_processing',
            data: {
                text: longText,
                type: type
            }
        });

        if (response && response.success) {
            // New Architecture: Receive Text, Don't Save Yet
            // The result is in response.data.result (for single ops)
            // or response.data.summary/quiz (for compound, but popup only asks for single)

            const resultText = response.data.result;
            contentEl.value = resultText;

            // Auto-select radio
            const radioParams = type === 'summary' ? 'summary' : 'quiz';
            const radio = document.querySelector(`input[name="format"][value="${radioParams}"]`);
            if (radio) radio.checked = true;

        } else {
            contentEl.value = longText + "\n\n[Error: " + (response?.error || 'Unknown') + "]";
        }

    } catch (e) {
        console.error("AI Error:", e);
        contentEl.value = longText + "\n\n[Communication Failed: " + e.message + "]";
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

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

    const payload = {
        user_email: storage.email || "anonymous@omnifex.com",
        title: title || "Untitled Snippet",
        content,
        source_url: window.currentUrl || "",
        format,
        reminder_date: reminderDate,
        status: 'scheduled',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/alerts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            statusEl.textContent = "Saved! Closing...";
            statusEl.style.color = "green";

            setTimeout(() => {
                // If opened via context menu (chrome.windows.create), this closes the window
                window.close();
            }, 1000);
        } else {
            const txt = await res.text();
            try {
                const err = JSON.parse(txt);
                statusEl.textContent = "Error: " + (err.message || err.hint || "Failed");
            } catch (e) {
                statusEl.textContent = "Error: " + txt.substring(0, 50);
            }
            statusEl.style.color = "red";
        }

    } catch (e) {
        statusEl.textContent = "Network Error: Check internet connection.";
        statusEl.style.color = "red";
        console.error(e);
    }
}
