# HighlightAgent (MVP)

A browser-extension-first retention system. Capture snippets, schedule reminders, and receive AI-generated summaries via email.

## 📂 Project Structure

- **`backend/`**: AWS Serverless Application (SAM).
    - `template.yaml`: Defines DynamoDB (Single Table), Lambdas, API Gateway.
    - `src/handlers/`: API and Scheduler logic.
- **`extension/`**: Chrome Extension (Manifest V3).
- **`dashboard/`**: Vercel Next.js Web App for managing alerts.

---

## 🚀 Getting Started

### 1. Backend Setup (AWS)

1. Navigate to `backend/src`:
   ```bash
   cd backend/src
   npm install
   ```
2. Configure Environment:
   - Rename `.env.example` to `.env`.
   - Add your `OPENAI_API_KEY` (required for Summary/Quiz).
   - Add `SENDER_EMAIL` (Must be a verified identity in AWS SES).
3. Deploy (Requires AWS CLI + SAM CLI):
   ```bash
   cd ..
   sam deploy --guided
   ```
   - Note the **API Gateway URL** from the outputs (e.g., `https://xxxx.execute-api.us-east-1.amazonaws.com/Prod/`).

   *(Alternative: For local dev, you can use `sam local start-api` but you need Docker running).*

### 2. Dashboard Setup (Web)

1. Navigate to `dashboard`:
   ```bash
   cd dashboard
   npm install
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000).
3. Enter your email (e.g., `me@example.com`) and the **API URL** from Step 1.
   - *Note: If running local backend, use `http://localhost:3000` (but SAM local runs on port 3000 too, so one needs to change port).*

### 3. Extension Setup (Chrome)

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer Mode** (top right).
3. Click **Load unpacked**.
4. Select the `extension/` folder in this project.
5. Click the Extension Icon.
6. **Setup**: Enter the same email (`me@example.com`) and **API URL**.

---

## 🧪 Usage Flow

1. **Capture**: Highlight text on any website. Right-click "Save to HighlightAgent" OR click the extension icon.
2. **Schedule**: Choose "Tomorrow" or "3 Days". Select "Summary" format.
3. **Dashboard**: Refresh the dashboard to see your new pending alert.
4. **Email**: The Scheduler runs hourly.
   - *Manual Test:* You can manually invoke the `SchedulerFunction` via AWS Console to trigger an immediate check.

## ⚠️ Important Nuances

- **Idempotency**: The system ensures you don't receive duplicate emails even if the scheduler retries.
- **Timezones**: The scheduler sends emails when it creates a "9 AM" match in your local timezone.
- **AI Cost**: OpenAI key is used only for Summary/Quiz formats.
