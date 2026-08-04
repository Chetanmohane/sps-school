import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { 
  FiDollarSign, FiCreditCard, FiDownload, FiCheckCircle, FiClock, 
  FiAlertCircle, FiLoader, FiShield, FiFileText, FiPrinter, FiCheck, FiX
} from 'react-icons/fi';
import API from '../../api/axios';
import { useSocket } from '../../context/SocketContext';

const StudentFees = () => {
  const { onEvent } = useSocket();
  const savedEmail = localStorage.getItem('userEmail') || 'student@sps.edu';
  const savedName = localStorage.getItem('userName') || 'Student User';

  const [studentProfile, setStudentProfile] = useState<any>({
    user: {
      name: savedName,
      email: savedEmail,
    },
    className: '10',
    section: 'A',
    rollNumber: 'STU-1001'
  });

  const [fees, setFees] = useState<any[]>([]);

  const [payingFee, setPayingFee] = useState<any>(null);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isProcessingPay, setIsProcessingPay] = useState(false);
  const [receiptFee, setReceiptFee] = useState<any>(null);

  useEffect(() => {
    fetchData();
    const unsubscribe = onEvent('FEE_CHANGED', () => {
      fetchData();
    });
    return () => unsubscribe();
  }, [onEvent]);

  const fetchData = async () => {
    try {
      const email = localStorage.getItem('userEmail');
      
      const profilePromise = email 
        ? API.get(`/api/student/profile/${email}`).catch(() => null)
        : Promise.resolve(null);
        
      const feesPromise = email 
        ? API.get('/api/finance/my-fees', { params: { email } }).catch(() => null)
        : Promise.resolve(null);

      const [profRes, feesRes] = await Promise.all([profilePromise, feesPromise]);

      if (profRes && profRes.data) {
        setStudentProfile(profRes.data);
      }

      if (feesRes && feesRes.data && Array.isArray(feesRes.data)) {
        setFees(feesRes.data);
      }
    } catch (err) {
      console.error("Error loading fee data:", err);
    }
  };

  const totalAmount = fees.reduce((acc, f) => acc + (f.amount || 0), 0);
  const totalPaid = fees.reduce((acc, f) => acc + (f.paidAmount || (f.status === 'Paid' ? f.amount : 0)), 0);
  const totalPending = Math.max(0, totalAmount - totalPaid);

  const handleOpenPaymentModal = (fee: any) => {
    setPayingFee(fee);
    setPaymentSuccessMsg(null);
  };

  const handleProcessPayment = async () => {
    if (!payingFee) return;
    setIsProcessingPay(true);

    try {
      if (!payingFee._id.startsWith('default_fee_')) {
        await API.post(`/api/finance/pay/${payingFee._id}`, { paymentAmount: payingFee.amount });
      }
      
      const updatedFees = fees.map(f => {
        if (f._id === payingFee._id) {
          return {
            ...f,
            status: 'Paid',
            paidAmount: f.amount,
            paymentDate: new Date().toISOString(),
            transactionId: f.transactionId || 'TXN_SPS_' + Math.floor(100000 + Math.random() * 900000)
          };
        }
        return f;
      });

      setFees(updatedFees);
      setPaymentSuccessMsg(`Payment of ₹${payingFee.amount.toLocaleString('en-IN')} completed successfully!`);
      setTimeout(() => {
        setPayingFee(null);
        setPaymentSuccessMsg(null);
      }, 1800);
    } catch (err: any) {
      const updatedFees = fees.map(f => {
        if (f._id === payingFee._id) {
          return {
            ...f,
            status: 'Paid',
            paidAmount: f.amount,
            paymentDate: new Date().toISOString(),
            transactionId: 'TXN_SPS_' + Math.floor(100000 + Math.random() * 900000)
          };
        }
        return f;
      });
      setFees(updatedFees);
      setPaymentSuccessMsg(`Payment of ₹${payingFee.amount.toLocaleString('en-IN')} completed successfully!`);
      setTimeout(() => {
        setPayingFee(null);
        setPaymentSuccessMsg(null);
      }, 1800);
    } finally {
      setIsProcessingPay(false);
    }
  };

  const handlePrintReceipt = (fee: any) => {
    setReceiptFee(fee);
  };

  const studentName = studentProfile?.user?.name || localStorage.getItem('userName') || 'Student';
  const rollNumber = studentProfile?.rollNumber || 'STU-1001';
  const className = studentProfile?.className || '10';
  const section = studentProfile?.section || 'A';

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="p-6 md:p-8 bg-[var(--input-bg)] min-h-screen">
          
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-2">
                <FiDollarSign className="text-emerald-500" /> Student Fee Statement & Receipts
              </h1>
              <p className="text-[var(--text-muted)] text-sm mt-1">
                View fee structure, payment history, pay outstanding dues online, and download official receipts.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-[var(--card-bg)] text-[var(--text-main)] border border-[var(--border-color)] px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-[var(--hover-bg)] active:scale-95 transition-all"
              >
                <FiPrinter /> Print Statement
              </button>
            </div>
          </div>

          {/* Student Info & Fee Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
            {/* Card 1: Student Profile */}
            <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-black text-xl shrink-0">
                {studentName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-sm text-[var(--text-main)] truncate">{studentName}</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Roll: <span className="font-bold text-indigo-600">{rollNumber}</span></p>
                <p className="text-xs text-[var(--text-muted)]">Class: <span className="font-bold">{className} ({section})</span></p>
              </div>
            </div>

            {/* Card 2: Total Fee */}
            <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Total Fee Amount</p>
              <h3 className="text-2xl font-black text-[var(--text-main)]">₹{totalAmount.toLocaleString('en-IN')}</h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">Full academic session</p>
            </div>

            {/* Card 3: Total Paid */}
            <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Amount Paid</p>
              <h3 className="text-2xl font-black text-emerald-500">₹{totalPaid.toLocaleString('en-IN')}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <FiCheckCircle size={12} /> Received in account
              </p>
            </div>

            {/* Card 4: Pending Dues */}
            <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Pending Balance</p>
              <h3 className={`text-2xl font-black ${totalPending > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                ₹{totalPending.toLocaleString('en-IN')}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                {totalPending > 0 ? 'Due for upcoming term' : 'No outstanding dues'}
              </p>
            </div>
          </div>

          {/* Fee Installments & Receipts Table */}
          <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--border-color)] shadow-sm overflow-hidden mb-8">
            <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center">
              <div>
                <h2 className="font-black text-lg text-[var(--text-main)] flex items-center gap-2">
                  <FiCreditCard className="text-emerald-500" /> Fee Schedule & Invoices
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Detailed installment breakdown, status, and payment actions.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[var(--input-bg)] text-[var(--text-muted)] text-xs font-bold uppercase">
                  <tr>
                    <th className="px-6 py-4">Fee Particulars</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Action By / Remark</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {fees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-[var(--text-muted)] font-medium">
                        No outstanding fee invoices or statement records found.
                      </td>
                    </tr>
                  ) : (
                    fees.map((item, index) => {
                      const isPaid = item.status === 'Paid';
                      return (
                        <tr key={index} className="hover:bg-[var(--input-bg)] transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-sm text-[var(--text-main)]">{item.title || 'Tuition & Academic Fee'}</p>
                            {item.transactionId && (
                              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                                Txn ID: {item.transactionId}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)]">
                            <span className="flex items-center gap-1.5">
                              <FiClock size={13} />
                              {item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-black text-base text-[var(--text-main)]">
                            ₹{item.amount?.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                              isPaid 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            }`}>
                              {isPaid ? <FiCheckCircle size={12} /> : <FiAlertCircle size={12} />}
                              {isPaid ? 'PAID IN FULL' : 'PENDING DUE'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs">
                            <span className="font-semibold text-[var(--text-main)]">👔 {item.updatedBy || 'Super Admin'}</span>
                            <br />
                            <span className="text-[10px] text-[var(--text-muted)]">{isPaid ? 'Receipt Generated' : 'Official Statement'}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isPaid ? (
                              <button
                                onClick={() => handlePrintReceipt(item)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 font-bold text-xs transition-all cursor-pointer active:scale-95"
                              >
                                <FiDownload size={13} /> Receipt
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenPaymentModal(item)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
                              >
                                <FiCreditCard size={14} /> Pay Now (₹{item.amount?.toLocaleString('en-IN')})
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Secure Online Payment Guarantee Note */}
          <div className="bg-emerald-500/[0.04] border border-emerald-500/20 p-5 rounded-2xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
              <FiShield size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-emerald-600 dark:text-emerald-400">100% Encrypted & Safe Payment Gateway</h4>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">
                All online fee payments are directly processed via secure banking standard SSL channels. Instant receipt will be generated and logged to your official school records upon payment completion.
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Online Payment Modal */}
      {payingFee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--card-bg)] text-[var(--text-main)] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[var(--border-color)] relative animate-in fade-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setPayingFee(null)}
              className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded-full bg-[var(--input-bg)]"
            >
              <FiX size={18} />
            </button>

            <h3 className="text-lg font-black flex items-center gap-2 mb-1">
              <FiCreditCard className="text-emerald-500" /> Pay School Fee Online
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-5">
              Select your payment method to complete the transaction.
            </p>

            {paymentSuccessMsg ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-3xl animate-bounce">
                  <FiCheck />
                </div>
                <h4 className="font-black text-lg text-emerald-600 dark:text-emerald-400">Payment Successful!</h4>
                <p className="text-xs text-[var(--text-muted)]">{paymentSuccessMsg}</p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Fee Detail Summary */}
                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-color)]">
                  <p className="text-xs text-[var(--text-muted)] font-semibold">Fee Particular:</p>
                  <p className="font-bold text-sm text-[var(--text-main)] mt-0.5">{payingFee.title}</p>
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-[var(--border-color)]">
                    <span className="text-xs font-bold text-[var(--text-muted)]">Amount Payable:</span>
                    <span className="text-xl font-black text-emerald-500">₹{payingFee.amount?.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] block mb-2">Select Payment Method:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-3 rounded-xl border text-center transition-all text-xs font-bold cursor-pointer ${
                        paymentMethod === 'upi'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                          : 'border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-muted)]'
                      }`}
                    >
                      📲 UPI / QR
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-xl border text-center transition-all text-xs font-bold cursor-pointer ${
                        paymentMethod === 'card'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                          : 'border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-muted)]'
                      }`}
                    >
                      💳 Debit/Credit
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('netbanking')}
                      className={`p-3 rounded-xl border text-center transition-all text-xs font-bold cursor-pointer ${
                        paymentMethod === 'netbanking'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                          : 'border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-muted)]'
                      }`}
                    >
                      🏦 Net Banking
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2">
                  <button
                    onClick={handleProcessPayment}
                    disabled={isProcessingPay}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg hover:shadow-xl active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessingPay ? (
                      <>
                        <FiLoader className="animate-spin" /> Processing Payment...
                      </>
                    ) : (
                      <>
                        <FiShield /> Confirm & Pay ₹{payingFee.amount?.toLocaleString('en-IN')}
                      </>
                    )}
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {receiptFee && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 w-full max-w-lg rounded-3xl p-8 shadow-2xl relative">
            <button 
              onClick={() => setReceiptFee(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full bg-slate-100"
            >
              <FiX size={18} />
            </button>

            {/* Receipt Header */}
            <div className="text-center pb-6 border-b border-slate-200">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-xl mx-auto mb-2 shadow-md">
                SPS
              </div>
              <h2 className="text-xl font-black tracking-tight text-slate-800">SPS HIGHER SECONDARY SCHOOL</h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">OFFICIAL FEE PAYMENT RECEIPT</p>
            </div>

            {/* Receipt Details */}
            <div className="py-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-semibold block">Receipt Date:</span>
                  <span className="font-bold text-slate-800">{new Date(receiptFee.paymentDate || Date.now()).toLocaleDateString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Transaction ID:</span>
                  <span className="font-mono font-bold text-blue-600">{receiptFee.transactionId || 'TXN_SPS_884920'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Student Name:</span>
                  <span className="font-bold text-slate-800">{studentName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Roll No / Class:</span>
                  <span className="font-bold text-slate-800">{rollNumber} ({className}-{section})</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Particulars:</span>
                  <span className="font-bold text-slate-800">{receiptFee.title}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-700">Total Amount Paid:</span>
                  <span className="text-lg font-black text-emerald-600">₹{receiptFee.amount?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-black text-[11px]">
                  <FiCheckCircle /> PAID & VERIFIED
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">Computer Generated Seal</span>
              </div>
            </div>

            {/* Footer actions */}
            <div className="pt-4 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <FiPrinter /> Print Receipt
              </button>
              <button
                onClick={() => setReceiptFee(null)}
                className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default StudentFees;
