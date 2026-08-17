import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { 
  ArrowRight, CheckCircle2, Target, Eye, Mail, Phone, MapPin, Send, 
  Clock, Sparkles, Facebook, Twitter, Linkedin, GraduationCap, Instagram, 
  Youtube, Beaker, Microchip, FlaskConical, Menu, X, LogIn, Sun, Moon, 
  Monitor, Book, Bus, ShieldCheck, Award, Laptop, ArrowUpRight, BookOpen, Quote,
  Trophy, Palette, Music, Feather, Smartphone, Download
} from "lucide-react";
import AppDownloadButton from "../components/AppDownloadButton";

const socialLinks = [
  { Icon: Instagram, href: "https://www.instagram.com/spssaketnagar/" },
  { Icon: Youtube, href: "http://www.youtube.com/@sagarpublicschool" },
  { Icon: Facebook, href: "https://www.facebook.com/thespssn/" },
];

// ==========================================
// 1. DYNAMIC NAVBAR COMPONENT
// ==========================================
const LandingNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "About", href: "#about" },
    { name: "Programs", href: "#programs" },
    { name: "Activities", href: "#activities" },
    { name: "Toppers", href: "#toppers" },
    { name: "Contact", href: "#contact" },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 ${scrolled ? (isDark ? "bg-[#081526]/95 border-b border-slate-800" : "bg-white/95 border-b border-slate-200") + " backdrop-blur-xl shadow-md py-2.5" : (isDark ? "bg-[#081526]" : "bg-white/90") + " py-3.5 sm:py-4"}`}>
      <div className="container mx-auto px-4 sm:px-6 flex justify-between items-center">
        {/* Brand Logo & Name */}
        <div 
          onClick={() => navigate('/')} 
          className="flex items-center gap-1.5 sm:gap-2 cursor-pointer max-w-[170px] sm:max-w-none shrink"
        >
          <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20 shrink-0">
            <GraduationCap size={20} className="text-white sm:w-6 sm:h-6" />
          </div>
          <span className="truncate font-black text-xs sm:text-xl tracking-tight">Vasant Valley School</span>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center space-x-6">
          <div className={`flex space-x-5 font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="relative text-xs uppercase tracking-wider hover:text-blue-500 transition-colors group py-1">
                {link.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </a>
            ))}
          </div>

          <div className={`flex items-center gap-3 pl-5 border-l ${isDark ? "border-slate-800" : "border-slate-200"}`}>
            {/* Theme Toggle Button */}
            <button onClick={toggleTheme} title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"} className={`p-2 rounded-xl transition-all border ${isDark ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800" : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"}`}>
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button onClick={() => navigate('/login')} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider hover:shadow-lg hover:shadow-blue-600/30 transition-all active:scale-95">
              <LogIn size={15} /> ERP Login
            </button>
          </div>
        </div>

        {/* Mobile Control Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden shrink-0">
          <button onClick={toggleTheme} className={`p-2 rounded-xl border ${isDark ? "bg-slate-900 border-slate-800 text-amber-400" : "bg-slate-100 border-slate-200 text-slate-700"}`}>
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button onClick={() => navigate('/login')} className="bg-blue-600 text-white p-2 rounded-xl font-bold text-xs flex items-center justify-center">
            <LogIn size={17} />
          </button>
          <button className={`p-2 rounded-xl border ${isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"}`} onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: "auto" }} 
            exit={{ opacity: 0, height: 0 }} 
            className={`lg:hidden ${isDark ? "bg-[#081526] border-slate-800" : "bg-white border-slate-200"} border-t overflow-hidden shadow-2xl`}
          >
            <div className="container mx-auto px-4 py-6 flex flex-col space-y-3">
              {navLinks.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href} 
                  onClick={() => setIsOpen(false)} 
                  className={`text-base font-extrabold py-2 px-3 rounded-xl transition-colors flex items-center justify-between ${
                    isDark ? "text-slate-200 hover:bg-slate-900 hover:text-blue-400" : "text-slate-800 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  <span>{link.name}</span>
                  <span className="text-xs text-blue-500">›</span>
                </a>
              ))}
              <div className={`pt-4 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                <button onClick={() => { setIsOpen(false); navigate('/login'); }} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg">
                  <LogIn size={16} /> Access School ERP Portal
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};


// ==========================================
// 2. MAIN LANDING PAGE COMPONENT
// ==========================================
const LandingPage = () => {
  const navigate = useNavigate();
  const form = useRef<HTMLFormElement>(null); 
  const [loading, setLoading] = useState(false);
  const [topperTab, setTopperTab] = useState<'10th' | '12th'>('10th');
  const [heroTab, setHeroTab] = useState<'campus' | 'labs' | 'toppers' | 'smart'>('campus');
  const [academicWing, setAcademicWing] = useState<'all' | 'pre' | 'primary' | 'secondary' | 'senior'>('all');
  const { isDark } = useTheme();

  const heroShowcases = [
    { id: 'campus', label: '🏫 Campus', title: 'Vasant Valley School Campus', img: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=2000', badge: 'Spacious & Safe Environment' },
    { id: 'labs', label: '🔬 STEM Labs', title: 'Modern Science & Computer Labs', img: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=2000', badge: 'Practical Scientific Learning' },
    { id: 'toppers', label: '🏆 Board Toppers', title: 'State Merit & Distinction Rankers', img: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=2000', badge: '100% M.P. Board Pass Record' },
    { id: 'smart', label: '💻 Smart Classes', title: 'Interactive Audio-Visual Learning', img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=2000', badge: 'Digital Age Curriculum' },
  ];

  const currentHeroVisual = heroShowcases.find(s => s.id === heroTab) || heroShowcases[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.current) return;
    setLoading(true);
    try {
      const formData = new FormData(form.current);
      const response = await fetch("https://formspree.io/f/xgonbben", {
        method: "POST",
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        alert("Thank you! Your message has been sent.");
        form.current.reset();
      } else {
        alert("Oops! There was a problem submitting your form");
      }
    } catch (error) {
      alert("Error sending message. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`scroll-smooth font-sans antialiased pt-20 sm:pt-24 w-full max-w-[100vw] overflow-x-hidden ${isDark ? "bg-[#0a192f] text-slate-200" : "bg-[var(--card-bg)] text-[var(--text-main)]"}`}>
      <LandingNavbar />

      {/* --- ULTRA PREMIUM HERO SECTION --- */}
      <section id="home" className={`relative min-h-[85vh] flex flex-col justify-center overflow-hidden transition-colors duration-500 w-full max-w-[100vw] ${isDark ? "bg-[#081526] text-white" : "bg-slate-50/90 text-slate-900"}`}>
        
        {/* Dynamic Glowing Mesh Grid & Ambient Light Orbs (Strictly Contained) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:36px_36px]" />
          <div className={`absolute top-0 right-0 w-2/3 h-full ${isDark ? "bg-gradient-to-l from-blue-600/25 via-indigo-600/15 to-transparent" : "bg-gradient-to-l from-blue-300/40 via-sky-200/25 to-transparent"}`} />
          <div className={`absolute -top-20 -left-20 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full blur-[100px] sm:blur-[140px] ${isDark ? "bg-blue-600/30" : "bg-blue-300/45"} animate-pulse`} />
          <div className={`absolute bottom-0 right-0 w-[280px] sm:w-[450px] h-[280px] sm:h-[450px] rounded-full blur-[100px] sm:blur-[130px] ${isDark ? "bg-indigo-600/25" : "bg-indigo-200/60"}`} />
        </div>

        <div className="container mx-auto px-3 sm:px-6 pt-4 sm:pt-8 pb-10 grid lg:grid-cols-12 gap-8 items-center z-10 my-auto w-full max-w-full overflow-hidden">

          {/* ── LEFT: Hero Headline & Interactive Vision (Col 7) ── */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8 }} 
            className="lg:col-span-7 flex flex-col gap-4 sm:gap-5 w-full max-w-full overflow-hidden"
          >

            {/* Top Badges Row */}
            <div className="flex flex-wrap items-center gap-2 w-full max-w-full">
              <div className={`inline-flex items-center gap-1.5 ${isDark ? "bg-blue-950/90 border-blue-500/60 text-blue-300 shadow-blue-950/50" : "bg-blue-50 border-blue-200 text-blue-800 shadow-blue-500/10"} border px-2.5 sm:px-3.5 py-1.5 rounded-full shadow-md backdrop-blur-xl shrink-0`}>
                <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping"></span>
                <span className="text-[10px] sm:text-xs font-black tracking-wide uppercase">Admissions Open 2026–27</span>
              </div>

              <div className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-black px-2.5 sm:px-3.5 py-1.5 rounded-full border shadow-sm shrink-0 ${isDark ? "border-emerald-500/50 text-emerald-300 bg-emerald-950/70" : "border-emerald-300 text-emerald-700 bg-emerald-50"}`}>
                <ShieldCheck size={13} className="text-emerald-500 shrink-0" /> Code: 231
              </div>
            </div>

            {/* Hero Headline & Location */}
            <div className="space-y-2.5 sm:space-y-3 w-full max-w-full overflow-hidden">
              <h1 className={`text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight sm:leading-none tracking-tight break-words max-w-full ${isDark ? "text-white" : "text-slate-900"}`}>
                Shaping Character, <br className="hidden sm:block" />
                Inspiring <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 italic">Excellence.</span>
              </h1>
              
              <div className="flex flex-wrap items-center gap-2 pt-1 w-full max-w-full">
                <div className={`inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold tracking-wide uppercase px-2.5 sm:px-3 py-1.5 rounded-xl border backdrop-blur-md max-w-full overflow-hidden ${isDark ? "bg-slate-800/90 text-slate-200 border-slate-700" : "bg-white/90 text-slate-800 border-slate-200 shadow-sm"}`}>
                  <MapPin size={13} className="text-blue-500 shrink-0 animate-bounce" />
                  <span className="truncate">Shree Dham Colony, Malikhedi, Bhopal</span>
                </div>
                <div className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-black px-2.5 py-1.5 rounded-xl border shrink-0 ${isDark ? "bg-blue-900/40 border-blue-700/60 text-blue-300" : "bg-blue-50 border-blue-200 text-blue-800"}`}>
                  <GraduationCap size={13} /> Nursery to 12th
                </div>
              </div>
            </div>

            {/* Action CTA Buttons (Full width on mobile, inline on desktop) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1 w-full max-w-full overflow-hidden">
              <a 
                href="#contact" 
                className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white px-3 sm:px-6 py-3 rounded-2xl font-black text-[11px] sm:text-xs uppercase tracking-normal sm:tracking-wider shadow-xl shadow-blue-600/30 hover:scale-[1.01] active:scale-95 transition-all duration-300 border border-blue-400/30 text-center w-full sm:w-auto shrink-0 overflow-hidden"
              >
                <span className="truncate">🚀 Apply for Admission 2026–27</span>
                <ArrowRight size={15} className="shrink-0" />
              </a>
              <a 
                href="#about" 
                className={`flex items-center justify-center gap-1.5 px-3 sm:px-5 py-3 rounded-2xl font-bold text-[11px] sm:text-xs uppercase tracking-normal sm:tracking-wider border backdrop-blur-md hover:scale-[1.01] active:scale-95 transition-all duration-300 text-center w-full sm:w-auto shrink-0 overflow-hidden ${
                  isDark 
                    ? "bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600" 
                    : "bg-white/90 border-slate-300 text-slate-800 hover:bg-slate-100 shadow-sm"
                }`}
              >
                <Sparkles size={15} className="text-amber-500 shrink-0" />
                <span>Explore Campus</span>
              </a>
            </div>

            {/* Guiding Vision Glassmorphic Card (4 Pillars) */}
            <div className={`relative overflow-hidden rounded-3xl border p-2.5 sm:p-5 shadow-xl backdrop-blur-2xl transition-all w-full max-w-full ${
              isDark 
                ? "bg-slate-900/85 border-blue-500/40 text-white shadow-blue-500/10" 
                : "bg-white/95 border-blue-200 text-slate-900 shadow-blue-500/15"
            }`}>
              {/* Top Accent Gradient Bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-400" />

              <div className="flex items-center justify-between gap-1.5 mb-2.5 w-full overflow-hidden">
                <span className={`text-[9px] sm:text-[11px] font-black uppercase tracking-wide sm:tracking-wider px-2 py-1 rounded-lg truncate ${
                  isDark ? "bg-blue-950 text-blue-300 border border-blue-800/60" : "bg-blue-100 text-blue-800 font-black"
                }`}>
                  ✨ OUR 4 PILLARS OF EXCELLENCE
                </span>
                <span className={`text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide shrink-0 ${isDark ? "text-blue-400" : "text-blue-700"}`}>
                  Holistic Growth
                </span>
              </div>

              {/* 4 Pillars Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 w-full max-w-full overflow-hidden">
                {[
                  { en: "LEARN", hi: "सीखें", desc: "Digital & STEM", icon: BookOpen, color: "text-blue-500", bg: isDark ? "bg-blue-950/60 border-blue-800/50" : "bg-blue-50 border-blue-200" },
                  { en: "GROW", hi: "बढ़ें", desc: "Holistic Mindset", icon: Sparkles, color: "text-indigo-500", bg: isDark ? "bg-indigo-950/60 border-indigo-800/50" : "bg-indigo-50 border-indigo-200" },
                  { en: "LEAD", hi: "नेतृत्व", desc: "Ethics & Rank", icon: Target, color: "text-amber-500", bg: isDark ? "bg-amber-950/60 border-amber-800/50" : "bg-amber-50 border-amber-200" },
                  { en: "SERVE", hi: "सेवा", desc: "Community", icon: ShieldCheck, color: "text-emerald-500", bg: isDark ? "bg-emerald-950/60 border-emerald-800/50" : "bg-emerald-50 border-emerald-200" },
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col items-center justify-center p-1.5 sm:p-2.5 rounded-2xl border text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md min-w-0 overflow-hidden ${item.bg}`}
                  >
                    <item.icon className={`w-3.5 h-3.5 mb-0.5 ${item.color}`} />
                    <span className={`text-[11px] sm:text-sm font-black tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                      {item.en}
                    </span>
                    <span className={`text-[9.5px] font-extrabold mt-0.5 ${isDark ? "text-blue-300" : "text-blue-700"}`}>
                      {item.hi}
                    </span>
                    <span className={`text-[8px] sm:text-[9px] font-medium mt-0.5 leading-tight truncate max-w-full ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {item.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>

          {/* ── RIGHT: Interactive Visual Showcase & Counter Stats (Col 5) ── */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.94 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.9, delay: 0.2 }} 
            className="lg:col-span-5 flex flex-col gap-3.5 relative w-full max-w-full overflow-hidden"
          >
            {/* Tab Selector Buttons */}
            <div className={`flex p-1 sm:p-1.5 rounded-2xl border backdrop-blur-xl gap-1 w-full max-w-full overflow-x-auto scrollbar-none ${isDark ? "bg-slate-900/90 border-slate-800" : "bg-white/90 border-slate-200 shadow-sm"}`}>
              {heroShowcases.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setHeroTab(s.id as any)}
                  className={`flex-1 py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xl font-black text-[10px] sm:text-xs transition-all whitespace-nowrap shrink-0 ${
                    heroTab === s.id
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 scale-[1.02]"
                      : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Main Visual Showcase Frame */}
            <div className={`relative z-10 w-full h-[260px] sm:h-[350px] lg:h-[380px] rounded-3xl shadow-2xl overflow-hidden border-2 sm:border-4 ${isDark ? "border-slate-800/90" : "border-white"}`}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={heroTab}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  src={currentHeroVisual.img}
                  alt={currentHeroVisual.title}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>

              {/* Gradient Dark Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? "from-[#081526]/95 via-[#081526]/30" : "from-slate-950/85 via-slate-900/20"} to-transparent`} />

              {/* Badge Header inside Image */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1.5 z-20 max-w-full overflow-hidden">
                <div className="bg-slate-950/80 backdrop-blur-md text-white border border-white/20 px-2.5 py-1 rounded-full text-[9px] sm:text-[11px] font-black flex items-center gap-1 shadow-lg shrink-0">
                  <Award size={12} className="text-amber-400 shrink-0" />
                  <span>25+ Yrs Legacy</span>
                </div>
                <div className="bg-emerald-600/90 backdrop-blur-md text-white px-2 py-1 rounded-full text-[8.5px] sm:text-[10px] font-black shadow-lg uppercase tracking-wider truncate max-w-[55%]">
                  {currentHeroVisual.badge}
                </div>
              </div>

              {/* Title & Stats Overlay at Bottom */}
              <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-col gap-2">
                <div className="text-white font-black text-sm sm:text-lg drop-shadow-md truncate">
                  {currentHeroVisual.title}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Classes Offered", val: "Nursery–12th" },
                    { label: "Affiliation Board", val: "M.P. Board" },
                  ].map((s, i) => (
                    <div key={i} className="bg-white/95 backdrop-blur-md rounded-xl p-1.5 shadow-xl text-center border border-white/40">
                      <div className="text-blue-700 font-black text-xs sm:text-sm">{s.val}</div>
                      <div className="text-slate-600 text-[9px] sm:text-[10px] font-extrabold leading-tight">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Counter Stats Card Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
              {[
                { val: "25+", label: "Years" },
                { val: "1500+", label: "Students" },
                { val: "100%", label: "Board Pass" },
                { val: "50+", label: "Faculty" },
              ].map((stat, i) => (
                <div key={i} className={`p-2 sm:p-2.5 rounded-2xl border text-center backdrop-blur-md ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white/90 border-slate-200 shadow-sm"}`}>
                  <div className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500 font-black text-xs sm:text-base">{stat.val}</div>
                  <div className={`text-[9px] sm:text-[10px] font-extrabold uppercase mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>{stat.label}</div>
                </div>
              ))}
            </div>

          </motion.div>

        </div>

        {/* Bottom Trust Highlights Cards */}
        <div className={`w-full border-y py-3.5 backdrop-blur-xl relative z-10 ${
          isDark ? "bg-slate-950/80 border-slate-800/80" : "bg-white/95 border-slate-200/90 shadow-sm"
        }`}>
          <div className="container mx-auto px-3 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
              {[
                { icon: Book, title: "Digital Smart Classrooms", color: "text-blue-500", bg: isDark ? "bg-blue-950/50 border-blue-800/50" : "bg-blue-50/90 border-blue-200" },
                { icon: Laptop, title: "Computer & STEM Labs", color: "text-indigo-500", bg: isDark ? "bg-indigo-950/50 border-indigo-800/50" : "bg-indigo-50/90 border-indigo-200" },
                { icon: Bus, title: "Safe GPS Transport", color: "text-emerald-500", bg: isDark ? "bg-emerald-950/50 border-emerald-800/50" : "bg-emerald-50/90 border-emerald-200" },
                { icon: Trophy, title: "Sports & Activity Arena", color: "text-amber-500", bg: isDark ? "bg-amber-950/50 border-amber-800/50" : "bg-amber-50/90 border-amber-200" },
              ].map((item, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center justify-center gap-2 px-2.5 py-2 sm:py-2.5 rounded-xl border transition-all duration-300 hover:scale-[1.02] shadow-sm ${item.bg}`}
                >
                  <item.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${item.color}`} />
                  <span className={`text-[9.5px] sm:text-xs font-black tracking-wide uppercase text-center ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- ABOUT SECTION --- */}
      <section id="about" className={`py-10 sm:py-12 relative overflow-hidden transition-colors duration-500 ${isDark ? "bg-slate-900 text-white" : "bg-slate-50/80 text-slate-900"}`}>
        
        {/* Subtle Ambient Background Glows */}
        <div className={`absolute top-1/2 -left-20 w-80 h-80 rounded-full blur-[120px] -z-0 ${isDark ? "bg-blue-600/15" : "bg-blue-200/40"}`} />
        <div className={`absolute bottom-0 right-0 w-80 h-80 rounded-full blur-[120px] -z-0 ${isDark ? "bg-indigo-600/15" : "bg-indigo-200/40"}`} />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
            
            {/* Left Side: Legacy Image Module (Sleek & Compact) */}
            <motion.div 
              initial={{ opacity: 0, x: -40 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.7 }}
              className="flex-1 w-full max-w-lg relative"
            >
              <div className={`relative z-10 rounded-[28px] overflow-hidden shadow-2xl border-4 sm:border-6 ${isDark ? "border-slate-800" : "border-white"} h-[300px] sm:h-[360px]`}>
                <img 
                  src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=1400" 
                  alt="Vasant Valley School Campus Library" 
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white text-xs font-bold drop-shadow">
                  📖 Modern Resource Center & Library
                </div>
              </div>

              {/* Floating Experience Badge */}
              <div className="absolute -bottom-4 -right-2 sm:-right-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 px-5 py-3 rounded-2xl shadow-2xl border border-yellow-300 z-20 flex items-center gap-3">
                <div className="text-3xl font-black italic leading-none">25+</div>
                <div className="text-[11px] font-black uppercase tracking-tight leading-tight">
                  Years of <br /> Academic Excellence
                </div>
              </div>
            </motion.div>
            
            {/* Right Side: Narrative & Legacy Details Module */}
            <motion.div 
              initial={{ opacity: 0, x: 40 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.7 }}
              className="flex-1 space-y-5"
            >
              <div>
                <span className={`inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-xl border mb-3 ${
                  isDark ? "bg-blue-950/80 text-blue-300 border-blue-800/60" : "bg-blue-50 text-blue-800 border-blue-200"
                }`}>
                  🏛️ ABOUT OUR LEGACY & VISION
                </span>
                <h2 className={`text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                  A Journey of <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 italic">Knowledge</span> & Character
                </h2>
              </div>

              <p className={`text-sm sm:text-base leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                Established in <strong>2001</strong> at Shree Dham Colony, Malikhedi, Bhopal, <strong>Vasant Valley School</strong> is dedicated to nurturing future leaders through holistic education, cutting-edge STEM labs, and traditional ethical values.
              </p>

              {/* Feature Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {[
                  { title: "M.P. Board Recognized", desc: "School Code: 231", icon: ShieldCheck, color: "text-emerald-500" },
                  { title: "Nursery to 12th", desc: "Complete K-12 Pathway", icon: GraduationCap, color: "text-blue-500" },
                  { title: "Safe & Tech-Enabled", desc: "GPS & Smart Classes", icon: Award, color: "text-amber-500" },
                ].map((f, idx) => (
                  <div key={idx} className={`p-3 rounded-2xl border backdrop-blur-md transition-all ${isDark ? "bg-slate-800/60 border-slate-700/80" : "bg-white border-slate-200 shadow-sm"}`}>
                    <f.icon className={`w-5 h-5 mb-1 ${f.color}`} />
                    <div className={`text-xs font-black ${isDark ? "text-white" : "text-slate-900"}`}>{f.title}</div>
                    <div className={`text-[10px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>{f.desc}</div>
                  </div>
                ))}
              </div>

              {/* Quick Key Achievements */}
              <div className={`p-4 rounded-2xl border flex items-center justify-around text-center backdrop-blur-md ${isDark ? "bg-blue-950/30 border-blue-900/50" : "bg-blue-50/70 border-blue-100"}`}>
                <div>
                  <div className="text-blue-600 font-black text-lg sm:text-xl">2001</div>
                  <div className={`text-[10px] font-extrabold uppercase ${isDark ? "text-slate-400" : "text-slate-600"}`}>Founded Year</div>
                </div>
                <div className="h-8 w-px bg-slate-300/40" />
                <div>
                  <div className="text-indigo-600 font-black text-lg sm:text-xl">100%</div>
                  <div className={`text-[10px] font-extrabold uppercase ${isDark ? "text-slate-400" : "text-slate-600"}`}>Pass Record</div>
                </div>
                <div className="h-8 w-px bg-slate-300/40" />
                <div>
                  <div className="text-emerald-600 font-black text-lg sm:text-xl">1500+</div>
                  <div className={`text-[10px] font-extrabold uppercase ${isDark ? "text-slate-400" : "text-slate-600"}`}>Happy Students</div>
                </div>
              </div>

            </motion.div>
          </div>
        </div>
      </section>

      {/* --- FACILITIES SECTION --- */}
      <section id="facilities" className={`py-12 sm:py-14 relative overflow-hidden transition-colors duration-500 ${isDark ? "bg-[#081526] text-white" : "bg-slate-50/90 text-slate-900"}`}>
        
        {/* Dynamic Glowing Mesh Grid & Ambient Light Orbs */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:36px_36px] -z-0" />
        <div className={`absolute top-0 right-1/4 w-96 h-96 rounded-full blur-[140px] -z-0 ${isDark ? "bg-blue-600/20" : "bg-blue-300/40"}`} />
        <div className={`absolute bottom-0 left-1/4 w-96 h-96 rounded-full blur-[140px] -z-0 ${isDark ? "bg-indigo-600/15" : "bg-indigo-200/40"}`} />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          
          {/* Section Header Card */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border backdrop-blur-md shadow-md mb-3 ${
              isDark ? "bg-blue-950/90 text-blue-300 border-blue-500/50" : "bg-blue-50 text-blue-800 border-blue-200"
            }`}>
              <Sparkles size={15} className="text-amber-400" /> Excellence in Every Detail
            </span>

            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              World-Class <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 italic">Campus Facilities</span>
            </h2>

            <p className={`mt-3 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              State-of-the-art infrastructure designed to provide a safe, tech-enabled, and inspiring learning environment for every student.
            </p>
          </div>

          {/* 6 Premium Facilities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { 
                icon: Monitor, 
                title: "Digital Smart Classes", 
                desc: "Interactive smart boards, 3D visual modules & audio-visual digital learning tools.", 
                badge: "Smart Board Equipped",
                color: "text-blue-500",
                bg: isDark ? "bg-blue-950/50 border-blue-800/50" : "bg-blue-50/90 border-blue-200",
                gradient: "from-blue-600 to-cyan-500" 
              },
              { 
                icon: FlaskConical, 
                title: "Advanced STEM Labs", 
                desc: "Fully equipped Science & Physics/Chemistry/Biology labs for practical learning.", 
                badge: "Practical STEM Labs",
                color: "text-indigo-500",
                bg: isDark ? "bg-indigo-950/50 border-indigo-800/50" : "bg-indigo-50/90 border-indigo-200",
                gradient: "from-indigo-600 to-purple-500" 
              },
              { 
                icon: Bus, 
                title: "GPS Smart Transport", 
                desc: "Safe & comfortable school buses with live GPS tracking for real-time parent updates.", 
                badge: "Live GPS Tracking",
                color: "text-purple-500",
                bg: isDark ? "bg-purple-950/50 border-purple-800/50" : "bg-purple-50/90 border-purple-200",
                gradient: "from-purple-600 to-pink-500" 
              },
              { 
                icon: Book, 
                title: "Modern Resource Library", 
                desc: "20,000+ academic books, reference journals & high-speed digital research lab.", 
                badge: "20,000+ Books",
                color: "text-emerald-500",
                bg: isDark ? "bg-emerald-950/50 border-emerald-800/50" : "bg-emerald-50/90 border-emerald-200",
                gradient: "from-emerald-600 to-teal-500" 
              },
              { 
                icon: Trophy, 
                title: "Sports & Activity Arena", 
                desc: "Spacious outdoor playground & indoor arena for cricket, football & gymnastics.", 
                badge: "Multi-Sport Ground",
                color: "text-amber-500",
                bg: isDark ? "bg-amber-950/50 border-amber-800/50" : "bg-amber-50/90 border-amber-200",
                gradient: "from-amber-500 to-orange-500" 
              },
              { 
                icon: ShieldCheck, 
                title: "24x7 AI Campus Security", 
                desc: "100% CCTV surveillance coverage, gated access control & dedicated security team.", 
                badge: "Full CCTV Coverage",
                color: "text-rose-500",
                bg: isDark ? "bg-rose-950/50 border-rose-800/50" : "bg-rose-50/90 border-rose-200",
                gradient: "from-rose-600 to-pink-500" 
              },
            ].map((item, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -6, scale: 1.01 }} 
                transition={{ duration: 0.3 }}
                className={`p-6 rounded-[28px] border backdrop-blur-2xl shadow-md transition-all duration-300 group flex flex-col justify-between ${
                  isDark ? "bg-slate-900/85 border-slate-800 hover:border-blue-500/50 hover:bg-slate-900" : "bg-white/95 border-slate-200 hover:border-blue-300 hover:shadow-2xl"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-13 h-13 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${item.gradient} shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300`}>
                      <item.icon size={24} />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${item.bg} ${item.color}`}>
                      {item.badge}
                    </span>
                  </div>

                  <h3 className={`text-lg font-extrabold mb-2 tracking-tight group-hover:text-blue-600 transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>
                    {item.title}
                  </h3>
                  <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    {item.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/20 flex items-center gap-1.5 text-xs font-black text-blue-600 group-hover:translate-x-1 transition-transform">
                  <span>Explore Facility</span>
                  <ArrowRight size={14} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- ACADEMIC EXCELLENCE & PROGRAMS SECTION --- */}
      <section id="programs" className={`py-10 sm:py-12 relative overflow-hidden transition-colors duration-500 ${isDark ? "bg-[#091729] text-white" : "bg-slate-50/80 text-slate-900"}`}>
        
        {/* Background Mesh Glows */}
        <div className={`absolute -top-32 right-0 w-96 h-96 rounded-full blur-[140px] -z-0 ${isDark ? "bg-blue-600/15" : "bg-blue-200/30"}`} />
        <div className={`absolute bottom-0 left-0 w-96 h-96 rounded-full blur-[140px] -z-0 ${isDark ? "bg-indigo-600/15" : "bg-indigo-200/30"}`} />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-4 border shadow-md backdrop-blur-md ${isDark ? "bg-blue-950/80 text-blue-300 border-blue-500/40" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
              <GraduationCap size={16} className="text-blue-500" /> Academic Excellence & Curriculum
            </span>
            
            <h2 className={`text-4xl sm:text-5xl font-black tracking-tight leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              Empowering Minds Across <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 italic">
                4 Educational Wings.
              </span>
            </h2>

            <p className={`mt-4 text-base sm:text-lg leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              M.P. Board accredited curriculum from Nursery to 12th Class, seamlessly integrating modern STEM labs, digital smart classrooms, and personalized student progress analytics.
            </p>

            {/* Interactive Wing Filter Tabs (Single Row Compact) */}
            <div className={`mt-6 inline-flex p-1 sm:p-1.5 rounded-2xl border backdrop-blur-xl gap-1 max-w-full overflow-x-auto ${isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
              {[
                { id: 'all', label: 'All Wings' },
                { id: 'pre', label: '🧸 Pre-Primary' },
                { id: 'primary', label: '📚 Primary (1st–5th)' },
                { id: 'secondary', label: '🔬 Secondary (6th–10th)' },
                { id: 'senior', label: '🎓 Senior (11th–12th)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAcademicWing(tab.id as any)}
                  className={`py-2 px-3 sm:px-3.5 rounded-xl font-bold text-xs transition-all duration-300 whitespace-nowrap ${
                    academicWing === tab.id
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-102"
                      : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-blue-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Academic Wings Grid (Compact Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                id: 'pre',
                title: "Pre-Primary Wing",
                classes: "Nursery, LKG & UKG",
                badge: "Play-Way Stage",
                desc: "Activity-based learning focusing on phonics, motor skills & habit formation.",
                highlights: ["Phonics & Vocabulary", "Play-Way Activity Lab", "Social Habit Formation", "Color & Shape Skills"],
                icon: BookOpen,
                accent: "from-sky-500 via-blue-600 to-indigo-700",
                shadow: "shadow-sky-500/20",
                metric: "100% Phonics"
              },
              {
                id: 'primary',
                title: "Primary Wing",
                classes: "Classes 1st – 5th",
                badge: "Knowledge Base",
                desc: "Strong foundation in Math logic, Language fluency & Science curiosity.",
                highlights: ["English & Hindi Literacy", "Mental Math & Logic", "EVS & Science Basics", "Smartboard Learning"],
                icon: FlaskConical,
                accent: "from-indigo-600 via-purple-600 to-pink-700",
                shadow: "shadow-indigo-500/20",
                metric: "Math & Logic"
              },
              {
                id: 'secondary',
                title: "Secondary Wing",
                classes: "Classes 6th – 10th",
                badge: "Board Prep Stage",
                desc: "M.P. Board curriculum, practical STEM lab experiments & Board exam coaching.",
                highlights: ["Physics, Chemistry & Bio", "Advanced Mathematics", "Computer & Coding Lab", "M.P. Board Prep"],
                icon: Award,
                accent: "from-emerald-600 via-teal-600 to-cyan-700",
                shadow: "shadow-emerald-500/20",
                metric: "100% Board Pass"
              },
              {
                id: 'senior',
                title: "Senior Secondary",
                classes: "Classes 11th – 12th",
                badge: "Merit & Streams",
                desc: "Science (PCM/PCB), Commerce & Arts streams with M.P. Board Merit mentoring.",
                highlights: ["Science (PCM / PCB)", "Commerce & Accounts", "Arts & Humanities", "Competitive Guidance"],
                icon: Laptop,
                accent: "from-amber-500 via-orange-600 to-rose-700",
                shadow: "shadow-amber-500/20",
                metric: "Merit Rank"
              },
            ]
            .filter(wing => academicWing === 'all' || academicWing === wing.id)
            .map((wing, i) => (
              <motion.div 
                key={wing.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileHover={{ y: -6 }} 
                className="group flex flex-col justify-between"
              >
                <div className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br ${wing.accent} text-white shadow-xl ${wing.shadow} transition-all duration-300 flex flex-col justify-between h-full border border-white/20`}>
                  
                  {/* Top Glass Badge & Icon */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-md group-hover:rotate-6 transition-transform">
                        <wing.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-white/95 border border-white/20">
                        {wing.metric}
                      </span>
                    </div>

                    <span className="text-[10px] font-black uppercase tracking-widest text-white/80 block mb-1">
                      {wing.classes}
                    </span>

                    <h3 className="text-lg sm:text-xl font-black mb-1.5 tracking-tight">
                      {wing.title}
                    </h3>

                    <p className="text-xs text-white/90 font-medium leading-relaxed mb-4">
                      {wing.desc}
                    </p>

                    {/* Bullet Highlights */}
                    <div className="space-y-1.5 mb-5 pt-3 border-t border-white/20">
                      {wing.highlights.map((hl, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[11px] font-extrabold text-white/95">
                          <CheckCircle2 size={13} className="text-white shrink-0" />
                          <span>{hl}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Action */}
                  <button 
                    onClick={() => navigate('/login')}
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider bg-white text-slate-900 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors shadow-lg group-hover:scale-[1.02] active:scale-95"
                  >
                    <span>Curriculum</span> <ArrowUpRight size={15} />
                  </button>

                </div>
              </motion.div>
            ))}
          </div>

          {/* Interactive Senior Secondary Stream Breakdown Drawer */}
          <div className={`mt-16 p-8 rounded-[36px] border backdrop-blur-2xl transition-all shadow-2xl ${
            isDark 
              ? "bg-slate-900/90 border-blue-500/30 text-white" 
              : "bg-white/90 border-blue-200 text-slate-900 shadow-blue-500/10"
          }`}>
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="flex-1">
                <span className="text-xs font-black uppercase tracking-widest text-blue-500 bg-blue-50 dark:bg-blue-950/80 px-3.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                  🎯 Class 11th & 12th Stream Specializations
                </span>
                <h3 className={`text-2xl sm:text-3xl font-black mt-3 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Choose Your Pathway to College & Career Success
                </h3>
                <p className={`text-sm mt-2 max-w-2xl ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  Rigorous M.P. Board syllabus with dedicated doubt-solving labs, practical laboratory exposure, and expert guidance for national entrance exams.
                </p>
              </div>

              {/* Stream Pills */}
              <div className="flex flex-wrap gap-4 lg:justify-end">
                {[
                  { stream: "Science (PCM / PCB)", desc: "Physics, Chem, Math / Biology", icon: "🔬", color: "border-blue-500/40 bg-blue-500/10 text-blue-500" },
                  { stream: "Commerce Stream", desc: "Accounts, Economics, B.St", icon: "💼", color: "border-indigo-500/40 bg-indigo-500/10 text-indigo-500" },
                  { stream: "Arts & Humanities", desc: "History, Pol Science, Geography", icon: "🎨", color: "border-purple-500/40 bg-purple-500/10 text-purple-500" },
                ].map((st, i) => (
                  <div key={i} className={`p-4 rounded-2xl border ${st.color} backdrop-blur-md flex items-center gap-3 shadow-md min-w-[220px]`}>
                    <span className="text-2xl">{st.icon}</span>
                    <div>
                      <div className="font-black text-xs sm:text-sm">{st.stream}</div>
                      <div className="text-[10px] font-semibold text-slate-400 mt-0.5">{st.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* --- CO-CURRICULAR ACTIVITIES SECTION --- */}
      <section id="activities" className={`py-10 sm:py-12 relative overflow-hidden ${isDark ? "bg-[#091729]" : "bg-slate-50/90"}`}>
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
            <span className="text-blue-600 font-bold tracking-[0.2em] uppercase text-xs sm:text-sm flex items-center justify-center gap-2">
              <Sparkles size={16} /> Holistic Development
            </span>
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-black mt-2 tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              Co-Curricular <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 italic">Activities</span>
            </h2>
            <p className={`mt-2.5 text-xs sm:text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Empowering students to discover their passions, hone talents, and develop leadership through a rich spectrum of co-curricular pursuits.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                title: "Sports & Athletics",
                icon: <Trophy size={28} />,
                badge: "Physical Fitness & Teams",
                desc: "Cricket, Football, Basketball, Athletics, Martial Arts & Indoor Games to build sportsmanship and endurance.",
                gradient: "from-amber-500 to-orange-600",
                accentColor: "text-amber-500"
              },
              {
                title: "Art & Craft Studio",
                icon: <Palette size={28} />,
                badge: "Creative Expression",
                desc: "Sketching, Painting, Clay Modeling, Origami, Sculpture, and Design workshops to inspire creative flair.",
                gradient: "from-purple-500 to-pink-600",
                accentColor: "text-purple-500"
              },
              {
                title: "Cultural Activities",
                icon: <Music size={28} />,
                badge: "Performing Arts",
                desc: "Classical & Modern Dance, Vocal & Instrumental Music, Drama, Theater & Annual Cultural Celebrations.",
                gradient: "from-blue-500 to-indigo-600",
                accentColor: "text-blue-500"
              },
              {
                title: "Literary & Debating",
                icon: <Feather size={28} />,
                badge: "Intellectual Excellence",
                desc: "Debates, Elocution, Creative Writing, Quiz Competitions, Spelling Bee & Public Speaking clubs.",
                gradient: "from-emerald-500 to-teal-600",
                accentColor: "text-emerald-500"
              }
            ].map((activity, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3 }}
                className={`p-6 rounded-3xl border shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${
                  isDark ? "bg-slate-900/90 border-slate-800 hover:border-blue-500/30" : "bg-white border-slate-200 hover:border-blue-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${activity.gradient} text-white flex items-center justify-center shadow-md`}>
                      {activity.icon}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                      {activity.badge}
                    </span>
                  </div>

                  <h3 className={`text-lg font-black mb-2 tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                    {activity.title}
                  </h3>
                  <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    {activity.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200/40 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Explore Club</span>
                  <div className={`w-7 h-7 rounded-full bg-gradient-to-r ${activity.gradient} text-white flex items-center justify-center shadow-md`}>
                    <ArrowUpRight size={14} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- STUDENTS' TOPPER LIST SECTION --- */}
      <section id="toppers" className={`py-24 relative overflow-hidden ${isDark ? "bg-slate-900 border-t border-slate-800" : "bg-[var(--card-bg)] text-[var(--text-main)] border-t border-[var(--border-color)]"}`}>
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-amber-500 font-bold tracking-[0.2em] uppercase text-sm flex items-center justify-center gap-2">
              <Award size={18} /> Wall of Fame & Academic Achievers
            </span>
            <h2 className={`text-4xl md:text-5xl font-black mt-3 italic ${isDark ? "text-white" : "text-slate-900"}`}>
              Students' <span className="text-amber-500">Topper List</span>
            </h2>
            <p className={`mt-3 text-base md:text-lg ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Celebrating academic brilliance and outstanding Board Examination results of our top 5 performers in Class 10th and Class 12th.
            </p>

            {/* Toggle Class 10th / Class 12th */}
            <div className="mt-6 sm:mt-8 inline-flex p-1 sm:p-1.5 rounded-2xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-inner max-w-full overflow-x-auto">
              <button
                onClick={() => setTopperTab('10th')}
                className={`px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap ${
                  topperTab === '10th'
                    ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 scale-102"
                    : "text-slate-600 dark:text-slate-300 hover:text-amber-500"
                }`}
              >
                🎓 Class 10th Top 5
              </button>
              <button
                onClick={() => setTopperTab('12th')}
                className={`px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap ${
                  topperTab === '12th'
                    ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 scale-102"
                    : "text-slate-600 dark:text-slate-300 hover:text-amber-500"
                }`}
              >
                🌟 Class 12th Top 5
              </button>
            </div>
          </div>

          {/* Topper Cards Grid (Responsive Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
            {(topperTab === '10th' ? [
              { rank: 1, name: "Ananya Sharma", percentage: "98.4%", badge: "🥇 Gold Medalist", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400", remarks: "100/100 Math & Science" },
              { rank: 2, name: "Rohan Patel", percentage: "97.6%", badge: "🥈 Silver Medalist", photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400", remarks: "100/100 Social Science" },
              { rank: 3, name: "Priya Verma", percentage: "96.8%", badge: "🥉 Bronze Medalist", photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400", remarks: "99/100 English & Hindi" },
              { rank: 4, name: "Aditya Singh", percentage: "96.2%", badge: "⭐ Merit Achiever", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400", remarks: "98/100 Mathematics" },
              { rank: 5, name: "Sneha Gupta", percentage: "95.5%", badge: "⭐ Merit Achiever", photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400", remarks: "97/100 Science" }
            ] : [
              { rank: 1, name: "Ishaan Saxena", percentage: "98.8%", stream: "Science (PCM)", badge: "🥇 State Rank 1", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400", remarks: "100/100 Physics & Chem" },
              { rank: 2, name: "Kavya Nair", percentage: "97.8%", stream: "Commerce", badge: "🥈 Stream Topper", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400", remarks: "100/100 Accounts & Eco" },
              { rank: 3, name: "Ayush Joshi", percentage: "97.2%", stream: "Science (PCB)", badge: "🥉 Bronze Medalist", photo: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=400", remarks: "99/100 Bio & Chem" },
              { rank: 4, name: "Meera Deshmukh", percentage: "96.6%", stream: "Humanities", badge: "⭐ Stream Topper", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400", remarks: "98/100 History & Pol Sci" },
              { rank: 5, name: "Yash Vardhan", percentage: "96.0%", stream: "Science (PCM)", badge: "⭐ Merit Achiever", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400", remarks: "97/100 Math & Computer" }
            ]).map((topper, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className={`relative rounded-3xl overflow-hidden border p-6 flex flex-col items-center text-center shadow-lg transition-all duration-300 ${
                  topper.rank === 1
                    ? "bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-900 border-amber-500/50 shadow-amber-500/20"
                    : isDark ? "bg-slate-800/80 border-slate-700" : "bg-white border-slate-200"
                }`}
              >
                {/* Rank Badge */}
                <div className={`absolute top-4 left-4 w-9 h-9 rounded-full font-black text-sm flex items-center justify-center shadow-md ${
                  topper.rank === 1 ? "bg-amber-500 text-slate-950" : topper.rank === 2 ? "bg-slate-300 text-slate-950" : topper.rank === 3 ? "bg-amber-700 text-white" : "bg-slate-700 text-white"
                }`}>
                  #{topper.rank}
                </div>

                {/* Photo with Ring */}
                <div className={`w-20 h-20 rounded-full overflow-hidden border-4 mb-3 shadow-xl ${
                  topper.rank === 1 ? "border-amber-400 ring-4 ring-amber-500/30" : "border-blue-500/40"
                }`}>
                  <img src={topper.photo} alt={topper.name} className="w-full h-full object-cover" />
                </div>

                {/* Name & Stream */}
                <h3 className={`text-base font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                  {topper.name}
                </h3>
                {topper.stream && (
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mt-0.5">
                    {topper.stream}
                  </span>
                )}

                {/* Percentage Tag */}
                <div className="mt-2.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-base shadow-md">
                  {topper.percentage}
                </div>

                {/* Honor Badge */}
                <span className="mt-2 text-[10px] font-extrabold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  {topper.badge}
                </span>

                <p className={`mt-2 text-[11px] italic ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {topper.remarks}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FACULTY SECTION --- */}
      <section id="faculties" className={`py-10 sm:py-12 relative overflow-hidden transition-colors duration-500 ${isDark ? "bg-[#081526] text-white" : "bg-slate-50/90 text-slate-900"}`}>
        
        {/* Ambient Glow */}
        <div className={`absolute top-0 left-1/3 w-80 h-80 rounded-full blur-[130px] -z-0 ${isDark ? "bg-blue-600/15" : "bg-blue-200/40"}`} />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-widest border backdrop-blur-md shadow-sm mb-3 ${
              isDark ? "bg-blue-950/80 text-blue-300 border-blue-800/60" : "bg-blue-50 text-blue-800 border-blue-200"
            }`}>
              <Sparkles size={14} className="text-amber-400" /> Dedicated Educators & Mentors
            </span>
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              Meet Our <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 italic">Expert Faculties</span>
            </h2>
            <p className={`mt-2.5 text-xs sm:text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Experienced educators and subject experts dedicated to guiding, mentoring, and inspiring student achievement.
            </p>
          </div>

          {/* Faculty Profile Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { 
                name: "Dr. Sarah Johnson", 
                role: "Principal & Academic Director", 
                qual: "Ph.D. Education • 20+ Yrs Exp", 
                badge: "Academic Head",
                img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800" 
              },
              { 
                name: "Mr. Rajesh Kumar", 
                role: "HOD Mathematics", 
                qual: "M.Sc. Math • 15+ Yrs Exp", 
                badge: "Senior Mentor",
                img: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=800" 
              },
              { 
                name: "Ms. Priya Sharma", 
                role: "Senior English Instructor", 
                qual: "M.A. English • 12+ Yrs Exp", 
                badge: "Literary Club Lead",
                img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800" 
              },
              { 
                name: "Mr. David Smith", 
                role: "Physics & STEM Specialist", 
                qual: "M.Tech. Physics • 14+ Yrs Exp", 
                badge: "STEM Lab Specialist",
                img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=800" 
              },
            ].map((fac, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -6 }} 
                transition={{ duration: 0.3 }}
                className={`rounded-3xl overflow-hidden border backdrop-blur-xl shadow-md transition-all duration-300 group flex flex-col justify-between ${
                  isDark ? "bg-slate-900/85 border-slate-800 hover:border-blue-500/40" : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-xl"
                }`}
              >
                <div>
                  <div className="h-56 sm:h-60 w-full overflow-hidden relative">
                    <img 
                      src={fac.img} 
                      alt={fac.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    
                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-white border border-white/20 px-2.5 py-1 rounded-full text-[10px] font-black shadow-md">
                      {fac.badge}
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 text-center">
                    <h3 className={`text-lg font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                      {fac.name}
                    </h3>
                    <p className="text-blue-500 font-bold text-xs mt-0.5">{fac.role}</p>
                    <p className={`text-[11px] font-medium mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {fac.qual}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-0 flex justify-center gap-3">
                  <a 
                    href="#contact" 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm ${
                      isDark ? "bg-slate-800" : "bg-blue-50"
                    }`}
                    title="Connect with Educator"
                  >
                    <Linkedin size={15} />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* --- TESTIMONIALS SECTION --- */}
      <section id="testimonials" className={`py-12 sm:py-14 relative overflow-hidden transition-colors duration-500 ${isDark ? "bg-[#081526] text-white" : "bg-slate-50/90 text-slate-900"}`}>
        
        {/* Subtle Background Mesh Glow */}
        <div className={`absolute top-0 right-1/3 w-80 h-80 rounded-full blur-[130px] -z-0 ${isDark ? "bg-indigo-600/15" : "bg-indigo-200/40"}`} />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-widest border backdrop-blur-md shadow-sm mb-3 ${
              isDark ? "bg-blue-950/80 text-blue-300 border-blue-800/60" : "bg-blue-50 text-blue-800 border-blue-200"
            }`}>
              <Sparkles size={14} className="text-amber-400" /> Real Experiences & Feedback
            </span>

            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              What <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 italic">Parents & Students</span> Say
            </h2>

            <p className={`mt-2.5 text-xs sm:text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Hear from our school community about academic growth, character development, and our caring learning environment.
            </p>
          </div>

          {/* 3 Premium Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { 
                name: "Mrs. Sunita Sharma", 
                role: "Parent of Grade 8th Student", 
                quote: "Vasant Valley School has played a crucial role in my daughter's overall development. The teachers are incredibly supportive, and smart classes make learning enjoyable and effective.",
                rating: 5,
                badge: "Verified Parent Review",
                initial: "S",
                color: "bg-blue-600"
              },
              { 
                name: "Aarav Patel", 
                role: "Class 12th Board Achiever", 
                quote: "The teachers here don't just teach for exams, they mentor us for life. Modern science labs, regular tests, and career guidance helped me secure top marks in M.P. Board!",
                rating: 5,
                badge: "Class 12th Merit Student",
                initial: "A",
                color: "bg-indigo-600"
              },
              { 
                name: "Mr. Vikramaditya Singh", 
                role: "Parent of Grade 5th Student", 
                quote: "The GPS transport tracking gives complete peace of mind every day. Excellent discipline, sports facilities, and friendly school environment. Highly recommended!",
                rating: 5,
                badge: "Verified Parent Review",
                initial: "V",
                color: "bg-emerald-600"
              }
            ].map((test, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -6 }} 
                transition={{ duration: 0.3 }}
                className={`p-6 rounded-3xl border backdrop-blur-2xl shadow-md transition-all duration-300 flex flex-col justify-between ${
                  isDark ? "bg-slate-900/85 border-slate-800 hover:border-blue-500/40" : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-xl"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Quote className="text-blue-500 rotate-180 opacity-80" size={24} />
                    <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                      {test.badge}
                    </span>
                  </div>

                  {/* 5-Star Rating */}
                  <div className="flex items-center gap-1 mb-3 text-amber-400">
                    {[...Array(test.rating)].map((_, rIdx) => (
                      <span key={rIdx} className="text-sm">★</span>
                    ))}
                    <span className="text-xs font-bold text-slate-400 ml-1.5">5.0 / 5.0</span>
                  </div>

                  <p className={`text-xs leading-relaxed italic ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    "{test.quote}"
                  </p>
                </div>

                <div className="flex items-center gap-3.5 pt-4 mt-5 border-t border-slate-200/30 dark:border-slate-800">
                  <div className={`w-10 h-10 rounded-full ${test.color} text-white font-black text-sm flex items-center justify-center shadow-md shrink-0`}>
                    {test.initial}
                  </div>
                  <div>
                    <h4 className={`text-sm font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                      {test.name}
                    </h4>
                    <p className={`text-[11px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {test.role}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CONTACT SECTION --- */}
      <section id="contact" className={`py-12 sm:py-16 relative overflow-hidden transition-colors duration-500 ${isDark ? "bg-[#081526] text-white" : "bg-slate-50/90 text-slate-900"}`}>
        
        {/* Dynamic Mesh & Ambient Glow */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:36px_36px] -z-0" />
        <div className={`absolute top-1/4 left-10 w-96 h-96 rounded-full blur-[140px] -z-0 ${isDark ? "bg-blue-600/20" : "bg-blue-300/40"}`} />
        <div className={`absolute bottom-10 right-10 w-96 h-96 rounded-full blur-[140px] -z-0 ${isDark ? "bg-indigo-600/15" : "bg-indigo-200/40"}`} />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Side: Contact Information Module (5 cols) */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.5 }}
              className="lg:col-span-5 space-y-6"
            >
              <div>
                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border backdrop-blur-md shadow-sm mb-3 ${
                  isDark ? "bg-blue-950/80 text-blue-300 border-blue-800/60" : "bg-blue-50 text-blue-800 border-blue-200"
                }`}>
                  <Sparkles size={14} className="text-amber-400" /> Get in Touch & Visit Us
                </span>

                <h2 className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                  Let’s Start <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 italic">
                    A Conversation.
                  </span>
                </h2>

                <p className={`mt-3 text-xs sm:text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  Have questions regarding Admissions 2026–27, campus visits, academics, or transport? Our administration team is here to guide you.
                </p>
              </div>

              {/* Contact Information Cards */}
              <div className="space-y-3.5 pt-2">
                {[
                  { 
                    icon: <Phone size={20} />, 
                    title: "Helpline Phone Numbers", 
                    detail: "0755-4378074  /  +91 9981105858", 
                    sub: "Office Hours Support",
                    gradient: "from-blue-600 to-cyan-500" 
                  },
                  { 
                    icon: <Mail size={20} />, 
                    title: "Email Address", 
                    detail: "Vasantvalleyschool20@gmail.com", 
                    sub: "Direct Admissions Enquiry",
                    gradient: "from-indigo-600 to-purple-500" 
                  },
                  { 
                    icon: <MapPin size={20} />, 
                    title: "Campus Location", 
                    detail: "Shree Dham Colony, Malikhedi, Bhopal (M.P.)", 
                    sub: "Affiliated M.P. Board Code: 231",
                    gradient: "from-emerald-600 to-teal-500" 
                  }
                ].map((item, i) => (
                  <div 
                    key={i} 
                    className={`p-4 rounded-2xl border backdrop-blur-xl transition-all duration-300 flex items-start gap-4 group ${
                      isDark ? "bg-slate-900/80 border-slate-800 hover:border-blue-500/40" : "bg-white/90 border-slate-200 hover:border-blue-300 hover:shadow-lg"
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.gradient} text-white flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-blue-500 mb-0.5">{item.title}</p>
                      <p className={`text-sm font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>{item.detail}</p>
                      <p className={`text-[11px] font-medium mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right Side: Modern Glass Inquiry Form (7 cols) */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.5 }}
              className={`lg:col-span-7 p-6 sm:p-8 md:p-10 rounded-3xl border backdrop-blur-2xl shadow-xl ${
                isDark ? "bg-slate-900/90 border-slate-800 shadow-slate-950/50" : "bg-white border-slate-200 shadow-xl"
              }`}
            >
              <div className="mb-6">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800 inline-block mb-2">
                  Online Admission & General Enquiry
                </span>
                <h3 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                  Send Us a Direct Message
                </h3>
                <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Fill in the form below. Our admissions counselor will respond within 24 hours.
                </p>
              </div>

              <form ref={form} onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      Full Name *
                    </label>
                    <input 
                      type="text" 
                      name="full_name" 
                      placeholder="e.g. Rahul Sharma" 
                      className={`w-full px-4 py-3 text-xs rounded-xl border outline-none transition-all duration-300 focus:ring-2 focus:ring-blue-500 font-medium ${
                        isDark ? "bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                      }`} 
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      Email Address *
                    </label>
                    <input 
                      type="email" 
                      name="email" 
                      placeholder="e.g. rahul@gmail.com" 
                      className={`w-full px-4 py-3 text-xs rounded-xl border outline-none transition-all duration-300 focus:ring-2 focus:ring-blue-500 font-medium ${
                        isDark ? "bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                      }`} 
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    Inquiry Subject / Topic
                  </label>
                  <select 
                    name="subject"
                    className={`w-full px-4 py-3 text-xs rounded-xl border outline-none transition-all duration-300 focus:ring-2 focus:ring-blue-500 font-medium ${
                      isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  >
                    <option value="Admission Enquiry 2026-27">🚀 New Admission Enquiry (Session 2026–27)</option>
                    <option value="General Information">📚 General Academic Information</option>
                    <option value="Fees & Transport Query">🚌 Fees Structure & Transport Query</option>
                    <option value="Other Query">💬 Other Query / Feedback</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    Your Message / Details *
                  </label>
                  <textarea 
                    name="message" 
                    placeholder="Write your query or details here..." 
                    className={`w-full px-4 py-3 text-xs rounded-xl border outline-none transition-all duration-300 focus:ring-2 focus:ring-blue-500 font-medium h-28 resize-none ${
                      isDark ? "bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                    }`} 
                    required
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 hover:scale-[1.01] active:scale-95 transition-all duration-300"
                >
                  {loading ? "Submitting Inquiry..." : "Submit Inquiry Now"} <Send size={15} />
                </button>
              </form>
            </motion.div>

          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className={`pt-14 pb-8 transition-colors duration-500 border-t ${isDark ? "bg-[#050c16] border-slate-800/80 text-slate-400" : "bg-slate-950 border-slate-800 text-slate-400"}`}>
        <div className="container mx-auto px-4 sm:px-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-slate-800/80">
            
            {/* Brand Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 text-white font-black text-xl italic tracking-tight">
                <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/30">
                  <GraduationCap size={24} className="text-white" />
                </div>
                <span>Vasant Valley School</span>
              </div>

              <p className="text-xs leading-relaxed text-slate-400">
                Empowering tomorrow's leaders with holistic education, STEM excellence, and ethical values since <strong>2001</strong>.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-black uppercase tracking-wider bg-blue-950/90 text-blue-400 px-3 py-1 rounded-full border border-blue-800/60">
                  M.P. Board Code: 231
                </span>
              </div>

              <div className="flex gap-2.5 pt-2">
                {socialLinks.map(({ Icon, href }, i) => (
                  <a 
                    key={i} 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-9 h-9 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-300 hover:bg-blue-600 hover:border-blue-500 hover:text-white transition-all shadow-sm"
                  >
                    <Icon size={18}/>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Navigation Links */}
            <div>
              <h4 className="text-white font-black mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Quick Navigation
              </h4>
              <ul className="space-y-2.5 text-xs font-semibold">
                {[
                  { name: "Home", href: "#home" },
                  { name: "About Our Legacy", href: "#about" },
                  { name: "Campus Facilities", href: "#facilities" },
                  { name: "Academic Wings", href: "#programs" },
                  { name: "Co-Curricular Activities", href: "#activities" },
                  { name: "Expert Faculties", href: "#faculties" },
                ].map(link => (
                  <li key={link.name}>
                    <a href={link.href} className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                      <span className="text-blue-500">›</span> {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Useful Links & ERP */}
            <div>
              <h4 className="text-white font-black mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Useful Info & ERP
              </h4>
              <ul className="space-y-2.5 text-xs font-semibold">
                <li>
                  <a href="#contact" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    <span className="text-indigo-500">›</span> Admissions Open 2026–27
                  </a>
                </li>
                <li>
                  <button onClick={() => navigate('/login')} className="hover:text-blue-400 transition-colors text-left flex items-center gap-1.5">
                    <span className="text-indigo-500">›</span> Secure ERP Login Portal
                  </button>
                </li>
                <li>
                  <a href="#toppers" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    <span className="text-indigo-500">›</span> Board Toppers & Wall of Fame
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    <span className="text-indigo-500">›</span> Contact & Enquiry Form
                  </a>
                </li>
                <li className="pt-2">
                  <AppDownloadButton buttonText="Download Mobile App 📱" />
                </li>
              </ul>
            </div>

            {/* Contact Details */}
            <div>
              <h4 className="text-white font-black mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Get in Touch
              </h4>
              <ul className="space-y-3 text-xs font-medium">
                <li className="flex gap-2.5 items-start">
                  <MapPin size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <span>Shree Dham Colony, Malikhedi, Bhopal (M.P.)</span>
                </li>
                <li className="flex gap-2.5 items-center">
                  <Phone size={16} className="text-emerald-500 shrink-0" />
                  <span>0755-4378074 / 9981105858</span>
                </li>
                <li className="flex gap-2.5 items-center">
                  <Mail size={16} className="text-indigo-500 shrink-0" />
                  <span>Vasantvalleyschool20@gmail.com</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Copyright Clean Footer Bottom (Vision Slogan Removed) */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
            <p>© 2026 Vasant Valley School. All rights reserved.</p>
            <div className="flex items-center gap-4 text-[11px]">
              <span>M.P. Board Affiliated School (Code: 231)</span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
};

export default LandingPage;