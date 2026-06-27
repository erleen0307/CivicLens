import React, { useState, useRef } from 'react';
import { 
  Upload, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  X, 
  Loader2, 
  ShieldAlert, 
  Building, 
  Footprints,
  Eye
} from 'lucide-react';
import { Issue } from '../types';

interface ReportFormProps {
  onSubmit: (data: {
    description: string;
    address: string;
    reporterName?: string;
    reporterEmail?: string;
    imageUrl?: string;
  }) => Promise<Issue>;
  onViewIssue: (issue: Issue) => void;
}

const AI_STEPS = [
  "Structuring report description...",
  "Running visual diagnostics on photo...",
  "Analyzing safety hazards and severity level...",
  "Determining municipal category...",
  "Auto-routing to responsible department...",
  "Creating first action items for dispatchers..."
];

export default function ReportForm({ onSubmit, onViewIssue }: ReportFormProps) {
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  
  // Image states
  const [image, setImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission/AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiStepIndex, setAiStepIndex] = useState(0);
  const [successIssue, setSuccessIssue] = useState<Issue | null>(null);

  // Custom UI Validation states
  const [errors, setErrors] = useState<{
    image?: string;
    description?: string;
    address?: string;
    general?: string;
  }>({});

  const [touched, setTouched] = useState<{
    image?: boolean;
    description?: boolean;
    address?: boolean;
  }>({});

  const [shakeFields, setShakeFields] = useState<{
    image?: boolean;
    description?: boolean;
    address?: boolean;
  }>({});

  const triggerShake = (field: 'image' | 'description' | 'address') => {
    setShakeFields(prev => ({ ...prev, [field]: true }));
    setTimeout(() => {
      setShakeFields(prev => ({ ...prev, [field]: false }));
    }, 400);
  };

  // Handle Drag & Drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, image: "Please upload a valid image file (PNG, JPG, JPEG)." }));
      triggerShake('image');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setErrors(prev => ({ ...prev, image: undefined }));
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (touched.image) {
      setErrors(prev => ({ ...prev, image: "Photo is required to help us analyze the issue." }));
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setDescription(val);
    if (val.trim()) {
      setErrors(prev => ({ ...prev, description: undefined }));
    } else if (touched.description) {
      setErrors(prev => ({ ...prev, description: "Please describe the issue before submitting." }));
    }
  };

  const handleDescriptionBlur = () => {
    setTouched(prev => ({ ...prev, description: true }));
    if (!description.trim()) {
      setErrors(prev => ({ ...prev, description: "Please describe the issue before submitting." }));
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAddress(val);
    if (val.trim()) {
      setErrors(prev => ({ ...prev, address: undefined }));
    } else if (touched.address) {
      setErrors(prev => ({ ...prev, address: "Please provide a location/address." }));
    }
  };

  const handleAddressBlur = () => {
    setTouched(prev => ({ ...prev, address: true }));
    if (!address.trim()) {
      setErrors(prev => ({ ...prev, address: "Please provide a location/address." }));
    }
  };

  // Submit report and trigger step-by-step AI animation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear general error states
    setErrors(prev => ({ ...prev, general: undefined }));

    const hasImage = !!image;
    const hasDesc = !!description.trim();
    const hasAddr = !!address.trim();

    const newErrors: typeof errors = {};
    let firstInvalidField: 'image' | 'description' | 'address' | null = null;

    if (!hasImage) {
      newErrors.image = "Photo is required to help us analyze the issue.";
      firstInvalidField = firstInvalidField || 'image';
      triggerShake('image');
    }
    if (!hasDesc) {
      newErrors.description = "Please describe the issue before submitting.";
      firstInvalidField = firstInvalidField || 'description';
      triggerShake('description');
    }
    if (!hasAddr) {
      newErrors.address = "Please provide a location/address.";
      firstInvalidField = firstInvalidField || 'address';
      triggerShake('address');
    }

    setTouched({
      image: true,
      description: true,
      address: true
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }));
      
      // Smoothly scroll to the first missing field
      if (firstInvalidField) {
        const targetId = firstInvalidField === 'image' 
          ? 'file-upload-dropzone' 
          : firstInvalidField === 'description' 
            ? 'report-description' 
            : 'report-address';
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsAnalyzing(true);
    setAiStepIndex(0);

    // Animate the AI processing steps
    const stepInterval = setInterval(() => {
      setAiStepIndex(prev => {
        if (prev < AI_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1200);

    try {
      const savedIssue = await onSubmit({
        description,
        address,
        reporterName: reporterName || "Anonymous Citizen",
        reporterEmail,
        imageUrl: image || undefined
      });

      // Give it an extra second on the final step before showing success
      setTimeout(() => {
        clearInterval(stepInterval);
        setSuccessIssue(savedIssue);
        setIsAnalyzing(false);
        
        // Reset form & state
        setDescription('');
        setAddress('');
        setReporterName('');
        setReporterEmail('');
        setImage(null);
        setErrors({});
        setTouched({});
      }, 1500);

    } catch (err) {
      clearInterval(stepInterval);
      setIsAnalyzing(false);
      console.error("SERVER ERROR:", err);
      setErrors(prev => ({ ...prev, general: "Submission failed. Please try again." }));
    }
  };

  const isFormEmpty = !image || !description.trim() || !address.trim();

  return (
    <div className="max-w-2xl mx-auto" id="report-issue-form-container">
      {/* AI Analyzing Overlay State */}
      {isAnalyzing && (
        <div id="ai-analyzing-panel" className="bg-white rounded-xl border border-slate-200/60 p-4 sm:p-8 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06),0_12px_40px_-6px_rgba(0,0,0,0.04)] text-center py-10 sm:py-16 space-y-6 sm:space-y-8 flex flex-col items-center">
          <div className="relative">
            {/* Pulsing visual circles */}
            <div className="absolute inset-0 bg-indigo-150 rounded-full scale-150 animate-ping opacity-20"></div>
            <div className="relative p-4 sm:p-5 bg-indigo-50 rounded-full border border-indigo-100 text-indigo-600 shadow-sm">
              <Loader2 size={32} className="animate-spin stroke-[2px]" />
            </div>
          </div>

          <div className="space-y-2 max-w-md">
            <h3 className="text-base sm:text-lg font-bold font-sans text-slate-900 flex items-center justify-center gap-2">
              <Sparkles size={16} className="text-indigo-600 animate-pulse" />
              <span className="tracking-tight">Analyzing Civic Report...</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed min-h-[40px] px-2">
              {AI_STEPS[aiStepIndex]}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-xs sm:max-w-sm h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-600 to-slate-900 transition-all duration-1000 ease-out"
              style={{ width: `${((aiStepIndex + 1) / AI_STEPS.length) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Success View State */}
      {!isAnalyzing && successIssue && (
        <div id="report-success-panel" className="bg-white rounded-xl border border-slate-200/60 p-4 sm:p-8 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06),0_12px_40px_-6px_rgba(0,0,0,0.04)] space-y-5 sm:space-y-6">
          <div className="flex flex-col items-center text-center space-y-2 border-b border-slate-100 pb-5 sm:pb-6">
            <div className="p-2.5 bg-emerald-50 rounded-full border border-emerald-200/60 text-emerald-600 mb-1 sm:mb-2 shadow-2xs">
              <CheckCircle2 size={26} className="stroke-[2.5px]" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-sans text-slate-900 tracking-tight">Civic Report Registered</h3>
            <p className="text-xs text-slate-500 max-w-sm font-medium leading-relaxed px-2">
              Your issue has been logged, analyzed by AI, and routed to the municipal team.
            </p>
          </div>

          {/* AI Diagnosis Insights */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Generated Diagnosis</h4>
            
            <div className="p-4 sm:p-5 bg-slate-50/50 rounded-lg border border-slate-200/50 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category & Department */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-450 uppercase flex items-center gap-1.5 tracking-wider">
                    <Building size={11} />
                    <span>Routing</span>
                  </span>
                  <p className="text-xs font-bold text-slate-800">{successIssue.category}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{successIssue.suggestedDepartment}</p>
                </div>

                {/* Severity */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-450 uppercase flex items-center gap-1.5 tracking-wider">
                    <ShieldAlert size={11} />
                    <span>Severity</span>
                  </span>
                  <p className="text-xs font-bold text-slate-800">{successIssue.severity}</p>
                  <p className="text-[11px] text-slate-500 font-medium leading-snug">{successIssue.severityReason}</p>
                </div>
              </div>

              {/* Action item */}
              <div className="pt-3.5 border-t border-slate-200/60 space-y-1.5">
                <div className="text-[9px] font-bold text-slate-450 uppercase flex items-center gap-1.5 tracking-wider">
                  <Footprints size={11} />
                  <span>First Suggested Action Step</span>
                </div>
                <p className="text-xs text-slate-650 font-semibold bg-white p-2.5 rounded-md border border-slate-200/50 leading-relaxed shadow-3xs">
                  {successIssue.initialActionStep}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1.5 sm:pt-2">
            <button
              id="success-view-details"
              onClick={() => onViewIssue(successIssue)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-xs transition-all duration-200 cursor-pointer"
            >
              <Eye size={14} className="stroke-[2px]" />
              <span>View Full Progress</span>
            </button>
            <button
              id="success-report-another"
              onClick={() => setSuccessIssue(null)}
              className="flex-1 py-2.5 px-4 rounded-lg border border-slate-250 bg-white text-slate-600 hover:text-slate-900 font-bold text-xs hover:bg-slate-55 transition-all duration-200 cursor-pointer"
            >
              <span>Report Another Issue</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Report Form */}
      {!isAnalyzing && !successIssue && (
        <form noValidate onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200/60 p-4 sm:p-6 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.03)] space-y-5 sm:space-y-6">
          <div className="space-y-1.5 border-b border-slate-100 pb-4">
            <h3 className="text-base sm:text-lg font-extrabold font-sans text-slate-900 tracking-tight">File a Hyperlocal Report</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Provide as much detail as possible. Our AI engine will automatically tag, assess severity, and alert dispatchers.
            </p>
          </div>

          {/* General Error Banner */}
          {errors.general && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200/60 text-rose-750 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-2xs">
              <ShieldAlert size={14} className="text-rose-600 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          <div className="space-y-4 sm:space-y-5">
            {/* Image Drag & Drop Upload */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <span>Attach Photo (Mandatory)</span>
                <span className="text-rose-500 font-black text-xs leading-none">*</span>
              </label>
              
              <div 
                id="file-upload-dropzone"
                onClick={triggerFileSelect}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-32 sm:min-h-40 ${
                  shakeFields.image ? 'animate-shake border-rose-500' : ''
                } ${
                  errors.image 
                    ? 'border-rose-400 bg-rose-50/10' 
                    : isDragging 
                      ? 'border-indigo-500 bg-indigo-50/20' 
                      : image 
                        ? 'border-slate-250 bg-slate-50/40 p-2' 
                        : 'border-slate-250 bg-slate-50/50 hover:bg-slate-55'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {image ? (
                  <div className="relative w-full h-36 sm:h-48 rounded-md overflow-hidden group border border-slate-200/40">
                    <img 
                      src={image} 
                      alt="Uploaded civic issue" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <p className="text-white text-xs font-bold">Change Photo</p>
                    </div>
                    <button
                      id="remove-uploaded-image"
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded bg-slate-900/70 hover:bg-slate-900 text-white transition-colors duration-200 shadow-sm cursor-pointer border-0"
                    >
                      <X size={13} className="stroke-[2.5px]" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 py-2 sm:py-4">
                    <div className="p-2 bg-white rounded-md text-slate-400 shadow-3xs border border-slate-200/40 inline-block">
                      <Upload size={15} className="stroke-[2.2px]" />
                    </div>
                    <div className="space-y-1 px-2">
                      <p className="text-xs font-bold text-slate-700 leading-snug">
                        Drag and drop your image, or <span className="text-indigo-600 hover:underline">browse files</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">Supports PNG, JPG, JPEG up to 10MB</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Photo Error message */}
              {errors.image && (
                <p className="text-xs text-rose-600 font-extrabold mt-1.5 flex items-center gap-1.5 animate-fade-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block shrink-0"></span>
                  <span>{errors.image}</span>
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <span>Issue Description</span>
                <span className="text-rose-500 font-black text-xs leading-none">*</span>
              </label>
              <textarea
                id="report-description"
                rows={4}
                value={description}
                onChange={handleDescriptionChange}
                onBlur={handleDescriptionBlur}
                placeholder="What is happening? Describe the pothole size, streetlight number, visible water flooding, blockage scale, or street names nearby..."
                className={`w-full text-xs rounded-lg border bg-slate-50/55 px-3.5 py-2.5 text-slate-700 placeholder-slate-400 font-medium focus:outline-hidden focus:ring-2 focus:bg-white focus:border-transparent transition-all duration-200 resize-none ${
                  shakeFields.description ? 'animate-shake border-rose-500' : ''
                } ${
                  errors.description 
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/5' 
                    : 'border-slate-200 focus:ring-indigo-500'
                }`}
              />

              {/* Description Error message */}
              {errors.description && (
                <p className="text-xs text-rose-600 font-extrabold mt-1.5 flex items-center gap-1.5 animate-fade-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block shrink-0"></span>
                  <span>{errors.description}</span>
                </p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <span>Location / Address</span>
                <span className="text-rose-500 font-black text-xs leading-none">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MapPin size={13} className="stroke-[2.2px]" />
                </div>
                <input
                  id="report-address"
                  type="text"
                  value={address}
                  onChange={handleAddressChange}
                  onBlur={handleAddressBlur}
                  placeholder="e.g. 1024 Elm Street, or Downtown Civic Plaza"
                  className={`w-full text-xs rounded-lg border bg-slate-50/55 pl-10 pr-3.5 py-2.5 text-slate-700 placeholder-slate-400 font-medium focus:outline-hidden focus:ring-2 focus:bg-white focus:border-transparent transition-all duration-200 ${
                    shakeFields.address ? 'animate-shake border-rose-500' : ''
                  } ${
                    errors.address 
                      ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/5' 
                      : 'border-slate-200 focus:ring-indigo-500'
                  }`}
                />
              </div>

              {/* Address Error message */}
              {errors.address && (
                <p className="text-xs text-rose-600 font-extrabold mt-1.5 flex items-center gap-1.5 animate-fade-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block shrink-0"></span>
                  <span>{errors.address}</span>
                </p>
              )}
            </div>

            {/* Reporter Profile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Name (Optional)</label>
                <input
                  id="report-name"
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Sarah Jenkins"
                  className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50/55 px-3.5 py-2.5 text-slate-700 placeholder-slate-400 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-transparent transition-all duration-200"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Email (Optional)</label>
                <input
                  id="report-email"
                  type="email"
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                  placeholder="sarah.j@example.com"
                  className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50/55 px-3.5 py-2.5 text-slate-700 placeholder-slate-400 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="report-submit-btn"
            type="submit"
            disabled={isAnalyzing}
            className={`w-full inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-lg font-bold text-xs transition-all duration-200 cursor-pointer ${
              isAnalyzing
                ? 'bg-slate-100 text-slate-450 cursor-not-allowed shadow-none'
                : isFormEmpty
                  ? 'bg-indigo-600/75 text-white/95 hover:bg-indigo-600 shadow-3xs'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs hover:shadow-md hover:shadow-indigo-100'
            }`}
          >
            <Sparkles size={14} className="stroke-[2px] animate-pulse" />
            <span>Submit Report & Run AI Diagnosis</span>
          </button>
        </form>
      )}
    </div>
  );
}
