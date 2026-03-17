// src/pages/LoginPage.jsx
import React, { useState, useContext, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Lock, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react"; // Impor Eye dan EyeOff
import { AuthContext } from "../context/AuthContext";
import { api } from "../api/api";
import logoMasda from "../assets/logo.svg";

// Variabel Animasi
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // State baru untuk mengatur tampilan password
  const [showPassword, setShowPassword] = useState(false);

  const [isBlocked, setIsBlocked] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const isWebView = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    return (
      userAgent.includes("wv") ||
      (userAgent.includes("android") && userAgent.includes("version/"))
    );
  };

  useEffect(() => {
    const checkSettings = async () => {
      try {
        const settings = await api.read("Settings");
        const appOnlySet = settings.find((s) => s.kunci === "Mode_Aplikasi");

        if (appOnlySet && appOnlySet.nilai === "ON") {
          if (!isWebView()) setIsBlocked(true);
        }
      } catch (error) {
        console.error("Gagal cek setting keamanan:", error);
      } finally {
        setCheckingAccess(false);
      }
    };
    checkSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(username, password);
    } catch (err) {
      setError("Username atau password tidak valid.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500 w-10 h-10 mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
          Memeriksa Keamanan...
        </p>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center max-w-md">
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
            <Lock size={48} className="text-red-500 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-4 tracking-tight">
            AKSES DITOLAK
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Sistem saat ini berada dalam <b>Mode Eksklusif Aplikasi</b>. Anda
            tidak diizinkan masuk melalui Browser (Chrome/Safari).
            <br />
            <br />
            Silakan buka melalui <b>Aplikasi Resmi MASDA PRO</b> yang telah
            terinstal di perangkat Anda.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* BACKGROUND ANIMASI (GLASSMORPHISM) */}
      <motion.div
        animate={{ x: [0, 50, -20, 0], y: [0, -30, 40, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-5%] left-[-10%] w-[15rem] md:w-[30rem] h-[15rem] md:h-[30rem] bg-emerald-400/10 rounded-full blur-[80px] md:blur-[100px] pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, -40, 30, 0], y: [0, 50, -20, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-5%] right-[-10%] w-[15rem] md:w-[30rem] h-[15rem] md:h-[30rem] bg-amber-400/10 rounded-full blur-[80px] md:blur-[100px] pointer-events-none"
      />

      {/* FORM CARD */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[340px] sm:max-w-md bg-white/90 backdrop-blur-xl p-6 sm:p-8 md:p-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-slate-200/50 relative z-10 border border-white"
      >
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center mb-6 sm:mb-8 text-center"
        >
          {/* CONTAINER LOGO DENGAN EFEK SHIMMER (MENGKILAP) */}
          <motion.div
            variants={fadeUp}
            className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mb-4 sm:mb-6 transform hover:scale-105 transition-transform duration-500 relative overflow-hidden rounded-2xl group"
          >
            {/* GAMBAR LOGO UTAMA */}
            <img
              src={logoMasda}
              alt="Logo MASDA PRO"
              className="w-full h-full object-contain drop-shadow-xl relative z-10"
            />

            {/* EFEK CAHAYA LEWAT (SHIMMER) */}
            <motion.div
              className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-[-20deg] z-20 pointer-events-none"
              animate={{
                left: ["-100%", "200%"],
              }}
              transition={{
                duration: 10,
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: 2,
              }}
            />
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight"
          >
            MASDA PRO
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="text-[10px] sm:text-[11px] font-bold text-amber-500 uppercase tracking-widest mt-1.5 sm:mt-2"
          >
            Online Based Test 2026
          </motion.p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 sm:mb-6 p-3 sm:p-4 bg-red-50 text-red-600 text-xs sm:text-sm font-semibold rounded-xl border border-red-100 text-center flex items-center justify-center gap-2"
          >
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 animate-pulse" />
            {error}
          </motion.div>
        )}

        {/* Form menggunakan onSubmit agar Enter otomatis terdeteksi */}
        <motion.form
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          onSubmit={handleSubmit}
          className="space-y-4 sm:space-y-5"
        >
          <motion.div variants={fadeUp} className="space-y-1.5">
            <label className="text-[10px] sm:text-[11px] font-semibold uppercase text-slate-500 ml-1 tracking-wider">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User size={18} className="sm:w-5 sm:h-5" />
              </div>
              <input
                type="text"
                required
                className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm sm:text-base text-slate-800 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400 shadow-sm"
                placeholder="Masukkan username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="space-y-1.5">
            <label className="text-[10px] sm:text-[11px] font-semibold uppercase text-slate-500 ml-1 tracking-wider">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} className="sm:w-5 sm:h-5" />
              </div>
              <input
                // Tipe input dinamis berdasarkan state
                type={showPassword ? "text" : "password"}
                required
                // Padding kanan ditambah (pr-12) agar teks tidak tertutup ikon mata
                className="w-full pl-10 sm:pl-12 pr-12 py-2.5 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm sm:text-base text-slate-800 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400 shadow-sm"
                placeholder="Masukkan password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {/* Tombol Toggle Mata */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-emerald-500 focus:outline-none transition-colors"
              >
                {showPassword ? (
                  <EyeOff size={18} className="sm:w-5 sm:h-5" />
                ) : (
                  <Eye size={18} className="sm:w-5 sm:h-5" />
                )}
              </button>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="pt-3 sm:pt-4">
            {/* Tombol submit standar di dalam form akan selalu tertrigger oleh Enter */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold py-3 sm:py-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 hover:from-emerald-700 hover:to-emerald-600 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin sm:w-5 sm:h-5" />
              ) : (
                <>
                  Masuk Aplikasi{" "}
                  <ArrowRight size={18} className="sm:w-5 sm:h-5" />
                </>
              )}
            </button>
          </motion.div>
        </motion.form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-6 sm:mt-8 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest"
        >
          &copy; 2026 MA Darussalam Awayan
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
