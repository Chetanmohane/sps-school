import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import API from '../../api/axios';
import {
  FiUserPlus, FiX, FiEyeOff, FiEye, FiEdit2, FiTrash2,
  FiPlus, FiSearch, FiCheckSquare, FiUsers, FiFileText, FiLayers
} from 'react-icons/fi';
import { useSharedState } from '../../hooks/useSharedState';
import StudentAdminTabs from '../../components/StudentAdminTabs';
import StudentProfiles from './StudentProfiles';
import Admissions from './Admission';
import ClassAllocation from './ClassAllocation';
import Promotions from './Promotions';

/* ── Shared dummy data (used across all tabs) ── */
const INIT_STUDENTS = [
  { id:'S001', name:'Rahul Verma',   email:'rahul.v@student.com',  phone:'+919876001001', class:'10', section:'A', roll:'01', dob:'2010-04-12', gender:'Male',   parent:'Ramesh Verma',  parentPhone:'+919876002001', blood:'B+',  address:'12, MG Road, Delhi',        status:'Active',   admission:'2020-06-01', fee:'Paid'    },
  { id:'S002', name:'Priya Das',     email:'priya.d@student.com',  phone:'+919876001002', class:'9',  section:'B', roll:'12', dob:'2011-07-22', gender:'Female', parent:'Sunita Das',    parentPhone:'+919876002002', blood:'O+',  address:'45, Nehru Nagar, Mumbai',   status:'Active',   admission:'2021-06-01', fee:'Pending' },
  { id:'S003', name:'Vikram Singh',  email:'vikram.s@student.com', phone:'+919876001003', class:'10', section:'A', roll:'05', dob:'2010-01-30', gender:'Male',   parent:'Ajay Singh',    parentPhone:'+919876002003', blood:'A+',  address:'78, Lal Bagh, Bangalore',   status:'Active',   admission:'2020-06-01', fee:'Paid'    },
  { id:'S004', name:'Neha Sharma',   email:'neha.s@student.com',   phone:'+919876001004', class:'8',  section:'C', roll:'18', dob:'2012-09-15', gender:'Female', parent:'Kavita Sharma', parentPhone:'+919876002004', blood:'AB+', address:'22, Ring Road, Chennai',    status:'Active',   admission:'2022-06-01', fee:'Overdue' },
  { id:'S005', name:'Arjun Nair',    email:'arjun.n@student.com',  phone:'+919876001005', class:'9',  section:'A', roll:'03', dob:'2011-03-08', gender:'Male',   parent:'Biju Nair',     parentPhone:'+919876002005', blood:'O-',  address:'33, Lake View, Kochi',      status:'Active',   admission:'2021-06-01', fee:'Paid'    },
  { id:'S006', name:'Divya Rao',     email:'divya.r@student.com',  phone:'+919876001006', class:'7',  section:'B', roll:'09', dob:'2013-11-20', gender:'Female', parent:'Suresh Rao',    parentPhone:'+919876002006', blood:'B-',  address:'56, Gandhi Road, Pune',     status:'Active',   admission:'2023-06-01', fee:'Paid'    },
  { id:'S007', name:'Karan Mehta',   email:'karan.m@student.com',  phone:'+919876001007', class:'8',  section:'A', roll:'22', dob:'2012-05-14', gender:'Male',   parent:'Dinesh Mehta',  parentPhone:'+919876002007', blood:'A-',  address:'89, Civil Lines, Jaipur',   status:'Active',   admission:'2022-06-01', fee:'Partial' },
  { id:'S008', name:'Sanya Kapoor',  email:'sanya.k@student.com',  phone:'+919876001008', class:'10', section:'B', roll:'07', dob:'2010-08-29', gender:'Female', parent:'Rajan Kapoor',  parentPhone:'+919876002008', blood:'O+',  address:'101, Park Street, Kolkata', status:'Inactive', admission:'2020-06-01', fee:'Overdue' },
  { id:'S009', name:'Aditya Kumar',  email:'aditya.k@student.com', phone:'+919876001009', class:'6',  section:'A', roll:'11', dob:'2014-02-17', gender:'Male',   parent:'Ramesh Kumar',  parentPhone:'+919876002009', blood:'A+',  address:'14, Station Road, Nagpur',  status:'Active',   admission:'2024-06-01', fee:'Paid'    },
  { id:'S010', name:'Pooja Singh',   email:'pooja.s@student.com',  phone:'+919876001010', class:'7',  section:'A', roll:'04', dob:'2013-06-05', gender:'Female', parent:'Vinod Singh',   parentPhone:'+919876002010', blood:'B+',  address:'67, Saket Colony, Agra',    status:'Active',   admission:'2023-06-01', fee:'Pending' },
];

