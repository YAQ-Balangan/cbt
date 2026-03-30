// src/App.jsx
import React, { useContext } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";

// Import halaman
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import GuruDashboard from "./pages/GuruDashboard";
import SiswaDashboard from "./pages/SiswaDashboard";
import UjianDashboard from "./pages/UjianDashboard";

// --- KOMPONEN PELINDUNG RUTE ---
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(AuthContext);
  const { kode_sekolah } = useParams();

  if (!user) return <Navigate to={`/${kode_sekolah}`} replace />;
  if (!allowedRoles.includes(user.role))
    return <Navigate to={`/${kode_sekolah}`} replace />;

  return children;
};

// --- ROUTER UTAMA ---
const AppRouter = () => {
  const { user } = useContext(AuthContext);

  return (
    <BrowserRouter>
      <Routes>
        {/* URL dinamis berdasarkan kode sekolah */}
        <Route
          path="/:kode_sekolah"
          element={
            !user ? (
              <LoginPage />
            ) : (
              <Navigate to={`/${user.kode_sekolah}/dashboard`} replace />
            )
          }
        />

        {/* Dashboard Berdasarkan Role */}
        <Route
          path="/:kode_sekolah/dashboard"
          element={
            user ? (
              user.role === "admin" ? (
                <AdminDashboard />
              ) : user.role === "guru" ? (
                <GuruDashboard />
              ) : (
                <SiswaDashboard />
              )
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Ujian Dashboard */}
        <Route
          path="/:kode_sekolah/ujian-dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin", "guru"]}>
              <UjianDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback jika link salah */}
        <Route
          path="*"
          element={
            <div className="p-10 text-center">
              Link salah. Silakan hubungi Admin Sekolah.
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>
    </AuthProvider>
  );
}
