import * as React from 'react';
import { saveWhiteLabelSettings, getWhiteLabelSettings } from '../services/evidenceClient';

interface WhiteLabelSettingsProps {
  userId: string;
  initialCompanyName?: string;
  initialLogoUrl?: string;
  onUpdate?: (name: string, logo: string) => void;
}

const WhiteLabelSettings: React.FC<WhiteLabelSettingsProps> = ({
  userId,
  initialCompanyName,
  initialLogoUrl,
  onUpdate
}) => {
  const [companyName, setCompanyName] = React.useState(initialCompanyName || '');
  const [logoUrl, setLogoUrl] = React.useState(initialLogoUrl || '');
  const [isSaving, setIsSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    const local = getWhiteLabelSettings(userId);
    if (local.companyName && !companyName) setCompanyName(local.companyName);
    if (local.companyLogoUrl && !logoUrl) setLogoUrl(local.companyLogoUrl);
  }, [userId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);
    try {
      await saveWhiteLabelSettings(userId, companyName, logoUrl);
      if (onUpdate) onUpdate(companyName, logoUrl);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-500">
            WHITE-LABEL CUSTOMIZATION
          </span>
          <h3 className="mt-2 text-lg font-bold text-foreground">Custom Report Branding</h3>
          <p className="text-sm text-muted-foreground">
            Configure custom company name and logo for executive PDF compliance reports. Perfect for consultants and MSPs.
          </p>
        </div>
        {saved && (
          <span className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-500">
            ✓ Branding Saved
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Company Name for Reports *
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g., Acme Corporation / CyberSec Consultants"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Company Logo URL (Optional)
          </label>
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
          />
        </div>

        <div className="md:col-span-2 flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo preview" className="h-8 max-w-[120px] object-contain rounded bg-white/10 p-1" onError={(e) => (e.currentTarget.style.display = 'none')} />
            ) : (
              <span className="text-xs text-muted-foreground">No custom logo configured</span>
            )}
            <span className="text-xs font-semibold text-foreground">Preview: {companyName || 'ComplyGuard AI'}</span>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-accent px-6 py-2 text-sm font-semibold text-white shadow-lg hover:bg-accent/90 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Branding Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WhiteLabelSettings;
