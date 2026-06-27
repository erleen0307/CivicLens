import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { Issue, TimelineEvent } from './src/types';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Body parser with 10MB limit to support image uploads (base64)
app.use(express.json({ limit: '10mb' }));

// Initial mock issues for database seeding or in-memory fallback
const getInitialSampleIssues = (): Issue[] => [
  {
    id: 'sample-pothole-pine',
    title: 'Severe Road Pothole',
    description: 'A deep, dangerous pothole has developed near the intersection of Pine Street and 4th Avenue. It causes cars to swerve dangerously into oncoming traffic to avoid it. Several vehicles have already sustained tire damage.',
    category: 'Road and Potholes',
    severity: 'High',
    severityReason: 'Causes vehicles to swerve into oncoming traffic, creating an active safety hazard.',
    suggestedDepartment: 'Department of Public Works',
    initialActionStep: 'Dispatch maintenance crew to seal pothole and install temporary warning cone.',
    address: 'Pine St & 4th Ave, Downtown',
    status: 'Investigating',
    upvotes: 24,
    upvotedBy: [],
    reporterName: 'Sarah Jenkins',
    reporterEmail: 'sarah.j@example.com',
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
    timeline: [
      {
        id: 'evt-1',
        status: 'Submitted',
        title: 'Report Received',
        description: 'Citizen Sarah Jenkins reported a severe pothole at Pine St & 4th Ave.',
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
        author: 'Citizen'
      },
      {
        id: 'evt-2',
        status: 'Investigating',
        title: 'Inspection Scheduled',
        description: 'Department of Public Works assigned inspector to verify the road damage and place caution markers.',
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
        author: 'Department'
      }
    ]
  },
  {
    id: 'sample-light-oak',
    title: 'Broken Streetlights',
    description: 'Three consecutive streetlights are completely out along Oak Park Boulevard. The sidewalk and road are pitch black at night, making it feel very unsafe for pedestrians walking home.',
    category: 'Street Lighting',
    severity: 'Medium',
    severityReason: 'Significant reduction in nighttime visibility increases security concerns for pedestrians.',
    suggestedDepartment: 'Bureau of Street Lighting',
    initialActionStep: 'Inspect local circuit breaker and replace burned-out LED fixtures.',
    address: '840 Oak Park Blvd, Eastside',
    status: 'Submitted',
    upvotes: 12,
    upvotedBy: [],
    reporterName: 'Marcus Chen',
    reporterEmail: 'm.chen@example.com',
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
    timeline: [
      {
        id: 'evt-3',
        status: 'Submitted',
        title: 'Report Received',
        description: 'Citizen Marcus Chen flagged broken streetlights on Oak Park Blvd.',
        timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
        author: 'Citizen'
      },
      {
        id: 'evt-4',
        status: 'Submitted',
        title: 'AI Diagnostics Completed',
        description: 'CivicLens AI automatically categorized issue as Street Lighting and routed it to the Bureau of Street Lighting.',
        timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
        author: 'System'
      }
    ]
  },
  {
    id: 'sample-trash-plaza',
    title: 'Overflowing Trash Bins',
    description: 'Public garbage cans are overflowing in the Main Plaza. Wind is blowing trash across the public square, attracting birds and rodents. Needs urgent clearance.',
    category: 'Waste and Sanitation',
    severity: 'Medium',
    severityReason: 'Sanitation concern causing litter dispersal and attracting wildlife to public gathering areas.',
    suggestedDepartment: 'Waste & Sanitation Authority',
    initialActionStep: 'Empty trash bins and sweep surrounding public plaza area.',
    address: 'Main Plaza Square, Central Business District',
    status: 'Resolved',
    upvotes: 35,
    upvotedBy: [],
    reporterName: 'Elena Rostova',
    reporterEmail: 'elena.r@example.com',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
    timeline: [
      {
        id: 'evt-5',
        status: 'Submitted',
        title: 'Report Received',
        description: 'Citizen Elena Rostova reported overflowing garbage bins in the plaza.',
        timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
        author: 'Citizen'
      },
      {
        id: 'evt-6',
        status: 'In Progress',
        title: 'Sanitation Crew Dispatched',
        description: 'A clearance team has been scheduled for the next central business district sweep route.',
        timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000,
        author: 'Department'
      },
      {
        id: 'evt-7',
        status: 'Resolved',
        title: 'Cleanup Complete',
        description: 'Sanitation crew emptied all bins, swept the plaza, and washed down the pavement.',
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
        author: 'Department'
      }
    ]
  },
  {
    id: 'sample-water-leak',
    title: 'Major Water Pipe Leak',
    description: 'Water is gushing out of a fracture on the sidewalk near the fire hydrant. The street is starting to flood, and water pressure in nearby buildings has dropped significantly.',
    category: 'Water and Utilities',
    severity: 'Critical',
    severityReason: 'Active water main rupture causing street flooding and pressure drop in local buildings.',
    suggestedDepartment: 'Water and Power Utility',
    initialActionStep: 'Shut off the main local control valve immediately and excavate the street to patch the rupture.',
    address: '1220 West Elm St, Northside',
    status: 'In Progress',
    upvotes: 56,
    upvotedBy: [],
    reporterName: 'Officer David Vance',
    reporterEmail: 'd.vance@citypolice.org',
    createdAt: Date.now() - 4 * 60 * 60 * 1000, // 4 hours ago
    timeline: [
      {
        id: 'evt-8',
        status: 'Submitted',
        title: 'Emergency Utility Report',
        description: 'Officer Vance reported a major water leak causing localized street flooding.',
        timestamp: Date.now() - 4 * 60 * 60 * 1000,
        author: 'Citizen'
      },
      {
        id: 'evt-9',
        status: 'In Progress',
        title: 'Emergency Valve Shutoff',
        description: 'Water main crew has arrived on site. Local water line isolated, excavations under way.',
        timestamp: Date.now() - 3 * 60 * 60 * 1000,
        author: 'Department'
      }
    ]
  }
];

