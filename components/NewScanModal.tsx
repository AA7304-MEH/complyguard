import * as React from 'react';
import { createScan, getFrameworks } from '../services/apiClient';
import { AuditScan, Framework } from '../types';
import Spinner from './common/Spinner';
import { FileIcon } from './icons/FileIcon';

interface NewScanModalProps {
  onClose: () => void;
  onScanStart: (newScan: AuditScan) => void;
  onUpgrade?: () => void;
}

const NewScanModal: React.FC<NewScanModalProps> = ({ onClose, onScanStart, onUpgrade }) => {
  const [files, setFiles] = React.useState<File[]>([]);
  const [frameworks, setFrameworks] = React.useState<Framework[]>([]);
  const [frameworkId, setFrameworkId] = React.useState<string>('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const folderInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFolderName, setSelectedFolderName] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

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
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(newFiles);
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
        setFiles(validFiles);
        setSelectedFolderName(`${validFiles.length} files in folder`);
        setError(null);
      } else {
        setError("No compatible compliance documents found in the selected folder.");
      }
    }
  };

  const handleStartScan = async () => {
    if (files.length === 0 || !frameworkId) {
      setError("Please select one or more files and a framework.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      let finalFile: File;
      
      if (files.length === 1) {
        finalFile = files[0];
      } else {
        // combine multiple files into one "virtual" document for analysis
        const combinedContent = await Promise.all(files.map(async (f) => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(`--- DOCUMENT: ${f.name} ---\n${reader.result as string}\n\n`);
            reader.readAsText(f);
          });
        }));
        
        const blob = new Blob(combinedContent, { type: 'text/plain' });
        finalFile = new File([blob], selectedFolderName || "Combined_Documents.txt", { type: 'text/plain' });
      }

      const processingScan = await createScan(finalFile, frameworkId);

      // Add the new "processing" scan to the dashboard immediately.
      onScanStart(processingScan);

      // Close the modal. The dashboard will show the scan in progress.
      // The analysis now happens on the simulated backend.
      onClose();

    } catch (err: any) {
      console.error("Failed to start scan:", err);
      if (err.message === "SCAN_LIMIT_REACHED") {
        setError("You have reached your monthly scan limit. Please upgrade your plan to continue.");
      } else {
        setError("Could not start the scan. Please try again.");
      }
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg m-4">
        <h2 className="text-2xl font-bold mb-4 text-slate-900">Start New Compliance Scan</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Regulatory Framework</label>
            <select
              value={frameworkId}
              onChange={(e) => setFrameworkId(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md"
              disabled={frameworks.length === 0}
            >
              {frameworks.length === 0 ? (
                <option>Loading frameworks...</option>
              ) : (
                frameworks.map(fw => (
                  <option key={fw.id} value={fw.id}>{fw.name}</option>
                ))
              )}
            </select>
          </div>
          <div>
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`mt-1 flex flex-col items-center justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-all duration-300 ${
                isDragging 
                  ? "border-accent bg-accent/10 scale-[1.02] shadow-lg shadow-accent/20" 
                  : "border-gray-300 hover:border-accent/50 hover:bg-gray-50"
              }`}
            >
              <div className="space-y-2 text-center">
                <div className={`mx-auto h-16 w-16 mb-2 rounded-full flex items-center justify-center transition-colors ${isDragging ? "bg-accent text-white" : "bg-gray-100 text-gray-400"}`}>
                  <FileIcon className="h-8 w-8" />
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center text-sm text-gray-600 gap-1">
                  <div className="flex items-center">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-semibold text-accent hover:text-accent-dark focus-within:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors">
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".txt,.md,.pdf,.doc,.docx" />
                    </label>
                    <span className="mx-2 text-gray-400">or</span>
                    <button 
                      type="button"
                      onClick={() => folderInputRef.current?.click()}
                      className="font-semibold text-accent hover:text-accent-dark transition-colors"
                    >
                      Upload a folder
                    </button>
                    <input 
                      ref={folderInputRef}
                      type="file" 
                      className="hidden" 
                      onChange={handleFolderChange} 
                      webkitdirectory=""
                      directory=""
                      {...({ webkitdirectory: "", directory: "" } as any)} 
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400">Supports .txt, .md, .pdf, .doc, .docx</p>
              </div>

              {files.length > 0 && (
                <div className="mt-6 w-full bg-gray-50 rounded-lg p-4 border border-gray-100 max-h-40 overflow-y-auto custom-scrollbar">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {selectedFolderName ? selectedFolderName : "Selected Files"}
                    </span>
                    <span className="text-xs text-accent font-medium">{files.length} items detected</span>
                  </div>
                  <ul className="space-y-1">
                    {files.slice(0, 5).map((f, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-center gap-2 truncate">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent/40" />
                        {f.name}
                      </li>
                    ))}
                    {files.length > 5 && (
                      <li className="text-xs text-gray-400 italic pl-3">...and {files.length - 5} more files</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className={`mt-4 text-sm ${error.includes("limit") ? "bg-red-50 p-3 rounded border border-red-200" : ""}`}>
            <p className="text-red-600">{error}</p>
            {error.includes("limit") && onUpgrade && (
              <button
                onClick={onUpgrade}
                className="mt-2 text-accent font-medium hover:underline flex items-center"
              >
                View Upgrade Options &rarr;
              </button>
            )}
          </div>
        )}

        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
            <button
            onClick={handleStartScan}
            type="button"
            disabled={files.length === 0 || !frameworkId || isProcessing}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-accent/90 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center min-w-[120px] justify-center"
          >
            {isProcessing ? (
              <>
                <Spinner />
                <span>Starting...</span>
              </>
            ) : (
              'Start Scan'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewScanModal;