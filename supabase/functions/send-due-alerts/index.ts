import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configuration
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const SENDER_EMAIL = 'no-reply@highlight-agent.com' // Replace with your verified sender in Brevo
const SENDER_NAME = 'HighlightAgent'

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

Deno.serve(async (req) => {
    try {
        // 1. Compute "Today" (UTC)
        const now = new Date()
        const todayStr = now.toISOString().split('T')[0]
        console.log(`[Scheduler] Processing due alerts for ${todayStr}`)

        // 2. Query Alerts (Due Today AND Scheduled)
        const { data: alerts, error: fetchError } = await supabase
            .from('alerts')
            .select('*')
            .eq('reminder_date', todayStr)
            .eq('status', 'scheduled')

        if (fetchError) throw fetchError

        console.log(`[Scheduler] Found ${alerts?.length || 0} alerts due.`)

        if (!alerts || alerts.length === 0) {
            return new Response(JSON.stringify({ message: 'No alerts due.' }), { headers: { 'Content-Type': 'application/json' } })
        }

        // 3. Process Batch
        const results = []

        for (const alert of alerts) {
            // Send Email
            const emailResult = await sendEmail(alert)

            if (emailResult.success) {
                // 4. Update Status (Idempotency)
                const { error: updateError } = await supabase
                    .from('alerts')
                    .update({
                        status: 'sent',
                        sent_at: new Date().toISOString()
                    })
                    .eq('id', alert.id)
                    .eq('status', 'scheduled') // Safety check

                if (updateError) {
                    console.error(`[Scheduler] Failed to update ${alert.id}`, updateError)
                } else {
                    results.push(alert.id)
                }
            } else {
                console.error(`[Scheduler] Failed to send email for ${alert.id}`)
            }
        }

        return new Response(
            JSON.stringify({
                message: `Processed ${results.length} alerts`,
                processed_ids: results
            }),
            { headers: { 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error(error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
})

async function sendEmail(alert: any) {
    if (!BREVO_API_KEY) {
        console.log(`[Mock Send - No Key] To: ${alert.user_email} | Title: ${alert.title}`)
        return { success: true }
    }

    const htmlContent = `
    <html>
      <body style="font-family: sans-serif; color: #333;">
        <h2>HighlightAgent Reminder</h2>
        <p><strong>Title:</strong> ${alert.title}</p>
        <p><strong>Format:</strong> ${alert.format}</p>
        ${alert.source_url ? `<p><a href="${alert.source_url}">Source Link</a></p>` : ''}
        <hr/>
        <div style="background:#f9f9f9; padding:15px; white-space: pre-wrap; border:1px solid #ddd;">
          ${alert.content}
        </div>
        <p style="font-size:12px; color:#888; margin-top:20px;">
          Sent via HighlightAgent
        </p>
      </body>
    </html>
  `

    const payload = {
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: alert.user_email }],
        subject: `Reminder: ${alert.title}`,
        htmlContent: htmlContent
    }

    try {
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify(payload)
        })

        if (!res.ok) {
            const txt = await res.text()
            console.error(`[Brevo Error] ${txt}`)
            return { success: false }
        }

        return { success: true }
    } catch (e) {
        console.error(`[Network Error]`, e)
        return { success: false }
    }
}
