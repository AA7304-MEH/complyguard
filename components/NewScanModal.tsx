import * as React from 'react';
import { createScan, getFrameworks } from '../services/apiClient';
import { AuditScan, Framework } from '../types';
import Spinner from './common/Spinner';
import { FileIcon } from './icons/FileIcon';

interface NewScanModalProps {
  onClose: () => void;
  onScanStart: (newScan: AuditScan) => void;
}

const NewScanModal: React.FC<NewScanModalProps> = ({ onClose, onScanStart }) => {
  const [file, setFile] = React.useState<File | null>(null);
  const [frameworks, setFrameworks] = React.useState<Framework[]>([]);
  const [frameworkId, setFrameworkId] = React.useState<string>('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
      // Basic validation for file type and size can be added here
      setFile(e.target.files[0]);
    }
  };
  
  const handleStartScan = async () => {
    if (!file || !frameworkId) {
      setError("Please select a file and a framework.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
        // This will now perform the full analysis in the background
        const processingScan = await createScan(file, frameworkId);
        
        // Add the new "processing" scan to the dashboard immediately.
        onScanStart(processingScan);

        // Close the modal. The dashboard will show the scan in progress.
        // The analysis now happens on the simulated backend.
        onClose();

    } catch (err) {
        console.error("Failed to start scan:", err);
        setError("Could not start the scan. Please try again.");
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Upload Document</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <FileIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-accent hover:text-accent-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-accent">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".txt,.md"/>
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">{file ? file.name : "TXT, MD"}</p>
              </div>
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        
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
            disabled={!file || !frameworkId || isProcessing}
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