// src/pages/UjianDashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MonitorSmartphone,
  ShieldAlert,
  DoorOpen,
  Laptop,
  RefreshCw,
  Map,
  Settings as SettingsIcon,
  Plus,
  UserPlus,
  Trash2,
  X,
  Search,
  Check,
  Minus,
  Maximize,
  Minimize,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import Dashboard from "../components/layout/Dashboard";
import { api } from "../api/api";

// ==========================================
// 1. KOMPONEN AVATAR CSS CUSTOM ANDA
// ==========================================
const CustomAvatar = ({ gender }) => {
  const isBoy = gender !== "P";
  return (
    <div
      className="relative w-[180px] h-[240px] origin-bottom"
      style={{ transform: "scale(0.28)", marginBottom: "-15px" }}
    >
      {isBoy ? (
        <div className="w-full h-full relative flex flex-col items-center">
          <div
            className="w-[90px] h-[105px] bg-[#ffdbac] relative z-10"
            style={{ borderRadius: "45px 45px 50px 50px" }}
          >
            <div
              className="w-full h-[45px] bg-[#2d3436]"
              style={{ borderRadius: "45px 45px 10px 10px" }}
            ></div>
            <div className="absolute w-[8px] h-[8px] bg-[#333] rounded-full top-[40px] left-[15px]"></div>
            <div className="absolute w-[8px] h-[8px] bg-[#333] rounded-full top-[40px] right-[15px]"></div>
          </div>
          <div className="w-[180px] h-[150px] relative z-0 -mt-[5px]">
            <div
              className="w-full h-full bg-white border-2 border-slate-200 relative overflow-hidden flex flex-col items-center"
              style={{ borderRadius: "40px 40px 0 0" }}
            >
              <div
                className="w-[50px] h-[20px] bg-[#f0f0f0]"
                style={{ clipPath: "polygon(0 0, 100% 0, 85% 100%, 15% 100%)" }}
              ></div>
              <div
                className="w-[22px] h-[110px] bg-[#1e272e] -mt-[5px]"
                style={{
                  clipPath: "polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)",
                }}
              ></div>
              <div className="w-[35px] h-[40px] border-2 border-slate-100 absolute top-[40px] right-[30px] rounded-sm"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-full relative flex flex-col items-center">
          <div
            className="w-[110px] h-[140px] bg-white relative z-10 shadow-sm border border-slate-100"
            style={{ borderRadius: "55px 55px 40px 40px" }}
          >
            <div
              className="w-[70px] h-[90px] bg-[#ffdbac] absolute top-[25px] left-[20px]"
              style={{ borderRadius: "35px" }}
            >
              <div className="absolute w-[8px] h-[8px] bg-[#333] rounded-full top-[40px] left-[15px]"></div>
              <div className="absolute w-[8px] h-[8px] bg-[#333] rounded-full top-[40px] right-[15px]"></div>
            </div>
          </div>
          <div className="w-[180px] h-[150px] relative z-0 -mt-[25px]">
            <div
              className="w-full h-full bg-white border-2 border-slate-200 relative overflow-hidden"
              style={{ borderRadius: "40px 40px 0 0" }}
            >
              <div
                className="w-full h-[80px] bg-white shadow-[0_5px_15px_rgba(0,0,0,0.1)]"
                style={{ borderRadius: "0 0 80px 80px" }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// KOMPONEN UTAMA DASHBOARD
// ==========================================
const UjianDashboard = () => {
  const [activeTab, setActiveTab] = useState("live");
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState("IDLE");

  // STATE LAYOUT & DATA
  const [isFitScreen, setIsFitScreen] = useState(false);
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [zoomScale, setZoomScale] = useState(1);

  const [studentsData, setStudentsData] = useState([]);
  const [dbUsers, setDbUsers] = useState([]);
  const [layoutConfig, setLayoutConfig] = useState({});
  const [configId, setConfigId] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeRoom, setActiveRoom] = useState("");

  const [selectedDesk, setSelectedDesk] = useState(null);
  const [isModalSiswaOpen, setIsModalSiswaOpen] = useState(false);
  const [searchSiswa, setSearchSiswa] = useState("");

  // 1. FETCH DATA API
  const fetchAllData = async () => {
    setIsSyncing(true);
    try {
      const [resNilai, lockedSesi, resSettings, resUsers] = await Promise.all([
        api.read("Nilai"),
        api.getSesiTerkunci().catch(() => []),
        api.read("Settings"),
        api.read("Users"),
      ]);

      let usersRaw = resUsers || [];
      let siswaOnly = usersRaw.filter((u) => {
        const r = String(u.role || u.Role || "").toLowerCase();
        return r === "siswa" || r === "murid";
      });
      if (siswaOnly.length === 0 && usersRaw.length > 0) siswaOnly = usersRaw;
      setDbUsers(siswaOnly);

      const denahSetting = (resSettings || []).find(
        (s) => s.kunci === "Denah_Kelas",
      );
      if (denahSetting && denahSetting.nilai && isInitialLoad) {
        setConfigId(denahSetting.id);
        try {
          const parsed = JSON.parse(denahSetting.nilai);
          setLayoutConfig(parsed);
          if (Object.keys(parsed).length > 0 && !activeRoom) {
            setActiveRoom(Object.keys(parsed)[0]);
          }
        } catch (e) {}
      }

      const dataNilai = resNilai || [];
      const dataLocked = lockedSesi || [];

      const liveStudents = dataNilai.map((item, index) => {
        const isSiswaLocked = dataLocked.find(
          (l) => l.username_siswa === item.nama_siswa,
        );
        let currentStatus = "WORKING";
        if (item.status === "Selesai") currentStatus = "SELESAI";
        else if (isSiswaLocked) currentStatus = "LOCKED";

        // Cari gender dari resUsers (jika ada), jika tidak simulasi ganjil genap
        const userObj = siswaOnly.find((u) => u.nama === item.nama_siswa);
        const gender = userObj?.gender || (index % 2 === 0 ? "L" : "P");

        return {
          id: `live-${index}`,
          username: item.username || item.nama_siswa,
          id_ujian: item.id_ujian || "",
          nama: item.nama_siswa,
          gender: gender,
          progress: parseInt(
            item.progress || (item.status === "Selesai" ? 100 : 0),
          ),
          status: currentStatus,
        };
      });

      setStudentsData(liveStudents);
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
      if (isInitialLoad) setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      if (activeTab === "live") fetchAllData();
    }, 5000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // 2. AUTO-SAVE BACKGROUND
  useEffect(() => {
    if (
      isInitialLoad ||
      Object.keys(layoutConfig).length === 0 ||
      activeTab !== "builder"
    )
      return;
    setAutoSaveStatus("SAVING");
    const timeoutId = setTimeout(async () => {
      try {
        const payloadString = JSON.stringify(layoutConfig);
        if (configId) {
          await api.update("Settings", configId, {
            kunci: "Denah_Kelas",
            nilai: payloadString,
          });
        } else {
          const resSettings = await api.read("Settings");
          const maxId =
            resSettings.length > 0
              ? Math.max(...resSettings.map((s) => parseInt(s.id) || 0))
              : 0;
          const newSetting = await api.create("Settings", {
            id: maxId + 1,
            kunci: "Denah_Kelas",
            nilai: payloadString,
          });
          if (newSetting && !newSetting.error) setConfigId(maxId + 1);
        }
        setAutoSaveStatus("SAVED");
        setTimeout(() => setAutoSaveStatus("IDLE"), 2000);
      } catch (e) {
        setAutoSaveStatus("IDLE");
      }
    }, 1500);
    return () => clearTimeout(timeoutId);
  }, [layoutConfig, isInitialLoad, configId, activeTab]);

  // 3. FIT TO SCREEN LOGIC
  useEffect(() => {
    if (!isFitScreen || activeTab !== "live") {
      setZoomScale(1);
      return;
    }
    const calculateScale = () => {
      if (containerRef.current && contentRef.current) {
        contentRef.current.style.transform = "scale(1)";
        const containerW = containerRef.current.clientWidth;
        const containerH = containerRef.current.clientHeight;
        const contentW = contentRef.current.scrollWidth;
        const contentH = contentRef.current.scrollHeight;
        if (contentW === 0 || contentH === 0) return;

        const scaleW = containerW / contentW;
        const scaleH = containerH / contentH;
        let newScale = Math.min(scaleW, scaleH) * 0.9; // 0.90 margin
        if (newScale > 1) newScale = 1;
        setZoomScale(newScale);
      }
    };
    calculateScale();
    window.addEventListener("resize", calculateScale);
    return () => window.removeEventListener("resize", calculateScale);
  }, [isFitScreen, activeTab, layoutConfig, activeRoom, studentsData]);

  // FUNGSI BUILDER
  const handleAddRoom = () => {
    const roomName = prompt("Masukkan Nama Lokal Baru (Misal: Lokal 1):");
    if (!roomName || layoutConfig[roomName]) return;
    setLayoutConfig((prev) => ({
      ...prev,
      [roomName]: { door: "Kiri", cols: 5, rows: 5, assignments: {} },
    }));
    setActiveRoom(roomName);
  };

  const handleDeleteRoom = (roomName) => {
    if (window.confirm(`Yakin hapus denah ${roomName}?`)) {
      const newConf = { ...layoutConfig };
      delete newConf[roomName];
      setLayoutConfig(newConf);
      setActiveRoom(Object.keys(newConf)[0] || "");
    }
  };

  const updateGridSize = (type, action) => {
    setLayoutConfig((prev) => {
      const current = prev[activeRoom];
      let newVal = parseInt(current[type]) || 1;
      if (action === "PLUS") newVal += 1;
      if (action === "MINUS" && newVal > 1) newVal -= 1;
      return { ...prev, [activeRoom]: { ...current, [type]: newVal } };
    });
  };

  const handleUpdateDoor = (pos) => {
    setLayoutConfig((prev) => ({
      ...prev,
      [activeRoom]: { ...prev[activeRoom], door: pos },
    }));
  };

  const handleAssignStudent = (siswa) => {
    if (!activeRoom || selectedDesk === null) return;
    setLayoutConfig((prev) => ({
      ...prev,
      [activeRoom]: {
        ...prev[activeRoom],
        assignments: {
          ...prev[activeRoom].assignments,
          [selectedDesk]: { nama: siswa.nama, gender: siswa.gender || "L" },
        },
      },
    }));
    setIsModalSiswaOpen(false);
  };

  const handleRemoveStudent = (deskIndex) => {
    setLayoutConfig((prev) => {
      const newAssignments = { ...prev[activeRoom].assignments };
      delete newAssignments[deskIndex];
      return {
        ...prev,
        [activeRoom]: { ...prev[activeRoom], assignments: newAssignments },
      };
    });
  };

  const handleUnlockStudent = async (username, examId) => {
    try {
      await api.updateSesiStatus(username, examId, "ACTIVE", 1);
      setStudentsData((prev) =>
        prev.map((s) =>
          s.username === username ? { ...s, status: "WORKING" } : s,
        ),
      );
    } catch (err) {
      alert("Gagal membuka kunci.");
    }
  };

  // AMBIL SISWA YANG TERKUNCI SAJA (Untuk Alert Panel)
  const lockedStudents = studentsData.filter((s) => s.status === "LOCKED");

  // RENDER CLASSROOM
  const renderClassroom = () => {
    if (!activeRoom || !layoutConfig[activeRoom]) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 font-bold gap-4 bg-slate-100 rounded-[2rem] border-4 border-slate-200">
          <Map size={64} className="opacity-30" />
          <p>Belum ada denah ruangan yang dibuat.</p>
        </div>
      );
    }

    const roomConf = layoutConfig[activeRoom];
    const cols = Math.max(1, parseInt(roomConf.cols) || 5);
    const rows = Math.max(1, parseInt(roomConf.rows) || 5);
    const doorPos = roomConf.door || "Kiri";
    const assignments = roomConf.assignments || {};
    const totalDesks = cols * rows;

    const isZoomActive = isFitScreen && activeTab === "live";

    return (
      <div
        ref={containerRef}
        className={`flex-1 flex flex-col bg-slate-100 border-4 border-slate-200 rounded-[2rem] relative shadow-inner min-h-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] ${
          isZoomActive
            ? "overflow-hidden items-center justify-center"
            : "overflow-auto custom-scrollbar items-start"
        }`}
      >
        <div
          ref={contentRef}
          className={`flex flex-col p-6 md:p-10 ${isZoomActive ? "origin-center transition-transform duration-300" : "min-w-max mx-auto"}`}
          style={{ transform: isZoomActive ? `scale(${zoomScale})` : "none" }}
        >
          {/* AREA DEPAN KELAS (PINTU & MEJA GURU) */}
          <div
            className={`w-full flex items-start mb-16 relative z-10 ${doorPos === "Kanan" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`w-24 h-28 bg-white/80 rounded-2xl border-4 border-slate-300 flex flex-col items-center justify-center p-2 z-10 shadow-sm absolute top-0 ${doorPos === "Kanan" ? "right-0" : "left-0"}`}
            >
              <DoorOpen size={36} className="text-slate-400 mb-1" />
              <span className="text-[10px] font-black text-slate-500 uppercase text-center">
                Pintu
                <br />
                Masuk
              </span>
            </div>

            <div className="relative w-72 h-24 bg-slate-800 rounded-b-2xl rounded-t-lg shadow-2xl flex flex-col items-center justify-center border-b-8 border-slate-900 z-20 mx-auto">
              <Laptop size={28} className="text-slate-400 mb-2" />
              <span className="text-xs font-black text-white uppercase tracking-widest">
                Meja Pengawas
              </span>
            </div>
          </div>

          {/* GRID BANGKU MATRIKS DARI ATAS */}
          <div
            className="relative z-10 grid gap-6 mt-4 pb-10 mx-auto"
            style={{
              gridTemplateColumns: `repeat(${cols}, 130px)`,
              gridTemplateRows: `repeat(${rows}, 140px)`,
            }}
          >
            {Array.from({ length: totalDesks }, (_, i) => i + 1).map(
              (deskNo) => {
                const assignedData = assignments[deskNo];
                let liveStudent = null;

                if (activeTab === "live" && assignedData) {
                  liveStudent = studentsData.find(
                    (s) =>
                      s.nama.toLowerCase() === assignedData.nama.toLowerCase(),
                  );
                }

                const isSitting =
                  activeTab === "builder" ? !!assignedData : !!liveStudent;

                // Tentukan Status Visual
                let deskClass = "bg-white border-slate-200 shadow-sm"; // Kosong
                let deskStatus = "KOSONG";

                if (activeTab === "builder" && isSitting) {
                  deskClass = "bg-white border-indigo-200 shadow-sm";
                  deskStatus = "TERISI";
                } else if (activeTab === "live" && liveStudent) {
                  if (liveStudent.status === "LOCKED") {
                    deskClass =
                      "bg-red-50 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse z-20";
                    deskStatus = "TERKUNCI";
                  } else if (
                    liveStudent.status === "SELESAI" ||
                    liveStudent.status === "SUBMITTING"
                  ) {
                    deskClass = "bg-emerald-50 border-emerald-400 shadow-sm";
                    deskStatus = "SELESAI";
                  } else {
                    deskClass = "bg-white border-indigo-400 shadow-md";
                    deskStatus = `${liveStudent.progress}%`;
                  }
                }

                return (
                  <div
                    key={deskNo}
                    className="relative w-[130px] h-[140px] group"
                  >
                    {/* Container Meja Fisik */}
                    <div
                      onClick={() => {
                        if (activeTab === "builder") {
                          setSelectedDesk(deskNo);
                          setIsModalSiswaOpen(true);
                        }
                      }}
                      className={`absolute inset-0 rounded-2xl border-4 flex flex-col items-center justify-end pb-2 overflow-hidden transition-all ${deskClass} ${activeTab === "builder" && !assignedData ? "hover:border-indigo-400 hover:bg-indigo-50 border-dashed cursor-pointer" : ""}`}
                    >
                      {/* AVATAR DUDUK DI MEJA */}
                      <AnimatePresence>
                        {isSitting && (
                          <div className="absolute top-0 w-full h-[85px] flex items-end justify-center pt-2">
                            <CustomAvatar
                              gender={
                                activeTab === "builder"
                                  ? assignedData.gender
                                  : liveStudent?.gender
                              }
                            />
                          </div>
                        )}
                      </AnimatePresence>

                      {/* LABEL MEJA/NAMA & PROGRESS */}
                      <div className="w-full px-2 z-10 flex flex-col items-center mt-auto bg-white/80 backdrop-blur-sm pt-1">
                        {isSitting ? (
                          <>
                            <p className="text-[10px] font-bold text-slate-800 truncate w-full text-center leading-tight uppercase">
                              {activeTab === "builder"
                                ? assignedData.nama
                                : liveStudent?.nama}
                            </p>
                            <p
                              className={`text-[9px] font-black mt-0.5 tracking-widest ${deskStatus === "TERKUNCI" ? "text-red-600" : deskStatus === "SELESAI" ? "text-emerald-600" : "text-indigo-600"}`}
                            >
                              {deskStatus}
                            </p>

                            {/* Progress Bar di sisi bawah meja */}
                            {activeTab === "live" &&
                              liveStudent &&
                              liveStudent.status === "WORKING" && (
                                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                  <div
                                    className="bg-indigo-500 h-full rounded-full transition-all"
                                    style={{
                                      width: `${liveStudent.progress}%`,
                                    }}
                                  ></div>
                                </div>
                              )}
                          </>
                        ) : (
                          <span
                            className={`text-[10px] font-black mt-auto mb-2 ${activeTab === "builder" ? "text-indigo-400 group-hover:text-indigo-600" : "text-slate-300"}`}
                          >
                            MEJA {deskNo}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* TOMBOL HAPUS (BUILDER) */}
                    {activeTab === "builder" && isSitting && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveStudent(deskNo);
                        }}
                        className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 hover:bg-red-600 shadow-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}

                    {/* ICON ALERT / SELESAI MENGAMBANG DI ATAS MEJA */}
                    {activeTab === "live" &&
                      isSitting &&
                      deskStatus === "TERKUNCI" && (
                        <div className="absolute -top-4 -right-4 bg-red-500 text-white p-1.5 rounded-full shadow-lg z-30 animate-bounce">
                          <ShieldAlert size={18} />
                        </div>
                      )}
                    {activeTab === "live" &&
                      isSitting &&
                      deskStatus === "SELESAI" && (
                        <div className="absolute -top-3 -right-3 bg-emerald-500 text-white p-1 rounded-full shadow-md z-30">
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                  </div>
                );
              },
            )}
          </div>
        </div>
      </div>
    );
  };

  const menuItems = [
    { id: "live", label: "Kelas Virtual", icon: MonitorSmartphone },
    { id: "builder", label: "Atur Denah", icon: SettingsIcon },
  ];

  return (
    <Dashboard menu={menuItems} active={activeTab} setActive={setActiveTab}>
      <div className="flex flex-col h-[calc(100vh-100px)] max-w-[90rem] mx-auto p-2 md:p-4 font-sans select-none overflow-hidden gap-4 relative">
        {/* HEADER DASHBOARD */}
        <div className="bg-white p-4 md:p-5 rounded-[1.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between shrink-0 gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
              {activeTab === "live" ? (
                <>
                  <MonitorSmartphone className="text-indigo-600" /> Pemantauan
                  Kelas Virtual
                </>
              ) : (
                <>
                  <SettingsIcon className="text-indigo-500" /> Atur Denah Ujian
                </>
              )}
            </h2>
            <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
              {activeTab === "live"
                ? "Lihat simulasi ruang kelas dan aktivitas siswa dari sudut pandang pengawas."
                : "Desain baris, kolom, dan atur posisi duduk siswa."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "live" && (
              <>
                <button
                  onClick={() => setIsFitScreen(!isFitScreen)}
                  className={`px-4 py-2.5 rounded-xl border font-bold text-xs flex items-center gap-2 transition-all ${isFitScreen ? "bg-indigo-100 text-indigo-700 border-indigo-200 shadow-inner" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 shadow-sm"}`}
                >
                  {isFitScreen ? (
                    <>
                      <Minimize size={16} /> Mode Scroll
                    </>
                  ) : (
                    <>
                      <Maximize size={16} /> Fit ke Layar
                    </>
                  )}
                </button>
                <div
                  className="p-2.5 rounded-xl text-slate-400 bg-white border border-slate-200 shadow-sm"
                  title="Auto-Sync Berjalan"
                >
                  <RefreshCw
                    size={18}
                    className={isSyncing ? "animate-spin text-indigo-500" : ""}
                  />
                </div>
              </>
            )}
            {activeTab === "builder" && (
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
                {autoSaveStatus === "SAVING" ? (
                  <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                    <RefreshCw size={14} className="animate-spin" />{" "}
                    Menyimpan...
                  </span>
                ) : autoSaveStatus === "SAVED" ? (
                  <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                    <Check size={14} /> Tersimpan
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-400">
                    Auto-Save Aktif
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* TAB LOKAL / ROOMS */}
        <div className="flex overflow-x-auto gap-2 custom-scrollbar shrink-0 pb-1">
          {Object.keys(layoutConfig).map((room) => (
            <button
              key={room}
              onClick={() => setActiveRoom(room)}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 border shadow-sm ${
                activeRoom === room
                  ? "bg-slate-800 text-white border-slate-900"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Map size={14} /> {room}
            </button>
          ))}
          {activeTab === "builder" && (
            <button
              onClick={handleAddRoom}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-white text-indigo-600 border-2 border-dashed border-indigo-300 hover:bg-indigo-50 flex items-center gap-2"
            >
              <Plus size={14} /> Tambah Lokal
            </button>
          )}
        </div>

        {/* PANEL SETTING BUILDER */}
        <AnimatePresence>
          {activeTab === "builder" &&
            activeRoom &&
            layoutConfig[activeRoom] && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden shrink-0"
              >
                <div className="bg-white border border-slate-200 rounded-[1.5rem] p-4 flex flex-wrap items-end gap-4 shadow-sm">
                  <div className="flex flex-col flex-1 min-w-[120px]">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                      Kolom Meja
                    </label>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden h-10">
                      <button
                        onClick={() => updateGridSize("cols", "MINUS")}
                        className="px-4 h-full text-slate-500 hover:bg-slate-200 border-r border-slate-200"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="text"
                        readOnly
                        value={layoutConfig[activeRoom].cols}
                        className="w-full h-full text-center font-black text-slate-700 text-sm outline-none bg-transparent"
                      />
                      <button
                        onClick={() => updateGridSize("cols", "PLUS")}
                        className="px-4 h-full text-slate-500 hover:bg-slate-200 border-l border-slate-200"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 min-w-[120px]">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                      Baris Meja
                    </label>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden h-10">
                      <button
                        onClick={() => updateGridSize("rows", "MINUS")}
                        className="px-4 h-full text-slate-500 hover:bg-slate-200 border-r border-slate-200"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="text"
                        readOnly
                        value={layoutConfig[activeRoom].rows}
                        className="w-full h-full text-center font-black text-slate-700 text-sm outline-none bg-transparent"
                      />
                      <button
                        onClick={() => updateGridSize("rows", "PLUS")}
                        className="px-4 h-full text-slate-500 hover:bg-slate-200 border-l border-slate-200"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 min-w-[140px]">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                      Posisi Pintu
                    </label>
                    <select
                      value={layoutConfig[activeRoom].door}
                      onChange={(e) => handleUpdateDoor(e.target.value)}
                      className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 font-bold text-slate-700 text-xs outline-none focus:border-indigo-500"
                    >
                      <option value="Kiri">Depan Kiri</option>
                      <option value="Kanan">Depan Kanan</option>
                    </select>
                  </div>

                  <button
                    onClick={() => handleDeleteRoom(activeRoom)}
                    className="h-10 px-5 flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-xl font-bold text-xs whitespace-nowrap ml-auto"
                  >
                    <Trash2 size={16} />{" "}
                    <span className="hidden sm:inline">Hapus Denah Ini</span>
                  </button>
                </div>
              </motion.div>
            )}
        </AnimatePresence>

        {/* AREA KELAS (SCROLLABLE / ZOOMABLE) */}
        {renderClassroom()}

        {/* ==========================================
            FLOATING ALERT PANEL (ANTI LUPUT)
            Hanya muncul jika di Tab Live dan ada siswa terkunci
            ========================================== */}
        <AnimatePresence>
          {activeTab === "live" && lockedStudents.length > 0 && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="absolute right-4 bottom-4 md:right-8 md:bottom-8 z-50 w-80 bg-white rounded-2xl shadow-[0_10px_40px_rgba(239,68,68,0.3)] border-2 border-red-500 flex flex-col overflow-hidden"
            >
              <div className="bg-red-500 text-white p-3 flex justify-between items-center">
                <div className="flex items-center gap-2 font-black text-sm">
                  <AlertTriangle size={18} className="animate-pulse" />
                  PERINGATAN PELANGGARAN
                </div>
                <span className="bg-white text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">
                  {lockedStudents.length} Siswa
                </span>
              </div>
              <div className="max-h-60 overflow-y-auto p-2 bg-red-50 custom-scrollbar">
                {lockedStudents.map((siswa) => (
                  <div
                    key={siswa.username}
                    className="bg-white p-3 rounded-xl shadow-sm mb-2 last:mb-0 border border-red-100"
                  >
                    <p className="font-bold text-sm text-slate-800">
                      {siswa.nama}
                    </p>
                    <button
                      onClick={() =>
                        handleUnlockStudent(siswa.username, siswa.id_ujian)
                      }
                      className="mt-2 w-full py-1.5 bg-red-100 hover:bg-red-600 hover:text-white text-red-600 text-xs font-bold rounded-lg transition-colors border border-red-200 hover:border-red-600"
                    >
                      Buka Kunci Sekarang
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MODAL PILIH SISWA (BUILDER) */}
      <AnimatePresence>
        {isModalSiswaOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="p-5 border-b flex justify-between items-center bg-indigo-600 text-white shrink-0">
                <div>
                  <h3 className="font-black text-lg">Pilih Siswa</h3>
                  <p className="text-[11px] text-indigo-200 font-bold mt-0.5 uppercase tracking-widest">
                    UNTUK BANGKU NOMOR {selectedDesk}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalSiswaOpen(false)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 shrink-0 bg-slate-50 border-b border-slate-200">
                <div className="relative">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Ketik nama siswa..."
                    className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-indigo-500"
                    value={searchSiswa}
                    onChange={(e) => setSearchSiswa(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div className="overflow-y-auto flex-1 p-2 custom-scrollbar bg-white">
                {dbUsers
                  .filter((u) =>
                    u.nama.toLowerCase().includes(searchSiswa.toLowerCase()),
                  )
                  .map((u, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        handleAssignStudent({ nama: u.nama, gender: u.gender })
                      }
                      className="w-full flex items-center justify-between p-4 hover:bg-indigo-50 border-b border-slate-50 last:border-0 transition-colors text-left group rounded-xl"
                    >
                      <div>
                        <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-700">
                          {u.nama}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                          Kelas: {u.kelas || "-"} |{" "}
                          {u.gender === "P" ? "Perempuan" : "Laki-laki"}
                        </p>
                      </div>
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                        <UserPlus size={18} />
                      </div>
                    </button>
                  ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Dashboard>
  );
};

export default UjianDashboard;
