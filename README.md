# 🛡️ AI Risk & Usage Reporter

> **Secure your organizational perimeter from Shadow AI and privilege-heavy integrations.**

The **AI Risk & Usage Reporter** is a modern, lightweight, full-stack cybersecurity auditing application tailored for Microsoft Entra ID (formerly Azure Active Directory). It empowers IT administrators and corporate security officers to easily identify unauthorized AI usage, evaluate the privilege risk levels of registered application integrations, track exactly which departments and users are driving AI traffic, and audit unused applications to keep the directory clean.

---

## ✨ Features

*   **🔍 Shadow AI Discovery Engine:** Extends auditing beyond custom applications. If a user sign-in log references an external or multitenant SaaS integration (e.g., Zoom, Slack, or public OpenAI/Claude portals) that isn't present in your App Registrations CSV, the engine **dynamically synthesizes an application profile** on-the-fly, parses its AI status, and includes it in your report.
*   **👥 App Use by User Directory:** A dedicated telemetry dashboard displaying every active directory user, their department, and total sign-ins. Each user card renders an interactive tag cloud of every application they have authenticated with:
    *   **AI workloads** are styled with a soft **violet-purple tag** and a `Sparkles` icon.
    *   **Standard applications** are styled with a clean **ocean-blue tag**.
    *   Fuzzy search allows instant filtering of the directory by email, domain, or division.
*   **⚖️ Permission Risk Profiling:** Analyzes requested Microsoft Graph API permissions (scopes) and calculates an overall **Trust Score (0-100)**. Flags high-risk scopes allowing full folder modifications or email reading (e.g. `Files.ReadWrite.All`, `Directory.ReadWrite.All`).
*   **📊 Interactive Usage Dashboard:** Synthesizes user sign-in telemetry into crisp, modern analytical visualizations:
    *   *Top AI Applications:* Chart representing volume share across services.
    *   *Division Participation:* Breakdown of AI usage across corporate departments (Engineering, Marketing, HR, Finance, etc.).
    *   *Active Consumer Leaderboard:* Highlights top employees generating AI traffic.
    *   *14-Day Traffic Timeline:* Custom SVG timeline representing transaction frequency trends over time.
*   **📋 All Registrations Audit Grid:** Tabular directory tracking AI and standard apps side-by-side. Highlights unused integrations with a prominent **`Unused (No Logins)`** badge in red to help admins safely target and eliminate bloated or stale app registrations.
*   **📥 Comprehensive Report Exports:** Features multi-format sharing models for security teams and directors:
    *   *JSON Bundles:* Export your entire analyzed dashboard into a portable `.json` report file. Other team members can instantly load this file into the uploader to view the full interactive dashboard with zero configurations or server access needed.
    *   *Tabular CSVs:* Export individual, formatted spreadsheets of both your scanned applications list and user interaction directory.
    *   *Executive PDFs:* Highly-tailored print-media CSS automatically strips away navbars, filters, search fields, and buttons, converting your active visual dashboard into a clean black-and-white page-broken PDF report.
*   **🔐 Private & Local Fallback:** Employs in-memory processing. Your uploaded corporate CSV files never leave your system and are never written to any database. If the backend is unavailable, the app falls back to a complete local client-side preview mode with rich mock data.

---

## 🏗️ Architecture & Tech Stack

*   **Frontend:** React 19 (TypeScript) + Vanilla CSS + Lucide Icons + Vite. Delivering a highly polished, responsive dark-themed dashboard.
*   **Backend:** Node.js + Express. Handles memory buffers for multi-file CSV uploads, runs analytics, and formats telemetry.
*   **CSV Parsing Core:** Pure, robust JavaScript parser mapping columns, unescaping nested values, and managing quoted fields containing commas (common in permission scope lists). Includes `getValueIgnoreCase` header normalization.
*   **Security Posture:** In-memory execution. Zero data persistence, ensuring complete corporate compliance.

---

## 🚀 Quick Start Guide

### Prerequisites
*   Node.js (v22.0.0 or higher recommended)
*   npm (v11.0.0 or higher)

### Setup & Installation
1. Clone this repository:
   ```bash
   git clone http://github.com/scott-clouded/ai-risk-and-usage-reporter.git
   cd ai-risk-and-usage-reporter
   ```

2. Setup Backend:
   ```bash
   cd backend
   npm install
   ```

