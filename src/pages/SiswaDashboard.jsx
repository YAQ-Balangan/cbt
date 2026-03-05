// src/pages/SiswaDashboard.jsx
import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react";
import {
  LayoutDashboard,
  BarChart3,
  Clock,
  Calendar,
  ArrowRight,
  ArrowLeft,
  ClipboardCheck,
  RefreshCw,
  AlertCircle,
  Timer,
  CheckCircle2,
  BookOpen,
  Lock,
  Award,
  Target,
  ShieldAlert,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { api } from "../api/api";
import Dashboard from "../components/layout/Dashboard";
import { Card, Badge } from "../components/ui/Ui";

const getVal = (obj, keyName) => {
  if (!obj) return "";
  if (obj[keyName] !== undefined && obj[keyName] !== "") return obj[keyName];
  const lowerKey = keyName.toLowerCase();
  const foundKey = Object.keys(obj).find((k) => k.toLowerCase() === lowerKey);
  return foundKey ? obj[foundKey] : "";
};

const KKM_SCORE = 75;
const MAX_CHEAT_WARNINGS = 3; // 🔴 Maksimal 3x curang, ke-4 langsung diusir

const SiswaDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("home");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [exams, setExams] = useState([]);
  const [myResults, setMyResults] = useState([]);

  // ==========================================
  // 🟢 STATE MESIN UJIAN (EXAM ENGINE)
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

  // 🌟 REFS UNTUK MENCEGAH BUG CLOSURE PADA TIMER
  const activeExamRef = useRef(activeExam);
  const answersRef = useRef(answers);
  const soalDataRef = useRef(soalData);
  const isSubmittingRef = useRef(isSubmitting);
  const isAlerting = useRef(false);

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

  const userKelas = String(getVal(user, "Kelas") || "").toUpperCase();
  const isMipaUser = userKelas.includes("MIPA") || userKelas.includes("IPA");
  const isIpsUser = userKelas.includes("IPS");

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
            const jadwalKelas = String(getVal(j, "Kelas") || "").toUpperCase();
            const mapel = String(getVal(j, "Mapel") || "").toUpperCase();

            let isKelasMatch = false;
            if (jadwalKelas.includes("SEMUA") || jadwalKelas === "")
              isKelasMatch = true;
            else if (jadwalKelas.includes("MIPA") && isMipaUser)
              isKelasMatch = true;
            else if (jadwalKelas.includes("IPS") && isIpsUser)
              isKelasMatch = true;
            else if (
              userKelas.includes(jadwalKelas) ||
              jadwalKelas.includes(userKelas)
            )
              isKelasMatch = true;
            else if (jadwalKelas === "XII" && userKelas.includes("XII"))
              isKelasMatch = true;
            else if (jadwalKelas === "XI" && userKelas.includes("XI"))
              isKelasMatch = true;
            else if (
              jadwalKelas === "X" &&
              userKelas.includes("X") &&
              !userKelas.includes("XI")
            )
              isKelasMatch = true;

            if (!isKelasMatch) return false;
            if (isMipaUser) {
              if (mapel === "BAHASA INDONESIA") return false;
              if (mapel === "EKONOMI" || mapel.includes("(IPS)")) return false;
            }
            if (isIpsUser) {
              if (mapel.includes("(IPA)") || mapel.includes("(MIPA)"))
                return false;
            }
            return true;
          });
          finalJadwal =
            filteredJadwal.length === 0 && jadwalRes.length > 0
              ? jadwalRes
              : filteredJadwal;
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
  }, [user, userKelas, isMipaUser, isIpsUser]);

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

    if (!inputToken) return alert("Silakan masukkan TOKEN terlebih dahulu!");
    if (inputToken !== realToken)
      return alert("❌ TOKEN SALAH! Silakan cek kembali token ujian Anda.");

    setActiveExam(exam);
    setLoadingSoal(true);

    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem
        .requestFullscreen()
        .catch(() => console.log("Fullscreen auto diblokir browser"));
    }

    try {
      const allSoal = await api.read("Soal");
      const examMapelUpper = String(examMapel).toUpperCase();

      const filterSoal = allSoal.filter((s) => {
        const soalMapel = String(getVal(s, "Mapel")).toUpperCase();
        const soalKelas = String(getVal(s, "Kelas")).toUpperCase();

        if (soalMapel !== examMapelUpper) return false;
        if (soalKelas.includes("SEMUA") || soalKelas === "") return true;
        if (soalKelas.includes("MIPA") && isMipaUser) return true;
        if (soalKelas.includes("IPS") && isIpsUser) return true;
        if (userKelas.includes(soalKelas) || soalKelas.includes(userKelas))
          return true;
        if (soalKelas === "XII" && userKelas.includes("XII")) return true;
        if (soalKelas === "XI" && userKelas.includes("XI")) return true;
        if (
          soalKelas === "X" &&
          userKelas.includes("X") &&
          !userKelas.includes("XI")
        )
          return true;
        return false;
      });

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
      alert("❌ Gagal memuat soal: " + error.message);
      setActiveExam(null);
    } finally {
      setLoadingSoal(false);
    }
  };

  // ==========================================
  // 3. KALKULASI SKOR & SUBMIT KE DATABASE
  // ==========================================
  const handleEndExam = async (isForced = false, isCheating = false) => {
    if (isSubmittingRef.current) return;
    if (
      !isForced &&
      !window.confirm(
        "Yakin ingin mengakhiri ujian? Jawaban yang sudah dikirim tidak bisa diubah lagi!",
      )
    )
      return;

    setIsSubmitting(true);

    let totalPoinDiperoleh = 0;
    let totalPoinMaksimal = 0;

    // Tarik referensi data terbaru agar tidak terjadi bug saat di force submit
    const currentAnswers = answersRef.current;
    const currentSoalData = soalDataRef.current;

    currentSoalData.forEach((soal) => {
      const poin = parseFloat(getVal(soal, "Poin")) || 2;
      totalPoinMaksimal += poin;

      const jawabanSiswa = currentAnswers[getVal(soal, "id")];
      const jawabanBenar = String(getVal(soal, "Jawaban_Benar")).toUpperCase();

      if (jawabanSiswa === jawabanBenar) {
        totalPoinDiperoleh += poin;
      }
    });

    // 🌟 THE MAGIC: Jika curang, NILAI TIDAK NOL, tapi seadanya yang terjawab
    let finalScore =
      totalPoinMaksimal > 0
        ? (totalPoinDiperoleh / totalPoinMaksimal) * 100
        : 0;
    finalScore = Math.round(finalScore);

    try {
      if (document.fullscreenElement)
        document.exitFullscreen().catch((e) => console.log(e));

      // BACA DATABASE MENCARI ID TERAKHIR LALU + 1
      const allNilai = (await api.read("Nilai")) || [];
      let maxId = 0;
      if (allNilai && allNilai.length > 0) {
        allNilai.forEach((n) => {
          const currentId = parseInt(getVal(n, "ID"));
          if (!isNaN(currentId) && currentId > maxId) {
            maxId = currentId;
          }
        });
      }
      const nextId = maxId + 1;

      // POST NILAI
      await api.create("Nilai", {
        id: nextId,
        nama_siswa: getVal(user, "Nama"),
        kelas: getVal(user, "Kelas"),
        mapel: getVal(activeExamRef.current, "Mapel"),
        skor: finalScore,
        status: isCheating ? "Diskualifikasi (Curang)" : "Selesai",
      });

      // BERSIHKAN LOCALSTORAGE
      const sessionKey = `cbt_session_${getVal(user, "Username")}_${getVal(activeExamRef.current, "ID")}`;
      localStorage.removeItem(sessionKey);

      // Hapus status sedang submit agar jika ujian lagi tidak nge-bug
      setIsSubmitting(false);

      if (isCheating)
        alert(
          "⛔ UJIAN DIHENTIKAN PAKSA!\nJawaban Anda dikirim secara otomatis seadanya karena telah melanggar aturan.",
        );
      else if (isForced)
        alert("Waktu habis! Jawaban Anda telah dikirim otomatis.");
      else
        alert("✅ Ujian berhasil disubmit! Silakan periksa menu Hasil Ujian.");

      setActiveExam(null);
      setAnswers({});
      setCurrentSoalIndex(0);
      setCheatWarnings(0);
      setActiveTab("nilai");
    } catch (err) {
      alert("❌ Terjadi kesalahan saat mengirim jawaban: " + err.message);
      setIsSubmitting(false);
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
          JSON.stringify({
            answers,
            timeLeft: newTime,
            cheatWarnings,
          }),
        );

        if (newTime <= 0) {
          clearInterval(timerId);
          handleEndExam(true, false);
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
  // 🔴 5. LOGIKA ANTI-CHEAT MAXIMUM SECURITY
  // ==========================================
  const handleCheatDetected = useCallback((reason) => {
    if (!activeExamRef.current || isSubmittingRef.current || isAlerting.current)
      return;

    isAlerting.current = true;

    setCheatWarnings((prev) => {
      const currentWarns = prev + 1;

      if (currentWarns >= MAX_CHEAT_WARNINGS) {
        alert(
          `⚠️ PELANGGARAN FATAL (${currentWarns}/${MAX_CHEAT_WARNINGS}) ⚠️\n\nSistem Mendeteksi: ${reason}.\n\nBatas toleransi habis! Ujian Anda dihentikan paksa sekarang juga.`,
        );
        handleEndExam(true, true);
      } else {
        alert(
          `⚠️ PERINGATAN KECURANGAN (${currentWarns}/${MAX_CHEAT_WARNINGS}) ⚠️\n\nSistem Mendeteksi: ${reason}.\n\nJangan ulangi! Jika melampaui batas toleransi, ujian akan dihentikan paksa.`,
        );
      }

      setTimeout(() => {
        isAlerting.current = false;
      }, 2000);
      return currentWarns;
    });
  }, []);

  useEffect(() => {
    if (!activeExam || isSubmitting) return;
    const outOfTabTimer = { current: null };

    // 1. Deteksi Jika Siswa Minimize Browser / Pindah Tab WA
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Jangan beri alert saat pindah agar timer tidak tertahan. Mulai 5 Detik.
        outOfTabTimer.current = setTimeout(() => {
          handleEndExam(true, true);
          alert(
            "⛔ WAKTU HABIS DI LUAR UJIAN! ⛔\nAnda meninggalkan halaman lebih dari 5 detik. Ujian dikumpulkan paksa apa adanya.",
          );
        }, 5000);
      } else {
        // Jika kembali sebelum 5 detik, batalkan timer eksekusi mati.
        if (outOfTabTimer.current) {
          clearTimeout(outOfTabTimer.current);
          outOfTabTimer.current = null;
        }
        // Berikan Peringatan / Strike karena sudah terbukti keluar.
        handleCheatDetected("Meninggalkan Aplikasi / Membuka Tab Lain");
      }
    };

    // 2. Deteksi Layar Belah / Notifikasi
    const handleBlur = () => {
      handleCheatDetected(
        "Layar tidak fokus (Membuka Notifikasi / Layar Belah)",
      );
    };

    // 3. Deteksi Keluar Fullscreen
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement)
        handleCheatDetected("Keluar dari Mode Layar Penuh");
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

  // ==========================================
  // 🟢 RENDER RUANG UJIAN (EXAM ROOM)
  // ==========================================
  if (activeExam) {
    const examMapel = getVal(activeExam, "Mapel");
    const currentSoal = soalData[currentSoalIndex];
    const currentSoalId = getVal(currentSoal, "id");
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm px-4 md:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-md hidden md:block">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tighter">
                {examMapel}
              </h1>
              <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">
                {getVal(user, "Nama")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {cheatWarnings > 0 && (
              <div className="hidden md:flex items-center gap-2 bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-[10px] font-black border border-red-200 animate-pulse">
                <ShieldAlert size={14} /> PELANGGARAN: {cheatWarnings}/
                {MAX_CHEAT_WARNINGS}
              </div>
            )}
            <div
              className={`flex items-center gap-3 px-4 py-2 rounded-xl border shadow-sm ${timeLeft < 300 ? "bg-red-50 text-red-600 border-red-200 animate-pulse" : "bg-slate-800 text-white border-slate-900"}`}
            >
              <Timer size={18} />
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase tracking-widest leading-none mb-0.5 opacity-80">
                  Sisa Waktu
                </span>
                <span className="font-black text-lg md:text-xl leading-none">
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8">
          {loadingSoal ? (
            <div className="py-32 text-center flex flex-col items-center">
              <RefreshCw
                className="animate-spin text-indigo-500 mb-4"
                size={40}
              />
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
                Menyiapkan Naskah Soal...
              </h2>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
              <div className="flex-1 space-y-4 md:space-y-6">
                {getVal(currentSoal, "Wacana") && (
                  <div className="p-5 md:p-8 bg-amber-50 border border-amber-200 rounded-3xl relative shadow-sm animate-fade-in mt-4">
                    <div className="absolute -top-3 left-6 bg-amber-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 shadow-md">
                      <BookOpen size={14} /> Teks Cerita / Wacana
                    </div>
                    <p className="font-semibold text-amber-900 leading-relaxed text-sm md:text-base whitespace-pre-wrap mt-1">
                      {getVal(currentSoal, "Wacana")}
                    </p>
                  </div>
                )}

                <Card className="p-5 md:p-8 border-t-8 border-t-indigo-600 shadow-xl shadow-slate-200/50 bg-white min-h-[300px] flex flex-col relative">
                  {isSubmitting && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-2xl">
                      <RefreshCw
                        size={40}
                        className="animate-spin text-indigo-600 mb-4"
                      />
                      <p className="font-black text-slate-800">
                        MENGIRIM JAWABAN...
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                    <span className="bg-slate-900 text-white font-black px-4 py-1.5 rounded-lg text-sm shadow-md">
                      SOAL NO. {currentSoalIndex + 1}
                    </span>
                    {getVal(currentSoal, "Poin") && (
                      <span className="bg-indigo-50 text-indigo-600 font-black px-3 py-1.5 rounded-lg text-[10px] border border-indigo-100">
                        {getVal(currentSoal, "Poin")} POIN
                      </span>
                    )}
                  </div>

                  <p className="font-bold text-slate-800 leading-relaxed text-base md:text-lg mb-8 whitespace-pre-wrap flex-1">
                    {getVal(currentSoal, "Pertanyaan")}
                  </p>

                  {getVal(currentSoal, "Link_Gambar") && (
                    <div className="mb-6 rounded-2xl overflow-hidden border border-slate-200 shadow-sm max-w-lg pointer-events-none">
                      <img
                        src={getVal(currentSoal, "Link_Gambar")}
                        alt="Gambar Pendukung"
                        className="w-full object-contain"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-3 mt-auto">
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
                          className={`w-full text-left px-5 py-3 md:py-4 rounded-2xl border-2 flex items-start gap-4 transition-all group ${isSelected ? "border-indigo-600 bg-indigo-50 shadow-md" : "border-slate-100 bg-white hover:border-indigo-300"}`}
                        >
                          <span
                            className={`font-black text-lg w-8 h-8 flex items-center justify-center rounded-lg shrink-0 transition-colors ${isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700"}`}
                          >
                            {opt}
                          </span>
                          <span
                            className={`text-sm md:text-base font-bold pt-0.5 leading-relaxed ${isSelected ? "text-indigo-900" : "text-slate-700"}`}
                          >
                            {optText}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Card>

                <div className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                  <button
                    onClick={() =>
                      setCurrentSoalIndex((prev) => Math.max(0, prev - 1))
                    }
                    disabled={currentSoalIndex === 0}
                    className="px-4 py-3 md:px-6 bg-slate-100 text-slate-600 rounded-xl font-bold uppercase tracking-widest text-xs md:text-sm hover:bg-slate-200 disabled:opacity-50 flex items-center gap-2 transition-all"
                  >
                    <ArrowLeft size={16} />{" "}
                    <span className="hidden md:block">Sebelumnya</span>
                  </button>
                  <button
                    onClick={() =>
                      setCurrentSoalIndex((prev) =>
                        Math.min(soalData.length - 1, prev + 1),
                      )
                    }
                    disabled={currentSoalIndex === soalData.length - 1}
                    className="px-4 py-3 md:px-6 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:translate-y-0 uppercase tracking-widest text-xs md:text-sm flex items-center gap-2 disabled:opacity-50 transition-all"
                  >
                    <span className="hidden md:block">Selanjutnya</span>{" "}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              <div className="w-full lg:w-80 shrink-0">
                <Card className="p-5 md:p-6 sticky top-24 border-none shadow-xl shadow-slate-200/50 bg-white">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                    <span>Navigasi Soal</span>
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-bold text-[10px]">
                      {answeredCount} / {soalData.length} Terjawab
                    </span>
                  </h3>

                  <div className="grid grid-cols-5 gap-2 max-h-[30vh] lg:max-h-[50vh] overflow-y-auto pr-2 pb-2 custom-scrollbar">
                    {soalData.map((s, idx) => {
                      const isCurrent = idx === currentSoalIndex;
                      const hasAnswered = !!answers[getVal(s, "id")];

                      return (
                        <button
                          key={idx}
                          onClick={() => setCurrentSoalIndex(idx)}
                          className={`aspect-square flex items-center justify-center rounded-xl font-black text-xs md:text-sm border-2 transition-all hover:scale-105 
                            ${isCurrent ? "border-slate-800 scale-110 shadow-md ring-4 ring-slate-100" : ""} 
                            ${hasAnswered ? (isCurrent ? "bg-emerald-500 text-white border-emerald-600" : "bg-emerald-500 text-white border-emerald-500") : isCurrent ? "bg-white text-slate-800" : "bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300"}
                          `}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleEndExam(false, false)}
                      disabled={isSubmitting}
                      className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl shadow-xl active:translate-y-0 transition-all uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <RefreshCw size={20} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={20} />
                      )}
                      {isSubmitting ? "Mengirim..." : "Selesai Ujian"}
                    </button>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ==========================================
  // 🟢 RENDER LOBBY & HASIL UJIAN (DEFAULT VIEW)
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
      {activeTab === "home" && (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          <div className="p-8 md:p-10 bg-indigo-950 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-black mb-2 tracking-tighter">
                Halo, {getVal(user, "Nama")?.split(" ")[0] || "Siswa"}!
              </h2>
              <p className="text-indigo-300 font-bold italic mb-8">
                Pilih jadwal ujian di bawah untuk memulai.
              </p>
              <div className="flex gap-4">
                <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/10 text-center backdrop-blur-sm">
                  <p className="text-[10px] font-black uppercase text-indigo-400">
                    Kelas Anda
                  </p>
                  <p className="font-black text-xl">{userKelas || "-"}</p>
                </div>
              </div>
            </div>
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-600/30 rounded-full blur-3xl z-0"></div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 px-2 uppercase tracking-tight">
              <ClipboardCheck className="text-indigo-600" /> Daftar Ujian
              Tersedia
            </h3>

            {loading ? (
              <div className="py-20 text-center">
                <RefreshCw
                  className="animate-spin mx-auto text-indigo-500 mb-2"
                  size={32}
                />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Mencari Jadwal...
                </p>
              </div>
            ) : errorMsg ? (
              <div className="p-8 text-center bg-red-50 rounded-[2rem] border border-red-100 text-red-600 font-bold">
                {errorMsg}
              </div>
            ) : exams.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                <p className="text-slate-500 font-bold">
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
                    className={`p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-l-[10px] transition-all hover:shadow-xl ${isAktif ? "border-l-emerald-500" : "border-l-slate-200 opacity-80"}`}
                  >
                    <div className="flex-1 text-center md:text-left w-full">
                      <Badge type={isAktif ? "Aktif" : examStatusRaw} />
                      <h4 className="text-2xl font-black text-slate-900 mt-2 uppercase tracking-tight">
                        {examMapel}
                      </h4>
                      <div className="flex justify-center md:justify-start gap-4 mt-3 text-xs font-bold text-slate-500">
                        <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                          <Clock size={14} className="text-blue-500" />{" "}
                          {getVal(ex, "Durasi_Menit") || "90"} Menit
                        </span>
                        <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                          <Calendar size={14} className="text-amber-500" />{" "}
                          {getVal(ex, "Tanggal") || "Hari ini"}
                        </span>
                      </div>
                    </div>

                    {isAktif ? (
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <input
                          type="text"
                          value={tokens[examId] || ""}
                          onChange={(e) =>
                            setTokens({ ...tokens, [examId]: e.target.value })
                          }
                          className="w-full md:w-32 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-center font-black tracking-widest uppercase outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
                          placeholder="TOKEN"
                        />
                        <button
                          onClick={() => handleStartExam(ex)}
                          className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-indigo-200 hover:-translate-y-1 active:translate-y-0 transition-all uppercase tracking-widest"
                        >
                          MULAI
                        </button>
                      </div>
                    ) : (
                      <div className="w-full md:w-auto bg-slate-100 text-slate-400 font-black px-8 py-4 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]">
                        <Lock size={14} /> {examStatusRaw}
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === "nilai" && (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          <div className="flex items-center justify-between px-2 mb-2">
            <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                <Award className="text-emerald-500" /> Riwayat Nilai
              </h2>
              <p className="text-sm font-bold text-slate-400">
                Evaluasi pencapaian belajarmu di sini.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <RefreshCw
                className="animate-spin mx-auto text-emerald-500 mb-2"
                size={32}
              />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Menarik Data Nilai...
              </p>
            </div>
          ) : myResults.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center">
              <Target size={48} className="text-slate-200 mb-4" />
              <h3 className="text-lg font-black text-slate-700">
                Belum Ada Riwayat Ujian
              </h3>
              <p className="text-slate-500 font-medium mt-1">
                Nilai kamu akan muncul di sini setelah menyelesaikan ujian.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myResults.map((res, idx) => {
                const mapel = getVal(res, "Mapel") || "Ujian";
                const skor = parseFloat(getVal(res, "Skor")) || 0;
                const status = getVal(res, "Status") || "Selesai";
                const isPassed = skor >= KKM_SCORE;
                const isDiskualifikasi = status
                  .toLowerCase()
                  .includes("diskualifikasi");

                return (
                  <Card
                    key={idx}
                    className={`p-6 flex flex-col relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all border ${isDiskualifikasi ? "border-red-200 bg-red-50/50" : "border-slate-100"}`}
                  >
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="bg-white/80 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-slate-500 tracking-widest border border-slate-100">
                        {mapel}
                      </div>
                      <Badge type={isDiskualifikasi ? "Draft" : status} />
                    </div>

                    <div className="mt-auto relative z-10">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        Nilai Akhir
                      </p>
                      <div className="flex items-end gap-3">
                        <span
                          className={`text-5xl font-black tracking-tighter leading-none ${isDiskualifikasi ? "text-red-600" : isPassed ? "text-emerald-500" : "text-amber-500"}`}
                        >
                          {skor}
                        </span>
                        <span className="text-sm font-bold text-slate-400 pb-1">
                          / 100
                        </span>
                      </div>
                      <p
                        className={`mt-3 text-xs font-bold px-3 py-1.5 rounded-lg inline-block ${isDiskualifikasi ? "bg-red-100 text-red-700" : isPassed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                      >
                        {isDiskualifikasi
                          ? "⛔ Didiskualifikasi"
                          : isPassed
                            ? "✅ Tuntas (Lulus KKM)"
                            : "⚠️ Butuh Remedial"}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Dashboard>
  );
};

export default SiswaDashboard;
