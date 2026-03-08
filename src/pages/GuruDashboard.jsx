// src/pages/GuruDashboard.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
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
} from "lucide-react";
import { api } from "../api/api";
import Dashboard from "../components/layout/Dashboard";
import { Card, Badge } from "../components/ui/Ui";

// IMPORT LIBRARY EXPORT
import * as XLSX from "xlsx";
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
// HELPER: PENYELAMAT FORMAT TANGGAL SHEETS
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
                  <span className="whitespace-normal break-words pr-2">{opt.label}</span>
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
                    <span className="text-xs md:text-sm whitespace-normal break-words leading-tight">{opt.label}</span>
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
// DATA REFERENSI LENGKAP KELAS
// ==========================================
const OPSI_KELAS_LENGKAP = [
  { label: "KATEGORI JURUSAN", isLabel: true },
  { label: "Semua MIPA", value: "MIPA" },
  { label: "Semua IPS", value: "IPS" },
  { label: "KATEGORI TINGKAT", isLabel: true },
  { label: "Semua Kelas X", value: "Kelas X" },
  { label: "Semua Kelas XI", value: "Kelas XI" },
  { label: "Semua Kelas XII", value: "Kelas XII" },
  { label: "KATEGORI TINGKAT & JURUSAN", isLabel: true },
  { label: "X MIPA", value: "X MIPA" },
  { label: "X IPS", value: "X IPS" },
  { label: "XI MIPA", value: "XI MIPA" },
  { label: "XI IPS", value: "XI IPS" },
  { label: "XII MIPA", value: "XII MIPA" },
  { label: "XII IPS", value: "XII IPS" },
  { label: "KELAS SPESIFIK (X)", isLabel: true },
  { label: "X MIPA 1", value: "X MIPA 1" },
  { label: "X MIPA 2", value: "X MIPA 2" },
  { label: "X IPS 1", value: "X IPS 1" },
  { label: "X IPS 2", value: "X IPS 2" },
  { label: "KELAS SPESIFIK (XI)", isLabel: true },
  { label: "XI MIPA 1", value: "XI MIPA 1" },
  { label: "XI MIPA 2", value: "XI MIPA 2" },
  { label: "XI IPS 1", value: "XI IPS 1" },
  { label: "XI IPS 2", value: "XI IPS 2" },
  { label: "KELAS SPESIFIK (XII)", isLabel: true },
  { label: "XII MIPA 1", value: "XII MIPA 1" },
  { label: "XII MIPA 2", value: "XII MIPA 2" },
  { label: "XII IPS 1", value: "XII IPS 1" },
  { label: "XII IPS 2", value: "XII IPS 2" },
];

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
  const [tab, setTab] = useState("soal");
  const [data, setData] = useState([]);

  // State Mapel Dinamis Backend
  const [mapelOptions, setMapelOptions] = useState([]);

  // Loading States
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Filter & Search
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});

  // Ceklis / Bulk Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [isEdit, setIsEdit] = useState(false);
  const [originalId, setOriginalId] = useState(null);

  const [customAlert, setCustomAlert] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });

  // State Import Masal
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [parsedBulkData, setParsedBulkData] = useState([]);
  const [bulkMapel, setBulkMapel] = useState("");
  const [bulkKelas, setBulkKelas] = useState("");
  const [bulkPoin, setBulkPoin] = useState("2");
  const [bulkProgress, setBulkProgress] = useState(0);

  const [nilaiViewMode, setNilaiViewMode] = useState("rekap");

  const currentConfig = TAB_CONFIG[tab];

  const showAlert = (type, title, message, onConfirm = null) => {
    setCustomAlert({ isOpen: true, type, title, message, onConfirm });
  };
  const closeAlert = () => setCustomAlert({ ...customAlert, isOpen: false });

  // --- FETCH DATA MATA PELAJARAN DINAMIS ---
  const fetchMapelList = async () => {
    try {
      const res = await api.read("Mapel");
      if (res && res.length > 0) {
        const list = res.map((m) => m.nama_mapel).filter(Boolean);
        setMapelOptions([...new Set(list)].sort());
      }
    } catch (error) {
      console.error("Gagal menarik data Mapel:", error);
    }
  };

  // --- FETCH DATA UTAMA ---
  const fetchData = async (isBackground = false) => {
    if (!currentConfig) return;
    if (!isBackground) setLoading(true);

    try {
      const result = await api.read(currentConfig.sheet);
      const newData = result || [];
      setData((prevData) => {
        const isDataChanged =
          JSON.stringify(prevData) !== JSON.stringify(newData);
        return isDataChanged ? newData : prevData;
      });
    } catch (error) {
      console.error("Gagal menarik data:", error);
      if (!isBackground) setData([]);
    } finally {
      if (isBackground) setIsSyncing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    setSearch("");
    setFilters({});
    setSelectedIds([]); // Reset seleksi saat ganti tab
    fetchMapelList();
    fetchData(false);
    const intervalId = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(intervalId);
  }, [tab]);

  // ==============================================================
  // FUNGSI CRUD SEKARANG TIDAK ME-REFRESH HALAMAN (OPTIMISTIC UI)
  // ==============================================================

  const handleDelete = async (id) => {
    showAlert(
      "confirm",
      "Hapus Data?",
      `Yakin ingin menghapus data dengan ID: #${id}? Tindakan ini permanen.`,
      async () => {
        closeAlert();
        setLoading(true);
        try {
          await api.delete(currentConfig.sheet, id);
          setData((prev) =>
            prev.filter((item) => String(item.id) !== String(id)),
          );
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
      `Yakin ingin menghapus ${selectedIds.length} soal yang Anda pilih secara permanen?`,
      async () => {
        closeAlert();
        setIsDeletingBulk(true);
        setLoading(true);
        try {
          for (let i = 0; i < selectedIds.length; i++) {
            await api.delete(currentConfig.sheet, selectedIds[i]);
          }
          setData((prev) =>
            prev.filter((item) => !selectedIds.includes(item.id)),
          );
          setSelectedIds([]);
        } catch (error) {
          showAlert(
            "danger",
            "Kesalahan",
            "Terjadi kesalahan saat menghapus: " + error.message,
          );
        } finally {
          setIsDeletingBulk(false);
          setLoading(false);
        }
      },
    );
  };

  const handleDeleteAll = () => {
    if (processedData.length === 0) {
      return showAlert("warning", "Kosong", "Tidak ada data untuk dihapus.");
    }
    showAlert(
      "danger",
      "Sapu Bersih Database?",
      "PERINGATAN! Anda akan menghapus SELURUH soal yang tampil di tabel ini secara permanen. Lanjutkan?",
      async () => {
        closeAlert();
        setLoading(true);
        setIsDeletingBulk(true);
        try {
          for (let item of processedData) {
            await api.delete(currentConfig.sheet, item.id);
          }
          const deletedIds = processedData.map((item) => item.id);
          setData((prev) =>
            prev.filter((item) => !deletedIds.includes(item.id)),
          );
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
          `ID telah dipakai! Dialihkan ke ID yang aman: ${maxId + 1}. Silakan klik simpan lagi.`,
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
      poin: parseFloat(String(formData.poin).replace(",", ".")) || 0,
    };

    setIsSaving(true);
    try {
      if (isEdit) {
        await api.update(currentConfig.sheet, originalId, payloadToSave);
        setData((prev) =>
          prev.map((item) =>
            String(item.id) === String(originalId) ? payloadToSave : item,
          ),
        );
      } else {
        await api.create(currentConfig.sheet, payloadToSave);
        setData((prev) => [...prev, payloadToSave]);
      }
      setIsModalOpen(false);
    } catch (error) {
      showAlert("danger", "Kesalahan", error.message);
    } finally {
      setIsSaving(false);
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
    setFormData({
      ...item,
      poin: formatPoinDisplay(item.poin),
    });
    setIsModalOpen(true);
  };

  const handleDuplicate = (item) => {
    const maxId =
      data.length > 0 ? Math.max(...data.map((d) => parseInt(d.id) || 0)) : 0;
    setIsEdit(false);
    setFormData({
      ...item,
      id: maxId + 1,
      poin: formatPoinDisplay(item.poin),
    });
    setIsModalOpen(true);
  };

  // ======================================================================
  // OTAK AI: PENGURAI TEKS CERDAS (MENDETEKSI LIST & WACANA OTOMATIS)
  // ======================================================================
  const handleParseBulkText = () => {
    if (!bulkMapel)
      return showAlert("warning", "Validasi", "Harap pilih Mata Pelajaran.");
    if (!bulkKelas)
      return showAlert("warning", "Validasi", "Harap pilih Kelas Sasaran.");
    if (!bulkText.trim())
      return showAlert("warning", "Validasi", "Teks soal masih kosong.");

    const blocks = bulkText.split(/(?:Jawaban|Kunci):\s*([A-E])/i);
    const parsed = [];
    let currentId =
      data.length > 0
        ? Math.max(...data.map((item) => parseInt(item.id) || 0))
        : 0;

    let wacanaTerakhir = "";

    for (let i = 0; i < blocks.length - 1; i += 2) {
      currentId += 1;
      let rawText = blocks[i].trim();
      let kunci = blocks[i + 1].toUpperCase();

      rawText = rawText.replace(/^\d+[\.\)]\s*/, "");

      let opsiA =
        rawText
          .match(/(?:^|\n)\s*[aA][\.\)]\s*(.+?)(?=\n\s*[bB][\.\)]|$)/is)?.[1]
          ?.trim() || "";
      let opsiB =
        rawText
          .match(/(?:^|\n)\s*[bB][\.\)]\s*(.+?)(?=\n\s*[cC][\.\)]|$)/is)?.[1]
          ?.trim() || "";
      let opsiC =
        rawText
          .match(/(?:^|\n)\s*[cC][\.\)]\s*(.+?)(?=\n\s*[dD][\.\)]|$)/is)?.[1]
          ?.trim() || "";
      let opsiD =
        rawText
          .match(/(?:^|\n)\s*[dD][\.\)]\s*(.+?)(?=\n\s*[eE][\.\)]|$)/is)?.[1]
          ?.trim() || "";
      let opsiE =
        rawText.match(/(?:^|\n)\s*[eE][\.\)]\s*(.+?)(?=$)/is)?.[1]?.trim() ||
        "";

      let teksSebelumOpsi = rawText.split(/(?:^|\n)\s*[aA][\.\)]\s*/)[0].trim();
      let wacana = "";
      let pertanyaan = "";

      // AI DETECTION LOGIC
      if (teksSebelumOpsi.includes("\n\n")) {
        let paragraf = teksSebelumOpsi.split(/\n\s*\n/);
        pertanyaan = paragraf.pop().trim();
        wacana = paragraf.join("\n\n").trim();
        wacanaTerakhir = wacana;
      } else {
        let lines = teksSebelumOpsi
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        const firstLine = lines[0] || "";

        const isWacanaMarker = /wacana|teks|kutipan|puisi|cerita/i.test(
          firstLine,
        );
        const isInstructionMarker =
          /perhatikan|cermatilah|bacalah|amatilah/i.test(firstLine);

        if (lines.length >= 2 && (isWacanaMarker || isInstructionMarker)) {
          pertanyaan = lines.pop().trim();
          wacana = lines.join("\n").trim();
          wacanaTerakhir = wacana;
        } else {
          pertanyaan = lines.join("\n").trim();
          wacana = wacanaTerakhir;
        }
      }

      if (wacana) {
        wacana = wacana.replace(
          /(untuk\s+(?:menjawab\s+)?soal\s+(?:nomor\s+)?\d+\s*(?:-|s\.?\/d\.?|sampai|dan)\s*\d+)/gi,
          "untuk menjawab soal di bawah ini",
        );
        wacana = wacana.replace(
          /wacana\s+untuk\s+\d+\s+soal\s+di\s+bawah\s+ini:?/gi,
          "",
        );
        wacana = wacana.trim();
      }

      parsed.push({
        id: currentId,
        mapel: bulkMapel,
        kelas: bulkKelas,
        poin: parseFloat(String(bulkPoin).replace(",", ".")) || 0,
        wacana: wacana,
        pertanyaan: pertanyaan,
        link_gambar: "",
        opsi_a: opsiA,
        opsi_b: opsiB,
        opsi_c: opsiC,
        opsi_d: opsiD,
        opsi_e: opsiE,
        jawaban_benar: kunci,
      });
    }
    setParsedBulkData(parsed);
  };

  const handleSaveBulk = async () => {
    if (parsedBulkData.length === 0) return;
    setIsSaving(true);
    setBulkProgress(0);

    try {
      for (let i = 0; i < parsedBulkData.length; i++) {
        await api.create(currentConfig.sheet, parsedBulkData[i]);
        setBulkProgress(i + 1);
      }

      setData((prev) => [...prev, ...parsedBulkData]);

      showAlert(
        "info",
        "Berhasil!",
        `Menyimpan ${parsedBulkData.length} soal selesai.`,
      );
      setIsBulkOpen(false);
      setBulkText("");
      setParsedBulkData([]);
    } catch (error) {
      showAlert(
        "danger",
        "Gagal!",
        "Kesalahan menyimpan masal: " + error.message,
      );
    } finally {
      setIsSaving(false);
      setBulkProgress(0);
    }
  };

  // --- PEMROSESAN DATA ---
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

    result.sort((a, b) => {
      const idA = parseInt(a.id, 10) || 0;
      const idB = parseInt(b.id, 10) || 0;
      return idA - idB;
    });

    return result;
  }, [data, search, filters]);

  // Handle Pilih Semua (Select All)
  const isAllSelected =
    processedData.length > 0 && selectedIds.length === processedData.length;
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(processedData.map((item) => item.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  // --- RENDERING TAMPILAN SOAL ---
  const renderBankSoal = () => {
    if (processedData.length === 0) {
      return (
        <div className="py-20 text-center text-slate-400 font-semibold text-lg bg-white rounded-[2rem] border border-slate-200 shadow-sm w-full">
          Tidak ada soal ditemukan.
        </div>
      );
    }

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

          {/* REVISI MOBILE: Tombol aksi selalu terlihat di HP, hanya disembunyikan pakai group-hover di Desktop */}
          <div className="absolute top-4 right-4 md:top-6 md:right-6 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleDuplicate(s)}
              className="p-1.5 md:p-2 bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-500 hover:text-white transition-all shadow-sm"
              title="Duplikat Soal Ini"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={() => openEditModal(s)}
              className="p-1.5 md:p-2 bg-white border border-amber-200 text-amber-600 rounded-lg hover:bg-amber-500 hover:text-white transition-all shadow-sm"
              title="Edit Soal"
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

          <div className="flex flex-wrap gap-2 items-center mb-6 pl-10 pr-24 md:pl-12 md:pr-32">
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
              <span
                className="bg-blue-50 text-blue-700 font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-md text-[9px] md:text-[10px] uppercase border border-blue-200 flex items-center gap-1"
                title="Aman untuk diacak, wacana melekat secara mandiri pada soal ini."
              >
                <Link2 size={12} /> Terikat Wacana
              </span>
            )}
          </div>

          <p className="font-semibold text-slate-800 leading-relaxed text-sm md:text-base mb-6 whitespace-pre-wrap">
            {s.pertanyaan}
          </p>

          {s.link_gambar && (
            <div className="mb-6 max-w-lg rounded-xl overflow-hidden border border-slate-200 shadow-sm p-2 bg-slate-50">
              <img
                src={s.link_gambar}
                alt="Lampiran Soal"
                className="w-full object-contain rounded-lg"
              />
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
      if (!grouped[key])
        grouped[key] = { nama_siswa: row.nama_siswa, kelas: row.kelas };
      grouped[key][row.mapel] = parseFloat(row.skor) || 0;
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

  // --- LOGIKA EXPORT & CETAK ---
  const handleExport = async (type) => {
    if (type === "print" || type === "pdf") {
      if (
        (nilaiViewMode === "rekap" && pivotNilaiData.data.length === 0) ||
        (nilaiViewMode === "log" && processedData.length === 0)
      ) {
        return showAlert("warning", "Kosong", "Tidak ada data untuk dicetak!");
      }

      const tableElement = document.getElementById("data-table-guru");
      if (!tableElement) return;

      const title =
        nilaiViewMode === "rekap"
          ? "REKAPITULASI BUKU NILAI SISWA"
          : "LOG RIWAYAT UJIAN SISWA";
      const subtitle = `Total Data: ${nilaiViewMode === "rekap" ? pivotNilaiData.data.length : processedData.length} | Waktu Cetak: ${new Date().toLocaleString("id-ID")}`;

      const printContent = `
        <!DOCTYPE html>
        <html lang="id">
          <head>
            <meta charset="UTF-8">
            <title>Cetak Data Nilai</title>
            <style>
              @page { size: auto; margin: 15mm; } 
              body { font-family: Arial, sans-serif; color: #000; margin: 0; padding: 0; }
              .header-print { text-align: center; margin-bottom: 25px; }
              .header-print h1 { font-size: 22pt; font-weight: 900; margin: 0 0 5px 0; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 10px; display: inline-block; }
              .header-print p { font-size: 11pt; color: #444; margin: 10px 0 0 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #000; padding: 8px; font-size: 10pt; text-align: center; }
              th { background-color: #f1f5f9 !important; font-weight: bold; -webkit-print-color-adjust: exact; color: #000; }
              td.col-nama { text-align: left; font-weight: bold; text-transform: uppercase; }
              .text-red-500, .text-red-600 { color: #dc2626 !important; font-weight: bold; }
              .text-blue-600 { color: #2563eb !important; font-weight: bold; }
              .text-emerald-600 { color: #059669 !important; font-weight: bold; }
              .bg-red-50 { background-color: #fef2f2 !important; -webkit-print-color-adjust: exact; }
              .print-hidden { display: none !important; }
            </style>
          </head>
          <body>
            <div class="header-print">
              <h1>${title}</h1>
              <p>${subtitle}</p>
            </div>
            ${tableElement.outerHTML}
          </body>
        </html>
      `;

      let printIframe = document.getElementById("print-iframe-cerdas");
      if (!printIframe) {
        printIframe = document.createElement("iframe");
        printIframe.id = "print-iframe-cerdas";
        printIframe.style.position = "absolute";
        printIframe.style.width = "0px";
        printIframe.style.height = "0px";
        printIframe.style.border = "none";
        document.body.appendChild(printIframe);
      }

      const iframeDoc = printIframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();

      printIframe.contentWindow.focus();
      setTimeout(() => {
        printIframe.contentWindow.print();
      }, 500);
      return;
    }

    let exportData = [];
    let exportHeaders = [];
    let wscols = [];

    if (nilaiViewMode === "rekap") {
      if (pivotNilaiData.data.length === 0)
        return showAlert("warning", "Kosong", "Tidak ada data untuk diekspor!");
      exportHeaders = [
        "No",
        "Nama Murid",
        "Kelas",
        ...pivotNilaiData.mapels,
        "Rata-Rata",
      ];
      exportData = pivotNilaiData.data.map((item, idx) => [
        idx + 1,
        item.nama_siswa,
        item.kelas,
        ...pivotNilaiData.mapels.map((m) =>
          item[m] !== undefined ? item[m] : "-",
        ),
        item.RataRata,
      ]);
      wscols = [
        { wch: 5 },
        { wch: 35 },
        { wch: 15 },
        ...pivotNilaiData.mapels.map(() => ({ wch: 15 })),
        { wch: 15 },
      ];
    } else {
      if (processedData.length === 0)
        return showAlert("warning", "Kosong", "Tidak ada data untuk diekspor!");
      exportHeaders = currentConfig.columns.map((c) => c.label);
      exportData = processedData.map((item) =>
        currentConfig.columns.map((c) => item[c.key] || "-"),
      );
      wscols = exportHeaders.map(() => ({ wch: 20 }));
    }

    if (type === "xls") {
      const worksheet = XLSX.utils.aoa_to_sheet([exportHeaders, ...exportData]);
      worksheet["!cols"] = wscols;
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Nilai");
      XLSX.writeFile(workbook, `Rekap_Nilai_CBT_${new Date().getTime()}.xlsx`);
      return;
    }

    if (type === "doc") {
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
        const dataRows = exportData.map(
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
                      text: "REKAPITULASI NILAI AKADEMIK",
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
        saveAs(blob, `Rekap_Nilai_CBT_${new Date().getTime()}.docx`);
      } catch (error) {
        console.error("Gagal membuat DOCX:", error);
        showAlert(
          "danger",
          "Kesalahan",
          "Terjadi kesalahan saat membuat file DOCX.",
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
        className="space-y-6 max-w-7xl mx-auto pb-24"
      >
        <style type="text/css">{`
          @keyframes gradientBG { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
          .header-live-bg { background: linear-gradient(-45deg, #d1fae5, #fef3c7, #ecfdf5, #f0fdfa); background-size: 400% 400%; animation: gradientBG 15s ease infinite; }
        `}</style>

        {/* HEADER ELEGAN */}
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

          <div>
            <div className="flex items-center gap-3">
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

          <div className="flex flex-wrap w-full md:w-auto gap-3 z-10">
            {tab === "soal" && (
              <>
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
                  className="flex-1 md:flex-none bg-linear-to-r from-emerald-600 to-emerald-500 text-white px-5 py-3 rounded-xl font-bold shadow-md shadow-emerald-500/30 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all text-sm border border-emerald-400"
                >
                  <Plus size={18} /> Buat Manual
                </button>
              </>
            )}

            {tab === "nilai" && (
              <div className="flex flex-wrap w-full gap-2 justify-end">
                <button
                  onClick={() => handleExport("print")}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  <Printer size={14} /> Print
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  <Download size={14} /> PDF
                </button>
                <button
                  onClick={() => handleExport("xls")}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  <Download size={14} /> EXCEL
                </button>
                <button
                  onClick={() => handleExport("doc")}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  <Download size={14} /> WORD
                </button>
              </div>
            )}
          </div>
        </motion.header>

        {/* TOGGLE VIEW MODE & STATISTIK (KHUSUS NILAI) */}
        <AnimatePresence mode="wait">
          {tab === "nilai" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex items-center gap-2 mb-6 bg-white p-1.5 rounded-xl w-max border border-slate-200 shadow-sm">
                <button
                  onClick={() => setNilaiViewMode("rekap")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${nilaiViewMode === "rekap" ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <TableProperties size={16} /> Buku Nilai
                </button>
                <button
                  onClick={() => setNilaiViewMode("log")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${nilaiViewMode === "log" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <LayoutList size={16} /> Log Riwayat
                </button>
              </div>

              {nilaiViewMode === "rekap" && statsNilai && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <Card className="p-4 md:p-5 border-none shadow-sm bg-linear-to-br from-emerald-600 to-emerald-500 text-white rounded-[1.5rem]">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">
                      Rata-Rata Umum
                    </p>
                    <div className="text-2xl md:text-3xl font-bold">
                      {statsNilai.rataRata}
                    </div>
                  </Card>
                  <Card className="p-4 md:p-5 border border-emerald-100 shadow-sm bg-emerald-50 rounded-[1.5rem]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/80 mb-1">
                      Nilai Tertinggi
                    </p>
                    <div className="text-2xl md:text-3xl font-bold text-emerald-700">
                      {statsNilai.tertinggi}
                    </div>
                  </Card>
                  <Card className="p-4 md:p-5 border border-rose-100 shadow-sm bg-rose-50 rounded-[1.5rem]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600/80 mb-1 flex flex-col sm:block">
                      <span>Siswa Remedial</span> <span>(&lt; {KKM_SCORE})</span>
                    </p>
                    <div className="text-2xl md:text-3xl font-bold text-rose-600 flex items-center gap-2 mt-1">
                      <BarChart3 size={20} className="md:w-6 md:h-6" /> {statsNilai.remedial}
                    </div>
                  </Card>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* STATISTIK & TOOLBAR GLOBAL */}
        <motion.div
          variants={fadeUp}
          className="flex flex-col xl:flex-row gap-4"
        >
          <Card className="p-6 bg-linear-to-br from-slate-900 to-slate-800 border border-slate-700 shadow-xl min-w-[200px] shrink-0 rounded-[2rem] relative overflow-hidden flex flex-col justify-center">
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
              {/* TOMBOL PILIH SEMUA & SAPU BERSIH (KHUSUS TAB SOAL) */}
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
                    )}
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

              {/* AREA FILTER - REVISI MOBILE GRID */}
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
                  <span className="md:hidden font-bold text-sm">Refresh Data</span>
                </button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ========================================== */}
        {/* PANEL AKSI MELAYANG (FLOATING BULK DELETE) */}
        {/* ========================================== */}
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
                  )}
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

        {/* KONTEN UTAMA: BANK SOAL ATAU NILAI */}
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
          /* KONTEN UTAMA: MONITORING NILAI */
          <motion.div variants={fadeUp}>
            {nilaiViewMode === "rekap" ? (
              <>
                {/* DESKTOP VIEW - REKAP NILAI */}
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
                              style={{ position: "sticky", left: 0, zIndex: 30, minWidth: "60px" }}
                              className="px-6 py-5 bg-slate-50 border-b-2 border-r border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider text-center"
                            >No</th>
                            <th
                              style={{ position: "sticky", left: "60px", zIndex: 30, minWidth: "220px" }}
                              className="px-6 py-5 bg-slate-50 border-b-2 border-r border-slate-200 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)] text-slate-500 font-bold text-xs uppercase tracking-wider"
                            >Nama Siswa</th>
                            <th className="px-6 py-5 bg-slate-50 border-b-2 border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider text-center">Kelas</th>
                            {pivotNilaiData.mapels.map((m) => (
                              <th key={m} className="px-6 py-5 bg-slate-50 border-b-2 border-l border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider text-center">{m}</th>
                            ))}
                            <th className="px-6 py-5 bg-emerald-50 border-b-2 border-l border-emerald-200 text-emerald-700 font-bold text-xs uppercase tracking-wider text-center">Rata-Rata</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {pivotNilaiData.data.map((item, idx) => (
                            <tr key={`${item.nama_siswa}_${item.kelas}`} className="hover:bg-emerald-50/40 transition-colors group bg-white">
                              <td style={{ position: "sticky", left: 0, zIndex: 10, minWidth: "60px" }} className="px-6 py-4 font-bold text-slate-400 bg-white border-r border-slate-100 text-center group-hover:bg-emerald-50 transition-colors">{idx + 1}</td>
                              <td style={{ position: "sticky", left: "60px", zIndex: 10, minWidth: "220px" }} className="px-6 py-4 font-bold text-slate-800 bg-white border-r border-slate-100 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.03)] group-hover:bg-emerald-50 transition-colors col-nama">{item.nama_siswa}</td>
                              <td className="px-6 py-4 text-center"><span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md font-semibold text-[11px] text-slate-600">{item.kelas}</span></td>
                              {pivotNilaiData.mapels.map((m) => {
                                const skor = item[m];
                                const isKkmFailed = skor !== undefined && skor < KKM_SCORE;
                                return (
                                  <td key={m} className={`px-6 py-4 text-center font-bold text-base border-l border-slate-100 ${isKkmFailed ? "text-rose-500 bg-rose-50/50" : "text-slate-600"}`}>
                                    {skor !== undefined ? skor : "-"}
                                  </td>
                                );
                              })}
                              <td className={`px-6 py-4 text-center font-bold text-lg border-l border-slate-100 ${parseFloat(item.RataRata) < KKM_SCORE ? "text-rose-600 bg-rose-50" : "text-emerald-600 bg-emerald-50/50"}`}>{item.RataRata}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </Card>

                {/* MOBILE VIEW - REKAP NILAI (BANKING CARD STYLE) */}
                <div className="md:hidden flex flex-col gap-4">
                  {pivotNilaiData.data.length === 0 ? (
                    <div className="py-20 text-center text-slate-400 font-semibold text-base bg-white rounded-2xl border border-slate-200">
                      Belum ada nilai ujian masuk.
                    </div>
                  ) : (
                    pivotNilaiData.data.map((item, idx) => (
                      <Card key={`${item.nama_siswa}_${item.kelas}`} className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl">
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
                            const isKkmFailed = skor !== undefined && skor < KKM_SCORE;
                            return (
                              <div key={m} className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-semibold">{m}</span>
                                <span className={`font-bold ${isKkmFailed ? "text-rose-500" : "text-slate-700"}`}>
                                  {skor !== undefined ? skor : "-"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Rata-Rata</span>
                          <span className={`font-black text-lg ${parseFloat(item.RataRata) < KKM_SCORE ? "text-rose-600" : "text-emerald-600"}`}>
                            {item.RataRata}
                          </span>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </>
            ) : (
              <>
                {/* DESKTOP VIEW - LOG RIWAYAT */}
                <Card className="hidden md:block overflow-hidden border-slate-200 shadow-xl shadow-slate-200/40 bg-white rounded-[2rem]">
                  <div className="overflow-auto max-h-[65vh] w-full relative scrollbar-thin">
                    {processedData.length === 0 ? (
                      <div className="py-20 text-center text-slate-400 font-semibold text-lg">
                        Tidak ada log ujian terekam.
                      </div>
                    ) : (
                      <table id="data-table-guru" className="w-full text-left text-sm whitespace-nowrap border-collapse">
                        <thead className="sticky top-0 z-20 shadow-sm">
                          <tr>
                            {currentConfig.columns.map((col, index) => {
                              const isID = index === 0;
                              const isName = index === 1;
                              const stickyStyle = isID ? { position: "sticky", left: 0, zIndex: 30, minWidth: "80px" } : isName ? { position: "sticky", left: "80px", zIndex: 30, minWidth: "220px" } : {};
                              return (
                                <th key={col.key} style={stickyStyle} className={`px-6 py-5 bg-slate-50 border-b-2 border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider ${isID || isName ? "border-r shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]" : ""}`}>
                                  {col.label}
                                </th>
                              );
                            })}
                            <th className="px-6 py-5 text-center bg-slate-50 border-b-2 border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider print-hidden">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {processedData.map((item, i) => (
                            <tr key={item.id || i} className="hover:bg-emerald-50/40 transition-colors group bg-white">
                              {currentConfig.columns.map((col, index) => {
                                const isID = index === 0;
                                const isName = index === 1;
                                const stickyStyle = isID ? { position: "sticky", left: 0, zIndex: 10, minWidth: "80px" } : isName ? { position: "sticky", left: "80px", zIndex: 10, minWidth: "220px" } : {};
                                return (
                                  <td key={col.key} style={stickyStyle} className={`px-6 py-4 font-semibold text-slate-700 ${isID || isName ? "bg-white border-r border-slate-100 group-hover:bg-emerald-50 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.03)]" : ""}`}>
                                    {col.key === "status" ? (
                                      <Badge type={item[col.key]} />
                                    ) : col.key === "skor" ? (
                                      <span className={`text-base font-bold ${parseFloat(item[col.key]) < KKM_SCORE ? "text-rose-500" : "text-emerald-600"}`}>
                                        {item[col.key]}
                                      </span>
                                    ) : (
                                      item[col.key] || "-"
                                    )}
                                  </td>
                                );
                              })}
                              <td className="px-6 py-4 text-center print-hidden">
                                <button onClick={() => handleDelete(item.id)} className="p-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </Card>

                {/* MOBILE VIEW - LOG RIWAYAT (BANKING CARD STYLE) */}
                <div className="md:hidden flex flex-col gap-4">
                  {processedData.length === 0 ? (
                    <div className="py-20 text-center text-slate-400 font-semibold text-base bg-white rounded-2xl border border-slate-200">
                      Tidak ada log ujian terekam.
                    </div>
                  ) : (
                    processedData.map((item, i) => (
                      <Card key={item.id || i} className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl">
                        <div className="flex justify-between items-start gap-3 mb-3 pb-3 border-b border-slate-100">
                          <span className="font-black text-slate-800 text-[15px] leading-tight line-clamp-2">
                            {item.nama_siswa}
                          </span>
                          <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 shrink-0">
                            #{item.id}
                          </span>
                        </div>
                        <div className="space-y-2 mb-4">
                          {currentConfig.columns.map(col => {
                            if (col.key === 'id' || col.key === 'nama_siswa') return null;
                            return (
                              <div key={col.key} className="flex justify-between items-center text-sm gap-4">
                                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider shrink-0">{col.label}</span>
                                <div className="text-right font-semibold text-slate-700 truncate">
                                  {col.key === "status" ? (
                                    <Badge type={item[col.key]} />
                                  ) : col.key === "skor" ? (
                                    <span className={`text-[15px] font-bold ${parseFloat(item[col.key]) < KKM_SCORE ? "text-rose-500" : "text-emerald-600"}`}>
                                      {item[col.key]}
                                    </span>
                                  ) : (
                                    item[col.key] || <span className="text-slate-300">-</span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        <div className="pt-3 border-t border-slate-100 flex">
                          <button onClick={() => handleDelete(item.id)} className="w-full py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold text-sm flex justify-center items-center gap-2 hover:bg-red-100 transition-colors">
                            <Trash2 size={16}/> Hapus Log
                          </button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* MODAL BUAT/EDIT MANUAL (COMPACT PADA MOBILE) */}
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

                  <form onSubmit={handleSave} className="space-y-4 md:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 bg-slate-50 p-4 md:p-5 rounded-[1rem] md:rounded-[1.5rem] border border-slate-100">
                      <div className="space-y-1.5">
                        <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                          ID Sistem (Bisa Diedit)
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
                        <AlertTriangle size={12} className="shrink-0 mt-0.5 md:mt-0" /> Jangan gunakan kalimat
                        "Untuk soal nomor 1-5" di dalam teks wacana, karena soal
                        CBT akan diacak.
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

                    <div className="space-y-1 md:space-y-1.5">
                      <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                        Link Gambar Lampiran (Opsional)
                      </label>
                      <input
                        type="text"
                        disabled={isSaving}
                        placeholder="Contoh: https://i.imgur.com/gambar.png"
                        className="w-full p-2.5 md:p-3.5 text-xs md:text-sm bg-white border border-slate-200 rounded-lg md:rounded-xl font-medium text-slate-700 outline-none focus:border-emerald-500 transition-all shadow-sm"
                        value={formData.link_gambar || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            link_gambar: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5 pt-1 md:pt-2">
                      {["A", "B", "C", "D", "E"].map((opt) => {
                        const keyMap = `opsi_${opt.toLowerCase()}`;
                        const isKunci = formData.jawaban_benar === opt;
                        return (
                          <div key={opt} className="space-y-1 md:space-y-1.5 relative">
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
                          className="w-full p-2.5 md:p-3.5 text-xs md:text-sm bg-linear-to-r from-emerald-600 to-emerald-500 border border-emerald-400 text-white rounded-lg md:rounded-xl font-bold outline-none shadow-md cursor-pointer"
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
                        className="w-full bg-linear-to-r from-emerald-600 to-emerald-500 text-white font-bold text-sm md:text-sm py-3 md:py-4 rounded-lg md:rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 hover:scale-[1.01] active:scale-95 transition-all uppercase tracking-widest disabled:opacity-70 disabled:cursor-not-allowed border border-emerald-400"
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

        {/* MODAL IMPORT MASAL (SMART PASTE) - COMPACT MOBILE */}
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
                      <p className="text-slate-500 font-medium text-[10px] md:text-xs mt-1 md:mt-1.5">
                        Sistem AI otomatis memisahkan Wacana, Pertanyaan
                        (termasuk list menurun), dan menghapus tulisan "Soal
                        nomor X-Y".
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

                  <textarea
                    className="w-full p-4 md:p-5 bg-slate-50 border border-slate-200 rounded-xl md:rounded-[1.5rem] font-mono text-[11px] md:text-[13px] outline-none focus:bg-white focus:border-emerald-500 transition-all resize-y h-48 md:h-64 text-slate-700 shadow-inner leading-relaxed"
                    placeholder="Paste soal dari Ms.Word ke sini...&#10;&#10;Contoh Format:&#10;Teks wacana cerita diletakkan di awal paragraf (jika ada).&#10;Pertanyaan diletakkan sebelum opsi.&#10;a. opsi A&#10;b. opsi B&#10;c. opsi C&#10;d. opsi D&#10;e. opsi E&#10;Kunci: D"
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
                        className="w-full bg-linear-to-r from-emerald-600 to-emerald-500 text-white font-bold text-sm md:text-sm py-3 md:py-4 rounded-lg md:rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 hover:scale-[1.01] active:scale-95 transition-all uppercase tracking-widest disabled:opacity-70 border border-emerald-400"
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
                    {customAlert.type === "danger" || customAlert.type === "confirm" ? (
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
                    {customAlert.type === "confirm" || customAlert.type === "danger" ? (
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
      </motion.div>
    </Dashboard>
  );
};

export default GuruDashboard;