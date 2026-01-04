
import { pipeline, env } from '@xenova/transformers';
import os from 'os';
import path from 'path';

// Configure to allow local models or fetch from remote if needed
// In Lambda, /tmp is writable. We set the cache directory to /tmp (or os.tmpdir in local dev)
const tmpDir = os.tmpdir();
env.localModelPath = path.join(tmpDir, 'models');
env.cacheDir = tmpDir;
env.allowLocalModels = false; // We fetch from Hub on first run (cold start)

// Singleton pattern to reuse the pipeline in warm environments
let summarizer = null;
let generator = null;

const MODEL_NAME = 'Xenova/LaMini-Flan-T5-248M';

/**
 * Initializes the model pipelines.
 */
async function initModels() {
    if (!summarizer) {
        console.log('Loading summarization pipeline...');
        summarizer = await pipeline('summarization', MODEL_NAME);
    }
    if (!generator) {
        console.log('Loading text-generation pipeline...');
        // We use the same model for text generation / quiz creation
        generator = await pipeline('text2text-generation', MODEL_NAME);
    }
}

/**
 * Generates a summary of the provided text.
 * @param {string} text 
 * @returns {Promise<string>}
 */
export async function generateSummary(text) {
    await initModels();

    // prompt construction (Flan-T5 is good with instructions)
    // But the 'summarization' pipeline usually handles the prompt internally or we just pass text
    // For Flan-T5 in summarization pipeline:
    const result = await summarizer(text, {
        max_length: 150,
        min_length: 30,
    });

    // Result is [{ summary_text: '...' }]
    return result[0]?.summary_text || '';
}

/**
 * Generates a quiz based on the provided text.
 * @param {string} text 
 * @param {number} numQuestions 
 * @returns {Promise<string>}
 */
export async function generateQuiz(text, numQuestions = 3) {
    await initModels();

    const prompt = `Generate ${numQuestions} multiple-choice questions with answers based on the following text:\n\n${text}`;

    const result = await generator(prompt, {
        max_length: 512,
        do_sample: true,
        temperature: 0.7,
    });

    return result[0]?.generated_text || '';
}
