import { Evidence, EvidenceStatus, Comment, SeverityOverride, AuditTrailEntry } from '../types';

export interface ScanEnterpriseData {
  evidence: Evidence[];
  comments: Comment[];
  overrides: SeverityOverride[];
  audit_trail: AuditTrailEntry[];
}

const getLocalData = (scanId: string): ScanEnterpriseData => {
  try {
    const raw = localStorage.getItem(`complyguard_ent_${scanId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("localStorage read error:", e);
  }
  return { evidence: [], comments: [], overrides: [], audit_trail: [] };
};

const saveLocalData = (scanId: string, data: ScanEnterpriseData) => {
  try {
    localStorage.setItem(`complyguard_ent_${scanId}`, JSON.stringify(data));
  } catch (e) {
    console.warn("localStorage write error:", e);
  }
};

/**
 * Fetch all enterprise data (evidence, comments, overrides, audit trail) for a scan
 */
export const getScanEnterpriseData = async (scanId: string): Promise<ScanEnterpriseData> => {
  const local = getLocalData(scanId);
  try {
    const res = await fetch(`/api/evidence?scanId=${encodeURIComponent(scanId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        const merged: ScanEnterpriseData = {
          evidence: data.evidence && data.evidence.length > 0 ? data.evidence : local.evidence,
          comments: data.comments && data.comments.length > 0 ? data.comments : local.comments,
          overrides: data.overrides && data.overrides.length > 0 ? data.overrides : local.overrides,
          audit_trail: data.audit_trail && data.audit_trail.length > 0 ? data.audit_trail : local.audit_trail,
        };
        saveLocalData(scanId, merged);
        return merged;
      }
    }
  } catch (err) {
    console.warn("API fetch failed, returning localStorage data:", err);
  }
  return local;
};

/**
 * Upload evidence file
 */
export const uploadEvidence = async (params: {
  scanId: string;
  findingId: string;
  userId: string;
  fileName: string;
  fileData?: string;
  fileType?: string;
  evidenceType?: string;
  description?: string;
  expiryDate?: string;
}): Promise<Evidence> => {
  const local = getLocalData(params.scanId);
  
  const fallbackItem: Evidence = {
    id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    scan_id: params.scanId,
    finding_id: params.findingId,
    user_id: params.userId,
    file_name: params.fileName,
    file_url: params.fileData || `https://storage.complyguard.ai/evidence/${params.fileName}`,
    file_type: params.fileType || 'pdf',
    evidence_type: (params.evidenceType as any) || 'policy_doc',
    description: params.description || 'Evidence attached',
    uploaded_at: new Date().toISOString(),
    expiry_date: params.expiryDate || undefined,
    status: 'pending_review'
  };

  try {
    const res = await fetch('/api/evidence/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.evidence) {
        local.evidence.push(data.evidence);
        saveLocalData(params.scanId, local);
        return data.evidence;
      }
    }
  } catch (e) {
    console.warn("Upload API failed, saving locally:", e);
  }

  local.evidence.push(fallbackItem);
  saveLocalData(params.scanId, local);
  return fallbackItem;
};

/**
 * Update evidence status
 */
export const updateEvidenceStatus = async (
  scanId: string,
  evidenceId: string,
  status: EvidenceStatus,
  reviewerNotes?: string,
  userId?: string,
  findingId?: string
): Promise<boolean> => {
  const local = getLocalData(scanId);
  const idx = local.evidence.findIndex(e => e.id === evidenceId);
  if (idx !== -1) {
    local.evidence[idx].status = status;
    if (reviewerNotes) local.evidence[idx].reviewer_notes = reviewerNotes;
  }

  if (userId) {
    local.audit_trail.unshift({
      id: `at_${Date.now()}`,
      scan_id: scanId,
      finding_id: findingId,
      user_id: userId,
      action: `Evidence status updated to "${status}"`,
      details: reviewerNotes || '',
      created_at: new Date().toISOString()
    });
  }
  saveLocalData(scanId, local);

  try {
    await fetch('/api/evidence/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evidenceId, status, reviewerNotes, userId, scanId, findingId })
    });
  } catch (e) {
    console.warn("Status update API failed:", e);
  }
  return true;
};

/**
 * Mark finding as accepted risk
 */
