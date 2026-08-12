import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { 
  ArrowRight, CheckCircle2, Target, Eye, Mail, Phone, MapPin, Send, 
  Clock, Sparkles, Facebook, Twitter, Linkedin, GraduationCap, Instagram, 
  Youtube, Beaker, Microchip, FlaskConical, Menu, X, LogIn, Sun, Moon, 
  Monitor, Book, Bus, ShieldCheck, Award, Laptop, ArrowUpRight, BookOpen, Quote,
  Trophy, Palette, Music, Feather
} from "lucide-react";

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
    <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 ${scrolled ? (isDark ? "bg-[#0a192f]/90" : "bg-[var(--card-bg)] text-[var(--text-main)]/90") + " backdrop-blur-xl shadow-lg py-3" : (isDark ? "bg-[#0a192f]" : "bg-[var(--card-bg)] text-[var(--text-main)]") + " py-5"}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <div className={`flex items-center gap-2 font-black text-2xl italic tracking-tighter ${isDark ? "text-blue-600" : "text-blue-700"}`}>
          <div className="p-1.5 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/30">
            <GraduationCap size={28} className="text-white" />
          </div>
          <span>Vasant Valley School</span>
        </div>

        <div className="hidden lg:flex items-center space-x-7">
          <div className={`flex space-x-6 font-bold ${isDark ? "text-slate-200" : "text-[var(--text-main)]"}`}>
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className={`relative text-sm uppercase tracking-widest hover:text-blue-500 transition-colors group`}>
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </a>
            ))}
          </div>

          <div className={`flex items-center gap-4 pl-6 border-l ${isDark ? "border-slate-700" : "border-[var(--border-color)]"}`}>
            {/* Theme Toggle */}
            <button onClick={toggleTheme} title={isDark ? "Light Mode" : "Dark Mode"} className={`p-2 rounded-full transition-all ${isDark ? "bg-slate-800 text-yellow-400 hover:bg-slate-700" : "bg-slate-100 text-[var(--text-main)] hover:bg-slate-200"}`}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => navigate('/login')} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl">
              <LogIn size={16} /> ERP Login
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 lg:hidden">
          <button onClick={toggleTheme} className={`p-2 rounded-full ${isDark ? "bg-slate-800 text-yellow-400" : "bg-slate-100 text-[var(--text-main)]"}`}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className={`p-1 ${isDark ? "text-slate-200" : "text-[var(--text-main)]"}`} onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={30} /> : <Menu size={30} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={`lg:hidden ${isDark ? "bg-[#0a192f] border-slate-800" : "bg-[var(--card-bg)] text-[var(--text-main)] border-[var(--border-color)]"} border-t overflow-hidden shadow-2xl`}>
            <div className="container mx-auto px-6 py-8 flex flex-col space-y-5">
              {navLinks.map((link) => (
                <motion.a key={link.name} href={link.href} onClick={() => setIsOpen(false)} className={`text-xl font-black italic transition-colors ${isDark ? "text-slate-200 hover:text-blue-600" : "text-[var(--text-main)] hover:text-blue-600"}`}>
                  {link.name}
                </motion.a>
              ))}
              <div className={`pt-6 border-t ${isDark ? "border-slate-800" : "border-[var(--border-color)]"} flex flex-col gap-4`}>
                <button onClick={() => navigate('/login')} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg">
                  <LogIn size={18} /> ERP Login
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
    <div className={`scroll-smooth font-sans antialiased pt-20 ${isDark ? "bg-[#0a192f] text-slate-200" : "bg-[var(--card-bg)] text-[var(--text-main)] text-[var(--text-main)]"}`}>
      <LandingNavbar />

      {/* --- ULTRA PREMIUM HERO SECTION --- */}
      <section id="home" className={`relative min-h-[92vh] flex flex-col justify-center overflow-hidden transition-colors duration-500 ${isDark ? "bg-[#081526] text-white" : "bg-slate-50/90 text-slate-900"}`}>
        
        {/* Dynamic Glowing Mesh Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:36px_36px] -z-0" />
        <div className={`absolute top-0 right-0 w-2/3 h-full ${isDark ? "bg-gradient-to-l from-blue-600/20 via-indigo-600/10 to-transparent" : "bg-gradient-to-l from-blue-300/35 via-sky-200/20 to-transparent"} -z-0 pointer-events-none`} />
        <div className={`absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[140px] -z-0 ${isDark ? "bg-blue-600/25" : "bg-blue-300/40"} animate-pulse`} />
        <div className={`absolute bottom-0 right-20 w-[450px] h-[450px] rounded-full blur-[120px] -z-0 ${isDark ? "bg-indigo-600/20" : "bg-indigo-200/50"}`} />

        <div className="container mx-auto px-4 sm:px-6 pt-20 pb-16 grid lg:grid-cols-12 gap-12 lg:gap-8 items-center z-10 my-auto">

          {/* ── LEFT: Hero Headline & Interactive Vision (Col 7) ── */}
          <motion.div 
            initial={{ opacity: 0, y: 35 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8 }} 
            className="lg:col-span-7 flex flex-col gap-6"
          >

            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className={`inline-flex items-center gap-2.5 ${isDark ? "bg-blue-950/90 border-blue-500/50 text-blue-300 shadow-blue-950/50" : "bg-blue-50 border-blue-200 text-blue-800 shadow-blue-500/10"} border px-4 py-2 rounded-full shadow-md backdrop-blur-xl`}>
                <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 animate-ping"></span>
                <span className="text-xs font-black tracking-widest uppercase">Admissions Open 2026–27</span>
              </div>

              <div className={`inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-full border shadow-sm ${isDark ? "border-emerald-500/50 text-emerald-300 bg-emerald-950/70" : "border-emerald-300 text-emerald-700 bg-emerald-50"}`}>
                <ShieldCheck size={14} className="text-emerald-500" /> M.P. Board Recognized
              </div>

              <div className={`inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-full border shadow-sm ${isDark ? "border-amber-500/50 text-amber-300 bg-amber-950/70" : "border-amber-300 text-amber-700 bg-amber-50"}`}>
                <Award size={14} className="text-amber-500" /> Code: 231
              </div>
            </div>

            {/* Hero Main Headline */}
            <div>
              <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.10] tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                Shaping Character, <br />
                Inspiring <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 italic">Excellence.</span>
              </h1>
              
              <div className={`inline-flex items-center gap-2 mt-3.5 text-xs sm:text-sm font-bold tracking-wide uppercase px-3.5 py-2 rounded-xl border backdrop-blur-md ${isDark ? "bg-slate-800/90 text-slate-200 border-slate-700" : "bg-white/90 text-slate-800 border-slate-200 shadow-sm"}`}>
                <MapPin size={16} className="text-blue-500 shrink-0 animate-bounce" />
                <span>Shree Dham Colony, Malikhedi, Bhopal</span>
              </div>
            </div>

            {/* Guiding Vision Glassmorphic Card (LEARN • GROW • LEAD • SERVE) */}
            <div className={`relative overflow-hidden rounded-3xl border p-5 sm:p-6 shadow-2xl backdrop-blur-2xl transition-all ${
              isDark 
                ? "bg-slate-900/80 border-blue-500/40 text-white shadow-blue-500/10" 
                : "bg-white/95 border-blue-200 text-slate-900 shadow-blue-500/15"
            }`}>
              {/* Top Accent Gradient Bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-400" />

              <div className="flex items-center justify-between gap-2 mb-3.5">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-black uppercase tracking-[0.25em] px-3 py-1 rounded-lg ${
                    isDark 
                      ? "bg-blue-950 text-blue-300 border border-blue-800/60" 
                      : "bg-blue-100 text-blue-800 font-black"
                  }`}>
                    ✨ OUR GUIDING VISION
                  </span>
                </div>
                <span className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? "text-blue-400" : "text-blue-700"}`}>
                  Nursery to 12th
                </span>
              </div>

              {/* 4 Pillars Grid with Micro-Interactions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                {[
                  { en: "LEARN", hi: "सीखें", desc: "Digital & STEM Excellence", icon: BookOpen, color: "text-blue-500" },
                  { en: "GROW", hi: "बढ़ें", desc: "Holistic Development", icon: Sparkles, color: "text-indigo-500" },
                  { en: "LEAD", hi: "नेतृत्व", desc: "Confidence & Values", icon: Target, color: "text-amber-500" },
                  { en: "SERVE", hi: "सेवा", desc: "Community Contribution", icon: ShieldCheck, color: "text-emerald-500" },
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                      isDark 
                        ? "bg-slate-950/70 border-slate-800 hover:border-blue-500/60 hover:bg-slate-900" 
                        : "bg-slate-50/90 border-slate-200 hover:border-blue-300 hover:bg-white"
                    }`}
                  >
                    <item.icon className={`w-6 h-6 mb-1.5 ${item.color}`} />
                    <span className={`text-xs sm:text-sm font-black tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                      {item.en}
                    </span>
                    <span className={`text-xs font-extrabold mt-0.5 ${isDark ? "text-blue-300" : "text-blue-700"}`}>
                      {item.hi}
                    </span>
                    <span className={`text-[10px] font-medium mt-1 leading-tight hidden sm:block ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {item.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick ERP Role Login Bar */}
            <div className={`p-4 rounded-2xl border backdrop-blur-xl ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white/80 border-slate-200"}`}>
              <div className="text-xs font-black uppercase tracking-wider mb-2.5 flex items-center justify-between">
                <span className={isDark ? "text-slate-300" : "text-slate-700"}>⚡ Quick Portal Access:</span>
                <span className="text-blue-500 font-bold">1-Click Login</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { role: "Student", icon: GraduationCap, color: "bg-blue-600 hover:bg-blue-700" },
                  { role: "Teacher", icon: Book, color: "bg-indigo-600 hover:bg-indigo-700" },
                  { role: "Admin", icon: ShieldCheck, color: "bg-purple-600 hover:bg-purple-700" },
                  { role: "Parent", icon: LogIn, color: "bg-emerald-600 hover:bg-emerald-700" },
                ].map((r, i) => (
                  <button
                    key={i}
                    onClick={() => navigate('/login')}
                    className={`${r.color} text-white py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95`}
                  >
                    <r.icon size={14} /> {r.role}
                  </button>
                ))}
              </div>
            </div>

          </motion.div>

          {/* ── RIGHT: Interactive Visual Showcase & Counter Stats (Col 5) ── */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.92 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.9, delay: 0.2 }} 
            className="lg:col-span-5 flex flex-col gap-4 relative"
          >
            {/* Tab Selector Buttons */}
            <div className={`flex p-1.5 rounded-2xl border backdrop-blur-xl gap-1 overflow-x-auto ${isDark ? "bg-slate-900/90 border-slate-800" : "bg-white/90 border-slate-200 shadow-sm"}`}>
              {heroShowcases.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setHeroTab(s.id as any)}
                  className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition-all whitespace-nowrap ${
                    heroTab === s.id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.02]"
                      : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Main Visual Showcase Frame */}
            <div className={`relative z-10 w-full h-[380px] sm:h-[420px] rounded-[36px] shadow-2xl overflow-hidden border-4 sm:border-8 ${isDark ? "border-slate-800/90" : "border-white"}`}>
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
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
                <div className="bg-slate-950/80 backdrop-blur-md text-white border border-white/20 px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-lg">
                  <Award size={14} className="text-amber-400" />
                  <span>25+ Years Excellence</span>
                </div>
                <div className="bg-emerald-600/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[11px] font-black shadow-lg uppercase tracking-wider">
                  {currentHeroVisual.badge}
                </div>
              </div>

              {/* Title & Stats Overlay at Bottom */}
              <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col gap-2">
                <div className="text-white font-black text-lg drop-shadow-md">
                  {currentHeroVisual.title}
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Classes", val: "Nursery–12th" },
                    { label: "Board", val: "M.P. Board" },
                    { label: "Hours", val: "8:45 AM–1:50 PM" },
                  ].map((s, i) => (
                    <div key={i} className="bg-white/95 backdrop-blur-md rounded-2xl p-2 shadow-xl text-center border border-white/40">
                      <div className="text-blue-700 font-black text-xs sm:text-sm">{s.val}</div>
                      <div className="text-slate-600 text-[10px] font-extrabold leading-tight">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Counter Stats Card Grid */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: "25+", label: "Years" },
                { val: "1500+", label: "Students" },
                { val: "100%", label: "Board Pass" },
                { val: "50+", label: "Faculty" },
              ].map((stat, i) => (
                <div key={i} className={`p-3 rounded-2xl border text-center backdrop-blur-md ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white/90 border-slate-200 shadow-sm"}`}>
                  <div className="text-blue-500 font-black text-sm sm:text-base">{stat.val}</div>
                  <div className={`text-[10px] font-extrabold uppercase mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>{stat.label}</div>
                </div>
              ))}
            </div>

          </motion.div>

        </div>

        {/* Bottom Trust Highlights Ticker */}
        <div className={`w-full border-t py-4 ${isDark ? "bg-slate-900/90 border-slate-800 text-slate-300" : "bg-white/90 border-slate-200 text-slate-700"}`}>
          <div className="container mx-auto px-4 flex flex-wrap items-center justify-around gap-4 text-xs font-black uppercase tracking-wider text-center">
            <span className="flex items-center gap-2"><Book className="w-4 h-4 text-blue-500" /> Digital Smart Classrooms</span>
            <span className="flex items-center gap-2"><Laptop className="w-4 h-4 text-indigo-500" /> Computer & Science Labs</span>
            <span className="flex items-center gap-2"><Bus className="w-4 h-4 text-emerald-500" /> Safe GPS Transport</span>
            <span className="flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Sports & Activity Arena</span>
          </div>
        </div>
      </section>

      {/* --- ABOUT SECTION --- */}
      <section id="about" className={`py-24 overflow-hidden ${isDark ? "bg-slate-900" : "bg-[var(--card-bg)] text-[var(--text-main)]"}`}>
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left Side: Legacy Image Module */}
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex-1 relative">
              <div className={`relative z-10 rounded-3xl overflow-hidden shadow-2xl border-8 ${isDark ? "border-slate-800" : "border-[var(--border-color)]"} h-[400px] md:h-[550px]`}>
                <img src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=2070" alt="Vasant Valley School Library" className="w-full h-full object-cover" />
              </div>
              {/* Floating Experience Badge */}
              <div className="absolute -bottom-6 -right-6 md:right-10 bg-yellow-500 text-[#0a192f] p-6 rounded-2xl shadow-xl z-20">
                <p className="text-4xl font-black italic leading-none">25+</p>
                <p className="text-sm font-bold uppercase tracking-tight leading-tight">Years of <br /> Excellence</p>
              </div>
            </motion.div>
            
            {/* Right Side: Narrative Module */}
            <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex-1">
              <span className="text-blue-500 font-bold tracking-widest uppercase text-sm mb-4 block">About Our Legacy</span>
              <h2 className={`text-4xl md:text-5xl font-extrabold mb-6 leading-tight italic ${isDark ? "text-white" : "text-[var(--text-main)]"}`}>
                A Journey of <span className="text-blue-600">Knowledge</span> & Character
              </h2>
              <p className={`text-lg mb-8 leading-relaxed ${isDark ? "text-slate-400" : "text-[var(--text-muted)]"}`}>
                Founded in 2001, Vasant Valley School is dedicated to holistic student development. We provide a perfect balance of modern technology and traditional values, preparing students for global success.
              </p>
              {/* Legacy Key Features */}
              <ul className="space-y-4 mb-10">
                {["Global Standard Curriculum (M.P. Board)", "Classes: Nursery to 12th", "Safe & Inclusive Environment"].map((item, i) => (
                  <li key={i} className={`flex items-center gap-3 font-medium ${isDark ? "text-slate-300" : "text-[var(--text-main)]"}`}>
                    <CheckCircle2 className="text-blue-600 w-5 h-5" /> {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- FACILITIES SECTION --- */}
      <section id="facilities" className={`py-24 relative overflow-hidden ${isDark ? "bg-[#0a192f]" : "bg-[var(--input-bg)]"}`}>
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-blue-600 font-bold tracking-[0.2em] uppercase text-sm">Excellence in Every Detail</span>
            <h2 className={`text-4xl md:text-5xl font-black mt-4 italic ${isDark ? "text-white" : "text-[var(--text-main)]"}`}>Premium <span className="text-blue-600">Facilities</span></h2>
          </div>
          {/* Service/Facilities Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <Monitor size={32} />, title: "Digital Classes", desc: "Interactive smart boards aur VR technology in classrooms.", gradient: "from-blue-500 to-cyan-400" },
              { icon: <Bus size={32} />, title: "Smart Transport", desc: "Fully air-conditioned buses with GPS tracking.", gradient: "from-purple-500 to-pink-500" },
              { icon: <Book size={32} />, title: "Modern Library", desc: "20,000+ books aur high-speed internet lab.", gradient: "from-emerald-500 to-teal-400" },
              { icon: <ShieldCheck size={32} />, title: "AI Security", desc: "AI-powered CCTV aur facial recognition campus.", gradient: "from-orange-500 to-amber-400" },
            ].map((item, i) => (
              <motion.div key={i} whileHover={{ y: -10 }} className={`p-8 rounded-[32px] shadow-sm hover:shadow-2xl transition-all duration-500 group ${isDark ? "bg-slate-900 border border-slate-800 hover:border-blue-100/20" : "bg-[var(--card-bg)] text-[var(--text-main)] border border-[var(--border-color)] hover:border-blue-300"}`}>
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-8 ${isDark ? "bg-slate-800" : "bg-slate-100"} text-blue-600 group-hover:bg-gradient-to-br ${item.gradient} group-hover:text-white transition-all duration-500`}>
                  {item.icon}
                </div>
                <h3 className={`text-2xl font-bold mb-4 tracking-tight group-hover:text-blue-600 transition-colors ${isDark ? "text-white" : "text-[var(--text-main)]"}`}>{item.title}</h3>
                <p className={`leading-relaxed mb-8 ${isDark ? "text-slate-400" : "text-[var(--text-muted)]"}`}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- ACADEMIC EXCELLENCE & PROGRAMS SECTION --- */}
      <section id="programs" className={`py-24 relative overflow-hidden transition-colors duration-500 ${isDark ? "bg-[#091729] text-white" : "bg-slate-50/80 text-slate-900"}`}>
        
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

            {/* Interactive Wing Filter Tabs */}
            <div className={`mt-8 inline-flex p-1.5 rounded-2xl border backdrop-blur-xl gap-1 flex-wrap justify-center ${isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200 shadow-md"}`}>
              {[
                { id: 'all', label: 'All Wings' },
                { id: 'pre', label: '🧸 Pre-Primary' },
                { id: 'primary', label: '📚 Primary (1st–5th)' },
                { id: 'secondary', label: '🔬 Secondary (6th–10th)' },
                { id: 'senior', label: '🎓 Senior Secondary (11th–12th)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAcademicWing(tab.id as any)}
                  className={`py-2.5 px-4 rounded-xl font-extrabold text-xs transition-all duration-300 ${
                    academicWing === tab.id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105"
                      : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-blue-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Academic Wings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                id: 'pre',
                title: "Pre-Primary Wing",
                classes: "Nursery, LKG & UKG",
                badge: "Foundational Play-Way Stage",
                desc: "Activity-based learning focusing on phonics, motor skills, color recognition, and social habit formation.",
                highlights: ["Phonics & Vocabulary", "Play-Way Activity Lab", "Social Habit Formation", "Color & Shape Skills"],
                icon: BookOpen,
                accent: "from-sky-500 via-blue-600 to-indigo-700",
                shadow: "shadow-sky-500/20",
                metric: "100% Phonics Readiness"
              },
              {
                id: 'primary',
                title: "Primary Wing",
                classes: "Classes 1st – 5th",
                badge: "Preparatory Knowledge Base",
                desc: "Strong foundation in Mathematics logic, Language fluency, Science curiosity, and Environmental awareness.",
                highlights: ["English & Hindi Literacy", "Mental Math & Logic", "EVS & Science Basics", "Smartboard Learning"],
                icon: FlaskConical,
                accent: "from-indigo-600 via-purple-600 to-pink-700",
                shadow: "shadow-indigo-500/20",
                metric: "Conceptual Mastery"
              },
              {
                id: 'secondary',
                title: "Secondary Wing",
                classes: "Classes 6th – 10th",
                badge: "Middle & Board Preparation",
                desc: "In-depth M.P. Board curriculum, practical laboratory experiments, Computer Science coding, and Board exam prep.",
                highlights: ["Physics, Chemistry & Bio", "Advanced Mathematics", "Computer & Coding Lab", "M.P. Board Prep"],
                icon: Award,
                accent: "from-emerald-600 via-teal-600 to-cyan-700",
                shadow: "shadow-emerald-500/20",
                metric: "100% Board Pass Rate"
              },
              {
                id: 'senior',
                title: "Senior Secondary",
                classes: "Classes 11th – 12th",
                badge: "Specialization & Board Merit",
                desc: "Specialized Science (PCM/PCB), Commerce, and Arts streams with M.P. Board Merit mentoring and JEE/NEET guidance.",
                highlights: ["Science (PCM / PCB)", "Commerce & Accounts", "Arts & Humanities", "Competitive Guidance"],
                icon: Laptop,
                accent: "from-amber-500 via-orange-600 to-rose-700",
                shadow: "shadow-amber-500/20",
                metric: "Merit Rank Coaching"
              },
            ]
            .filter(wing => academicWing === 'all' || academicWing === wing.id)
            .map((wing, i) => (
              <motion.div 
                key={wing.id} 
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -10 }} 
                className="group flex flex-col justify-between"
              >
                <div className={`relative overflow-hidden rounded-[36px] p-8 bg-gradient-to-br ${wing.accent} text-white shadow-2xl ${wing.shadow} transition-all duration-500 flex flex-col justify-between h-full border border-white/20`}>
                  
                  {/* Top Glass Badge & Icon */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg group-hover:rotate-6 transition-transform">
                        <wing.icon className="w-7 h-7 text-white" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white/90 border border-white/20">
                        {wing.metric}
                      </span>
                    </div>

                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/80 block mb-1">
                      {wing.classes}
                    </span>

                    <h3 className="text-2xl font-black mb-2 tracking-tight">
                      {wing.title}
                    </h3>

                    <p className="text-xs text-white/90 font-medium leading-relaxed mb-6">
                      {wing.desc}
                    </p>

                    {/* Bullet Highlights */}
                    <div className="space-y-2 mb-8 pt-4 border-t border-white/20">
                      {wing.highlights.map((hl, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs font-bold text-white/95">
                          <CheckCircle2 size={14} className="text-white shrink-0" />
                          <span>{hl}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Action */}
                  <button 
                    onClick={() => navigate('/login')}
                    className="w-full flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider bg-white text-slate-900 px-5 py-3.5 rounded-2xl hover:bg-slate-100 transition-colors shadow-xl group-hover:scale-[1.02] active:scale-95"
                  >
                    Explore Curriculum <ArrowUpRight size={16} />
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
      <section id="activities" className={`py-24 relative overflow-hidden ${isDark ? "bg-[#091729]" : "bg-[var(--input-bg)]"}`}>
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-blue-600 font-bold tracking-[0.2em] uppercase text-sm flex items-center justify-center gap-2">
              <Sparkles size={16} /> Holistic Development
            </span>
            <h2 className={`text-4xl md:text-5xl font-black mt-3 italic ${isDark ? "text-white" : "text-[var(--text-main)]"}`}>
              Co-Curricular <span className="text-blue-600">Activities</span>
            </h2>
            <p className={`mt-4 text-base md:text-lg ${isDark ? "text-slate-400" : "text-[var(--text-muted)]"}`}>
              Empowering students to discover their passions, hone talents, and develop leadership through a rich spectrum of co-curricular pursuits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Sports",
                icon: <Trophy size={32} />,
                badge: "Physical Fitness & Teams",
                desc: "Cricket, Football, Basketball, Athletics, Martial Arts & Indoor Games to build sportsmanship and endurance.",
                gradient: "from-amber-500 to-orange-600",
                accentColor: "text-amber-500"
              },
              {
                title: "Art & Craft",
                icon: <Palette size={32} />,
                badge: "Creative Expression",
                desc: "Sketching, Painting, Clay Modeling, Origami, Sculpture, and Design workshops to inspire creative flair.",
                gradient: "from-purple-500 to-pink-600",
                accentColor: "text-purple-500"
              },
              {
                title: "Cultural Activities",
                icon: <Music size={32} />,
                badge: "Performing Arts",
                desc: "Classical & Modern Dance, Vocal & Instrumental Music, Drama, Theater & Annual Cultural Celebrations.",
                gradient: "from-blue-500 to-indigo-600",
                accentColor: "text-blue-500"
              },
              {
                title: "Literary Activities",
                icon: <Feather size={32} />,
                badge: "Intellectual Excellence",
                desc: "Debates, Elocution, Creative Writing, Quiz Competitions, Spelling Bee & Public Speaking clubs.",
                gradient: "from-emerald-500 to-teal-600",
                accentColor: "text-emerald-500"
              }
            ].map((activity, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -12 }}
                className={`p-8 rounded-[36px] border shadow-lg hover:shadow-2xl transition-all duration-500 flex flex-col justify-between ${
                  isDark ? "bg-slate-900 border-slate-800 hover:border-blue-500/30" : "bg-white border-blue-100 hover:border-blue-300"
                }`}
              >
                <div>
                  <div className={`w-16 h-16 rounded-2xl ${isDark ? "bg-slate-800" : "bg-slate-100"} ${activity.accentColor} flex items-center justify-center mb-6 shadow-sm`}>
                    {activity.icon}
                  </div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400 px-3 py-1 rounded-full inline-block mb-3">
                    {activity.badge}
                  </span>
                  <h3 className={`text-2xl font-black mb-3 tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                    {activity.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    {activity.desc}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Explore Club</span>
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${activity.gradient} text-white flex items-center justify-center shadow-md`}>
                    <ArrowUpRight size={16} />
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
            <div className="mt-8 inline-flex p-1.5 rounded-2xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-inner">
              <button
                onClick={() => setTopperTab('10th')}
                className={`px-8 py-3 rounded-xl font-black text-sm transition-all duration-300 flex items-center gap-2 ${
                  topperTab === '10th'
                    ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 scale-105"
                    : "text-slate-600 dark:text-slate-300 hover:text-amber-500"
                }`}
              >
                🎓 Class 10th Top 5
              </button>
              <button
                onClick={() => setTopperTab('12th')}
                className={`px-8 py-3 rounded-xl font-black text-sm transition-all duration-300 flex items-center gap-2 ${
                  topperTab === '12th'
                    ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 scale-105"
                    : "text-slate-600 dark:text-slate-300 hover:text-amber-500"
                }`}
              >
                🌟 Class 12th Top 5
              </button>
            </div>
          </div>

          {/* Topper Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
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
      <section id="faculties" className={`py-24 ${isDark ? "bg-[#0a192f]" : "bg-[var(--input-bg)]"}`}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-5xl font-black italic mb-4 ${isDark ? "text-white" : "text-[var(--text-main)]"}`}>Meet Our <span className="text-blue-600">Expert Faculties</span></h2>
            <p className={`max-w-xl mx-auto text-lg ${isDark ? "text-slate-400" : "text-[var(--text-muted)]"}`}>Our teachers are mentors and guides who support students at every step.</p>
          </div>
          {/* Faculty Profile Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: "Dr. Sarah Johnson", role: "Principal", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800" },
              { name: "Mr. Rajesh Kumar", role: "HOD Math", img: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=800" },
              { name: "Ms. Priya Sharma", role: "English Mentor", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800" },
              { name: "Mr. David Smith", role: "Physics Expert", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=800" },
            ].map((fac, i) => (
              <motion.div key={i} whileHover={{ y: -10 }} className={`rounded-[40px] overflow-hidden border group ${isDark ? "bg-slate-900 border-slate-800" : "bg-[var(--card-bg)] text-[var(--text-main)] border-[var(--border-color)] shadow-lg"}`}>
                <div className="h-72 w-full overflow-hidden">
                  <img src={fac.img} alt={fac.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                </div>
                <div className="p-6 text-center">
                  <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-[var(--text-main)]"}`}>{fac.name}</h3>
                  <p className="text-blue-500 font-bold text-sm mb-1">{fac.role}</p>
                  <div className="mt-4 flex justify-center gap-4">
                    <a href="#" className={`w-8 h-8 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-600 hover:text-white transition-all ${isDark ? "bg-slate-800" : "bg-slate-100"}`}><Linkedin size={16} /></a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* --- TESTIMONIALS SECTION --- */}
      <section id="testimonials" className={`py-24 overflow-hidden ${isDark ? "bg-slate-900" : "bg-[var(--card-bg)] text-[var(--text-main)]"}`}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-5xl font-black italic mb-4 ${isDark ? "text-white" : "text-[var(--text-main)]"}`}>What <span className="text-blue-600">Parents & Students</span> Say</h2>
          </div>
          {/* Testimonial Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { name: "Rahul Verma", role: "Parent", quote: "Vasant Valley School has transformed my son. Modern approach is amazing!" },
              { name: "Aarav Patel", role: "Student (Grade 12)", quote: "Tech integration and flexible learning is exactly what I needed." }
            ].map((test, i) => (
              <motion.div key={i} className={`p-10 rounded-3xl border shadow-xl space-y-6 ${isDark ? "bg-[#0a192f] border-slate-800" : "bg-[var(--input-bg)] border-[var(--border-color)]"}`}>
                <Quote className="text-blue-600 rotate-180" size={32} />
                <p className={`text-xl font-medium leading-relaxed ${isDark ? "text-slate-300" : "text-[var(--text-main)]"}`}>"{test.quote}"</p>
                <div className={`flex items-center gap-4 pt-4 border-t ${isDark ? "border-slate-800" : "border-[var(--border-color)]"}`}>
                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-black text-blue-500 text-xl ${isDark ? "bg-slate-800 border-slate-700" : "bg-blue-50 border-blue-200"}`}>{test.name.charAt(0)}</div>
                    <div>
                        <p className={`font-bold text-lg ${isDark ? "text-white" : "text-[var(--text-main)]"}`}>{test.name}</p>
                        <p className={`text-sm ${isDark ? "text-[var(--text-muted)]" : "text-[var(--text-muted)]"}`}>{test.role}</p>
                    </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CONTACT SECTION --- */}
      <section id="contact" className={`py-24 relative overflow-hidden ${isDark ? "bg-[#0a192f]" : "bg-[var(--input-bg)]"}`}>
        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-stretch">
          {/* Left Side: Contact Information Module */}
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-10">
            <div>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest mb-6 border ${isDark ? "bg-blue-900/30 text-blue-500 border-blue-800" : "bg-blue-50 text-blue-600 border-blue-200"}`}>
                <Sparkles size={14} /> Contact Us
              </div>
              <h2 className={`text-4xl md:text-6xl font-black leading-tight italic ${isDark ? "text-white" : "text-[var(--text-main)]"}`}>
                Let’s Start <br /> <span className="text-blue-600">A Conversation.</span>
              </h2>
            </div>
            <div className="space-y-6">
              {[
                { icon: <Clock />, title: "School Hours", detail: "8:45 AM – 1:50 PM", color: "text-amber-500" },
                { icon: <Phone />, title: "Call Us", detail: "0755-4378074 / 9981105858", color: "text-blue-500" },
                { icon: <Mail />, title: "Email", detail: "Vasantvalleyschool20@gmail.com", color: "text-indigo-500" },
                { icon: <MapPin />, title: "Visit Campus", detail: "Shree Dham Colony, Malikhedi, Bhopal", color: "text-emerald-500" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-5 group">
                  <div className={`w-14 h-14 ${isDark ? "bg-slate-800" : "bg-slate-100"} ${item.color} rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>{item.icon}</div>
                  <div>
                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">{item.title}</p>
                    <p className={`text-lg font-bold ${isDark ? "text-slate-200" : "text-[var(--text-main)]"}`}>{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Side: modern contact form */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className={`p-8 md:p-12 rounded-[40px] shadow-2xl border ${isDark ? "bg-slate-900 shadow-slate-950/30 border-slate-800" : "bg-[var(--card-bg)] text-[var(--text-main)] shadow-slate-200/50 border-[var(--border-color)]"}`}>
            <h3 className={`text-2xl font-black mb-8 italic ${isDark ? "text-white" : "text-[var(--text-main)]"}`}>Send a Message</h3>
            <form ref={form} onSubmit={handleSubmit} className="space-y-6">
              <input type="text" name="full_name" placeholder="Full Name" className={`w-full p-4 border rounded-2xl outline-none focus:ring-2 ring-blue-500 font-medium ${isDark ? "bg-[#0a192f] border-slate-800 text-white" : "bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]"}`} required/>
              <input type="email" name="email" placeholder="Email Address" className={`w-full p-4 border rounded-2xl outline-none focus:ring-2 ring-blue-500 font-medium ${isDark ? "bg-[#0a192f] border-slate-800 text-white" : "bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]"}`} required/>
              <textarea name="message" placeholder="Your Message" className={`w-full p-4 border rounded-2xl outline-none focus:ring-2 ring-blue-500 font-medium h-32 resize-none ${isDark ? "bg-[#0a192f] border-slate-800 text-white" : "bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]"}`} required></textarea>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all">
               {loading ? "Sending..." : "Submit Inquiry"} <Send size={20} />
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className={`pt-20 pb-10 ${isDark ? "bg-slate-950 text-slate-400" : "bg-slate-900 text-slate-400"}`}>
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 border-b border-slate-800 pb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-white font-bold text-2xl italic">
              <GraduationCap size={32} className="text-blue-500" />
              <span>Vasant Valley School</span>
            </div>
            <p className="text-sm leading-relaxed">Shaping tomorrow's leaders today with modern innovation since 2001.</p>
            <div className="flex gap-4">
              {socialLinks.map(({ Icon, href }, i) => (
              <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 rounded-lg hover:bg-blue-600 hover:text-white transition">
                <Icon size={20}/>
              </a>
             ))}
            </div>
          </div>
          {/* Link Columns */}
          <div>
            <h4 className="text-white font-bold mb-6 text-lg">Quick Links</h4>
            <ul className="space-y-4 text-sm">
                {["Home", "About Us", "Facilities", "Faculty"].map(link => <li key={link}><a href="#" className="hover:text-blue-500 transition">{link}</a></li>)}
            </ul>
          </div>
          {/* useful info */}
          <div>
            <h4 className="text-white font-bold mb-6 text-lg">Useful Info</h4>
            <ul className="space-y-4 text-sm">
                {["Admissions 2026", "School Calendar", "Exam Results", "Privacy Policy"].map(link => <li key={link}><a href="#" className="hover:text-blue-500 transition">{link}</a></li>)}
            </ul>
          </div>
          {/* contact details */}
          <div>
            <h4 className="text-white font-bold mb-6 text-lg">Get in Touch</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3"><MapPin size={20} className="text-blue-500shrink-0" /> Shree Dham Colony, Malikhedi, Bhopal</li>
              <li className="flex gap-3"><Phone size={20} className="text-blue-500shrink-0" /> 0755-4378074</li>
              <li className="flex gap-3"><Phone size={20} className="text-blue-500shrink-0" /> 9981105858</li>
              <li className="flex gap-3"><Mail size={20} className="text-blue-500shrink-0" /> Vasantvalleyschool20@gmail.com</li>
            </ul>
          </div>
        </div>
        {/* Copyright Module */}
        <div className="container mx-auto px-6 mt-10 text-center text-xs text-[var(--text-muted)]">
          <p className="font-black tracking-[0.15em] text-blue-500 mb-1 uppercase">LEARN • GROW • LEAD • SERVE</p>
          <p className="italic mb-2" style={{ fontSize: '11px' }}>सीखें • बढ़ें • नेतृत्व करें • सेवा करें</p>
          <p>© 2026 Vasant Valley School ERP. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;