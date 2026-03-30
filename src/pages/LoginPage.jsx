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
  const { kode_sekolah } = useParams(); // Mengambil kode dari URL
  const { login } = useContext(AuthContext);

  const [instansi, setInstansi] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Ambil Logo dan Nama Sekolah saat halaman dibuka
  useEffect(() => {
    const loadInfo = async () => {
      try {
        const data = await api.getInstitusi(kode_sekolah);
        setInstansi(data);
      } catch (err) {
        setError("Sekolah tidak terdaftar.");
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
      // Login sekarang mengirimkan username, password, DAN kode sekolah
      await login(username, password, kode_sekolah);
    } catch (err) {
      setError(err.message || "Login gagal.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Memuat Aplikasi...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8"
      >
        <div className="text-center mb-8">
          {/* LOGO OTOMATIS BERGANTI */}
          <img
            src={instansi?.logo_url}
            alt="Logo"
            className="h-20 mx-auto mb-4 object-contain"
          />
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
            {instansi?.nama_aplikasi || "TADBIRA"}
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            {instansi?.nama_sekolah}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex gap-3 items-center text-sm font-bold">
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
              Username
            </label>
            <div className="relative">
              <User
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                required
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:border-emerald-500 outline-none transition-all"
                placeholder="Masukkan username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-12 text-sm focus:border-emerald-500 outline-none transition-all"
                placeholder="Masukkan password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                MASUK APLIKASI <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginPage;
