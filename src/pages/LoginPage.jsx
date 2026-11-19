// src/pages/LoginPage.jsx
import React, { useState, useContext } from "react";
import {
  User,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { AuthContext } from "../context/AuthContextValue";
import logoTADBIRA from "../assets/logo.svg";

const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(username, password);
    } catch {
      setError("Username atau password tidak valid.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 flex items-center justify-center p-6 font-sans relative min-h-screen min-h-[100dvh] w-full overflow-x-hidden overflow-y-auto">
      <div className="w-full max-w-[360px] sm:max-w-[380px] bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-lg shadow-slate-200/60 border border-white/50">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mb-5">
            <img
              src={logoTADBIRA}
              alt="Logo TADBIRA"
              className="w-full h-full object-contain"
            />
          </div>

          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            TADBIRA
          </h1>
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-2">
            "Tata Kelola Digital Berbasis Akurasi"
          </p>
          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-1">
            Online Based Test 2026
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100 flex items-center justify-center gap-2">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-400 ml-1 tracking-wider">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input
                type="text"
                required
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-sm text-slate-800 outline-none focus:bg-white focus:border-emerald-500 placeholder:text-slate-300"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-400 ml-1 tracking-wider">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-sm text-slate-800 outline-none focus:bg-white focus:border-emerald-500 placeholder:text-slate-300"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-emerald-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 text-white font-black py-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 hover:bg-emerald-600 uppercase tracking-[0.2em] disabled:opacity-70"
            >
              {loading ? (
                <span role="status" aria-live="polite">
                  Memproses...
                </span>
              ) : (
                <>
                  Masuk <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-center mt-10 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
          &copy; 2026 Ahmad Maulana
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
