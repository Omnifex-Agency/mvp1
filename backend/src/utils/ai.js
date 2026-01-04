
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function generateContent(item) {
    const { format, content, title } = item;

    if (format === 'full') {
        // No AI needed used
        return content;
    }

    try {
        if (format === 'summary') {
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are a helpful assistant. Summarize the user's text into 3 key bullet points." },
                    { role: "user", content: `Title: ${title}\n\nText: ${content}` }
                ],
                max_tokens: 200
            });
            return response.choices[0].message.content;
        }

        if (format === 'quiz') {
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "Create a simple 3-question quiz based on the text. Format: Question, Options, Answer." },
                    { role: "user", content: `Title: ${title}\n\nText: ${content}` }
                ],
                max_tokens: 300
            });
            return response.choices[0].message.content;
        }
    } catch (error) {
        console.error("AI Generation Error:", error);
        return `(AI Generation Failed) \n\nOriginal Content:\n${content}`;
    }
}
