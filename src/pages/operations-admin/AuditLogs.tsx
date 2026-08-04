import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import API from '../../api/axios';
import { FiUsers, FiClock, FiFileText, FiShield, FiCalendar } from 'react-icons/fi';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await API.get('/api/super-admin/audit-logs');
      setLogs(res.data || []);
    } catch (err) {
      console.error("Error fetching audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super-admin': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      case 'manager-admin': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'finance-admin': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'academic-admin': case 'teacher-admin': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'teacher': return 'bg-teal-500/10 text-teal-500 border-teal-500/20';
      default: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-2">
                <FiShield className="text-indigo-500" /> Account Creation History & Audit Log
              </h1>
              <p className="text-[var(--text-muted)] text-sm mt-1">Official system registry of registered user profiles, creation authorities, and audit remarks.</p>
            </div>
            <div className="bg-indigo-500/10 text-indigo-500 px-4 py-2 rounded-xl text-sm font-bold border border-indigo-500/20">
              Total Accounts: {logs.length}
            </div>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[32px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[var(--input-bg)] text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">User Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">System Role</th>
                    <th className="px-6 py-4">Created By (Authority)</th>
                    <th className="px-6 py-4">Audit Remarks</th>
                    <th className="px-6 py-4">Creation Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)] font-medium">
                        Loading system audit logs...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)] font-medium">
                        No audit records found.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log: any, idx) => (
                      <tr key={log._id || idx} className="hover:bg-[var(--input-bg)] transition-colors text-sm font-semibold">
                        <td className="px-6 py-4 text-[var(--text-main)] font-black">{log.name}</td>
                        <td className="px-6 py-4 text-[var(--text-muted)]">{log.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${getRoleBadgeColor(log.role)}`}>
                            {log.role?.replace(/-/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[var(--text-main)]">
                          👔 {log.createdBy || 'Super Admin'}
                        </td>
                        <td className="px-6 py-4 text-xs text-[var(--text-muted)] max-w-xs truncate" title={log.remarks}>
                          {log.remarks || 'Initial System User'}
                        </td>
                        <td className="px-6 py-4 text-[var(--text-muted)] text-xs">
                          <span className="flex items-center gap-1">
                            <FiClock /> {new Date(log.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuditLogs;