// Initialize Firebase (and Firestore) or set up in-memory storage fallback
let db: any = null;
let useInMemory = false;
let inMemoryIssues: Issue[] = getInitialSampleIssues();

try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log("Found Firebase Applet Config. Initializing Firestore...");
    const firebaseApp = initializeApp(configData);
    db = getFirestore(firebaseApp, configData.firestoreDatabaseId || undefined);
    
    // Test collection fetching or seed database if empty
    // We will run this lazily
  } else {
    console.warn("No firebase-applet-config.json found. Running in in-memory fallback mode.");
    useInMemory = true;
  }
} catch (error) {
  console.error("Firebase initialization failed, using in-memory fallback mode:", error);
  useInMemory = true;
}

// Function to seed Firestore database with initial data if it's completely empty
async function seedFirestoreIfNeeded() {
  if (useInMemory || !db) return;
  try {
    const issuesCol = collection(db, 'issues');
    const snapshot = await getDocs(issuesCol);
    if (snapshot.empty) {
      console.log("Firestore 'issues' collection is empty. Seeding sample issues...");
      for (const issue of getInitialSampleIssues()) {
        await addDoc(issuesCol, issue);
      }
      console.log("Firestore seeded successfully!");
    } else {
      console.log(`Firestore 'issues' collection has ${snapshot.size} items. Seeding skipped.`);
    }
  } catch (err) {
    console.error("Failed to seed Firestore, falling back to in-memory check:", err);
  }
}

// Perform lazy seeding shortly after startup
setTimeout(() => {
  seedFirestoreIfNeeded().catch(err => console.error("Lazy seed failed", err));
}, 1000);

