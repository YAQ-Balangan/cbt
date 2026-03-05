// src/components/layout/Dashboard.jsx
import React, { useState, useContext } from "react";
import { ShieldCheck, LogOut, Menu } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { Badge } from "../ui/Ui";

const Dashboard = ({ children, menu = [], active, setActive }) => {
  const { user, logout } = useContext(AuthContext);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    // PERBAIKAN DI SINI: Menggunakan h-screen agar layout terkunci sebesar layar monitor
    <div className="h-screen w-full bg-[#FDFDFF] flex overflow-hidden font-sans relative">
      
      {/* OVERLAY UNTUK MOBILE */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-slate-100 transition-transform duration-500 lg:translate-x-0 lg:static flex flex-col h-full ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-8 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tighter">
                MASDA PRO
              </h2>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">
                Version 1.0 (BETA)
              </p>
            </div>
          </div>
        </div>

        {/* MENU TENGAH */}
        <div className="flex-1 overflow-y-auto px-8 pb-6">
          <nav className="space-y-2">
            {menu.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActive(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-bold text-sm ${active === item.id ? "bg-indigo-600 text-white shadow-2xl shadow-indigo-200" : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                {item.icon && <item.icon size={20} />} {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* PROFIL & LOGOUT BAWAH (Sekarang akan selalu diam di bawah layar!) */}
        <div className="p-8 border-t border-slate-50 space-y-6 bg-white shrink-0">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
            <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center font-black text-indigo-600 uppercase shadow-sm">
              {user?.nama?.[0] || "U"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black text-slate-900 truncate">
                {user?.nama || "User"}
              </p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {user?.role || "GUEST"}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-red-500 font-black text-sm hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* KONTEN KANAN (Hanya bagian ini yang akan bisa di-scroll) */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="h-20 shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-50 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 text-slate-500"
              onClick={() => setMobileOpen(true)}
            >
              <Menu />
            </button>
            <h2 className="font-black text-slate-900 text-lg uppercase tracking-tight">
              {menu.find((m) => m.id === active)?.label || "Dashboard"}
            </h2>
          </div>
          <Badge type={user?.role || "guest"} />
        </header>
        
        {/* AREA SCROLL KONTEN UTAMA */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-12 relative">{children}</main>
      </div>
    </div>
  );
};

export default Dashboard;