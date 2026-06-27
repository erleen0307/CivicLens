import React, { useState } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  MessageSquare, 
  Send, 
  Sparkles, 
  ShieldAlert, 
  Building, 
  Footprints, 
  User, 
  CheckCircle2, 
  Loader2,
  Lock,
  RotateCcw
} from 'lucide-react';
import { Issue, TimelineEvent } from '../types';
import { getCategoryIcon, getSeverityColor, getStatusColor } from './IssueCard';

interface IssueDetailsProps {
  issue: Issue;
  onBack: () => void;
  onAddComment: (id: string, text: string) => Promise<void>;
  onUpdateStatus: (id: string, status: string, title: string, desc: string, author: string) => Promise<void>;
  onUpvote: (id: string) => void;
  isUpvoted: boolean;
}

export default function IssueDetails({
  issue,
  onBack,
  onAddComment,
  onUpdateStatus,
  onUpvote,
  isUpvoted
}: IssueDetailsProps) {
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Department Admin Simulation State
  const [adminMode, setAdminMode] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Issue['status']>('Investigating');
  const [statusTitle, setStatusTitle] = useState('');
  const [statusDesc, setStatusDesc] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Status index for timeline visualization
  const statusSteps: Issue['status'][] = ['Submitted', 'Investigating', 'In Progress', 'Resolved'];
  const currentStepIndex = statusSteps.indexOf(issue.status);

  const formattedDate = new Date(issue.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      await onAddComment(issue.id, commentText);
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusDesc.trim()) return;

    setSubmittingStatus(true);
    try {
      const finalTitle = statusTitle.trim() || `Status updated to ${selectedStatus}`;
      await onUpdateStatus(
        issue.id, 
        selectedStatus, 
        finalTitle, 
        statusDesc, 
        'Department'
      );
      setStatusTitle('');
      setStatusDesc('');
      setAdminMode(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingStatus(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" id={`issue-detail-view-${issue.id}`}>
      {/* Navigation Header */}
      <div className="flex items-center justify-between gap-3">
        <button 
          id="back-to-explorer"
          onClick={onBack}
          className="inline-flex items-center gap-2 py-2 px-3 sm:px-4.5 rounded-lg border border-slate-200/60 bg-white text-xs font-bold text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer"
        >
          <ArrowLeft size={14} className="stroke-[2.5px]" />
          <span className="hidden sm:inline">Back to Issues Feed</span>
          <span className="sm:hidden">Back</span>
        </button>

        <button
          id={`detail-upvote-${issue.id}`}
          onClick={() => onUpvote(issue.id)}
          className={`inline-flex items-center gap-2 py-2 px-3 sm:px-4.5 rounded-lg border text-xs font-bold transition-all duration-200 cursor-pointer ${
            isUpvoted 
              ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-xs' 
              : 'bg-white text-slate-600 border-slate-200/60 hover:bg-slate-50'
          }`}
        >
          <span className="hidden sm:inline">Upvote Report</span>
          <span className="sm:hidden">Upvote</span>
          <span className={`font-mono px-1.5 py-0.5 rounded text-[10px] ${isUpvoted ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 font-bold'}`}>{issue.upvotes}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Card */}
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.03)] p-4 sm:p-6 space-y-6">
            {/* Image */}
            {issue.imageUrl && (
              <div className="w-full h-48 sm:h-72 md:h-96 rounded-lg overflow-hidden bg-slate-50 border border-slate-100">
                <img 
                  src={issue.imageUrl} 
                  alt={issue.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {/* Badges and Title */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold py-1 px-2.5 rounded-md border border-slate-200/40 bg-slate-50 text-slate-600">
                  {getCategoryIcon(issue.category)}
                  <span>{issue.category}</span>
                </span>
                <span className={`inline-flex items-center text-[10px] sm:text-[11px] font-bold py-1 px-2.5 rounded-md border ${getSeverityColor(issue.severity)}`}>
                  {issue.severity}
                </span>
                <span className={`inline-flex items-center text-[10px] sm:text-[11px] font-bold py-1 px-2.5 rounded-md border ${getStatusColor(issue.status)}`}>
                  {issue.status}
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold font-sans text-slate-900 tracking-tight leading-tight">
                  {issue.title}
                </h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] sm:text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-350 shrink-0" />
                    <span className="break-all sm:break-normal">{issue.address}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-355 shrink-0" />
                    <span>Reported {formattedDate}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Issue Description</h5>
              <p className="text-slate-650 leading-relaxed text-sm whitespace-pre-wrap font-medium">
                {issue.description}
              </p>
            </div>

            {/* Reporter Contact */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/50 flex items-center gap-3">
              <div className="p-2 bg-white rounded-md border border-slate-200/40 text-slate-400 shadow-3xs">
                <User size={15} />
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-700">Reported by {issue.reporterName || "Anonymous"}</p>
                <p className="text-slate-400 font-medium">{issue.reporterEmail || "No contact email provided"}</p>
              </div>
            </div>
          </div>

          {/* Interactive Progress Bar */}
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.03)] p-4 sm:p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resolution Progress</h4>
            
            <div className="relative pt-6 pb-2 px-1">
              {/* Line background */}
              <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-slate-100 -translate-y-1/2 rounded-full"></div>
              {/* Active line */}
              <div 
                className="absolute top-1/2 left-6 h-0.5 bg-indigo-600 -translate-y-1/2 rounded-full transition-all duration-500"
                style={{ width: `${(Math.max(0, currentStepIndex) / (statusSteps.length - 1)) * 100}%` }}
              ></div>

              {/* Status Points */}
              <div className="relative flex justify-between">
                {statusSteps.map((step, idx) => {
                  const isDone = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div key={step} className="flex flex-col items-center gap-2">
                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10 text-xs font-bold ${
                        isCurrent 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-4 ring-indigo-50' 
                          : isDone 
                            ? 'bg-emerald-500 text-white border-emerald-500' 
                            : 'bg-white text-slate-350 border-slate-200'
                      }`}>
                        {isDone ? <CheckCircle2 size={13} className="stroke-[2.5px]" /> : <span>{idx + 1}</span>}
                      </div>
                      <span className={`text-[8px] sm:text-[10px] font-bold tracking-tight text-center max-w-[55px] sm:max-w-none transition-colors duration-200 leading-tight ${isCurrent ? 'text-indigo-600' : isDone ? 'text-slate-700' : 'text-slate-400'}`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Discussion & Updates Timeline */}
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.03)] p-4 sm:p-6 space-y-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Discussion & Log</h4>

            {/* Timeline Events list */}
            <div className="space-y-6 relative before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-0.5 before:bg-slate-100">
              {issue.timeline?.map((evt) => {
                const isSystem = evt.author === 'System';
                const isDept = evt.author === 'Department';
                const eventTime = new Date(evt.timestamp).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={evt.id} className="relative pl-8 sm:pl-9 flex items-start gap-3 sm:gap-4">
                    {/* Circle marker */}
                    <div className={`absolute left-0 w-8 h-8 rounded-full border flex items-center justify-center z-10 shrink-0 ${
                      isSystem 
                        ? 'bg-amber-50 border-amber-100 text-amber-600' 
                        : isDept 
                          ? 'bg-indigo-50 border-indigo-100 text-indigo-600' 
                          : 'bg-slate-50 border-slate-200/60 text-slate-500'
                    }`}>
                      {isSystem ? <Sparkles size={12} /> : isDept ? <Building size={12} /> : <User size={12} />}
                    </div>

                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h6 className="text-xs sm:text-sm font-bold text-slate-800 break-words pr-1">
                          {evt.title}
                        </h6>
                        <span className="text-[10px] font-mono text-slate-400 font-semibold shrink-0">
                          {eventTime}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium break-words">
                        {evt.description}
                      </p>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                          isSystem ? 'bg-amber-50 text-amber-600 border border-amber-100/50' : isDept ? 'bg-indigo-50 text-indigo-600 border border-indigo-100/50' : 'bg-slate-100 text-slate-500 border border-slate-200/30'
                        }`}>
                          {evt.author}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Note form */}
            <form onSubmit={handleCommentSubmit} className="pt-4 border-t border-slate-100 flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Write a Note</label>
                <textarea
                  id="community-comment-input"
                  rows={2}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share details, attach context, or provide a citizen update..."
                  className="w-full text-xs rounded-lg border border-slate-200/60 bg-slate-50 px-3.5 py-2.5 text-slate-700 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200 resize-none font-medium"
                />
              </div>
              <button
                id="submit-comment"
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="inline-flex items-center justify-center p-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 hover:shadow-xs transition-all duration-200 shrink-0 cursor-pointer"
              >
                {submittingComment ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} className="stroke-[2.2px]" />}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar AI Diagnosis & Simulation */}
        <div className="space-y-6">
          {/* AI Diagnoses Sidebar */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white rounded-xl p-4 sm:p-6 shadow-md border border-slate-850 space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <Sparkles size={16} className="text-indigo-400 animate-pulse" />
              <h4 className="text-xs font-bold tracking-widest uppercase">AI Expert Diagnosis</h4>
            </div>

            <div className="space-y-5">
              {/* Severity Evaluation */}
              <div className="space-y-2 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                  <ShieldAlert size={13} className="opacity-85" />
                  <span>Severity Rating</span>
                </div>
                <div>
                  <span className="inline-block px-2.5 py-0.5 bg-white/10 rounded text-[10px] font-extrabold border border-white/10 uppercase tracking-wider">
                    {issue.severity}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300/90 leading-relaxed font-medium">
                  {issue.severityReason}
                </p>
              </div>

              {/* Department Routing */}
              <div className="space-y-2 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                  <Building size={13} className="opacity-85" />
                  <span>Routed Department</span>
                </div>
                <p className="text-sm font-bold font-sans text-white tracking-wide">
                  {issue.suggestedDepartment}
                </p>
              </div>

              {/* Suggested First Action */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                  <Footprints size={13} className="opacity-85" />
                  <span>First Action Step</span>
                </div>
                <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-start gap-2.5">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-200 font-medium leading-relaxed">
                    {issue.initialActionStep}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Municipal Responder Simulation Console */}
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.03)] p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building size={14} className="text-slate-400" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Responder Console</h4>
              </div>
              <button
                id="toggle-responder-mode"
                onClick={() => setAdminMode(!adminMode)}
                className={`text-[9px] font-bold px-2 py-1 rounded border uppercase tracking-wider transition-colors duration-200 cursor-pointer ${
                  adminMode 
                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                    : 'bg-slate-50 text-slate-500 border-slate-200/60 hover:bg-slate-100'
                }`}
              >
                {adminMode ? 'Exit Simulation' : 'Unlock Admin'}
              </button>
            </div>

            {!adminMode ? (
              <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-200/40 flex flex-col items-center justify-center text-center py-6 space-y-2">
                <Lock size={16} className="text-slate-350 animate-pulse" />
                <p className="text-xs font-bold text-slate-600">Simulate Municipal response</p>
                <p className="text-[10px] text-slate-400 font-medium max-w-[180px]">
                  Click "Unlock Admin" to step into the shoes of the department responder and advance this issue.
                </p>
              </div>
            ) : (
              <form onSubmit={handleStatusSubmit} className="space-y-4">
                {/* Status Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Change Status</label>
                  <select
                    id="admin-status-select"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as Issue['status'])}
                    className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Investigating">Investigating</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                {/* Event Title */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Event Title</label>
                  <input
                    id="admin-status-title"
                    type="text"
                    value={statusTitle}
                    onChange={(e) => setStatusTitle(e.target.value)}
                    placeholder={`e.g. Crew assigned / Repairs complete`}
                    className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-700 placeholder-slate-400 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Event Description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description / Details</label>
                  <textarea
                    id="admin-status-desc"
                    rows={3}
                    value={statusDesc}
                    onChange={(e) => setStatusDesc(e.target.value)}
                    placeholder="Provide details on the inspection, repairs, or actions taken..."
                    className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-700 placeholder-slate-400 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
                    required
                  />
                </div>

                {/* Submit status */}
                <button
                  id="admin-submit-status"
                  type="submit"
                  disabled={submittingStatus || !statusDesc.trim()}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 font-bold text-xs shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer"
                >
                  {submittingStatus ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} className="stroke-[2.2px]" />}
                  <span>Submit Update</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