// Category Normalization function to enforce exactly the 5 canonical categories
function normalizeCategory(category: string): string {
  if (!category) return "Other";
  const cat = category.trim();
  const catLower = cat.toLowerCase();

  // Roads and Potholes normalizations
  if (
    catLower === "road and potholes" ||
    catLower === "roads & potholes" ||
    catLower === "roads and potholes" ||
    catLower === "road & potholes" ||
    catLower === "roads" ||
    catLower === "road" ||
    catLower === "pothole" ||
    catLower === "potholes" ||
    catLower === "road damage"
  ) {
    return "Road and Potholes";
  }

  // Street Lighting normalizations
  if (
    catLower === "street lighting" ||
    catLower === "street light" ||
    catLower === "streetlights" ||
    catLower === "streetlight" ||
    catLower === "lighting"
  ) {
    return "Street Lighting";
  }

  // Waste and Sanitation normalizations
  if (
    catLower === "waste and sanitation" ||
    catLower === "waste & sanitation" ||
    catLower === "garbage" ||
    catLower === "sanitation" ||
    catLower === "waste" ||
    catLower === "trash" ||
    catLower === "litter" ||
    catLower === "dump" ||
    catLower === "overflowing bin" ||
    catLower === "sewage"
  ) {
    return "Waste and Sanitation";
  }

  // Water and Utilities normalizations
  if (
    catLower === "water and utilities" ||
    catLower === "water & utilities" ||
    catLower === "water" ||
    catLower === "utilities" ||
    catLower === "utility" ||
    catLower === "leak" ||
    catLower === "pipe" ||
    catLower === "burst pipe" ||
    catLower === "flooding" ||
    catLower === "hydrant" ||
    catLower === "drainage"
  ) {
    return "Water and Utilities";
  }

  return "Other";
}

// Fallback AI heuristic mapping if Gemini is unavailable
function generateFallbackAnalysis(description: string, imageUrl?: string) {
  const descLower = description.toLowerCase();
  let category = "Other";
  let title = "Civic Issue Reported";
  let severity: 'Low' | 'Medium' | 'High' | 'Critical' = "Medium";
  let severityReason = "Issue assessed using the standard automated analysis heuristics.";
  let suggestedDepartment = "Department of Public Works";
  let initialActionStep = "Schedule field inspection to evaluate the site.";

  if (imageUrl) {
    title = "Visual Asset Damage / Civic Issue";
    severityReason = "Visual report submitted. Needs site assessment to verify structure integrity.";
  }

  if (
    descLower.includes("pothole") ||
    descLower.includes("road") ||
    descLower.includes("asphalt") ||
    descLower.includes("pavement") ||
    descLower.includes("crack") ||
    descLower.includes("street") ||
    descLower.includes("highway")
  ) {
    category = "Road and Potholes";
    title = "Pothole / Road Damage";
    severity = "Medium";
    suggestedDepartment = "Department of Public Works";
    initialActionStep = "Dispatch maintenance crew to seal pothole.";
  } else if (
    descLower.includes("street light") ||
    descLower.includes("lamp") ||
    descLower.includes("bulb") ||
    descLower.includes("lighting") ||
    descLower.includes("dark road") ||
    descLower.includes("pole light")
  ) {
    category = "Street Lighting";
    title = "Broken Streetlight Reported";
    severity = "Low";
    suggestedDepartment = "Bureau of Street Lighting";
    initialActionStep = "Verify power supply and replace lighting fixture.";
  } else if (
    descLower.includes("garbage") ||
    descLower.includes("trash") ||
    descLower.includes("waste") ||
    descLower.includes("litter") ||
    descLower.includes("dump") ||
    descLower.includes("overflowing bin") ||
    descLower.includes("sewage")
  ) {
    category = "Waste and Sanitation";
    title = "Illegal Dumping / Trash Build-up";
    severity = "Medium";
    suggestedDepartment = "Waste & Sanitation Authority";
    initialActionStep = "Deploy sanitation truck for waste clearance.";
  } else if (
    descLower.includes("water") ||
    descLower.includes("leak") ||
    descLower.includes("pipe") ||
    descLower.includes("burst pipe") ||
    descLower.includes("flooding") ||
    descLower.includes("hydrant") ||
    descLower.includes("drainage")
  ) {
    category = "Water and Utilities";
    title = "Water Leak / Pipe Burst";
    severity = "High";
    suggestedDepartment = "Water and Power Utility";
    initialActionStep = "Shut off local water valve and repair rupture.";
  }

  if (descLower.includes("danger") || descLower.includes("emergency") || descLower.includes("hazard") || descLower.includes("injury") || descLower.includes("unsafe") || descLower.includes("accident") || descLower.includes("broken glass")) {
    severity = "Critical";
    severityReason = "High risk of safety hazard or imminent physical injury identified.";
  }

  return {
    category: normalizeCategory(category),
    title,
    severity,
    severityReason,
    suggestedDepartment,
    initialActionStep
  };
}

// Call Gemini API to analyze the issue report (text & base64 image)
async function analyzeIssueWithAI(description: string, imageBase64?: string): Promise<{
  category: string;
  title: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  severityReason: string;
  suggestedDepartment: string;
  initialActionStep: string;
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY not configured or is placeholder. Falling back to local heuristics.");
    return generateFallbackAnalysis(description, imageBase64);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    let prompt = `You are CivicLens AI, an advanced municipal assistant. 
    Analyze this civic issue report and provide a structured, clean JSON response.

    Report Description: "${description}"

    Generate a JSON object with EXACTLY the following fields (maintain JSON format, no extra keys):
    1. "category": Choose the most appropriate municipal category. It MUST be EXACTLY one of these five strings (case-sensitive): "Road and Potholes", "Street Lighting", "Waste and Sanitation", "Water and Utilities", or "Other". Do not use "&", plurals, alternative capitalization, or different wording.
    2. "title": A concise, action-oriented, 1-sentence summary/title of the issue (max 8 words).
    3. "severity": Rate the severity based on public hazards, traffic obstruction, environmental damage, or physical safety risk. Choose exactly one: "Low", "Medium", "High", "Critical".
    4. "severityReason": A 1-sentence explanation of why this severity rating was chosen.
    5. "suggestedDepartment": Suggest the specific municipal department responsible, e.g. "Department of Public Works", "Bureau of Street Lighting", "Waste & Sanitation Authority", "Parks and Recreation Department", "Water and Power Utility", "Transportation Authority".
    6. "initialActionStep": Suggest the logical first action step the department should take (max 12 words).

    Return ONLY the raw JSON. Do NOT wrap it in markdown block fences.`;

    const contents: any[] = [];
    let userParts: any[] = [];

    if (imageBase64 && imageBase64.startsWith("data:image")) {
      const match = imageBase64.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];

        userParts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      }
    }

    // ALWAYS add text prompt
    userParts.push({ text: prompt });

    contents.push({
      role: "user",
      parts: userParts
    });    

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text =
    response.candidates?.[0]?.content?.parts
      ?.map(p => p.text)
      .join("") ||
    response.text ||
    "{}";
    
    let parsed;
    try {
      try {
        parsed = JSON.parse(text.trim());
      } catch (e) {
        console.error("Raw Gemini output:", text);
        return generateFallbackAnalysis(description, imageBase64);
      }
    } catch (e) {
      console.error("Invalid JSON from Gemini:", text);
      return generateFallbackAnalysis(description, imageBase64);
    }

    // Validate structure and fill in holes if necessary
    const result = {
      category: normalizeCategory(parsed.category),
      title: parsed.title || "Civic Issue Reported",
      severity: (["Low", "Medium", "High", "Critical"].includes(parsed.severity) ? parsed.severity : "Medium") as 'Low' | 'Medium' | 'High' | 'Critical',
      severityReason: parsed.severityReason || "Assessed via CivicLens AI model analysis.",
      suggestedDepartment: parsed.suggestedDepartment || "Department of Public Works",
      initialActionStep: parsed.initialActionStep || "Schedule inspection to evaluate physical site."
    };

    return result;
  } catch (err) {
    console.error("Gemini AI analysis failed, falling back to heuristics:", err);
    return generateFallbackAnalysis(description, imageBase64);
  }
}

// --- API ROUTES ---

