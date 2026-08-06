import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { 
  ArrowRight, CheckCircle2, Target, Eye, Mail, Phone, MapPin, Send, 
  Clock, Sparkles, Facebook, Twitter, Linkedin, GraduationCap, Instagram, 
  Youtube, Beaker, Microchip, FlaskConical, Menu, X, LogIn, Sun, Moon, 
  Monitor, Book, Bus, ShieldCheck, Award, Laptop, ArrowUpRight, BookOpen, Quote
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
    { name: "Facilities", href: "#facilities" },
    { name: "Programs", href: "#programs" },
    { name: "Faculties", href: "#faculties" },
    { name: "Testimonials", href: "#testimonials" },
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
          <span>SPS School</span>
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
  const { isDark } = useTheme();

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

      {/* --- HERO SECTION --- */}
      <section id="home" className={`relative min-h-screen pt-10 flex items-center overflow-hidden ${isDark ? "bg-[#091729]" : "bg-[var(--input-bg)]"}`}>
        <div className={`absolute top-0 right-0 w-1/3 h-full ${isDark ? "bg-blue-600/5" : "bg-blue-100/40"} rounded-l-[100px] -z-0 hidden lg:block`} />
        
        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center z-10">
          {/* Left Side: Content Module */}
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <div className={`inline-flex items-center gap-2 ${isDark ? "bg-slate-800/50 border-blue-100/10" : "bg-blue-50 border-blue-200"} border px-4 py-2 rounded-full shadow-sm mb-6`}>
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping"></span>
              <span className="text-blue-500 text-sm font-bold tracking-wide uppercase">Admissions Open 2026-27</span>
            </div>
            
            <h1 className={`text-5xl md:text-7xl font-extrabold leading-[1.1] mb-6 italic ${isDark ? "text-white" : "text-[var(--text-main)]"}`}>
              Empowering Future <span className="text-blue-600">Leaders</span><br /> 
              Through <span className="italic font-serif text-blue-500">Innovation.</span>
            </h1>
            
            <p className={`text-lg md:text-xl max-w-lg mb-8 leading-relaxed ${isDark ? "text-slate-400" : "text-[var(--text-muted)]"}`}>
              SPS School provides a world-class environment where technology and traditional values come together to shape the future of students. 
            </p>
            
            <div className="flex flex-wrap gap-5">
              <button onClick={() => navigate('/login')} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-blue-600/20 flex items-center gap-2 hover:bg-blue-700 transition-all">
                Access Portal <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
          
          {/* Right Side: Campus/Abstract Image Container */}
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }} className="relative">
            <div className={`relative z-10 w-full h-[400px] md:h-[550px] rounded-[40px] shadow-2xl overflow-hidden border-8 ${isDark ? "border-slate-800" : "border-[var(--border-color)]"}`}>
               <img src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=2000" alt="SPS School Campus" className="w-full h-full object-cover"/>
               <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? "from-[#0a192f]/50" : "from-white/30"} to-transparent`}></div>
            </div>
            <div className={`absolute -bottom-6 -left-6 w-full h-full border-4 border-dashed ${isDark ? "border-slate-700" : "border-[var(--border-color)]"} rounded-[40px] -z-10 translate-x-3 translate-y-3`}></div>
          </motion.div>
        </div>
      </section>

      {/* --- ABOUT SECTION --- */}
      <section id="about" className={`py-24 overflow-hidden ${isDark ? "bg-slate-900" : "bg-[var(--card-bg)] text-[var(--text-main)]"}`}>
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left Side: Legacy Image Module */}
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex-1 relative">
              <div className={`relative z-10 rounded-3xl overflow-hidden shadow-2xl border-8 ${isDark ? "border-slate-800" : "border-[var(--border-color)]"} h-[400px] md:h-[550px]`}>
                <img src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=2070" alt="SPS School Library" className="w-full h-full object-cover" />
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
                Founded in 2001, SPS School is dedicated to holistic student development. We provide a perfect balance of modern technology and traditional values, preparing students for global success.
              </p>
              {/* Legacy Key Features */}
              <ul className="space-y-4 mb-10">
                {["Global Standard Curriculum", "Focus on Co-curricular Activities", "Safe & Inclusive Environment"].map((item, i) => (
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

      {/* --- PROGRAMS SECTION --- */}
      <section id="programs" className={`py-24 relative overflow-hidden ${isDark ? "bg-slate-900" : "bg-[var(--card-bg)] text-[var(--text-main)]"}`}>
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border ${isDark ? "bg-blue-900 text-blue-300 border-blue-800" : "bg-blue-50 text-blue-600 border-blue-200"}`}>
              <GraduationCap size={16} /> Academic Excellence
            </span>
            <h2 className={`text-3xl md:text-5xl font-black leading-tight italic ${isDark ? "text-white" : "text-[var(--text-main)]"}`}>
              Academic <span className="text-blue-600 underline decoration-blue-800">Programs</span> Wing.
            </h2>
          </div>
          {/* Program Card Grid with accent colors */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Primary", age: "5-10 Yrs", icon: <BookOpen />, accent: "from-blue-600 to-indigo-700" },
              { title: "Secondary", age: "11-15 Yrs", icon: <FlaskConical />, accent: "from-violet-600 to-purple-800" },
              { title: "Higher Secondary", age: "16-18 Yrs", icon: <Award />, accent: "from-rose-500 to-pink-700" },
              { title: "Skill Lab", age: "Open for All", icon: <Laptop />, accent: "from-emerald-500 to-teal-700" },
            ].map((prog, i) => (
              <motion.div key={i} whileHover={{ y: -15 }} className="group">
                <div className={`p-10 rounded-[45px] bg-gradient-to-br ${prog.accent} text-white shadow-2xl transition-all duration-500`}>
                  <div className="w-16 h-16 rounded-2xl bg-[var(--card-bg)] text-[var(--text-main)]/10 backdrop-blur-md flex items-center justify-center mb-8 border border-white/20 shadow-lg">
                    {prog.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 block mb-2">{prog.age}</span>
                  <h3 className="text-2xl font-black mb-4 italic tracking-tight">{prog.title}</h3>
                  <button className="flex items-center gap-3 text-xs font-black uppercase tracking-widest bg-[var(--card-bg)] text-[var(--text-main)] text-[var(--text-main)] px-6 py-3 rounded-2xl hover:bg-slate-100 transition-colors shadow-xl">
                    Details <ArrowUpRight size={14} />
                  </button>
                </div>
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
              { name: "Rahul Verma", role: "Parent", quote: "SPS has transformed my son. Modern approach is amazing!" },
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
                { icon: <Phone />, title: "Call Us", detail: "+91 98765 43210", color: "text-blue-500" },
                { icon: <Mail />, title: "Email", detail: "contact@sps.edu", color: "text-indigo-500" },
                { icon: <MapPin />, title: "Visit Campus", detail: "Knowledge Park, MP, India", color: "text-emerald-500" }
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
              <span>SPS Smart</span>
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
              <li className="flex gap-3"><MapPin size={20} className="text-blue-500shrink-0" /> 123 Education Lane, MP, India</li>
              <li className="flex gap-3"><Phone size={20} className="text-blue-500shrink-0" /> +91 98765 43210</li>
              <li className="flex gap-3"><Mail size={20} className="text-blue-500shrink-0" /> contact@sps.smart</li>
            </ul>
          </div>
        </div>
        {/* Copyright Module */}
        <div className="container mx-auto px-6 mt-10 text-center text-xs text-[var(--text-muted)]">
          <p>© 2026 SPS International School ERP. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;