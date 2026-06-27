export interface Issue {
  id: string;
  title: string;       // AI generated concise title
  description: string; // Original description
  category: string;    // AI detected category
  severity: 'Low' | 'Medium' | 'High' | 'Critical'; // AI detected severity
  severityReason: string; // AI reasoning
  suggestedDepartment: string; // AI suggested department
  initialActionStep: string; // AI suggested first step
  address: string;     // Location address
  imageUrl?: string;   // Image (data URL or empty)
  status: 'Submitted' | 'Investigating' | 'In Progress' | 'Resolved' | 'Archived';
  upvotes: number;
  upvotedBy?: string[]; // Array of session IDs to prevent duplicate upvotes
  reporterName?: string;
  reporterEmail?: string;
  createdAt: number;
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  id: string;
  status: 'Submitted' | 'Investigating' | 'In Progress' | 'Resolved' | 'Archived' | 'Note';
  title: string;
  description: string;
  timestamp: number;
  author: 'System' | 'Department' | 'Citizen';
}

export interface CommunityStats {
  totalIssues: number;
  resolvedIssues: number;
  inProgressIssues: number;
  criticalIssues: number;
}
