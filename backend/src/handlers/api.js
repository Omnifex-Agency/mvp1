
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { generateSummary, generateQuiz } from '../utils/local_ai.js';

// Configuration
const SUPABASE_URL = "https://ztwcpkaunjtaftvdirqd.supabase.co";
const SUPABASE_KEY = "sb_publishable_ku_dam8A40EUXl5ss8SQww_EX_MCmWB";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
  "Content-Type": "application/json"
};

export const handler = async (event) => {
  console.log("Event:", JSON.stringify(event));
  const { httpMethod, path, queryStringParameters, body } = event;

  try {
    if (httpMethod === "POST" && path === "/alerts") {
      return await createAlert(JSON.parse(body));
    }
    // Keep these for standalone testing if needed
    if (httpMethod === "POST" && path === "/generate/summary") {
      const { text } = JSON.parse(body);
      if (!text) return { statusCode: 400, headers, body: JSON.stringify({ message: "Text required" }) };
      const summary = await generateSummary(text);
      return { statusCode: 200, headers, body: JSON.stringify({ summary }) };
    }
    if (httpMethod === "POST" && path === "/generate/quiz") {
      const { text, numQuestions } = JSON.parse(body);
      if (!text) return { statusCode: 400, headers, body: JSON.stringify({ message: "Text required" }) };
      const quiz = await generateQuiz(text, numQuestions);
      return { statusCode: 200, headers, body: JSON.stringify({ quiz }) };
    }
    if (httpMethod === "GET" && path === "/alerts") {
      return await listAlerts(queryStringParameters);
    }
    if (httpMethod === "DELETE" && path.match(/\/alerts\/.+/)) {
      const id = path.split("/").pop();
      return await deleteAlert(id, queryStringParameters);
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: "Route not found" })
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Internal Server Error", error: err.message })
    };
  }
};

async function createAlert(data) {
  const { email, title, content, sourceUrl, format, reminderDate, timezone } = data;

  if (!email || !title || !content || !reminderDate) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: "Missing required fields" })
    };
  }

  // 1. GENERATE AI CONTENT (if requested)
  let finalContent = content;
  let aiResult = "";

  if (format === 'summary') {
    console.log("Generating summary...");
    aiResult = await generateSummary(content);
    finalContent = `## 📝 AI Summary\n${aiResult}\n\n## 📄 Original Text\n${content}`;
  } else if (format === 'quiz') {
    console.log("Generating quiz...");
    // Dynamic Question Count: Min 3, Max 10, approx 1 per 500 chars
    const numQuestions = Math.max(3, Math.min(10, Math.ceil(content.length / 500)));
    aiResult = await generateQuiz(content, numQuestions);
    finalContent = `## 🧠 AI Quiz (${numQuestions} Questions)\n${aiResult}\n\n## 📄 Original Text\n${content}`;
  }

  // 2. SAVE TO SUPABASE
  const { data: savedData, error } = await supabase
    .from('alerts')
    .insert([
      {
        user_email: email,
        title,
        content: finalContent,
        source_url: sourceUrl,
        format,
        reminder_date: reminderDate,
        status: 'scheduled',
        timezone: timezone || 'UTC'
      }
    ])
    .select();

  if (error) {
    console.error("Supabase Error:", error);
    throw new Error(error.message);
  }

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({ id: savedData[0]?.id, message: "Alert saved with AI generation!" })
  };
}

async function listAlerts(queryParams) {
  const email = queryParams?.email;
  if (!email) {
    return { statusCode: 400, headers, body: JSON.stringify({ message: "Email required" }) };
  }

  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('user_email', email)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const items = data.map(item => ({
    id: item.id,
    title: item.title,
    reminderDate: item.reminder_date,
    format: item.format,
    status: item.status,
    createdAt: item.created_at
  }));

  const stats = {
    total: items.length,
    pending: items.filter(i => i.status === 'scheduled').length,
    sent: items.filter(i => i.status === 'sent').length
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ stats, items })
  };
}

async function deleteAlert(id, queryParams) {
  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true })
  };
}
