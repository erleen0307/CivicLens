import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Grid,
  Map,
  Compass,
  Building,
  Heart,
  Loader2,
  ListFilter,
  Check,
  AlertOctagon
} from 'lucide-react';
import { Issue, CommunityStats } from './types';
import StatCard from './components/StatCard';
import IssueCard, { getCategoryIcon } from './components/IssueCard';
import IssueDetails from './components/IssueDetails';
import ReportForm from './components/ReportForm';

export default function App() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'explorer' | 'report'>('dashboard');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'recent' | 'upvotes'>('recent');

  // Device Session ID to prevent multiple upvotes
  const [sessionId, setSessionId] = useState<string>('');

  // Initializing session ID
  useEffect(() => {
    let id = localStorage.getItem('community_hero_session');
    if (!id) {
      id = `session-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('community_hero_session', id);
    }
    setSessionId(id);
  }, []);

  // Fetch issues
  const fetchIssues = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/issues');
      if (response.ok) {
        const data = await response.json();
        setIssues(data);
      }
    } catch (err) {
      console.error("Failed to fetch issues:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  // Dynamic statistics calculations
  const stats = useMemo<CommunityStats>(() => {
    return {
      totalIssues: issues.length,
      resolvedIssues: issues.filter(i => i.status === 'Resolved').length,
      inProgressIssues: issues.filter(i => i.status === 'In Progress' || i.status === 'Investigating').length,
      criticalIssues: issues.filter(i => i.severity === 'Critical' && i.status !== 'Resolved').length,
    };
  }, [issues]);

  // Unique categories list
  const categoriesList = useMemo(() => {
    const list = new Set<string>();
    issues.forEach(i => {
      if (i.category) list.add(i.category);
    });
    return ['All', ...Array.from(list)];
  }, [issues]);

  // Handle report submission
  const handleReportSubmit = async (formData: {
    description: string;
    address: string;
    reporterName?: string;
    reporterEmail?: string;
    imageUrl?: string;
  }) => {
    const response = await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      throw new Error("Failed to submit issue");
    }

    const newIssue = await response.json();
    setIssues(prev => [newIssue, ...prev]);
    return newIssue;
  };

  // Handle upvoting
  const handleUpvote = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // prevent opening detailed card when clicking card's upvote button
    }

    try {
      const response = await fetch(`/api/issues/${id}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      if (response.ok) {
        const updatedIssue = await response.json();
        setIssues(prev => prev.map(issue => issue.id === id ? { ...issue, ...updatedIssue } : issue));
        
        // If the selected issue is the one upvoted, update detail panel state too
        if (selectedIssue && selectedIssue.id === id) {
          setSelectedIssue(prev => prev ? { ...prev, ...updatedIssue } : null);
        }
      }
    } catch (err) {
      console.error("Upvote failed:", err);
    }
  };

  // Handle status update (Admin Simulation)
  const handleUpdateStatus = async (
    id: string, 
    status: string, 
    title: string, 
    desc: string, 
    author: string
  ) => {
    const response = await fetch(`/api/issues/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, title, description: desc, author })
    });

    if (response.ok) {
      const updatedIssue = await response.json();
      setIssues(prev => prev.map(issue => issue.id === id ? { ...issue, ...updatedIssue } : issue));
      setSelectedIssue(updatedIssue);
    } else {
      throw new Error("Failed to update status");
    }
  };

  // Handle adding community comment
  const handleAddComment = async (id: string, text: string) => {
    const response = await fetch(`/api/issues/${id}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: text, authorName: "Citizen" })
    });

    if (response.ok) {
      const updatedIssue = await response.json();
      setIssues(prev => prev.map(issue => issue.id === id ? { ...issue, ...updatedIssue } : issue));
      setSelectedIssue(updatedIssue);
    } else {
      throw new Error("Failed to submit comment");
    }
  };

  // Filtering & Sorting logic
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      const matchesSearch = 
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'All' || issue.category === selectedCategory;
      const matchesStatus = selectedStatus === 'All' || issue.status === selectedStatus;
      const matchesSeverity = selectedSeverity === 'All' || issue.severity === selectedSeverity;

      return matchesSearch && matchesCategory && matchesStatus && matchesSeverity;
    }).sort((a, b) => {
      if (sortBy === 'upvotes') {
        return b.upvotes - a.upvotes;
      }
      return b.createdAt - a.createdAt; // Default to 'recent'
    });
  }, [issues, searchQuery, selectedCategory, selectedStatus, selectedSeverity, sortBy]);

  // Category distribution calculation for Dashboard visual widget
  const categoryStats = useMemo(() => {
    const counts: { [key: string]: number } = {};
    issues.forEach(i => {
      counts[i.category] = (counts[i.category] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [issues]);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans antialiased text-slate-800">
      {/* Banner Top Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-30 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer shrink-0"
            onClick={() => {
              setSelectedIssue(null);
              setActiveTab('dashboard');
            }}
          >
            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-xs">
              <Building2 size={18} className="stroke-[2.5px]" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-black font-sans tracking-tight text-slate-900 leading-none">
                CivicLens
              </h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                AI-Powered Civic Issue Reporting Platform
              </p>
            </div>
          </div>

          {/* Tab Sub-Navigation */}
          <nav className="flex items-center bg-slate-100/80 p-0.5 sm:p-1 rounded-lg border border-slate-200/40 shrink-0">
            <button
              id="nav-tab-dashboard"
              onClick={() => {
                setSelectedIssue(null);
                setActiveTab('dashboard');
              }}
              className={`inline-flex items-center gap-1 sm:gap-1.5 py-1 sm:py-1.5 px-2 sm:px-3.5 rounded-md text-[10px] sm:text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'dashboard' && !selectedIssue
                  ? 'bg-white text-indigo-650 shadow-xs border border-slate-200/20' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Grid size={12} className="stroke-[2px]" />
              <span>Dashboard</span>
            </button>
            <button
              id="nav-tab-explorer"
              onClick={() => {
                setSelectedIssue(null);
                setActiveTab('explorer');
              }}
              className={`inline-flex items-center gap-1 sm:gap-1.5 py-1 sm:py-1.5 px-2 sm:px-3.5 rounded-md text-[10px] sm:text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'explorer' || selectedIssue
                  ? 'bg-white text-indigo-650 shadow-xs border border-slate-200/20' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Compass size={12} className="stroke-[2px]" />
              <span>Feed</span>
            </button>
            <button
              id="nav-tab-report"
              onClick={() => {
                setSelectedIssue(null);
                setActiveTab('report');
              }}
              className={`inline-flex items-center gap-1 sm:gap-1.5 py-1 sm:py-1.5 px-2 sm:px-3.5 rounded-md text-[10px] sm:text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'report' && !selectedIssue
                  ? 'bg-white text-indigo-650 shadow-xs border border-slate-200/20' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Plus size={12} className="stroke-[2.5px]" />
              <span>Report</span>
            </button>
          </nav>

          {/* Quick Stats Header Element */}
          <div className="hidden md:flex items-center gap-4 text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
              <span>System Active</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Body Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="h-[50vh] flex flex-col items-center justify-center space-y-3">
            <Loader2 size={28} className="text-indigo-600 animate-spin stroke-[2px]" />
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Loading Civic Database...</p>
          </div>
        ) : selectedIssue ? (
          /* Issue Details Section */
          <IssueDetails
            issue={selectedIssue}
            onBack={() => setSelectedIssue(null)}
            onAddComment={handleAddComment}
            onUpdateStatus={handleUpdateStatus}
            onUpvote={handleUpvote}
            isUpvoted={selectedIssue.upvotedBy?.includes(sessionId) || false}
          />
        ) : (
          /* Normal Tab sections */
          <div className="space-y-8">
            {/* 1. Dashboard View */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8" id="dashboard-tab-content">
                {/* Statistics Bento Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard 
                    title="Total Reports" 
                    value={stats.totalIssues} 
                    icon={Building2} 
                    description="Issues flagged by citizens"
                    colorClass="text-indigo-650"
                    bgClass="bg-indigo-50/45"
                  />
                  <StatCard 
                    title="Resolved" 
                    value={stats.resolvedIssues} 
                    icon={CheckCircle2} 
                    description="Repairs & cleanup verified"
                    colorClass="text-emerald-650"
                    bgClass="bg-emerald-50/45"
                  />
                  <StatCard 
                    title="In Progress" 
                    value={stats.inProgressIssues} 
                    icon={Clock} 
                    description="Actively being serviced"
                    colorClass="text-slate-700"
                    bgClass="bg-slate-100/60"
                  />
                  <StatCard 
                    title="Critical Warnings" 
                    value={stats.criticalIssues} 
                    icon={AlertTriangle} 
                    description="Require immediate dispatch"
                    colorClass="text-rose-650"
                    bgClass="bg-rose-50/45"
                  />
                </div>

                {/* Dashboard layout blocks */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left columns: Welcome and Category Distribution */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Welcome banner */}
                    <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.03)] space-y-4">
                      <div className="space-y-1.5">
                        <h3 className="text-base font-extrabold font-sans text-slate-900 tracking-tight">Welcome to CivicLens</h3>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                          Empowering citizens to keep our municipality pristine, safe, and efficient. 
                          Report hyperlocal issues—our AI instantly tags, diagnoses severity, and alerts the correct dispatchers.
                        </p>
                      </div>
                      <button
                        id="dashboard-cta-report"
                        onClick={() => setActiveTab('report')}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-xs transition-all duration-200 cursor-pointer"
                      >
                        <Plus size={14} className="stroke-[2.5px]" />
                        <span>File a Civic Report</span>
                      </button>
                    </div>

                    {/* Category Distribution chart widget */}
                    <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.03)] space-y-4">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-50">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reports by Category</h4>
                        <span className="text-[9px] font-mono text-slate-450 font-bold uppercase tracking-wider">Distribution</span>
                      </div>

                      {categoryStats.length === 0 ? (
                        <p className="text-xs text-slate-450 text-center py-6 font-medium">No reports filed yet.</p>
                      ) : (
                        <div className="space-y-3.5">
                          {categoryStats.slice(0, 5).map((cat) => {
                            const percent = (cat.count / stats.totalIssues) * 100;
                            return (
                              <div key={cat.name} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                    {getCategoryIcon(cat.name)}
                                    <span>{cat.name}</span>
                                  </span>
                                  <span className="font-mono text-slate-400 font-bold">{cat.count} ({Math.round(percent)}%)</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                                    style={{ width: `${percent}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right columns: Top/Trending issues in community */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp size={15} className="text-indigo-600 stroke-[2.2px]" />
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trending Local Reports</h4>
                      </div>
                      <button
                        id="view-all-explorer-cta"
                        onClick={() => setActiveTab('explorer')}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors duration-200 cursor-pointer"
                      >
                        View All Issues Feed
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {issues.length === 0 ? (
                        <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200">
                          <p className="text-sm text-slate-400">No reported issues found in the database.</p>
                        </div>
                      ) : (
                        issues
                          .slice()
                          .sort((a, b) => b.upvotes - a.upvotes)
                          .slice(0, 4)
                          .map((issue) => (
                            <IssueCard
                              key={issue.id}
                              issue={issue}
                              onSelect={setSelectedIssue}
                              onUpvote={handleUpvote}
                              isUpvoted={issue.upvotedBy?.includes(sessionId) || false}
                            />
                          ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Issue Explorer / Feed View */}
            {activeTab === 'explorer' && (
              <div className="space-y-6" id="explorer-tab-content">
                {/* Search & Filters Section */}
                <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.03)] space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Search field */}
                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Search size={14} className="stroke-[2.2px]" />
                      </div>
                      <input
                        id="search-issues-input"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search street, keywords, potholes, streetlight..."
                        className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50/55 pl-10 pr-3.5 py-2.5 text-slate-700 placeholder-slate-400 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    {/* Sorting Toggle */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Sort By</span>
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1">
                        <button
                          id="sort-recent"
                          onClick={() => setSortBy('recent')}
                          className={`text-[9px] font-bold py-1.5 px-3 rounded transition-all duration-200 uppercase tracking-wider cursor-pointer ${
                            sortBy === 'recent' 
                              ? 'bg-white text-indigo-650 shadow-3xs' 
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Recent
                        </button>
                        <button
                          id="sort-upvotes"
                          onClick={() => setSortBy('upvotes')}
                          className={`text-[9px] font-bold py-1.5 px-3 rounded transition-all duration-200 uppercase tracking-wider cursor-pointer ${
                            sortBy === 'upvotes' 
                              ? 'bg-white text-indigo-650 shadow-3xs' 
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Upvotes
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Filters row */}
                  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 sm:gap-3 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 tracking-widest shrink-0 py-1">
                      <SlidersHorizontal size={11} className="stroke-[2px]" />
                      <span>Filter Options</span>
                    </span>

                    <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto flex-1">
                      {/* Category Dropdown */}
                      <select
                        id="filter-category"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="text-xs rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 sm:py-1.5 text-slate-600 font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer w-full sm:w-auto"
                      >
                        <option value="All">All Categories</option>
                        {categoriesList.filter(c => c !== 'All').map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>

                      {/* Status Dropdown */}
                      <select
                        id="filter-status"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="text-xs rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 sm:py-1.5 text-slate-600 font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer w-full sm:w-auto"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Investigating">Investigating</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Archived">Archived</option>
                      </select>

                      {/* Severity Dropdown */}
                      <select
                        id="filter-severity"
                        value={selectedSeverity}
                        onChange={(e) => setSelectedSeverity(e.target.value)}
                        className="text-xs rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 sm:py-1.5 text-slate-600 font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer w-full sm:w-auto"
                      >
                        <option value="All">All Severities</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>

                    {/* Clear Filters CTA */}
                    {(selectedCategory !== 'All' || selectedStatus !== 'All' || selectedSeverity !== 'All' || searchQuery !== '') && (
                      <button
                        id="clear-filters-btn"
                        onClick={() => {
                          setSelectedCategory('All');
                          setSelectedStatus('All');
                          setSelectedSeverity('All');
                          setSearchQuery('');
                        }}
                        className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center justify-center sm:justify-start gap-1 py-1 sm:py-0 mt-1 sm:mt-0 sm:ml-auto cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Explorer list grid */}
                {filteredIssues.length === 0 ? (
                  <div className="bg-white rounded-xl border border-dashed border-slate-200 p-16 text-center space-y-4">
                    <div className="p-3 bg-slate-50 rounded-full border border-slate-200/40 text-slate-450 inline-block shadow-3xs">
                      <ListFilter size={20} className="stroke-[2.2px]" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-slate-800">No Matching Reports</h4>
                      <p className="text-xs text-slate-450 max-w-sm mx-auto leading-relaxed font-medium">
                        We couldn't find any issues matching your search terms or filters. Try removing filters or clearing the search text.
                      </p>
                    </div>
                    <button
                      id="explorer-reset-filters"
                      onClick={() => {
                        setSelectedCategory('All');
                        setSelectedStatus('All');
                        setSelectedSeverity('All');
                        setSearchQuery('');
                      }}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-4.5 rounded-lg border border-slate-250 bg-white hover:bg-slate-50 font-bold text-xs text-slate-600 transition-colors duration-200 cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredIssues.map((issue) => (
                      <IssueCard
                        key={issue.id}
                        issue={issue}
                        onSelect={setSelectedIssue}
                        onUpvote={handleUpvote}
                        isUpvoted={issue.upvotedBy?.includes(sessionId) || false}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. Report Issue Wizard View */}
            {activeTab === 'report' && (
              <div id="report-tab-content">
                <ReportForm
                  onSubmit={handleReportSubmit}
                  onViewIssue={(issue) => {
                    setSelectedIssue(issue);
                    setActiveTab('explorer');
                  }}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Humble Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12 text-center text-xs text-slate-400 font-medium">
        <p>© 2026 CivicLens Civic Action Initiative. Driven by Google Gemini AI.</p>
      </footer>
    </div>
  );
}