// 1. Get all issues
app.get('/api/issues', async (req, res) => {
  try {
    if (useInMemory || !db) {
      const normalizedLocal = inMemoryIssues.map(issue => ({
        ...issue,
        category: normalizeCategory(issue.category)
      }));
      return res.json(normalizedLocal);
    }

    const issuesCol = collection(db, 'issues');
    const snapshot = await getDocs(issuesCol);
    const issuesList: Issue[] = snapshot.docs.map(docDoc => {
      const data = docDoc.data();
      return {
        id: docDoc.id,
        ...data,
        category: normalizeCategory(data.category)
      } as Issue;
    });

    // Sort issues by createdAt descending
    issuesList.sort((a, b) => b.createdAt - a.createdAt);
    res.json(issuesList);
  } catch (error) {
    console.error("Failed to get issues:", error);
    // On Firestore query failure, fall back to in-memory list to keep app running
    const normalizedLocal = inMemoryIssues.map(issue => ({
      ...issue,
      category: normalizeCategory(issue.category)
    }));
    res.json(normalizedLocal);
  }
});

// 2. Submit a new issue
app.post('/api/issues', async (req, res) => {
  const { description, address, reporterName, reporterEmail, imageUrl } = req.body;

  if (!description || !address) {
    return res.status(400).json({ error: "Description and Address are required." });
  }

  try {
    console.log("Analyzing issue with Gemini AI...");
    
    const imageInput = req.body.imageBase64 || req.body.imageUrl;
    const aiAnalysis = await analyzeIssueWithAI(description, imageInput);

    const newIssue: Omit<Issue, 'id'> = {
      title: aiAnalysis.title,
      description: description,
      category: aiAnalysis.category,
      severity: aiAnalysis.severity,
      severityReason: aiAnalysis.severityReason,
      suggestedDepartment: aiAnalysis.suggestedDepartment,
      initialActionStep: aiAnalysis.initialActionStep,
      address: address,
      imageUrl: imageUrl,
      status: 'Submitted',
      upvotes: 0,
      upvotedBy: [],
      reporterName: reporterName || "Anonymous Citizen",
      reporterEmail: reporterEmail || "",
      createdAt: Date.now(),
      timeline: [
        {
          id: `evt-${Date.now()}-1`,
          status: 'Submitted',
          title: 'Civic Report Registered',
          description: `Issue reported at ${address}. Auto-routed to ${aiAnalysis.suggestedDepartment}.`,
          timestamp: Date.now(),
          author: 'System'
        },
        {
          id: `evt-${Date.now()}-2`,
          status: 'Submitted',
          title: 'AI Diagnostic Check Completed',
          description: `Automatic category matches '${aiAnalysis.category}' with severity set to ${aiAnalysis.severity} (${aiAnalysis.severityReason}).`,
          timestamp: Date.now(),
          author: 'System'
        }
      ]
    };

    if (useInMemory || !db) {
      const savedIssue: Issue = {
        id: `local-issue-${Date.now()}`,
        ...newIssue
      };
      inMemoryIssues.unshift(savedIssue);
      return res.status(201).json(savedIssue);
    }

    const issuesCol = collection(db, 'issues');
    const docRef = await addDoc(issuesCol, newIssue);
    const savedIssue: Issue = {
      id: docRef.id,
      ...newIssue
    };

    res.status(201).json(savedIssue);
  } catch (error) {
    console.error("Failed to save issue:", error);
    res.status(500).json({ error: "Failed to submit civic report." });
  }
});

