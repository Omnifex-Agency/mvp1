
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
  "Content-Type": "application/json"
};

export const handler = async (event) => {
  console.log("Event:", JSON.stringify(event));
  const { httpMethod, path, queryStringParameters, body } = event;
  
  // NOTE: In a real app, use a middleware or separate handlers for routing.
  // For this MVP, a simple switch is enough.

  try {
    if (httpMethod === "POST" && path === "/alerts") {
      return await createAlert(JSON.parse(body));
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

  const id = uuidv4();
  const createdAt = new Date().toISOString();
  
  // Create Item with Sparse GSI
  // Status is scheduled initially
  const userTimezone = timezone || "UTC"; // Default to UTC if not sent
  
  const item = {
    PK: `USER#${email}`,
    SK: `ALERT#${id}`,
    id,
    userEmail: email,
    title,
    content,
    sourceUrl,
    format, // full, summary, quiz
    reminderDate,
    timezone: userTimezone,
    status: "scheduled",
    createdAt,
    
    // GSI1 - Scheduler Index
    // GSI1PK = SCHED_DATE#{YYYY-MM-DD}
    // GSI1SK = TIMEZONE#{Region}#ALERT#{id} (Adding ID to make SK unique per user/timezone/alert)
    GSI1PK: `SCHED_DATE#${reminderDate}`,
    GSI1SK: `TIMEZONE#${userTimezone}#ALERT#${id}`
  };

  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: item
  }));

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({ id, message: "Alert saved successfully" })
  };
}

async function listAlerts(queryParams) {
  const email = queryParams?.email;
  if (!email) {
    return { statusCode: 400, headers, body: JSON.stringify({ message: "Email required" }) };
  }

  // Get all alerts for the user
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: "PK = :pk",
    ExpressionAttributeValues: {
      ":pk": `USER#${email}`
    },
    // In MVP we can scan forward/backward. True = oldest first.
    ScanIndexForward: false 
  });

  const response = await docClient.send(command);
  
  const items = response.Items.map(item => ({
    id: item.id,
    title: item.title,
    reminderDate: item.reminderDate,
    format: item.format,
    status: item.status,
    createdAt: item.createdAt
    // Exclude content for list view to save bandwidth
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
  const email = queryParams?.email;
  if (!email) {
    return { statusCode: 400, headers, body: JSON.stringify({ message: "Email required" }) };
  }

  // DynamoDB Delete
  await docClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `USER#${email}`,
      SK: `ALERT#${id}`
    }
  }));

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true })
  };
}
