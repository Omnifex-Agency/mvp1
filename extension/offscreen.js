// Offscreen AI Worker
// Role: Pure Intelligence (Text In -> Text Out)
// Receives 'process_ai', returns generated text (Real or Mock).

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'process_ai') {
        processText(msg.data)
            .then(res => sendResponse({ success: true, data: res }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }
});

async function processText({ text, type }) {
    // Helper to generate content
    const generate = async (mode) => {
        // 1. Try Real AI (Gemini Nano - The Lightweight Browser Model)
        try {
            // Check for the new standardized API (Chrome 127+) or older window.ai
            const ai = self.ai || window.ai;
            if (ai && ai.createTextSession) {
                const session = await ai.createTextSession();

                // Optimized Lightweight Prompts
                const prompt = mode === 'summary'
                    ? `Summarize this text in 3 short bullet points. Be concise.\n\nText: ${text}`
                    : `Create a 3-question multiple choice quiz with answers. Format:\nQ1: ...\nA) ...\nAnswer: ...\n\nText: ${text}`;

                const stream = session.promptStreaming(prompt);
                let out = "";
                for await (const chunk of stream) out = chunk;
                session.destroy();
                return out;
            }
        } catch (e) {
            console.log("Local AI Error:", e);
        }

        // 2. Fallback Mock (Simulation)
        if (mode === 'summary') {
            const cleanText = text.replace(/\s+/g, " ").substring(0, 40);
            return `• [Simulation] Summary for: "${cleanText}..."
• Local AI (Gemini Nano) is the lightweight model you requested.
• It appears strictly for Chrome Canary/Dev users currently.
• This placeholder ensures your layout works perfectly.`;
        } else {
            return `Q1: What model is lightweight?
A) Gemini Nano (Local)
B) Cloud GPT-4
Answer: A

Q2: Why this simulation?
A) Browser support missing
B) API Error
Answer: A

Q3: Is data safe?
A) Yes, local only
B) No
Answer: A`;
        }
    };

    if (type === 'both') {
        const summary = await generate('summary');
        const quiz = await generate('quiz');
        return { summary, quiz, isCompound: true };
    } else {
        const result = await generate(type);
        return { result, isCompound: false };
    }
}
