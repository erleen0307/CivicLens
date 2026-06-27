import React from 'react';
import { 
  AlertTriangle, 
  MapPin, 
  ArrowUp, 
  Clock, 
  MessageSquare,
  Wrench,
  Lightbulb,
  Trash2,
  Trees,
  Droplets,
  Share2,
  AlertOctagon,
  Sparkles
} from 'lucide-react';
import { Issue } from '../types';

interface IssueCardProps {
  key?: React.Key;
  issue: Issue;
  onSelect: (issue: Issue) => void;
  onUpvote: (id: string, e?: any) => void;
  isUpvoted: boolean;
}

// Map categories to modern lucide icons
export const getCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('road') || cat.includes('pothole')) return <Wrench size={16} className="text-amber-600" />;
  if (cat.includes('light') || cat.includes('lamp')) return <Lightbulb size={16} className="text-yellow-600" />;
  if (cat.includes('waste') || cat.includes('sanitation') || cat.includes('garbage')) return <Trash2 size={16} className="text-teal-600" />;
  if (cat.includes('public') || cat.includes('park') || cat.includes('space')) return <Trees size={16} className="text-emerald-600" />;
  if (cat.includes('water') || cat.includes('utility') || cat.includes('pipe')) return <Droplets size={16} className="text-blue-600" />;
  if (cat.includes('traffic') || cat.includes('signal') || cat.includes('sign')) return <AlertTriangle size={16} className="text-rose-600" />;
  return <AlertOctagon size={16} className="text-slate-600" />;
};

export const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'Critical': return 'bg-rose-50 text-rose-700 border-rose-100';
    case 'High': return 'bg-orange-50 text-orange-700 border-orange-100';
    case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'Low': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    default: return 'bg-slate-50 text-slate-700 border-slate-100';
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'Submitted': return 'bg-blue-50 text-blue-700 border-blue-100';
    case 'Investigating': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    case 'In Progress': return 'bg-violet-50 text-violet-700 border-violet-100';
    case 'Resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'Archived': return 'bg-slate-50 text-slate-700 border-slate-100';
    default: return 'bg-slate-50 text-slate-700 border-slate-100';
  }
};

export default function IssueCard({
  issue,
  onSelect,
  onUpvote,
  isUpvoted
}: IssueCardProps) {
  const formattedDate = new Date(issue.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Calculate discussion count (TimelineEvent where status is 'Note')
  const commentsCount = issue.timeline?.filter(e => e.status === 'Note').length || 0;

  return (
    <div 
      id={`issue-card-${issue.id}`}
      onClick={() => onSelect(issue)}
      className="group bg-white rounded-xl border border-slate-200/60 hover:border-indigo-500/30 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between h-full"
    >
      {/* Optional Top Image */}
      {issue.imageUrl && (
        <div className="h-40 sm:h-44 w-full overflow-hidden relative bg-slate-50">
          <img 
            src={issue.imageUrl} 
            alt={issue.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md py-1 px-2.5 rounded-lg border border-slate-200/40 text-[10px] font-mono font-bold text-slate-700 flex items-center gap-1.5 shadow-xs">
            <Sparkles size={11} className="text-indigo-600 animate-pulse" />
            AI Analyzed
          </div>
        </div>
      )}

      {/* Main Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-3.5">
          {/* Categories / Badges Row */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold py-1 px-2 rounded-md border border-slate-200/40 bg-slate-50 text-slate-600">
              {getCategoryIcon(issue.category)}
              <span className="truncate max-w-[90px] sm:max-w-none">{issue.category}</span>
            </span>
            <span className={`inline-flex items-center text-[10px] sm:text-[11px] font-bold py-1 px-2 rounded-md border ${getSeverityColor(issue.severity)}`}>
              {issue.severity}
            </span>
            <span className={`inline-flex items-center text-[10px] sm:text-[11px] font-bold py-1 px-2 rounded-md border ${getStatusColor(issue.status)}`}>
              {issue.status}
            </span>
          </div>

          {/* Title & Description */}
          <div className="space-y-1.5">
            <h4 className="text-sm sm:text-base font-bold font-sans text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors duration-200">
              {issue.title}
            </h4>
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {issue.description}
            </p>
          </div>
        </div>

        {/* Location & Metadata footer */}
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin size={13} className="text-slate-400 shrink-0" />
            <span className="truncate font-medium flex-1 min-w-0">{issue.address}</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* Left stats: Date, Comments */}
            <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-400 font-medium min-w-0">
              <span className="flex items-center gap-1 truncate">
                <Clock size={11} className="shrink-0" />
                <span className="truncate">{formattedDate}</span>
              </span>
              {commentsCount > 0 && (
                <span className="flex items-center gap-1 shrink-0">
                  <MessageSquare size={11} />
                  <span>{commentsCount}</span>
                </span>
              )}
            </div>

            {/* Upvote Button */}
            <button
              id={`upvote-btn-${issue.id}`}
              onClick={(e) => onUpvote(issue.id, e)}
              className={`inline-flex items-center gap-1.5 py-1 px-2.5 sm:py-1.5 sm:px-3 rounded-lg border text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer select-none ${
                isUpvoted 
                  ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-xs' 
                  : 'bg-slate-50 text-slate-600 border-slate-200/50 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <ArrowUp size={12} className={`${isUpvoted ? 'animate-bounce' : ''} stroke-[2.2px]`} />
              <span>{issue.upvotes}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
