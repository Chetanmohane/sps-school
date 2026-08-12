import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { FiDollarSign, FiX, FiDownload } from 'react-icons/fi';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import API from '../../api/axios';
import { useSocket } from '../../context/SocketContext';

const FinanceAdminDashboard = () => {
  const { onEvent } = useSocket();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ studentId: '', amount: '', paidAmount: '', dueDate: '', status: 'Pending' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const [students, setStudents] = useState<any[]>([]); 
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [filters, setFilters] = useState({ className: '', section: '' });

  // Tab & Multi-Filter States
  const [activeTab, setActiveTab] = useState<'collections' | 'structure' | 'analytics'>('collections');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');

  // Date Filters for Export
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Fetch initial data & subscribe to live socket updates
  useEffect(() => {
    fetchData();
    const unsubscribe = onEvent('FEE_CHANGED', () => {
      fetchData();
      if (window.showToast) {
        window.showToast("⚡ Real-time Update: Student fee statement updated!", "success");
      }
    });
    return () => unsubscribe();
  }, [onEvent]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all students and fees from DB in parallel with allSettled
      const [studentsRes, feesRes] = await Promise.allSettled([
        API.get('/api/admin/student-admin/students'),
        API.get('/api/finance/all')
      ]);

      const dbStudents = studentsRes.status === 'fulfilled' ? (studentsRes.value.data?.data || []) : [];
      const dbFees = feesRes.status === 'fulfilled' ? (feesRes.value.data || []) : [];

      // Map DB students to expected frontend format
      const mappedStudents = dbStudents.map((s: any) => ({
        id: s._id,
        _id: s._id,
        name: s.user?.name || 'Unknown',
        email: s.user?.email || '',
        phone: s.user?.phone || '',
        class: s.className || '',
        section: s.section || '',
        roll: s.rollNumber || '',
      }));
      setStudents(mappedStudents);

      // Map DB fees to expected frontend format
      const mappedFees = dbFees.map((f: any) => {
        const studentObj = (typeof f.studentId === 'object' && f.studentId !== null) ? f.studentId : {};
        const userObj = (typeof studentObj.user === 'object' && studentObj.user !== null) ? studentObj.user : {};
        const totalAmount = Number(f.amount) || 0;
        let paidAmount = f.paidAmount !== undefined ? Number(f.paidAmount) : (f.status === 'Paid' ? totalAmount : 0);
        if (f.status === 'Paid') paidAmount = totalAmount;
        const pendingAmount = Math.max(0, totalAmount - paidAmount);

        let calculatedStatus = f.status || 'Pending';
        if (paidAmount >= totalAmount && totalAmount > 0) calculatedStatus = 'Paid';
        else if (paidAmount > 0 && paidAmount < totalAmount) calculatedStatus = 'Partial';
        else if (paidAmount === 0) calculatedStatus = 'Pending';

        let studentName = userObj.name;
        let rollNo = studentObj.rollNumber;
        let classStr = studentObj.className ? `Class ${studentObj.className}-${studentObj.section || ''}` : '';

        if (!studentName && f.studentId) {
          const targetId = typeof f.studentId === 'string' ? f.studentId : (f.studentId._id || '');
          const matchedStudent = mappedStudents.find((s: any) => String(s._id) === String(targetId) || String(s.id) === String(targetId));
          if (matchedStudent) {
            studentName = matchedStudent.name;
            rollNo = matchedStudent.roll;
            classStr = matchedStudent.class ? `Class ${matchedStudent.class}-${matchedStudent.section || ''}` : '';
          }
        }

        return {
          id: f._id,
          _id: f._id,
          student: studentName || 'Student User',
          studentId: studentObj._id || (typeof f.studentId === 'string' ? f.studentId : ''),
          roll: rollNo || 'STU-1001',
          class: classStr || 'Class 10-A',
          total: totalAmount,
          paid: paidAmount,
          due: pendingAmount,
          status: calculatedStatus,
          updatedBy: f.updatedBy || 'Super Admin',
          date: f.dueDate ? new Date(f.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          paymentDate: f.paymentDate ? new Date(f.paymentDate).toISOString().split('T')[0] : '',
        };
      });
      setTransactions(mappedFees);

    } catch (err: any) {
      console.error("Error loading finance dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };


  // Update list whenever Class or Section filter changes
  useEffect(() => {
    let result = students;
    if (filters.className) {
      result = result.filter(s => {
        const sClass = s.class || '';
        return sClass.trim() === filters.className.replace('Class ', '').replace('th', '').replace('rd', '').replace('nd', '').replace('st', '').trim();
      });
    }
    if (filters.section) {
      result = result.filter(s => s.section === filters.section);
    }
    if (!filters.className && !filters.section) {
      setFilteredStudents([]); 
    } 
    else {
      setFilteredStudents(result);
    }
  }, [filters, students]);

  const handleCreateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((localStorage.getItem('role') || '').toLowerCase() === 'manager-admin') {
      alert('Access Denied: Manager Admin has Read-Only access to financial records.');
      return;
    }
    try {
      setLoading(true);
      const amountNum = Number(formData.amount);
      const paidNum = Number(formData.paidAmount || 0);

      let calcStatus = formData.status;
      if (paidNum >= amountNum && amountNum > 0) calcStatus = "Paid";
      else if (paidNum > 0) calcStatus = "Partial";
      else calcStatus = "Pending";

      const adminUserName = localStorage.getItem("userName") || "Super Admin";
      const adminUserRole = localStorage.getItem("role") || "super-admin";
      const formattedAdmin = `${adminUserName} (${adminUserRole.replace('-', ' ').toUpperCase()})`;

      if (editingId) {
        // Update existing record in DB
        await API.put(`/api/finance/update/${editingId}`, {
          amount: amountNum,
          paidAmount: paidNum,
          status: calcStatus,
          updatedBy: formattedAdmin
        });
        alert(`Fee record updated successfully by ${formattedAdmin}!`);
      } else {
        // Create new record in DB
        await API.post('/api/finance/create-fee', {
          studentId: formData.studentId,
          amount: amountNum,
          paidAmount: paidNum,
          dueDate: formData.dueDate,
          updatedBy: formattedAdmin
        });
        alert(`Fee record created successfully by ${formattedAdmin}!`);
      }
      
      setEditingId(null);
      setShowModal(false);
      setFormData({ studentId: '', amount: '', paidAmount: '', dueDate: '', status: 'Pending' });
      
      // Reload updated data
      await fetchData();
    } catch (err: any) {
      alert("Error saving fee: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const [deleteFeeConfirmId, setDeleteFeeConfirmId] = useState<string | null>(null);

  const handleDeleteFee = (id: string) => {
    setDeleteFeeConfirmId(id);
  };

  const handleEditClick = (tx: any) => {
    setEditingId(tx._id || tx.id);
    setFormData({
      studentId: tx.studentId || '',
      amount: (tx.total || 0).toString(),
      paidAmount: (tx.paid || 0).toString(),
      dueDate: tx.date || '', 
      status: tx.status || 'Pending'
    });
    setShowModal(true);
  };

  //--Generate Invoice-----
  const generateInvoice = (tx: any) => {
    const doc = new jsPDF();

    // 1. Branding & Header
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235); // Blue-600
    doc.text("Vasant Valley School - FEE RECEIPT", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Sagar Public School, Bhopal", 105, 27, { align: "center" });
    doc.line(14, 32, 196, 32); // Horizontal line

    // 2. Invoice Metadata
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Receipt No: # ${tx.id.slice(-8).toUpperCase()}`, 14, 45);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 52);
    doc.text(`Status: ${tx.status.toUpperCase()}`, 150, 45);

    // 3. Student Details Box
    doc.setFillColor(245, 245, 245);
    doc.rect(14, 60, 182, 30, 'F');
    doc.setFont(undefined, 'bold');
    doc.text("STUDENT DETAILS:", 20, 68);
    doc.setFont(undefined, 'normal');
    doc.text(`Name: ${tx.student || "N/A"}`, 20, 75);
    doc.text(`Roll Number: ${tx.roll || "N/A"}`, 20, 82);
    doc.text(`Payment Mode: Online`, 145, 75);

    // 4. Table of Charges
    autoTable(doc, {
      startY: 100,
      head: [['Description', 'Amount (INR)']],
      body: [
        ['Tuition / Semester Fees', `Rs. ${tx.total}`],
        ['Service Charges', 'Rs. 0.00'],
      ],
      foot: [['TOTAL PAID', `Rs. ${tx.total}`]],
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] }, 
      styles: { font: "helvetica", fontSize: 10 },
    });

    // 5. Footer / Signature
    const finalY = (doc as any).lastAutoTable.finalY + 30;
    doc.text("__________________________", 140, finalY);
    doc.text("Authorized Signatory", 145, finalY + 7);
    
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("This is a computer-generated receipt and does not require a physical stamp.", 105, 285, { align: "center" });

    // 6. Save PDF
    doc.save(`Receipt_${tx.student}_${tx.id.slice(-4)}.pdf`);
  };

  // --- Dynamic Stats Calculation ---
  const calculateStats = () => {
    const rawPaid = transactions
      .filter(tx => tx.status === 'Paid')
      .reduce((acc, curr) => acc + (curr.total || 0), 0);

    const displayPaid = rawPaid >= 100000 ? `₹${(rawPaid / 100000).toFixed(1)}L` : `₹${rawPaid.toLocaleString('en-IN')}`;

    const rawPending = transactions
      .filter(tx => tx.status === 'Pending' || tx.status === 'Overdue')
      .reduce((acc, curr) => acc + (curr.due || 0), 0);

    const displayPending = rawPending >= 100000 ? `₹${(rawPending / 100000).toFixed(1)}L` : `₹${rawPending.toLocaleString('en-IN')}`;

    const totalExpected = rawPaid + rawPending;

    const recentPaymentsCount = transactions.filter(tx => {
      const thirtyDaysAgo = new Date(); 
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return tx.status === 'Paid' && new Date(tx.date) > thirtyDaysAgo;
    }).length;

    return [
      { 
        title: "Total Collection", 
        value: displayPaid, 
        fill: `${totalExpected > 0 ? Math.round((rawPaid / totalExpected) * 100) : 0}%`, 
        color: "var(--success)" 
      },
      { 
        title: "Pending Fees", 
        value: displayPending,
        fill: `${totalExpected > 0 ? Math.round((rawPending / totalExpected) * 100) : 0}%`,
        color: "var(--danger)" 
      },
      { 
        title: "Active Students", 
        value: [...new Set(transactions.map(t => t.student))].length, 
        fill: "5%", 
        color: "var(--primary)" 
      },
      { 
        title: "Recent (30 day)", 
        value: recentPaymentsCount, 
        fill: "5%", 
        color: "var(--warning)" 
      }
    ];
  };

  const stats = calculateStats();

  const uniqueClasses = Array.from(new Set(students.map((s: any) => s.class).filter(Boolean))).sort();
  const uniqueSections = Array.from(new Set(students.map((s: any) => s.section).filter(Boolean))).sort();

  const filteredTransactions = transactions.filter(tx => {
    const studentName = (tx.student || '').toLowerCase();
    const rollNo = (tx.roll || '').toLowerCase();
    const receiptNo = (tx.id || '').toLowerCase();
    const classStr = (tx.class || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchSearch = !searchQuery || studentName.includes(query) || rollNo.includes(query) || receiptNo.includes(query) || classStr.includes(query);
    const matchStatus = statusFilter === 'all' || tx.status === statusFilter;
    const matchClass = classFilter === 'all' || classStr.includes(classFilter.toLowerCase());
    const matchSection = sectionFilter === 'all' || classStr.includes(sectionFilter.toLowerCase());

    let matchesDate = true;
    if (startDateFilter && endDateFilter) {
      matchesDate = tx.date >= startDateFilter && tx.date <= endDateFilter;
    } else if (startDateFilter) {
      matchesDate = tx.date >= startDateFilter;
    } else if (endDateFilter) {
      matchesDate = tx.date <= endDateFilter;
    }

    return matchSearch && matchStatus && matchClass && matchSection && matchesDate;
  });

  const downloadCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("No data to export for the selected dates.");
      return;
    }
    const headers = ['Receipt No', 'Student Name', 'Roll No', 'Amount', 'Status', 'Payment Date'];
    
    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '';
      let stringVal = String(val);
      if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
        stringVal = `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    };

    const csvRows = [];
    csvRows.push(headers.map(escapeCSV).join(','));
    for (const tx of filteredTransactions) {
      const row = [
        tx.id.slice(-8),
        tx.student,
        tx.roll || 'N/A',
        tx.total,
        tx.status,
        tx.date
      ];
      csvRows.push(row.map(escapeCSV).join(','));
    }
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", 'finance_transactions_report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const userRole = (localStorage.getItem('role') || '').toLowerCase();
  const isManagerAdmin = userRole === 'manager-admin';
  const isSuperAdmin = userRole === 'super-admin' || userRole === 'super admin' || userRole.includes('super');
  const adminName = localStorage.getItem('userName') || (isManagerAdmin ? 'Manager Admin' : 'Finance Admin');

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="dashboard-container">

          {/* ── Dashboard Hero Header ── */}
          <div style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #1e3a5f 100%)',
            borderRadius: '20px', padding: '28px 32px', marginBottom: '24px',
            position: 'relative', overflow: 'hidden', border: '1px solid rgba(16,185,129,0.25)'
          }}>
            <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(16,185,129,0.18)', filter: 'blur(60px)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ background: 'rgba(16,185,129,0.3)', color: '#6ee7b7', fontSize: '11px', fontWeight: '800', padding: '3px 12px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.08em', border: '1px solid rgba(16,185,129,0.4)' }}>
                    💰 Finance Admin Portal
                  </span>
                  {isManagerAdmin && <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>• Read-Only Mode</span>}
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 4px', color: '#fff', letterSpacing: '-0.02em' }}>
                  Welcome, {adminName}! 👋
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.55)', margin: 0, fontSize: '13px', maxWidth: '460px' }}>
                  Manage student fee structures, billing collections, payment receipts and financial analytics.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {!isManagerAdmin && (
                  <button
                    onClick={() => { setEditingId(null); setFormData({ studentId: '', amount: '', paidAmount: '', dueDate: '', status: 'Pending' }); setShowModal(true); }}
                    style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(16,185,129,0.4)' }}
                  >
                    <FiDollarSign /> + Create Fee Record
                  </button>
                )}
                <button
                  onClick={downloadCSV}
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <FiDownload /> Export CSV
                </button>
              </div>
            </div>
          </div>

          {isManagerAdmin && (
            <div style={{
              backgroundColor: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.35)',
              color: '#d97706', padding: '12px 18px', borderRadius: '10px', marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, fontSize: '13px'
            }}>
              <span>👁️</span>
              <span><strong>Manager Admin Mode:</strong> Read-Only access. You can view transactions and export reports, but modifications are restricted.</span>
            </div>
          )}


          {/* Sub-Tab Navigation Bar */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            backgroundColor: 'var(--card-bg)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '16px', 
            padding: '12px 18px',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: '24px',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveTab('collections')}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: activeTab === 'collections' ? 'var(--primary)' : 'var(--panel-bg)',
                  color: activeTab === 'collections' ? '#fff' : 'var(--text-main)',
                  boxShadow: activeTab === 'collections' ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
                  transition: 'all 0.18s'
                }}
              >
                💰 Fee Collections & Billing ({filteredTransactions.length})
              </button>

              <button
                onClick={() => setActiveTab('structure')}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: activeTab === 'structure' ? '#10b981' : 'var(--panel-bg)',
                  color: activeTab === 'structure' ? '#fff' : 'var(--text-main)',
                  boxShadow: activeTab === 'structure' ? '0 4px 12px rgba(16,185,129,0.3)' : 'none',
                  transition: 'all 0.18s'
                }}
              >
                📑 Class Fee Structure Catalog
              </button>
            </div>

            <button 
              onClick={downloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-all cursor-pointer"
            >
              <FiDownload /> Export Excel (CSV)
            </button>
          </div>

          {/* Dynamic Stats Cards */}
          <div className="cards-grid" style={{ marginBottom: '24px' }}>
            {stats.map((stat, i) => (
              <div className="stat-card" key={i} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <span className="stat-title" style={{ color: 'var(--text-muted)' }}>{stat.title}</span>
                <span className="stat-value" style={{ color: 'var(--text-main)' }}>{stat.value}</span>
                <div className="stat-indicator">
                  <div className="indicator-fill" style={{ width: stat.fill, backgroundColor: stat.color }}></div>
                </div>
              </div>
            ))}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
               TAB 1 — FEE COLLECTIONS & TRANSACTIONS
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'collections' && (
            <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>💸 Student Fee Billing & Collection Records</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Complete billing history, payment receipts, and invoice status.</p>
                </div>
              </div>

              {/* ── Advanced Finance Multi-Filter Bar ── */}
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '12px', 
                marginBottom: '24px', 
                backgroundColor: 'var(--panel-bg)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '14px', 
                padding: '16px',
                alignItems: 'flex-end'
              }}>
                {/* Search */}
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    🔍 Search Student / Receipt
                  </label>
                  <input 
                    type="text" 
                    placeholder="Search name, roll, receipt..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Status Filter */}
                <div style={{ width: '140px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    💳 Status
                  </label>
                  <select 
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>

                {/* Class Filter */}
                <div style={{ width: '130px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    🏫 Class
                  </label>
                  <select 
                    value={classFilter}
                    onChange={e => setClassFilter(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    <option value="all">All Classes</option>
                    {uniqueClasses.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>

                {/* Section Filter */}
                <div style={{ width: '120px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    🅰️ Section
                  </label>
                  <select 
                    value={sectionFilter}
                    onChange={e => setSectionFilter(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    <option value="all">All Sections</option>
                    {uniqueSections.map(s => <option key={s} value={s}>Section {s}</option>)}
                  </select>
                </div>

                {/* Start Date */}
                <div style={{ width: '140px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    📅 From Date
                  </label>
                  <input 
                    type="date" 
                    value={startDateFilter}
                    onChange={e => setStartDateFilter(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* End Date */}
                <div style={{ width: '140px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    📅 To Date
                  </label>
                  <input 
                    type="date" 
                    value={endDateFilter}
                    onChange={e => setEndDateFilter(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Clear Button */}
                {(searchQuery || statusFilter !== 'all' || classFilter !== 'all' || sectionFilter !== 'all' || startDateFilter || endDateFilter) && (
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setClassFilter('all');
                      setSectionFilter('all');
                      setStartDateFilter('');
                      setEndDateFilter('');
                    }}
                    style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: '700', fontSize: '12px', cursor: 'pointer', height: '36px' }}
                  >
                    🧹 Clear
                  </button>
                )}
              </div>

              {loading ? (
                <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Loading transactions...</p>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Receipt No.</th>
                        <th>Student Name</th>
                        <th>Roll No.</th>
                        <th>Class</th>
                        <th>Total Fee</th>
                        <th>Paid Amount</th>
                        <th>Pending Due</th>
                        <th>Status</th>
                        <th>Last Modified By</th>
                        <th>Payment Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.length > 0 ? (
                        filteredTransactions.map((tx) => {
                          const totalAmt = tx.total || 0;
                          const paidAmt = tx.paid || 0;
                          const dueAmt = tx.due !== undefined ? tx.due : Math.max(0, totalAmt - paidAmt);
                          
                          let statusBadge = (
                            <span className="badge pending">
                              Pending
                            </span>
                          );
                          if (tx.status === 'Paid') {
                            statusBadge = <span className="badge approved">Fully Paid</span>;
                          } else if (tx.status === 'Partial') {
                            statusBadge = <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', backgroundColor: 'rgba(245,158,11,0.15)', color: '#d97706' }}>Partial Paid</span>;
                          } else if (tx.status === 'Overdue') {
                            statusBadge = <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>Overdue</span>;
                          }

                          return (
                            <tr key={tx.id}>
                              <td><strong>#{tx.id.slice(-8).toUpperCase()}</strong></td>
                              <td><strong style={{ color: 'var(--text-main)' }}>{tx.student}</strong></td>
                              <td>{tx.roll}</td>
                              <td>{tx.class}</td>
                              <td><strong>₹{totalAmt.toLocaleString('en-IN')}</strong></td>
                              <td><span style={{ color: '#10b981', fontWeight: '700' }}>₹{paidAmt.toLocaleString('en-IN')}</span></td>
                              <td>
                                {dueAmt > 0 ? (
                                  <span style={{ color: '#ef4444', fontWeight: '800', backgroundColor: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                                    ₹{dueAmt.toLocaleString('en-IN')} Due
                                  </span>
                                ) : (
                                  <span style={{ color: '#10b981', fontWeight: '600' }}>₹0 (Cleared)</span>
                                )}
                              </td>
                              <td>{statusBadge}</td>
                              <td>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  👔 {tx.updatedBy || 'Super Admin'}
                                </span>
                              </td>
                              <td>{tx.date}</td>
                              <td>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <button 
                                    className="action-btn" 
                                    onClick={() => generateInvoice(tx)}
                                    disabled={paidAmt === 0} 
                                    style={{ opacity: paidAmt === 0 ? 0.5 : 1, padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }}
                                  >
                                    📄 Receipt PDF
                                  </button>
                                  {!isManagerAdmin && (
                                    <>
                                      <button 
                                        style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: 'var(--panel-bg)', border: '1px solid var(--border-color)', cursor: 'pointer' }} 
                                        onClick={() => handleEditClick(tx)}
                                        title="Edit Fee / Payment"
                                      >
                                        ✏️
                                      </button>
                                      <button 
                                        style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#ef4444', fontWeight: 800, fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }} 
                                        onClick={() => handleDeleteFee(tx._id || tx.id)}
                                        title="Delete Fee Record"
                                      >
                                        🗑️ Delete
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={10} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No fee transaction records match your filters.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
               TAB 2 — CLASS FEE STRUCTURE CATALOG
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'structure' && (
            <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#10b981' }}>📑 Class-Wise Fee Structure Catalog (Academic Session 2026)</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Official tuition, admission, examination, and laboratory fee schedules for all grades.</p>
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Grade Level</th>
                      <th>Tuition Fee (Quarterly)</th>
                      <th>Admission Fee (One-Time)</th>
                      <th>Exam & Lab Fee</th>
                      <th>Sports & Activity Fee</th>
                      <th>Total Annual Fee</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { grade: 'Class 12th (Science/Commerce)', tuition: '₹18,500', admission: '₹5,000', exam: '₹2,500', activity: '₹1,500', total: '₹83,000', status: 'Active' },
                      { grade: 'Class 11th (Science/Commerce)', tuition: '₹17,500', admission: '₹5,000', exam: '₹2,500', activity: '₹1,500', total: '₹79,000', status: 'Active' },
                      { grade: 'Class 10th (Secondary)', tuition: '₹15,000', admission: '₹4,000', exam: '₹2,000', activity: '₹1,200', total: '₹67,200', status: 'Active' },
                      { grade: 'Class 9th (Secondary)', tuition: '₹14,500', admission: '₹4,000', exam: '₹2,000', activity: '₹1,200', total: '₹65,200', status: 'Active' },
                      { grade: 'Class 8th (Middle)', tuition: '₹12,500', admission: '₹3,500', exam: '₹1,800', activity: '₹1,000', total: '₹56,300', status: 'Active' },
                      { grade: 'Class 7th (Middle)', tuition: '₹12,000', admission: '₹3,500', exam: '₹1,800', activity: '₹1,000', total: '₹54,300', status: 'Active' },
                      { grade: 'Class 6th (Middle)', tuition: '₹11,500', admission: '₹3,500', exam: '₹1,800', activity: '₹1,000', total: '₹52,300', status: 'Active' },
                      { grade: 'Class 1st to 5th (Primary)', tuition: '₹9,500', admission: '₹3,000', exam: '₹1,500', activity: '₹800', total: '₹43,300', status: 'Active' },
                    ].map((row, idx) => (
                      <tr key={idx}>
                        <td><strong style={{ color: 'var(--text-main)' }}>{row.grade}</strong></td>
                        <td>{row.tuition}</td>
                        <td>{row.admission}</td>
                        <td>{row.exam}</td>
                        <td>{row.activity}</td>
                        <td><strong style={{ color: '#10b981' }}>{row.total}</strong></td>
                        <td>
                          <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Create / Edit Fee Modal */}
        {showModal && !isManagerAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-main)' }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>
                  {editingId ? "Update Fee Record & Payment" : "Create Fee Record"}
                </h2>
                <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }} className="hover:opacity-75">
                  <FiX size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateFee} className="space-y-5">
                {!editingId && (
                  <>
                    {/* Step 1: Filter by Class & Section */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Class</label>
                        <select 
                          className="w-full p-2 border rounded-lg"
                          style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', borderColor: 'var(--border-color)'  }}
                          onChange={(e) => setFilters({ ...filters, className: e.target.value })}
                        >
                          <option value="">All Classes</option>
                          <option value="12th">12th</option>
                          <option value="11th">11th</option>
                          <option value="10th">10th</option>
                          <option value="9th">9th</option>
                          <option value="8th">8th</option>
                          <option value="7th">7th</option>
                          <option value="6th">6th</option>
                          <option value="5th">5th</option>
                          <option value="4th">4th</option>
                          <option value="3rd">3rd</option>
                          <option value="2nd">2nd</option>
                          <option value="1st">1st</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Section</label>
                        <select 
                          className="w-full p-2 border rounded-lg"
                          style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', borderColor: 'var(--border-color)'  }}
                          onChange={(e) => setFilters({ ...filters, section: e.target.value })}
                        >
                          <option value="">All Sections</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                        </select>
                      </div>
                    </div>

                    {/* Step 2: Select Student from Filtered List */}
                    <div>
                      <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Student</label>
                      <select 
                        required
                        disabled={filteredStudents.length === 0}
                        className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${filteredStudents.length === 0 ? 'cursor-not-allowed opacity-50' : ''}`}
                        style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', borderColor: 'var(--border-color)'  }}
                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                        value={formData.studentId}
                      >
                        <option value="">Select Student...</option>
                        {filteredStudents.map(s => (
                          <option key={s.id} value={s.id}>
                            Roll {s.roll} - {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Amount & Paid Amount Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-main)' }}>Total Fee Amount (₹)</label>
                    <input 
                      type="number" required
                      placeholder="e.g. 10000"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', borderColor: 'var(--border-color)'  }}
                      value={formData.amount} 
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1" style={{ color: '#10b981' }}>Paid Amount (₹)</label>
                    <input 
                      type="number"
                      placeholder="e.g. 5000"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', borderColor: 'var(--border-color)'  }}
                      value={formData.paidAmount} 
                      onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                    />
                  </div>
                </div>

                {/* Live Pending Balance Calculation */}
                <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '10px 14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#ef4444' }}>⏳ Calculated Pending Balance:</span>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: '#ef4444' }}>
                    ₹{Math.max(0, (Number(formData.amount || 0) - Number(formData.paidAmount || 0))).toLocaleString('en-IN')}
                  </span>
                </div>

                {!editingId && (
                  <div>
                    <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-main)' }}>Due Date</label>
                    <input 
                      type="date" required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', borderColor: 'var(--border-color)'  }}
                      value={formData.dueDate} 
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                )}

                {editingId && (
                  <div>
                    <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-main)' }}>Status Override</label>
                    <select className="w-full p-2 border rounded-lg"
                      style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', borderColor: 'var(--border-color)'  }}
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Pending">Pending (Unpaid)</option>
                      <option value="Partial">Partial Paid</option>
                      <option value="Paid">Fully Paid</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border rounded-lg transition-all"
                    style={{ color: 'var(--text-main)', borderColor: 'var(--border-color)', backgroundColor: 'var(--panel-bg)' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md font-bold"
                  >
                    {editingId ? "Update Fee & Paid Status" : "Create Fee Record"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {deleteFeeConfirmId && (
          <div 
            className="modal-overlay" 
            onClick={() => setDeleteFeeConfirmId(null)} 
            style={{ 
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
              backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              zIndex: 9999, padding: '16px' 
            }}
          >
            <div 
              className="modal-content" 
              onClick={e => e.stopPropagation()} 
              style={{ 
                backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', 
                borderRadius: '20px', padding: '24px', width: '380px', maxWidth: '95%', 
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div style={{ background: 'var(--danger-bg)', padding: '10px', borderRadius: '12px', color: 'var(--danger)', display: 'flex' }}>
                  <span style={{ fontSize: '22px' }}>💸</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>Delete Fee Record</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>Action cannot be undone</p>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                Are you sure you want to delete this fee record from finance records?
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setDeleteFeeConfirmId(null)}
                  style={{ padding: '9px 18px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-main)', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    const id = deleteFeeConfirmId;
                    setDeleteFeeConfirmId(null);
                    try {
                      setLoading(true);
                      await API.delete(`/api/finance/delete/${id}`);
                      await fetchData();
                      if ((window as any).showToast) (window as any).showToast("Fee record deleted successfully!", "success");
                    } catch (err: any) {
                      if ((window as any).showToast) (window as any).showToast("Failed to delete fee record", "error");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  style={{ padding: '9px 18px', borderRadius: '10px', border: 'none', background: 'var(--danger)', color: 'white', fontWeight: 900, fontSize: '13px', cursor: 'pointer' }}
                >
                  Delete Record
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FinanceAdminDashboard;