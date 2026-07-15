import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { FiDollarSign, FiX, FiDownload } from 'react-icons/fi';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import API from '../../api/axios';

const FinanceAdminDashboard = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ studentId: '', amount: '', dueDate: '', status: 'Pending' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const [students, setStudents] = useState<any[]>([]); 
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [filters, setFilters] = useState({ className: '', section: '' });
  
  // Date Filters for Export
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all students and fees from DB in parallel
      const [studentsRes, feesRes] = await Promise.all([
        API.get('/api/admin/student-admin/students'),
        API.get('/api/finance/all')
      ]);

      const dbStudents = studentsRes.data.data || [];
      const dbFees = feesRes.data || [];

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
        const studentObj = f.studentId || {};
        const userObj = studentObj.user || {};
        return {
          id: f._id,
          _id: f._id,
          student: userObj.name || 'Unknown Student',
          studentId: studentObj._id || '',
          roll: studentObj.rollNumber || 'N/A',
          class: studentObj.className ? `Class ${studentObj.className}-${studentObj.section || ''}` : 'N/A',
          total: f.amount || 0,
          paid: f.status === 'Paid' ? f.amount : 0,
          due: f.status === 'Paid' ? 0 : f.amount,
          status: f.status || 'Pending',
          date: f.dueDate ? new Date(f.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          paymentDate: f.paymentDate ? new Date(f.paymentDate).toISOString().split('T')[0] : '',
        };
      });
      setTransactions(mappedFees);

    } catch (err: any) {
      console.error("Error loading finance dashboard data:", err);
      alert("Failed to load dashboard data from backend.");
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
    try {
      setLoading(true);
      if (editingId) {
        // Update existing record in DB
        await API.put(`/api/finance/update/${editingId}`, {
          amount: Number(formData.amount),
          status: formData.status
        });
        alert("Fee record updated successfully!");
      } else {
        // Create new record in DB
        await API.post('/api/finance/create-fee', {
          studentId: formData.studentId,
          amount: Number(formData.amount),
          dueDate: formData.dueDate
        });
        alert("Fee record created successfully!");
      }
      
      setEditingId(null);
      setShowModal(false);
      setFormData({ studentId: '', amount: '', dueDate: '', status: 'Pending' });
      
      // Reload updated data
      await fetchData();
    } catch (err: any) {
      alert("Error saving fee: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFee = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this fee record?")) return;
    try {
      setLoading(true);
      await API.delete(`/api/finance/delete/${id}`);
      alert("Fee record deleted successfully!");
      await fetchData();
    } catch (err: any) {
      alert("Error deleting fee: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (tx: any) => {
    setEditingId(tx.id);
    setFormData({
      studentId: tx.studentId || '',
      amount: tx.total.toString() || '0',
      dueDate: tx.date || '', 
      status: tx.status
    });
    setShowModal(true);
  };

  //--Generate Invoice-----
  const generateInvoice = (tx: any) => {
    const doc = new jsPDF();

    // 1. Branding & Header
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235); // Blue-600
    doc.text("SPS School - FEE RECEIPT", 105, 20, { align: "center" });

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

  const filteredTransactions = transactions.filter(tx => {
    let matchesDate = true;
    if (startDateFilter && endDateFilter) {
      matchesDate = tx.date >= startDateFilter && tx.date <= endDateFilter;
    } else if (startDateFilter) {
      matchesDate = tx.date >= startDateFilter;
    } else if (endDateFilter) {
      matchesDate = tx.date <= endDateFilter;
    }
    return matchesDate;
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

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div>
              <h1>Finance Dashboard</h1>
              <p style={{ color: 'var(--text-muted)' }}>Manage fee structures and collections.</p>
            </div>
            <button className="flex items-center gap-1 px-5 py-3 rounded-lg font-semibold transition-all shadow-sm bg-indigo-600 text-white" 
              onClick={() => {
                setEditingId(null);
                setFormData({ studentId: '', amount: '', dueDate: '', status: 'Pending' });
                setShowModal(true);
              }}>
              <FiDollarSign /> 
              <span> Create Fee Record </span> 
            </button>
          </div>

          <div className="cards-grid">
            {stats.map((stat, i) => (
              <div className="stat-card" key={i}>
                <span className="stat-title">{stat.title}</span>
                <span className="stat-value">{stat.value}</span>
                <div className="stat-indicator">
                  <div className="indicator-fill" style={{ width: stat.fill, backgroundColor: stat.color }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="table-container">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h3 className="mb-0">Recent Fee Transactions</h3>
              <div className="flex items-end gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1 uppercase">Start Date</label>
                  <input 
                    type="date" 
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    onClick={(e) => (e.target as any).showPicker && (e.target as any).showPicker()}
                    className="px-3 py-2 border rounded-lg text-sm bg-[var(--input-bg)] text-[var(--text-main)] outline-none focus:border-blue-500"
                    style={{ borderColor: 'var(--border-color)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1 uppercase">End Date</label>
                  <input 
                    type="date" 
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    onClick={(e) => (e.target as any).showPicker && (e.target as any).showPicker()}
                    className="px-3 py-2 border rounded-lg text-sm bg-[var(--input-bg)] text-[var(--text-main)] outline-none focus:border-blue-500"
                    style={{ borderColor: 'var(--border-color)' }}
                  />
                </div>
                <button 
                  onClick={downloadCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-all"
                >
                  <FiDownload /> Export Excel
                </button>
              </div>
            </div>
            {loading ? (
              <p>Loading transactions...</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Receipt No.</th>
                    <th>Student Name</th>
                    <th>Student Roll No.</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payment Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => {
                    return (
                      <tr key={tx.id}>
                        <td>{tx.id.slice(-8).toUpperCase()}</td>
                        <td>{tx.student}</td>
                        <td>{tx.roll}</td>
                        <td>{tx.total} ₹</td>
                        <td><span className={tx.status === 'Paid' ? 'badge approved' : 'badge pending'}>{tx.status}</span></td>
                        <td>{tx.date}</td>
                        <td className="flex items-center gap-2">
                          <button className="action-btn" onClick={() => generateInvoice(tx)}
                            disabled={tx.status !== 'Paid'} style={{ opacity: tx.status !== 'Paid' ? 0.5 : 1 }}>Generate Invoice</button>
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => handleEditClick(tx)}> ✏️ </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Create Fee Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-main)' }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>
                  {editingId ? "Update Fee Record" : "Create Fee Record"}
                </h2>
                <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }} className="hover:opacity-75">
                  <FiX size={24} />
                </button>
              </div>
              
              {editingId && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-main)' }}>Status</label>
                  <select className="w-full p-2 border rounded-lg mb-4"
                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', borderColor: 'var(--border-color)'  }}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              )}

              <form onSubmit={handleCreateFee} className="space-y-5">
                {!editingId && (
                  <>
                    {/* Step 1: Filter by Class & Section */}
                    <div className="grid grid-cols-2 gap-8">
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
                      <p className="text-[10px] text-blue-600 mt-1">
                        Showing {filteredStudents.length} students in this category.
                      </p>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-main)' }}>Amount (₹)</label>
                    <input 
                      type="number" required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', borderColor: 'var(--border-color)'  }}
                      value={formData.amount} 
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                  {!editingId && (
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-main)' }}>Due Date</label>
                      <input 
                        type="date" required
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', borderColor: 'var(--border-color)'  }}
                        value={formData.dueDate} 
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      />
                    </div>
                  )}
                </div>
                <div className="flex gap-3 pt-4">
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
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md"
                  >
                    {editingId ? "Update Record" : "Generate Fee"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FinanceAdminDashboard;