import * as React from 'react';
import { ComplianceTemplate, TemplateVariable, User, SubscriptionTier } from '../types';

interface DocumentTemplatesProps {
  user: User;
  onUpgrade: () => void;
}

const DocumentTemplates: React.FC<DocumentTemplatesProps> = ({ user, onUpgrade }) => {
  const [selectedCategory, setSelectedCategory] = React.useState<'all' | 'policy' | 'procedure' | 'contract' | 'assessment'>('all');
  const [selectedTemplate, setSelectedTemplate] = React.useState<ComplianceTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = React.useState<Record<string, string>>({});
  const [generatedDocument, setGeneratedDocument] = React.useState<string>('');

  // Mock templates data
  const templates: ComplianceTemplate[] = [
    {
      id: 'gdpr-privacy-policy',
      name: 'GDPR Privacy Policy Template',
      description: 'Comprehensive privacy policy template compliant with GDPR requirements',
      framework_id: 'gdpr',
      category: 'policy',
      content: `# Privacy Policy for {{company_name}}

## 1. Data Controller Information
{{company_name}} ({{company_address}}) is the data controller for the personal data processed through this website.

## 2. Data Protection Officer
Our Data Protection Officer can be contacted at: {{dpo_email}}

## 3. Personal Data We Collect
We collect the following types of personal data:
- {{data_types}}

## 4. Legal Basis for Processing
We process your personal data based on:
- {{legal_basis}}

## 5. Data Retention
We retain your personal data for: {{retention_period}}

## 6. Your Rights
Under GDPR, you have the right to:
- Access your personal data
- Rectify inaccurate data
- Erase your data
- Restrict processing
- Data portability
- Object to processing

To exercise these rights, contact us at: {{contact_email}}`,
      variables: [
        { name: 'company_name', type: 'text', required: true },
        { name: 'company_address', type: 'text', required: true },
        { name: 'dpo_email', type: 'text', required: true },
        { name: 'data_types', type: 'text', required: true },
        { name: 'legal_basis', type: 'select', required: true, options: ['Consent', 'Contract', 'Legal obligation', 'Vital interests', 'Public task', 'Legitimate interests'] },
        { name: 'retention_period', type: 'text', required: true },
        { name: 'contact_email', type: 'text', required: true }
      ],
      is_premium: false,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'hipaa-baa',
      name: 'HIPAA Business Associate Agreement',
      description: 'Standard Business Associate Agreement template for HIPAA compliance',
      framework_id: 'hipaa',
      category: 'contract',
      content: `# BUSINESS ASSOCIATE AGREEMENT

This Business Associate Agreement ("Agreement") is entered into between {{covered_entity}} ("Covered Entity") and {{business_associate}} ("Business Associate").

## 1. DEFINITIONS
Terms used but not otherwise defined in this Agreement shall have the meanings assigned to such terms in the HIPAA Rules.

## 2. PERMITTED USES AND DISCLOSURES
Business Associate may use or disclose PHI only:
- {{permitted_uses}}

## 3. SAFEGUARDS
Business Associate shall implement appropriate safeguards to prevent unauthorized use or disclosure of PHI, including:
- {{safeguards}}

## 4. REPORTING
Business Associate shall report to Covered Entity any unauthorized use or disclosure of PHI within {{reporting_timeframe}} of discovery.

## 5. SUBCONTRACTORS
Business Associate shall ensure that any subcontractors that handle PHI agree to the same restrictions and conditions.`,
      variables: [
        { name: 'covered_entity', type: 'text', required: true },
        { name: 'business_associate', type: 'text', required: true },
        { name: 'permitted_uses', type: 'text', required: true },
        { name: 'safeguards', type: 'text', required: true },
        { name: 'reporting_timeframe', type: 'select', required: true, options: ['24 hours', '48 hours', '72 hours', '5 business days'] }
      ],
      is_premium: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'soc2-security-policy',
      name: 'SOC 2 Information Security Policy',
      description: 'Comprehensive information security policy aligned with SOC 2 requirements',
      framework_id: 'soc2',
      category: 'policy',
      content: `# INFORMATION SECURITY POLICY

## 1. PURPOSE
This policy establishes the framework for {{company_name}}'s information security program.

## 2. SCOPE
This policy applies to all {{scope}}.

## 3. SECURITY CONTROLS
### 3.1 Access Controls
- {{access_controls}}

### 3.2 Data Classification
- {{data_classification}}

### 3.3 Incident Response
- {{incident_response}}

## 4. COMPLIANCE MONITORING
Security compliance will be monitored through:
- {{monitoring_methods}}

## 5. TRAINING
All personnel must complete security awareness training {{training_frequency}}.`,
      variables: [
        { name: 'company_name', type: 'text', required: true },
        { name: 'scope', type: 'text', required: true },
        { name: 'access_controls', type: 'text', required: true },
        { name: 'data_classification', type: 'text', required: true },
        { name: 'incident_response', type: 'text', required: true },
        { name: 'monitoring_methods', type: 'text', required: true },
        { name: 'training_frequency', type: 'select', required: true, options: ['annually', 'semi-annually', 'quarterly'] }
      ],
      is_premium: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'data-breach-procedure',
      name: 'Data Breach Response Procedure',
      description: 'Step-by-step procedure for responding to data security incidents',
      framework_id: 'gdpr',
      category: 'procedure',
      content: `# DATA BREACH RESPONSE PROCEDURE

## 1. IMMEDIATE RESPONSE (0-24 hours)
1. **Contain the breach**
   - {{containment_steps}}

2. **Assess the situation**
   - {{assessment_criteria}}

3. **Notify key personnel**
   - {{notification_list}}

## 2. INVESTIGATION (24-72 hours)
1. **Document the incident**
   - {{documentation_requirements}}

2. **Determine scope and impact**
   - {{impact_assessment}}

## 3. NOTIFICATION (72 hours)
1. **Regulatory notification**
   - {{regulatory_requirements}}

2. **Individual notification**
   - {{individual_notification}}

## 4. REMEDIATION
1. **Implement fixes**
   - {{remediation_steps}}

2. **Monitor for further issues**
   - {{monitoring_plan}}`,
      variables: [
        { name: 'containment_steps', type: 'text', required: true },
        { name: 'assessment_criteria', type: 'text', required: true },
        { name: 'notification_list', type: 'text', required: true },
        { name: 'documentation_requirements', type: 'text', required: true },
        { name: 'impact_assessment', type: 'text', required: true },
        { name: 'regulatory_requirements', type: 'text', required: true },
        { name: 'individual_notification', type: 'text', required: true },
        { name: 'remediation_steps', type: 'text', required: true },
        { name: 'monitoring_plan', type: 'text', required: true }
      ],
      is_premium: false,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  const filteredTemplates = templates.filter(template => 
    selectedCategory === 'all' || template.category === selectedCategory
  );

  const handleTemplateSelect = (template: ComplianceTemplate) => {
    if (template.is_premium && user.subscription_tier === SubscriptionTier.Free) {
      return; // Will show upgrade prompt
    }
    setSelectedTemplate(template);
    setTemplateVariables({});
    setGeneratedDocument('');
  };

  const handleVariableChange = (variableName: string, value: string) => {
    setTemplateVariables(prev => ({
      ...prev,
      [variableName]: value
    }));
  };

  const generateDocument = () => {
    if (!selectedTemplate) return;

    let content = selectedTemplate.content;
    selectedTemplate.variables.forEach(variable => {
      const value = templateVariables[variable.name] || `[${variable.name.toUpperCase()}]`;
      content = content.replace(new RegExp(`{{${variable.name}}}`, 'g'), value);
    });

    setGeneratedDocument(content);
  };

  const downloadDocument = () => {
    const blob = new Blob([generatedDocument], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate?.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Document Templates</h2>
          <p className="text-gray-600 mt-1">Generate compliance documents from pre-built templates</p>
        </div>
        
        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
        >
          <option value="all">All Categories</option>
          <option value="policy">Policies</option>
          <option value="procedure">Procedures</option>
          <option value="contract">Contracts</option>
          <option value="assessment">Assessments</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-primary mb-4">Available Templates</h3>
            <div className="space-y-3">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTemplate?.id === template.id
                      ? 'border-accent bg-accent/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{template.name}</h4>
                      <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                      <div className="flex items-center mt-2 space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          template.category === 'policy' ? 'bg-blue-100 text-blue-800' :
                          template.category === 'procedure' ? 'bg-green-100 text-green-800' :
                          template.category === 'contract' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {template.category}
                        </span>
                        {template.is_premium && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            Premium
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {template.is_premium && user.subscription_tier === SubscriptionTier.Free && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs text-yellow-800">Upgrade to access this template</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpgrade();
                        }}
                        className="text-xs text-yellow-900 underline hover:no-underline"
                      >
                        Upgrade now
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Template Editor */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-primary">{selectedTemplate.name}</h3>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Variable Inputs */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-4">Template Variables</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTemplate.variables.map(variable => (
                    <div key={variable.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {variable.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        {variable.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {variable.type === 'select' ? (
                        <select
                          value={templateVariables[variable.name] || ''}
                          onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                        >
                          <option value="">Select an option</option>
                          {variable.options?.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={variable.type === 'date' ? 'date' : variable.type === 'number' ? 'number' : 'text'}
                          value={templateVariables[variable.name] || ''}
                          onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                          placeholder={variable.default_value}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex space-x-3 mb-6">
                <button
                  onClick={generateDocument}
                  className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
                >
                  Generate Document
                </button>
                {generatedDocument && (
                  <button
                    onClick={downloadDocument}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Download
                  </button>
                )}
              </div>

              {/* Generated Document Preview */}
              {generatedDocument && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Generated Document</h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                      {generatedDocument}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Template</h3>
              <p className="text-gray-600">Choose a template from the list to start generating your compliance document.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentTemplates;