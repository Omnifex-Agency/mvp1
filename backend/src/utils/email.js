
// utils/email.js
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({});
const SENDER_EMAIL = process.env.SENDER_EMAIL; // Must be verified in SES

export async function sendEmail(alert, generatedContent) {
    if (!SENDER_EMAIL) {
        console.log("Mock Email Send (No Sender Configured):", alert.title);
        return;
    }

    const { title, sourceUrl, format, userEmail } = alert;

    const htmlBody = `
    <h2>Reminder: ${title}</h2>
    <p>Format: <strong>${format}</strong> | <a href="${sourceUrl || '#'}">Source</a></p>
    <hr/>
    <div style="white-space: pre-wrap; background: #f4f4f4; padding: 15px; border-radius: 5px;">
      ${generatedContent}
    </div>
    <br/>
    <p style="font-size: 12px; color: #888;">Sent by HighlightAgent</p>
  `;

    const command = new SendEmailCommand({
        Source: SENDER_EMAIL,
        Destination: { ToAddresses: [userEmail] },
        Message: {
            Subject: { Data: `📚 Reminder: ${title}` },
            Body: {
                Html: { Data: htmlBody },
                Text: { Data: `Reminder: ${title}\n\n${generatedContent}` }
            }
        }
    });

    await ses.send(command);
}
