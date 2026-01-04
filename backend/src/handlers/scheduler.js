
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { generateContent } from "../utils/ai.js";
import { sendEmail } from "../utils/email.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME;

// MVP: List of supported timezones to check
// In prod, this would be dynamic or we'd query all TZs
const SUPPORTED_TIMEZONES = [
    "UTC", "America/New_York", "America/Los_Angeles",
    "Europe/London", "Asia/Kolkata", "Asia/Tokyo"
];

export const handler = async (event) => {
    console.log("Scheduler Event:", JSON.stringify(event));

    const now = new Date();
    const activeTimezones = [];

    // 1. Identify Timezones where it is 9 AM (Hour 9)
    for (const tz of SUPPORTED_TIMEZONES) {
        try {
            // Get hour in that timezone
            const hourString = now.toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', hour12: false });
            const hour = parseInt(hourString, 10);

            // We target 9 AM
            if (hour === 9) {
                activeTimezones.push(tz);
            }
        } catch (e) {
            console.warn(`Timezone check failed for ${tz}`, e);
        }
    }

    console.log("Active Timezones (9 AM now):", activeTimezones);
    if (activeTimezones.length === 0) return;

    // 2. Query & Process for each active timezone
    for (const tz of activeTimezones) {
        // Get Local YYYY-MM-DD for that timezone
        const today = now.toLocaleDateString('en-CA', { timeZone: tz }); // YYYY-MM-DD format
        await processDueAlerts(today, tz);
    }
};

async function processDueAlerts(dateStr, timezone) {
    console.log(`Processing ${timezone} for date ${dateStr}`);

    // Query GSI: SCHED_DATE#{dateStr} AND begins_with(TIMEZONE#{timezone})
    const params = {
        TableName: TABLE_NAME,
        IndexName: "SchedulerIndex",
        KeyConditionExpression: "GSI1PK = :pk AND begins_with(GSI1SK, :sk)",
        ExpressionAttributeValues: {
            ":pk": `SCHED_DATE#${dateStr}`,
            ":sk": `TIMEZONE#${timezone}`
        }
    };

    const response = await docClient.send(new QueryCommand(params));
    const items = response.Items || [];
    console.log(`Found ${items.length} due items.`);

    for (const item of items) {
        try {
            await processSingleItem(item);
        } catch (err) {
            console.error(`Failed to process item ${item.id}`, err);
        }
    }
}

async function processSingleItem(item) {
    // Idempotency Check: double check status in main table
    // (Though GSI should only have scheduled items, race conditions exist)
    if (item.status !== 'scheduled') {
        console.log(`Skipping ${item.id} - status is ${item.status}`);
        return;
    }

    // 1. Generate Content
    const content = await generateContent(item);

    // 2. Send Email
    await sendEmail(item, content);

    // 3. Update DB (Mark Sent + Remove from GSI)
    // We remove GSI1PK and GSI1SK to "delete" it from the index (Sparse Index)
    await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
            PK: item.PK,
            SK: item.SK
        },
        UpdateExpression: "SET #st = :sent, sentAt = :now REMOVE GSI1PK, GSI1SK",
        ExpressionAttributeNames: {
            "#st": "status"
        },
        ExpressionAttributeValues: {
            ":sent": "sent",
            ":now": new Date().toISOString()
        }
    }));

    console.log(`Processed & Sent: ${item.id}`);
}