// 3. Upvote an issue
app.post('/api/issues/:id/upvote', async (req, res) => {
  const { id } = req.params;
  const { sessionId } = req.body; // standard device or browser session string to avoid duplicates

  if (!sessionId) {
    return res.status(400).json({ error: "Session ID is required to upvote." });
  }

  try {
    if (useInMemory || !db) {
      const issue = inMemoryIssues.find(i => i.id === id);
      if (!issue) {
        return res.status(404).json({ error: "Issue not found" });
      }

      if (!issue.upvotedBy) {
        issue.upvotedBy = [];
      }

      const upvotedIndex = issue.upvotedBy.indexOf(sessionId);
      if (upvotedIndex > -1) {
        // Toggle off upvote
        issue.upvotedBy.splice(upvotedIndex, 1);
        issue.upvotes = Math.max(0, issue.upvotes - 1);
      } else {
        // Upvote
        issue.upvotedBy.push(sessionId);
        issue.upvotes += 1;
      }

      return res.json({
        ...issue,
        category: normalizeCategory(issue.category)
      });
    }

    const issueRef = doc(db, 'issues', id);
    const docSnap = await getDoc(issueRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: "Issue not found" });
    }

    const issueData = docSnap.data() as Issue;
    const upvotedByList = issueData.upvotedBy || [];
    let updatedUpvotes = issueData.upvotes || 0;
    
    const upvoteIndex = upvotedByList.indexOf(sessionId);
    if (upvoteIndex > -1) {
      // Toggle off
      upvotedByList.splice(upvoteIndex, 1);
      updatedUpvotes = Math.max(0, updatedUpvotes - 1);
    } else {
      // Toggle on
      upvotedByList.push(sessionId);
      updatedUpvotes += 1;
    }

    await updateDoc(issueRef, {
      upvotes: updatedUpvotes,
      upvotedBy: upvotedByList
    });

    res.json({
      id,
      ...issueData,
      category: normalizeCategory(issueData.category),
      upvotes: updatedUpvotes,
      upvotedBy: upvotedByList
    });
  } catch (error) {
    console.error("Upvote failed:", error);
    res.status(500).json({ error: "Failed to upvote report." });
  }
});

// 4. Update status or add official update (Admin/Department simulation)
app.post('/api/issues/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, title, description, author } = req.body;

  if (!status || !description) {
    return res.status(400).json({ error: "Status and Description are required." });
  }

  try {
    const newEvent: TimelineEvent = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status,
      title: title || `Status updated to ${status}`,
      description,
      timestamp: Date.now(),
      author: author || 'Department'
    };

    if (useInMemory || !db) {
      const issue = inMemoryIssues.find(i => i.id === id);
      if (!issue) {
        return res.status(404).json({ error: "Issue not found" });
      }

      issue.status = status;
      issue.timeline.push(newEvent);
      return res.json(issue);
    }

    const issueRef = doc(db, 'issues', id);
    const docSnap = await getDoc(issueRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: "Issue not found" });
    }

    const currentData = docSnap.data() as Issue;
    const updatedTimeline = [...(currentData.timeline || []), newEvent];

    await updateDoc(issueRef, {
      status: status,
      timeline: updatedTimeline
    });

    res.json({
      id,
      ...currentData,
      status,
      timeline: updatedTimeline
    });
  } catch (error) {
    console.error("Status update failed:", error);
    res.status(500).json({ error: "Failed to update issue status." });
  }
});

// 5. Add community comment
app.post('/api/issues/:id/comment', async (req, res) => {
  const { id } = req.params;
  const { comment, authorName } = req.body;

  if (!comment) {
    return res.status(400).json({ error: "Comment text is required." });
  }

  try {
    const newCommentEvent: TimelineEvent = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'Note',
      title: 'Community Update',
      description: comment,
      timestamp: Date.now(),
      author: 'Citizen'
    };

    if (useInMemory || !db) {
      const issue = inMemoryIssues.find(i => i.id === id);
      if (!issue) {
        return res.status(404).json({ error: "Issue not found" });
      }
      issue.timeline.push(newCommentEvent);
      return res.json(issue);
    }

    const issueRef = doc(db, 'issues', id);
    const docSnap = await getDoc(issueRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: "Issue not found" });
    }

    const currentData = docSnap.data() as Issue;
    const updatedTimeline = [...(currentData.timeline || []), newCommentEvent];

    await updateDoc(issueRef, {
      timeline: updatedTimeline
    });

    res.json({
      id,
      ...currentData,
      timeline: updatedTimeline
    });
  } catch (error) {
    console.error("Comment submission failed:", error);
    res.status(500).json({ error: "Failed to add comment." });
  }
});

// --- VITE MIDDLEWARE CONFIGURATION ---

if (process.env.NODE_ENV !== "production") {
  import('vite').then(async (viteModule) => {
    const vite = await viteModule.createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted successfully.");
  });
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start Listening
app.listen(PORT, '0.0.0.0', () => {
  console.log(`CivicLens Fullstack Server running at http://0.0.0.0:${PORT}`);
});


