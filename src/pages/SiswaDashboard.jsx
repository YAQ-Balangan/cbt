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
  Lock,
  Award,
  Target,
  ShieldAlert,
  AlertTriangle,
  Info,
  Maximize,
  X,
  BookMarked,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { api } from "../api/api";
import Dashboard from "../components/layout/Dashboard";
import { Card, Badge } from "../components/ui/Ui";

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

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

// Variasi Ukuran Font (Zoom In/Out)
const fontClasses = {
  wacana: [
    "text-[13px] md:text-[15px]",
    "text-[15px] md:text-[17px]",
    "text-[17px] md:text-[19px]",
  ],
  soal: ["text-sm md:text-lg", "text-base md:text-xl", "text-lg md:text-2xl"],
  opsi: [
    "text-[13px] md:text-base",
    "text-[15px] md:text-lg",
    "text-base md:text-xl",
  ],
};

// ==========================================
// KOMPONEN TIMER INDEPENDEN (ANTI RE-RENDER GLOBAL)
// ==========================================
const ExamTimer = React.memo(({ initialTime, onTick, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    setTimeLeft(initialTime);
  }, [initialTime]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timerId = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;

        // Informasikan ke komponen induk setiap 15 detik untuk save ke DB
        if (newTime % 15 === 0) onTick(newTime);

        if (newTime <= 0) {
          clearInterval(timerId);
          onTimeUp();
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, onTick, onTimeUp]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0)
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl border shadow-sm transition-colors ${timeLeft < 300 ? "bg-red-50 text-red-600 border-red-200" : "bg-slate-800 text-white border-slate-700"}`}
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
  );
});

const SiswaDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("home");
  const [loading, setLoading] = useState(true);
  const [isAppBlocked, setIsAppBlocked] = useState(false);
  const isWebView = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    return (
      userAgent.includes("wv") ||
      (userAgent.includes("android") && userAgent.includes("version/"))
    );
  };
  const [errorMsg, setErrorMsg] = useState("");

  const [exams, setExams] = useState([]);
  const [myResults, setMyResults] = useState([]);
  const [tokens, setTokens] = useState({});
  const [activeExam, setActiveExam] = useState(null);

  const [soalData, setSoalData] = useState([]);
  const [loadingSoal, setLoadingSoal] = useState(false);
  const [currentSoalIndex, setCurrentSoalIndex] = useState(0);

  const [answers, setAnswers] = useState({});
  const [raguRagu, setRaguRagu] = useState({}); // STATE BARU UNTUK FITUR RAGU-RAGU
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STATE NAMA UJIAN DINAMIS DARI ADMIN
  const [appSettings, setAppSettings] = useState({
    title: "TADBIRA",
    desc: "Online Based Test 2026",
  });

  // STATE ANTI-CHEAT (DIPERBAIKI LOGIKANYA AGAR ANTI CRASH)
  const [isLocked, setIsLocked] = useState(false);
  const [pelanggaran, setPelanggaran] = useState(0);
  const [isAntiCheatActive, setIsAntiCheatActive] = useState(true);
  const isAntiCheatActiveRef = useRef(true);

  useEffect(() => {
    isAntiCheatActiveRef.current = isAntiCheatActive;
  }, [isAntiCheatActive]);

  // STATE UKURAN HURUF (0 = Normal, 1 = Besar, 2 = Sangat Besar)
  const [fontLevel, setFontLevel] = useState(0);

  const [zoomedImg, setZoomedImg] = useState(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
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
  const closeAlert = useCallback(
    () => setCustomAlert((prev) => ({ ...prev, isOpen: false })),
    [],
  );

  // REFS UNTUK EVENT LISTENER VISIBILITY ANTI-CHEAT
  const activeExamRef = useRef(activeExam);
  const answersRef = useRef(answers);
  const soalDataRef = useRef(soalData);
  const isSubmittingRef = useRef(isSubmitting);
  const isLockedRef = useRef(isLocked);
  const pelanggaranRef = useRef(pelanggaran);
  const timeLeftRef = useRef(timeLeft);

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
  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);
  useEffect(() => {
    pelanggaranRef.current = pelanggaran;
  }, [pelanggaran]);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  const userKelasFull = String(getVal(user, "Kelas") || "")
    .toUpperCase()
    .trim();
  const userParts = userKelasFull.split(" ");
  const userTingkat = userParts[0] || "";
  const userJurusan = userParts[1] || "";
  const userTingkatJurusan = `${userTingkat} ${userJurusan}`.trim();

  // 1. POLLING DATA JADWAL, NILAI, & SETTINGS ANTI-CHEAT
  useEffect(() => {
    const fetchData = async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      try {
        try {
          const settingsRes = await api.read("Settings");
          if (settingsRes && Array.isArray(settingsRes)) {
            const acSetting = settingsRes.find(
              (s) => String(s.kunci).toUpperCase() === "MODE_UJIAN",
            );
            setIsAntiCheatActive(
              acSetting
                ? String(acSetting.nilai).toUpperCase() !== "OFF"
                : true,
            );

            const appOnlySetting = settingsRes.find(
              (s) => String(s.kunci).toUpperCase() === "MODE_APLIKASI",
            );
            if (
              appOnlySetting &&
              String(appOnlySetting.nilai).toUpperCase() === "ON"
            ) {
              if (!isWebView()) {
                setIsAppBlocked(true);
              } else {
                setIsAppBlocked(false);
              }
            } else {
              setIsAppBlocked(false);
            }

            const titleConf = settingsRes.find((s) => s.kunci === "APP_TITLE");
            const descConf = settingsRes.find((s) => s.kunci === "APP_DESC");
            if (titleConf || descConf) {
              setAppSettings({
                title: titleConf ? titleConf.nilai : "TADBIRA",
                desc: descConf ? descConf.nilai : "Online Based Test 2026",
              });
            }
          }
        } catch (setErr) {
          console.warn("Gagal menarik konfigurasi pengaturan admin:", setErr);
        }

        const jadwalRes = await api.read("Jadwal");
        const nilaiRes = await api.read("Nilai");

        let finalJadwal = [];
        if (jadwalRes && jadwalRes.length > 0) {
          finalJadwal = jadwalRes.filter((j) => {
            const jadwalKelasRaw = String(
              getVal(j, "Kelas") || "",
            ).toUpperCase();
            if (jadwalKelasRaw === "" || jadwalKelasRaw.includes("SEMUA"))
              return true;
            const targetArray = jadwalKelasRaw.split(",").map((t) => t.trim());
            return targetArray.some(
              (target) =>
                target === userKelasFull ||
                target === userTingkatJurusan ||
                target === userJurusan ||
                target === userTingkat,
            );
          });
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
        if (!isBackground) setErrorMsg("Gagal terhubung ke database ujian.");
      } finally {
        if (!isBackground) setLoading(false);
      }
    };

    fetchData(false);
    const intervalId = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(intervalId);
  }, [user, userKelasFull, userTingkat, userJurusan, userTingkatJurusan]);

  // 2. LOGIKA ANTI-CHEAT (Keluar Aplikasi)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!isAntiCheatActiveRef.current) return;

      if (
        document.hidden &&
        activeExamRef.current &&
        !isSubmittingRef.current &&
        !isLockedRef.current
      ) {
        let currentPelanggaran = pelanggaranRef.current;
        const username = getVal(user, "Username");
        const examId = getVal(activeExamRef.current, "ID");

        if (currentPelanggaran === 0) {
          setPelanggaran(1);
          setIsLocked(true);
          await api.saveSesi(
            username,
            examId,
            answersRef.current,
            timeLeftRef.current,
            1,
            "LOCKED",
          );
        } else if (currentPelanggaran >= 1) {
          setPelanggaran(2);
          await api.saveSesi(
            username,
            examId,
            answersRef.current,
            timeLeftRef.current,
            2,
            "DISQUALIFIED",
          );
          executeEndExam(true, "Diskualifikasi");
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user]);

  // 3. POLLING BUKA KUNCI DARI GURU
  useEffect(() => {
    if (!activeExam || !isLocked) return;
    const interval = setInterval(async () => {
      const username = getVal(user, "Username");
      const examId = getVal(activeExam, "ID");
      try {
        const sesi = await api.getSesi(username, examId);
        if (sesi && sesi.status === "ACTIVE") {
          setIsLocked(false);
          showAlert(
            "success",
            "Kunci Dibuka",
            "Pengawas telah memaafkan dan membuka kunci ujian Anda. DILARANG KELUAR APLIKASI LAGI!",
          );
        }
      } catch (err) {
        console.error(err);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeExam, isLocked, user, showAlert]);

  // 4. MEMULAI UJIAN
  const handleStartExam = async (exam) => {
    const examId = getVal(exam, "ID");
    const examToken = getVal(exam, "Token");
    const examMapel = getVal(exam, "Mapel");
    const examDurasi = parseInt(getVal(exam, "Durasi_Menit")) || 90;

    const inputToken = tokens[examId]?.toUpperCase() || "";
    const realToken = String(examToken || "").toUpperCase();

    if (realToken && !inputToken)
      return showAlert(
        "warning",
        "Token Diperlukan",
        "Silakan masukkan TOKEN ujian terlebih dahulu!",
      );
    if (realToken && inputToken !== realToken)
      return showAlert(
        "danger",
        "Akses Ditolak",
        "TOKEN SALAH! Silakan periksa kembali token ujian Anda.",
      );

    const sudahMengerjakan = myResults.some(
      (res) =>
        String(getVal(res, "Mapel")).toUpperCase() ===
        String(examMapel).toUpperCase(),
    );
    if (sudahMengerjakan)
      return showAlert(
        "danger",
        "Akses Dibatasi",
        "Anda sudah menyelesaikan ujian ini. Nilai Anda sudah terekam di sistem.",
      );

    setActiveExam(exam);
    setLoadingSoal(true);
    setIsMobileDrawerOpen(false);
    setRaguRagu({}); // Reset ragu-ragu saat mulai ujian baru

    // MASUK KE MODE FULLSCREEN OTOMATIS
    try {
      const docElm = document.documentElement;
      if (docElm.requestFullscreen) {
        docElm.requestFullscreen().catch((err) => console.log(err));
      } else if (docElm.webkitRequestFullscreen) {
        docElm.webkitRequestFullscreen();
      } else if (docElm.msRequestFullscreen) {
        docElm.msRequestFullscreen();
      }
    } catch (error) {
      console.warn("Fullscreen tidak didukung.");
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
        return targetArray.some(
          (target) =>
            target === userKelasFull ||
            target === userTingkatJurusan ||
            target === userJurusan ||
            target === userTingkat,
        );
      });

      const shuffledSoal = filterSoal.sort(() => Math.random() - 0.5);
      setSoalData(shuffledSoal);

      const usernameSiswa = getVal(user, "Username");
      let serverSession = null;
      try {
        serverSession = await api.getSesi(usernameSiswa, examId);
      } catch (e) {}

      let finalAnswers = {};
      let finalTimeLeft = examDurasi * 60;

      if (serverSession) {
        finalAnswers = serverSession.jawaban_sementara || {};
        finalTimeLeft = serverSession.sisa_waktu || examDurasi * 60;
        setPelanggaran(serverSession.pelanggaran || 0);
        setIsLocked(serverSession.status === "LOCKED");
      } else {
        setPelanggaran(0);
        setIsLocked(false);
      }

      if (!serverSession) {
        try {
          await api.saveSesi(
            getVal(user, "Username"),
            examId,
            {},
            finalTimeLeft,
            0,
            "ACTIVE",
          );
        } catch (e) {
          console.error("Gagal sinkron awal", e);
        }
      }

      setAnswers(finalAnswers);
      setTimeLeft(finalTimeLeft);
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

  // 5. KALKULASI SKOR & SUBMIT
  const executeEndExam = async (isForced, forcedStatus = "Selesai") => {
    setIsSubmitting(true);
    let skorSiswa = 0;
    let benarCount = 0;
    let detailJawabanArray = [];

    const currentAnswers = answersRef.current;
    const originalSoalData = [...soalDataRef.current].sort(
      (a, b) => parseInt(getVal(a, "id")) - parseInt(getVal(b, "id")),
    );
    const totalSoal = originalSoalData.length;

    originalSoalData.forEach((soal) => {
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
      const allNilai = (await api.read("Nilai")) || [];
      let maxId = 0;
      if (allNilai && allNilai.length > 0) {
        allNilai.forEach((n) => {
          const currentId = parseInt(getVal(n, "ID"));
          if (!isNaN(currentId) && currentId > maxId) maxId = currentId;
        });
      }

      const dataNilai = {
        id: maxId + 1,
        nama_siswa: getVal(user, "Nama"),
        kelas: getVal(user, "Kelas"),
        mapel: getVal(activeExamRef.current, "Mapel"),
        skor: finalScore,
        benar: benarCount,
        salah: salahCount,
        total_soal: totalSoal,
        status: forcedStatus,
        detail_jawaban: JSON.stringify(detailJawabanArray),
      };

      await api.create("Nilai", dataNilai);
      await api.deleteSesi(
        getVal(user, "Username"),
        getVal(activeExamRef.current, "ID"),
      );

      setIsSubmitting(false);
      setActiveExam(null);
      setAnswers({});
      setRaguRagu({}); // Bersihkan ragu-ragu
      setCurrentSoalIndex(0);
      setIsMobileDrawerOpen(false);
      setActiveTab("nilai");

      // KELUAR DARI MODE FULLSCREEN OTOMATIS
      try {
        if (
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.msFullscreenElement
        ) {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch((err) => console.log(err));
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
          }
        }
      } catch (error) {
        console.warn("Gagal keluar dari fullscreen.");
      }

      if (forcedStatus === "Diskualifikasi") {
        showAlert(
          "danger",
          "Diskualifikasi!",
          "Ujian Anda dihentikan paksa karena telah keluar dari halaman ujian berulang kali.",
        );
      } else if (isForced) {
        showAlert(
          "info",
          "Waktu Habis!",
          "Waktu ujian Anda telah habis dan jawaban berhasil disimpan.",
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
        "Server sedang sibuk. Pastikan internet stabil dan lapor ke pengawas.",
      );
      setIsSubmitting(false);
    }
  };

  const handleEndExamClick = (isForced = false) => {
    if (isSubmittingRef.current) return;
    if (!isForced) {
      showAlert(
        "confirm",
        "Selesai Mengerjakan?",
        "Yakin ingin mengakhiri ujian? Jawaban yang dikirim tidak dapat diubah.",
        () => {
          closeAlert();
          executeEndExam(false);
        },
      );
    } else {
      executeEndExam(isForced);
    }
  };

  const toggleRaguRagu = () => {
    const currentSoal = soalData[currentSoalIndex];
    if (!currentSoal) return;
    const currentSoalId = String(getVal(currentSoal, "id")).trim();
    setRaguRagu((prev) => ({
      ...prev,
      [currentSoalId]: !prev[currentSoalId],
    }));
  };

  // ==============================================================
  // TAMPILAN BLOKIR EKSKLUSIF APLIKASI
  // ==============================================================
  if (isAppBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white flex-col p-6 z-[99999] fixed inset-0 select-none">
        <Lock size={80} className="text-red-500 mb-6 animate-pulse" />
        <h1 className="text-3xl md:text-5xl font-black mb-3 text-center tracking-tight">
          AKSES DIBLOKIR
        </h1>
        <p className="text-center text-slate-300 max-w-lg text-sm md:text-base leading-relaxed mb-8">
          Admin baru saja mengaktifkan <strong>Mode Eksklusif Aplikasi</strong>.
          Anda tidak dapat melanjutkan ujian menggunakan Browser apapun.
          <br />
          <br />
          Silakan tutup browser ini dan buka melalui{" "}
          <strong>Aplikasi Resmi TADBIRA</strong> yang ada di HP Anda.
        </p>
      </div>
    );
  }

  // ==============================================================
  // TAMPILAN LOCK SCREEN (PELANGGARAN PERTAMA)
  // ==============================================================
  if (isLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white flex-col p-6 z-[9999] fixed inset-0 select-none">
        <Lock size={80} className="text-red-500 mb-6 animate-pulse" />
        <h1 className="text-3xl md:text-5xl font-black mb-3 text-center tracking-tight">
          UJIAN TERKUNCI
        </h1>
        <p className="text-center text-slate-300 max-w-lg text-sm md:text-base leading-relaxed mb-8">
          Sistem mendeteksi Anda{" "}
          <strong>keluar dari aplikasi / berpindah layar</strong>. Ini adalah
          pelanggaran pertama. Silakan panggil pengawas untuk membuka kunci agar
          Anda bisa melanjutkan ujian.
          <br />
          <br />
          <strong className="text-red-400">Peringatan Keras:</strong> Jika Anda
          mengulanginya lagi, ujian akan langsung dihentikan dan Anda dinyatakan{" "}
          <strong className="text-red-500 underline uppercase">
            Diskualifikasi
          </strong>
          .
        </p>
        <div className="flex gap-3 text-slate-400 font-bold text-xs uppercase tracking-widest items-center bg-slate-800 border border-slate-700 px-6 py-3.5 rounded-2xl shadow-lg">
          <RefreshCw className="animate-spin text-amber-500" size={18} />{" "}
          Menunggu Persetujuan Guru...
        </div>
      </div>
    );
  }

  // ==============================================================
  // TAMPILAN KETIKA SEDANG UJIAN (ANBK STYLE)
  // ==============================================================
  if (activeExam) {
    const examMapel = getVal(activeExam, "Mapel");
    const currentSoal = soalData[currentSoalIndex];

    if (!currentSoal) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 flex-col">
          <ShieldAlert size={64} className="text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-800">
            Soal Belum Tersedia!
          </h2>
          <p className="text-slate-500 mt-2 mb-6 text-center max-w-md">
            Guru belum mengunggah soal untuk ujian ini atau salah memberikan tag
            kelas. Harap lapor ke Pengawas.
          </p>
          <button
            onClick={() => setActiveExam(null)}
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
    const isCurrentRagu = !!raguRagu[currentSoalId];

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-50 z-0 pointer-events-none"></div>

        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm px-4 py-3 flex justify-between items-center relative">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-sm hidden md:block">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-black text-slate-800 uppercase tracking-tighter leading-tight truncate max-w-[120px] sm:max-w-xs">
                {examMapel}
              </h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1 truncate max-w-[120px] sm:max-w-xs">
                {getVal(user, "Nama")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setFontLevel((prev) => (prev + 1) % 3)}
              className="flex items-center justify-center p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors border border-slate-200 relative"
              title="Perbesar Ukuran Teks"
            >
              <span className="font-black text-xs md:text-sm">A</span>
              <span className="font-black text-[10px] md:text-xs">A</span>
              {fontLevel > 0 && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              )}
            </button>

            {!isAntiCheatActive && (
              <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 md:px-3 py-2 rounded-xl border border-amber-200 text-[9px] font-black uppercase tracking-widest animate-pulse shadow-sm">
                <ShieldAlert size={14} />{" "}
                <span className="hidden sm:inline">Mode Uji Coba</span>
                <span className="sm:hidden">DEV</span>
              </div>
            )}

            <ExamTimer
              initialTime={timeLeft}
              onTick={(newTime) => {
                if (activeExamRef.current) {
                  api.saveSesi(
                    getVal(user, "Username"),
                    getVal(activeExamRef.current, "ID"),
                    answersRef.current,
                    newTime,
                    pelanggaranRef.current,
                    isLockedRef.current ? "LOCKED" : "ACTIVE",
                  );
                }
              }}
              onTimeUp={() => handleEndExamClick(true)}
            />
          </div>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto p-2 md:p-5 flex flex-col justify-center z-10 relative pb-24 lg:pb-5">
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
              <div className="flex-1 flex flex-col h-full bg-white border border-slate-200 rounded-[1.5rem] lg:rounded-[2rem] shadow-sm overflow-hidden relative">
                <div className="px-5 lg:px-6 py-3 lg:py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <span className="bg-slate-800 text-white font-black px-3 py-1.5 lg:px-4 rounded-lg text-xs lg:text-sm shadow-sm">
                      SOAL NO. {currentSoalIndex + 1}
                    </span>
                    {getVal(currentSoal, "Poin") && (
                      <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-1.5 lg:px-3 rounded-lg text-[10px] lg:text-xs border border-emerald-200">
                        {getVal(currentSoal, "Poin")} POIN
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8">
                  <div className="max-w-4xl mx-auto pb-6">
                    {/* Menggunakan dangerouslySetInnerHTML agar format HTML (tebal, miring, dll) dari database dapat dirender dengan baik */}
                    {getVal(currentSoal, "Wacana") && (
                      <div className="p-5 md:p-6 bg-amber-50/50 border border-amber-200 rounded-[1.5rem] relative shadow-sm mb-6 mt-2">
                        <div className="absolute -top-3 left-6 bg-amber-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1.5">
                          <BookMarked size={14} /> Bacaan / Wacana
                        </div>
                        <div
                          className={`font-medium text-slate-700 leading-relaxed mt-1 transition-all ${fontClasses.wacana[fontLevel]}`}
                          style={{ whiteSpace: "pre-wrap" }}
                          dangerouslySetInnerHTML={{
                            __html: getVal(currentSoal, "Wacana"),
                          }}
                        />
                      </div>
                    )}

                    <div
                      className={`font-bold text-slate-800 leading-relaxed mb-6 md:mb-8 transition-all ${fontClasses.soal[fontLevel]}`}
                      style={{ whiteSpace: "pre-wrap" }}
                      dangerouslySetInnerHTML={{
                        __html: getVal(currentSoal, "Pertanyaan"),
                      }}
                    />

                    {getVal(currentSoal, "Link_Gambar") && (
                      <div className="mb-8 w-full flex justify-start">
                        <div
                          onClick={() =>
                            setZoomedImg(getVal(currentSoal, "Link_Gambar"))
                          }
                          className="relative group cursor-pointer rounded-2xl border-2 border-slate-200 shadow-sm bg-slate-50 p-2 inline-block w-fit max-w-full hover:border-emerald-400 transition-colors"
                          title="Klik untuk memperbesar gambar"
                        >
                          <img
                            src={getVal(currentSoal, "Link_Gambar")}
                            alt="Gambar Pendukung"
                            className="max-w-full h-auto max-h-[35vh] lg:max-h-[45vh] object-contain rounded-xl"
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                            <span className="text-white font-bold bg-slate-900/90 px-4 py-2 rounded-xl flex items-center gap-2 shadow-xl text-sm">
                              <Maximize size={18} /> Perbesar Gambar
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 md:gap-4">
                      {["A", "B", "C", "D", "E"].map((opt) => {
                        const optText = getVal(currentSoal, `Opsi_${opt}`);
                        if (!optText) return null;
                        const isSelected = answers[currentSoalId] === opt;

                        return (
                          <button
                            key={opt}
                            onClick={() => {
                              const newAnswers = {
                                ...answers,
                                [currentSoalId]: opt,
                              };
                              setAnswers(newAnswers);
                              api.saveSesi(
                                getVal(user, "Username"),
                                getVal(activeExam, "ID"),
                                newAnswers,
                                timeLeft,
                                pelanggaranRef.current,
                                isLockedRef.current ? "LOCKED" : "ACTIVE",
                              );
                            }}
                            className={`w-full text-left px-5 py-4 md:px-6 md:py-5 rounded-[1.5rem] border-2 transition-all flex items-start gap-4 md:gap-5 group relative overflow-hidden outline-none ${
                              isSelected
                                ? "border-emerald-500 bg-emerald-50/50 shadow-md shadow-emerald-500/10 scale-[1.01]"
                                : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50 hover:shadow-sm"
                            }`}
                          >
                            {isSelected && (
                              <CheckCircle2
                                size={120}
                                className="absolute -right-6 -bottom-6 text-emerald-100 opacity-50 z-0 pointer-events-none"
                              />
                            )}

                            <span
                              className={`font-black text-sm md:text-base w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full shrink-0 transition-all z-10 ${
                                isSelected
                                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                                  : "bg-slate-100 text-slate-500 border border-slate-200 group-hover:bg-emerald-100 group-hover:text-emerald-700 group-hover:border-emerald-200"
                              }`}
                            >
                              {opt}
                            </span>

                            {/* Opsi juga mendukung HTML Rendering untuk memuat tabel, sub/sup, dll */}
                            <div
                              className={`font-medium pt-1 md:pt-2 leading-relaxed transition-all z-10 w-full ${fontClasses.opsi[fontLevel]} ${
                                isSelected
                                  ? "text-emerald-900 font-bold"
                                  : "text-slate-700"
                              }`}
                              style={{ whiteSpace: "pre-wrap" }}
                              dangerouslySetInnerHTML={{ __html: optText }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Navigasi Desktop ANBK Style */}
                <div className="hidden lg:flex px-6 py-4 border-t border-slate-100 bg-slate-50/50 justify-between items-center shrink-0 gap-4">
                  <button
                    onClick={() =>
                      setCurrentSoalIndex((prev) => Math.max(0, prev - 1))
                    }
                    disabled={currentSoalIndex === 0}
                    className="px-5 py-3.5 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-100 disabled:opacity-40 flex items-center gap-2 shadow-sm transition-colors"
                  >
                    <ArrowLeft size={16} /> SOAL SEBELUMNYA
                  </button>

                  <button
                    onClick={toggleRaguRagu}
                    className={`px-6 py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2.5 transition-colors border shadow-sm ${
                      isCurrentRagu
                        ? "bg-amber-400 text-amber-900 border-amber-500 hover:bg-amber-500"
                        : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isCurrentRagu}
                      readOnly
                      className="w-4 h-4 accent-amber-600 cursor-pointer pointer-events-none"
                    />
                    RAGU-RAGU
                  </button>

                  <button
                    onClick={() =>
                      setCurrentSoalIndex((prev) =>
                        Math.min(soalData.length - 1, prev + 1),
                      )
                    }
                    disabled={currentSoalIndex === soalData.length - 1}
                    className="px-5 py-3.5 bg-emerald-500 border border-emerald-600 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-sm uppercase tracking-widest text-xs flex items-center gap-2 disabled:opacity-40 transition-colors"
                  >
                    SOAL SELANJUTNYA <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              {/* Sidebar Kanan Desktop */}
              <div className="hidden lg:flex w-[320px] xl:w-[380px] flex-col h-full bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden shrink-0">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-black uppercase text-slate-500 tracking-widest">
                      Progress
                    </span>
                    <span className="text-sm font-black text-emerald-600">
                      {Math.round(progressPercent)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
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
                      const isRagu = !!raguRagu[sId];

                      let btnClass = isCurrent
                        ? "border-slate-800 z-10 "
                        : "border-transparent ";
                      if (hasAnswered) {
                        btnClass += isRagu
                          ? "bg-amber-400 text-amber-900"
                          : "bg-emerald-500 text-white";
                      } else {
                        btnClass += isRagu
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : isCurrent
                            ? "bg-slate-800 text-white"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200";
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => setCurrentSoalIndex(idx)}
                          className={`aspect-square flex items-center justify-center rounded-xl font-bold text-sm transition-colors border-2 ${btnClass}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-5 border-t border-slate-100 bg-slate-50/50 shrink-0">
                  <button
                    onClick={() => handleEndExamClick(false)}
                    disabled={isSubmitting}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl shadow-sm active:scale-95 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <RefreshCw size={20} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={20} />
                    )}{" "}
                    Kumpulkan Ujian
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* BOTTOM NAVIGATION (MOBILE - GAYA ANBK) */}
        {!loadingSoal && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 px-3 flex justify-between items-center z-40 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)] pb-6 sm:pb-4 gap-2">
            <button
              onClick={() =>
                setCurrentSoalIndex((prev) => Math.max(0, prev - 1))
              }
              disabled={currentSoalIndex === 0}
              className="p-3.5 bg-slate-100 text-slate-600 rounded-xl disabled:opacity-30 active:scale-95 transition-colors border border-slate-200"
            >
              <ArrowLeft size={20} />
            </button>

            <button
              onClick={toggleRaguRagu}
              className={`flex-1 flex items-center justify-center gap-2 p-3.5 rounded-xl font-bold text-xs border transition-colors shadow-sm ${
                isCurrentRagu
                  ? "bg-amber-400 text-amber-900 border-amber-500"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              <input
                type="checkbox"
                checked={isCurrentRagu}
                readOnly
                className="w-4 h-4 accent-amber-600 pointer-events-none"
              />
              <span className="hidden sm:inline">RAGU-RAGU</span>
              <span className="sm:hidden">RAGU</span>
            </button>

            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 active:scale-95 transition-transform flex items-center justify-center relative"
            >
              <LayoutDashboard size={20} />
              <span className="absolute -top-1.5 -right-1.5 text-[9px] font-black bg-emerald-500 text-white min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center shadow-sm">
                {answeredCount}
              </span>
            </button>

            <button
              onClick={() =>
                setCurrentSoalIndex((prev) =>
                  Math.min(soalData.length - 1, prev + 1),
                )
              }
              disabled={currentSoalIndex === soalData.length - 1}
              className="p-3.5 bg-emerald-500 text-white rounded-xl shadow-sm disabled:opacity-30 active:scale-95 transition-colors"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        )}

        <AnimatePresence>
          {isMobileDrawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileDrawerOpen(false)}
                className="lg:hidden fixed inset-0 bg-slate-900/60 z-[100]"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="lg:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-[2rem] z-[101] flex flex-col max-h-[85vh] shadow-2xl"
              >
                <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                  <div>
                    <h3 className="font-black text-slate-800 text-lg tracking-tight">
                      Navigasi Soal
                    </h3>
                    <p className="text-[11px] font-bold text-emerald-600 mt-0.5 uppercase tracking-widest">
                      Progress: {Math.round(progressPercent)}%
                    </p>
                  </div>
                  <button
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="p-2 bg-slate-100 text-slate-500 hover:text-red-500 rounded-full"
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
                      const isRagu = !!raguRagu[sId];

                      let btnClass = isCurrent
                        ? "border-emerald-500 z-10 "
                        : "border-slate-100 ";
                      if (hasAnswered) {
                        btnClass += isRagu
                          ? "bg-amber-400 text-amber-900 shadow-md shadow-amber-500/20"
                          : "bg-emerald-500 text-white shadow-md shadow-emerald-500/20";
                      } else {
                        btnClass += isRagu
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : isCurrent
                            ? "bg-slate-800 text-white shadow-md"
                            : "bg-white text-slate-400";
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setCurrentSoalIndex(idx);
                            setIsMobileDrawerOpen(false);
                          }}
                          className={`aspect-square flex items-center justify-center rounded-[1rem] font-bold text-sm transition-colors border-2 ${btnClass}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="p-5 border-t border-slate-100 bg-slate-50 rounded-t-3xl shrink-0 pb-6 sm:pb-4 shadow-[0_-5px_15px_-10px_rgba(0,0,0,0.05)]">
                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      handleEndExamClick(false);
                    }}
                    disabled={isSubmitting}
                    className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-sm active:scale-95 transition-colors uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <RefreshCw size={20} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={20} />
                    )}{" "}
                    Kumpulkan Ujian Sekarang
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {zoomedImg && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setZoomedImg(null)}
              className="fixed inset-0 z-[999999] bg-slate-900/95 flex items-center justify-center p-4 md:p-10 cursor-zoom-out"
            >
              <img
                src={zoomedImg}
                alt="Zoomed"
                className="max-w-full max-h-full object-contain rounded-xl"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {customAlert.isOpen && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="w-full max-w-md p-8 shadow-2xl border-0 rounded-[2rem] bg-white text-center flex flex-col items-center">
                  <div
                    className={`p-4 rounded-2xl mb-5 ${customAlert.type === "danger" || customAlert.type === "confirm" ? "bg-red-50 text-red-500" : customAlert.type === "warning" ? "bg-amber-50 text-amber-500" : customAlert.type === "success" ? "bg-emerald-50 text-emerald-500" : "bg-blue-50 text-blue-500"}`}
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
                          className="flex-1 py-3.5 rounded-xl font-bold text-white shadow-sm transition-colors text-sm uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600"
                        >
                          Ya, Kumpulkan
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={closeAlert}
                        className={`w-full py-3.5 rounded-xl font-bold text-white shadow-sm text-sm uppercase tracking-widest transition-colors ${customAlert.type === "danger" ? "bg-red-500 hover:bg-red-600" : "bg-emerald-600 hover:bg-emerald-700"}`}
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

  // ==============================================================
  // TAMPILAN BERANDA (Pilih Jadwal)
  // ==============================================================
  return (
    <Dashboard
      menu={[
        { id: "home", label: "Portal Ujian", icon: LayoutDashboard },
        { id: "nilai", label: "Hasil Ujian", icon: BarChart3 },
      ]}
      active={activeTab}
      setActive={setActiveTab}
    >
      <div className="fixed inset-0 bg-slate-50 z-0 pointer-events-none"></div>

      {activeTab === "home" && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto space-y-6 pb-24 relative z-10"
        >
          {/* DIGITAL ID CARD HEADER */}
          <motion.header
            variants={fadeUp}
            className="relative p-6 md:p-8 rounded-[2rem] shadow-lg bg-gradient-to-br from-emerald-600 to-emerald-800 border border-emerald-500 overflow-hidden text-white"
          >
            <div className="absolute -top-12 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col gap-4 md:gap-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-emerald-200 mb-1">
                    {appSettings.desc}
                  </p>
                  <h2 className="text-2xl md:text-4xl font-black tracking-tight drop-shadow-md">
                    {appSettings.title}
                  </h2>
                </div>
                <div className="p-2.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <Award size={24} className="text-amber-300" />
                </div>
              </div>
              <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-black text-xl border-2 border-white shadow-sm shrink-0">
                  {getVal(user, "Nama")?.charAt(0)?.toUpperCase() || "S"}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm md:text-base leading-tight truncate">
                    {getVal(user, "Nama") || "Siswa"}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-md uppercase tracking-wider border border-white/10">
                      KLS: {userKelasFull || "-"}
                    </span>
                    <span className="text-[10px] font-bold bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-md uppercase tracking-wider border border-amber-400/20">
                      {getVal(user, "Username")}
                    </span>
                  </div>
                </div>
              </div>
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
                    className={`p-5 flex flex-col md:flex-row items-center justify-between gap-5 border-l-[8px] rounded-[1.5rem] transition-colors ${isAktif ? "border-l-emerald-500 bg-white" : "border-l-slate-200 bg-slate-50/50"}`}
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
                          className="w-full md:w-36 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-black tracking-widest uppercase outline-none focus:border-emerald-500 focus:bg-white transition-colors text-slate-800 text-sm"
                          placeholder="TOKEN"
                        />
                        <button
                          onClick={() => handleStartExam(ex)}
                          className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 py-3.5 rounded-xl shadow-sm active:scale-95 transition-all uppercase tracking-widest text-sm"
                        >
                          MULAI
                        </button>
                      </div>
                    ) : (
                      <div className="w-full md:w-auto bg-slate-200/50 text-slate-400 font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest text-[11px]">
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
                const benarCount = getVal(res, "Benar");
                const salahCount = getVal(res, "Salah");
                const totalCount = getVal(res, "Total_Soal");

                return (
                  <Card
                    key={idx}
                    className="p-5 flex flex-col rounded-[1.5rem] relative overflow-hidden border border-slate-100 bg-white"
                  >
                    <div className="flex justify-between items-start mb-5 relative z-10">
                      <div className="bg-slate-50 px-2.5 py-1 rounded-md text-[10px] font-black uppercase text-slate-500 tracking-widest border border-slate-200">
                        {mapel}
                      </div>
                      <Badge type={status} />
                    </div>
                    <div className="mt-auto relative z-10 flex flex-col">
                      <div className="flex items-end gap-2 mb-4">
                        <span className="text-5xl font-black tracking-tighter leading-none text-emerald-500">
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
                            Salah
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

      {/* MODAL CUSTOM ALERT */}
      <AnimatePresence>
        {customAlert.isOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="w-full max-w-md p-8 shadow-2xl border-0 rounded-[2rem] bg-white text-center flex flex-col items-center">
                <div
                  className={`p-4 rounded-2xl mb-5 ${customAlert.type === "danger" || customAlert.type === "confirm" ? "bg-red-50 text-red-500" : customAlert.type === "warning" ? "bg-amber-50 text-amber-500" : customAlert.type === "success" ? "bg-emerald-50 text-emerald-500" : "bg-blue-50 text-blue-500"}`}
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
                        className="flex-1 py-3.5 rounded-xl font-bold text-white shadow-sm transition-colors text-sm uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600"
                      >
                        Ya, Kumpulkan
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={closeAlert}
                      className={`w-full py-3.5 rounded-xl font-bold text-white shadow-sm text-sm uppercase tracking-widest transition-colors ${customAlert.type === "danger" ? "bg-red-500 hover:bg-red-600" : "bg-emerald-600 hover:bg-emerald-700"}`}
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
