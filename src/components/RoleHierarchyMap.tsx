import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiShield, FiUserCheck, FiDollarSign, FiBookOpen, FiUsers,
  FiUserPlus, FiArrowRight, FiLayers, FiCheckCircle,
  FiLock, FiMail, FiEye, FiEyeOff,
  FiCopy, FiCheck, FiSearch, FiInfo, FiGrid, FiX
} from 'react-icons/fi';

// ── Detailed Role Data ──────────────────────────────────────────────────────────
export interface RoleInfo {
  id: string;
  title: string;
  subTitle: string;
  description: string;
  icon: React.ReactNode;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glow: string;
  levelBadge: string;
  levelNum: number;
  email: string;
  password: string;
  path: string;
  reportsTo: string | null;
  manages: string[];
  permissions: string[];
}

export const ROLES_DATA: RoleInfo[] = [
  {
    id: 'super-admin',
    title: 'Super Admin',
    subTitle: 'Supreme Authority & Full System Ownership',
    description: 'Complete system control — create/delete sub-admins, view all system logs, global fee structure, and full database access.',
    icon: <FiShield />,
    emoji: '👑',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
    glow: 'rgba(239,68,68,0.4)',
    levelBadge: 'Level 1 — Top Authority',
    levelNum: 1,
    email: 'admin@vasantvalley.edu',
    password: 'Admin@123',
    path: '/super-admin',
    reportsTo: null,
    manages: ['Manager Admin', 'Finance Admin'],
    permissions: [
      'Full System Administration & Controls',
      'Create & Delete Sub-Admin Accounts',
      'Global School Settings & Configurations',
      'View Real-time Audit & Diagnostic Logs',
      'Access All Financial, Student & Academic Data'
    ]
  },
  {
    id: 'manager-admin',
    title: 'Manager Admin',
    subTitle: 'Executive Operations & Branch Oversight',
    description: 'Executive admin overseeing Teacher & Student Admin branch and Finance, ensuring smooth operations across all departments.',
    icon: <FiUserCheck />,
    emoji: '👔',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.35)',
    glow: 'rgba(59,130,246,0.35)',
    levelBadge: 'Level 2 — Executive Management',
    levelNum: 2,
    email: 'manager@vasantvalley.edu',
    password: 'Manager@123',
    path: '/manager-admin',
    reportsTo: 'Super Admin',
    manages: ['Teacher & Student Admin', 'Finance Admin'],
    permissions: [
      'Oversee Academic & Student Operations',
      'Monitor Faculty & Administrative Workflows',
      'Review Departmental Performance Stats',
      'Direct Escalation Link to Super Admin'
    ]
  },
  {
    id: 'finance-admin',
    title: 'Finance Admin',
    subTitle: 'Accounts, Billing & Financial Management',
    description: 'Manages student fee structures, billing invoices, payment collections, outstanding dues, and financial reports.',
    icon: <FiDollarSign />,
    emoji: '💰',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    glow: 'rgba(16,185,129,0.35)',
    levelBadge: 'Level 2 — Finance Branch',
    levelNum: 2,
    email: 'finance@vasantvalley.edu',
    password: 'Finance@123',
    path: '/finance-admin',
    reportsTo: 'Super Admin',
    manages: [],
    permissions: [
      'Create & Manage Student Fee Invoices',
      'Record Cash / Online Fee Payments',
      'Track Outstanding Fee Dues & Defaulters',
      'Export Financial Statements & Ledgers'
    ]
  },
  {
    id: 'academic-admin',
    title: 'Teacher & Student Admin',
    subTitle: 'Academic Operations, Faculty, Admissions & Student Management',
    description: 'Unified administrative portal controlling teacher directory, class teacher assignments, subject allocation, student master profiles, admissions desk, timetables, and exam results.',
    icon: <FiBookOpen />,
    emoji: '👩‍🏫',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.12)',
    borderColor: 'rgba(139, 92, 246, 0.35)',
    glow: 'rgba(139,92,246,0.35)',
    levelBadge: 'Level 3 — Academic & Student Branch',
    levelNum: 3,
    email: 'chetanmohane27@gmail.com',
    password: 'T123@',
    path: '/academic-admin',
    reportsTo: 'Manager Admin',
    manages: ['Class Teacher', 'Subject Teacher', 'Student / Parent Portal'],
    permissions: [
      'Faculty Profiles & Subject Allocation',
      'Manage Student Master Profiles & Admissions Desk',
      'Manage Class Sections, Allocations & Promotions',
      'Schedule Exams & Monitor Grade Books',
      'Approve Academic & Student Applications'
    ]
  },
  {
    id: 'class-teacher',
    title: 'Class Teacher Portal',
    subTitle: 'Class In-Charge & Daily Attendance',
    description: 'Class teacher portal for marking daily attendance, issuing student report cards, managing class notices, and parent updates.',
    icon: <FiCheckCircle />,
    emoji: '🏫',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.35)',
    glow: 'rgba(34, 197, 94, 0.35)',
    levelBadge: 'Level 4 — Field Portal',
    levelNum: 4,
    email: 'chetanmohane5@gmail.com',
    password: 'C123@',
    path: '/class-teacher',
    reportsTo: 'Teacher & Student Admin',
    manages: ['Class Students'],
    permissions: [
      'Mark Daily Roll Call Attendance',
      'View & Generate Class Student Report Cards',
      'Publish Class Announcements & Conduct Remarks',
      'Approve Class Student Leave Requests'
    ]
  },
  {
    id: 'subject-teacher',
    title: 'Subject Teacher',
    subTitle: 'Subject Lessons, Homework & Grading',
    description: 'Subject teacher portal for tracking subject syllabus, assigning homework/assignments, entering marks, and grading tests.',
    icon: <FiBookOpen />,
    emoji: '📚',
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.12)',
    borderColor: 'rgba(168, 85, 247, 0.35)',
    glow: 'rgba(168,85,247,0.35)',
    levelBadge: 'Level 4 — Field Portal',
    levelNum: 4,
    email: 'chetanmohane2729@gmail.com',
    password: 'B123@',
    path: '/teacher',
    reportsTo: 'Teacher & Student Admin',
    manages: [],
    permissions: [
      'Post Subject Homework & Class Assignments',
      'Enter Test Marks & Subject Exam Scores',
      'Track Subject Syllabus Progress',
      'View Assigned Class Timetables'
    ]
  },
  {
    id: 'student-parent',
    title: 'Student / Parent Portal',
    subTitle: 'Student Dashboard & Parent Tracking',
    description: 'Self-service dashboard for students and parents to view attendance percentage, exam grades, homework, and pay fees online.',
    icon: <FiLayers />,
    emoji: '👨‍👩‍👦',
    color: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
    glow: 'rgba(56,189,248,0.35)',
    levelBadge: 'Level 4 — User Portal',
    levelNum: 4,
    email: 'student8a1@vasantvalley.edu',
    password: 'Password@123',
    path: '/student',
    reportsTo: 'Teacher & Student Admin',
    manages: [],
    permissions: [
      'View Personal Academic Performance & Grades',
      'Check Daily Attendance History',
      'Pay School Fees Online & Download Receipts',
      'Submit Digital Leave Applications'
    ]
  }
];

// ── Helper Copy Component ──────────────────────────────────────────────────────
const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '6px',
        padding: '3px 7px',
        color: copied ? '#10b981' : '#94a3b8',
        cursor: 'pointer',
        fontSize: '11px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        transition: 'all 0.2s',
      }}
    >
      {copied ? <FiCheck size={12} /> : <FiCopy size={12} />}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
};

// ── Role Detail Drawer Modal ───────────────────────────────────────────────────
const RoleDetailModal: React.FC<{
  role: RoleInfo | null;
  onClose: () => void;
  onNavigate: (role: RoleInfo) => void;
}> = ({ role, onClose, onNavigate }) => {
  const [showPassword, setShowPassword] = useState(false);
  if (!role) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'linear-gradient(145deg, #0f172a, #1e293b)',
          border: `1.5px solid ${role.borderColor}`,
          borderRadius: '24px',
          padding: '28px',
          boxShadow: `0 25px 60px -15px ${role.glow}, 0 0 30px rgba(0,0,0,0.8)`,
          color: '#f8fafc',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <FiX size={16} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: role.bgColor,
              border: `1.5px solid ${role.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              flexShrink: 0,
              boxShadow: `0 8px 20px ${role.glow}`,
            }}
          >
            {role.emoji}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#fff' }}>{role.title}</h3>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: role.bgColor,
                  color: role.color,
                  border: `1px solid ${role.borderColor}`,
                  letterSpacing: '0.05em',
                }}
              >
                {role.levelBadge}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: role.color, fontWeight: 600 }}>{role.subTitle}</p>
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '20px', background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
          {role.description}
        </p>

        {/* Hierarchy Context */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Reports To</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: role.reportsTo ? '#38bdf8' : '#94a3b8' }}>
              {role.reportsTo || '👑 None (Root Authority)'}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Directly Manages</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: role.manages.length ? role.color : '#64748b' }}>
              {role.manages.length ? role.manages.join(', ') : '🔒 Terminal Node (Portals)'}
            </div>
          </div>
        </div>

        {/* Demo Credentials Box */}
        <div
          style={{
            background: '#020617',
            borderRadius: '14px',
            padding: '16px',
            border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: '20px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: '12px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>🔑 Demo Login Credentials</span>
            <span style={{ fontSize: '10px', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '999px' }}>Ready to Use</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiMail size={14} color="#64748b" />
                <span style={{ fontSize: '12px', color: '#e2e8f0', fontFamily: 'monospace' }}>{role.email}</span>
              </div>
              <CopyButton text={role.email} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiLock size={14} color="#64748b" />
                <span style={{ fontSize: '12px', color: '#e2e8f0', fontFamily: 'monospace' }}>
                  {showPassword ? role.password : '••••••••••••'}
                </span>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'inline-flex', padding: 0 }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff size={13} /> : <FiEye size={13} />}
                </button>
              </div>
              <CopyButton text={role.password} />
            </div>
          </div>
        </div>

        {/* Permissions List */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '0.05em', marginBottom: '10px', textTransform: 'uppercase' }}>
            🛡️ Role Permissions & Capabilities
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {role.permissions.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}>
                <span style={{ color: role.color, fontWeight: 'bold', marginTop: '1px' }}>✓</span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            onClose();
            onNavigate(role);
          }}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${role.color}, color-mix(in srgb, ${role.color} 80%, #000))`,
            color: '#fff',
            fontWeight: 800,
            fontSize: '14px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: `0 8px 24px ${role.glow}`,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <span>Login / Switch to {role.title} Portal</span>
          <FiArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

// ── Interactive Tree Node ──────────────────────────────────────────────────────
const RoleTreeNode: React.FC<{
  role: RoleInfo;
  size?: 'lg' | 'md' | 'sm';
  onOpenDetails: (role: RoleInfo) => void;
  onDirectLogin: (role: RoleInfo) => void;
}> = ({ role, size = 'md', onOpenDetails, onDirectLogin }) => {
  const [isHovered, setIsHovered] = useState(false);

  const styleMap = {
    lg: { width: '280px', padding: '20px', titleSize: '16px', iconSize: '46px', emojiSize: '24px' },
    md: { width: '235px', padding: '16px', titleSize: '14px', iconSize: '40px', emojiSize: '20px' },
    sm: { width: '195px', padding: '14px', titleSize: '13px', iconSize: '36px', emojiSize: '18px' },
  }[size];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpenDetails(role)}
      style={{
        width: styleMap.width,
        padding: styleMap.padding,
        background: isHovered
          ? `linear-gradient(145deg, rgba(30,41,59,0.95), rgba(15,23,42,0.98))`
          : `rgba(15, 23, 42, 0.85)`,
        border: `1.5px solid ${isHovered ? role.color : role.borderColor}`,
        borderRadius: '20px',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: isHovered
          ? `0 16px 35px ${role.glow}, 0 0 0 1px ${role.color}30`
          : `0 6px 20px rgba(0,0,0,0.3)`,
        backdropFilter: 'blur(16px)',
        textAlign: 'center',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {/* Level Tag */}
      <span
        style={{
          fontSize: '9px',
          fontWeight: 800,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          padding: '2px 8px',
          borderRadius: '999px',
          background: role.bgColor,
          color: role.color,
          border: `1px solid ${role.borderColor}`,
        }}
      >
        L{role.levelNum} • {role.title}
      </span>

      {/* Icon Badge */}
      <div
        style={{
          width: styleMap.iconSize,
          height: styleMap.iconSize,
          borderRadius: '14px',
          background: role.bgColor,
          border: `1px solid ${role.borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: styleMap.emojiSize,
          boxShadow: `0 4px 15px ${role.glow}`,
          transition: 'transform 0.25s',
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
        }}
      >
        {role.emoji}
      </div>

      {/* Title */}
      <h4 style={{ margin: '2px 0 0', fontSize: styleMap.titleSize, fontWeight: 800, color: '#f8fafc' }}>
        {role.title}
      </h4>

      {/* Subtitle */}
      <p style={{ margin: 0, fontSize: '11px', color: role.color, fontWeight: 600, opacity: 0.9 }}>
        {role.subTitle}
      </p>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '6px', width: '100%', marginTop: '6px' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(role);
          }}
          style={{
            flex: 1,
            padding: '6px 10px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#cbd5e1',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            transition: 'all 0.2s',
          }}
        >
          <FiInfo size={11} /> Permissions
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDirectLogin(role);
          }}
          style={{
            padding: '6px 10px',
            borderRadius: '8px',
            background: role.color,
            border: 'none',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            boxShadow: `0 4px 12px ${role.glow}`,
            transition: 'all 0.2s',
          }}
        >
          Go <FiArrowRight size={11} />
        </button>
      </div>
    </div>
  );
};

// ── Main Role Hierarchy Diagram Component ──────────────────────────────────────
const RoleHierarchyMap: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<RoleInfo | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'quick'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all');

  const handleNavigate = (role: RoleInfo) => {
    localStorage.setItem('role', role.id);
    localStorage.setItem('adminPanelDemo', JSON.stringify({ email: role.email, path: role.path }));
    navigate(role.path);
  };

  const filteredRoles = ROLES_DATA.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.subTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === 'all' || r.levelNum === levelFilter;
    return matchesSearch && matchesLevel;
  });

  return (
    <div
      className="p-3.5 sm:p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl relative max-w-full overflow-hidden text-slate-50"
      style={{
        background: 'linear-gradient(160deg, #020617 0%, #0f172a 50%, #020617 100%)',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Decorative Blob */}
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header Banner */}
      <div className="text-center mb-6">
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/25 color-red-400 text-xs font-extrabold tracking-wider mb-2"
          style={{ color: '#f87171' }}
        >
          <FiShield size={14} /> SUPER ADMIN • ROLE ACCESS CONTROL
        </div>

        <h2 className="text-lg sm:text-3xl font-black mt-1 mb-2 tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          Role Access & Credentials Overview
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Comprehensive role list for Vasant Valley School ERP. Click any role card to inspect permissions or launch its portal directly.
        </p>
      </div>

      {/* Control Bar: View Switcher + Search + Level Filter */}
      <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-3 mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 max-w-full overflow-hidden">
        {/* View Modes */}
        <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-white/5 w-full md:w-auto">
          {[
            { id: 'cards', label: '📇 Role Cards', icon: <FiGrid size={13} /> },
            { id: 'quick', label: '⚡ Credentials Table', icon: <FiKeyIcon size={13} /> },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id as any)}
              className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewMode === mode.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Level Filters & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          {/* Level Pills (Scrollable) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full w-full sm:w-auto scrollbar-none">
            {[
              { id: 'all', label: 'All Levels' },
              { id: 1, label: 'L1 Top' },
              { id: 2, label: 'L2 Exec' },
              { id: 3, label: 'L3 Branch' },
              { id: 4, label: 'L4 Portals' },
            ].map((lvl) => (
              <button
                key={String(lvl.id)}
                onClick={() => setLevelFilter(lvl.id as any)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  levelFilter === lvl.id 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' 
                    : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-[180px] shrink-0">
            <FiSearch size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-white/10 bg-slate-950 text-slate-100 text-xs outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ════════ VIEW MODE 1: ROLE CARDS GRID ════════ */}
      {viewMode === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {filteredRoles.map((role) => (
            <RoleTreeNode key={role.id} role={role} size="md" onOpenDetails={setSelectedRole} onDirectLogin={handleNavigate} />
          ))}
        </div>
      )}

      {/* ════════ VIEW MODE 3: QUICK CREDENTIALS TABLE ════════ */}
      {viewMode === 'quick' && (
        <div style={{ background: '#020617', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Role Title</th>
                  <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Hierarchy Level</th>
                  <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Demo Email</th>
                  <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Password</th>
                  <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((role, i) => (
                  <tr key={role.id} style={{ borderBottom: i < filteredRoles.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>{role.emoji}</span>
                        <div>
                          <div style={{ fontWeight: 700, color: '#f8fafc' }}>{role.title}</div>
                          <div style={{ fontSize: '11px', color: role.color }}>{role.subTitle}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: role.bgColor, color: role.color, border: `1px solid ${role.borderColor}` }}>
                        Level {role.levelNum}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>{role.email}</span>
                        <CopyButton text={role.email} />
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>{role.password}</span>
                        <CopyButton text={role.password} />
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => handleNavigate(role)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          background: role.color,
                          color: '#fff',
                          border: 'none',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        Launch <FiArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Details Modal Drawer */}
      <RoleDetailModal role={selectedRole} onClose={() => setSelectedRole(null)} onNavigate={handleNavigate} />
    </div>
  );
};

// Helper Key Icon
const FiKeyIcon: React.FC<{ size?: number }> = ({ size = 13 }) => (
  <span style={{ fontSize: `${size}px`, lineHeight: 1 }}>🔑</span>
);

export default RoleHierarchyMap;
