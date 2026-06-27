<h1 align="center">CivicLens</h1>

<p align="center">
AI-powered civic issue reporting platform using Google Gemini<br/>
Report • Analyze • Resolve civic issues intelligently
</p>

---

## 🔗 Live Demo

[Live Link](https://community-hero-1099237776044.asia-southeast1.run.app/)

---

## 🏁 Hackathon Context

This project is built for **VIBE2SHIP 2026**, a vibe-coding hackathon by **Coding Ninjas × Google for Developers**.

### 📌 Problem Statement 2 — COMMUNITY HERO

*Build a platform that enables citizens to identify, report, validate, track, and resolve community issues through collaboration, data, and intelligent automation.  
The solution should encourage transparency, accountability, and community participation.*


## 💡 Solution Overview

CivicLens solves this problem by introducing an AI-powered civic reporting platform where users can:

- Citizens submit issues using image + description
- Gemini AI analyzes and classifies the issue
- System assigns:
  - Category
  - Severity level
  - Responsible department
  - Recommended action
- Data is stored and visualized in a real-time dashboard

The system converts unstructured citizen reports into structured municipal action data.

---

## 🧠 Google Technologies Used

- **Google Gemini 2.5 Flash**
  - Multimodal issue analysis (text + image)
  - Structured JSON output generation

- **Firebase Firestore**
  - Real-time database for issue tracking

- **Firebase Storage**
  - Image upload and retrieval

- **Google Cloud Run**
  - Backend deployment

- **Google AI Studio**
  - Rapid development and iterative build workflow


## 🛠️ Tech Stack

**Frontend**
- React
- TypeScript
- Tailwind CSS
- Vite

**Backend**
- Node.js
- Express.js

**Database & Storage**
- Firebase Firestore
- Firebase Storage

**AI Integration**
- Google Gemini 2.5 Flash

---

## 📸 Screenshots

**Dashboard**

![Dashboard](./assets/dashboard.png)

**View all Issues**

![Report Form](./assets/issue-feed.png)

**Report an Issue**

![Report Form](./assets/report.png)

**AI Analysis Result**

![AI Result](./assets/report-registered.png)
![Full Complaint](./assets/check-report.png)

---

## ✨ Key Features

- 📸 Image-based civic issue reporting
- 🧠 AI-powered categorization & severity detection
- 🏢 Automated department recommendation
- 📊 Real-time issue dashboard
- 📱 Fully responsive UI
- ⚡ Fast, structured backend workflow


## ⚙️ System Architecture

User Flow:

1. User submits issue (image + description)
2. Frontend sends request to backend API
3. Backend processes request and calls Gemini AI
4. AI returns structured JSON:
   - category
   - severity
   - department
   - action steps
5. Backend stores data in Firestore
6. Dashboard fetches and displays categorized issues

---

## 📂 Project Structure

```

CivicLens/
│
├── src/                 # React frontend
├── server.ts            # Express backend
├── index.html           # App entry
├── vite.config.ts       # Vite config
├── firestore.rules      # Firebase rules
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
└── README.md

````

---

## 📊 AI Classification Categories

- Road and Potholes  
- Street Lighting  
- Waste and Sanitation  
- Water and Utilities  
- Other  

## 🚀 Core AI Workflow

The AI system performs:

- Image + text understanding
- Civic issue classification
- Severity evaluation based on risk level
- Department mapping
- Action recommendation generation
<br>

---

## 🎯 Future Improvements

* User authentication (Firebase Auth)
* Admin dashboard for municipalities
* Map-based issue visualization
* Notification system for updates

---

### 🏁 Setup Instructions

```bash
git clone https://github.com/<your-username>/CivicLens.git
cd CivicLens
npm install
npm run dev
```

### Environment Variables

Create a `.env` file:

```
GEMINI_API_KEY=your_api_key_here
FIREBASE_PROJECT_ID=your_project_id
```

---

## 🏆 Impact

* Reduces manual effort in civic reporting
* Improves issue classification accuracy
* Speeds up municipal response workflow
* Makes civic engagement more accessible and structured

---

## 📌 Author

***VIBE2SHIP 2026 Submission***
<br>
With ❤️ by [@erleen0307](https://github.com/erleen0307/)
<br>
📅 Date Completed: July 27, 2026
