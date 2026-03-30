import React, { createContext, useState, useEffect } from "react";
import { api, APP_NAME } from "../api/api";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mengecek sesi yang tersimpan saat aplikasi pertama kali dimuat
    const saved = sessionStorage.getItem(`${APP_NAME}_session`);
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        sessionStorage.removeItem(`${APP_NAME}_session`);
      }
    }
    setLoading(false);
  }, []);

  /**
   * Fungsi Login diperbarui untuk menerima kodeSekolah
   * @param {string} u - Username
   * @param {string} p - Password
   * @param {string} kodeSekolah - Kode unik sekolah dari URL
   */
  const loginAction = async (u, p, kodeSekolah) => {
    // Mengirimkan ketiga parameter ke API Supabase
    const userData = await api.login(u, p, kodeSekolah);

    setUser(userData);

    // Menyimpan data user (termasuk kode_sekolah) ke sessionStorage
    sessionStorage.setItem(`${APP_NAME}_session`, JSON.stringify(userData));
  };

  const logoutAction = () => {
    setUser(null);
    sessionStorage.removeItem(`${APP_NAME}_session`);
  };

  return (
    <AuthContext.Provider
      value={{ user, login: loginAction, logout: logoutAction, loading }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
