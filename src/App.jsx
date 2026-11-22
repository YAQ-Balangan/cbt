// src/App.jsx
import React, { useContext, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";

// Import halaman-halaman yang sudah kita pisahkan
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import GuruDashboard from "./pages/GuruDashboard";
import SiswaDashboard from "./pages/SiswaDashboard";
import UjianDashboard from "./pages/UjianDashboard";

// --- KOMPONEN PELINDUNG RUTE (PROTECTED ROUTE) ---
// Memastikan hanya role tertentu yang bisa masuk ke sebuah halaman
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(AuthContext);

  // 1. Jika belum login (user tidak ada), tendang ke halaman login
  if (!user) return <Navigate to="/" replace />;

  // 2. Jika role tidak diizinkan masuk ke halaman ini, tendang ke dashboard utama
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  // 3. Jika aman, persilakan masuk
  return children;
};

// --- ROUTER UTAMA ---
const AppRouter = () => {
  const { user, logout } = useContext(AuthContext);

  useEffect(() => {
    if (!user || !["admin", "guru"].includes(user.role)) return undefined;

    if (window.location.pathname === "/") {
      const currentState = window.history.state || {};
      if (!currentState.cbtBackGuard) {
        window.history.replaceState(
          { ...currentState, cbtBackGuard: "root" },
          "",
          window.location.href,
        );
        window.history.pushState(
          { cbtBackGuard: "sentinel" },
          "",
          window.location.href,
        );
      }
    }

    const handleBackGuard = (event) => {
      if (window.location.pathname !== "/") return;
      if (event.state?.cbtBackGuard === "root") {
        logout();
      }
    };

    window.addEventListener("popstate", handleBackGuard);
    return () => window.removeEventListener("popstate", handleBackGuard);
  }, [user, logout]);

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          user.role === "admin" ? (
            <AdminDashboard />
          ) : user.role === "guru" ? (
            <GuruDashboard />
          ) : (
            <SiswaDashboard />
          )
        }
      />
      <Route
        path="/ujian-dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin", "guru"]}>
            <UjianDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>

      {/* Global Styles & Font */}
      <style>{`
        /* 1. IMPORT NOTO SANS DARI GOOGLE FONTS (Khusus Teks Latin/Standar) */
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
        
        /* 2. DAFTARKAN FONT ISEP MISBAH LOKAL */
        @font-face {
          font-family: 'IsepMisbah';
          src: url('/fonts/IsepMisbah.ttf') format('truetype');
          unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF;
          font-display: swap;
          
          /* SESUAIKAN UKURAN ARAB: 115% biasanya paling pas saat bersanding dengan Noto Sans */
          size-adjust: 120%; 
        }

        /* 3. PAKSA SEMUA ELEMEN TUNDUK PADA ATURAN FONT INI (Prioritaskan Arab, lalu Latin) */
        * { 
          font-family: 'IsepMisbah', 'Noto Sans', sans-serif !important; 
        }

        /* 4. PENGATURAN DASAR UNTUK SELURUH TEKS (Teks Standar) */
        body {
          color: #333333; 
          line-height: 1.6;
          font-size: 16px;
        }

        .teks-standar {
          font-size: 16px;
        }

        /* 5. PENGATURAN KHUSUS UNTUK TEKS ARAB MANUAL (BLOK BESAR) */
        .teks-arab {
          font-size: 24px !important;
          line-height: 2.0 !important;
          direction: rtl;
          text-align: right;
          display: block; /* Agar RTL (Right-to-Left) bekerja sempurna */
        }
        
        @keyframes shake { 
          0%, 100% { transform: translateX(0); } 
          25% { transform: translateX(-5px); } 
          75% { transform: translateX(5px); } 
        }
        
        .animate-shake { 
          animation: shake 0.3s ease-in-out; 
        }
      `}</style>
    </AuthProvider>
  );
}
