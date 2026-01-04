// background.js - Central Hub
const SUPABASE_URL = "https://ztwcpkaunjtaftvdirqd.supabase.co";
const SUPABASE_KEY = "sb_publishable_ku_dam8A40EUXl5ss8SQww_EX_MCmWB";



async function saveToSupabase(email, title, content, url, format) {
    const payload = {
        user_email: email || 'anonymous@omnifex.com',
        title: `AI ${format === 'summary' ? 'Summary' : 'Quiz'}: ${title || 'Snippet'}`,
        content,
        source_url: url,
        format,
        reminder_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        status: 'scheduled',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    await fetch(`${SUPABASE_URL}/rest/v1/alerts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
    });
}

function notify(tabId, badge, message, status) {
    chrome.action.setBadgeText({ text: badge });
    if (status === 'success') chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
    if (status === 'error') chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
    if (status === 'info') chrome.action.setBadgeBackgroundColor({ color: "#7c3aed" });

    // Toast via content script
    if (tabId) {
        chrome.tabs.sendMessage(tabId, {
            action: "showToast",
            status: status === 'info' ? 'success' : status, // map info to success color for toast
            message: message
        }).catch(() => { });
    }

    if (status !== 'info') {
        setTimeout(() => {
            chrome.action.setBadgeText({ text: "" });
            chrome.action.setBadgeBackgroundColor({ color: "#000000" });
        }, 3000);
    }
}

// Helper to create offscreen doc
let creating;
async function setupOffscreenDocument(path) {
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [chrome.runtime.getURL(path)]
    });
    if (existingContexts.length > 0) return;
    if (creating) await creating;
    else {
        creating = chrome.offscreen.createDocument({
            url: path,
            reasons: ['WORKERS'],
            justification: 'Run AI processing'
        });
        await creating;
        creating = null;
    }
}

// PROXY LISTENER: Handle AI requests from Popup
// The Popup calls 'trigger_ai_processing' -> Background setupOffscreen -> Background calls 'process_ai' -> Offscreen responds
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'trigger_ai_processing') {
        // Return true for async response
        (async () => {
            try {
                await setupOffscreenDocument("offscreen.html");
                const response = await chrome.runtime.sendMessage({
                    action: 'process_ai',
                    data: msg.data
                });
                sendResponse(response);
            } catch (e) {
                sendResponse({ success: false, error: e.message });
            }
        })();
        return true;
    }

    if (msg.action === 'save_alert') {
        // Fire and forget from Popup perspective, but we handle it here
        handleSaveAlert(msg.data).then(res => {
            if (res.success) {
                // If we knew the tabId, we could notify. But Popup usually closes.
                // We can't easily notify the "active tab" reliably after popup close without passing tabId.
                // But for now, just logging.
                console.log("Saved alert via background");
            }
        });
        // We don't necessarily need to sendResponse if popup closes immediately
        sendResponse({ status: "processing" });
        return false;
    }
});

const BACKEND_URL = "http://localhost:8080";

async function handleSaveAlert(data) {
    try {
        const res = await fetch(`${BACKEND_URL}/alerts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const txt = await res.text();
            console.error("Backend Error:", txt);
            return { success: false, error: txt };
        }
        return { success: true };
    } catch (e) {
        console.error("Network Error:", e);
        return { success: false, error: e.message };
    }
}

// Update context menu
chrome.runtime.onInstalled.addListener(async () => {
    // Clear existing to prevent "HighlightAgent" submenu grouping
    await chrome.contextMenus.removeAll();

    chrome.contextMenus.create({
        id: "quick-save-2click",
        title: "Add Reminder: \"%s\"",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "quick-save-2click") {
        // Open Popup Flow (User interpreted "2 click" as "Open the UI")
        await chrome.storage.local.set({
            draftSelection: info.selectionText,
            draftUrl: tab.url,
            draftTitle: tab.title
        });

        chrome.windows.create({
            url: "popup.html",
            type: "popup",
            width: 400,
            height: 680
        });
    }
});
