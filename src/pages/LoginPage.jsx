// src/pages/LoginPage.jsx
import React, { useState, useContext } from "react";
import { ShieldCheck, User, Lock, ArrowRight, Loader2 } from "lucide-react";
import { AuthContext } from "../context/AuthContext";

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
      // Panggil fungsi login dari AuthContext
      // Pastikan fungsi login di AuthContext melempar error (throw error) jika gagal
      await login(username, password);
    } catch (err) {
      setError("Username atau password tidak valid.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Dekorasi Background */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

      {/* Form Card */}
      <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 relative z-10 border border-slate-50">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-20 h-20 bg-sky-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 mb-6 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
            <ShieldCheck
              size={40}
              className="rotate-6 hover:rotate-0 transition-transform duration-300"
            />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
            MASDA PRO
          </h1>
          <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mt-2">
            Computer Based Test 2026
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100 text-center animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <User size={20} />
              </div>
              <input
                type="text"
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300"
                placeholder="Masukkan username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock size={20} />
              </div>
              <input
                type="password"
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300"
                placeholder="Masukkan password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2 mt-8 shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                Masuk Aplikasi <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-8 text-[10px] font-black text-slate-300 uppercase tracking-widest">
          &copy; 2026 MASDA PRO System
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