3. Setup Frontend:
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Environment
You can run both services simultaneously:

*   **Start the Backend API:** (Port `5001`)
    ```bash
    cd backend
    npm run dev
    ```
*   **Start the React Web Client:** (Port `5173`)
    ```bash
    cd frontend
    npm run dev
    ```

Once started, open your browser to **[http://localhost:5173](http://localhost:5173)** to access the reporter.

---

## 📋 How to Export Entra ID Logs & Supported Columns

The reporter features an **intelligent header normalization parser** that successfully maps column names regardless of casing, spacing, dashes, or underscores. 

### Export Guides
1.  **Registered Applications CSV:**
    *   Navigate to **Microsoft Entra Admin Center &gt; Identity &gt; Applications &gt; App Registrations**.
    *   Click the **All Applications** tab.
    *   Click the **Export as CSV** button at the top toolbar.
2.  **User Sign-In Logs CSV:**
    *   Navigate to **Identity &gt; Monitoring & Health &gt; Sign-in logs**.
    *   Filter the list to active user sign-ins.
    *   Click **Download &gt; Export as CSV**.

### Supported CSV Column Headers (Case-Insensitive)
Our parser normalizes and matches the following headers:
*   **App ID:** `appId`, `AppId`, `Application ID`, `ApplicationId`, `App ID`, `id`
*   **App Name:** `displayName`, `DisplayName`, `display name`, `Name`, `AppName`, `AppDisplayName`, `Application`
*   **Publisher:** `Publisher`, `publisher`, `PublisherDomain`, `publisherDomain`, `verifiedPublisher`
*   **Graph Permissions:** `Permissions`, `permissions`, `RequiredResourceAccess`, `requiredResourceAccess`, `scopes`, `api permissions`
*   **User Email:** `userPrincipalName`, `UserPrincipalName`, `user principal name`, `User`, `Email`, `email`, `user email`
*   **Timestamp:** `createdDateTime`, `CreatedDateTime`, `Timestamp`, `date`, `Date`, `Time`, `time`
*   **Department:** `Department`, `department`

---

## 🛡️ Risk Assessment Methodology

Each permission scope exported in your App Registrations CSV is evaluated based on its security severity impact:

| Severity Level | Score Impact | Examples | Security Description |
| :--- | :--- | :--- | :--- |
| **🔴 High Severity** | `-30 points` | `Directory.ReadWrite.All`, `Files.ReadWrite.All`, `Mail.ReadWrite` | Write or full access to broad directories, corporate emails, and active folders. |
| **🟡 Medium Severity** | `-15 points` | `Directory.Read.All`, `Files.Read.All`, `User.Read.All` | Read-only permissions granting access to the entire directory or all user files. |
| **🟢 Low Severity** | `-2 points` | `User.Read`, `openid`, `profile`, `email` | Standard authentication permissions needed for login and basic user profiles. |

*Additional custom/unknown permissions containing "write" or "all" are treated as potential High risk (-25 points).*
*Enterprise-managed AI applications registered by certified publishers (e.g. Microsoft, Google, OpenAI, GitHub) receive a **+10 point trust bonus**.*

---

## 📂 Project Structure

```
ai-risk-and-usage-reporter/
├── backend/                  # Node.js API Service
│   ├── src/
│   │   ├── index.js          # Express Routes
│   │   ├── utils/
│   │   │   ├── parser.js     # Robust Case-Insensitive CSV Parser
│   │   │   ├── analyzer.js   # AI and Risk Identification Engine (with Shadow AI)
│   │   │   ├── mockGenerator.js # Dynamic 14-Day Log Generator
│   │   │   └── test.js       # Programmatic Verification Suite
│   │   └── ...
│   └── package.json
│
├── frontend/                 # Vite React Client
│   ├── src/
│   │   ├── App.tsx           # React UI and User-Telemetry View
│   │   ├── App.css           # Dark Cybersecurity Visuals
│   │   └── main.tsx
│   ├── index.html            # Customized Entry point
│   └── package.json
```

---

## 🔒 Privacy & Compliance
Because corporate exports contain sensitive employee identities, this application is designed around a **privacy-first zero-trust model**:
1. All analysis is processed strictly **in-memory** on your server.
2. No database or cloud analytics are integrated.
3. If the backend is unreachable, the client falls back to locally-processed previewing. Your files never leave your terminal workspace.