export const acceptRisk = async (params: {
  scanId: string;
  findingId: string;
  userId: string;
  userEmail?: string;
  justification: string;
}): Promise<AuditTrailEntry> => {
  const local = getLocalData(params.scanId);
  const entry: AuditTrailEntry = {
    id: `at_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    scan_id: params.scanId,
    finding_id: params.findingId,
    user_id: params.userId,
    user_email: params.userEmail || '',
    action: `Marked finding as "Accepted Risk"`,
    details: `Justification: "${params.justification}"`,
    created_at: new Date().toISOString()
  };

  local.audit_trail.unshift(entry);
  saveLocalData(params.scanId, local);

  try {
    const res = await fetch('/api/evidence/accept-risk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.audit_entry) return data.audit_entry;
    }
  } catch (e) {
    console.warn("Accept risk API failed:", e);
  }
  return entry;
};

/**
 * Assign finding to team member
 */
export const assignFinding = async (params: {
  scanId: string;
  findingId: string;
  userId: string;
  assignedToEmail: string;
}): Promise<string> => {
  const local = getLocalData(params.scanId);
  local.audit_trail.unshift({
    id: `at_${Date.now()}`,
    scan_id: params.scanId,
    finding_id: params.findingId,
    user_id: params.userId,
    action: `Assigned finding to ${params.assignedToEmail}`,
    details: '',
    created_at: new Date().toISOString()
  });
  
  // Save assignment mapping locally in a general map
  try {
    const assignMapRaw = localStorage.getItem(`complyguard_assign_${params.scanId}`) || '{}';
    const assignMap = JSON.parse(assignMapRaw);
    assignMap[params.findingId] = params.assignedToEmail;
    localStorage.setItem(`complyguard_assign_${params.scanId}`, JSON.stringify(assignMap));
  } catch (e) {}

  saveLocalData(params.scanId, local);

  try {
    await fetch('/api/collaboration/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
  } catch (e) {}

  return params.assignedToEmail;
};

export const getAssignedEmail = (scanId: string, findingId: string): string | undefined => {
  try {
    const assignMapRaw = localStorage.getItem(`complyguard_assign_${scanId}`) || '{}';
    const assignMap = JSON.parse(assignMapRaw);
    return assignMap[findingId];
  } catch (e) {}
  return undefined;
};

/**
 * Add comment to finding
 */
export const addComment = async (params: {
  scanId: string;
  findingId: string;
  userId: string;
  userEmail?: string;
  commentText: string;
}): Promise<Comment> => {
  const local = getLocalData(params.scanId);
  const commentItem: Comment = {
    id: `com_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    scan_id: params.scanId,
    finding_id: params.findingId,
    user_id: params.userId,
    user_email: params.userEmail || 'user@company.com',
    comment_text: params.commentText,
    created_at: new Date().toISOString()
  };

  local.comments.push(commentItem);
  saveLocalData(params.scanId, local);

  try {
    const res = await fetch('/api/collaboration/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.comment) return data.comment;
    }
  } catch (e) {}
  return commentItem;
};

/**
 * Override severity
 */
export const overrideSeverity = async (params: {
  scanId: string;
  findingId: string;
  userId: string;
  userEmail?: string;
  oldSeverity: string;
  newSeverity: string;
  justification: string;
}): Promise<SeverityOverride> => {
  const local = getLocalData(params.scanId);
  const overrideItem: SeverityOverride = {
    id: `ov_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    scan_id: params.scanId,
    finding_id: params.findingId,
    user_id: params.userId,
    user_email: params.userEmail || 'user@company.com',
    old_severity: params.oldSeverity,
    new_severity: params.newSeverity,
    justification: params.justification,
    created_at: new Date().toISOString()
  };

  local.overrides.push(overrideItem);
  local.audit_trail.unshift({
    id: `at_${Date.now()}`,
    scan_id: params.scanId,
    finding_id: params.findingId,
    user_id: params.userId,
    user_email: params.userEmail || '',
    action: `Severity adjusted from ${params.oldSeverity} to ${params.newSeverity}`,
    details: `Justification: "${params.justification}"`,
    created_at: new Date().toISOString()
  });

  saveLocalData(params.scanId, local);

  try {
    const res = await fetch('/api/collaboration/override-severity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.override) return data.override;
    }
  } catch (e) {}
  return overrideItem;
};

/**
 * White-label settings
 */
export const saveWhiteLabelSettings = async (userId: string, companyName: string, companyLogoUrl: string) => {
  try {
    localStorage.setItem(`complyguard_wl_${userId}`, JSON.stringify({ companyName, companyLogoUrl }));
  } catch (e) {}

  try {
    await fetch('/api/user/white-label', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, companyName, companyLogoUrl })
    });
  } catch (e) {}
};

export const getWhiteLabelSettings = (userId: string) => {
  try {
    const raw = localStorage.getItem(`complyguard_wl_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { companyName: '', companyLogoUrl: '' };
};
