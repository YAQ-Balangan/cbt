// src/pages/LoginPage.jsx
import React, { useState, useContext } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, User, Lock, ArrowRight, Loader2 } from "lucide-react";
import { AuthContext } from "../context/AuthContext";

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
          <motion.div
            variants={fadeUp}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl sm:rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 mb-4 sm:mb-6 transform -rotate-6 hover:rotate-0 transition-transform duration-500"
          >
            <ShieldCheck
              size={32}
              className="sm:w-10 sm:h-10 rotate-6 hover:rotate-0 transition-transform duration-500"
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
            Computer Based Test 2026
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
                type="password"
                required
                className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm sm:text-base text-slate-800 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400 shadow-sm"
                placeholder="Masukkan password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="pt-3 sm:pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold py-3 sm:py-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 hover:from-emerald-700 hover:to-emerald-600 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
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
          &copy; 2026 MASDA PRO System
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
