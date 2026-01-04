
import { createClient } from 'npm:@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2'

// Types
interface Alert {
    id: string;
    title: string;
    content: string;
    format: string;
    user_email: string;
    user_id?: string; // Phase 2: May exist
}

// Config
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';

// Clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const resend = new Resend(RESEND_API_KEY);

Deno.serve(async (req) => {
    // 1. Scheduler Logic: Find alerts due TODAY that haven't been sent
    const today = new Date().toISOString().split('T')[0];

    // Note: In production, handle timezones. For MVP, we check 'reminder_date' string match.
    const { data: alerts, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('status', 'scheduled')
        .lte('reminder_date', today);

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    if (!alerts || alerts.length === 0) {
        return new Response(JSON.stringify({ message: "No alerts due today." }), { status: 200 });
    }

    console.log(`Found ${alerts.length} alerts due.`);

    const results = [];

    // 2. Loop & Send
    for (const alert of alerts) {
        try {
            // Generate HTML Content
            let htmlContent = `
                <div style="background-color: #09090b; color: #f4f4f5; padding: 20px; font-family: sans-serif; border-radius: 8px;">
                    <h2 style="color: #a78bfa;">${alert.title}</h2>
                    <p style="color: #a1a1aa; font-size: 14px;">Originally captured from: ${alert.source_url || 'Unknown'}</p>
                    <hr style="border-color: #27272a; margin: 20px 0;" />
            `;

            if (alert.format === 'quiz') {
                // Quiz Format: Hide Answer
                htmlContent += `
                    <div style="background-color: #18181b; padding: 15px; border-radius: 8px; border: 1px solid #27272a;">
                        <h3 style="margin-top: 0;">🧠 Quick Quiz</h3>
                        <pre style="white-space: pre-wrap; font-family: inherit; color: #e4e4e7;">${alert.content.replace(/Answer:.*/gs, 'Answer: [Hidden - Think first!]')}</pre>
                        <details style="margin-top: 15px; background: #27272a; padding: 10px; border-radius: 4px; cursor: pointer;">
                            <summary style="color: #a78bfa; font-weight: bold;">Reveal Answer</summary>
                            <p style="margin-top: 10px; color: #10b981; font-weight: bold;">${alert.content.match(/Answer:.*/s)?.[0] || 'Check dashboard for answer'}</p>
                        </details>
                    </div>
                 `;
            } else {
                // Summary Format
                htmlContent += `
                    <div style="background-color: #18181b; padding: 15px; border-radius: 8px; border: 1px solid #27272a;">
                         <h3 style="margin-top: 0;">📝 Smart Summary</h3>
                         <ul style="line-height: 1.6;">
                             ${alert.content.split('\n').map(line => `<li>${line.replace(/^[•-]\s*/, '')}</li>`).join('')}
                         </ul>
                    </div>
                `;
            }

            htmlContent += `
                <div style="margin-top: 30px; text-align: center;">
                    <a href="https://your-dashboard-url.vercel.app" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Review in Dashboard</a>
                </div>
                </div>
            `;

            // Send Email
            await resend.emails.send({
                from: 'Omnifex <reminders@yourdomain.com>',
                to: [alert.user_email],
                subject: `🧠 Due for Recall: ${alert.title}`,
                html: htmlContent
            });

            // Update Status
            await supabase
                .from('alerts')
                .update({ status: 'sent', sent_at: new Date() })
                .eq('id', alert.id);

            results.push({ id: alert.id, status: 'sent' });

        } catch (e) {
            console.error(`Failed to send alert ${alert.id}`, e);
            results.push({ id: alert.id, status: 'failed', error: String(e) });
        }
    }

    return new Response(JSON.stringify({ processed: results }), { headers: { "Content-Type": "application/json" } });
});
