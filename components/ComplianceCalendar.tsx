import * as React from 'react';
import { ComplianceDeadline, User } from '../types';

interface ComplianceCalendarProps {
  user: User;
}

const ComplianceCalendar: React.FC<ComplianceCalendarProps> = ({ user }) => {
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [deadlines, setDeadlines] = React.useState<ComplianceDeadline[]>([]);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [newDeadline, setNewDeadline] = React.useState<Partial<ComplianceDeadline>>({
    title: '',
    description: '',
    framework_id: 'gdpr',
    due_date: new Date(),
    priority: 'medium',
    status: 'pending'
  });

  // Mock deadlines data
  React.useEffect(() => {
    const mockDeadlines: ComplianceDeadline[] = [
      {
        id: '1',
        user_id: user.id,
        title: 'GDPR Data Protection Impact Assessment',
        description: 'Complete DPIA for new customer data processing system',
        framework_id: 'gdpr',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'pending',
        priority: 'high',
        created_at: new Date()
      },
      {
        id: '2',
        user_id: user.id,
        title: 'SOC 2 Annual Risk Assessment',
        description: 'Conduct annual risk assessment for SOC 2 compliance',
        framework_id: 'soc2',
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        status: 'in_progress',
        priority: 'high',
        created_at: new Date()
      },
      {
        id: '3',
        user_id: user.id,
        title: 'HIPAA Security Training',
        description: 'Complete mandatory HIPAA security awareness training for all staff',
        framework_id: 'hipaa',
        due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        status: 'pending',
        priority: 'medium',
        created_at: new Date()
      },
      {
        id: '4',
        user_id: user.id,
        title: 'Quarterly Compliance Review',
        description: 'Review and update all compliance policies and procedures',
        framework_id: 'gdpr',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'pending',
        priority: 'medium',
        created_at: new Date()
      }
    ];
    setDeadlines(mockDeadlines);
  }, [user.id]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const upcomingDeadlines = deadlines
    .filter(deadline => deadline.status !== 'completed')
    .sort((a, b) => a.due_date.getTime() - b.due_date.getTime())
    .slice(0, 5);

  const overdueDeadlines = deadlines.filter(deadline => {
    const daysUntil = getDaysUntilDue(deadline.due_date);
    return daysUntil < 0 && deadline.status !== 'completed';
  });

  const handleAddDeadline = () => {
    if (!newDeadline.title || !newDeadline.due_date) return;

    const deadline: ComplianceDeadline = {
      id: Date.now().toString(),
      user_id: user.id,
      title: newDeadline.title,
      description: newDeadline.description || '',
      framework_id: newDeadline.framework_id || 'gdpr',
      due_date: newDeadline.due_date,
      status: 'pending',
      priority: newDeadline.priority || 'medium',
      created_at: new Date()
    };

    setDeadlines(prev => [...prev, deadline]);
    setNewDeadline({
      title: '',
      description: '',
      framework_id: 'gdpr',
      due_date: new Date(),
      priority: 'medium',
      status: 'pending'
    });
    setShowAddModal(false);
  };

  const updateDeadlineStatus = (deadlineId: string, newStatus: ComplianceDeadline['status']) => {
    setDeadlines(prev => prev.map(deadline => 
      deadline.id === deadlineId 
        ? { ...deadline, status: newStatus }
        : deadline
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Compliance Calendar</h2>
          <p className="text-gray-600 mt-1">Track compliance deadlines and requirements</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
        >
          Add Deadline
        </button>
      </div>

      {/* Alert for Overdue Items */}
      {overdueDeadlines.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">
                {overdueDeadlines.length} Overdue Deadline{overdueDeadlines.length > 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-red-700">
                You have overdue compliance tasks that need immediate attention.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Deadlines */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">Upcoming Deadlines</h3>
            <div className="space-y-4">
              {upcomingDeadlines.map(deadline => {
                const daysUntil = getDaysUntilDue(deadline.due_date);
                const isOverdue = daysUntil < 0;
                const isUrgent = daysUntil <= 7 && daysUntil >= 0;

                return (
                  <div
                    key={deadline.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      isOverdue ? 'border-l-red-500 bg-red-50' :
                      isUrgent ? 'border-l-yellow-500 bg-yellow-50' :
                      'border-l-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">{deadline.title}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(deadline.priority)}`}>
                            {deadline.priority}
                          </span>
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(deadline.status)}`}></div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{deadline.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Framework: {deadline.framework_id.toUpperCase()}</span>
                          <span>
                            Due: {deadline.due_date.toLocaleDateString()}
                            {isOverdue ? (
                              <span className="text-red-600 ml-1">({Math.abs(daysUntil)} days overdue)</span>
                            ) : (
                              <span className={isUrgent ? 'text-yellow-600 ml-1' : 'ml-1'}>
                                ({daysUntil} days remaining)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {deadline.status === 'pending' && (
                          <button
                            onClick={() => updateDeadlineStatus(deadline.id, 'in_progress')}
                            className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                          >
                            Start
                          </button>
                        )}
                        {deadline.status === 'in_progress' && (
                          <button
                            onClick={() => updateDeadlineStatus(deadline.id, 'completed')}
                            className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {upcomingDeadlines.length === 0 && (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Deadlines</h3>
                  <p className="text-gray-600">You're all caught up! Add new deadlines to stay on track.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Calendar Summary */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Deadlines</span>
                <span className="font-medium">{deadlines.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="font-medium text-yellow-600">
                  {deadlines.filter(d => d.status === 'pending').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">In Progress</span>
                <span className="font-medium text-blue-600">
                  {deadlines.filter(d => d.status === 'in_progress').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="font-medium text-green-600">
                  {deadlines.filter(d => d.status === 'completed').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Overdue</span>
                <span className="font-medium text-red-600">{overdueDeadlines.length}</span>
              </div>
            </div>
          </div>

          {/* Framework Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">By Framework</h3>
            <div className="space-y-3">
              {['gdpr', 'hipaa', 'soc2'].map(framework => {
                const count = deadlines.filter(d => d.framework_id === framework).length;
                return (
                  <div key={framework} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{framework.toUpperCase()}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add Deadline Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary">Add New Deadline</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={newDeadline.title || ''}
                  onChange={(e) => setNewDeadline(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                  placeholder="Enter deadline title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newDeadline.description || ''}
                  onChange={(e) => setNewDeadline(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                  rows={3}
                  placeholder="Enter description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Framework</label>
                  <select
                    value={newDeadline.framework_id || 'gdpr'}
                    onChange={(e) => setNewDeadline(prev => ({ ...prev, framework_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                  >
                    <option value="gdpr">GDPR</option>
                    <option value="hipaa">HIPAA</option>
                    <option value="soc2">SOC 2</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newDeadline.priority || 'medium'}
                    onChange={(e) => setNewDeadline(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                <input
                  type="date"
                  value={newDeadline.due_date?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setNewDeadline(prev => ({ ...prev, due_date: new Date(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddDeadline}
                className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
              >
                Add Deadline
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceCalendar;