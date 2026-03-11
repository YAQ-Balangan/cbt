// src/pages/SiswaDashboard.jsx
import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BarChart3,
  Clock,
  Calendar,
  ArrowRight,
  ArrowLeft,
  ClipboardCheck,
  RefreshCw,
  Timer,
  CheckCircle2,
  BookOpen,
  Lock,
  Award,
  Target,
  ShieldAlert,
  Sparkles,
  AlertTriangle,
  Info,
  Maximize,
  X,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { api } from "../api/api";
import Dashboard from "../components/layout/Dashboard";
import { Card, Badge } from "../components/ui/Ui";

// ==========================================
// ANIMASI FRAMER MOTION
// ==========================================
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ==========================================
// HELPER BACA DATA
// ==========================================
const getVal = (obj, keyName) => {
  if (!obj) return "";
  if (obj[keyName] !== undefined && obj[keyName] !== "") return obj[keyName];
  const lowerKey = keyName.toLowerCase();
  const foundKey = Object.keys(obj).find((k) => k.toLowerCase() === lowerKey);
  return foundKey ? obj[foundKey] : "";
};
const formatTanggalLokal = (dateString) => {
  if (!dateString) return "Hari ini";
  try {
    if (String(dateString).includes("T") && String(dateString).includes("Z")) {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    return dateString;
  } catch (error) {
    return dateString;
  }
};

const KKM_SCORE = 75;
const MAX_CHEAT_WARNINGS = 3;

const SiswaDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("home");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [exams, setExams] = useState([]);
  const [myResults, setMyResults] = useState([]);

  // ==========================================
  // STATE MESIN UJIAN (EXAM ENGINE)
  // ==========================================
  const [tokens, setTokens] = useState({});
  const [activeExam, setActiveExam] = useState(null);
  const [soalData, setSoalData] = useState([]);
  const [loadingSoal, setLoadingSoal] = useState(false);

  const [currentSoalIndex, setCurrentSoalIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [cheatWarnings, setCheatWarnings] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STATE UNTUK GAMBAR ZOOM & MOBILE DRAWER
  const [zoomedImg, setZoomedImg] = useState(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const [requireFullscreen, setRequireFullscreen] = useState(false);

  const [customAlert, setCustomAlert] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });

  const showAlert = useCallback((type, title, message, onConfirm = null) => {
    setCustomAlert({ isOpen: true, type, title, message, onConfirm });
  }, []);

  const closeAlert = useCallback(() => {
    setCustomAlert((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const activeExamRef = useRef(activeExam);
  const answersRef = useRef(answers);
  const soalDataRef = useRef(soalData);
  const isSubmittingRef = useRef(isSubmitting);
  const isAlerting = useRef(false);
  const timeLeftRef = useRef(timeLeft);
  const cheatWarningsRef = useRef(cheatWarnings);

  useEffect(() => {
    activeExamRef.current = activeExam;
  }, [activeExam]);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    soalDataRef.current = soalData;
  }, [soalData]);
  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  // ==============================================================
  // IDENTITAS KELAS SISWA (SMART PARSER - ANTI HARDCODE)
  // ==============================================================
  const userKelasFull = String(getVal(user, "Kelas") || "")
    .toUpperCase()
    .trim();
  const userParts = userKelasFull.split(" ");
  const userTingkat = userParts[0] || "";
  const userJurusan = userParts[1] || "";
  const userTingkatJurusan = `${userTingkat} ${userJurusan}`.trim();

  // ==========================================
  // 1. SILENT POLLING DATA
  // ==========================================
  useEffect(() => {
    const fetchData = async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      try {
        const jadwalRes = await api.read("Jadwal");
        const nilaiRes = await api.read("Nilai");

        let finalJadwal = [];
        if (jadwalRes && jadwalRes.length > 0) {
          const filteredJadwal = jadwalRes.filter((j) => {
            const jadwalKelasRaw = String(
              getVal(j, "Kelas") || "",
            ).toUpperCase();

            // Aturan 1: Ujian Global
            if (jadwalKelasRaw === "" || jadwalKelasRaw.includes("SEMUA"))
              return true;

            // Aturan 2: Pencocokan Hierarki Kategori Kelas (Smart Filter)
            const targetArray = jadwalKelasRaw.split(",").map((t) => t.trim());
            const isMatch = targetArray.some((target) => {
              return (
                target === userKelasFull ||
                target === userTingkatJurusan ||
                target === userJurusan ||
                target === userTingkat
              );
            });

            return isMatch;
          });

          finalJadwal = filteredJadwal;
        }

        let finalNilai = [];
        if (nilaiRes && nilaiRes.length > 0) {
          const userName = String(getVal(user, "Nama") || "").toLowerCase();
          finalNilai = nilaiRes.filter(
            (n) =>
              String(getVal(n, "Nama_Siswa") || "").toLowerCase() === userName,
          );
        }

        setExams((prev) =>
          JSON.stringify(prev) !== JSON.stringify(finalJadwal)
            ? finalJadwal
            : prev,
        );
        setMyResults((prev) =>
          JSON.stringify(prev) !== JSON.stringify(finalNilai)
            ? finalNilai
            : prev,
        );
      } catch (err) {
        if (!isBackground) setErrorMsg("Gagal terhubung ke database.");
      } finally {
        if (!isBackground) setLoading(false);
      }
    };

    fetchData(false);
    const intervalId = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(intervalId);
  }, [user, userKelasFull, userTingkat, userJurusan, userTingkatJurusan]);

  // ==========================================
  // 2. FUNGSI MEMULAI UJIAN & CEK SESI
  // ==========================================
  const handleStartExam = async (exam) => {
    const examId = getVal(exam, "ID");
    const examToken = getVal(exam, "Token");
    const examMapel = getVal(exam, "Mapel");
    const examDurasi = parseInt(getVal(exam, "Durasi_Menit")) || 90;

    const inputToken = tokens[examId]?.toUpperCase() || "";
    const realToken = String(examToken || "").toUpperCase();

    if (realToken && !inputToken) {
      return showAlert(
        "warning",
        "Token Diperlukan",
        "Silakan masukkan TOKEN ujian terlebih dahulu!",
      );
    }
    if (realToken && inputToken !== realToken) {
      return showAlert(
        "danger",
        "Akses Ditolak",
        "TOKEN SALAH! Silakan periksa kembali token ujian Anda.",
      );
    }

    const sudahMengerjakan = myResults.some(
      (res) =>
        String(getVal(res, "Mapel")).toUpperCase() ===
        String(examMapel).toUpperCase(),
    );

    if (sudahMengerjakan) {
      return showAlert(
        "danger",
        "Akses Dibatasi",
        "Anda sudah menyelesaikan ujian ini. Nilai Anda sudah terekam di sistem.",
      );
    }

    setActiveExam(exam);
    setLoadingSoal(true);
    setRequireFullscreen(false);
    setIsMobileDrawerOpen(false);

    // Otomatis Fullscreen saat mulai
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem
        .requestFullscreen()
        .catch(() => console.log("Fullscreen otomatis tertunda"));
    }

    try {
      const allSoal = await api.read("Soal");
      const examMapelUpper = String(examMapel).toUpperCase();

      const filterSoal = allSoal.filter((s) => {
        const soalMapel = String(getVal(s, "Mapel")).toUpperCase();
        const soalKelasRaw = String(getVal(s, "Kelas")).toUpperCase();

        if (soalMapel !== examMapelUpper) return false;

        if (soalKelasRaw === "" || soalKelasRaw.includes("SEMUA")) return true;

        const targetArray = soalKelasRaw.split(",").map((t) => t.trim());
        const isMatch = targetArray.some((target) => {
          return (
            target === userKelasFull ||
            target === userTingkatJurusan ||
            target === userJurusan ||
            target === userTingkat
          );
        });

        return isMatch;
      });

      // Acak urutan soal
      const shuffledSoal = filterSoal.sort(() => Math.random() - 0.5);
      setSoalData(shuffledSoal);

      const sessionKey = `cbt_session_${getVal(user, "Username")}_${examId}`;
      const savedSession = JSON.parse(localStorage.getItem(sessionKey));

      if (savedSession && savedSession.timeLeft > 0) {
        setAnswers(savedSession.answers || {});
        setTimeLeft(savedSession.timeLeft);
        setCheatWarnings(savedSession.cheatWarnings || 0);
      } else {
        setAnswers({});
        setTimeLeft(examDurasi * 60);
        setCheatWarnings(0);
      }

      setCurrentSoalIndex(0);
    } catch (error) {
      showAlert(
        "danger",
        "Kesalahan Server",
        "Gagal memuat soal: " + error.message,
      );
      setActiveExam(null);
    } finally {
      setLoadingSoal(false);
    }
  };

  // ==========================================
  // 3. KALKULASI SKOR & SUBMIT
  // ==========================================
  const executeEndExam = async (isForced, isCheating) => {
    setIsSubmitting(true);

    let skorSiswa = 0;
    let benarCount = 0;
    let detailJawabanArray = [];

    const currentAnswers = answersRef.current;
    const currentSoalData = soalDataRef.current;
    const totalSoal = currentSoalData.length;

    currentSoalData.forEach((soal) => {
      const poin = parseFloat(getVal(soal, "Poin")) || 2;
      const idSoal = String(getVal(soal, "id")).trim();
      const jawabanSiswa = currentAnswers[idSoal] || "";
      const jawabanBenar = String(getVal(soal, "Jawaban_Benar"))
        .toUpperCase()
        .trim();

      if (
        jawabanSiswa &&
        String(jawabanSiswa).toUpperCase().trim() === jawabanBenar
      ) {
        skorSiswa += poin;
        benarCount++;
      }

      detailJawabanArray.push({
        tanya: getVal(soal, "Pertanyaan"),
        jawab_siswa: jawabanSiswa,
        kunci: jawabanBenar,
      });
    });

    let finalScore = Number(skorSiswa.toFixed(2));
    let salahCount = totalSoal - benarCount;

    try {
      if (document.fullscreenElement)
        document.exitFullscreen().catch((e) => console.log(e));

      const allNilai = (await api.read("Nilai")) || [];
      let maxId = 0;
      if (allNilai && allNilai.length > 0) {
        allNilai.forEach((n) => {
          const currentId = parseInt(getVal(n, "ID"));
          if (!isNaN(currentId) && currentId > maxId) maxId = currentId;
        });
      }
      const nextId = maxId + 1;

      await api.create("Nilai", {
        id: nextId,
        nama_siswa: getVal(user, "Nama"),
        kelas: getVal(user, "Kelas"),
        mapel: getVal(activeExamRef.current, "Mapel"),
        skor: finalScore,
        benar: benarCount,
        salah: salahCount,
        total_soal: totalSoal,
        status: isCheating ? "Diskualifikasi (Curang)" : "Selesai",
        detail_jawaban: JSON.stringify(detailJawabanArray),
      });

      const sessionKey = `cbt_session_${getVal(user, "Username")}_${getVal(activeExamRef.current, "ID")}`;
      localStorage.removeItem(sessionKey);

      setIsSubmitting(false);
      setActiveExam(null);
      setAnswers({});
      setCurrentSoalIndex(0);
      setCheatWarnings(0);
      setRequireFullscreen(false);
      setIsMobileDrawerOpen(false);
      setActiveTab("nilai");

      if (isCheating) {
        showAlert(
          "danger",
          "UJIAN DIHENTIKAN PAKSA!",
          "Jawaban Anda dikirim secara otomatis karena telah melanggar aturan.",
        );
      } else if (isForced) {
        showAlert(
          "info",
          "Waktu Habis!",
          "Waktu ujian Anda telah habis. Jawaban dikirim otomatis.",
        );
      } else {
        showAlert(
          "success",
          "Ujian Selesai",
          "Berhasil disubmit! Silakan periksa nilai Anda.",
        );
      }
    } catch (err) {
      showAlert(
        "danger",
        "Gagal Mengirim",
        "Terjadi kesalahan saat mengirim jawaban: " + err.message,
      );
      setIsSubmitting(false);
    }
  };

  const handleEndExamClick = (isForced = false, isCheating = false) => {
    if (isSubmittingRef.current) return;

    if (!isForced && !isCheating) {
      showAlert(
        "confirm",
        "Selesai Mengerjakan?",
        "Yakin ingin mengakhiri ujian? Jawaban yang sudah dikirim tidak dapat diubah lagi.",
        () => {
          closeAlert();
          executeEndExam(false, false);
        },
      );
    } else {
      executeEndExam(isForced, isCheating);
    }
  };

  // ==========================================
  // 4. LOGIKA TIMER & AUTO-SAVE LOKAL
  // ==========================================
  useEffect(() => {
    if (!activeExam || timeLeft <= 0 || isSubmitting) return;

    const timerId = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        const sessionKey = `cbt_session_${getVal(user, "Username")}_${getVal(activeExam, "ID")}`;
        localStorage.setItem(
          sessionKey,
          JSON.stringify({ answers, timeLeft: newTime, cheatWarnings }),
        );

        if (newTime <= 0) {
          clearInterval(timerId);
          handleEndExamClick(true, false);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [activeExam, timeLeft, isSubmitting, answers, cheatWarnings]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0)
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // ==========================================
  // 5. LOGIKA ANTI-CHEAT & FORCE FULLSCREEN
  // ==========================================
  const handleCheatDetected = useCallback(
    (reason) => {
      if (
        !activeExamRef.current ||
        isSubmittingRef.current ||
        isAlerting.current
      )
        return;
      isAlerting.current = true;

      setCheatWarnings((prev) => {
        const currentWarns = prev + 1;
        if (currentWarns >= MAX_CHEAT_WARNINGS) {
          closeAlert();
          showAlert(
            "danger",
            `PELANGGARAN FATAL (${currentWarns}/${MAX_CHEAT_WARNINGS})`,
            `Sistem Mendeteksi: ${reason}.\n\nBatas toleransi habis! Ujian Anda dihentikan paksa sekarang juga.`,
          );
          executeEndExam(true, true);
        } else {
          showAlert(
            "warning",
            `PERINGATAN KECURANGAN (${currentWarns}/${MAX_CHEAT_WARNINGS})`,
            `Sistem Mendeteksi: ${reason}.\n\nJangan ulangi! Jika melampaui batas toleransi, ujian akan dihentikan paksa.`,
          );
        }
        setTimeout(() => {
          isAlerting.current = false;
        }, 3000);
        return currentWarns;
      });
    },
    [showAlert],
  );

  useEffect(() => {
    if (!activeExam || isSubmitting) return;
    const outOfTabTimer = { current: null };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        outOfTabTimer.current = setTimeout(() => {
          executeEndExam(true, true);
          showAlert(
            "danger",
            "WAKTU HABIS DI LUAR UJIAN!",
            "Anda meninggalkan halaman lebih dari 5 detik. Ujian dikumpulkan paksa.",
          );
        }, 5000);
      } else {
        if (outOfTabTimer.current) {
          clearTimeout(outOfTabTimer.current);
          outOfTabTimer.current = null;
        }
        handleCheatDetected("Meninggalkan Aplikasi / Membuka Tab Lain");
      }
    };

    const handleBlur = () => {
      handleCheatDetected(
        "Layar tidak fokus (Membuka Notifikasi / Layar Belah)",
      );
    };

    const handleFullscreenChange = () => {
      if (
        !document.fullscreenElement &&
        activeExamRef.current &&
        !isSubmittingRef.current
      ) {
        setRequireFullscreen(true);
        handleCheatDetected("Keluar dari Mode Layar Penuh");
      }
    };

    const preventAction = (e) => e.preventDefault();
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "Yakin ingin keluar? Jawaban tidak akan tersimpan!";
    };

    const handleKeyDown = (e) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey &&
          e.shiftKey &&
          (e.key === "I" || e.key === "J" || e.key === "C")) ||
        (e.ctrlKey &&
          (e.key === "U" || e.key === "P" || e.key === "C" || e.key === "V")) ||
        (e.altKey && e.key === "Tab")
      ) {
        e.preventDefault();
        handleCheatDetected("Menggunakan Shortcut Keyboard Terlarang");
      }
    };

    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("contextmenu", preventAction);
    document.addEventListener("copy", preventAction);
    document.addEventListener("paste", preventAction);
    document.addEventListener("cut", preventAction);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      if (outOfTabTimer.current) clearTimeout(outOfTabTimer.current);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("contextmenu", preventAction);
      document.removeEventListener("copy", preventAction);
      document.removeEventListener("paste", preventAction);
      document.removeEventListener("cut", preventAction);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeExam, isSubmitting, handleCheatDetected]);

  const reenterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem
        .requestFullscreen()
        .then(() => setRequireFullscreen(false))
        .catch(() => {
          showAlert(
            "warning",
            "Gagal Fullscreen",
            "Silakan klik tombol kembali atau izinkan fullscreen di browser Anda.",
          );
        });
    }
  };

  // ==========================================
  // RENDER RUANG UJIAN (EXAM ENGINE)
  // ==========================================
  if (activeExam) {
    if (requireFullscreen) {
      return (
        <div className="fixed inset-0 bg-slate-900 z-[9999] flex flex-col items-center justify-center text-white px-6 text-center">
          <AlertTriangle
            size={80}
            className="text-amber-500 mb-6 animate-pulse drop-shadow-lg"
          />
          <h2 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">
            Layar Penuh Terputus!
          </h2>
          <p className="text-slate-300 text-sm md:text-base mb-10 max-w-lg leading-relaxed">
            Ujian ini mewajibkan mode layar penuh untuk mencegah kecurangan.
            Sistem telah mencatat aktivitas ini sebagai peringatan.
          </p>
          <button
            onClick={reenterFullscreen}
            className="flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black py-4 px-8 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 uppercase tracking-widest"
          >
            <Maximize size={20} /> Lanjutkan Ujian
          </button>
        </div>
      );
    }

    const examMapel = getVal(activeExam, "Mapel");
    const currentSoal = soalData[currentSoalIndex];

    if (!currentSoal) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 flex-col">
          <ShieldAlert size={64} className="text-red-500 mb-4" />
          <h2 className="text-xl font-bold">Soal Belum Tersedia!</h2>
          <p className="text-slate-500 mt-2 mb-6 text-center max-w-md">
            Guru belum mengunggah soal untuk ujian ini atau salah memberikan tag
            kelas. Harap lapor ke Pengawas.
          </p>
          <button
            onClick={() => {
              setActiveExam(null);
              setRequireFullscreen(false);
            }}
            className="px-6 py-3 bg-slate-800 text-white rounded-lg font-bold"
          >
            Kembali ke Beranda
          </button>
        </div>
      );
    }

    const currentSoalId = String(getVal(currentSoal, "id")).trim();
    const answeredCount = Object.keys(answers).length;
    const progressPercent =
      soalData.length > 0 ? (answeredCount / soalData.length) * 100 : 0;

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none relative overflow-hidden">
        <style type="text/css">{`
          @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
          .animate-blob { animation: blob 7s infinite; } .animation-delay-2000 { animation-delay: 2s; } .animation-delay-4000 { animation-delay: 4s; }
          .exam-ambient-bg { background: linear-gradient(135deg, #f8fafc, #f1f5f9, #e2e8f0); }
        `}</style>

        <div className="absolute inset-0 exam-ambient-bg z-0"></div>
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob z-0"></div>
        <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-teal-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000 z-0"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-slate-300/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000 z-0"></div>

        <header className="bg-white/70 backdrop-blur-xl border-b border-white/50 sticky top-0 z-50 shadow-sm px-4 py-3 flex justify-between items-center relative">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl shadow-md hidden md:block">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-black text-slate-800 uppercase tracking-tighter leading-tight">
                {examMapel}
              </h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">
                {getVal(user, "Nama")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {cheatWarnings > 0 && (
              <div className="hidden md:flex items-center gap-1.5 bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-[10px] font-black border border-red-200 animate-pulse shadow-sm">
                <ShieldAlert size={14} /> PELANGGARAN: {cheatWarnings}/
                {MAX_CHEAT_WARNINGS}
              </div>
            )}
            <div
              className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border shadow-sm backdrop-blur-md transition-colors ${timeLeft < 300 ? "bg-red-50 text-red-600 border-red-200 animate-pulse" : "bg-slate-800/90 text-white border-slate-700"}`}
            >
              <Timer size={18} />
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase tracking-widest leading-none mb-[2px] opacity-80">
                  Sisa Waktu
                </span>
                <span className="font-black text-sm md:text-base leading-none tracking-wider">
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* MENGUBAH STRUKTUR LAYOUT UTAMA AGAR LEBIH BERSAHABAT DI MOBILE */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-2 md:p-5 flex flex-col justify-center animate-fade-in z-10 relative pb-20 lg:pb-5">
          {loadingSoal ? (
            <div className="flex flex-col items-center justify-center h-full m-auto">
              <RefreshCw
                className="animate-spin text-emerald-500 mb-4"
                size={48}
              />
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
                Menyiapkan Naskah Soal...
              </h2>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full h-[calc(100vh-140px)] lg:h-[calc(100vh-120px)] min-h-[500px]">
              {/* KIRI: SOAL (Flexible Content) */}
              <div className="flex-1 flex flex-col h-full bg-white/80 backdrop-blur-2xl border border-white rounded-[1.5rem] lg:rounded-[2rem] shadow-xl overflow-hidden relative">
                <div className="px-5 lg:px-6 py-3 lg:py-4 border-b border-slate-200/60 bg-white/40 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <span className="bg-slate-800 text-white font-black px-3 py-1.5 lg:px-4 rounded-lg text-xs lg:text-sm shadow-md">
                      SOAL NO. {currentSoalIndex + 1}
                    </span>
                    {getVal(currentSoal, "Poin") && (
                      <span className="bg-emerald-100 text-emerald-700 font-bold px-2 py-1.5 lg:px-3 rounded-lg text-[10px] lg:text-xs border border-emerald-200">
                        {getVal(currentSoal, "Poin")} POIN
                      </span>
                    )}
                  </div>
                  {isSubmitting && (
                    <span className="text-xs font-bold text-emerald-600 animate-pulse flex items-center gap-2">
                      <RefreshCw size={14} className="animate-spin" />{" "}
                      <span className="hidden sm:inline">Mengirim...</span>
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8 flex flex-col">
                  {getVal(currentSoal, "Wacana") && (
                    <div className="p-4 lg:p-5 bg-amber-50/70 border border-amber-200/80 rounded-2xl relative shadow-sm mb-4 lg:mb-6 mt-1">
                      <div className="absolute -top-3 left-4 lg:left-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-2 py-1 lg:px-3 rounded-md text-[9px] lg:text-[10px] font-bold uppercase tracking-widest shadow-md">
                        Informasi Teks
                      </div>
                      <p className="font-medium text-slate-700 leading-relaxed text-[13px] md:text-[15px] whitespace-pre-wrap mt-1">
                        {getVal(currentSoal, "Wacana")}
                      </p>
                    </div>
                  )}

                  <p className="font-bold text-slate-800 leading-relaxed text-sm md:text-lg mb-5 lg:mb-6 whitespace-pre-wrap flex-1">
                    {getVal(currentSoal, "Pertanyaan")}
                  </p>

                  {getVal(currentSoal, "Link_Gambar") && (
                    <div className="mb-5 lg:mb-6 w-full flex justify-start">
                      <div
                        onClick={() =>
                          setZoomedImg(getVal(currentSoal, "Link_Gambar"))
                        }
                        className="relative group cursor-pointer rounded-2xl border border-slate-200 shadow-sm bg-white p-1.5 inline-block w-fit max-w-full"
                        title="Klik untuk memperbesar gambar"
                      >
                        <img
                          src={getVal(currentSoal, "Link_Gambar")}
                          alt="Gambar Pendukung"
                          className="max-w-full h-auto max-h-[35vh] lg:max-h-[50vh] object-contain rounded-xl"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                          <span className="text-white font-bold bg-slate-900/80 px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg backdrop-blur-sm text-xs">
                            <Maximize size={16} /> Klik Perbesar
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2.5 lg:gap-3 mt-auto pb-2">
                    {["A", "B", "C", "D", "E"].map((opt) => {
                      const optText = getVal(currentSoal, `Opsi_${opt}`);
                      if (!optText) return null;
                      const isSelected = answers[currentSoalId] === opt;

                      return (
                        <button
                          key={opt}
                          onClick={() =>
                            setAnswers({ ...answers, [currentSoalId]: opt })
                          }
                          className={`w-full text-left px-4 py-3 md:px-5 md:py-4 rounded-[1.25rem] border-2 transition-all flex items-start gap-3 lg:gap-4 group ${isSelected ? "border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-500/20" : "border-slate-100 bg-white/60 hover:bg-white hover:border-emerald-300"}`}
                        >
                          <span
                            className={`font-black text-xs md:text-base w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-[0.6rem] shrink-0 transition-all ${isSelected ? "bg-emerald-500 text-white shadow-md scale-110" : "bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-700"}`}
                          >
                            {opt}
                          </span>
                          <span
                            className={`text-[13px] md:text-base font-medium pt-1 md:pt-1.5 leading-snug whitespace-pre-wrap ${isSelected ? "text-emerald-900 font-bold" : "text-slate-700"}`}
                          >
                            {optText}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* DESKTOP NAVIGASI BAWAH (HIDDEN DI MOBILE) */}
                <div className="hidden lg:flex px-6 py-4 border-t border-slate-200/60 bg-white/40 justify-between items-center shrink-0">
                  <button
                    onClick={() =>
                      setCurrentSoalIndex((prev) => Math.max(0, prev - 1))
                    }
                    disabled={currentSoalIndex === 0}
                    className="px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-50 disabled:opacity-40 flex items-center gap-2 shadow-sm"
                  >
                    <ArrowLeft size={16} /> Sebelumnya
                  </button>
                  <button
                    onClick={() =>
                      setCurrentSoalIndex((prev) =>
                        Math.min(soalData.length - 1, prev + 1),
                      )
                    }
                    disabled={currentSoalIndex === soalData.length - 1}
                    className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-bold shadow-lg uppercase tracking-widest text-xs flex items-center gap-2 disabled:opacity-40 hover:scale-105 transition-transform"
                  >
                    Selanjutnya <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              {/* KANAN: NAVIGASI NOMOR GRID (HANYA MUNCUL DI DESKTOP) */}
              <div className="hidden lg:flex w-[320px] xl:w-[380px] flex-col h-full bg-white/80 backdrop-blur-2xl border border-white rounded-[2rem] shadow-xl overflow-hidden shrink-0">
                <div className="p-6 border-b border-slate-200/60 bg-white/40 shrink-0">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-black uppercase text-slate-500 tracking-widest">
                      Progress
                    </span>
                    <span className="text-sm font-black text-emerald-600">
                      {Math.round(progressPercent)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full transition-all duration-500 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 mt-2 text-center uppercase tracking-widest">
                    Terjawab {answeredCount} dari {soalData.length} Soal
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 content-start">
                  <div className="grid grid-cols-5 gap-2.5">
                    {soalData.map((s, idx) => {
                      const isCurrent = idx === currentSoalIndex;
                      const sId = String(getVal(s, "id")).trim();
                      const hasAnswered = !!answers[sId];

                      return (
                        <button
                          key={idx}
                          onClick={() => setCurrentSoalIndex(idx)}
                          className={`aspect-square flex items-center justify-center rounded-xl font-bold text-sm transition-all border-2 
                            ${isCurrent ? "scale-110 shadow-lg ring-4 ring-slate-800/10 z-10 border-slate-800" : "hover:scale-105 border-transparent"} 
                            ${hasAnswered ? (isCurrent ? "bg-emerald-500 text-white" : "bg-emerald-500 text-white shadow-md border-emerald-600") : isCurrent ? "bg-slate-800 text-white" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 shadow-sm"}
                          `}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-5 border-t border-slate-200/60 bg-white/40 shrink-0">
                  <button
                    onClick={() => handleEndExamClick(false, false)}
                    disabled={isSubmitting}
                    className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-xl shadow-xl active:scale-95 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <RefreshCw size={20} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={20} />
                    )}{" "}
                    {isSubmitting ? "Menyimpan..." : "Kumpulkan Ujian"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* BOTTOM ACTION BAR KHUSUS MOBILE (STICKY) */}
        {!loadingSoal && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 p-3 px-4 flex justify-between items-center z-40 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.15)] pb-6 sm:pb-4">
            <button
              onClick={() =>
                setCurrentSoalIndex((prev) => Math.max(0, prev - 1))
              }
              disabled={currentSoalIndex === 0}
              className="p-3.5 bg-slate-100 text-slate-600 rounded-xl disabled:opacity-30 active:scale-95 transition-all shadow-sm border border-slate-200"
            >
              <ArrowLeft size={20} />
            </button>

            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="flex flex-col items-center justify-center text-slate-700 group -mt-1 active:scale-95 transition-all"
            >
              <div className="bg-emerald-100 text-emerald-700 p-2.5 rounded-[14px] mb-1 shadow-sm border border-emerald-200">
                <LayoutDashboard size={22} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                {answeredCount}/{soalData.length} Dijawab
              </span>
            </button>

            <button
              onClick={() =>
                setCurrentSoalIndex((prev) =>
                  Math.min(soalData.length - 1, prev + 1),
                )
              }
              disabled={currentSoalIndex === soalData.length - 1}
              className="p-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl shadow-md disabled:opacity-30 active:scale-95 transition-all"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        )}

        {/* LACI (DRAWER) NAVIGASI GRID KHUSUS MOBILE */}
        <AnimatePresence>
          {isMobileDrawerOpen && (
            <>
              {/* Overlay Hitam */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileDrawerOpen(false)}
                className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
              />
              {/* Box Putih Meluncur ke Atas */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 26, stiffness: 220 }}
                className="lg:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-[2rem] z-[101] flex flex-col max-h-[85vh] shadow-2xl"
              >
                <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                  <div>
                    <h3 className="font-black text-slate-800 text-lg tracking-tight">
                      Navigasi Soal
                    </h3>
                    <p className="text-[11px] font-bold text-emerald-600 mt-0.5 uppercase tracking-widest">
                      Progress Pengerjaan: {Math.round(progressPercent)}%
                    </p>
                  </div>
                  <button
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="p-2 bg-slate-100 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
                  <div className="grid grid-cols-5 sm:grid-cols-7 gap-3">
                    {soalData.map((s, idx) => {
                      const isCurrent = idx === currentSoalIndex;
                      const sId = String(getVal(s, "id")).trim();
                      const hasAnswered = !!answers[sId];

                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setCurrentSoalIndex(idx);
                            setIsMobileDrawerOpen(false); // Tutup drawer setelah memilih soal
                          }}
                          className={`aspect-square flex items-center justify-center rounded-[1rem] font-bold text-sm transition-all border-2 
                            ${isCurrent ? "scale-110 shadow-md ring-2 ring-emerald-500/30 z-10 border-emerald-500" : "border-slate-100"} 
                            ${hasAnswered ? (isCurrent ? "bg-emerald-500 text-white" : "bg-emerald-50 text-emerald-600 border-emerald-200") : isCurrent ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-400 shadow-sm"}
                          `}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-5 border-t border-slate-100 bg-slate-50 rounded-t-3xl shrink-0 pb-6 sm:pb-4 shadow-[0_-5px_15px_-10px_rgba(0,0,0,0.1)]">
                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      handleEndExamClick(false, false);
                    }}
                    disabled={isSubmitting}
                    className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <RefreshCw size={20} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={20} />
                    )}
                    Kumpulkan Ujian Sekarang
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* OVERLAY LAYAR PENUH UNTUK ZOOM GAMBAR */}
        <AnimatePresence>
          {zoomedImg && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setZoomedImg(null)}
              className="fixed inset-0 z-[999999] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 md:p-10 cursor-zoom-out"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomedImg(null);
                }}
                className="absolute top-6 right-6 text-white bg-slate-800/50 hover:bg-red-500 p-2 rounded-full transition-colors z-10 shadow-lg"
              >
                <X size={28} />
              </button>
              <img
                src={zoomedImg}
                alt="Zoomed"
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {customAlert.isOpen && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className="w-full max-w-md p-8 shadow-2xl border border-white/20 rounded-[2rem] bg-white/95 backdrop-blur-xl text-center flex flex-col items-center">
                  <div
                    className={`p-4 rounded-2xl mb-5 shadow-inner ${customAlert.type === "danger" || customAlert.type === "confirm" ? "bg-red-50 text-red-500" : customAlert.type === "warning" ? "bg-amber-50 text-amber-500" : customAlert.type === "success" ? "bg-emerald-50 text-emerald-500" : "bg-blue-50 text-blue-500"}`}
                  >
                    {customAlert.type === "success" ? (
                      <CheckCircle2 size={48} />
                    ) : customAlert.type === "info" ? (
                      <Info size={48} />
                    ) : (
                      <AlertTriangle size={48} />
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-3 leading-tight">
                    {customAlert.title}
                  </h3>
                  <p className="text-sm text-slate-600 mb-8 font-medium px-2 leading-relaxed whitespace-pre-wrap">
                    {customAlert.message}
                  </p>
                  <div className="flex gap-3 w-full">
                    {customAlert.type === "confirm" ? (
                      <>
                        <button
                          onClick={closeAlert}
                          className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors text-sm uppercase tracking-widest"
                        >
                          Batal
                        </button>
                        <button
                          onClick={
                            customAlert.onConfirm
                              ? customAlert.onConfirm
                              : closeAlert
                          }
                          className="flex-1 py-3.5 rounded-xl font-bold text-white shadow-lg transition-all text-sm uppercase tracking-widest bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600"
                        >
                          Ya, Kumpulkan
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={closeAlert}
                        className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg text-sm uppercase tracking-widest transition-all ${customAlert.type === "danger" ? "bg-gradient-to-r from-red-500 to-red-600" : "bg-gradient-to-r from-emerald-500 to-emerald-600"}`}
                      >
                        Mengerti
                      </button>
                    )}
                  </div>
                </Card>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ==========================================
  // RENDER LOBBY & HASIL UJIAN (DEFAULT VIEW)
  // ==========================================
  return (
    <Dashboard
      menu={[
        { id: "home", label: "Portal Ujian", icon: LayoutDashboard },
        { id: "nilai", label: "Hasil Ujian", icon: BarChart3 },
      ]}
      active={activeTab}
      setActive={setActiveTab}
    >
      <style type="text/css">{`
        @keyframes gradientBG { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .header-live-bg { background: linear-gradient(-45deg, #d1fae5, #fef3c7, #ecfdf5, #f0fdfa); background-size: 400% 400%; animation: gradientBG 15s ease infinite; }
        @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
        .animate-blob { animation: blob 7s infinite; } .animation-delay-2000 { animation-delay: 2s; } .animation-delay-4000 { animation-delay: 4s; }
      `}</style>

      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 z-0 pointer-events-none"></div>
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob z-0 pointer-events-none"></div>
      <div className="fixed top-[20%] right-[-10%] w-[400px] h-[400px] bg-teal-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000 z-0 pointer-events-none"></div>
      <div className="fixed bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-blue-100/60 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000 z-0 pointer-events-none"></div>

      {activeTab === "home" && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto space-y-6 pb-24 relative z-10"
        >
          <motion.header
            variants={fadeUp}
            className="relative flex flex-col md:flex-row justify-between items-start md:items-center p-6 md:p-8 rounded-[2rem] shadow-sm border border-emerald-100/50 gap-4 overflow-hidden header-live-bg z-0"
          >
            <motion.div
              animate={{
                x: [0, 60, -30, 0],
                y: [0, -40, 50, 0],
                rotate: [0, 180, 360],
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute -top-20 -left-10 w-72 h-72 bg-white/40 rounded-[40%] backdrop-blur-md -z-10"
            />
            <motion.div
              animate={{
                x: [0, -50, 40, 0],
                y: [0, 60, -20, 0],
                rotate: [360, 180, 0],
              }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-20 right-10 w-80 h-80 bg-emerald-100/40 rounded-[35%] backdrop-blur-md -z-10"
            />

            <div className="z-10">
              <h2 className="text-3xl md:text-4xl font-black mb-1.5 tracking-tighter text-slate-800 drop-shadow-sm">
                Halo, {getVal(user, "Nama")?.split(" ")[0] || "Siswa"}!
              </h2>
              <p className="text-slate-600 font-bold flex items-center gap-2 text-sm">
                <Sparkles size={16} className="text-emerald-500" /> Pilih jadwal
                ujian di bawah untuk memulai.
              </p>
            </div>

            <div className="z-10 bg-white/80 px-6 py-3 rounded-2xl border border-white/60 text-center backdrop-blur-sm shadow-sm w-full md:w-auto">
              <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-0.5">
                Kelas Anda
              </p>
              <p className="font-black text-xl text-slate-800 leading-none">
                {userKelasFull || "-"}
              </p>
            </div>
          </motion.header>

          <motion.div variants={fadeUp} className="space-y-4">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2.5 px-2 uppercase tracking-tight">
              <ClipboardCheck className="text-emerald-600" size={20} /> Daftar
              Ujian Tersedia
            </h3>

            {loading ? (
              <div className="py-16 text-center bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                <RefreshCw
                  className="animate-spin mx-auto text-emerald-500 mb-3"
                  size={28}
                />
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Mencari Jadwal...
                </p>
              </div>
            ) : errorMsg ? (
              <div className="p-6 text-center bg-red-50 rounded-[2rem] border border-red-100 text-red-600 font-bold shadow-sm text-sm">
                {errorMsg}
              </div>
            ) : exams.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center">
                <Calendar size={40} className="text-slate-200 mb-3" />
                <p className="text-slate-500 font-bold text-base">
                  Belum ada jadwal ujian untuk kelasmu saat ini.
                </p>
              </div>
            ) : (
              exams.map((ex) => {
                const examId = getVal(ex, "ID");
                const examMapel = getVal(ex, "Mapel") || "Ujian";
                const examStatusRaw = getVal(ex, "Status") || "TUTUP";
                const isAktif = String(examStatusRaw).toUpperCase() === "AKTIF";

                return (
                  <Card
                    key={examId || examMapel}
                    className={`p-5 flex flex-col md:flex-row items-center justify-between gap-5 border-l-[8px] rounded-[1.5rem] transition-all hover:shadow-lg hover:-translate-y-1 ${isAktif ? "border-l-emerald-500" : "border-l-slate-200 opacity-80"}`}
                  >
                    <div className="flex-1 text-center md:text-left w-full">
                      <Badge type={isAktif ? "Aktif" : examStatusRaw} />
                      <h4 className="text-xl font-black text-slate-900 mt-2 uppercase tracking-tight">
                        {examMapel}
                      </h4>
                      <div className="flex justify-center md:justify-start gap-3 mt-3 text-[11px] font-bold text-slate-500">
                        <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                          <Clock size={12} className="text-emerald-500" />{" "}
                          {getVal(ex, "Durasi_Menit") || "90"} Menit
                        </span>
                        <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                          <Calendar size={12} className="text-amber-500" />{" "}
                          {formatTanggalLokal(getVal(ex, "Tanggal"))}
                        </span>
                      </div>
                    </div>

                    {isAktif ? (
                      <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                        <input
                          type="text"
                          value={tokens[examId] || ""}
                          onChange={(e) =>
                            setTokens({ ...tokens, [examId]: e.target.value })
                          }
                          className="w-full md:w-36 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-black tracking-widest uppercase outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 text-sm"
                          placeholder="TOKEN"
                        />
                        <button
                          onClick={() => handleStartExam(ex)}
                          className="w-full md:w-auto bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 text-white font-black px-6 py-3.5 rounded-xl shadow-md active:scale-95 transition-all uppercase tracking-widest text-sm"
                        >
                          MULAI
                        </button>
                      </div>
                    ) : (
                      <div className="w-full md:w-auto bg-slate-100 text-slate-400 font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest text-[11px]">
                        <Lock size={14} /> {examStatusRaw}
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </motion.div>
        </motion.div>
      )}

      {activeTab === "nilai" && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto space-y-6 pb-24 relative z-10"
        >
          <motion.div
            variants={fadeUp}
            className="flex items-center justify-between px-2 mb-2"
          >
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2.5">
                <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                  <Award size={20} />
                </div>{" "}
                Riwayat Nilai
              </h2>
              <p className="text-xs font-bold text-slate-400 mt-1">
                Evaluasi pencapaian hasil belajarmu di sini.
              </p>
            </div>
          </motion.div>

          {loading ? (
            <motion.div
              variants={fadeUp}
              className="py-16 text-center bg-white rounded-[2rem] shadow-sm border border-slate-100"
            >
              <RefreshCw
                className="animate-spin mx-auto text-emerald-500 mb-3"
                size={28}
              />
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Menarik Data Nilai...
              </p>
            </motion.div>
          ) : myResults.length === 0 ? (
            <motion.div
              variants={fadeUp}
              className="p-12 text-center bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center"
            >
              <Target size={40} className="text-slate-200 mb-3" />
              <h3 className="text-base font-black text-slate-700">
                Belum Ada Riwayat Ujian
              </h3>
              <p className="text-slate-500 font-medium text-sm mt-1">
                Nilai kamu akan muncul di sini setelah menyelesaikan ujian.
              </p>
            </motion.div>
          ) : (
            <motion.div
              variants={fadeUp}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {myResults.map((res, idx) => {
                const mapel = getVal(res, "Mapel") || "Ujian";
                const skor = parseFloat(getVal(res, "Skor")) || 0;
                const status = getVal(res, "Status") || "Selesai";
                const isDiskualifikasi = status
                  .toLowerCase()
                  .includes("diskualifikasi");
                const benarCount = getVal(res, "Benar");
                const salahCount = getVal(res, "Salah");
                const totalCount = getVal(res, "Total_Soal");

                return (
                  <Card
                    key={idx}
                    className={`p-5 flex flex-col rounded-[1.5rem] relative overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all border ${isDiskualifikasi ? "border-red-200 bg-red-50/50" : "border-slate-100 bg-white"}`}
                  >
                    <div className="flex justify-between items-start mb-5 relative z-10">
                      <div className="bg-slate-50 px-2.5 py-1 rounded-md text-[10px] font-black uppercase text-slate-500 tracking-widest border border-slate-200">
                        {mapel}
                      </div>
                      <Badge type={isDiskualifikasi ? "Draft" : status} />
                    </div>

                    <div className="mt-auto relative z-10 flex flex-col">
                      <div className="flex items-end gap-2 mb-4">
                        <span
                          className={`text-5xl font-black tracking-tighter leading-none ${isDiskualifikasi ? "text-red-600" : "text-emerald-500"}`}
                        >
                          {skor}
                        </span>
                        <span className="text-xs font-bold text-slate-400 pb-1.5 uppercase tracking-widest">
                          Poin
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-2 pt-4 border-t border-slate-100">
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-center">
                          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                            Total Soal
                          </p>
                          <p className="text-lg font-black text-slate-700">
                            {totalCount !== "" ? totalCount : "-"}
                          </p>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2 text-center">
                          <p className="text-[9px] font-black uppercase text-emerald-600/80 tracking-widest">
                            Benar
                          </p>
                          <p className="text-lg font-black text-emerald-600">
                            {benarCount !== "" ? benarCount : "-"}
                          </p>
                        </div>
                        <div className="bg-red-50 border border-red-100 rounded-xl p-2 text-center">
                          <p className="text-[9px] font-black uppercase text-red-500/80 tracking-widest">
                            Salah/Kosong
                          </p>
                          <p className="text-lg font-black text-red-500">
                            {salahCount !== "" ? salahCount : "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </motion.div>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {customAlert.isOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="w-full max-w-sm p-8 shadow-2xl border border-white/20 rounded-[2rem] bg-white/95 backdrop-blur-xl text-center flex flex-col items-center">
                <div
                  className={`p-4 rounded-2xl mb-4 ${customAlert.type === "danger" || customAlert.type === "confirm" ? "bg-red-50 text-red-500" : customAlert.type === "warning" ? "bg-amber-50 text-amber-500" : customAlert.type === "success" ? "bg-emerald-50 text-emerald-500" : "bg-blue-50 text-blue-500"}`}
                >
                  {customAlert.type === "success" ? (
                    <CheckCircle2 size={40} />
                  ) : customAlert.type === "info" ? (
                    <Info size={40} />
                  ) : (
                    <AlertTriangle size={40} />
                  )}
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2 leading-tight">
                  {customAlert.title}
                </h3>
                <p className="text-sm text-slate-500 mb-6 font-medium px-2 leading-relaxed whitespace-pre-wrap">
                  {customAlert.message}
                </p>
                <div className="flex gap-3 w-full">
                  {customAlert.type === "confirm" ? (
                    <>
                      <button
                        onClick={closeAlert}
                        className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors text-sm uppercase tracking-widest"
                      >
                        Batal
                      </button>
                      <button
                        onClick={
                          customAlert.onConfirm
                            ? customAlert.onConfirm
                            : closeAlert
                        }
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-all text-sm uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30`}
                      >
                        Ya, Lanjutkan
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={closeAlert}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg text-sm uppercase tracking-widest transition-all ${customAlert.type === "danger" ? "bg-red-500 hover:bg-red-600 shadow-red-500/30" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30"}`}
                    >
                      Mengerti
                    </button>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Dashboard>
  );
};

export default SiswaDashboard;
