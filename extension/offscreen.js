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
        // 2. Fallback: Call Local Backend Service (Transformers.js)
        try {
            const endpoint = mode === 'summary'
                ? 'http://localhost:8080/generate/summary'
                : 'http://localhost:8080/generate/quiz';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (response.ok) {
                const data = await response.json();
                return mode === 'summary' ? data.summary : data.quiz;
            } else {
                console.error("Backend Error:", await response.text());
                throw new Error("Backend failed");
            }
        } catch (err) {
            console.log("Backend AI Error:", err);
            // 3. Final Fallback (if backend is also down)
            if (mode === 'summary') {
                return `• [Backend Offline] Could not reach AI service.\n• Ensure 'node server.js' is running in backend/src.`;
            } else {
                return `Q1: Backend Status?\nA) Offline\nB) Online\nAnswer: A`;
            }
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
