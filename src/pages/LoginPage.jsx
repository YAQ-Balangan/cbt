// src/pages/LoginPage.jsx
import React, { useState, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Lock,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { api } from "../api/api";

const LoginPage = () => {
  const { kode_sekolah } = useParams();
  const { login } = useContext(AuthContext);

  const [instansi, setInstansi] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const loadInfo = async () => {
      try {
        const data = await api.getInstitusi(kode_sekolah);
        setInstansi(data);
        if (data?.nama_aplikasi) {
          document.title = data.nama_aplikasi;
        }
        const favicon = document.querySelector('link[rel="icon"]');
        if (favicon && data?.logo_url) {
          favicon.href = data.logo_url;
        }
      } catch (err) {
        setError("Sekolah tidak terdaftar. Pastikan link URL benar.");
      } finally {
        setFetching(false);
      }
    };
    loadInfo();
  }, [kode_sekolah]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(username, password, kode_sekolah);
    } catch (err) {
      setError("Username atau password tidak valid.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching)
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400 uppercase tracking-widest text-xs">
        Memuat Sistem TADBIRA...
      </div>
    );

  return (
    // Menggunakan h-screen agar pas satu layar penuh
    <div className="h-screen bg-slate-50 flex items-center justify-center p-2 sm:p-6 font-sans relative overflow-hidden">
      {/* Latar Belakang Animasi */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-5%] left-[-10%] w-[15rem] md:w-[30rem] h-[15rem] md:h-[30rem] bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-5%] right-[-10%] w-[15rem] md:w-[30rem] h-[15rem] md:h-[30rem] bg-amber-400/20 rounded-full blur-3xl pointer-events-none"
      />

      {/* FORM CARD - Padding diperketat agar tidak scroll di HP */}
      <div className="w-full max-w-[340px] sm:max-w-md bg-white/90 backdrop-blur-xl p-5 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 relative z-10 border border-white">
        <div className="flex flex-col items-center mb-4 sm:mb-8 text-center">
          {/* LOGO - Ukuran sedikit disesuaikan untuk mobile */}
          <div className="w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center mb-2 sm:mb-6 transform hover:scale-105 transition-transform duration-500 relative overflow-hidden rounded-2xl group">
            <img
              src={instansi?.logo_url}
              alt="Logo Sekolah"
              className="w-full h-full object-contain drop-shadow-xl relative z-10"
            />
            <motion.div
              className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-[-20deg] z-20 pointer-events-none"
              animate={{ left: ["-100%", "200%"] }}
              transition={{
                duration: 10,
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: 2,
              }}
            />
          </div>

          <h1 className="text-xl sm:text-3xl font-bold text-slate-800 tracking-tight uppercase">
            {instansi?.nama_aplikasi || "TADBIRA"}
          </h1>
          <p className="text-[9px] sm:text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5 sm:mt-2">
            {instansi?.nama_sekolah || "Tata Kelola Digital Berbasis Akurasi"}
          </p>
          <p className="text-[9px] sm:text-[11px] font-bold text-amber-500 uppercase tracking-widest mt-0.5 sm:mt-1">
            Online Based Test 2026
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 sm:p-4 bg-red-50 text-red-600 text-[10px] sm:text-sm font-semibold rounded-xl border border-red-100 text-center flex items-center justify-center gap-2">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {/* Space-y dikurangi untuk mobile agar lebih rapat */}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5">
          <div className="space-y-1">
            <label className="text-[9px] sm:text-[11px] font-semibold uppercase text-slate-500 ml-1 tracking-wider">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User size={16} />
              </div>
              <input
                type="text"
                required
                className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm text-slate-800 outline-none focus:bg-white focus:border-emerald-500 transition-colors placeholder:text-slate-400"
                placeholder="Masukkan username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] sm:text-[11px] font-semibold uppercase text-slate-500 ml-1 tracking-wider">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full pl-10 sm:pl-12 pr-12 py-2 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm text-slate-800 outline-none focus:bg-white focus:border-emerald-500 transition-colors placeholder:text-slate-400"
                placeholder="Masukkan password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-emerald-500 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="pt-2 sm:pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 text-white font-bold py-3 sm:py-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:bg-emerald-600 active:scale-95 transition-all uppercase tracking-widest disabled:opacity-70"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  Masuk Aplikasi <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Jarak copyright dikurangi agar naik ke atas */}
        <p className="text-center mt-4 sm:mt-8 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          &copy; 2026 Ahmad Maulana
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