const INIT_ADMISSIONS = [
  { id:'ADM001', name:'Ravi Tiwari',   email:'ravi.t@gmail.com',   phone:'+919877001001', dob:'2011-03-10', class:'9',  section:'', address:'12 Arjun Nagar, UP',      status:'Pending',  applied:'2026-06-10', parent:'Sunil Tiwari',  parentPhone:'+919877002001', docs:'Submitted'  },
  { id:'ADM002', name:'Meera Pillai',  email:'meera.p@gmail.com',  phone:'+919877001002', dob:'2012-08-22', class:'8',  section:'', address:'45 Vivekananda St, TN',   status:'Approved', applied:'2026-06-12', parent:'Rajan Pillai',  parentPhone:'+919877002002', docs:'Verified'   },
  { id:'ADM003', name:'Suraj Yadav',   email:'suraj.y@gmail.com',  phone:'+919877001003', dob:'2010-12-01', class:'10', section:'', address:'78 Patel Colony, MP',     status:'Rejected', applied:'2026-06-08', parent:'Arun Yadav',    parentPhone:'+919877002003', docs:'Incomplete' },
  { id:'ADM004', name:'Anjali Gupta',  email:'anjali.g@gmail.com', phone:'+919877001004', dob:'2013-05-15', class:'7',  section:'', address:'33 Shastri Road, Raj',    status:'Pending',  applied:'2026-06-15', parent:'Pradeep Gupta', parentPhone:'+919877002004', docs:'Submitted'  },
  { id:'ADM005', name:'Rohan Mishra',  email:'rohan.m@gmail.com',  phone:'+919877001005', dob:'2014-07-30', class:'6',  section:'', address:'56 Gandhi Nagar, Bihar',  status:'Approved', applied:'2026-06-18', parent:'Sanjeev Mishra',parentPhone:'+919877002005', docs:'Verified'   },
  { id:'ADM006', name:'Kavya Nair',    email:'kavya.n@gmail.com',  phone:'+919877001006', dob:'2011-11-11', class:'9',  section:'', address:'89 Marine Drive, Kerala', status:'Pending',  applied:'2026-06-20', parent:'Saji Nair',     parentPhone:'+919877002006', docs:'Pending'    },
];

const AC = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6'];
const avt = n => ({ bg: AC[(n?.charCodeAt(0)||0)%AC.length], ini: n ? n.split(' ').map(x=>x[0]).join('').toUpperCase().slice(0,2) : '?' });

const StudentAdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`/academic-admin${location.search}`, { replace: true });
  }, [location, navigate]);

  const activeTab = (() => {
    const t = new URLSearchParams(location.search).get('tab');
    return ['dashboard','admissions','profiles','allocation','promotions'].includes(t) ? t : 'dashboard';
  })();

  const goTab = t => navigate(t === 'dashboard' ? '/student-admin' : `/student-admin?tab=${t}`);

  /* shared state */
  const [students, setStudents]     = useSharedState('erp_students', INIT_STUDENTS);
  const [admissions, setAdmissions] = useSharedState('erp_admissions', INIT_ADMISSIONS);
  const [statusMsg, setStatusMsg]   = useState(null);

  /* search / filter */
  const [srchP, setSrchP] = useState('');
  const [fClass, setFClass] = useState('all');
  const [fSec, setFSec]     = useState('all');
  const [fStatus, setFStatus] = useState('all');
  const [srchAdm, setSrchAdm] = useState('');
  const [fAdmStatus, setFAdmStatus] = useState('all');

  /* modals */
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showEditStudent, setShowEditStudent] = useState(false);
  const [editSt, setEditSt] = useState(null);
  const [showAddAdm, setShowAddAdm] = useState(false);
  const [showViewAdm, setShowViewAdm] = useState(false);
  const [viewAdm, setViewAdm] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewAdm, setShowNewAdm] = useState(false);

  /* forms */
  const blankSt = { name:'', email:'', phone:'', password:'', class:'', section:'', roll:'', dob:'', gender:'', parent:'', parentPhone:'', blood:'', address:'' };
  const blankAdm = { name:'', email:'', phone:'', dob:'', class:'', section:'', parent:'', parentPhone:'', address:'', docs:'Pending' };
  const [stForm, setStForm]   = useState(blankSt);
  const [admForm, setAdmForm] = useState(blankAdm);
  const [newStForm, setNewStForm] = useState({ name:'', email:'', phone:'', password:'', class:'', section:'', roll:'', dob:'', address:'' });

  /* class allocation */
  const [allocClass, setAllocClass] = useState('');
  const [allocSec, setAllocSec]     = useState('');

  /* promotions */
  const [promoFrom, setPromoFrom] = useState('');
  const [promoTo, setPromoTo]     = useState('');
  const [promoSel, setPromoSel]   = useState([]);

  const trigger = (text, type='success') => { setStatusMsg({text,type}); setTimeout(()=>setStatusMsg(null),4000); };

  const inS: React.CSSProperties = { width:'100%', padding:'9px 12px', border:'1px solid var(--border-color)', borderRadius:'7px', backgroundColor:'var(--input-bg)', color:'var(--text-main)', outline:'none', boxSizing:'border-box' as const, fontSize:'13px' };
  const lb  = { display:'block', marginBottom:'4px', fontWeight:'600', fontSize:'12px', color:'var(--text-main)' };

  const statusBadge = (s) => {
    const map = {
      Active:   ['var(--success-bg)','var(--success)'],
      Inactive: ['var(--danger-bg)','var(--danger)'],
      Approved: ['var(--success-bg)','var(--success)'],
      Pending:  ['rgba(251,191,36,.15)','#d97706'],
      Rejected: ['var(--danger-bg)','var(--danger)'],
      Paid:     ['var(--success-bg)','var(--success)'],
      Overdue:  ['var(--danger-bg)','var(--danger)'],
      Partial:  ['rgba(139,92,246,.15)','#7c3aed'],
      Verified: ['var(--success-bg)','var(--success)'],
      Submitted:['rgba(99,102,241,.15)','#6366f1'],
      Incomplete:['var(--danger-bg)','var(--danger)'],
    };
    const [bg,cl] = map[s]||['var(--panel-bg)','var(--text-muted)'];
    return <span style={{padding:'2px 9px',borderRadius:'20px',fontSize:'11px',fontWeight:'700',backgroundColor:bg,color:cl}}>{s}</span>;
  };

  /* derived */
  const classes = [...new Set(students.map(s=>s.class))].sort((a,b)=>+a-+b);
  const sections = [...new Set(students.map(s=>s.section))].sort();

  const filtPro = students.filter(s => {
    const ms = !srchP || s.name.toLowerCase().includes(srchP.toLowerCase()) || s.email.toLowerCase().includes(srchP.toLowerCase()) || s.roll.includes(srchP);
    const mc = fClass==='all' || s.class===fClass;
    const mse= fSec==='all'  || s.section===fSec;
    const mst= fStatus==='all'|| s.status===fStatus;
    return ms&&mc&&mse&&mst;
  });

  const filtAdm = admissions.filter(a => {
    const ms = !srchAdm || a.name.toLowerCase().includes(srchAdm.toLowerCase()) || a.email.toLowerCase().includes(srchAdm.toLowerCase());
    const mst= fAdmStatus==='all'||a.status===fAdmStatus;
    return ms&&mst;
  });

  const allocStudents = students.filter(s => s.class===allocClass && s.section===allocSec);
  const promoStudents = students.filter(s => s.class===promoFrom);

  /* handlers */
  const addStudent = e => {
    e.preventDefault();
    setStudents(p=>[...p,{...stForm,id:`S${String(p.length+1).padStart(3,'0')}`,status:'Active',admission:new Date().toISOString().slice(0,10),fee:'Pending'}]);
    setStForm(blankSt); setShowAddStudent(false); trigger('Student profile added!');
  };
  const saveStudent = e => {
    e.preventDefault();
    setStudents(p=>p.map(s=>s.id===editSt.id?{...s,...editSt}:s));
    setShowEditStudent(false); trigger('Student profile updated!');
  };
  const delStudent = id => {
    if(!window.confirm('Delete this student?')) return;
    setStudents(p=>p.filter(s=>s.id!==id)); trigger('Student deleted.');
  };

  const addAdmission = e => {
    e.preventDefault();
    setAdmissions(p=>[...p,{...admForm,id:`ADM${String(p.length+1).padStart(3,'0')}`,status:'Pending',applied:new Date().toISOString().slice(0,10)}]);
    setAdmForm(blankAdm); setShowAddAdm(false); trigger('Admission application added!');
  };
  const updateAdmStatus = (id,status) => {
    setAdmissions(p=>p.map(a=>a.id===id?{...a,status}:a));
    trigger(`Admission ${status.toLowerCase()} successfully!`);
  };
  const approveToStudent = adm => {
    const ns = { id:`S${String(students.length+1).padStart(3,'0')}`, name:adm.name, email:adm.email, phone:adm.phone, class:adm.class, section:adm.section||'A', roll:String(students.length+1).padStart(2,'0'), dob:adm.dob, gender:'', parent:adm.parent, parentPhone:adm.parentPhone, blood:'', address:adm.address, status:'Active', admission:new Date().toISOString().slice(0,10), fee:'Pending' };
    setStudents(p=>[...p,ns]);
    setAdmissions(p=>p.map(a=>a.id===adm.id?{...a,status:'Approved'}:a));
    trigger(`${adm.name} approved and added to Student Profiles!`);
    setShowViewAdm(false);
  };

  const handlePromo = () => {
    if(!promoTo||promoSel.length===0){trigger('Select target class and students.','danger');return;}
    setStudents(p=>p.map(s=>promoSel.includes(s.id)?{...s,class:promoTo,section:s.section,roll:s.roll}:s));
    trigger(`${promoSel.length} student(s) promoted to Class ${promoTo}!`);
    setPromoSel([]); setPromoFrom(''); setPromoTo('');
  };

  const TABS = [
    {id:'dashboard',   label:'📊 Dashboard'},
    {id:'admissions',  label:'📋 Admissions'},
    {id:'profiles',    label:'👥 Student Profiles'},
    {id:'allocation',  label:'🎓 Class Allocation'},
    {id:'promotions',  label:'⬆️ Promotions'},
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />

        <div style={{ padding: '24px 24px 0 24px' }}>
          <StudentAdminTabs />
        </div>

        <div style={{ padding: '0 24px 24px 24px' }}>

          {/* Status banner */}
          {statusMsg&&(
            <div style={{marginBottom:'14px',padding:'11px 16px',borderRadius:'8px',fontSize:'13px',fontWeight:'600',backgroundColor:statusMsg.type==='danger'?'var(--danger-bg)':'var(--success-bg)',color:statusMsg.type==='danger'?'var(--danger)':'var(--success)',border:`1px solid ${statusMsg.type==='danger'?'rgba(248,113,113,0.2)':'rgba(52,211,153,0.2)'}`}}>
              {statusMsg.text}
            </div>
          )}

          {/* ══════════════════════════════════
               TAB: DASHBOARD
          ══════════════════════════════════ */}
          {activeTab==='dashboard'&&(
            <div>
              <div style={{marginBottom:'22px'}}>
                <h1 style={{margin:0,fontSize:'22px',fontWeight:'800'}}>🎓 Student Admin Portal — Student Operations & Admissions</h1>
                <p style={{color:'var(--text-muted)',margin:'4px 0 0',fontSize:'13px'}}>Official Student Admin Portal — Admissions, student profiles, class allocations, and academic promotions.</p>
              </div>

              {/* Stats */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'14px',marginBottom:'24px'}}>
                {[
                  {label:'Total Students',   v:students.length,                                      c:'var(--primary)',   icon:'🎓'},
                  {label:'Active Students',  v:students.filter(s=>s.status==='Active').length,        c:'var(--success)',   icon:'✅'},
                  {label:'New Admissions',   v:admissions.filter(a=>a.status==='Pending').length,     c:'#d97706',         icon:'📋'},
                  {label:'Approved Today',   v:admissions.filter(a=>a.status==='Approved').length,    c:'var(--success)',   icon:'✓'},
                  {label:'Unallocated',      v:students.filter(s=>!s.section).length,                c:'var(--danger)',    icon:'⚠️'},
                  {label:'Fee Defaulters',   v:students.filter(s=>s.fee==='Overdue').length,         c:'var(--danger)',    icon:'💸'},
                ].map((s,i)=>(
                  <div key={i} className="stat-card" style={{cursor:'default'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <div><span className="stat-title">{s.label}</span><div style={{fontSize:'26px',fontWeight:'700',color:s.c,marginTop:'4px'}}>{s.v}</div></div>
                      <span style={{fontSize:'26px'}}>{s.icon}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick links */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'14px',marginBottom:'24px'}}>
                {TABS.filter(t=>t.id!=='dashboard').map(t=>(
                  <button key={t.id} onClick={()=>goTab(t.id)}
                    className="admin-role-card"
                    style={{padding:'20px',backgroundColor:'var(--card-bg)',border:'1px solid var(--border-color)',borderRadius:'10px',cursor:'pointer',textAlign:'center',transition:'all 0.2s'}}>
                    <div style={{fontSize:'32px',marginBottom:'8px'}}>{t.label.split(' ')[0]}</div>
                    <div style={{fontWeight:'700',color:'var(--text-main)',fontSize:'14px'}}>{t.label.split(' ').slice(1).join(' ')}</div>
                  </button>
                ))}
              </div>

              {/* Recent activity */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'18px'}}>
                <div style={{backgroundColor:'var(--card-bg)',border:'1px solid var(--border-color)',borderRadius:'12px',padding:'20px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
                    <h3 style={{margin:0,fontSize:'15px',fontWeight:'700'}}>📋 Recent Admissions</h3>
                    <button onClick={()=>goTab('admissions')} style={{padding:'4px 10px',fontSize:'12px',backgroundColor:'var(--primary)',color:'white',border:'none',borderRadius:'5px',cursor:'pointer',fontWeight:'600'}}>View All</button>
                  </div>
                  {admissions.slice(0,5).map(a=>(
                    <div key={a.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 0',borderBottom:'1px solid var(--border-color)'}}>
                      <div style={{width:'32px',height:'32px',borderRadius:'50%',backgroundColor:avt(a.name).bg,display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'700',fontSize:'12px',flexShrink:0}}>{avt(a.name).ini}</div>
                      <div style={{flex:1}}><div style={{fontSize:'13px',fontWeight:'600',color:'var(--text-main)'}}>{a.name}</div><div style={{fontSize:'11px',color:'var(--text-muted)'}}>Class {a.class} • {a.applied}</div></div>
                      {statusBadge(a.status)}
                    </div>
                  ))}
                </div>
                <div style={{backgroundColor:'var(--card-bg)',border:'1px solid var(--border-color)',borderRadius:'12px',padding:'20px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
                    <h3 style={{margin:0,fontSize:'15px',fontWeight:'700'}}>🎓 Class-wise Strength</h3>
                    <button onClick={()=>goTab('profiles')} style={{padding:'4px 10px',fontSize:'12px',backgroundColor:'var(--primary)',color:'white',border:'none',borderRadius:'5px',cursor:'pointer',fontWeight:'600'}}>View All</button>
                  </div>
                  {['6','7','8','9','10'].map(cls=>{
                    const cnt=students.filter(s=>s.class===cls).length;
                    const pct=Math.round((cnt/students.length)*100)||0;
                    return(
                      <div key={cls} style={{marginBottom:'12px'}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
                          <span style={{fontSize:'13px',color:'var(--text-main)',fontWeight:'600'}}>Class {cls}</span>
                          <span style={{fontSize:'12px',color:'var(--text-muted)'}}>{cnt} students</span>
                        </div>
                        <div style={{height:'6px',backgroundColor:'var(--border-color)',borderRadius:'3px',overflow:'hidden'}}>
                          <div style={{width:`${pct}%`,height:'100%',backgroundColor:'var(--primary)',borderRadius:'3px'}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════
               TAB: ADMISSIONS
          ══════════════════════════════════ */}
          {activeTab==='admissions'&&(
            <Admissions />
          )}

          {/* ══════════════════════════════════
               TAB: STUDENT PROFILES
          ══════════════════════════════════ */}
          {activeTab==='profiles' && (
            <StudentProfiles />
          )}

          {/* ══════════════════════════════════
               TAB: CLASS ALLOCATION
          ══════════════════════════════════ */}
          {activeTab==='allocation'&&(
            <ClassAllocation />
          )}

          {/* ══════════════════════════════════
               TAB: PROMOTIONS
          ══════════════════════════════════ */}
          {activeTab==='promotions'&&(
            <Promotions />
          )}
        </div>

        {/* ── Edit Student Modal ── */}
        {showEditStudent&&editSt&&(
          <div onClick={()=>setShowEditStudent(false)} style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.6)',backdropFilter:'blur(8px)',display:'flex',justifyContent:'center',alignItems:'center',zIndex:1000,padding:'16px'}}>
            <div onClick={e=>e.stopPropagation()} style={{backgroundColor:'var(--card-bg)',border:'1px solid var(--border-color)',borderRadius:'14px',width:'100%',maxWidth:'620px',maxHeight:'90vh',overflowY:'auto',boxShadow:'0 25px 50px rgba(0,0,0,0.3)'}}>
              <div style={{padding:'18px 22px',borderBottom:'1px solid var(--border-color)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <h3 style={{margin:0,fontSize:'17px',fontWeight:'700'}}>✏️ Edit — {editSt.name}</h3>
                <button onClick={()=>setShowEditStudent(false)} style={{background:'none',border:'none',fontSize:'22px',cursor:'pointer',color:'var(--text-muted)'}}><FiX/></button>
              </div>
              <form onSubmit={saveStudent} style={{padding:'22px'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
                  {[{k:'name',l:'Full Name',t:'text'},{k:'email',l:'Email',t:'email'},{k:'password',l:'Password',t:'password'},{k:'phone',l:'Phone',t:'tel'},{k:'dob',l:'Date of Birth',t:'date'},{k:'parent',l:'Parent Name',t:'text'},{k:'parentPhone',l:'Parent Phone',t:'tel'},{k:'address',l:'Address',t:'text'},{k:'roll',l:'Roll No.',t:'text'},{k:'blood',l:'Blood Group',t:'text'}].map(f=>(
                    <div key={f.k}><label style={lb}>{f.l}</label><input type={f.t} value={editSt[f.k]||''} onChange={e=>setEditSt({...editSt,[f.k]:e.target.value})} style={inS}/></div>
                  ))}
                  <div><label style={lb}>Class</label><select value={editSt.class} onChange={e=>setEditSt({...editSt,class:e.target.value})} style={inS}>{[...Array(12)].map((_,i)=><option key={i+1} value={String(i+1)}>Class {i+1}</option>)}</select></div>
                  <div><label style={lb}>Section</label><select value={editSt.section} onChange={e=>setEditSt({...editSt,section:e.target.value})} style={inS}>{['A','B','C','D'].map(s=><option key={s}>{s}</option>)}</select></div>
                  <div><label style={lb}>Gender</label><select value={editSt.gender||''} onChange={e=>setEditSt({...editSt,gender:e.target.value})} style={inS}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
                  <div><label style={lb}>Status</label><select value={editSt.status} onChange={e=>setEditSt({...editSt,status:e.target.value})} style={inS}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
                </div>
                <div style={{display:'flex',gap:'10px',marginTop:'18px',paddingTop:'16px',borderTop:'1px solid var(--border-color)'}}>
                  <button type="submit" style={{flex:1,padding:'11px',backgroundColor:'var(--primary)',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:'700'}}>💾 Save Changes</button>
                  <button type="button" onClick={()=>setShowEditStudent(false)} style={{flex:1,padding:'11px',backgroundColor:'var(--panel-bg)',color:'var(--text-main)',border:'1px solid var(--border-color)',borderRadius:'8px',cursor:'pointer',fontWeight:'600'}}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── View Admission Modal ── */}
        {showViewAdm&&viewAdm&&(
          <div onClick={()=>setShowViewAdm(false)} style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.6)',backdropFilter:'blur(8px)',display:'flex',justifyContent:'center',alignItems:'center',zIndex:1000,padding:'16px'}}>
            <div onClick={e=>e.stopPropagation()} style={{backgroundColor:'var(--card-bg)',border:'1px solid var(--border-color)',borderRadius:'14px',width:'100%',maxWidth:'520px',boxShadow:'0 25px 50px rgba(0,0,0,0.3)'}}>
              <div style={{padding:'18px 22px',borderBottom:'1px solid var(--border-color)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <h3 style={{margin:0,fontSize:'17px',fontWeight:'700'}}>📋 Admission — {viewAdm.name}</h3>
                <button onClick={()=>setShowViewAdm(false)} style={{background:'none',border:'none',fontSize:'22px',cursor:'pointer',color:'var(--text-muted)'}}><FiX/></button>
              </div>
              <div style={{padding:'22px'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'18px'}}>
                  {[{l:'Application ID',v:viewAdm.id},{l:'Applied On',v:viewAdm.applied},{l:'Class Applied',v:`Class ${viewAdm.class}`},{l:'Status',v:viewAdm.status},{l:'Documents',v:viewAdm.docs},{l:'Date of Birth',v:viewAdm.dob},{l:'Phone',v:viewAdm.phone},{l:'Parent',v:viewAdm.parent},{l:'Parent Phone',v:viewAdm.parentPhone},{l:'Address',v:viewAdm.address}].map((d,i)=>(
                    <div key={i} style={{backgroundColor:'var(--panel-bg)',borderRadius:'8px',padding:'10px 12px'}}>
                      <div style={{fontSize:'11px',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:'3px'}}>{d.l}</div>
                      <div style={{fontSize:'13px',fontWeight:'600',color:'var(--text-main)'}}>{d.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:'10px'}}>
                  {viewAdm.status==='Pending'&&<>
                    <button onClick={()=>{updateAdmStatus(viewAdm.id,'Approved');setShowViewAdm(false);}} style={{flex:1,padding:'11px',backgroundColor:'var(--success)',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:'700'}}>✓ Approve</button>
                    <button onClick={()=>{updateAdmStatus(viewAdm.id,'Rejected');setShowViewAdm(false);}} style={{flex:1,padding:'11px',backgroundColor:'var(--danger-bg)',color:'var(--danger)',border:'1px solid rgba(248,113,113,0.2)',borderRadius:'8px',cursor:'pointer',fontWeight:'700'}}>✗ Reject</button>
                  </>}
                  {viewAdm.status==='Approved'&&<button onClick={()=>approveToStudent(viewAdm)} style={{flex:1,padding:'11px',backgroundColor:'#6366f1',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:'700'}}>➕ Enroll as Student</button>}
                  <button onClick={()=>setShowViewAdm(false)} style={{flex:1,padding:'11px',backgroundColor:'var(--panel-bg)',color:'var(--text-main)',border:'1px solid var(--border-color)',borderRadius:'8px',cursor:'pointer',fontWeight:'600'}}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default StudentAdminDashboard;
