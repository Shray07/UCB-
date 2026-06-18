import { useState } from 'react';
import {
  Shield,
  Users,
  Workflow,
  Settings,
  LogOut,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

type AdminTab = 'users' | 'workflow' | 'settings';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
}

interface WorkflowLog {
  id: number;
  timestamp: string;
  node: string;
  status: 'success' | 'warning' | 'error';
  duration: string;
  recordsProcessed: number;
}

const mockUsers: AdminUser[] = [
  { id: 1, name: 'Admin User', email: 'admin@replenishflow.com', role: 'admin', status: 'active' },
  { id: 2, name: 'John Smith', email: 'john@company.com', role: 'user', status: 'active' },
  { id: 3, name: 'Sarah Lee', email: 'sarah@company.com', role: 'user', status: 'active' },
  { id: 4, name: 'Mike Chen', email: 'mike@company.com', role: 'user', status: 'inactive' },
  { id: 5, name: 'Emily Brown', email: 'emily@company.com', role: 'user', status: 'active' },
];

const mockLogs: WorkflowLog[] = [
  { id: 1, timestamp: '2026-06-18 14:30:15', node: 'Excel Reader', status: 'success', duration: '0.3s', recordsProcessed: 1250 },
  { id: 2, timestamp: '2026-06-18 14:30:18', node: 'Row Filter', status: 'success', duration: '0.1s', recordsProcessed: 1180 },
  { id: 3, timestamp: '2026-06-18 14:30:20', node: 'Math Formula', status: 'success', duration: '0.2s', recordsProcessed: 1180 },
  { id: 4, timestamp: '2026-06-18 14:30:22', node: 'Rule Engine 1', status: 'warning', duration: '0.4s', recordsProcessed: 1180 },
  { id: 5, timestamp: '2026-06-18 14:30:25', node: 'Joiner', status: 'success', duration: '0.5s', recordsProcessed: 890 },
  { id: 6, timestamp: '2026-06-18 14:30:30', node: 'GroupBy (Final)', status: 'success', duration: '0.2s', recordsProcessed: 890 },
  { id: 7, timestamp: '2026-06-18 14:15:10', node: 'Excel Reader', status: 'success', duration: '0.3s', recordsProcessed: 1300 },
  { id: 8, timestamp: '2026-06-18 14:15:13', node: 'Row Filter', status: 'success', duration: '0.1s', recordsProcessed: 1220 },
];

