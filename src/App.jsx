// src/App.jsx
import React, { useContext } from "react";
import { AuthProvider, AuthContext } from "./context/AuthContext";

// Import halaman-halaman yang sudah kita pisahkan (sesuaikan path foldernya jika berbeda)
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import GuruDashboard from "./pages/GuruDashboard";
import SiswaDashboard from "./pages/SiswaDashboard";

// --- ROUTER UTAMA ---
const AppRouter = () => {
  const { user } = useContext(AuthContext);

  // Jika belum login (user tidak ada), arahkan ke halaman Login
  if (!user) return <LoginPage />;

  // Jika sudah login, arahkan ke dashboard sesuai role-nya
  switch (user.role) {
    case "admin":
      return <AdminDashboard />;
    case "guru":
      return <GuruDashboard />;
    case "siswa":
      return <SiswaDashboard />;
    default:
      // Fallback jika role tidak dikenali
      return <LoginPage />;
  }
};

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />

      {/* Global Styles & Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600;1,700;1,800&display=swap');
        
        body { 
          font-family: 'Plus Jakarta Sans', sans-serif; 
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
