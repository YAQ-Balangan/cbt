// src/pages/GuruDashboard.jsx
import React, { useState, useEffect, useMemo, useRef, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Award,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  Copy,
  X,
  Save,
  CheckCircle2,
  FileText,
  UploadCloud,
  Check,
  BookOpen,
  Target,
  Download,
  BarChart3,
  LayoutList,
  TableProperties,
  Printer,
  ChevronDown,
  Square,
  CheckSquare,
  AlertTriangle,
  Info,
  ListChecks,
  Link2,
  Eye,
  ImagePlus,
  Undo,
  Redo,
  ShieldAlert,
  Unlock,
  UserX,
} from "lucide-react";
import { api } from "../api/api";
import Dashboard from "../components/layout/Dashboard";
import { Card, Badge } from "../components/ui/Ui";
import { AuthContext } from "../context/AuthContext";

// IMPORT LIBRARY EXPORT
import * as XLSX from "xlsx";
import * as mammoth from "mammoth";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  VerticalAlign,
} from "docx";
import { saveAs } from "file-saver";

// ==========================================
// HELPER: FORMAT POIN
// ==========================================
const formatPoinDisplay = (val) => {
  if (val === undefined || val === null || val === "") return "2";
  const str = String(val);
  if (str.includes("T") && str.includes("Z") && str.includes("-")) {
    return "2.5";
  }
  return str;
};

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
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ==========================================
// KOMPONEN PREMIUM CUSTOM DROPDOWN
// ==========================================
const PremiumSelect = ({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(
    (opt) => String(opt.value) === String(value),
  );

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-2.5 md:p-3.5 text-sm bg-white border transition-all rounded-lg md:rounded-xl outline-none shadow-sm min-h-[40px] md:min-h-[48px]
          ${disabled ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" : "border-slate-200 text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 hover:border-emerald-400 cursor-pointer"}
        `}
      >
        <span
          className={`flex items-center gap-2 line-clamp-2 text-left break-words ${!selectedOption ? "text-slate-400 font-medium" : "font-bold"}`}
        >
          {icon && <span className="text-emerald-600 shrink-0">{icon}</span>}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 shrink-0 ml-2 transition-transform duration-300 ${isOpen ? "rotate-180 text-emerald-600" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-52 md:max-h-60 overflow-y-auto py-1 scrollbar-thin"
          >
            {options.map((opt, index) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 md:px-4 py-2.5 md:py-3 text-sm transition-colors text-left
                    ${isSelected ? "bg-emerald-50 text-emerald-800 font-bold" : "text-slate-600 hover:bg-slate-50 hover:text-emerald-700 font-medium"}
                  `}
                >
                  <span className="whitespace-normal break-words pr-2">
                    {opt.label}
                  </span>
                  {isSelected && (
                    <Check
                      size={16}
                      className="text-emerald-600 shrink-0 ml-2"
                    />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// KOMPONEN PREMIUM MULTI-SELECT CHECKBOX
// ==========================================
const PremiumMultiSelect = ({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedArray = value
    ? String(value)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const toggleOption = (optValue) => {
    let newArr = [...selectedArray];
    if (newArr.includes(optValue)) {
      newArr = newArr.filter((i) => i !== optValue);
    } else {
      newArr.push(optValue);
    }
    onChange(newArr.join(", "));
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-2.5 md:p-3.5 text-sm bg-white border transition-all rounded-lg md:rounded-xl outline-none shadow-sm min-h-[40px] md:min-h-[48px]
          ${disabled ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" : "border-slate-200 text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 hover:border-emerald-400 cursor-pointer"}
        `}
      >
        <span
          className={`line-clamp-2 text-left break-words pr-2 ${selectedArray.length === 0 ? "text-slate-400 font-medium" : "font-bold"}`}
        >
          {selectedArray.length === 0
            ? placeholder
            : selectedArray.length > 2
              ? `${selectedArray.length} Kelas Dipilih`
              : selectedArray.join(", ")}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-emerald-600" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-50 w-full md:w-80 mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl flex flex-col max-h-64 md:max-h-72 overflow-hidden max-w-[90vw]"
          >
            <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0 flex justify-between items-center z-10">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">
                Pilih Sasaran Kelas
              </span>
              {selectedArray.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="text-[10px] font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="overflow-y-auto p-2 scrollbar-thin flex flex-col gap-1">
              {options.map((opt, index) => {
                if (opt.isLabel) {
                  return (
                    <div
                      key={index}
                      className="px-3 pt-4 pb-1 text-[10px] font-black text-emerald-700 uppercase tracking-widest bg-white sticky top-0 z-10"
                    >
                      {opt.label}
                    </div>
                  );
                }
                const isSelected = selectedArray.includes(opt.value);
                return (
                  <div
                    key={index}
                    onClick={() => toggleOption(opt.value)}
                    className={`flex items-center gap-3 p-2 md:p-2.5 rounded-lg cursor-pointer transition-all ${isSelected ? "bg-emerald-50 text-emerald-700 font-bold" : "hover:bg-slate-50 text-slate-600 font-medium"}`}
                  >
                    {isSelected ? (
                      <CheckSquare
                        size={16}
                        className="text-emerald-500 shrink-0"
                      />
                    ) : (
                      <Square size={16} className="text-slate-300 shrink-0" />
                    )}
                    <span className="text-xs md:text-sm whitespace-normal break-words leading-tight">
                      {opt.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// GENERATOR OPSI KELAS OTOMATIS
// ==========================================
const TINGKAT_SEKOLAH = ["X", "XI", "XII"];
const JURUSAN_SEKOLAH = ["MIPA", "IPS"];
const MAKSIMAL_ROMBEL = 2;

const OPSI_KELAS_LENGKAP = [
  { label: "KATEGORI GLOBAL", isLabel: true },
  { label: "Semua Kelas (Umum)", value: "SEMUA" },
];

OPSI_KELAS_LENGKAP.push({
  label: "KATEGORI TINGKAT (GABUNGAN JURUSAN)",
  isLabel: true,
});
TINGKAT_SEKOLAH.forEach((t) => {
  OPSI_KELAS_LENGKAP.push({
    label: `Kelas ${t} (Gabungan MIPA & IPS)`,
    value: t,
  });
});

OPSI_KELAS_LENGKAP.push({ label: "KATEGORI JURUSAN GLOBAL", isLabel: true });
JURUSAN_SEKOLAH.forEach((j) => {
  OPSI_KELAS_LENGKAP.push({ label: `Semua ${j} (X, XI, XII)`, value: j });
});

OPSI_KELAS_LENGKAP.push({ label: "KATEGORI TINGKAT & JURUSAN", isLabel: true });
TINGKAT_SEKOLAH.forEach((t) => {
  JURUSAN_SEKOLAH.forEach((j) => {
    OPSI_KELAS_LENGKAP.push({ label: `${t} ${j}`, value: `${t} ${j}` });
  });
});

OPSI_KELAS_LENGKAP.push({ label: "KELAS SPESIFIK (ROMBEL)", isLabel: true });
TINGKAT_SEKOLAH.forEach((t) => {
  JURUSAN_SEKOLAH.forEach((j) => {
    for (let i = 1; i <= MAKSIMAL_ROMBEL; i++) {
      OPSI_KELAS_LENGKAP.push({
        label: `${t} ${j} ${i}`,
        value: `${t} ${j} ${i}`,
      });
    }
  });
});

const TAB_CONFIG = {
  soal: {
    sheet: "Soal",
    title: "Bank Soal",
    subtitle: "Manajemen Soal Ujian & Kunci Jawaban",
    form: [],
    defaultValues: {
      mapel: "",
      kelas: "",
      wacana: "",
      pertanyaan: "",
      poin: "2",
      link_gambar: "",
      opsi_a: "",
      opsi_b: "",
      opsi_c: "",
      opsi_d: "",
      opsi_e: "",
      jawaban_benar: "A",
      guru_pembuat: "",
    },
    filterKeys: ["mapel", "kelas"],
  },
  nilai: {
    sheet: "Nilai",
    title: "Monitoring Nilai",
    subtitle: "Pantau Hasil Ujian Siswa Secara Real-Time",
    columns: [
      { key: "id", label: "ID Ujian" },
      { key: "nama_siswa", label: "Nama Siswa" },
      { key: "kelas", label: "Kelas" },
      { key: "mapel", label: "Mata Pelajaran" },
      { key: "benar", label: "Benar" },
      { key: "salah", label: "Salah" },
      { key: "skor", label: "Nilai / Poin" },
      { key: "status", label: "Status" },
    ],
    form: [],
    defaultValues: {},
    filterKeys: ["kelas", "mapel", "status"],
  },
};

const MENU_ITEMS = [
  { id: "soal", label: "Bank Soal", icon: Layers },
  { id: "nilai", label: "Monitoring Nilai", icon: Award },
];

const KKM_SCORE = 75;

const GuruDashboard = () => {
  const { user } = useContext(AuthContext);
  const namaGuruLog = user?.nama || user?.username || "Guru";

  const [tab, setTab] = useState("soal");
  const [data, setData] = useState([]);
  const [sesiUjianData, setSesiUjianData] = useState([]); // State untuk Anti-Cheat
  const currentConfig = TAB_CONFIG[tab];

  // STATE & API GAMBAR
  const IMGBB_API_KEY = "db28c000ce57b260d7d09cb4c18790e0";
  const [uploadingImgId, setUploadingImgId] = useState(null);

  // LOGIKA UNDO / REDO
  const [actionHistory, setActionHistory] = useState({ undo: [], redo: [] });
  const [isDoingHistory, setIsDoingHistory] = useState(false);

  const [mapelOptions, setMapelOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [isEdit, setIsEdit] = useState(false);
  const [originalId, setOriginalId] = useState(null);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [customAlert, setCustomAlert] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });

  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [parsedBulkData, setParsedBulkData] = useState([]);
  const [bulkMapel, setBulkMapel] = useState("");
  const [bulkKelas, setBulkKelas] = useState("");
  const [bulkPoin, setBulkPoin] = useState("2");
  const [bulkProgress, setBulkProgress] = useState(0);

  // VIEW MODE: "rekap" | "log" | "pelanggaran"
  const [nilaiViewMode, setNilaiViewMode] = useState("rekap");

  const showAlert = (type, title, message, onConfirm = null) => {
    setCustomAlert({ isOpen: true, type, title, message, onConfirm });
  };
  const closeAlert = () => setCustomAlert({ ...customAlert, isOpen: false });

  // --- REKAM JEJAK SEJARAH (UNDO/REDO LOGGER) ---
  const pushAction = (action) => {
    setActionHistory((prev) => ({ undo: [...prev.undo, action], redo: [] }));
  };

  const handleUndo = async () => {
    if (actionHistory.undo.length === 0) return;
    const action = actionHistory.undo[actionHistory.undo.length - 1];
    setIsDoingHistory(true);
    try {
      if (action.type === "DELETE") {
        await api.create(currentConfig.sheet, action.item);
      } else if (action.type === "CREATE") {
        await api.delete(currentConfig.sheet, action.item.id);
      } else if (action.type === "UPDATE") {
        await api.update(
          currentConfig.sheet,
          action.oldItem.id,
          action.oldItem,
        );
      } else if (action.type === "BULK_DELETE") {
        for (let it of action.items) {
          await api.create(currentConfig.sheet, it);
          await new Promise((r) => setTimeout(r, 200));
        }
      } else if (action.type === "BULK_CREATE") {
        for (let it of action.items) {
          await api.delete(currentConfig.sheet, it.id);
          await new Promise((r) => setTimeout(r, 200));
        }
      }

      setActionHistory((prev) => ({
        undo: prev.undo.slice(0, -1),
        redo: [...prev.redo, action],
      }));
      await fetchData(false);
    } catch (err) {
      showAlert(
        "danger",
        "Undo Gagal",
        "Gagal membatalkan aksi: " + err.message,
      );
    } finally {
      setIsDoingHistory(false);
    }
  };

  const handleRedo = async () => {
    if (actionHistory.redo.length === 0) return;
    const action = actionHistory.redo[actionHistory.redo.length - 1];
    setIsDoingHistory(true);
    try {
      if (action.type === "DELETE") {
        await api.delete(currentConfig.sheet, action.item.id);
      } else if (action.type === "CREATE") {
        await api.create(currentConfig.sheet, action.item);
      } else if (action.type === "UPDATE") {
        await api.update(
          currentConfig.sheet,
          action.newItem.id,
          action.newItem,
        );
      } else if (action.type === "BULK_DELETE") {
        for (let it of action.items) {
          await api.delete(currentConfig.sheet, it.id);
          await new Promise((r) => setTimeout(r, 200));
        }
      } else if (action.type === "BULK_CREATE") {
        for (let it of action.items) {
          await api.create(currentConfig.sheet, it);
          await new Promise((r) => setTimeout(r, 200));
        }
      }

      setActionHistory((prev) => ({
        undo: [...prev.undo, action],
        redo: prev.redo.slice(0, -1),
      }));
      await fetchData(false);
    } catch (err) {
      showAlert("danger", "Redo Gagal", "Gagal mengulang aksi: " + err.message);
    } finally {
      setIsDoingHistory(false);
    }
  };

  const fetchMapelList = async () => {
    try {
      const res = await api.read("Mapel");
      if (res && res.length > 0) {
        const list = res.map((m) => m.nama_mapel).filter(Boolean);
        setMapelOptions([...new Set(list)].sort());
      }
    } catch (error) {
      console.error("Gagal menarik Mapel", error);
    }
  };

  const fetchData = async (isBackground = false) => {
    if (!currentConfig) return;
    if (!isBackground) setLoading(true);
    try {
      const result = await api.read(currentConfig.sheet);
      const newData = result || [];
      setData((prev) =>
        JSON.stringify(prev) !== JSON.stringify(newData) ? newData : prev,
      );

      // PENARIKAN DATA ANTI-CHEAT SEKARANG GLOBAL (PANTAU 24/7)
      try {
        const lockedRes = await api.getSesiTerkunci();
        setSesiUjianData(lockedRes || []);
      } catch (e) {
        console.error("Gagal menarik data sesi anti-cheat:", e);
      }
    } catch (error) {
      if (!isBackground) setData([]);
    } finally {
      if (isBackground) setIsSyncing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    setSearch("");
    setFilters({});
    setSelectedIds([]);
    fetchMapelList();
    fetchData(false);
    const intervalId = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(intervalId);
  }, [tab]);

  // ==============================================================
  // UX LUAR: UPLOAD GAMBAR LANGSUNG PADA KARTU SOAL
  // ==============================================================
  const handleInlineImageUpload = async (e, item) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return showAlert(
        "warning",
        "Ukuran Gambar Terlalu Besar",
        "Maksimal ukuran gambar adalah 2MB. Silakan kompres foto Anda.",
      );
    }

    setUploadingImgId(item.id);
    const formDataUpload = new FormData();
    formDataUpload.append("image", file);

    try {
      const res = await fetch(
        `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
        {
          method: "POST",
          body: formDataUpload,
        },
      );
      const dataImg = await res.json();

      if (dataImg.success) {
        const safeUrl = `https://wsrv.nl/?url=${dataImg.data.url}`;
        const payloadToSave = {
          ...item,
          link_gambar: safeUrl,
          poin: parseFloat(item.poin),
        };

        const resApi = await api.update(
          currentConfig.sheet,
          item.id,
          payloadToSave,
        );
        if (resApi && resApi.error) throw new Error(resApi.error.message);

        setData((prev) =>
          prev.map((d) =>
            String(d.id) === String(item.id) ? payloadToSave : d,
          ),
        );
        pushAction({ type: "UPDATE", oldItem: item, newItem: payloadToSave });
      } else {
        throw new Error("Gagal mengunggah gambar ke server. Coba lagi nanti.");
      }
    } catch (err) {
      showAlert("danger", "Upload Gagal", err.message);
    } finally {
      setUploadingImgId(null);
      e.target.value = null; // Reset file input
    }
  };

  const handleRemoveInlineImage = async (item) => {
    setUploadingImgId(item.id);
    try {
      const payloadToSave = {
        ...item,
        link_gambar: "",
        poin: parseFloat(item.poin),
      };
      const resApi = await api.update(
        currentConfig.sheet,
        item.id,
        payloadToSave,
      );
      if (resApi && resApi.error) throw new Error(resApi.error.message);

      setData((prev) =>
        prev.map((d) => (String(d.id) === String(item.id) ? payloadToSave : d)),
      );
      pushAction({ type: "UPDATE", oldItem: item, newItem: payloadToSave });
    } catch (err) {
      showAlert("danger", "Gagal Hapus Gambar", err.message);
    } finally {
      setUploadingImgId(null);
    }
  };

  const handleDelete = async (id) => {
    showAlert(
      "confirm",
      "Hapus Data?",
      `Yakin ingin menghapus data dengan ID: #${id}?`,
      async () => {
        closeAlert();
        setLoading(true);
        try {
          const itemToDelete = data.find((d) => String(d.id) === String(id));
          const res = await api.delete(currentConfig.sheet, id);
          if (res && res.error)
            throw new Error(res.error.message || JSON.stringify(res.error));

          if (itemToDelete) pushAction({ type: "DELETE", item: itemToDelete });
          await fetchData(false);
          setSelectedIds((prev) =>
            prev.filter((selId) => String(selId) !== String(id)),
          );
        } catch (error) {
          showAlert("danger", "Gagal Menghapus", error.message);
        } finally {
          setLoading(false);
        }
      },
    );
  };

  const handleBulkDelete = () => {
    showAlert(
      "confirm",
      "Hapus Banyak Soal?",
      `Yakin ingin menghapus ${selectedIds.length} soal?`,
      async () => {
        closeAlert();
        setIsDeletingBulk(true);
        setLoading(true);
        try {
          const itemsToDelete = data.filter((d) => selectedIds.includes(d.id));
          for (let i = 0; i < selectedIds.length; i++) {
            const res = await api.delete(currentConfig.sheet, selectedIds[i]);
            if (res && res.error)
              throw new Error(res.error.message || JSON.stringify(res.error));
            await new Promise((r) => setTimeout(r, 300));
          }
          pushAction({ type: "BULK_DELETE", items: itemsToDelete });
          await fetchData(false);
          setSelectedIds([]);
        } catch (error) {
          showAlert("danger", "Kesalahan", error.message);
        } finally {
          setIsDeletingBulk(false);
          setLoading(false);
        }
      },
    );
  };

  const handleDeleteAll = () => {
    if (processedData.length === 0)
      return showAlert("warning", "Kosong", "Tidak ada data untuk dihapus.");
    showAlert(
      "danger",
      "Sapu Bersih Database?",
      "Anda akan menghapus SELURUH soal yang tampil di tabel ini secara permanen. Lanjutkan?",
      async () => {
        closeAlert();
        setLoading(true);
        setIsDeletingBulk(true);
        try {
          const itemsToDelete = [...processedData];
          for (let item of processedData) {
            const res = await api.delete(currentConfig.sheet, item.id);
            if (res && res.error)
              throw new Error(res.error.message || JSON.stringify(res.error));
            await new Promise((r) => setTimeout(r, 300));
          }
          pushAction({ type: "BULK_DELETE", items: itemsToDelete });
          await fetchData(false);
          setSelectedIds([]);
          showAlert(
            "info",
            "Berhasil",
            "Seluruh data yang dipilih telah dihapus.",
          );
        } catch (error) {
          showAlert("danger", "Kesalahan", error.message);
        } finally {
          setLoading(false);
          setIsDeletingBulk(false);
        }
      },
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!isEdit || (isEdit && String(originalId) !== String(formData.id))) {
      const isDuplicate = data.some(
        (item) => String(item.id) === String(formData.id),
      );
      if (isDuplicate) {
        const maxId = Math.max(...data.map((item) => parseInt(item.id) || 0));
        setFormData({ ...formData, id: maxId + 1 });
        showAlert(
          "warning",
          "ID Duplikat",
          `ID dipakai! Dialihkan ke ID aman: ${maxId + 1}. Silakan klik simpan lagi.`,
        );
        return;
      }
    }

    if (!formData.mapel)
      return showAlert(
        "warning",
        "Validasi",
        "Harap pilih Mata Pelajaran terlebih dahulu.",
      );
    if (!formData.kelas)
      return showAlert(
        "warning",
        "Validasi",
        "Harap pilih minimal satu Kelas Sasaran.",
      );

    const payloadToSave = {
      ...formData,
      id: parseInt(formData.id),
      poin: parseFloat(String(formData.poin).replace(",", ".")) || 0,
      guru_pembuat: namaGuruLog,
    };

    setIsSaving(true);
    try {
      let res;
      if (isEdit) {
        const oldItem = data.find((d) => String(d.id) === String(originalId));
        res = await api.update(currentConfig.sheet, originalId, payloadToSave);
        if (!(res && res.error) && oldItem)
          pushAction({ type: "UPDATE", oldItem, newItem: payloadToSave });
      } else {
        res = await api.create(currentConfig.sheet, payloadToSave);
        if (!(res && res.error))
          pushAction({ type: "CREATE", item: payloadToSave });
      }

      if (res && res.error) {
        throw new Error(
          `Airtable menolak data. Detail: ${JSON.stringify(res.error)}`,
        );
      }

      await fetchData(false);
      setIsModalOpen(false);
    } catch (error) {
      showAlert("danger", "Kesalahan Server", error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // LOGIKA ANTI-CHEAT: GURU BUKA KUNCI
  const handleUnlockSesi = async (username, examId) => {
    try {
      setLoading(true);
      // Panggil API (status jadi ACTIVE, pelanggaran biarkan 1 agar tidak curang lagi)
      await api.updateSesiStatus(username, examId, "ACTIVE", 1);

      showAlert(
        "success",
        "Akses Dibuka",
        `Siswa ${username} sekarang bisa melanjutkan ujiannya.`,
      );
      fetchData(true);
    } catch (err) {
      showAlert(
        "danger",
        "Gagal",
        "Sistem gagal membuka kunci. Periksa koneksi internet: " + err.message,
      );
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setIsEdit(false);
    let nextId = 1;
    if (data.length > 0)
      nextId = Math.max(...data.map((item) => parseInt(item.id) || 0)) + 1;
    setFormData({ id: nextId, ...currentConfig.defaultValues });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setIsEdit(true);
    setOriginalId(item.id);
    setFormData({ ...item, poin: formatPoinDisplay(item.poin) });
    setIsModalOpen(true);
  };

  const handleDuplicate = (item) => {
    const maxId =
      data.length > 0 ? Math.max(...data.map((d) => parseInt(d.id) || 0)) : 0;
    setIsEdit(false);
    setFormData({ ...item, id: maxId + 1, poin: formatPoinDisplay(item.poin) });
    setIsModalOpen(true);
  };

  const openReviewModal = (item) => {
    setReviewData(item);
    setIsReviewModalOpen(true);
  };

  const handleParseBulkText = () => {
    if (!bulkMapel)
      return showAlert("warning", "Validasi", "Harap pilih Mata Pelajaran.");
    if (!bulkKelas)
      return showAlert("warning", "Validasi", "Harap pilih Kelas Sasaran.");
    if (!bulkText.trim())
      return showAlert("warning", "Validasi", "Teks soal masih kosong.");

    // ==========================================
    // 1. LOGIKA PEMISAH SOAL CERDAS (STATE MACHINE V3)
    // Menutup celah Opsi Multi-baris & Soal tanpa nomor
    // ==========================================
    const lines = bulkText.split("\n");
    const rawBlocks = [];
    let currentBlock = [];
    let phase = "q"; // 'q' = wacana/soal, 'o' = opsi, 'k' = kunci, 'split_ready' = siap dipotong

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      let lineTrimmed = line.trim();

      // Memanfaatkan baris kosong sebagai sinyal transisi yang aman
      if (!lineTrimmed) {
        // Jika baris kosong muncul SETELAH opsi atau kunci, sistem siap memotong soal
        if ((phase === "o" || phase === "k") && currentBlock.length > 0) {
          phase = "split_ready";
        }
        continue;
      }

      let isOpt = /^\s*\*?[a-eA-E]\*?[\.\)]/.test(lineTrimmed);
      let isKunci = /^\s*(?:Jawaban|Kunci)\s*:/i.test(lineTrimmed);
      let isNumbered = /^\s*\d+[\.\)]\s/.test(lineTrimmed);
      let isWacanaMarker =
        /^\s*(perhatikan|cermatilah|bacalah|amatilah|wacana|teks|kutipan|dialog)/i.test(
          lineTrimmed,
        );

      // Kapan kita memotong (split) blok menjadi soal baru?
      if (currentBlock.length > 0) {
        if (
          isNumbered || // Sinyal 1: Jelas ada nomor urut baru
          isWacanaMarker || // Sinyal 2: Jelas ada penanda instruksi wacana baru
          (phase === "split_ready" && !isOpt && !isKunci) || // Sinyal 3: Habis baris kosong, dan bukan lanjutan opsi
          (phase === "k" && !isKunci) // Sinyal 4: Tembok Kunci:A sudah terlewati
        ) {
          rawBlocks.push(currentBlock.join("\n"));
          currentBlock = [];
          phase = "q";
        }
      }

      if (isOpt) phase = "o";
      else if (isKunci) phase = "k";
      else if (phase === "split_ready") phase = "q"; // Batal split, ternyata opsi multi-baris berparagraf

      currentBlock.push(lineTrimmed);
    }
    if (currentBlock.length > 0) rawBlocks.push(currentBlock.join("\n"));

    // ==========================================
    // 2. LOGIKA EKSTRAKSI & COUNTDOWN WACANA
    // ==========================================
    const parsed = [];
    let currentId =
      data.length > 0
        ? Math.max(...data.map((item) => parseInt(item.id) || 0))
        : 0;

    let wacanaTerakhir = "";
    let sisaJatahWacana = 0;

    for (let i = 0; i < rawBlocks.length; i++) {
      let rawText = rawBlocks[i].trim();
      if (!rawText) continue;

      currentId += 1;

      // Ekstrak Format "Kunci: A"
      let kunci = "A";
      const matchKunciBawah = rawText.match(
        /\n\s*(?:Jawaban|Kunci)\s*:\s*([A-E])/i,
      );
      if (matchKunciBawah) {
        kunci = matchKunciBawah[1].toUpperCase();
        rawText = rawText.replace(/\n\s*(?:Jawaban|Kunci)\s*:\s*([A-E])/i, "");
      }

      // Hapus nomor soal di awal
      rawText = rawText.replace(/^\s*\d+[\.\)]\s*/, "");

      // Ekstrak Opsi & Format Bintang (*)
      const extractOption = (letter, nextLetter) => {
        const nextRegex = nextLetter
          ? `\\n\\s*\\*?[${nextLetter.toLowerCase()}${nextLetter.toUpperCase()}]\\*?[\\.\\)]`
          : `$`;
        const regex = new RegExp(
          `(?:^|\\n)\\s*(\\*?)[${letter.toLowerCase()}${letter.toUpperCase()}](\\*?)[\\.\\)]\\s*(\\*?)(.+?)(?=${nextRegex})`,
          "is",
        );

        const match = rawText.match(regex);
        if (!match) return { text: "", isKey: false };

        let isKey = match[1] === "*" || match[2] === "*" || match[3] === "*";
        let text = match[4].trim();
        if (text.startsWith("*")) {
          isKey = true;
          text = text.substring(1).trim();
        }
        return { text, isKey };
      };

      const optA = extractOption("A", "B");
      const optB = extractOption("B", "C");
      const optC = extractOption("C", "D");
      const optD = extractOption("D", "E"); // Aman meski soal SMP cuma sampai D
      const optE = extractOption("E", null);

      if (optA.isKey) kunci = "A";
      else if (optB.isKey) kunci = "B";
      else if (optC.isKey) kunci = "C";
      else if (optD.isKey) kunci = "D";
      else if (optE.isKey) kunci = "E";

      let teksSebelumOpsi = rawText
        .split(/(?:^|\n)\s*\*?[aA]\*?[\.\)]\s*/)[0]
        .trim();
      let wacana = "";
      let pertanyaan = "";

      // Regex Hitung Wacana yang Jauh Lebih Kuat (Menutup Celah 2)
      const hitungTargetWacana = (teks) => {
        let remaining = 1;
        const rangeMatch = teks.match(
          /soal\s+(?:nomor\s+)?(\d+)\s*(?:-|s\.?\/d\.?|sampai|s\/d)\s*(\d+)/i,
        );
        const andMatch = teks.match(/soal\s+(?:nomor\s+)?(\d+)\s+dan\s+(\d+)/i);
        // Menangkap "untuk 3 soal", "untuk menjawab 5 soal", "untuk sebanyak 2 soal"
        const countMatch = teks.match(
          /untuk\s+(?:menjawab\s+)?(?:sebanyak\s+)?(\d+)\s+soal/i,
        );

        if (rangeMatch) {
          remaining = Math.max(
            1,
            parseInt(rangeMatch[2]) - parseInt(rangeMatch[1]) + 1,
          );
        } else if (andMatch) {
          remaining = 2;
        } else if (countMatch) {
          remaining = Math.max(1, parseInt(countMatch[1]));
        }
        return remaining;
      };

      if (teksSebelumOpsi.includes("\n\n")) {
        let paragraf = teksSebelumOpsi.split(/\n\s*\n/);
        pertanyaan = paragraf.pop().trim();
        wacana = paragraf.join("\n\n").trim();

        sisaJatahWacana = hitungTargetWacana(wacana);
        wacanaTerakhir = wacana;
      } else {
        let linesInfo = teksSebelumOpsi
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        const firstLine = linesInfo[0] || "";
        const isWacanaMarker = /wacana|teks|kutipan|puisi|cerita|dialog/i.test(
          firstLine,
        );
        const isInstructionMarker =
          /perhatikan|cermatilah|bacalah|amatilah/i.test(firstLine);

        if (linesInfo.length >= 2 && (isWacanaMarker || isInstructionMarker)) {
          pertanyaan = linesInfo.pop().trim();
          wacana = linesInfo.join("\n").trim();

          sisaJatahWacana = hitungTargetWacana(wacana);
          wacanaTerakhir = wacana;
        } else {
          pertanyaan = linesInfo.join("\n").trim();

          if (sisaJatahWacana > 0) {
            wacana = wacanaTerakhir;
          } else {
            wacana = "";
            wacanaTerakhir = "";
          }
        }
      }

      if (sisaJatahWacana > 0) sisaJatahWacana--;

      if (wacana) {
        wacana = wacana.replace(
          /(untuk\s+(?:menjawab\s+)?soal\s+(?:nomor\s+)?\d+\s*(?:-|s\.?\/d\.?|sampai|s\/d|dan)\s*\d+)/gi,
          "untuk menjawab soal di bawah ini",
        );
        wacana = wacana.replace(
          /wacana\s+untuk\s+(?:menjawab\s+)?\d+\s+soal\s+di\s+bawah\s+ini:?/gi,
          "",
        );
        wacana = wacana.trim();
      }

      parsed.push({
        id: currentId,
        mapel: bulkMapel,
        kelas: bulkKelas,
        poin: parseFloat(String(bulkPoin).replace(",", ".")) || 0,
        wacana,
        pertanyaan,
        link_gambar: "",
        opsi_a:
          optA.text ||
          rawText
            .match(/(?:^|\n)\s*[aA][\.\)]\s*(.+?)(?=\n\s*[bB][\.\)]|$)/is)?.[1]
            ?.trim() ||
          "",
        opsi_b:
          optB.text ||
          rawText
            .match(/(?:^|\n)\s*[bB][\.\)]\s*(.+?)(?=\n\s*[cC][\.\)]|$)/is)?.[1]
            ?.trim() ||
          "",
        opsi_c:
          optC.text ||
          rawText
            .match(/(?:^|\n)\s*[cC][\.\)]\s*(.+?)(?=\n\s*[dD][\.\)]|$)/is)?.[1]
            ?.trim() ||
          "",
        opsi_d:
          optD.text ||
          rawText
            .match(/(?:^|\n)\s*[dD][\.\)]\s*(.+?)(?=\n\s*[eE][\.\)]|$)/is)?.[1]
            ?.trim() ||
          "",
        opsi_e:
          optE.text ||
          rawText.match(/(?:^|\n)\s*[eE][\.\)]\s*(.+?)(?=$)/is)?.[1]?.trim() ||
          "",
        jawaban_benar: kunci,
        guru_pembuat: namaGuruLog,
      });
    }

    setParsedBulkData(parsed);
  };

  // ==========================================
  // FUNGSI MALAS: BACA FILE WORD/TXT OTOMATIS
  // ==========================================
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsReadingFile(true);
    try {
      const fileExt = file.name.split(".").pop().toLowerCase();

      if (fileExt === "docx") {
        const arrayBuffer = await file.arrayBuffer();

        // 1. KUNCI PERUBAHAN: Gunakan convertToHtml agar format list (1,2,3 / A,B,C) tidak hilang
        const result = await mammoth.convertToHtml({ arrayBuffer });

        // 2. Buat wadah virtual untuk menerjemahkan HTML kembali menjadi Teks biasa
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = result.value;

        let extractedText = "";

        // 3. Looping PINTAR untuk mendeteksi mana Soal dan mana Opsi
        Array.from(tempDiv.children).forEach((el) => {
          if (el.tagName === "P") {
            extractedText += el.innerText + "\n";
          } else if (el.tagName === "OL" || el.tagName === "UL") {
            const lis = Array.from(el.children).filter(
              (c) => c.tagName === "LI",
            );

            lis.forEach((li, idx) => {
              const childList = li.querySelector("ol, ul");
              if (childList) {
                // KASUS A: Nested List (Soal dan Opsi menyatu di Word)
                const questionClone = li.cloneNode(true);
                const innerLists = questionClone.querySelectorAll("ol, ul");
                innerLists.forEach((il) => il.remove()); // Buang opsi sementara

                extractedText += `${idx + 1}. ${questionClone.innerText.trim()}\n`;

                Array.from(childList.children).forEach((optLi, optIdx) => {
                  const letter = String.fromCharCode(65 + optIdx); // 65 adalah kode ASCII untuk 'A'
                  extractedText += `${letter}. ${optLi.innerText.trim()}\n`;
                });
              } else {
                // KASUS B: Flat List (Soal dan Opsi terpisah paragrafnya)
                // TRIK: Jika list ini berisi 2 hingga 5 baris, sistem menebak ini adalah OPSI JAWABAN (A, B, C, D, E)
                if (lis.length >= 2 && lis.length <= 5) {
                  const letter = String.fromCharCode(65 + idx);
                  extractedText += `${letter}. ${li.innerText.trim()}\n`;
                } else {
                  // Jika listnya panjang tak wajar atau sendirian, jadikan angka biasa
                  extractedText += `${idx + 1}. ${li.innerText.trim()}\n`;
                }
              }
            });
          } else {
            extractedText += el.innerText + "\n";
          }
          extractedText += "\n"; // Jarak antar paragraf
        });

        // 4. Bersihkan spasi kosong yang berlebihan agar rapi
        extractedText = extractedText.replace(/\n{3,}/g, "\n\n");

        setBulkText(extractedText.trim());
        showAlert(
          "success",
          "Berhasil Ekstrak",
          "Auto-Numbering Word berhasil dikembalikan ke teks!",
        );
      } else if (fileExt === "txt") {
        const text = await file.text();
        setBulkText(text);
        showAlert(
          "success",
          "Berhasil Ekstrak",
          "Teks berhasil disalin otomatis.",
        );
      } else {
        showAlert(
          "warning",
          "Format Ditolak",
          "Silakan upload file Microsoft Word (.docx) atau Text (.txt).",
        );
      }
    } catch (error) {
      showAlert("danger", "Gagal Membaca File", "Detail: " + error.message);
    } finally {
      setIsReadingFile(false);
      e.target.value = null;
    }
  };

  const handleSaveBulk = async () => {
    if (parsedBulkData.length === 0) return;
    setIsSaving(true);
    setBulkProgress(0);

    try {
      const savedItems = [];
      for (let i = 0; i < parsedBulkData.length; i++) {
        const payloadToSave = {
          ...parsedBulkData[i],
          id: parseInt(parsedBulkData[i].id),
          poin:
            parseFloat(String(parsedBulkData[i].poin).replace(",", ".")) || 0,
        };

        const res = await api.create(currentConfig.sheet, payloadToSave);
        if (res && res.error)
          throw new Error(
            `Airtable menolak Soal ke-${i + 1}. Detail: ${JSON.stringify(res.error)}`,
          );

        savedItems.push(payloadToSave);
        setBulkProgress(i + 1);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      pushAction({ type: "BULK_CREATE", items: savedItems });
      await fetchData(false);
      showAlert(
        "info",
        "Berhasil!",
        `Menyimpan ${parsedBulkData.length} soal selesai.`,
      );
      setIsBulkOpen(false);
      setBulkText("");
      setParsedBulkData([]);
    } catch (error) {
      showAlert("danger", "Gagal Import Massal!", error.message);
    } finally {
      setIsSaving(false);
      setBulkProgress(0);
    }
  };

  const processedData = useMemo(() => {
    let result = [...data];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(s),
        ),
      );
    }
    Object.keys(filters).forEach((filterKey) => {
      if (filters[filterKey]) {
        result = result.filter(
          (item) =>
            String(item[filterKey] || "").toLowerCase() ===
            String(filters[filterKey]).toLowerCase(),
        );
      }
    });
    result.sort(
      (a, b) => (parseInt(a.id, 10) || 0) - (parseInt(b.id, 10) || 0),
    );
    return result;
  }, [data, search, filters]);

  // VARIABEL DATA ANTI-CHEAT
  const lockedSessions = sesiUjianData.filter((s) => s.status === "LOCKED");
  const disqualifiedSessions = processedData.filter(
    (d) =>
      tab === "nilai" && String(d.status).toLowerCase() === "diskualifikasi",
  );

  const isAllSelected =
    processedData.length > 0 && selectedIds.length === processedData.length;
  const handleSelectAll = () => {
    if (isAllSelected) setSelectedIds([]);
    else setSelectedIds(processedData.map((item) => item.id));
  };
  const toggleSelect = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );

  const renderBankSoal = () => {
    if (processedData.length === 0)
      return (
        <div className="py-20 text-center text-slate-400 font-semibold text-lg bg-white rounded-[2rem] border border-slate-200 shadow-sm w-full">
          Tidak ada soal ditemukan.
        </div>
      );

    let elements = [];
    for (let i = 0; i < processedData.length; i++) {
      const s = processedData[i];
      const isSelected = selectedIds.includes(s.id);
      const isWacanaSama =
        i > 0 && processedData[i - 1].wacana === s.wacana && s.wacana !== "";
      const isAwalWacana = s.wacana && !isWacanaSama;

      if (isAwalWacana) {
        let bundleCount = 1;
        for (let j = i + 1; j < processedData.length; j++) {
          if (processedData[j].wacana === s.wacana) bundleCount++;
          else break;
        }
        elements.push(
          <div
            key={`wacana-header-${s.id}`}
            className="mt-8 mb-2 w-full relative z-0"
          >
            <div className="p-4 md:p-8 bg-blue-50/80 border border-blue-200 rounded-[1.5rem] md:rounded-[2rem] relative shadow-sm">
              <div className="absolute -top-3.5 left-6 bg-linear-to-r from-blue-600 to-blue-500 text-white px-3 md:px-4 py-1.5 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-md border border-blue-400">
                <BookOpen size={14} /> WACANA TERIKAT PADA {bundleCount} SOAL
              </div>
              <p className="font-medium text-slate-700 leading-relaxed text-sm md:text-base whitespace-pre-wrap mt-2">
                {s.wacana}
              </p>
            </div>
            <div className="w-1.5 h-8 bg-blue-200 ml-12 absolute -bottom-8 rounded-full z-0"></div>
          </div>,
        );
      } else if (isWacanaSama) {
        elements.push(
          <div
            key={`connector-${s.id}`}
            className="w-1.5 h-8 bg-blue-200 ml-12 -my-2 relative z-0 rounded-full"
          ></div>,
        );
      }

      elements.push(
        <Card
          key={`soal-${s.id}`}
          className={`p-5 md:p-8 border-t-[6px] transition-all relative group overflow-hidden bg-white rounded-[1.5rem] md:rounded-[2rem] z-10 w-full ${isSelected ? "border-t-red-500 ring-4 ring-red-500/10 shadow-lg" : s.wacana ? "border-t-blue-500" : "border-t-emerald-500"}`}
        >
          <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10">
            <button
              onClick={() => toggleSelect(s.id)}
              className={`flex items-center justify-center p-1.5 rounded-lg transition-all ${isSelected ? "bg-red-50 text-red-500" : "bg-slate-50 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 border border-slate-200"}`}
            >
              {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
            </button>
          </div>

          <div className="absolute top-4 right-4 md:top-6 md:right-6 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-20">
            <label
              className={`p-1.5 md:p-2 bg-white border border-emerald-200 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all shadow-sm cursor-pointer ${uploadingImgId === s.id ? "opacity-50 cursor-wait" : ""}`}
              title="Sisipkan Gambar"
            >
              {uploadingImgId === s.id ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <ImagePlus size={16} />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingImgId === s.id}
                onChange={(e) => handleInlineImageUpload(e, s)}
              />
            </label>
            <button
              onClick={() => handleDuplicate(s)}
              className="p-1.5 md:p-2 bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-500 hover:text-white transition-all shadow-sm"
              title="Duplikat"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={() => openEditModal(s)}
              className="p-1.5 md:p-2 bg-white border border-amber-200 text-amber-600 rounded-lg hover:bg-amber-500 hover:text-white transition-all shadow-sm"
              title="Edit Teks Soal"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => handleDelete(s.id)}
              className="p-1.5 md:p-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm"
              title="Hapus Soal"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 items-center mb-6 pl-10 pr-24 md:pl-12 md:pr-40">
            <span
              className={`font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-md text-[9px] md:text-[10px] uppercase border ${isSelected ? "bg-red-50 border-red-200 text-red-600" : "bg-slate-100 border-slate-200 text-slate-500"}`}
            >
              #{s.id}
            </span>
            <span className="bg-amber-50 text-amber-700 font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-md text-[9px] md:text-[10px] uppercase border border-amber-200 flex items-center gap-1">
              <Target size={12} /> {formatPoinDisplay(s.poin)} POIN
            </span>
            <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-md text-[9px] md:text-[10px] uppercase border border-emerald-200">
              {s.mapel} | {s.kelas}
            </span>
            {s.wacana && (
              <span className="bg-blue-50 text-blue-700 font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-md text-[9px] md:text-[10px] uppercase border border-blue-200 flex items-center gap-1">
                <Link2 size={12} /> Terikat Wacana
              </span>
            )}
            {s.guru_pembuat && (
              <span className="bg-slate-50 text-slate-500 font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-md text-[9px] md:text-[10px] uppercase border border-slate-200">
                👤 {s.guru_pembuat}
              </span>
            )}
          </div>

          <p className="font-semibold text-slate-800 leading-relaxed text-sm md:text-base mb-6 whitespace-pre-wrap">
            {s.pertanyaan}
          </p>

          {s.link_gambar && (
            <div className="mb-6 max-w-lg rounded-xl border border-slate-200 shadow-sm p-2 bg-slate-50 relative group/img w-max">
              <button
                onClick={() => handleRemoveInlineImage(s)}
                disabled={uploadingImgId === s.id}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity shadow-md hover:bg-red-600 z-10 disabled:opacity-0"
                title="Copot Gambar"
              >
                <X size={14} />
              </button>
              <img
                src={s.link_gambar}
                alt="Lampiran"
                className={`max-h-56 object-contain rounded-lg ${uploadingImgId === s.id ? "opacity-50" : ""}`}
              />
              {uploadingImgId === s.id && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <RefreshCw
                    className="animate-spin text-emerald-600 drop-shadow"
                    size={32}
                  />
                </div>
              )}
            </div>
          )}
          {!s.link_gambar && uploadingImgId === s.id && (
            <div className="mb-6 max-w-lg h-32 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 flex items-center justify-center">
              <RefreshCw className="animate-spin text-emerald-600" size={24} />
              <span className="ml-2 text-sm font-bold text-emerald-700">
                Menganalisa & Mengunggah...
              </span>
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            {["A", "B", "C", "D", "E"].map((opt) => {
              const keyMap = `opsi_${opt.toLowerCase()}`;
              const isCorrect = String(s.jawaban_benar).toUpperCase() === opt;
              if (!s[keyMap]) return null;
              return (
                <div
                  key={opt}
                  className={`px-4 py-2.5 md:px-5 md:py-3 rounded-xl border flex items-start gap-3 transition-all ${isCorrect ? "bg-emerald-50 border-emerald-300 shadow-sm" : "bg-white border-slate-200"}`}
                >
                  <span
                    className={`font-bold text-xs md:text-sm w-5 flex-shrink-0 pt-0.5 ${isCorrect ? "text-emerald-700" : "text-slate-400"}`}
                  >
                    {opt}.
                  </span>
                  <span
                    className={`text-xs md:text-sm font-medium leading-relaxed whitespace-pre-wrap ${isCorrect ? "text-emerald-900" : "text-slate-600"}`}
                  >
                    {s[keyMap]}
                  </span>
                  {isCorrect && (
                    <CheckCircle2
                      size={16}
                      className="text-emerald-500 ml-auto shrink-0 mt-0.5"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Card>,
      );
    }
    return elements;
  };

  const pivotNilaiData = useMemo(() => {
    if (tab !== "nilai") return { data: [], mapels: [] };
    const mapels = [
      ...new Set(data.map((item) => item.mapel).filter(Boolean)),
    ].sort();
    const grouped = {};
    data.forEach((row) => {
      if (!row.nama_siswa) return;
      const key = `${row.nama_siswa}_${row.kelas}`;
      const mapelKey = row.mapel;
      if (!grouped[key])
        grouped[key] = { nama_siswa: row.nama_siswa, kelas: row.kelas };
      if (grouped[key][mapelKey] === undefined)
        grouped[key][mapelKey] = parseFloat(row.skor) || 0;
    });
    const finalData = Object.values(grouped).map((student) => {
      let total = 0,
        count = 0;
      mapels.forEach((m) => {
        if (student[m] !== undefined) {
          total += student[m];
          count++;
        }
      });
      student.RataRata = count > 0 ? (total / count).toFixed(1) : 0;
      return student;
    });
    finalData.sort((a, b) => {
      const classCmp = String(a.kelas).localeCompare(String(b.kelas));
      if (classCmp !== 0) return classCmp;
      return String(a.nama_siswa).localeCompare(String(b.nama_siswa));
    });
    let filteredPivot = finalData;
    if (search)
      filteredPivot = filteredPivot.filter((s) =>
        s.nama_siswa.toLowerCase().includes(search.toLowerCase()),
      );
    if (filters.kelas)
      filteredPivot = filteredPivot.filter((s) =>
        String(s.kelas).toLowerCase().includes(filters.kelas.toLowerCase()),
      );
    return { data: filteredPivot, mapels };
  }, [data, tab, search, filters.kelas]);

  const getFilterOptions = (key) =>
    [...new Set(data.map((item) => item[key]))].filter(Boolean).sort();

  const statsNilai = useMemo(() => {
    if (
      tab !== "nilai" ||
      nilaiViewMode !== "rekap" ||
      pivotNilaiData.data.length === 0
    )
      return null;
    const scores = pivotNilaiData.data.map(
      (item) => parseFloat(item.RataRata) || 0,
    );
    const totalScore = scores.reduce((a, b) => a + b, 0);
    let totalRemedial = 0;
    pivotNilaiData.data.forEach((item) => {
      const isRemedy = pivotNilaiData.mapels.some(
        (m) => item[m] !== undefined && item[m] < KKM_SCORE,
      );
      if (isRemedy) totalRemedial++;
    });
    return {
      rataRata: (totalScore / scores.length).toFixed(1),
      tertinggi: Math.max(...scores),
      terendah: Math.min(...scores),
      remedial: totalRemedial,
    };
  }, [pivotNilaiData, tab, nilaiViewMode]);

  const handleExport = async (type) => {
    setIsExportMenuOpen(false); // Tutup modal jika terbuka
    let dataToExport = [];
    let mapelsToExport = [];
    let isLogMode = tab === "nilai" && nilaiViewMode === "log";

    // 1. KUMPULKAN DATA (Cerdas Mendeteksi Lokasi Tab)
    if (tab === "nilai") {
      if (isLogMode) {
        if (processedData.length === 0)
          return showAlert(
            "warning",
            "Kosong",
            "Tidak ada log ujian untuk dicetak!",
          );
        dataToExport = processedData;
      } else {
        if (pivotNilaiData.data.length === 0)
          return showAlert(
            "warning",
            "Kosong",
            "Tidak ada nilai untuk dicetak!",
          );
        dataToExport = pivotNilaiData.data;
        mapelsToExport = pivotNilaiData.mapels;
      }
    } else {
      // JIKA DI TAB SOAL: Tarik data nilai secara diam-diam dari Backend
      showAlert(
        "info",
        "Sinkronisasi...",
        "Menarik rekap nilai dari server di latar belakang...",
      );
      try {
        const dataNilai = await api.read("Nilai");
        if (!dataNilai || dataNilai.length === 0) {
          return showAlert(
            "warning",
            "Kosong",
            "Belum ada data nilai ujian yang masuk.",
          );
        }
        const mapels = [
          ...new Set(dataNilai.map((item) => item.mapel).filter(Boolean)),
        ].sort();
        const grouped = {};
        dataNilai.forEach((row) => {
          if (!row.nama_siswa) return;
          const key = `${row.nama_siswa}_${row.kelas}`;
          if (!grouped[key])
            grouped[key] = { nama_siswa: row.nama_siswa, kelas: row.kelas };
          grouped[key][row.mapel] = parseFloat(row.skor) || 0;
        });

        dataToExport = Object.values(grouped).map((student) => {
          let total = 0,
            count = 0;
          mapels.forEach((m) => {
            if (student[m] !== undefined) {
              total += student[m];
              count++;
            }
          });
          student.RataRata = count > 0 ? (total / count).toFixed(1) : 0;
          return student;
        });
        dataToExport.sort(
          (a, b) =>
            String(a.kelas).localeCompare(String(b.kelas)) ||
            String(a.nama_siswa).localeCompare(String(b.nama_siswa)),
        );
        mapelsToExport = mapels;
        closeAlert();
      } catch (err) {
        return showAlert("danger", "Gagal Menarik Data", err.message);
      }
    }

    // 2. LOGIKA GENERATE PDF & PRINT (HTML Dibuat Manual, Bebas Tab)
    if (type === "print" || type === "pdf") {
      const title = isLogMode
        ? "LOG RIWAYAT UJIAN SISWA"
        : "REKAPITULASI BUKU NILAI SISWA";
      const subtitle = `Total Data: ${dataToExport.length} | Waktu Cetak: ${new Date().toLocaleString("id-ID")}`;

      let tableHtml = `<table border="1" style="width:100%; border-collapse: collapse; text-align: center; margin-top: 15px; font-size: 10pt;">`;
      if (isLogMode) {
        tableHtml += `<thead><tr><th style="padding:8px; background:#f1f5f9;">ID</th><th style="padding:8px; background:#f1f5f9; text-align:left;">Nama Siswa</th><th style="padding:8px; background:#f1f5f9;">Kelas</th><th style="padding:8px; background:#f1f5f9;">Mapel</th><th style="padding:8px; background:#f1f5f9;">Skor</th><th style="padding:8px; background:#f1f5f9;">Status</th></tr></thead><tbody>`;
        dataToExport.forEach((item) => {
          tableHtml += `<tr><td style="padding:8px;">${item.id || "-"}</td><td style="padding:8px; text-align:left; font-weight:bold;">${item.nama_siswa || "-"}</td><td style="padding:8px;">${item.kelas || "-"}</td><td style="padding:8px;">${item.mapel || "-"}</td><td style="padding:8px; font-weight:bold;">${item.skor || "-"}</td><td style="padding:8px;">${item.status || "-"}</td></tr>`;
        });
      } else {
        tableHtml += `<thead><tr><th style="padding:8px; background:#f1f5f9;">No</th><th style="padding:8px; background:#f1f5f9; text-align:left;">Nama Siswa</th><th style="padding:8px; background:#f1f5f9;">Kelas</th>`;
        mapelsToExport.forEach(
          (m) =>
            (tableHtml += `<th style="padding:8px; background:#f1f5f9;">${m}</th>`),
        );
        tableHtml += `<th style="padding:8px; background:#d1fae5;">Rata-Rata</th></tr></thead><tbody>`;
        dataToExport.forEach((item, idx) => {
          tableHtml += `<tr><td style="padding:8px;">${idx + 1}</td><td style="padding:8px; text-align:left; font-weight:bold; text-transform:uppercase;">${item.nama_siswa}</td><td style="padding:8px;">${item.kelas}</td>`;
          mapelsToExport.forEach(
            (m) =>
              (tableHtml += `<td style="padding:8px;">${item[m] !== undefined ? item[m] : "-"}</td>`),
          );
          tableHtml += `<td style="padding:8px; font-weight:bold;">${item.RataRata}</td></tr>`;
        });
      }
      tableHtml += `</tbody></table>`;

      const printContent = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Cetak Data</title><style>@page { size: auto; margin: 15mm; } body { font-family: Arial, sans-serif; color: #000; } .header { text-align: center; margin-bottom: 20px; } .header h1 { margin:0 0 5px 0; font-size: 20pt; text-transform: uppercase; border-bottom: 2px solid #000; display: inline-block; padding-bottom: 5px; } .header p { margin:0; font-size: 11pt; color: #444; }</style></head><body><div class="header"><h1>${title}</h1><p>${subtitle}</p></div>${tableHtml}</body></html>`;

      let printIframe = document.getElementById("print-iframe-cerdas");
      if (!printIframe) {
        printIframe = document.createElement("iframe");
        printIframe.id = "print-iframe-cerdas";
        printIframe.style.cssText =
          "position:absolute; width:0; height:0; border:none;";
        document.body.appendChild(printIframe);
      }
      printIframe.contentWindow.document.open();
      printIframe.contentWindow.document.write(printContent);
      printIframe.contentWindow.document.close();
      printIframe.contentWindow.focus();
      setTimeout(() => printIframe.contentWindow.print(), 500);
      return;
    }

    // 3. LOGIKA GENERATE EXCEL & WORD
    let exportHeaders = [];
    let exportDataMatrix = [];
    let wscols = [];
    let fileName = isLogMode ? "Log_Riwayat_Ujian" : "Rekap_Nilai_Siswa";

    if (isLogMode) {
      exportHeaders = currentConfig.columns.map((c) => c.label);
      exportDataMatrix = dataToExport.map((item) =>
        currentConfig.columns.map((c) => item[c.key] || "-"),
      );
      wscols = exportHeaders.map(() => ({ wch: 20 }));
    } else {
      exportHeaders = [
        "No",
        "Nama Murid",
        "Kelas",
        ...mapelsToExport,
        "Rata-Rata",
      ];
      exportDataMatrix = dataToExport.map((item, idx) => [
        idx + 1,
        item.nama_siswa,
        item.kelas,
        ...mapelsToExport.map((m) => (item[m] !== undefined ? item[m] : "-")),
        item.RataRata,
      ]);
      wscols = [
        { wch: 5 },
        { wch: 35 },
        { wch: 15 },
        ...mapelsToExport.map(() => ({ wch: 15 })),
        { wch: 15 },
      ];
    }

    if (type === "xls") {
      const worksheet = XLSX.utils.aoa_to_sheet([
        exportHeaders,
        ...exportDataMatrix,
      ]);
      worksheet["!cols"] = wscols;
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        isLogMode ? "Log Ujian" : "Rekap Nilai",
      );
      XLSX.writeFile(workbook, `${fileName}_${new Date().getTime()}.xlsx`);
    } else if (type === "doc") {
      try {
        const headerCells = exportHeaders.map(
          (text) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: String(text), bold: true })],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
            }),
        );
        const dataRows = exportDataMatrix.map(
          (rowData) =>
            new TableRow({
              children: rowData.map(
                (text, cIdx) =>
                  new TableCell({
                    children: [
                      new Paragraph({
                        text: String(text),
                        alignment:
                          cIdx === 1
                            ? AlignmentType.LEFT
                            : AlignmentType.CENTER,
                      }),
                    ],
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  }),
              ),
            }),
        );
        const docTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: headerCells, tableHeader: true }),
            ...dataRows,
          ],
        });
        const doc = new Document({
          sections: [
            {
              properties: {
                page: {
                  size: {
                    orientation:
                      exportHeaders.length > 5 ? "landscape" : "portrait",
                  },
                },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: isLogMode
                        ? "LOG RIWAYAT UJIAN SISWA"
                        : "REKAPITULASI NILAI AKADEMIK",
                      bold: true,
                      size: 28,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 400 },
                }),
                docTable,
              ],
            },
          ],
        });
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${fileName}_${new Date().getTime()}.docx`);
      } catch (error) {
        showAlert(
          "danger",
          "Kesalahan",
          "Terjadi kesalahan saat membuat DOCX.",
        );
      }
    }
  };

  return (
    <Dashboard menu={MENU_ITEMS} active={tab} setActive={setTab}>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-6 max-w-7xl mx-auto pb-24 relative"
      >
        <style type="text/css">{`
          @keyframes gradientBG { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
          .header-live-bg { background: linear-gradient(-45deg, #d1fae5, #fef3c7, #ecfdf5, #f0fdfa); background-size: 400% 400%; animation: gradientBG 15s ease infinite; }
        `}</style>

        {/* ============================================================== */}
        {/* BANNER PERINGATAN GLOBAL (Jika Ada Siswa Terkunci - ANTI CHEAT) */}
        {/* ============================================================== */}
        <AnimatePresence>
          {lockedSessions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              // z-[45] memastikannya berada di bawah menu hamburger (z-50)
              className="fixed bottom-4 md:bottom-8 right-4 md:right-8 z-[45] max-w-[calc(100vw-2rem)] md:max-w-sm"
            >
              <div className="bg-gradient-to-r from-red-600 to-red-500 text-white p-3 md:p-4 rounded-[1.5rem] shadow-2xl shadow-red-500/30 flex items-center gap-3 md:gap-4 border border-red-400">
                <div className="bg-white/20 p-2 rounded-full shrink-0 animate-pulse">
                  <ShieldAlert size={20} className="md:w-6 md:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm md:text-base leading-tight truncate">
                    Siswa Curang!
                  </p>
                  <p className="text-[10px] md:text-xs font-medium text-red-100 truncate mt-0.5">
                    {lockedSessions.length} perangkat dikunci.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setTab("nilai");
                    setNilaiViewMode("pelanggaran");
                    window.scrollTo(0, 0);
                  }}
                  className="shrink-0 bg-white text-red-600 px-3 py-2 md:px-4 md:py-2.5 rounded-xl font-bold text-xs md:text-sm hover:scale-105 active:scale-95 transition-all shadow-sm border border-red-100"
                >
                  Tindak
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================== */}
        {/* TAMPILAN M-BANKING (KHUSUS HP) - SAT SET SAT SET */}
        {/* ============================================================== */}
        <div className="md:hidden space-y-4 mb-2">
          {/* 1. Kartu Identitas & Saldo */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-3xl p-5 text-white shadow-lg shadow-emerald-600/30 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-center relative z-10 mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-80 font-bold mb-0.5">
                  Selamat Datang,
                </p>
                <h2 className="text-xl font-black leading-tight">
                  {namaGuruLog}
                </h2>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                <Target size={20} className="text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 relative z-10">
              <div className="bg-black/20 rounded-2xl p-3 backdrop-blur-sm border border-white/10">
                <p className="text-[10px] uppercase tracking-widest opacity-80 font-bold mb-1">
                  Total Soal
                </p>
                <p className="text-2xl font-black">{data.length}</p>
              </div>
              <div className="bg-black/20 rounded-2xl p-3 backdrop-blur-sm border border-white/10">
                <p className="text-[10px] uppercase tracking-widest opacity-80 font-bold mb-1">
                  Siswa Sudah Ujian
                </p>
                <p className="text-2xl font-black">
                  {pivotNilaiData?.data?.length || 0}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Grid Menu M-Banking (Tombol Besar) */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
              Menu
            </h3>
            <div className="grid grid-cols-4 gap-y-6 gap-x-2">
              <button
                onClick={() => {
                  setTab("soal");
                  openAddModal();
                }}
                className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-[1rem] flex items-center justify-center shadow-inner">
                  <Plus size={24} />
                </div>
                <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">
                  Buat
                  <br />
                  Soal
                </span>
              </button>

              <button
                onClick={() => {
                  setTab("soal");
                  setIsBulkOpen(true);
                }}
                className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-[1rem] flex items-center justify-center shadow-inner">
                  <UploadCloud size={24} />
                </div>
                <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">
                  Import Soal
                  <br />
                  (Sekaligus)
                </span>
              </button>

              <button
                onClick={() => {
                  setTab("soal");
                  setTimeout(
                    () => window.scrollTo({ top: 600, behavior: "smooth" }),
                    100,
                  );
                }}
                className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-[1rem] flex items-center justify-center shadow-inner">
                  <Layers size={24} />
                </div>
                <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">
                  Daftar
                  <br />
                  Soal
                </span>
              </button>

              <button
                onClick={() => {
                  setTab("nilai");
                  setNilaiViewMode("rekap");
                  setTimeout(
                    () => window.scrollTo({ top: 600, behavior: "smooth" }),
                    100,
                  );
                }}
                className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-[1rem] flex items-center justify-center shadow-inner">
                  <TableProperties size={24} />
                </div>
                <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">
                  Buku
                  <br />
                  Nilai
                </span>
              </button>

              <button
                onClick={() => {
                  setTab("nilai");
                  setNilaiViewMode("log");
                  setTimeout(
                    () => window.scrollTo({ top: 600, behavior: "smooth" }),
                    100,
                  );
                }}
                className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-[1rem] flex items-center justify-center shadow-inner">
                  <LayoutList size={24} />
                </div>
                <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">
                  Log
                  <br />
                  Riwayat
                </span>
              </button>

              <button
                onClick={() => {
                  setTab("nilai");
                  setNilaiViewMode("pelanggaran");
                  setTimeout(
                    () => window.scrollTo({ top: 600, behavior: "smooth" }),
                    100,
                  );
                }}
                className="flex flex-col items-center gap-2 active:scale-95 transition-transform relative"
              >
                {lockedSessions.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse border-2 border-white">
                    {lockedSessions.length}
                  </span>
                )}
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-[1rem] flex items-center justify-center shadow-inner">
                  <ShieldAlert size={24} />
                </div>
                <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">
                  Pelanggaran
                  <br />
                  Siswa
                </span>
              </button>

              {/* TOMBOL SMART EXPORT YANG BARU */}
              <button
                onClick={() => setIsExportMenuOpen(true)}
                className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-[1rem] flex items-center justify-center shadow-inner">
                  <Download size={24} />
                </div>
                <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">
                  Unduh /<br />
                  Cetak
                </span>
              </button>

              <button
                onClick={() => fetchData(false)}
                className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 bg-slate-50 border border-slate-200 text-slate-500 rounded-[1rem] flex items-center justify-center">
                  <RefreshCw
                    size={24}
                    className={loading || isSyncing ? "animate-spin" : ""}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">
                  Refresh
                  <br />
                  Data
                </span>
              </button>
            </div>
          </div>

          {/* 3. Bar Pencarian Pintas HP Mobile Smart */}
          <div className="space-y-3">
            {/* Baris 1: Pencarian & Tombol Filter (Gaya E-Commerce) */}
            <div className="flex gap-2">
              <div className="flex-1 bg-white rounded-2xl p-2.5 shadow-sm border border-slate-100 flex items-center gap-2">
                <Search className="text-slate-400 ml-2 shrink-0" size={18} />
                <input
                  className="w-full bg-transparent border-none outline-none font-bold text-sm text-slate-700 py-1.5 placeholder:text-slate-400 placeholder:font-medium"
                  placeholder={
                    tab === "soal" ? "Cari soal..." : "Cari siswa..."
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="bg-white text-slate-600 p-3.5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center relative hover:bg-slate-50 transition-colors"
              >
                <ListChecks size={20} />
                {Object.values(filters).some(Boolean) && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </button>
            </div>

            {/* Baris 2: Undo/Redo & Aksi Massal (Khusus Tab Bank Soal) */}
            {tab === "soal" && (
              <div className="flex justify-between items-center gap-2">
                {/* Undo Redo Mini */}
                <div className="flex bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden shrink-0">
                  <button
                    onClick={handleUndo}
                    disabled={isDoingHistory || actionHistory.undo.length === 0}
                    className="p-2.5 text-slate-500 disabled:opacity-30 hover:bg-emerald-50 border-r border-slate-100 transition-colors"
                  >
                    <Undo size={16} />
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={isDoingHistory || actionHistory.redo.length === 0}
                    className="p-2.5 text-slate-500 disabled:opacity-30 hover:bg-emerald-50 transition-colors"
                  >
                    <Redo size={16} />
                  </button>
                </div>

                {/* Pilih Semua & Sapu Bersih Mini */}
                {processedData.length > 0 && (
                  <div className="flex gap-2 flex-1">
                    <button
                      onClick={handleSelectAll}
                      className={`flex-1 flex justify-center items-center gap-1.5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider border transition-colors ${isAllSelected ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-inner" : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"}`}
                    >
                      {isAllSelected ? (
                        <CheckSquare size={14} />
                      ) : (
                        <Square size={14} />
                      )}
                      {isAllSelected ? "Batal" : "Semua"}
                    </button>
                    <button
                      onClick={handleDeleteAll}
                      disabled={isDeletingBulk}
                      className="flex-1 flex justify-center items-center gap-1.5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider border bg-red-50 border-red-100 text-red-600 disabled:opacity-50 hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <Trash2 size={14} /> Bersihkan
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Pemisah / Label Scroll */}
          <div className="flex justify-center items-center mt-6 mb-2">
            <div className="bg-slate-200 h-1 w-12 rounded-full mb-2"></div>
          </div>
        </div>

        {/* HEADER ELEGAN (DISEMBUNYIKAN DI HP) */}
        <motion.header
          variants={fadeUp}
          className="hidden md:flex relative flex-col md:flex-row justify-between items-start md:items-center p-6 md:p-8 rounded-[2rem] shadow-sm border border-emerald-100/50 gap-4 overflow-hidden header-live-bg z-0"
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

          <div className="w-full md:w-auto text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                {currentConfig.title}
              </h2>
              {isSyncing && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold uppercase tracking-wider animate-pulse border border-amber-200">
                  <RefreshCw size={10} className="animate-spin" /> Sync
                </span>
              )}
            </div>
            <p className="text-slate-600 font-medium text-sm mt-1">
              {currentConfig.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap w-full md:w-auto gap-2 z-10">
            {tab === "soal" && (
              <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-auto items-center">
                {/* TOOLBAR UNDO & REDO */}
                <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full md:w-auto justify-center">
                  <button
                    onClick={handleUndo}
                    disabled={isDoingHistory || actionHistory.undo.length === 0}
                    className="p-3 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-30 disabled:hover:bg-white transition-all border-r border-slate-100"
                    title="Undo (Batal Aksi Terakhir)"
                  >
                    {isDoingHistory ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : (
                      <Undo size={18} />
                    )}
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={isDoingHistory || actionHistory.redo.length === 0}
                    className="p-3 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-30 disabled:hover:bg-white transition-all"
                    title="Redo (Ulangi Aksi)"
                  >
                    {isDoingHistory ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : (
                      <Redo size={18} />
                    )}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setBulkMapel("");
                    setBulkKelas("");
                    setBulkText("");
                    setBulkPoin("2");
                    setParsedBulkData([]);
                    setIsBulkOpen(true);
                  }}
                  className="flex-1 md:flex-none bg-white text-emerald-700 border border-emerald-200 px-5 py-3 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-emerald-50 active:scale-95 transition-all text-sm"
                >
                  <FileText size={18} /> Import Massal
                </button>
                <button
                  onClick={openAddModal}
                  className="flex-1 md:flex-none bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-5 py-3 rounded-xl font-bold shadow-md shadow-emerald-500/30 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all text-sm border border-emerald-400"
                >
                  <Plus size={18} /> Buat Manual
                </button>
              </div>
            )}

            {tab === "nilai" && (
              <div className="grid grid-cols-2 md:flex md:flex-wrap w-full md:w-auto gap-2 mt-4 md:mt-0">
                <button
                  onClick={() => handleExport("print")}
                  className="flex justify-center items-center gap-2 md:gap-1.5 px-4 py-3 md:py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors shadow-sm w-full md:w-auto"
                >
                  <Printer size={16} className="md:w-3.5 md:h-3.5" /> Print
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="flex justify-center items-center gap-2 md:gap-1.5 px-4 py-3 md:py-2.5 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 text-xs font-bold rounded-xl transition-colors shadow-sm w-full md:w-auto"
                >
                  <Download size={16} className="md:w-3.5 md:h-3.5" /> PDF
                </button>
                <button
                  onClick={() => handleExport("xls")}
                  className="flex justify-center items-center gap-2 md:gap-1.5 px-4 py-3 md:py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 text-xs font-bold rounded-xl transition-colors shadow-sm w-full md:w-auto"
                >
                  <Download size={16} className="md:w-3.5 md:h-3.5" /> EXCEL
                </button>
                <button
                  onClick={() => handleExport("doc")}
                  className="flex justify-center items-center gap-2 md:gap-1.5 px-4 py-3 md:py-2.5 bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 text-xs font-bold rounded-xl transition-colors shadow-sm w-full md:w-auto"
                >
                  <Download size={16} className="md:w-3.5 md:h-3.5" /> WORD
                </button>
              </div>
            )}
          </div>
        </motion.header>

        {/* TOGGLE VIEW MODE & STATISTIK (KHUSUS NILAI + ANTI CHEAT) */}
        <AnimatePresence mode="wait">
          {tab === "nilai" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              {/* DI HP DISEMBUNYIKAN KARENA SUDAH ADA DI GRID M-BANKING */}
              <div className="hidden md:flex flex-col md:flex-row items-center w-full md:w-max p-1.5 bg-white border border-slate-200 rounded-xl mb-6 shadow-sm mx-auto md:mx-0 gap-1 md:gap-0">
                <button
                  onClick={() => setNilaiViewMode("rekap")}
                  className={`w-full md:w-auto flex justify-center items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${nilaiViewMode === "rekap" ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <TableProperties size={16} /> Buku Nilai
                </button>
                <button
                  onClick={() => setNilaiViewMode("log")}
                  className={`w-full md:w-auto flex justify-center items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${nilaiViewMode === "log" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <LayoutList size={16} /> Log Riwayat
                </button>
                <button
                  onClick={() => setNilaiViewMode("pelanggaran")}
                  className={`w-full md:w-auto flex justify-center items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${nilaiViewMode === "pelanggaran" ? "bg-red-500 text-white shadow-sm" : "text-red-500 hover:bg-red-50"}`}
                >
                  <ShieldAlert size={16} /> Control Anti-Cheat
                  {lockedSessions.length > 0 && (
                    <span className="bg-white text-red-600 px-1.5 py-0.5 rounded-md text-[10px] ml-1">
                      {lockedSessions.length}
                    </span>
                  )}
                </button>
              </div>

              {nilaiViewMode === "rekap" && statsNilai && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <Card className="p-5 md:p-6 border-none shadow-sm bg-gradient-to-br from-emerald-600 to-emerald-500 text-white rounded-[1.5rem] flex flex-col justify-center items-center sm:items-start">
                    <p className="text-[11px] font-bold uppercase tracking-widest opacity-80 mb-2">
                      Rata-Rata Umum
                    </p>
                    <div className="text-4xl md:text-4xl font-bold">
                      {statsNilai.rataRata}
                    </div>
                  </Card>
                  <Card className="p-5 md:p-6 border border-emerald-100 shadow-sm bg-emerald-50 rounded-[1.5rem] flex flex-col justify-center items-center sm:items-start">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600/80 mb-2">
                      Nilai Tertinggi
                    </p>
                    <div className="text-4xl md:text-4xl font-bold text-emerald-700">
                      {statsNilai.tertinggi}
                    </div>
                  </Card>
                  <Card className="p-5 md:p-6 border border-rose-100 shadow-sm bg-rose-50 rounded-[1.5rem] flex flex-col justify-center items-center sm:items-start">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-rose-600/80 mb-2 flex items-center gap-1">
                      Siswa Remedial{" "}
                      <span className="lowercase font-medium tracking-normal text-rose-500">
                        (&lt; {KKM_SCORE})
                      </span>
                    </p>
                    <div className="text-4xl md:text-4xl font-bold text-rose-600 flex items-center gap-3 mt-1">
                      <BarChart3 size={28} className="opacity-50" />{" "}
                      {statsNilai.remedial}
                    </div>
                  </Card>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* STATISTIK & TOOLBAR GLOBAL (Disembunyikan di mode Control Anti-Cheat) */}
        {!(tab === "nilai" && nilaiViewMode === "pelanggaran") && (
          <motion.div
            variants={fadeUp}
            className="hidden md:flex flex-col xl:flex-row gap-4"
          >
            <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 shadow-xl min-w-[200px] shrink-0 rounded-[2rem] relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Award size={56} className="text-amber-400" />
              </div>
              <div className="flex justify-between items-start relative z-10">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  Total{" "}
                  {tab === "nilai" && nilaiViewMode === "rekap"
                    ? "Siswa"
                    : "Data"}
                </p>
              </div>
              <div className="flex items-baseline gap-2 mt-3 relative z-10">
                <p className="text-4xl font-bold text-white">
                  {tab === "nilai" && nilaiViewMode === "rekap"
                    ? pivotNilaiData.data.length
                    : processedData.length}
                </p>
              </div>
            </Card>

            <Card className="flex-1 p-3 bg-white border border-slate-200 shadow-sm w-full rounded-[2rem] box-border flex flex-col justify-center">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full min-w-0 px-2 py-2">
                {tab === "soal" && processedData.length > 0 && (
                  <div className="flex gap-2 w-full md:w-auto shrink-0">
                    <button
                      onClick={handleSelectAll}
                      className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border ${isAllSelected ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-inner" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"}`}
                    >
                      {isAllSelected ? (
                        <CheckSquare size={16} />
                      ) : (
                        <ListChecks size={16} />
                      )}{" "}
                      {isAllSelected ? "Batal Pilih" : "Pilih Semua"}
                    </button>
                    <button
                      onClick={handleDeleteAll}
                      disabled={isDeletingBulk}
                      className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border bg-red-50 border-red-200 text-red-600 hover:bg-red-500 hover:text-white disabled:opacity-50"
                      title="Hapus seluruh data yang tampil di tabel ini"
                    >
                      <Trash2 size={16} /> Sapu Bersih
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 w-full md:flex-1 md:border-l md:border-r border-slate-200 px-0 md:px-4">
                  <Search className="text-slate-400 shrink-0" size={20} />
                  <input
                    className="w-full bg-transparent border-none outline-none font-medium text-base text-slate-700 placeholder:text-slate-400 min-w-0 py-2"
                    placeholder={`Cari di ${tab === "soal" ? "soal" : "siswa"}...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto min-w-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-wrap items-center gap-2 w-full md:w-auto min-w-0">
                    {currentConfig.filterKeys.map((key) => {
                      if (
                        tab === "nilai" &&
                        nilaiViewMode === "rekap" &&
                        key !== "kelas"
                      )
                        return null;
                      return (
                        <div key={key} className="w-full md:w-40">
                          <PremiumSelect
                            value={filters[key] || ""}
                            onChange={(val) =>
                              setFilters({ ...filters, [key]: val })
                            }
                            options={[
                              { label: `Semua ${key}`, value: "" },
                              ...getFilterOptions(key).map((opt) => ({
                                label: opt,
                                value: opt,
                              })),
                            ]}
                            placeholder={`Filter ${key}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => fetchData(false)}
                    className="w-full md:w-auto flex justify-center items-center gap-2 p-3 text-slate-500 bg-slate-50 border border-slate-200 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 rounded-xl transition-all shrink-0 shadow-sm"
                    title="Sinkronkan Ulang"
                  >
                    <RefreshCw
                      size={18}
                      className={loading || isSyncing ? "animate-spin" : ""}
                    />
                    <span className="md:hidden font-bold text-sm">
                      Refresh Data
                    </span>
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* PANEL AKSI MELAYANG (FLOATING BULK DELETE) */}
        <AnimatePresence>
          {selectedIds.length > 0 && tab === "soal" && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[50] w-max max-w-lg shadow-2xl shadow-red-500/20"
            >
              <div className="bg-slate-900 border border-slate-700 rounded-full px-4 py-3 flex items-center gap-4 text-white">
                <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-600">
                  <span className="font-bold text-amber-400">
                    {selectedIds.length}
                  </span>
                  <span className="text-xs font-medium text-slate-300">
                    Soal Terpilih
                  </span>
                </div>
                <div className="w-px h-6 bg-slate-700"></div>
                <button
                  onClick={handleBulkDelete}
                  disabled={isDeletingBulk}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 active:scale-95 transition-all rounded-full text-xs font-bold disabled:opacity-50"
                >
                  {isDeletingBulk ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}{" "}
                  Hapus Masal
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="p-2 text-slate-400 hover:text-white transition-colors bg-slate-800 rounded-full hover:bg-slate-700"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================== */}
        {/* KONTEN UTAMA: BANK SOAL ATAU NILAI ATAU PELANGGARAN */}
        {/* ============================================================== */}
        {loading && data.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <RefreshCw
              className="animate-spin text-emerald-500 mb-4"
              size={32}
            />
            <span className="font-bold text-slate-400 uppercase tracking-widest text-xs">
              Memuat Database...
            </span>
          </div>
        ) : tab === "soal" ? (
          <motion.div
            variants={fadeUp}
            className="flex flex-col gap-0 max-w-5xl mx-auto relative"
          >
            {renderBankSoal()}
          </motion.div>
        ) : (
          <motion.div variants={fadeUp}>
            {/* VIEW NILAI REKAP */}
            {nilaiViewMode === "rekap" && (
              <>
                <Card className="hidden md:block overflow-hidden border-slate-200 shadow-xl shadow-slate-200/40 bg-white rounded-[2rem]">
                  <div className="overflow-auto max-h-[65vh] w-full relative scrollbar-thin">
                    {pivotNilaiData.data.length === 0 ? (
                      <div className="py-20 text-center text-slate-400 font-semibold text-lg">
                        Belum ada nilai ujian masuk.
                      </div>
                    ) : (
                      <table
                        id="data-table-guru"
                        className="w-full text-left text-sm whitespace-nowrap border-collapse"
                      >
                        <thead className="sticky top-0 z-20 shadow-sm">
                          <tr>
                            <th
                              style={{
                                position: "sticky",
                                left: 0,
                                zIndex: 30,
                                minWidth: "60px",
                              }}
                              className="px-6 py-5 bg-slate-50 border-b-2 border-r border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider text-center"
                            >
                              No
                            </th>
                            <th
                              style={{
                                position: "sticky",
                                left: "60px",
                                zIndex: 30,
                                minWidth: "220px",
                              }}
                              className="px-6 py-5 bg-slate-50 border-b-2 border-r border-slate-200 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)] text-slate-500 font-bold text-xs uppercase tracking-wider"
                            >
                              Nama Siswa
                            </th>
                            <th className="px-6 py-5 bg-slate-50 border-b-2 border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider text-center">
                              Kelas
                            </th>
                            {pivotNilaiData.mapels.map((m) => (
                              <th
                                key={m}
                                className="px-6 py-5 bg-slate-50 border-b-2 border-l border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider text-center"
                              >
                                {m}
                              </th>
                            ))}
                            <th className="px-6 py-5 bg-emerald-50 border-b-2 border-l border-emerald-200 text-emerald-700 font-bold text-xs uppercase tracking-wider text-center">
                              Rata-Rata
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {pivotNilaiData.data.map((item, idx) => (
                            <tr
                              key={`${item.nama_siswa}_${item.kelas}`}
                              className="hover:bg-emerald-50/40 transition-colors group bg-white"
                            >
                              <td
                                style={{
                                  position: "sticky",
                                  left: 0,
                                  zIndex: 10,
                                  minWidth: "60px",
                                }}
                                className="px-6 py-4 font-bold text-slate-400 bg-white border-r border-slate-100 text-center group-hover:bg-emerald-50 transition-colors"
                              >
                                {idx + 1}
                              </td>
                              <td
                                style={{
                                  position: "sticky",
                                  left: "60px",
                                  zIndex: 10,
                                  minWidth: "220px",
                                }}
                                className="px-6 py-4 font-bold text-slate-800 bg-white border-r border-slate-100 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.03)] group-hover:bg-emerald-50 transition-colors col-nama"
                              >
                                {item.nama_siswa}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md font-semibold text-[11px] text-slate-600">
                                  {item.kelas}
                                </span>
                              </td>
                              {pivotNilaiData.mapels.map((m) => {
                                const skor = item[m];
                                const isKkmFailed =
                                  skor !== undefined && skor < KKM_SCORE;
                                return (
                                  <td
                                    key={m}
                                    className={`px-6 py-4 text-center font-bold text-base border-l border-slate-100 ${isKkmFailed ? "text-rose-500 bg-rose-50/50" : "text-slate-600"}`}
                                  >
                                    {skor !== undefined ? skor : "-"}
                                  </td>
                                );
                              })}
                              <td
                                className={`px-6 py-4 text-center font-bold text-lg border-l border-slate-100 ${parseFloat(item.RataRata) < KKM_SCORE ? "text-rose-600 bg-rose-50" : "text-emerald-600 bg-emerald-50/50"}`}
                              >
                                {item.RataRata}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </Card>

                {/* Tampilan Mobile Rekap */}
                <div className="md:hidden flex flex-col gap-4">
                  {pivotNilaiData.data.length === 0 ? (
                    <div className="py-20 text-center text-slate-400 font-semibold text-base bg-white rounded-2xl border border-slate-200">
                      Belum ada nilai ujian masuk.
                    </div>
                  ) : (
                    pivotNilaiData.data.map((item, idx) => (
                      <Card
                        key={`${item.nama_siswa}_${item.kelas}`}
                        className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl"
                      >
                        <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-100">
                          <span className="font-black text-slate-800 text-[16px] leading-tight line-clamp-2">
                            {idx + 1}. {item.nama_siswa}
                          </span>
                          <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-md font-bold text-[10px] text-slate-600 shrink-0">
                            {item.kelas}
                          </span>
                        </div>
                        <div className="space-y-2 mb-3">
                          {pivotNilaiData.mapels.map((m) => {
                            const skor = item[m];
                            const isKkmFailed =
                              skor !== undefined && skor < KKM_SCORE;
                            return (
                              <div
                                key={m}
                                className="flex justify-between items-center text-sm"
                              >
                                <span className="text-slate-500 font-semibold">
                                  {m}
                                </span>
                                <span
                                  className={`font-bold ${isKkmFailed ? "text-rose-500" : "text-slate-700"}`}
                                >
                                  {skor !== undefined ? skor : "-"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                            Rata-Rata
                          </span>
                          <span
                            className={`font-black text-lg ${parseFloat(item.RataRata) < KKM_SCORE ? "text-rose-600" : "text-emerald-600"}`}
                          >
                            {item.RataRata}
                          </span>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </>
            )}

            {/* VIEW LOG RIWAYAT */}
            {nilaiViewMode === "log" && (
              <>
                <Card className="hidden md:block overflow-hidden border-slate-200 shadow-xl shadow-slate-200/40 bg-white rounded-[2rem]">
                  <div className="overflow-auto max-h-[65vh] w-full relative scrollbar-thin">
                    {processedData.length === 0 ? (
                      <div className="py-20 text-center text-slate-400 font-semibold text-lg">
                        Tidak ada log ujian terekam.
                      </div>
                    ) : (
                      <table
                        id="data-table-guru"
                        className="w-full text-left text-sm whitespace-nowrap border-collapse"
                      >
                        <thead className="sticky top-0 z-20 shadow-sm">
                          <tr>
                            {currentConfig.columns.map((col, index) => {
                              const isID = index === 0;
                              const isName = index === 1;
                              const stickyStyle = isID
                                ? {
                                    position: "sticky",
                                    left: 0,
                                    zIndex: 30,
                                    minWidth: "80px",
                                  }
                                : isName
                                  ? {
                                      position: "sticky",
                                      left: "80px",
                                      zIndex: 30,
                                      minWidth: "220px",
                                    }
                                  : {};
                              return (
                                <th
                                  key={col.key}
                                  style={stickyStyle}
                                  className={`px-6 py-5 bg-slate-50 border-b-2 border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider ${isID || isName ? "border-r shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]" : ""}`}
                                >
                                  {col.label}
                                </th>
                              );
                            })}
                            <th className="px-6 py-5 text-center bg-slate-50 border-b-2 border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider print-hidden min-w-[120px]">
                              Aksi
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {processedData.map((item, i) => (
                            <tr
                              key={item.id || i}
                              className="hover:bg-emerald-50/40 transition-colors group bg-white"
                            >
                              {currentConfig.columns.map((col, index) => {
                                const isID = index === 0;
                                const isName = index === 1;
                                const stickyStyle = isID
                                  ? {
                                      position: "sticky",
                                      left: 0,
                                      zIndex: 10,
                                      minWidth: "80px",
                                    }
                                  : isName
                                    ? {
                                        position: "sticky",
                                        left: "80px",
                                        zIndex: 10,
                                        minWidth: "220px",
                                      }
                                    : {};
                                return (
                                  <td
                                    key={col.key}
                                    style={stickyStyle}
                                    className={`px-6 py-4 font-semibold text-slate-700 ${isID || isName ? "bg-white border-r border-slate-100 group-hover:bg-emerald-50 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.03)]" : ""}`}
                                  >
                                    {col.key === "status" ? (
                                      <Badge type={item[col.key]} />
                                    ) : col.key === "skor" ? (
                                      <span
                                        className={`text-base font-bold ${parseFloat(item[col.key]) < KKM_SCORE ? "text-rose-500" : "text-emerald-600"}`}
                                      >
                                        {item[col.key]}
                                      </span>
                                    ) : (
                                      item[col.key] || "-"
                                    )}
                                  </td>
                                );
                              })}
                              <td className="px-6 py-4 text-center print-hidden">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => openReviewModal(item)}
                                    className="p-2 bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                    title="Lihat Akurasi/Detail Jawaban"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                    title="Hapus Log"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </Card>

                {/* Tampilan Mobile Log */}
                <div className="md:hidden flex flex-col gap-4">
                  {processedData.length === 0 ? (
                    <div className="py-20 text-center text-slate-400 font-semibold text-base bg-white rounded-2xl border border-slate-200">
                      Tidak ada log ujian terekam.
                    </div>
                  ) : (
                    processedData.map((item, i) => (
                      <Card
                        key={item.id || i}
                        className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl"
                      >
                        <div className="flex justify-between items-start gap-3 mb-3 pb-3 border-b border-slate-100">
                          <span className="font-black text-slate-800 text-[15px] leading-tight line-clamp-2">
                            {item.nama_siswa}
                          </span>
                          <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 shrink-0">
                            #{item.id}
                          </span>
                        </div>
                        <div className="space-y-2 mb-4">
                          {currentConfig.columns.map((col) => {
                            if (col.key === "id" || col.key === "nama_siswa")
                              return null;
                            return (
                              <div
                                key={col.key}
                                className="flex justify-between items-center text-sm gap-4"
                              >
                                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider shrink-0">
                                  {col.label}
                                </span>
                                <div className="text-right font-semibold text-slate-700 truncate">
                                  {col.key === "status" ? (
                                    <Badge type={item[col.key]} />
                                  ) : col.key === "skor" ? (
                                    <span
                                      className={`text-[15px] font-bold ${parseFloat(item[col.key]) < KKM_SCORE ? "text-rose-500" : "text-emerald-600"}`}
                                    >
                                      {item[col.key]}
                                    </span>
                                  ) : (
                                    item[col.key] || (
                                      <span className="text-slate-300">-</span>
                                    )
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="pt-3 border-t border-slate-100 flex gap-2">
                          <button
                            onClick={() => openReviewModal(item)}
                            className="flex-1 py-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl font-bold text-sm flex justify-center items-center gap-2 hover:bg-blue-100 transition-colors"
                          >
                            <Eye size={16} /> Jawaban
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="w-[50px] shrink-0 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold text-sm flex justify-center items-center hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </>
            )}

            {/* ============================================================== */}
            {/* VIEW PELANGGARAN / ANTI-CHEAT CONTROL */}
            {/* ============================================================== */}
            {nilaiViewMode === "pelanggaran" && (
              <div className="space-y-6 max-w-5xl mx-auto">
                {/* KOTAK SISWA TERKUNCI (Perlu Tindakan) */}
                <div className="bg-red-50 border border-red-200 rounded-[2rem] p-5 md:p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6 border-b border-red-100 pb-4">
                    <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                      <Unlock size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-red-700">
                        Membutuhkan Tindakan (Siswa Terkunci)
                      </h3>
                      <p className="text-red-500/80 text-sm font-semibold">
                        Siswa di bawah ini keluar aplikasi untuk pertama
                        kalinya. Ujian mereka dibekukan.
                      </p>
                    </div>
                  </div>

                  {lockedSessions.length === 0 ? (
                    <div className="py-12 text-center text-red-400 font-bold bg-white/50 rounded-2xl border border-red-100">
                      <CheckCircle2
                        size={40}
                        className="mx-auto mb-3 opacity-50"
                      />
                      Aman! Tidak ada siswa yang terkunci saat ini.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {lockedSessions.map((sesi) => (
                        <Card
                          key={sesi.id_sesi}
                          className="p-5 bg-white border border-red-200 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="font-black text-slate-800 text-lg leading-tight">
                                {sesi.username_siswa}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                ID Ujian: {sesi.id_ujian}
                              </p>
                            </div>
                            <span className="bg-red-100 text-red-600 px-2.5 py-1 rounded-md text-[10px] font-black uppercase animate-pulse">
                              LOCKED
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              handleUnlockSesi(
                                sesi.username_siswa,
                                sesi.id_ujian,
                              )
                            }
                            className="w-full bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold py-3 rounded-xl text-sm transition-all flex justify-center items-center gap-2 shadow-sm"
                          >
                            <Unlock size={16} /> Buka Kunci Layar
                          </button>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* KOTAK RIWAYAT DISKUALIFIKASI */}
                <div className="bg-slate-800 border border-slate-700 rounded-[2rem] p-5 md:p-8 shadow-xl">
                  <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                    <div className="p-3 bg-slate-700 text-red-400 rounded-xl">
                      <UserX size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">
                        Riwayat Diskualifikasi
                      </h3>
                      <p className="text-slate-400 text-sm font-medium">
                        Siswa di bawah ini ngeyel keluar aplikasi untuk kedua
                        kalinya dan dihentikan paksa.
                      </p>
                    </div>
                  </div>

                  {disqualifiedSessions.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 font-bold bg-slate-900/50 rounded-2xl border border-slate-700">
                      Belum ada riwayat siswa yang didiskualifikasi.
                    </div>
                  ) : (
                    <div className="overflow-auto max-h-[50vh] scrollbar-thin rounded-xl border border-slate-700">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-900 sticky top-0 z-10 shadow-md">
                          <tr>
                            <th className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">
                              Nama Siswa
                            </th>
                            <th className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">
                              Kelas
                            </th>
                            <th className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">
                              Mapel
                            </th>
                            <th className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">
                              Skor Sementara
                            </th>
                            <th className="px-6 py-4 text-center text-slate-400 font-bold text-xs uppercase tracking-wider">
                              Aksi
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700 bg-slate-800">
                          {disqualifiedSessions.map((item, i) => (
                            <tr
                              key={i}
                              className="hover:bg-slate-700/50 transition-colors"
                            >
                              <td className="px-6 py-4 font-black text-white">
                                {item.nama_siswa}
                              </td>
                              <td className="px-6 py-4 text-slate-300 font-medium">
                                {item.kelas}
                              </td>
                              <td className="px-6 py-4 text-slate-300 font-medium">
                                {item.mapel}
                              </td>
                              <td className="px-6 py-4 font-black text-red-400 text-lg">
                                {item.skor}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => openReviewModal(item)}
                                  className="p-2 bg-slate-700 text-blue-400 hover:text-white hover:bg-blue-500 rounded-lg transition-colors"
                                  title="Lihat Seberapa Jauh Ia Mengerjakan"
                                >
                                  <Eye size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* MODAL REVIEW JAWABAN SISWA (SMART PARSER) */}
        <AnimatePresence>
          {isReviewModalOpen && reviewData && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-4xl my-auto py-4 md:py-8"
              >
                <Card className="p-0 shadow-2xl border-0 rounded-[1.5rem] md:rounded-[2rem] bg-white overflow-hidden flex flex-col max-h-[85vh] md:max-h-[90vh]">
                  {/* Header */}
                  <div className="p-4 md:p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-slate-800">
                        Analisis Jawaban Asli
                      </h3>
                      <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                        {reviewData.nama_siswa || reviewData.Nama_Siswa} •{" "}
                        {reviewData.mapel || reviewData.Mapel}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsReviewModalOpen(false)}
                      className="p-1.5 md:p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                    >
                      <X size={20} className="md:w-6 md:h-6" />
                    </button>
                  </div>

                  {/* Isi Detail (Pintar Membaca Nama Kolom) */}
                  <div className="p-4 md:p-6 overflow-y-auto bg-slate-50/50 scrollbar-thin">
                    {(() => {
                      const key = Object.keys(reviewData).find(
                        (k) =>
                          k.toLowerCase().replace(/[^a-z0-9]/g, "") ===
                          "detailjawaban",
                      );
                      const rawData = key ? reviewData[key] : null;
                      let parsedDetail = null;

                      if (rawData) {
                        try {
                          parsedDetail =
                            typeof rawData === "string"
                              ? JSON.parse(rawData)
                              : rawData;
                        } catch (e) {
                          console.error("Gagal parse JSON Detail Jawaban", e);
                        }
                      }

                      if (
                        parsedDetail &&
                        Array.isArray(parsedDetail) &&
                        parsedDetail.length > 0
                      ) {
                        return (
                          <div className="space-y-4">
                            {parsedDetail.map((item, idx) => {
                              const isBenar =
                                String(item.jawab_siswa)
                                  .toUpperCase()
                                  .trim() ===
                                String(item.kunci).toUpperCase().trim();
                              return (
                                <div
                                  key={idx}
                                  className={`p-4 md:p-5 rounded-2xl border-2 shadow-sm ${isBenar ? "border-emerald-100 bg-emerald-50/50" : "border-rose-100 bg-rose-50/50"}`}
                                >
                                  <div className="flex justify-between items-center mb-3">
                                    <span className="font-black text-slate-400 text-[10px] md:text-xs uppercase tracking-widest bg-white px-3 py-1 rounded-md border border-slate-100">
                                      Soal No. {idx + 1}
                                    </span>
                                    <span
                                      className={`px-3 py-1 rounded-md text-[10px] md:text-xs font-black uppercase tracking-widest text-white shadow-sm ${isBenar ? "bg-emerald-500" : "bg-rose-500"}`}
                                    >
                                      {isBenar ? "Benar" : "Salah"}
                                    </span>
                                  </div>
                                  <p className="text-sm md:text-base text-slate-800 font-semibold mb-4 leading-relaxed whitespace-pre-wrap">
                                    {item.tanya}
                                  </p>
                                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                                      <div
                                        className={`absolute top-0 left-0 w-1 h-full ${isBenar ? "bg-emerald-400" : "bg-rose-400"}`}
                                      ></div>
                                      <span className="text-[9px] md:text-[10px] block text-slate-400 font-bold uppercase tracking-widest mb-1">
                                        Pilihan Siswa
                                      </span>
                                      <span
                                        className={`text-sm md:text-base font-black ${isBenar ? "text-emerald-600" : "text-rose-600"}`}
                                      >
                                        {item.jawab_siswa || "KOSONG"}
                                      </span>
                                    </div>
                                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                                      <div className="absolute top-0 left-0 w-1 h-full bg-slate-300"></div>
                                      <span className="text-[9px] md:text-[10px] block text-slate-400 font-bold uppercase tracking-widest mb-1">
                                        Kunci Jawaban
                                      </span>
                                      <span className="text-sm md:text-base font-black text-slate-700">
                                        {item.kunci}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }

                      return (
                        <div className="py-16 md:py-24 text-center">
                          <div className="w-20 h-20 bg-white border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-5 text-slate-300 shadow-sm">
                            <AlertTriangle size={36} />
                          </div>
                          <h4 className="text-lg md:text-xl font-black text-slate-700">
                            Detail Jawaban Tidak Tersedia
                          </h4>
                          <p className="text-slate-500 text-sm max-w-sm mx-auto mt-2 leading-relaxed">
                            Log rincian jawaban belum direkam oleh sistem saat
                            siswa ini mengerjakan ujian.
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </Card>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL BUAT/EDIT MANUAL SEDERHANA */}
        <AnimatePresence>
          {isModalOpen && tab === "soal" && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-4xl my-auto py-4 md:py-8"
              >
                <Card className="p-4 md:p-8 shadow-2xl border-0 rounded-[1.5rem] md:rounded-[2rem] bg-white">
                  <div className="flex justify-between items-center mb-4 md:mb-6 pb-3 md:pb-5 border-b border-slate-100">
                    <div>
                      <h3 className="text-lg md:text-2xl font-bold text-slate-800 tracking-tight">
                        {isEdit ? "Edit Soal" : "Buat Soal Baru"}
                      </h3>
                      <p className="text-emerald-600 font-bold text-[10px] md:text-xs uppercase tracking-widest mt-0.5 md:mt-1">
                        Sistem Database CBT
                      </p>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      disabled={isSaving}
                      className="p-1.5 md:p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg md:rounded-xl transition-colors disabled:opacity-50 border border-transparent hover:border-red-100"
                    >
                      <X size={20} className="md:w-6 md:h-6" />
                    </button>
                  </div>
                  <form
                    onSubmit={handleSave}
                    className="space-y-4 md:space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 bg-slate-50 p-4 md:p-5 rounded-[1rem] md:rounded-[1.5rem] border border-slate-100">
                      <div className="space-y-1.5">
                        <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                          ID Sistem
                        </label>
                        <input
                          type="number"
                          step="any"
                          className={`w-full p-2.5 md:p-3.5 text-xs md:text-sm rounded-lg md:rounded-xl font-bold outline-none transition-all shadow-sm ${isSaving ? "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed" : "bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800"}`}
                          value={formData.id}
                          onChange={(e) =>
                            setFormData({ ...formData, id: e.target.value })
                          }
                          disabled={isSaving}
                          required
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-1">
                        <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                          Mapel
                        </label>
                        <PremiumSelect
                          value={formData.mapel || ""}
                          onChange={(val) =>
                            setFormData({ ...formData, mapel: val })
                          }
                          options={
                            mapelOptions.length > 0
                              ? mapelOptions.map((opt) => ({
                                  label: opt,
                                  value: opt,
                                }))
                              : [{ label: "Memuat Data...", value: "" }]
                          }
                          placeholder="Pilih Mapel..."
                          disabled={isSaving || mapelOptions.length === 0}
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-1">
                        <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                          Kelas
                        </label>
                        <PremiumMultiSelect
                          value={formData.kelas || ""}
                          onChange={(val) =>
                            setFormData({ ...formData, kelas: val })
                          }
                          options={OPSI_KELAS_LENGKAP}
                          placeholder="Pilih Kelas..."
                          disabled={isSaving}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-amber-600 ml-1">
                          Bobot Poin
                        </label>
                        <input
                          type="number"
                          step="any"
                          className="w-full p-2.5 md:p-3.5 text-xs md:text-sm bg-amber-50 border border-amber-200 rounded-lg md:rounded-xl font-bold text-amber-700 outline-none focus:border-amber-400"
                          value={formData.poin || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, poin: e.target.value })
                          }
                          disabled={isSaving}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1 md:space-y-1.5">
                      <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                        Wacana / Teks Cerita (Opsional)
                      </label>
                      <textarea
                        disabled={isSaving}
                        placeholder="Tuliskan paragraf wacana di sini..."
                        rows="3"
                        className="w-full p-3 md:p-4 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl md:rounded-[1.5rem] font-medium outline-none focus:border-emerald-500 focus:bg-white transition-all resize-y whitespace-pre-wrap text-slate-700"
                        value={formData.wacana || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, wacana: e.target.value })
                        }
                      />
                      <p className="text-[9px] md:text-[10px] font-medium text-amber-600 ml-1 mt-1 flex items-start md:items-center gap-1">
                        <AlertTriangle
                          size={12}
                          className="shrink-0 mt-0.5 md:mt-0"
                        />{" "}
                        Jangan gunakan kalimat "Untuk soal nomor 1-5" di dalam
                        teks wacana, karena soal CBT akan diacak.
                      </p>
                    </div>
                    <div className="space-y-1 md:space-y-1.5">
                      <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                        Pertanyaan Inti <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        disabled={isSaving}
                        rows="3"
                        placeholder="Tuliskan pertanyaan di sini..."
                        className="w-full p-3 md:p-4 text-xs md:text-sm bg-white border border-slate-200 rounded-xl md:rounded-[1.5rem] font-semibold outline-none focus:border-emerald-500 transition-all resize-y whitespace-pre-wrap text-slate-800 shadow-sm"
                        value={formData.pertanyaan || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pertanyaan: e.target.value,
                          })
                        }
                      />
                    </div>
                    {/* Input Gambar Sederhana via Modal */}
                    <div className="space-y-1 md:space-y-1.5">
                      <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                        URL Lampiran Gambar (Bila ada)
                      </label>
                      <input
                        type="text"
                        disabled={isSaving}
                        placeholder="Paste link gambar (https://...) atau biarkan kosong."
                        className="w-full p-2.5 md:p-3.5 text-xs md:text-sm bg-white border border-slate-200 rounded-lg md:rounded-xl font-medium text-slate-700 outline-none focus:border-emerald-500 transition-all shadow-sm"
                        value={formData.link_gambar || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            link_gambar: e.target.value,
                          })
                        }
                      />
                      <p className="text-[9px] md:text-[10px] font-medium text-slate-500 ml-1 mt-1">
                        Anda juga bisa mengunggah foto langsung dari layar utama
                        Bank Soal menggunakan tombol <b>Ikon Gambar</b> pada
                        masing-masing soal.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5 pt-1 md:pt-2">
                      {["A", "B", "C", "D", "E"].map((opt) => {
                        const keyMap = `opsi_${opt.toLowerCase()}`;
                        const isKunci = formData.jawaban_benar === opt;
                        return (
                          <div
                            key={opt}
                            className="space-y-1 md:space-y-1.5 relative"
                          >
                            <label
                              className={`text-[10px] md:text-[11px] font-bold uppercase tracking-wider ml-1 ${isKunci ? "text-emerald-600" : "text-slate-500"}`}
                            >
                              Pilihan {opt} {isKunci && "(KUNCI)"}
                            </label>
                            <textarea
                              required={opt !== "E"}
                              disabled={isSaving}
                              placeholder={`Jawaban ${opt}...`}
                              className={`w-full p-2.5 md:p-3.5 text-xs md:text-sm border rounded-lg md:rounded-xl font-medium outline-none transition-all shadow-sm whitespace-pre-wrap resize-y ${isKunci ? "bg-emerald-50 border-emerald-300 text-emerald-900 focus:ring-2 focus:ring-emerald-500/20" : "bg-white border-slate-200 text-slate-700 focus:border-emerald-500"}`}
                              value={formData[keyMap] || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  [keyMap]: e.target.value,
                                })
                              }
                            />
                          </div>
                        );
                      })}
                      <div className="space-y-1 md:space-y-1.5">
                        <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-emerald-600 ml-1">
                          Tetapkan Kunci Jawaban
                        </label>
                        <select
                          required
                          disabled={isSaving}
                          className="w-full p-2.5 md:p-3.5 text-xs md:text-sm bg-gradient-to-r from-emerald-600 to-emerald-500 border border-emerald-400 text-white rounded-lg md:rounded-xl font-bold outline-none shadow-md cursor-pointer"
                          value={formData.jawaban_benar || "A"}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              jawaban_benar: e.target.value,
                            })
                          }
                        >
                          <option value="A">PILIHAN A</option>
                          <option value="B">PILIHAN B</option>
                          <option value="C">PILIHAN C</option>
                          <option value="D">PILIHAN D</option>
                          <option value="E">PILIHAN E</option>
                        </select>
                      </div>
                    </div>
                    <div className="pt-4 md:pt-6 mt-2 md:mt-4 border-t border-slate-100">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-sm md:text-sm py-3 md:py-4 rounded-lg md:rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 hover:scale-[1.01] active:scale-95 transition-all uppercase tracking-widest disabled:opacity-70 disabled:cursor-not-allowed border border-emerald-400"
                      >
                        {isSaving ? (
                          <RefreshCw size={18} className="animate-spin" />
                        ) : (
                          <Save size={18} />
                        )}{" "}
                        {isSaving ? "Menyimpan ke Server..." : "Simpan Soal"}
                      </button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL IMPORT MASAL */}
        <AnimatePresence>
          {isBulkOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-5xl my-auto py-4 md:py-8"
              >
                <Card className="p-4 md:p-8 shadow-2xl border-0 rounded-[1.5rem] md:rounded-[2rem] bg-white">
                  <div className="flex justify-between items-start md:items-center mb-4 md:mb-6 pb-3 md:pb-5 border-b border-slate-100">
                    <div>
                      <h3 className="text-lg md:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2 md:gap-3">
                        <UploadCloud className="text-emerald-500" size={24} />{" "}
                        Import Soal Massal
                      </h3>
                      <p className="text-slate-500 font-medium text-[10px] md:text-xs mt-1 md:mt-1.5 leading-relaxed">
                        Sistem AI otomatis memisahkan Wacana dan Pertanyaan.{" "}
                        <br />
                        <strong className="text-amber-600">
                          Tips Gambar:
                        </strong>{" "}
                        Untuk menyisipkan gambar pada soal, silakan simpan
                        proses import ini terlebih dahulu, lalu klik tombol{" "}
                        <b>Ikon Gambar</b> pada masing-masing soal.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsBulkOpen(false)}
                      disabled={isSaving}
                      className="p-1.5 md:p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg md:rounded-xl transition-colors disabled:opacity-50 border border-transparent hover:border-red-100"
                    >
                      <X size={20} className="md:w-6 md:h-6" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-4">
                    <div className="w-full">
                      <PremiumSelect
                        value={bulkMapel}
                        onChange={(val) => setBulkMapel(val)}
                        options={
                          mapelOptions.length > 0
                            ? mapelOptions.map((opt) => ({
                                label: opt,
                                value: opt,
                              }))
                            : [{ label: "Memuat Data...", value: "" }]
                        }
                        placeholder="Pilih Mata Pelajaran..."
                        disabled={isSaving || mapelOptions.length === 0}
                      />
                    </div>
                    <div className="w-full">
                      <PremiumMultiSelect
                        value={bulkKelas}
                        onChange={(val) => setBulkKelas(val)}
                        options={OPSI_KELAS_LENGKAP}
                        placeholder="Pilih Kelas Sasaran..."
                        disabled={isSaving}
                      />
                    </div>
                    <div className="relative flex items-center shadow-sm rounded-lg md:rounded-xl">
                      <Target
                        className="absolute left-3 text-amber-500"
                        size={16}
                      />
                      <input
                        type="number"
                        step="any"
                        className="w-full p-2.5 md:p-3.5 pl-9 md:pl-10 text-xs md:text-sm bg-amber-50 border border-amber-200 rounded-lg md:rounded-xl font-bold text-amber-700 outline-none focus:border-amber-400"
                        placeholder="Poin per Soal"
                        value={bulkPoin}
                        onChange={(e) => setBulkPoin(e.target.value)}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-end mb-2 mt-2">
                    <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                      Teks Soal Asli
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".docx,.txt"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        disabled={isReadingFile || isSaving}
                        title="Upload file Ms. Word"
                      />
                      <button
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-[10px] md:text-xs font-bold hover:bg-blue-100 transition-colors shadow-sm"
                      >
                        {isReadingFile ? (
                          <RefreshCw className="animate-spin" size={14} />
                        ) : (
                          <FileText size={14} />
                        )}
                        {isReadingFile ? "Membaca..." : "Upload Word (.docx)"}
                      </button>
                    </div>
                  </div>
                  <textarea
                    className="w-full p-4 md:p-5 bg-slate-50 border border-slate-200 rounded-xl md:rounded-[1.5rem] font-mono text-[11px] md:text-[13px] outline-none focus:bg-white focus:border-emerald-500 transition-all resize-y h-48 md:h-64 text-slate-700 shadow-inner leading-relaxed"
                    placeholder="Paste soal dari Ms.Word ke sini...&#10;&#10;Sistem Menerima 2 Format Kunci:&#10;&#10;FORMAT 1 (Tanda Bintang):&#10;1. Apa warna langit?&#10;A. Merah&#10;*B. Biru&#10;C. Hijau&#10;&#10;FORMAT 2 (Tulis Kunci di bawah):&#10;2. 1+1 = ?&#10;A. 1&#10;B. 2&#10;C. 3&#10;Kunci: B"
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    disabled={isSaving}
                  />
                  <div className="flex justify-end mt-4 md:mt-5">
                    <button
                      onClick={handleParseBulkText}
                      disabled={
                        !bulkText || !bulkMapel || !bulkKelas || isSaving
                      }
                      className="w-full md:w-auto bg-slate-800 text-white font-bold text-sm px-6 py-3.5 rounded-lg md:rounded-xl shadow-md hover:bg-slate-900 active:scale-95 transition-all disabled:opacity-50"
                    >
                      Pratinjau (Preview) AI
                    </button>
                  </div>
                  {parsedBulkData.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 md:mt-8 border-t border-slate-100 pt-5 md:pt-6"
                    >
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-2 mb-4">
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-200">
                          {parsedBulkData.length} Soal Terdeteksi
                        </span>
                        <span className="text-[10px] md:text-xs text-slate-500 font-medium">
                          Silakan periksa hasil bacaan sistem di bawah ini.
                        </span>
                      </div>
                      <div className="max-h-[400px] md:max-h-[500px] overflow-y-auto bg-slate-50 rounded-xl md:rounded-[1.5rem] border border-slate-200 p-3 md:p-4 space-y-3 md:space-y-4 mb-5 md:mb-6 scrollbar-thin">
                        {parsedBulkData.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-100 relative"
                          >
                            <div className="absolute top-3 right-3 md:top-4 md:right-4 text-[9px] md:text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">
                              #{idx + 1}
                            </div>
                            {item.wacana && (
                              <div className="mb-3 p-2.5 md:p-3 bg-amber-50/50 border border-amber-100 text-[10px] md:text-xs text-slate-700 rounded-lg leading-relaxed">
                                <strong className="text-amber-600 block mb-1">
                                  Teks Wacana Terikat:
                                </strong>
                                <span className="whitespace-pre-wrap leading-relaxed">
                                  {item.wacana}
                                </span>
                              </div>
                            )}
                            <p className="text-xs md:text-sm font-semibold text-slate-800 whitespace-pre-wrap mb-3 md:mb-4 pr-8 md:pr-10 leading-relaxed">
                              {item.pertanyaan}
                            </p>
                            <div className="flex flex-col gap-1 md:gap-1.5 text-[10px] md:text-xs text-slate-600 font-medium">
                              {item.opsi_a && (
                                <div
                                  className={`p-2 md:p-2.5 rounded-lg whitespace-pre-wrap ${item.jawaban_benar === "A" ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-100" : "bg-slate-50 border border-transparent"}`}
                                >
                                  <strong>A.</strong> {item.opsi_a}
                                </div>
                              )}
                              {item.opsi_b && (
                                <div
                                  className={`p-2 md:p-2.5 rounded-lg whitespace-pre-wrap ${item.jawaban_benar === "B" ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-100" : "bg-slate-50 border border-transparent"}`}
                                >
                                  <strong>B.</strong> {item.opsi_b}
                                </div>
                              )}
                              {item.opsi_c && (
                                <div
                                  className={`p-2 md:p-2.5 rounded-lg whitespace-pre-wrap ${item.jawaban_benar === "C" ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-100" : "bg-slate-50 border border-transparent"}`}
                                >
                                  <strong>C.</strong> {item.opsi_c}
                                </div>
                              )}
                              {item.opsi_d && (
                                <div
                                  className={`p-2 md:p-2.5 rounded-lg whitespace-pre-wrap ${item.jawaban_benar === "D" ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-100" : "bg-slate-50 border border-transparent"}`}
                                >
                                  <strong>D.</strong> {item.opsi_d}
                                </div>
                              )}
                              {item.opsi_e && (
                                <div
                                  className={`p-2 md:p-2.5 rounded-lg whitespace-pre-wrap ${item.jawaban_benar === "E" ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-100" : "bg-slate-50 border border-transparent"}`}
                                >
                                  <strong>E.</strong> {item.opsi_e}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={handleSaveBulk}
                        disabled={isSaving}
                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-sm md:text-sm py-3 md:py-4 rounded-lg md:rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 hover:scale-[1.01] active:scale-95 transition-all uppercase tracking-widest disabled:opacity-70 border border-emerald-400"
                      >
                        {isSaving ? (
                          <RefreshCw className="animate-spin" size={18} />
                        ) : (
                          <Save size={18} />
                        )}{" "}
                        Simpan {parsedBulkData.length} Soal ke Database
                      </button>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL CUSTOM ALERT */}
        <AnimatePresence>
          {customAlert.isOpen && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className="w-full max-w-sm p-6 md:p-8 shadow-2xl border-0 rounded-[1.5rem] md:rounded-[2rem] bg-white text-center flex flex-col items-center">
                  <div
                    className={`p-4 md:p-5 rounded-[1.5rem] mb-4 md:mb-5 ${customAlert.type === "danger" || customAlert.type === "confirm" ? "bg-red-50 text-red-500 shadow-inner" : customAlert.type === "warning" ? "bg-amber-50 text-amber-500 shadow-inner" : "bg-emerald-50 text-emerald-500 shadow-inner"}`}
                  >
                    {customAlert.type === "danger" ||
                    customAlert.type === "confirm" ? (
                      <AlertTriangle size={36} className="md:w-10 md:h-10" />
                    ) : customAlert.type === "warning" ? (
                      <AlertTriangle size={36} className="md:w-10 md:h-10" />
                    ) : (
                      <Info size={36} className="md:w-10 md:h-10" />
                    )}
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">
                    {customAlert.title}
                  </h3>
                  <p className="text-xs md:text-sm text-slate-500 mb-6 md:mb-8 font-medium px-2 leading-relaxed">
                    {customAlert.message}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    {customAlert.type === "confirm" ||
                    customAlert.type === "danger" ? (
                      <>
                        <button
                          onClick={closeAlert}
                          className="w-full py-3 px-4 bg-slate-100 text-slate-600 rounded-lg md:rounded-xl font-bold hover:bg-slate-200 transition-colors text-sm order-2 sm:order-1"
                        >
                          Batal
                        </button>
                        <button
                          onClick={
                            customAlert.onConfirm
                              ? customAlert.onConfirm
                              : closeAlert
                          }
                          className={`w-full py-3 px-4 rounded-lg md:rounded-xl font-bold text-white shadow-lg transition-all text-sm bg-red-500 hover:bg-red-600 shadow-red-500/30 order-1 sm:order-2`}
                        >
                          Ya, Eksekusi
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={closeAlert}
                        className="w-full py-3 px-4 rounded-lg md:rounded-xl font-bold text-white shadow-lg bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30 text-sm transition-all"
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
        <AnimatePresence>
          {isExportMenuOpen && (
            <div className="fixed inset-0 z-[90] flex items-end md:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4">
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="w-full max-w-sm bg-white rounded-t-[2rem] md:rounded-[2rem] p-6 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-800">
                      Export Nilai
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      Pilih format laporan yang diinginkan.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsExportMenuOpen(false)}
                    className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleExport("xls")}
                    className="flex flex-col items-center justify-center p-4 bg-emerald-50 border border-emerald-100 rounded-2xl hover:bg-emerald-100 transition-colors active:scale-95"
                  >
                    <Download size={28} className="text-emerald-600 mb-2" />
                    <span className="font-bold text-emerald-800 text-sm">
                      Ms. Excel
                    </span>
                  </button>
                  <button
                    onClick={() => handleExport("doc")}
                    className="flex flex-col items-center justify-center p-4 bg-blue-50 border border-blue-100 rounded-2xl hover:bg-blue-100 transition-colors active:scale-95"
                  >
                    <FileText size={28} className="text-blue-600 mb-2" />
                    <span className="font-bold text-blue-800 text-sm">
                      Ms. Word
                    </span>
                  </button>
                  <button
                    onClick={() => handleExport("pdf")}
                    className="flex flex-col items-center justify-center p-4 bg-rose-50 border border-rose-100 rounded-2xl hover:bg-rose-100 transition-colors active:scale-95"
                  >
                    <FileText size={28} className="text-rose-600 mb-2" />
                    <span className="font-bold text-rose-800 text-sm">
                      File PDF
                    </span>
                  </button>
                  <button
                    onClick={() => handleExport("print")}
                    className="flex flex-col items-center justify-center p-4 bg-slate-100 border border-slate-200 rounded-2xl hover:bg-slate-200 transition-colors active:scale-95"
                  >
                    <Printer size={28} className="text-slate-700 mb-2" />
                    <span className="font-bold text-slate-800 text-sm">
                      Print / Cetak
                    </span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {isMobileFilterOpen && (
            <div className="fixed inset-0 z-[95] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm md:hidden">
              <motion.div
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full bg-white rounded-t-[2rem] p-6 shadow-2xl max-h-[85vh] flex flex-col"
              >
                <div className="flex justify-between items-center mb-6 shrink-0">
                  <div>
                    <h3 className="text-xl font-black text-slate-800">
                      Filter Data
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      Saring tampilan sesuai kebutuhan.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 scrollbar-thin pb-6 space-y-5">
                  {currentConfig.filterKeys.map((key) => {
                    if (
                      tab === "nilai" &&
                      nilaiViewMode === "rekap" &&
                      key !== "kelas"
                    )
                      return null;
                    return (
                      <div key={key} className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                          Saring Berdasarkan {key}
                        </label>
                        <PremiumSelect
                          value={filters[key] || ""}
                          onChange={(val) =>
                            setFilters({ ...filters, [key]: val })
                          }
                          options={[
                            { label: `Semua ${key}`, value: "" },
                            ...getFilterOptions(key).map((opt) => ({
                              label: opt,
                              value: opt,
                            })),
                          ]}
                          placeholder={`Pilih ${key}...`}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="pt-5 border-t border-slate-100 flex gap-3 shrink-0">
                  <button
                    onClick={() => {
                      setFilters({});
                      setIsMobileFilterOpen(false);
                    }}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200"
                  >
                    Reset Ulang
                  </button>
                  <button
                    onClick={() => snetIsMobileFilterOpen(false)}
                    className="flex-1 py-4 bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-500/30 hover:bg-emerald-600"
                  >
                    Terapkan Filter
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </Dashboard>
  );
};

export default GuruDashboard;
