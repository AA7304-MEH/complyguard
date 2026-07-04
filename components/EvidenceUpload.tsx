import * as React from 'react';
import { Evidence, EvidenceType } from '../types';
import { uploadEvidence } from '../services/evidenceClient';

interface EvidenceUploadProps {
  scanId: string;
  findingId: string;
  userId: string;
  existingEvidence: Evidence[];
  onClose: () => void;
  onUploaded: (newEvidence: Evidence) => void;
}

const EvidenceUpload: React.FC<EvidenceUploadProps> = ({
  scanId,
  findingId,
  userId,
  existingEvidence,
  onClose,
  onUploaded
}) => {
  const [file, setFile] = React.useState<File | null>(null);
  const [evidenceType, setEvidenceType] = React.useState<EvidenceType>('policy_doc');
  const [description, setDescription] = React.useState('');
  const [expiryDate, setExpiryDate] = React.useState('');
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (existingEvidence.length >= 10) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-card w-full max-w-lg rounded-xl border border-border p-6 shadow-2xl">
          <h3 className="text-lg font-bold text-foreground">Limit Reached</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You have already uploaded the maximum of 10 evidence files for this finding.
          </p>
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'png', 'jpg', 'jpeg', 'docx', 'xlsx'].includes(ext || '')) {
      setError("Invalid file type. Allowed: PDF, PNG, JPG, DOCX, XLSX.");
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError("File size limit exceeded. Max 50MB.");
      return;
    }
    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    if (!description.trim()) {
      setError("Please explain what this evidence proves.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    try {
      // Read file as base64 or data url for fallback storage
      const reader = new FileReader();
      reader.onload = async () => {
        setUploadProgress(60);
        const fileData = reader.result as string;
        
        const uploaded = await uploadEvidence({
          scanId,
          findingId,
          userId,
          fileName: file.name,
          fileData,
          fileType: file.name.split('.').pop()?.toLowerCase() || 'pdf',
          evidenceType,
          description,
          expiryDate: expiryDate || undefined
        });

        setUploadProgress(100);
        setTimeout(() => {
          onUploaded(uploaded);
          onClose();
        }, 500);
      };
      reader.onerror = () => {
        setError("Failed to read file.");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || "Upload failed.");
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-lg rounded-xl border border-border p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h3 className="text-lg font-bold text-foreground">Attach Compliance Evidence</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${
              isDragging
                ? 'border-accent bg-accent/10'
                : 'border-border hover:border-accent/50 hover:bg-muted/30'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx"
            />
            {file ? (
              <div className="space-y-1">
                <span className="text-2xl">📄</span>
                <p className="font-semibold text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-3xl">📁</span>
                <p className="text-sm font-medium text-foreground">
                  Drag & drop evidence file here, or <span className="text-accent">browse</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported: PDF, PNG, JPG, DOCX, XLSX (Max 50MB)
                </p>
              </div>
            )}
          </div>

          {/* Evidence Type Dropdown */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Evidence Type *
            </label>
            <select
              value={evidenceType}
              onChange={(e) => setEvidenceType(e.target.value as EvidenceType)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            >
              <option value="policy_doc">Policy Document</option>
              <option value="certificate">Certificate (ISO, SOC2, etc.)</option>
              <option value="screenshot">Configuration Screenshot</option>
              <option value="audit_log">System Audit Log</option>
              <option value="penetration_test">Penetration Test Report</option>
              <option value="third_party_assessment">Third Party Assessment</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              What does this evidence prove? *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain how this document validates that the compliance gap is resolved..."
              className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground focus:border-accent focus:outline-none"
              required
            />
          </div>

          {/* Expiry Date Picker (Enterprise Calendar Feature) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Evidence Expiry Date (Optional)
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              We will send automated reminders 30 days before this certificate or audit report expires.
            </p>
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading evidence...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="mt-6 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !file}
              className="rounded-lg bg-accent px-6 py-2 text-sm font-semibold text-white shadow-lg hover:bg-accent/90 disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Upload Evidence'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EvidenceUpload;