const sidebarItems = [
  { id: 'users' as AdminTab, label: 'User Management', icon: Users },
  { id: 'workflow' as AdminTab, label: 'Workflow Logs', icon: Workflow },
  { id: 'settings' as AdminTab, label: 'System Settings', icon: Settings },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [userSearch, setUserSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [goodThreshold, setGoodThreshold] = useState('60');
  const [poorThreshold, setPoorThreshold] = useState('40');

  // Interactive user state
  const [users, setUsers] = useState<AdminUser[]>(mockUsers);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [newUserStatus, setNewUserStatus] = useState<'active' | 'inactive'>('active');

  // Edit user state
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'active').length;
  const adminUsers = users.filter((u) => u.role === 'admin').length;

  const handleDeleteUser = (id: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter((u) => u.id !== id));
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F1EB] pt-16">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-60 min-h-[calc(100vh-64px)] bg-white border-r border-[rgba(27,67,50,0.1)] flex flex-col">
          <div className="px-6 py-5 flex items-center gap-2 border-b border-[rgba(27,67,50,0.05)]">
            <Shield className="w-5 h-5 text-[#1B4332]" />
            <span className="font-body font-semibold text-base text-[#1B4332]">Admin Panel</span>
          </div>

          <nav className="flex-1 p-3 mt-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-body font-medium text-sm transition-colors ${
                  activeTab === item.id
                    ? 'bg-[#52796F]/10 text-[#52796F]'
                    : 'text-[#2D3436] hover:bg-[#F5F1EB]'
                }`}
                data-cursor-hover
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-[rgba(27,67,50,0.1)]">
            <button
              className="w-full flex items-center gap-3 px-4 py-2.5 font-body font-medium text-sm text-[#2D3436]/60 hover:text-[#2D3436] transition-colors"
              data-cursor-hover
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 p-6 lg:p-8">
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl lg:text-3xl text-[#1B4332]">
                  User Management
                </h2>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 rounded-full bg-[#52796F] text-white font-body font-medium text-sm hover:bg-[#3d5c54] transition-colors"
                  data-cursor-hover
                >
                  Add User
                </button>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-4 mb-6">
                {[
                  { label: 'Total Users', value: String(totalUsers) },
                  { label: 'Active Users', value: String(activeUsers) },
                  { label: 'Admin Users', value: String(adminUsers) },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex-1 min-w-[120px] bg-white rounded-xl p-4 border border-[rgba(27,67,50,0.1)]"
                  >
                    <div className="font-body font-semibold text-xl text-[#1B4332]">{stat.value}</div>
                    <div className="font-body text-xs text-[#2D3436]/50">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-xl border border-[rgba(27,67,50,0.1)] overflow-hidden">
                <div className="p-4 border-b border-[rgba(27,67,50,0.1)]">
                  <div className="flex items-center bg-[#F5F1EB] rounded-lg px-3 py-2 max-w-sm">
                    <Search className="w-4 h-4 text-[#2D3436]/40 mr-2" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="bg-transparent text-sm font-body text-[#2D3436] placeholder:text-[#2D3436]/40 outline-none w-full"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-[#F5F1EB]">
                        <th className="text-left px-4 py-3 font-body font-semibold text-xs text-[#2D3436]/60 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="text-left px-4 py-3 font-body font-semibold text-xs text-[#2D3436]/60 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="text-left px-4 py-3 font-body font-semibold text-xs text-[#2D3436]/60 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="text-left px-4 py-3 font-body font-semibold text-xs text-[#2D3436]/60 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-left px-4 py-3 font-body font-semibold text-xs text-[#2D3436]/60 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user, i) => (
                        <tr
                          key={user.id}
                          className={`border-b border-[rgba(27,67,50,0.05)] ${
                            i % 2 === 0 ? 'bg-white' : 'bg-[#F5F1EB]/30'
                          }`}
                        >
                          <td className="px-4 py-3 font-body text-sm text-[#1B4332]">{user.name}</td>
                          <td className="px-4 py-3 font-body text-sm text-[#2D3436]/70">{user.email}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-full font-body font-medium ${
                                user.role === 'admin'
                                  ? 'bg-[#E29578]/20 text-[#1B4332]'
                                  : 'bg-[#84A98C]/20 text-[#52796F]'
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  user.status === 'active' ? 'bg-[#52796F]' : 'bg-[#2D3436]/30'
                                }`}
                              />
                              <span className="font-body text-xs text-[#2D3436]/60 capitalize">
                                {user.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditingUser(user)}
                                className="p-1 hover:bg-[#F5F1EB] rounded transition-colors"
                                data-cursor-hover
                              >
                                <Edit className="w-4 h-4 text-[#2D3436]/40 hover:text-[#2D3436]" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-1 hover:bg-[#F5F1EB] rounded transition-colors"
                                data-cursor-hover
                              >
                                <Trash2 className="w-4 h-4 text-[#2D3436]/40 hover:text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Workflow Logs Tab */}
          {activeTab === 'workflow' && (
            <div>
              <h2 className="font-display text-2xl lg:text-3xl text-[#1B4332] mb-6">
                Workflow Execution Logs
              </h2>

              <div className="bg-white rounded-xl border border-[rgba(27,67,50,0.1)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-[#F5F1EB]">
                        <th className="text-left px-4 py-3 font-body font-semibold text-xs text-[#2D3436]/60 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="text-left px-4 py-3 font-body font-semibold text-xs text-[#2D3436]/60 uppercase tracking-wider">
                          Node
                        </th>
                        <th className="text-left px-4 py-3 font-body font-semibold text-xs text-[#2D3436]/60 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-left px-4 py-3 font-body font-semibold text-xs text-[#2D3436]/60 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="text-left px-4 py-3 font-body font-semibold text-xs text-[#2D3436]/60 uppercase tracking-wider">
                          Records
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockLogs.map((log, i) => (
                        <tr
                          key={log.id}
                          className={`border-b border-[rgba(27,67,50,0.05)] ${
                            i % 2 === 0 ? 'bg-white' : 'bg-[#F5F1EB]/30'
                          }`}
                        >
                          <td className="px-4 py-3 font-body text-sm text-[#2D3436]/70">{log.timestamp}</td>
                          <td className="px-4 py-3 font-body text-sm text-[#1B4332]">{log.node}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-body font-medium ${
                                log.status === 'success'
                                  ? 'bg-[#52796F]/10 text-[#52796F]'
                                  : log.status === 'warning'
                                  ? 'bg-[#E29578]/10 text-[#E29578]'
                                  : 'bg-red-100 text-red-600'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  log.status === 'success'
                                    ? 'bg-[#52796F]'
                                    : log.status === 'warning'
                                    ? 'bg-[#E29578]'
                                    : 'bg-red-500'
                                }`}
                              />
                              {log.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-body text-sm text-[#2D3436]/70">{log.duration}</td>
                          <td className="px-4 py-3 font-body text-sm text-[#2D3436]/70">
                            {log.recordsProcessed.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(27,67,50,0.1)]">
                  <span className="font-body text-xs text-[#2D3436]/50">Showing 1-8 of 24</span>
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-lg hover:bg-[#F5F1EB] transition-colors" data-cursor-hover>
                      <ChevronLeft className="w-4 h-4 text-[#2D3436]/40" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-[#F5F1EB] transition-colors" data-cursor-hover>
                      <ChevronRight className="w-4 h-4 text-[#2D3436]/40" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div>
              <h2 className="font-display text-2xl lg:text-3xl text-[#1B4332] mb-6">
                System Settings
              </h2>

              <div className="flex flex-col gap-4 max-w-2xl">
                {/* General Settings */}
                <div className="bg-white rounded-xl p-6 border border-[rgba(27,67,50,0.1)]">
                  <h3 className="font-body font-semibold text-base text-[#1B4332] mb-4">
                    General
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-body font-medium text-sm text-[#2D3436]">
                          Auto-refresh Dashboard
                        </div>
                        <div className="font-body text-xs text-[#2D3436]/50">
                          Automatically refresh dashboard data every 5 minutes
                        </div>
                      </div>
                      <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        data-cursor-hover
                      >
                        {autoRefresh ? (
                          <ToggleRight className="w-10 h-6 text-[#52796F]" />
                        ) : (
                          <ToggleLeft className="w-10 h-6 text-[#2D3436]/30" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-body font-medium text-sm text-[#2D3436]">
                          Notifications
                        </div>
                        <div className="font-body text-xs text-[#2D3436]/50">
                          Receive alerts when workflow execution fails
                        </div>
                      </div>
                      <button
                        onClick={() => setNotifications(!notifications)}
                        data-cursor-hover
                      >
                        {notifications ? (
                          <ToggleRight className="w-10 h-6 text-[#52796F]" />
                        ) : (
                          <ToggleLeft className="w-10 h-6 text-[#2D3436]/30" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Workflow Settings */}
                <div className="bg-white rounded-xl p-6 border border-[rgba(27,67,50,0.1)]">
                  <h3 className="font-body font-semibold text-base text-[#1B4332] mb-4">
                    Workflow Thresholds
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="font-body font-medium text-sm text-[#2D3436] block mb-1.5">
                        Good Performer Threshold (%)
                      </label>
                      <input
                        type="text"
                        value={goodThreshold}
                        onChange={(e) => setGoodThreshold(e.target.value)}
                        className="w-full max-w-xs bg-[#F5F1EB] rounded-lg px-3 py-2 font-body text-sm text-[#2D3436] outline-none focus:ring-2 focus:ring-[#52796F]/20"
                      />
                    </div>
                    <div>
                      <label className="font-body font-medium text-sm text-[#2D3436] block mb-1.5">
                        Poor Performer Threshold (%)
                      </label>
                      <input
                        type="text"
                        value={poorThreshold}
                        onChange={(e) => setPoorThreshold(e.target.value)}
                        className="w-full max-w-xs bg-[#F5F1EB] rounded-lg px-3 py-2 font-body text-sm text-[#2D3436] outline-none focus:ring-2 focus:ring-[#52796F]/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Integration Settings */}
                <div className="bg-white rounded-xl p-6 border border-[rgba(27,67,50,0.1)]">
                  <h3 className="font-body font-semibold text-base text-[#1B4332] mb-4">
                    KNIME Integration
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="font-body font-medium text-sm text-[#2D3436] block mb-1.5">
                        KNIME Server URL
                      </label>
                      <input
                        type="text"
                        placeholder="https://knime-server.company.com"
                        className="w-full max-w-md bg-[#F5F1EB] rounded-lg px-3 py-2 font-body text-sm text-[#2D3436] placeholder:text-[#2D3436]/40 outline-none focus:ring-2 focus:ring-[#52796F]/20"
                      />
                    </div>
                    <div>
                      <label className="font-body font-medium text-sm text-[#2D3436] block mb-1.5">
                        Workflow Path
                      </label>
                      <input
                        type="text"
                        placeholder="/inventory/replenishment-automation"
                        className="w-full max-w-md bg-[#F5F1EB] rounded-lg px-3 py-2 font-body text-sm text-[#2D3436] placeholder:text-[#2D3436]/40 outline-none focus:ring-2 focus:ring-[#52796F]/20"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-[rgba(27,67,50,0.1)] p-6 w-full max-w-md shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="font-display text-xl text-[#1B4332] mb-4">Add New User</h3>
            <div className="space-y-4">
              <div>
                <label className="font-body text-xs font-semibold text-[#2D3436]/60 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full bg-[#F5F1EB] rounded-lg px-3 py-2 font-body text-sm text-[#2D3436] outline-none focus:ring-2 focus:ring-[#52796F]/20"
                />
              </div>
              <div>
                <label className="font-body text-xs font-semibold text-[#2D3436]/60 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="e.g. jane@company.com"
                  className="w-full bg-[#F5F1EB] rounded-lg px-3 py-2 font-body text-sm text-[#2D3436] outline-none focus:ring-2 focus:ring-[#52796F]/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-xs font-semibold text-[#2D3436]/60 block mb-1">Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'user')}
                    className="w-full bg-[#F5F1EB] rounded-lg px-3 py-2 font-body text-sm text-[#2D3436] outline-none"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="font-body text-xs font-semibold text-[#2D3436]/60 block mb-1">Status</label>
                  <select
                    value={newUserStatus}
                    onChange={(e) => setNewUserStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full bg-[#F5F1EB] rounded-lg px-3 py-2 font-body text-sm text-[#2D3436] outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-full border border-[rgba(27,67,50,0.2)] text-[#2D3436]/80 font-body font-medium text-sm hover:bg-[#F5F1EB]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newUserName.trim() && newUserEmail.trim()) {
                    const newUser: AdminUser = {
                      id: Date.now(),
                      name: newUserName,
                      email: newUserEmail,
                      role: newUserRole,
                      status: newUserStatus,
                    };
                    setUsers([...users, newUser]);
                    setNewUserName('');
                    setNewUserEmail('');
                    setNewUserRole('user');
                    setNewUserStatus('active');
                    setShowAddModal(false);
                  }
                }}
                className="px-4 py-2 rounded-full bg-[#52796F] text-white font-body font-medium text-sm hover:bg-[#3d5c54]"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-[rgba(27,67,50,0.1)] p-6 w-full max-w-md shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="font-display text-xl text-[#1B4332] mb-4">Edit User</h3>
            <div className="space-y-4">
              <div>
                <label className="font-body text-xs font-semibold text-[#2D3436]/60 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  placeholder="e.g. Jane Doe"
                  className="w-full bg-[#F5F1EB] rounded-lg px-3 py-2 font-body text-sm text-[#2D3436] outline-none focus:ring-2 focus:ring-[#52796F]/20"
                />
              </div>
              <div>
                <label className="font-body text-xs font-semibold text-[#2D3436]/60 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  placeholder="e.g. jane@company.com"
                  className="w-full bg-[#F5F1EB] rounded-lg px-3 py-2 font-body text-sm text-[#2D3436] outline-none focus:ring-2 focus:ring-[#52796F]/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-xs font-semibold text-[#2D3436]/60 block mb-1">Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'admin' | 'user' })}
                    className="w-full bg-[#F5F1EB] rounded-lg px-3 py-2 font-body text-sm text-[#2D3436] outline-none"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="font-body text-xs font-semibold text-[#2D3436]/60 block mb-1">Status</label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full bg-[#F5F1EB] rounded-lg px-3 py-2 font-body text-sm text-[#2D3436] outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-full border border-[rgba(27,67,50,0.2)] text-[#2D3436]/80 font-body font-medium text-sm hover:bg-[#F5F1EB]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editingUser.name.trim() && editingUser.email.trim()) {
                    setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
                    setEditingUser(null);
                  }
                }}
                className="px-4 py-2 rounded-full bg-[#52796F] text-white font-body font-medium text-sm hover:bg-[#3d5c54]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
