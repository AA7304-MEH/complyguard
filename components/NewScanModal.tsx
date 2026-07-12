import * as React from 'react';
import { createScan, getFrameworks } from '../services/apiClient';
import { AuditScan, Framework, AuditStatus } from '../types';
import Spinner from './common/Spinner';
import { FileIcon } from './icons/FileIcon';
import { useUser } from '@clerk/clerk-react';

interface NewScanModalProps {
  onClose: () => void;
  onScanStart: (newScan: AuditScan) => void;
  onUpgrade?: () => void;
  initialFiles?: File[];
}

const NewScanModal: React.FC<NewScanModalProps> = ({ onClose, onScanStart, onUpgrade, initialFiles }) => {
  const { user } = useUser();
  const [files, setFiles] = React.useState<File[]>([]);
  const [frameworks, setFrameworks] = React.useState<Framework[]>([]);
  const [frameworkId, setFrameworkId] = React.useState<string>('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const folderInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFolderName, setSelectedFolderName] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [manualText, setManualText] = React.useState('');
  const [inputType, setInputType] = React.useState<'file' | 'text'>('file');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      const validFiles = droppedFiles.filter(f => {
        const ext = f.name.split('.').pop()?.toLowerCase();
        return ['txt', 'md', 'pdf', 'doc', 'docx'].includes(ext || '');
      });

      if (validFiles.length > 0) {
        const oversizeFiles = validFiles.filter(f => f.size > 10 * 1024 * 1024);
        if (oversizeFiles.length > 0) {
          setError("File size limit exceeded. Each file must be under 10MB.");
          return;
        }
        setFiles(validFiles);
        if (validFiles.length === 1) {
          setSelectedFolderName(null);
        } else {
          setSelectedFolderName(`${validFiles.length} files selected`);
        }
        setError(null);
      } else {
        setError("Please upload .txt, .md, .pdf, or Word files.");
      }
    }
  };

  React.useEffect(() => {
    const fetchFrameworks = async () => {
      const fwData = await getFrameworks();
      setFrameworks(fwData);
      if (fwData.length > 0) {
        setFrameworkId(fwData[0].id);
      }
    }
    fetchFrameworks();

    // If initial files are provided (e.g. from global drag-drop), use them immediately
    if (initialFiles && initialFiles.length > 0) {
      const validFiles = initialFiles.filter(f => {
        const ext = f.name.split('.').pop()?.toLowerCase();
        return ['txt', 'md', 'pdf', 'doc', 'docx'].includes(ext || '');
      });

      if (validFiles.length > 0) {
        setFiles(validFiles);
        if (validFiles.length > 1) {
            setSelectedFolderName(`${validFiles.length} files selected`);
        }
      }
    }
  }, [initialFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(f => {
        const ext = f.name.split('.').pop()?.toLowerCase();
        return ['txt', 'md', 'pdf', 'doc', 'docx'].includes(ext || '');
      });

      if (validFiles.length === 0) {
        setError("Please upload .txt, .md, .pdf, or Word files.");
        return;
      }

      const oversizeFiles = validFiles.filter(f => f.size > 10 * 1024 * 1024);
      if (oversizeFiles.length > 0) {
        setError("File size limit exceeded. Each file must be under 10MB.");
        return;
      }
      setFiles(validFiles);
      setSelectedFolderName(null);
      setError(null);
    }
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fdFiles = Array.from(e.target.files);
      const validFiles = fdFiles.filter(f => {
        const ext = f.name.split('.').pop()?.toLowerCase();
        return ['txt', 'md', 'pdf', 'doc', 'docx'].includes(ext || '');
      });

      if (validFiles.length > 0) {
        const oversizeFiles = validFiles.filter(f => f.size > 10 * 1024 * 1024);
        if (oversizeFiles.length > 0) {
          setError("File size limit exceeded. Checked files in folder are over the 10MB limit.");
          return;
        }
        setFiles(validFiles);
        setSelectedFolderName(`${validFiles.length} files in folder`);
        setError(null);
      } else {
        setError("No compatible compliance documents found in the selected folder.");
      }
    }
  };

  const handleStartScan = async () => {
    const hasFiles = inputType === 'file' && files.length > 0;
    const hasText = inputType === 'text' && manualText.trim().length > 0;

    if ((!hasFiles && !hasText) || !frameworkId) {
      setError("Please provide a document (file or text) and select a framework.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      let scan;
      const email = user?.primaryEmailAddress?.emailAddress;
      const userId = user?.id || 'anonymous';
      
      if (inputType === 'text') {
        scan = await createScan(userId, frameworkId, manualText, email);
      } else {
        const file = files[0];
        const base64File = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
        scan = await createScan(userId, frameworkId, undefined, email, base64File, file.name);
      }

      // Add the new scan (either Completed or Queued) to the dashboard.
      onScanStart(scan);

      if (scan.status === AuditStatus.Queued) {
        // Inform the user ONLY if it was queued
        alert("Our AI is busy right now. We'll email your report in a few minutes. Check the dashboard for status updates.");
      }

      // Close the modal.
      onClose();

    } catch (err: any) {
      console.error("Failed to start scan:", err);
      if (err.message?.includes("credits") || err.message === "SCAN_LIMIT_REACHED") {
        setError("You have no credits remaining. Please upgrade your plan to continue.");
      } else {
        // Show the actual error message for better debugging as requested
        setError(`Could not start the scan: ${err.message || "Unknown error"}.`);
      }
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-2xl p-8 w-full max-w-xl transform scale-100 transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Start Compliance Scan</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2">Regulatory Framework</label>
            <div className="relative">
              <select
                value={frameworkId}
                onChange={(e) => setFrameworkId(e.target.value)}
                className="block w-full pl-4 pr-10 py-3 text-sm font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer appearance-none"
                disabled={frameworks.length === 0}
              >
                {frameworks.length === 0 ? (
                  <option>Loading frameworks...</option>
                ) : (
                  (() => {
                    const groups: Record<string, typeof frameworks> = {};
                    frameworks.forEach(fw => {
                      const category = (fw as any).category || 'International';
                      if (!groups[category]) groups[category] = [];
                      groups[category].push(fw);
                    });
                    
                    const categoriesOrder = [
                      'International', 
                      'India - RBI', 
                      'India - Regulatory', 
                      'India - Data Protection', 
                      'India - Insurance', 
                      'India - Capital Markets'
                    ];

                    return categoriesOrder.map(category => {
                      const fws = groups[category];
                      if (!fws || fws.length === 0) return null;
                      return (
                        <optgroup key={category} label={`── ${category} ──`}>
                          {fws.map(fw => (
                            <option key={fw.id} value={fw.id}>
                              {(fw as any).label || fw.name}
                            </option>
                          ))}
                        </optgroup>
                      );
                    });
                  })()
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Input Type Selection */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2">Source Type</label>
            <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200/60 shadow-inner">
              <button
                type="button"
                onClick={() => setInputType('file')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  inputType === 'file' 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Upload Policy Documents
              </button>
              <button
                id="btn-paste-text"
                type="button"
                onClick={() => setInputType('text')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  inputType === 'text' 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Paste Direct Text
              </button>
            </div>
          </div>

          <div>
            {inputType === 'file' ? (
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all duration-300 ${
                  isDragging 
                    ? "border-blue-600 bg-blue-50/50 scale-[1.01]" 
                    : "border-slate-200 hover:border-blue-400 hover:bg-slate-50/50"
                }`}
              >
                <div className="space-y-4 text-center w-full">
                  <div className={`mx-auto h-14 w-14 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm ${isDragging ? "bg-blue-600 text-white scale-110" : "bg-slate-100 text-slate-400"}`}>
                    <FileIcon className="h-7 w-7" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-800">Add documents for review</h3>
                    <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">Drag and drop folder or files here, or choose below</p>
                    
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                      <label htmlFor="file-upload" className="cursor-pointer bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-4 py-2 rounded-xl font-bold text-xs hover:bg-slate-50 shadow-sm active:scale-95 transition-all">
                        <span>Choose Files</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} multiple accept=".pdf,.doc,.docx,.txt,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
                      </label>
                      
                      <button 
                        type="button"
                        onClick={() => folderInputRef.current?.click()}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        Upload Folder
                      </button>
                      <input 
                        type="file" 
                        ref={folderInputRef} 
                        className="hidden" 
                        webkitdirectory="" 
                        directory="" 
                        multiple 
                        onChange={handleFolderChange} 
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-3 text-[9px] text-slate-400 font-extrabold uppercase tracking-widest pt-2">
                    <span>PDF</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>WORD</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>TEXT</span>
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="mt-6 w-full bg-slate-50/50 rounded-xl p-4 border border-slate-100 max-h-40 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {selectedFolderName ? selectedFolderName : "Selected Files"}
                      </span>
                      <span className="text-[10px] text-blue-600 font-extrabold">{files.length} items</span>
                    </div>
                    <ul className="space-y-1.5">
                      {files.slice(0, 5).map((f, i) => (
                        <li key={i} className="text-xs text-slate-600 flex items-center gap-2 truncate">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
                          <span className="font-medium truncate">{f.name}</span>
                        </li>
                      ))}
                      {files.length > 5 && (
                        <li className="text-xs text-slate-400 italic pl-3">...and {files.length - 5} more files</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <textarea
                  id="textarea-manual-text"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Paste context of your policy document here (e.g. 'We keep customer data forever')..."
                  className="w-full h-48 p-4 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none placeholder:text-slate-400 font-medium"
                />
                <p className="text-[10px] text-slate-400 italic">
                  Best suited for quick compliance spot-checks or single sections.
                </p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className={`mt-4 text-xs font-semibold ${error.includes("limit") ? "bg-red-50 p-4 rounded-xl border border-red-200 text-red-700" : "text-red-600"}`}>
            <p>{error}</p>
            {error.includes("limit") && onUpgrade && (
              <button
                type="button"
                onClick={onUpgrade}
                className="mt-2 text-blue-600 font-bold hover:underline flex items-center"
              >
                View Upgrade Options &rarr;
              </button>
            )}
          </div>
        )}

        <div className="mt-8 flex justify-end gap-3.5">
          <button
            onClick={onClose}
            type="button"
            className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleStartScan}
            type="button"
            disabled={(inputType === 'file' ? files.length === 0 : !manualText.trim()) || !frameworkId || isProcessing}
            className="px-6 py-2.5 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-98 transition-all flex items-center min-w-[120px] justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Spinner />
                <span>Processing...</span>
              </>
            ) : (
              'Start Audit'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewScanModal;