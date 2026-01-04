This is an **excellent** foundation. You have correctly identified the "Single Table Design" pattern for DynamoDB and the event-driven scheduler.

However, for a **Senior/Principal Architect** level portfolio project, there are three critical gaps in your current plan that a hiring manager would spot immediately:

1. **The "Missing Brain" (AI Integration):** You have "Format: Summary/Quiz" in your data model, but your architecture diagram shows the Scheduler talking directly to Email (SES). **Where does the summarization happen?** (You need a connection to an LLM like OpenAI or AWS Bedrock).
2. **The "Timezone Trap":** If the EventBridge trigger fires at 09:00 UTC, your users in India get emails at 2:30 PM, and users in New York get them at 4:00 AM.
3. **The "Infinite Loop" Risk:** If the scheduler crashes halfway through sending 100 emails, it will restart and re-send the first 50 emails again. You need **Idempotency**.

Below is the **Enhanced PRD v2.0**. I have updated the Architecture and Data Model to solve these problems while keeping it "MVP lean."

---

# HighlightAgent - Implementation Plan & PRD (v2.0)

**Role:** Principal Full-Stack Architect
**Scope:** MVP (Capture, Schedule, **AI Process**, Email Reminder)

## 1. Improved System Architecture

**Changes:** Added **AWS Bedrock / OpenAI** for content generation and refined the Scheduler flow.

```ascii
                                  +-------------------+
                                  |   Browser Ext     |
                                  |  (Chrome/Edge)    |
                                  +---------+---------+
                                            |
                                            v
                                  +---------+---------+ 
                                  |   API Gateway     |
                                  +----+------+-------+
                                       |      |
                   +-------------------+      +----------------------+
                   |                                                 |
         +---------v----------+                           +----------v---------+
         |    ApiHandler      |                           |   SchedulerJob     |
         | (Node.js Lambda)   |                           |  (Node.js Lambda)  |
         +---------+----------+                           +----------+---------+
                   |                                                 ^
                   | Read/Write                                      | 1. Query Due
                   v                                                 |
         +---------+---------------------------+          +----------+---------+
         |        DynamoDB (Single Table)      |          |  AI Service (LLM)  |
         | PK: USER#{email}                    |          | (Bedrock / OpenAI) |
         | GSI1: STATUS#scheduled_DATE#{date}  |<---------+----------+---------+
         +-------------------------------------+          |          ^
                                                          |          | 2. Generate
                                                          | 3. Send  |    Summary
                                                          v          |
                                                  +-------+----------+
                                                  |      AWS SES     |
                                                  +------------------+

```

---

## 2. Optimized Database Schema (DynamoDB)

**The Problem in v1:** Your GSI was just `DUE#{date}`. If you query that, you get *sent* items too.
**The Fix:** We use a **Sparse Composite Key**. We only populate the GSI index if the item is `scheduled`. Once sent, we delete the GSI attribute, removing it from the index automatically.

### Primary Key (Main Table)

* **PK:** `USER#{email}`
* **SK:** `ALERT#{uuid}`

### GSI1 (The "Pending Jobs" Index)

* **GSI1PK:** `SCHED_DATE#{YYYY-MM-DD}` (e.g., `SCHED_DATE#2025-01-08`)
* **GSI1SK:** `TIMEZONE#{Region}` (e.g., `TIMEZONE#Asia/Kolkata`)
* *Why?* This allows the scheduler to say "Give me everything due *today* for *users in India*."



### Item Attributes

```json
{
  "PK": "USER#alice@example.com",
  "SK": "ALERT#123e4567...",
  // GSI attributes ONLY exist if status == 'scheduled'
  "GSI1PK": "SCHED_DATE#2025-01-08", 
  "GSI1SK": "TIMEZONE#Asia/Kolkata", 
  
  "title": "React Server Components",
  "content": "Raw captured text...",
  "format": "summary", // enum: full, summary, quiz
  "status": "scheduled",
  "ai_generated_content": null // To be filled by Lambda later
}

```

---

## 3. The "Smart" Scheduler Logic

This is the most complex part. Here is the robust logic for `SchedulerJob` Lambda.

**Trigger:** EventBridge Rule runs **Every Hour** (not once a day).

**Logic:**

1. **Calculate Current Hour:** It's 09:00 UTC.
2. **Target Timezones:** Which timezones are currently hitting 9:00 AM locally? (e.g., Europe/London).
3. **Query GSI1:**
* `SELECT * FROM GSI1 WHERE GSI1PK = "SCHED_DATE#{Today}" AND GSI1SK begins_with("TIMEZONE#Europe/London")`


4. **Process Loop (For each item):**
* **Step A (Idempotency Check):** Check if `status` is still `scheduled`.
* **Step B (AI Generation):**
* If `format == 'full'`, skip AI.
* If `format == 'summary'`, call LLM: *"Summarize this text in 3 bullets."*


* **Step C (Send):** Send Email via SES.
* **Step D (Update DB):**
* Set `status = 'sent'`
* **REMOVE** `GSI1PK` and `GSI1SK` attributes (This removes it from the "To-Do" list instantly).





---

## 4. API Security (MVP Level)

Using just `?email=...` is unsafe because anyone can delete anyone's data.
**Add a minimal header check.**

* **Header:** `x-user-id: {email}`
* **Header:** `x-client-secret: {static-secret-key}`
* **Logic:** The browser extension will have this "secret key" hardcoded (it's weak security, but better than nothing for an MVP).
* **Better MVP:** Generate a UUID for each user on first sign-up, store it in LocalStorage, and send that as `Authorization: Bearer {uuid}`.

---

## 5. Cost & Scale Analysis (For your Resume)

Add this section to your documentation. It shows "Business Awareness."

| Component | Est. Cost (100 Users) | Est. Cost (10k Users) | Notes |
| --- | --- | --- | --- |
| **Lambda** | $0.00 | $0.20 | Free tier covers 400k GB-seconds. |
| **DynamoDB** | $0.00 | $1.50 | On-demand mode. Text data is cheap. |
| **SES (Email)** | $0.00 | $2.00 | Free tier gives 62k emails/mo. |
| **AI (LLM)** | $0.50 | $50.00 | **The main cost driver.** |

**Optimization Strategy:**

* Only call the LLM for "Summary/Quiz". "Full Text" is free.
* Cache common summaries if multiple users save the same URL (Advanced feature).

---

## 6. Immediate Action Plan (Refined)

1. **Repo:** `mkdir highlight-agent-backend && cd highlight-agent-backend`
2. **SAM Init:** `sam init --runtime nodejs18.x`
3. **DynamoDB:** Define the Table with the **Sparse GSI** in `template.yaml`.
4. **Install SDKs:** `npm install @aws-sdk/client-dynamodb @aws-sdk/client-ses @aws-sdk/lib-dynamodb openai` (or bedrock).
5. **Build API:** Create the `POST /alerts` endpoint first.

