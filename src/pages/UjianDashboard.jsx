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
  Skull,
  Filter
} from "lucide-react";
import Dashboard from "../components/layout/Dashboard";
import { api, supabase } from "../api/api"; 

// ==========================================
// 1. KOMPONEN AVATAR CSS CUSTOM (Mata X untuk Diskualifikasi)
// ==========================================
const CustomAvatar = ({ gender, isDisqualified }) => {
  const isBoy = !String(gender || "").toUpperCase().startsWith("P");

  const renderEyes = () => {
    if (isDisqualified) {
      return (
        <>
          <div className="absolute top-[37px] left-[13px] text-red-600 font-black text-[13px] leading-none drop-shadow-md z-20">X</div>
          <div className="absolute top-[37px] right-[13px] text-red-600 font-black text-[13px] leading-none drop-shadow-md z-20">X</div>
        </>
      );
    }
    return (
      <>
        <div className="absolute w-[8px] h-[8px] bg-[#333] rounded-full top-[40px] left-[15px] z-20"></div>
        <div className="absolute w-[8px] h-[8px] bg-[#333] rounded-full top-[40px] right-[15px] z-20"></div>
      </>
    );
  };

  return (
    <div
      className="relative w-[180px] h-[240px] origin-bottom"
      style={{ transform: "scale(0.28)", marginBottom: "-15px" }}
    >
      {isBoy ? (
        <div className="w-full h-full relative flex flex-col items-center">
          <div className={`w-[90px] h-[105px] ${isDisqualified ? 'bg-[#ffc2c2]' : 'bg-[#ffdbac]'} relative z-10 transition-colors`} style={{ borderRadius: "45px 45px 50px 50px" }}>
            <div className="w-full h-[45px] bg-[#2d3436]" style={{ borderRadius: "45px 45px 10px 10px" }}></div>
            {renderEyes()}
          </div>
          <div className="w-[180px] h-[150px] relative z-0 -mt-[5px]">
            <div className="w-full h-full bg-white border-2 border-slate-200 relative overflow-hidden flex flex-col items-center" style={{ borderRadius: "40px 40px 0 0" }}>
              <div className="w-[50px] h-[20px] bg-[#f0f0f0]" style={{ clipPath: "polygon(0 0, 100% 0, 85% 100%, 15% 100%)" }}></div>
              <div className="w-[22px] h-[110px] bg-[#1e272e] -mt-[5px]" style={{ clipPath: "polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)" }}></div>
              <div className="w-[35px] h-[40px] border-2 border-slate-100 absolute top-[40px] right-[30px] rounded-sm"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-full relative flex flex-col items-center">
          <div className="w-[110px] h-[140px] bg-white relative z-10 shadow-sm border border-slate-100" style={{ borderRadius: "55px 55px 40px 40px" }}>
            <div className={`w-[70px] h-[90px] ${isDisqualified ? 'bg-[#ffc2c2]' : 'bg-[#ffdbac]'} absolute top-[25px] left-[20px] transition-colors`} style={{ borderRadius: "35px" }}>
              {renderEyes()}
            </div>
          </div>
          <div className="w-[180px] h-[150px] relative z-0 -mt-[25px]">
            <div className="w-full h-full bg-white border-2 border-slate-200 relative overflow-hidden" style={{ borderRadius: "40px 40px 0 0" }}>
              <div className="w-full h-[80px] bg-white shadow-[0_5px_15px_rgba(0,0,0,0.1)]" style={{ borderRadius: "0 0 80px 80px" }}></div>
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

  const [isFitScreen, setIsFitScreen] = useState(false);
  const containerRef = useRef(null);
  
  // DUA STATE SCALE: 1 untuk Fit W&H, 1 untuk Fit Width doang (Mobile)
  const [zoomScale, setZoomScale] = useState(1);
  const [autoScale, setAutoScale] = useState(1);

  const [studentsData, setStudentsData] = useState([]);
  const [dbUsers, setDbUsers] = useState([]);

  const [layoutConfig, setLayoutConfig] = useState({});
  const [configId, setConfigId] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeRoom, setActiveRoom] = useState("");

  const [selectedDesk, setSelectedDesk] = useState(null);
  const [isModalSiswaOpen, setIsModalSiswaOpen] = useState(false);
  const [searchSiswa, setSearchSiswa] = useState("");

  const normalizeText = (text) => {
    if (!text) return "";
    return String(text).trim().toLowerCase().replace(/\s+/g, " ");
  };

  // KALKULASI DIMENSI PAPAN MATEMATIS
  const activeRoomConf = layoutConfig[activeRoom] || { cols: 5, rows: 5, door: "Kiri", assignments: {} };
  const cols = Math.max(1, parseInt(activeRoomConf.cols) || 5);
  const rows = Math.max(1, parseInt(activeRoomConf.rows) || 5);
  const boardWidth = (cols * 130) + ((cols - 1) * 24); 
  const boardHeight = (rows * 140) + ((rows - 1) * 24) + 160;

  // 1. FETCH DATA API 
  const fetchAllData = async () => {
    setIsSyncing(true);
    try {
      const fetchSesi = supabase.from("sesi_ujian").select("*").then(({ data }) => data || []).catch(() => []);

      const [resNilai, resSesiUjian, resSettings, resUsers, resJadwal, resSoal] = await Promise.all([
        api.read("Nilai").catch(() => []),
        fetchSesi, 
        api.read("Settings").catch(() => []),
        api.read("Users").catch(() => []),
        api.read("Jadwal").catch(() => []),
        api.read("Soal").catch(() => []),
      ]);

      const safeUsers = (resUsers || []).map((u) => ({
        nama: String(u.nama || u.Nama || u.username || u.Username || "Tanpa Nama"),
        username: String(u.username || u.Username || ""),
        kelas: String(u.kelas || u.Kelas || ""),
        gender: String(u.gender || u.Gender || u.jenis_kelamin || u.Jenis_Kelamin || "").toUpperCase().startsWith("P") ? "P" : "L",
        role: String(u.role || u.Role || "").toLowerCase(),
      }));

      let siswaOnly = safeUsers.filter((u) => u.role === "siswa" || u.role === "murid");
      if (siswaOnly.length === 0 && safeUsers.length > 0) siswaOnly = safeUsers;
      setDbUsers(siswaOnly);

      const denahSetting = (resSettings || []).find((s) => String(s.kunci || "").toLowerCase() === "denah_kelas");
      if (denahSetting && denahSetting.nilai && isInitialLoad) {
        setConfigId(denahSetting.id);
        try {
          const parsed = JSON.parse(denahSetting.nilai);
          setLayoutConfig(parsed);
          if (Object.keys(parsed).length > 0 && !activeRoom) setActiveRoom(Object.keys(parsed)[0]);
        } catch (e) {}
      }

      const examTotalSoal = {};
      const jadwalMap = {};

      if (resJadwal && resSoal) {
        resJadwal.forEach((jadwal) => {
          const mapelJadwal = String(jadwal.mapel || jadwal.Mapel || "");
          jadwalMap[String(jadwal.id)] = mapelJadwal || "Ujian";
          const total = resSoal.filter((s) => String(s.mapel || s.Mapel || "").toUpperCase() === mapelJadwal.toUpperCase()).length;
          examTotalSoal[String(jadwal.id)] = total > 0 ? total : 0;
        });
      }

      const liveStudentsList = [];

      (resSesiUjian || []).forEach((sesi) => {
        const usernameSesiNormal = normalizeText(sesi.username_siswa);
        const userObj = siswaOnly.find(u => normalizeText(u.username) === usernameSesiNormal);

        let jawaban = {};
        try { 
          if(typeof sesi.jawaban_sementara === 'string') jawaban = JSON.parse(sesi.jawaban_sementara); 
          else if (sesi.jawaban_sementara) jawaban = sesi.jawaban_sementara;
        } catch(e) {}
        
        const dijawab = Object.keys(jawaban).length;
        const totalSoal = examTotalSoal[String(sesi.id_ujian)] || 0;
        let percentage = totalSoal > 0 ? Math.min(100, Math.round((dijawab / totalSoal) * 100)) : 0;

        liveStudentsList.push({
          id: `live-${sesi.id_sesi}`,
          username: sesi.username_siswa, 
          id_ujian: String(sesi.id_ujian),
          mapel: jadwalMap[String(sesi.id_ujian)] || "Ujian",
          nama: userObj ? userObj.nama : sesi.username_siswa,
          gender: userObj ? userObj.gender : "L",
          dijawab: dijawab,
          totalSoal: totalSoal,
          progress: percentage,
          status: sesi.status === "LOCKED" ? "LOCKED" : "WORKING",
        });
      });

      (resNilai || []).forEach((nilai) => {
        const nNama = String(nilai.nama_siswa || nilai.Nama_Siswa || "").toLowerCase().trim();
        const statusVal = String(nilai.status || nilai.Status || "").toUpperCase();
        const isDisqualified = statusVal.includes("DISKUALIFIKASI") || statusVal.includes("DIS");

        const isAlreadyLive = liveStudentsList.find(ls => normalizeText(ls.username) === nNama || normalizeText(ls.nama) === nNama);

        if(!isAlreadyLive) {
            const userObj = siswaOnly.find(u => normalizeText(u.nama) === nNama || normalizeText(u.username) === nNama);

            liveStudentsList.push({
              id: `done-${nilai.id}`,
              username: userObj ? userObj.username : (nilai.nama_siswa || nilai.Nama_Siswa),
              id_ujian: String(nilai.id_ujian || ""),
              mapel: nilai.mapel || nilai.Mapel || "Ujian",
              nama: userObj ? userObj.nama : (nilai.nama_siswa || nilai.Nama_Siswa),
              gender: userObj ? userObj.gender : "L",
              dijawab: nilai.total_soal || nilai.Total_Soal || "-",
              totalSoal: nilai.total_soal || nilai.Total_Soal || "-",
              progress: 100,
              status: isDisqualified ? "DISKUALIFIKASI" : "SELESAI",
            });
        }
      });

      setStudentsData(liveStudentsList);
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
    if (isInitialLoad || Object.keys(layoutConfig).length === 0) return;

    setAutoSaveStatus("SAVING");
    const timeoutId = setTimeout(async () => {
      try {
        const payloadString = JSON.stringify(layoutConfig);
        let currentConfigId = configId;

        if (!currentConfigId) {
          const resSettings = await api.read("Settings").catch(() => []);
          const existing = resSettings.find((s) => String(s.kunci).toLowerCase() === "denah_kelas");
          if (existing) {
            currentConfigId = existing.id;
            setConfigId(existing.id);
          } else {
            const maxId = resSettings.length > 0 ? Math.max(...resSettings.map((s) => parseInt(s.id) || 0)) : 0;
            const newSetting = await api.create("Settings", { id: maxId + 1, kunci: "Denah_Kelas", nilai: payloadString });
            if (newSetting && !newSetting.error) {
              currentConfigId = maxId + 1;
              setConfigId(maxId + 1);
            }
          }
        }

        if (currentConfigId) {
          await api.update("Settings", currentConfigId, { kunci: "Denah_Kelas", nilai: payloadString });
        }
        
        setAutoSaveStatus("SAVED");
        setTimeout(() => setAutoSaveStatus("IDLE"), 2000);
      } catch (e) {
        setAutoSaveStatus("IDLE");
      }
    }, 1500);
    return () => clearTimeout(timeoutId);
  }, [layoutConfig, isInitialLoad, configId]);

  // 3. FIT TO SCREEN LOGIC
  useEffect(() => {
    const calculateScale = () => {
      if (containerRef.current) {
        const containerW = containerRef.current.clientWidth;
        const containerH = containerRef.current.clientHeight;
        if (containerW === 0 || containerH === 0) return;

        const contentW = boardWidth + 60; // Extra padding
        const contentH = boardHeight + 60;

        // Mode Fit Layar (W & H) - Untuk Desktop
        const scaleW = containerW / contentW;
        const scaleH = containerH / contentH;
        let fitScale = Math.min(scaleW, scaleH);
        if (fitScale > 1) fitScale = 1;
        setZoomScale(fitScale);

        // Mode Auto (Khusus Fit Width untuk HP agar tidak melebar/scroll samping)
        let wScale = containerW / contentW;
        if (wScale > 1) wScale = 1;
        setAutoScale(wScale);
      }
    };
    
    calculateScale();
    window.addEventListener("resize", calculateScale);
    setTimeout(calculateScale, 200); // Trigger again after UI renders
    return () => window.removeEventListener("resize", calculateScale);
  }, [isFitScreen, activeTab, layoutConfig, activeRoom, boardWidth, boardHeight]);

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
          [selectedDesk]: { nama: siswa.nama, username: siswa.username, gender: siswa.gender || "L" },
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
        prev.map((s) => s.username === username ? { ...s, status: "WORKING" } : s)
      );
    } catch (err) {
      alert("Gagal membuka kunci.");
    }
  };

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

    const doorPos = activeRoomConf.door || "Kiri";
    const assignments = activeRoomConf.assignments || {};
    const totalDesks = cols * rows;

    const isZoomActive = isFitScreen && activeTab === "live";
    const currentScale = isZoomActive ? zoomScale : autoScale;

    return (
      <div
        ref={containerRef}
        className={`flex-1 flex bg-slate-100 border-4 border-slate-200 rounded-[2rem] relative shadow-inner min-h-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] overflow-auto custom-scrollbar items-start justify-center`}
      >
        {/* WRAPPER MATEMATIS AGAR TIDAK ADA WHITE SPACE SAAT SCALE */}
        <div 
          className="flex justify-center transition-all duration-300 mt-6 md:mt-10"
          style={{ 
            width: `${boardWidth * currentScale}px`, 
            height: `${boardHeight * currentScale}px` 
          }}
        >
          <div
            className={`flex flex-col relative transition-transform duration-300 origin-top`}
            style={{ 
              width: `${boardWidth}px`,
              height: `${boardHeight}px`,
              transform: `scale(${currentScale})` 
            }}
          >
            {/* AREA DEPAN KELAS */}
            <div className={`w-full flex items-start mb-12 relative z-10 ${doorPos === "Kanan" ? "justify-end" : "justify-start"}`}>
              <div className={`w-24 h-28 bg-white/80 rounded-2xl border-4 border-slate-300 flex flex-col items-center justify-center p-2 z-10 shadow-sm absolute top-0 ${doorPos === "Kanan" ? "right-0" : "left-0"}`}>
                <DoorOpen size={36} className="text-slate-400 mb-1" />
                <span className="text-[10px] font-black text-slate-500 uppercase text-center">Pintu Masuk</span>
              </div>

              <div className="relative w-72 h-24 bg-slate-800 rounded-b-2xl rounded-t-lg shadow-2xl flex flex-col items-center justify-center border-b-8 border-slate-900 z-20 mx-auto">
                <Laptop size={28} className="text-slate-400 mb-2" />
                <span className="text-xs font-black text-white uppercase tracking-widest">Meja Pengawas</span>
              </div>
            </div>

            {/* GRID BANGKU MATRIKS */}
            <div
              className="relative z-10 grid gap-6 mx-auto"
              style={{
                gridTemplateColumns: `repeat(${cols}, 130px)`,
                gridTemplateRows: `repeat(${rows}, 140px)`,
              }}
            >
              {Array.from({ length: totalDesks }, (_, i) => i + 1).map((deskNo) => {
                  const assignedData = assignments[deskNo];
                  const isSitting = !!assignedData;
                  let liveStudent = null;

                  if (activeTab === "live" && isSitting) {
                    const assignedUsernameNormal = normalizeText(assignedData.username);
                    const assignedNamaNormal = normalizeText(assignedData.nama);

                    liveStudent = studentsData.find((s) => {
                      if (assignedData.username) {
                        return normalizeText(s.username) === assignedUsernameNormal;
                      }
                      return normalizeText(s.nama) === assignedNamaNormal;
                    });
                  }

                  // TEMA MEJA KAYU & STATUS
                  let deskClass = "bg-amber-100 border-amber-300 shadow-sm"; 
                  let deskStatus = "KOSONG";
                  let progressText = "";
                  let progressPercent = 0;
                  let mapelText = "";

                  const isFinished = liveStudent?.status === "SELESAI";
                  const isDisqualified = liveStudent?.status === "DISKUALIFIKASI";

                  if (activeTab === "builder" && isSitting) {
                    deskClass = "bg-[#8b5a2b] border-[#5c3a21] shadow-lg"; // Kayu klasik
                    deskStatus = "TERISI";
                  } else if (activeTab === "live" && isSitting) {
                    if (liveStudent) {
                      progressPercent = liveStudent.progress;
                      mapelText = liveStudent.mapel;

                      if (isDisqualified) {
                        deskClass = "bg-red-900 border-black shadow-[0_0_20px_rgba(220,38,38,0.9)] animate-pulse z-20";
                        deskStatus = "ELIMINASI";
                        progressText = "Melanggar Aturan";
                        progressPercent = 100;
                      } else if (liveStudent.status === "LOCKED") {
                        deskClass = "bg-orange-800 border-orange-950 shadow-[0_0_15px_rgba(249,115,22,0.8)] animate-pulse z-20";
                        deskStatus = "TERKUNCI";
                        progressText = `${liveStudent.dijawab}/${liveStudent.totalSoal} Soal`;
                      } else if (isFinished) {
                        deskClass = "bg-emerald-700 border-emerald-900 shadow-md";
                        deskStatus = "SELESAI";
                        progressText = `100% Tuntas`;
                        progressPercent = 100;
                      } else {
                        deskClass = "bg-[#8b5a2b] border-[#5c3a21] shadow-xl"; // Meja kayu menyala
                        deskStatus = `${progressPercent}%`;
                        progressText = `${liveStudent.dijawab}/${liveStudent.totalSoal} Soal`;
                      }
                    } else {
                      deskClass = "bg-[#8b5a2b] border-[#5c3a21] opacity-70 grayscale"; // Meja kayu mati (Offline)
                      deskStatus = "OFFLINE";
                      progressText = "Belum Mulai";
                      progressPercent = 0;
                    }
                  }

                  return (
                    <div key={deskNo} className="relative w-[130px] h-[140px] group">
                      <div
                        onClick={() => {
                          if (activeTab === "builder") {
                            setSelectedDesk(deskNo);
                            setIsModalSiswaOpen(true);
                          }
                        }}
                        className={`absolute inset-0 rounded-2xl border-4 flex flex-col items-center justify-end pb-0 overflow-hidden transition-all ${deskClass} ${activeTab === "builder" && !assignedData ? "hover:border-[#8b5a2b] hover:bg-amber-100 border-dashed cursor-pointer" : ""}`}
                      >
                        {/* AVATAR DENGAN ANIMASI RPG */}
                        <AnimatePresence>
                          {isSitting && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.5, y: -50, x: -50 }} 
                              animate={{ 
                                opacity: (activeTab === "live" && isFinished) ? 0 : 1, 
                                scale: (activeTab === "live" && isFinished) ? 0.3 : 1, 
                                y: (activeTab === "live" && isFinished) ? -150 : 0, 
                                x: 0 
                              }}
                              transition={{ duration: (activeTab === "live" && isFinished) ? 2 : 0.6, ease: "easeInOut" }}
                              className="absolute top-0 w-full h-[85px] flex items-end justify-center pt-2"
                            >
                              <CustomAvatar gender={assignedData.gender} isDisqualified={isDisqualified} />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* LABEL MEJA/NAMA (KERTAS PUTIH DI ATAS KAYU) */}
                        <div className="w-full px-2 z-10 flex flex-col items-center mt-auto bg-white pt-1 pb-1.5 border-t-2 border-black/20">
                          {isSitting ? (
                            <>
                              <p className="text-[10px] font-black text-slate-800 truncate w-full text-center leading-tight uppercase">
                                {assignedData.nama}
                              </p>

                              {activeTab === "live" ? (
                                <div className="w-full mt-0.5 flex flex-col gap-1">
                                  {liveStudent && deskStatus !== "OFFLINE" && (
                                    <div className="text-[7.5px] font-black text-indigo-500 truncate w-full text-center bg-indigo-50 rounded-full px-1 py-0.5 border border-indigo-200 leading-none">
                                      {mapelText}
                                    </div>
                                  )}
                                  
                                  <div className="flex justify-between items-center text-[8.5px] font-black px-0.5 leading-none mt-0.5">
                                    <span className={deskStatus === "TERKUNCI" ? "text-orange-600" : deskStatus === "ELIMINASI" ? "text-red-600" : deskStatus === "SELESAI" ? "text-emerald-600" : deskStatus === "OFFLINE" ? "text-slate-400" : "text-indigo-600"}>
                                      {deskStatus}
                                    </span>
                                    <span className="text-slate-500 font-bold">{progressText}</span>
                                  </div>

                                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden shadow-inner">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${deskStatus === "TERKUNCI" ? "bg-orange-500" : deskStatus === "ELIMINASI" ? "bg-red-600" : deskStatus === "SELESAI" ? "bg-emerald-500" : deskStatus === "OFFLINE" ? "bg-transparent" : "bg-indigo-500"}`}
                                      style={{ width: `${progressPercent}%` }}
                                    ></div>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[9px] font-black mt-0.5 tracking-widest text-indigo-600">TERISI</p>
                              )}
                            </>
                          ) : (
                            <span className={`text-[10px] font-black mt-auto mb-1 ${activeTab === "builder" ? "text-amber-700 group-hover:text-amber-900" : "text-slate-400"}`}>
                              MEJA {deskNo}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* TOMBOL HAPUS (BUILDER) */}
                      {activeTab === "builder" && isSitting && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveStudent(deskNo); }}
                          className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 hover:bg-red-600 shadow-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}

                      {/* ICON ALERT / SELESAI */}
                      {activeTab === "live" && isSitting && deskStatus === "TERKUNCI" && (
                        <div className="absolute -top-4 -right-4 bg-orange-500 text-white p-1.5 rounded-full shadow-lg z-30 animate-bounce">
                          <ShieldAlert size={18} />
                        </div>
                      )}
                      {activeTab === "live" && isSitting && deskStatus === "ELIMINASI" && (
                        <div className="absolute -top-4 -right-4 bg-red-600 text-white p-1.5 rounded-full shadow-lg z-30 animate-bounce">
                          <Skull size={18} />
                        </div>
                      )}
                      {activeTab === "live" && isSitting && deskStatus === "SELESAI" && (
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
                <><MonitorSmartphone className="text-indigo-600" /> Pemantauan Kelas Virtual</>
              ) : (
                <><SettingsIcon className="text-indigo-500" /> Atur Denah Ujian</>
              )}
            </h2>
            <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
              {activeTab === "live"
                ? "Lihat simulasi ruang kelas dan aktivitas siswa dari sudut pandang pengawas."
                : "Desain baris, kolom, dan atur posisi duduk siswa."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activeTab === "live" && (
              <>
                {/* TOMBOL FIT SCREEN DISEMBUNYIKAN DI HP KARENA SUDAH AUTO-FIT WIDTH */}
                <button
                  onClick={() => setIsFitScreen(!isFitScreen)}
                  className={`hidden md:flex px-4 py-2.5 rounded-xl border font-bold text-xs items-center gap-2 transition-all ${isFitScreen ? "bg-indigo-100 text-indigo-700 border-indigo-200 shadow-inner" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 shadow-sm"}`}
                >
                  {isFitScreen ? <><Minimize size={16} /> Mode Scroll</> : <><Maximize size={16} /> Fit ke Layar</>}
                </button>
                <div className="p-2.5 rounded-xl text-slate-400 bg-white border border-slate-200 shadow-sm" title="Auto-Sync Berjalan">
                  <RefreshCw size={18} className={isSyncing ? "animate-spin text-indigo-500" : ""} />
                </div>
              </>
            )}
            {activeTab === "builder" && (
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
                {autoSaveStatus === "SAVING" ? (
                  <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                    <RefreshCw size={14} className="animate-spin" /> Menyimpan...
                  </span>
                ) : autoSaveStatus === "SAVED" ? (
                  <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                    <Check size={14} /> Tersimpan
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-400">Auto-Save Aktif</span>
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
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Kolom Meja</label>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden h-10">
                      <button onClick={() => updateGridSize("cols", "MINUS")} className="px-4 h-full text-slate-500 hover:bg-slate-200 border-r border-slate-200"><Minus size={14} /></button>
                      <input type="text" readOnly value={layoutConfig[activeRoom].cols} className="w-full h-full text-center font-black text-slate-700 text-sm outline-none bg-transparent" />
                      <button onClick={() => updateGridSize("cols", "PLUS")} className="px-4 h-full text-slate-500 hover:bg-slate-200 border-l border-slate-200"><Plus size={14} /></button>
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 min-w-[120px]">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Baris Meja</label>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden h-10">
                      <button onClick={() => updateGridSize("rows", "MINUS")} className="px-4 h-full text-slate-500 hover:bg-slate-200 border-r border-slate-200"><Minus size={14} /></button>
                      <input type="text" readOnly value={layoutConfig[activeRoom].rows} className="w-full h-full text-center font-black text-slate-700 text-sm outline-none bg-transparent" />
                      <button onClick={() => updateGridSize("rows", "PLUS")} className="px-4 h-full text-slate-500 hover:bg-slate-200 border-l border-slate-200"><Plus size={14} /></button>
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 min-w-[140px]">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Posisi Pintu</label>
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
                    <Trash2 size={16} /> <span className="hidden sm:inline">Hapus Denah Ini</span>
                  </button>
                </div>
              </motion.div>
            )}
        </AnimatePresence>

        {/* AREA KELAS */}
        {renderClassroom()}

        {/* FLOATING ALERT PANEL UNTUK SISWA TERKUNCI/DISKUALIFIKASI */}
        <AnimatePresence>
          {activeTab === "live" && lockedStudents.length > 0 && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="absolute right-4 bottom-4 md:right-8 md:bottom-8 z-50 w-80 bg-white rounded-2xl shadow-[0_10px_40px_rgba(249,115,22,0.3)] border-2 border-orange-500 flex flex-col overflow-hidden"
            >
              <div className="bg-orange-500 text-white p-3 flex justify-between items-center">
                <div className="flex items-center gap-2 font-black text-sm">
                  <AlertTriangle size={18} className="animate-pulse" />
                  PERINGATAN PELANGGARAN
                </div>
                <span className="bg-white text-orange-600 px-2 py-0.5 rounded-full text-xs font-bold">
                  {lockedStudents.length} Siswa
                </span>
              </div>
              <div className="max-h-60 overflow-y-auto p-2 bg-orange-50 custom-scrollbar">
                {lockedStudents.map((siswa) => (
                  <div key={siswa.username} className="bg-white p-3 rounded-xl shadow-sm mb-2 last:mb-0 border border-orange-100">
                    <p className="font-bold text-sm text-slate-800">{siswa.nama}</p>
                    <button
                      onClick={() => handleUnlockStudent(siswa.username, siswa.id_ujian)}
                      className="mt-2 w-full py-1.5 bg-orange-100 hover:bg-orange-500 hover:text-white text-orange-600 text-xs font-bold rounded-lg transition-colors border border-orange-200 hover:border-orange-500"
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
                <button onClick={() => setIsModalSiswaOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 shrink-0 bg-slate-50 border-b border-slate-200">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Ketik nama/username siswa..."
                    className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-indigo-500"
                    value={searchSiswa}
                    onChange={(e) => setSearchSiswa(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div className="overflow-y-auto flex-1 p-2 custom-scrollbar bg-white">
                {dbUsers
                  .filter((u) => {
                    const searchName = String(u.nama || u.username || "").toLowerCase();
                    return searchName.includes(searchSiswa.toLowerCase());
                  })
                  .map((u, i) => {
                    const namaTampil = u.nama || u.username || "Siswa";
                    const usernameTampil = u.username || namaTampil;
                    const genderSet = String(u.gender).toUpperCase().startsWith("P") ? "P" : "L";

                    return (
                      <button
                        key={i}
                        onClick={() => handleAssignStudent({ nama: namaTampil, username: usernameTampil, gender: genderSet })}
                        className="w-full flex items-center justify-between p-4 hover:bg-indigo-50 border-b border-slate-50 last:border-0 transition-colors text-left group rounded-xl"
                      >
                        <div>
                          <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-700">
                            {namaTampil} <span className="text-xs font-medium text-slate-400">({usernameTampil})</span>
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                            Kelas: {u.kelas || "-"} | {genderSet === "P" ? "Perempuan" : "Laki-laki"}
                          </p>
                        </div>
                        <div className="bg-slate-100 p-2 rounded-lg text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                          <UserPlus size={18} />
                        </div>
                      </button>
                    );
                  })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Dashboard>
  );
};

export default UjianDashboard;