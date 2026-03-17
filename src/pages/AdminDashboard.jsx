// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  BookMarked,
  Settings,
  RefreshCw,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Save,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Check,
  AlertTriangle,
  Info,
  Square,
  CheckSquare,
  Sparkles,
} from "lucide-react";
import { api } from "../api/api";
import Dashboard from "../components/layout/Dashboard";
import { Card, Badge } from "../components/ui/Ui";

// ==========================================
// HELPER: FORMAT TANGGAL
// ==========================================
const formatTanggal = (isoString) => {
  if (!isoString) return "-";
  if (
    typeof isoString === "string" &&
    isoString.includes("T") &&
    isoString.includes("Z")
  ) {
    try {
      const d = new Date(isoString);
      return d
        .toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
        .replace(/\./g, ":");
    } catch (e) {
      return isoString;
    }
  }
  return isoString;
};

// ==========================================
// ANIMASI FRAMER MOTION
// ==========================================
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ==========================================
// 1. KOMPONEN PREMIUM CUSTOM DROPDOWN (SINGLE)
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
        className={`w-full flex items-center justify-between p-2.5 md:p-3 text-sm bg-white border transition-all rounded-lg md:rounded-xl outline-none shadow-sm min-h-[40px] md:min-h-[46px]
          ${disabled ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" : "border-slate-200 text-slate-700 focus:border-emerald-500 hover:border-emerald-400 cursor-pointer"}
        `}
      >
        <span
          className={`flex items-center gap-2 line-clamp-2 text-left break-words ${!selectedOption ? "text-slate-400" : "font-semibold"}`}
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
            className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-52 md:max-h-60 overflow-y-auto py-1"
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
// 1.B KOMPONEN PREMIUM MULTI-SELECT CHECKBOX
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
        className={`w-full flex items-center justify-between p-2.5 md:p-3 text-sm bg-white border transition-all rounded-lg md:rounded-xl outline-none shadow-sm min-h-[40px] md:min-h-[46px]
          ${disabled ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" : "border-slate-200 text-slate-700 focus:border-emerald-500 hover:border-emerald-400 cursor-pointer"}
        `}
      >
        <span
          className={`line-clamp-2 text-left break-words pr-2 ${selectedArray.length === 0 ? "text-slate-400" : "font-semibold"}`}
        >
          {selectedArray.length === 0
            ? placeholder
            : selectedArray.length > 2
              ? `${selectedArray.length} Kategori Dipilih`
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
                Pilih Kategori Kelas
              </span>
              {selectedArray.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="text-[10px] font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="overflow-y-auto p-2 scrollbar-hide flex flex-col gap-1">
              {options.map((opt, index) => {
                if (opt.isLabel) {
                  return (
                    <div
                      key={index}
                      className="px-3 pt-3 pb-1 text-[10px] font-black text-emerald-700 uppercase tracking-widest bg-white sticky top-0"
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
const MAKSIMAL_ROMBEL = 2; // Berarti ada kelas 1 dan 2

const OPSI_KELAS_LENGKAP = [
  { label: "KATEGORI GLOBAL", isLabel: true },
  { label: "Semua Kelas (Umum)", value: "SEMUA" },
];

// 1. Kategori Tingkat (X, XI, XII)
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

// 2. Kategori Jurusan Global (Semua MIPA, Semua IPS)
OPSI_KELAS_LENGKAP.push({ label: "KATEGORI JURUSAN GLOBAL", isLabel: true });
JURUSAN_SEKOLAH.forEach((j) => {
  OPSI_KELAS_LENGKAP.push({ label: `Semua ${j} (X, XI, XII)`, value: j });
});

// 3. Kategori Tingkat + Jurusan (X MIPA, XII IPS, dll)
OPSI_KELAS_LENGKAP.push({ label: "KATEGORI TINGKAT & JURUSAN", isLabel: true });
TINGKAT_SEKOLAH.forEach((t) => {
  JURUSAN_SEKOLAH.forEach((j) => {
    OPSI_KELAS_LENGKAP.push({ label: `${t} ${j}`, value: `${t} ${j}` });
  });
});

// 4. Kelas Spesifik / Rombel (X MIPA 1, XII IPS 2, dll)
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

// ==========================================
// 2. KONFIGURASI DINAMIS (SCHEMA)
// ==========================================
const TAB_CONFIG = {
  siswa: {
    sheet: "Users",
    title: "Database User",
    subtitle: "Manajemen Akses Siswa & Guru",
    columns: [
      { key: "id", label: "ID", sortable: true },
      { key: "nama", label: "Nama Lengkap", sortable: true },
      { key: "username", label: "Username", sortable: true },
      { key: "password", label: "Password" },
      { key: "role", label: "Role", sortable: true, filterable: true },
      { key: "kelas", label: "Kelas", sortable: true, filterable: true },
    ],
    form: [
      { key: "nama", label: "Nama Lengkap", type: "text", required: true },
      { key: "username", label: "Username", type: "text", required: true },
      { key: "password", label: "Password", type: "text", required: true },
      {
        key: "role",
        label: "Role",
        type: "select",
        options: ["siswa", "guru", "admin"],
        required: true,
      },
      {
        key: "kelas",
        label: "Kelas (Kosongkan jika bukan Siswa)",
        type: "multi-select",
        options: OPSI_KELAS_LENGKAP,
        required: false,
      },
    ],
    defaultValues: {
      nama: "",
      username: "",
      password: "",
      role: "siswa",
      kelas: "",
    },
  },
  jadwal: {
    sheet: "Jadwal",
    title: "Jadwal Ujian",
    subtitle: "Manajemen Sesi Ujian CBT",
    columns: [
      { key: "id", label: "ID", sortable: true },
      { key: "nama_ujian", label: "Nama Ujian", sortable: true },
      {
        key: "mapel",
        label: "Mata Pelajaran",
        sortable: true,
        filterable: true,
      },
      { key: "kelas", label: "Target Kelas", sortable: true, filterable: true },
      { key: "tanggal", label: "Tanggal", sortable: true },
      { key: "durasi_menit", label: "Durasi" },
      { key: "token", label: "Token", sortable: true, filterable: true },
      { key: "status", label: "Status", sortable: true, filterable: true },
    ],
    form: [
      {
        key: "nama_ujian",
        label: "Nama Ujian (Contoh: UM 2026)",
        type: "text",
        required: true,
      },
      { key: "mapel", label: "Mata Pelajaran", type: "text", required: true },
      {
        key: "kelas",
        label: "Target Peserta Ujian",
        type: "multi-select",
        options: OPSI_KELAS_LENGKAP,
        required: true,
      },
      {
        key: "tanggal",
        label: "Tanggal Pelaksanaan",
        type: "date",
        required: true,
      },
      {
        key: "durasi_menit",
        label: "Durasi (Menit)",
        type: "number",
        required: true,
      },
      {
        key: "token",
        label: "Token",
        type: "text",
        required: true,
      },
      {
        key: "status",
        label: "Status Ujian",
        type: "select",
        options: ["Draft", "Aktif", "Selesai"],
        required: true,
      },
    ],
    defaultValues: {
      nama_ujian: "",
      mapel: "",
      kelas: "",
      tanggal: "",
      durasi_menit: "90",
      token: "",
      status: "Draft",
    },
  },
  mapel: {
    sheet: "Mapel",
    title: "Mata Pelajaran",
    subtitle: "Daftar Mata Pelajaran Aktif",
    columns: [
      { key: "id", label: "ID", sortable: true },
      { key: "nama_mapel", label: "Nama Mapel", sortable: true },
      {
        key: "guru_pengampu",
        label: "Guru Pengampu",
        sortable: true,
        filterable: true,
      },
    ],
    form: [
      {
        key: "nama_mapel",
        label: "Nama Mata Pelajaran",
        type: "text",
        required: true,
      },
      {
        key: "guru_pengampu",
        label: "Nama Guru Pengampu",
        type: "text",
        required: true,
      },
    ],
    defaultValues: { nama_mapel: "", guru_pengampu: "" },
  },
  settings: {
    sheet: "Settings",
    title: "Konfigurasi Sistem",
    subtitle: "Pengaturan Global Aplikasi CBT",
    columns: [
      { key: "id", label: "ID", sortable: true },
      {
        key: "kunci",
        label: "Nama Pengaturan",
        sortable: true,
        filterable: true,
      },
      { key: "nilai", label: "Isi / Keterangan", sortable: true },
    ],
    form: [
      { key: "kunci", label: "Nama Pengaturan", type: "text", required: true },
      {
        key: "nilai",
        label: "Isi / Keterangan Pengaturan",
        type: "text",
        required: true,
      },
    ],
    defaultValues: { kunci: "", nilai: "" },
  },
};

const MENU_ITEMS = [
  { id: "siswa", label: "Manajemen User", icon: ShieldCheck },
  { id: "jadwal", label: "Jadwal Ujian", icon: Calendar },
  { id: "mapel", label: "Mata Pelajaran", icon: BookMarked },
  { id: "settings", label: "Konfigurasi", icon: Settings },
];

// ==========================================
// 3. KOMPONEN UTAMA
// ==========================================
const AdminDashboard = () => {
  const [tab, setTab] = useState("siswa");
  const [data, setData] = useState([]);

  const currentConfig = TAB_CONFIG[tab];

  // State Loading & Sync
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // State Custom Alert
  const [customAlert, setCustomAlert] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });

  // State Search, Filter, Sort
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [isEdit, setIsEdit] = useState(false);
  const [originalId, setOriginalId] = useState(null);

  // --- FITUR BARU: MASTER SWITCH ANTI-CHEAT ---
  const antiCheatSetting = data.find((item) => item.kunci === "Mode_Ujian");
  const isAntiCheatOn = antiCheatSetting
    ? antiCheatSetting.nilai !== "OFF"
    : true;

  const handleToggleAntiCheat = async () => {
    showAlert(
      "confirm",
      "Ubah Mode Ujian?",
      `Yakin ingin ${isAntiCheatOn ? "MEMATIKAN" : "MENGHIDUPKAN"} fitur Anti-Cheat?`,
      async () => {
        closeAlert();
        setIsSaving(true);
        try {
          if (antiCheatSetting) {
            await api.update(currentConfig.sheet, antiCheatSetting.id, {
              ...antiCheatSetting,
              nilai: isAntiCheatOn ? "OFF" : "ON",
            });
          } else {
            const maxId =
              data.length > 0
                ? Math.max(...data.map((item) => parseInt(item.id) || 0))
                : 0;
            await api.create(currentConfig.sheet, {
              id: maxId + 1,
              kunci: "Mode_Ujian",
              nilai: "OFF",
            });
          }
          await fetchData(false);
          showAlert(
            "success",
            "Berhasil!",
            `Anti-Cheat sekarang ${isAntiCheatOn ? "NONAKTIF (Mode Uji Coba)" : "AKTIF (Mode Ujian Ketat)"}.`,
          );
        } catch (error) {
          showAlert("danger", "Gagal", error.message);
        } finally {
          setIsSaving(false);
        }
      },
    );
  };
  // --------------------------------------------

  // --- FITUR BARU: MASTER SWITCH EKSKLUSIF APLIKASI ---
  const appOnlySetting = data.find((item) => item.kunci === "Mode_Aplikasi");
  const isAppOnlyOn = appOnlySetting ? appOnlySetting.nilai === "ON" : false;

  const handleToggleAppOnly = async () => {
    showAlert(
      "confirm",
      "Ubah Mode Akses?",
      `Yakin ingin ${isAppOnlyOn ? "MEMATIKAN" : "MENGHIDUPKAN"} fitur Akses Khusus Aplikasi? Jika hidup, siswa tidak bisa login via browser biasa.`,
      async () => {
        closeAlert();
        setIsSaving(true);
        try {
          if (appOnlySetting) {
            await api.update(currentConfig.sheet, appOnlySetting.id, {
              ...appOnlySetting,
              nilai: isAppOnlyOn ? "OFF" : "ON",
            });
          } else {
            const maxId =
              data.length > 0
                ? Math.max(...data.map((item) => parseInt(item.id) || 0))
                : 0;
            await api.create(currentConfig.sheet, {
              id: maxId + 1,
              kunci: "Mode_Aplikasi",
              nilai: "ON",
            });
          }
          await fetchData(false);
          showAlert(
            "success",
            "Berhasil!",
            `Akses Khusus Aplikasi sekarang ${isAppOnlyOn ? "NONAKTIF (Bisa via Browser)" : "AKTIF (Hanya via APK)"}.`,
          );
        } catch (error) {
          showAlert("danger", "Gagal", error.message);
        } finally {
          setIsSaving(false);
        }
      },
    );
  };
  // --------------------------------------------

  // Helper Custom Alert
  const showAlert = (type, title, message, onConfirm = null) => {
    setCustomAlert({ isOpen: true, type, title, message, onConfirm });
  };
  const closeAlert = () => setCustomAlert({ ...customAlert, isOpen: false });

  // FUNGSI FETCH DATA
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
    setSortConfig({ key: "id", direction: "asc" });
    fetchData(false);
    const intervalId = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(intervalId);
  }, [tab]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    else if (sortConfig.key === key && sortConfig.direction === "desc")
      return setSortConfig({ key: null, direction: "asc" });
    setSortConfig({ key, direction });
  };

  const confirmDelete = (id) => {
    showAlert(
      "confirm",
      "Hapus Data?",
      `Yakin ingin menghapus data dengan ID: #${id}? Tindakan ini permanen.`,
      async () => {
        closeAlert();
        setLoading(true);
        try {
          await api.delete(currentConfig.sheet, id);
          await fetchData(false);
        } catch (error) {
          showAlert("danger", "Gagal Menghapus", error.message);
        } finally {
          setLoading(false);
        }
      },
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // 1. Validasi form kosong
    for (const field of currentConfig.form) {
      if (
        field.required &&
        (!formData[field.key] || String(formData[field.key]).trim() === "")
      ) {
        return showAlert(
          "warning",
          "Validasi Gagal",
          `Harap isi kolom ${field.label} terlebih dahulu.`,
        );
      }
    }

    // 2. Cek Duplikat ID
    if (!isEdit || (isEdit && String(originalId) !== String(formData.id))) {
      const isDuplicate = data.some(
        (item) => String(item.id) === String(formData.id),
      );
      if (isDuplicate) {
        const maxId = Math.max(...data.map((item) => parseInt(item.id) || 0));
        const safeId = maxId + 1;
        showAlert(
          "warning",
          "ID Duplikat",
          `ID "#${formData.id}" sudah dipakai. Sistem telah menyesuaikan ke ID #${safeId}. Silakan simpan kembali.`,
        );
        setFormData({ ...formData, id: safeId });
        return;
      }
    }

    setIsSaving(true);
    try {
      // 3. Format data sebelum dikirim (Angka harus integer)
      const payloadToSave = { ...formData };

      if (payloadToSave.id) payloadToSave.id = parseInt(payloadToSave.id);
      if (payloadToSave.durasi_menit)
        payloadToSave.durasi_menit = parseInt(payloadToSave.durasi_menit);

      // Eksekusi API
      if (isEdit) {
        await api.update(currentConfig.sheet, originalId, payloadToSave);
      } else {
        await api.create(currentConfig.sheet, payloadToSave);
      }

      setIsModalOpen(false);
      await fetchData(false);
      showAlert("success", "Berhasil", "Data berhasil disimpan ke database!");
    } catch (error) {
      showAlert("danger", "Gagal Menyimpan", error.message);
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
    setFormData(item);
    setIsModalOpen(true);
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
        if (filterKey === "jurusan") {
          result = result.filter((item) =>
            String(item.kelas || "")
              .toUpperCase()
              .includes(filters[filterKey].toUpperCase()),
          );
        } else {
          result = result.filter(
            (item) =>
              String(item[filterKey] || "").toLowerCase() ===
              String(filters[filterKey]).toLowerCase(),
          );
        }
      }
    });
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = String(a[sortConfig.key] || "").toLowerCase();
        const bVal = String(b[sortConfig.key] || "").toLowerCase();
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        if (!isNaN(aNum) && !isNaN(bNum))
          return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [data, search, filters, sortConfig]);

  const getFilterOptions = (key) => {
    const uniqueVals = [...new Set(data.map((item) => item[key]))];
    return uniqueVals
      .filter(
        (val) => val !== "" && val !== null && val !== undefined && val !== "-",
      )
      .sort();
  };

  const getPrimaryName = (item) => {
    return (
      item.nama ||
      item.nama_ujian ||
      item.nama_mapel ||
      item.kunci ||
      "Tanpa Nama"
    );
  };

  return (
    <Dashboard menu={MENU_ITEMS} active={tab} setActive={setTab}>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-6 max-w-7xl mx-auto pb-20"
      >
        <style type="text/css">{`
          @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .header-live-bg {
            background: linear-gradient(-45deg, #d1fae5, #fef3c7, #ecfdf5, #f0fdfa);
            background-size: 400% 400%;
            animation: gradientBG 15s ease infinite;
          }
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

          <div className="flex items-center gap-4 z-10">
            <div className="p-4 bg-white/80 backdrop-blur-sm text-emerald-600 rounded-2xl shadow-sm border border-white/60">
              <Settings size={28} className={isSyncing ? "animate-spin" : ""} />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight drop-shadow-sm">
                {currentConfig.title}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-slate-600 font-medium text-sm">
                  {currentConfig.subtitle}
                </p>
                {isSyncing && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md text-[10px] font-bold uppercase animate-pulse border border-amber-200">
                    <RefreshCw size={10} className="animate-spin" /> Sync
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="w-full md:w-auto flex flex-col md:flex-row gap-3 z-10">
            {tab === "settings" && (
              <div className="flex flex-col md:flex-row gap-2 w-full">
                <button
                  onClick={handleToggleAntiCheat}
                  className={`w-full md:w-auto px-5 py-3.5 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2 transition-all text-sm border ${isAntiCheatOn ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 shadow-red-500/10" : "bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-400 hover:scale-105 shadow-blue-500/30"}`}
                >
                  <ShieldCheck size={20} />{" "}
                  {isAntiCheatOn ? "Matikan Anti-Cheat" : "Hidupkan Anti-Cheat"}
                </button>
                <button
                  onClick={handleToggleAppOnly}
                  className={`w-full md:w-auto px-5 py-3.5 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2 transition-all text-sm border ${isAppOnlyOn ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 shadow-amber-500/10" : "bg-slate-800 text-white border-slate-700 hover:scale-105 shadow-slate-500/30"}`}
                >
                  {isAppOnlyOn ? <Unlock size={20} /> : <Lock size={20} />}
                  {isAppOnlyOn ? "Buka Akses Browser" : "Kunci Hanya Aplikasi"}
                </button>
              </div>
            )}
            <button
              onClick={openAddModal}
              className="w-full md:w-auto bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-3.5 rounded-2xl font-bold shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all text-sm border border-emerald-400 z-10"
            >
              <Plus size={20} /> Tambah Data Baru
            </button>
          </div>
        </motion.header>

        {/* INFO BANNER */}
        <motion.div
          variants={fadeUp}
          className="relative overflow-hidden bg-white border border-slate-100 rounded-[1.5rem] p-5 text-sm text-slate-700 flex items-start gap-4 shadow-sm"
        >
          <div className="p-2.5 bg-amber-50 rounded-full text-amber-500 shrink-0">
            <Sparkles size={20} />
          </div>
          <div className="leading-relaxed pt-0.5">
            <strong className="text-slate-800 font-black tracking-wide block mb-1">
              Manajemen Data Responsif
            </strong>
            Admin bisa edit/tambah user, pastikan selalu mencoba{" "}
            <b>klik kolom apapun yang ada</b> untuk menjelajahi fitur. Anda juga
            bisa menganti <b>mode desktop/mobile</b> lewat pengaturan chrome
            (titik 3 diatas-kanan).
          </div>
        </motion.div>

        {/* STATISTIK & TOOLBAR */}
        <motion.div
          variants={fadeUp}
          className="flex flex-col xl:flex-row gap-4"
        >
          <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 shadow-xl min-w-[200px] shrink-0 rounded-[2rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldCheck size={56} className="text-emerald-400" />
            </div>
            <div className="flex justify-between items-start relative z-10">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Total Data Tampil
              </p>
            </div>
            <div className="flex items-baseline gap-2 mt-3 relative z-10">
              <p className="text-4xl font-black text-white">
                {processedData.length}
              </p>
              {processedData.length !== data.length && (
                <p className="text-xs font-medium text-slate-400">
                  dari {data.length} Total
                </p>
              )}
            </div>
          </Card>

          <Card className="flex-1 p-3 bg-white border border-slate-200 shadow-sm w-full rounded-[2rem] box-border flex flex-col justify-center">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full min-w-0 px-2">
              <div className="flex items-center gap-2 w-full md:flex-1 md:border-r border-slate-200 pr-0 md:pr-4">
                <Search className="text-slate-400 shrink-0" size={20} />
                <input
                  className="w-full bg-transparent border-none outline-none font-medium text-base text-slate-700 placeholder:text-slate-400 min-w-0 py-2"
                  placeholder={`Cari di ${currentConfig.title}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto min-w-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-wrap items-center gap-3 w-full md:w-auto min-w-0">
                  {currentConfig.columns.some((c) => c.key === "kelas") && (
                    <div className="w-full md:w-40">
                      <PremiumSelect
                        value={filters["jurusan"] || ""}
                        onChange={(val) =>
                          setFilters({ ...filters, jurusan: val })
                        }
                        options={[
                          { label: "Semua Jurusan", value: "" },
                          { label: "Jurusan MIPA", value: "MIPA" },
                          { label: "Jurusan IPS", value: "IPS" },
                        ]}
                        placeholder="Filter Jurusan"
                      />
                    </div>
                  )}

                  {currentConfig.columns
                    .filter((c) => c.filterable)
                    .map((col) => (
                      <div key={col.key} className="w-full md:w-40">
                        <PremiumSelect
                          value={filters[col.key] || ""}
                          onChange={(val) =>
                            setFilters({ ...filters, [col.key]: val })
                          }
                          options={[
                            { label: `Semua ${col.label}`, value: "" },
                            ...getFilterOptions(col.key).map((opt) => ({
                              label: opt,
                              value: opt,
                            })),
                          ]}
                          placeholder={`Filter ${col.label}`}
                        />
                      </div>
                    ))}
                </div>

                <button
                  onClick={() => fetchData(false)}
                  className="w-full md:w-auto flex justify-center items-center gap-2 p-3.5 text-slate-500 bg-slate-50 border border-slate-200 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 rounded-xl transition-all shrink-0 shadow-sm"
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

        {/* TAMPILAN DATA (RESPONSIVE) */}
        <motion.div variants={fadeUp}>
          {/* DESKTOP VIEW */}
          <Card className="hidden md:block border border-slate-200 shadow-xl shadow-slate-200/40 bg-white rounded-[2rem] overflow-hidden relative">
            <div className="overflow-auto max-h-[65vh] w-full relative scrollbar-thin">
              <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
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
                          className={`px-6 py-5 transition-colors font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 border-b-2 border-slate-200 ${col.sortable ? "cursor-pointer hover:bg-slate-100" : ""} ${isID ? "border-r border-slate-200" : ""} ${isName ? "border-r border-slate-200 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]" : ""}`}
                          onClick={() => col.sortable && handleSort(col.key)}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`${sortConfig.key === col.key ? "text-emerald-700 font-black" : ""}`}
                            >
                              {col.label}
                            </span>
                            {col.sortable && (
                              <div className="flex items-center">
                                {sortConfig.key === col.key ? (
                                  sortConfig.direction === "asc" ? (
                                    <ChevronUp
                                      size={14}
                                      className="text-emerald-600 font-black"
                                    />
                                  ) : (
                                    <ChevronDown
                                      size={14}
                                      className="text-emerald-600 font-black"
                                    />
                                  )
                                ) : (
                                  <ArrowUpDown
                                    size={12}
                                    className="text-slate-400 hover:text-emerald-600 transition-colors"
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        </th>
                      );
                    })}
                    <th className="px-6 py-5 text-center bg-slate-50 border-b-2 border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={currentConfig.columns.length + 1}
                        className="py-20 text-center bg-white"
                      >
                        <RefreshCw
                          className="animate-spin mx-auto text-emerald-500 mb-4"
                          size={32}
                        />
                        <span className="font-bold text-slate-400 text-sm tracking-widest uppercase">
                          Sinkronisasi Server...
                        </span>
                      </td>
                    </tr>
                  ) : processedData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={currentConfig.columns.length + 1}
                        className="py-20 text-center text-slate-400 font-semibold text-base bg-white"
                      >
                        {data.length === 0
                          ? "Belum ada data di dalam sistem."
                          : "Pencarian tidak menemukan hasil."}
                      </td>
                    </tr>
                  ) : (
                    processedData.map((item, i) => (
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
                              className={`px-6 py-4 font-semibold text-slate-700 ${isID ? "bg-white border-r border-slate-100 group-hover:bg-emerald-50 transition-colors" : ""} ${isName ? "bg-white border-r border-slate-100 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.03)] group-hover:bg-emerald-50 transition-colors" : ""}`}
                            >
                              {col.key === "role" || col.key === "status" ? (
                                <Badge type={item[col.key]} />
                              ) : col.key === "id" ? (
                                <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                                  #{item[col.key]}
                                </span>
                              ) : isName ? (
                                <span className="font-black text-slate-800">
                                  {item[col.key]}
                                </span>
                              ) : col.key === "tanggal" ? (
                                <span className="text-slate-600 font-medium tracking-wide">
                                  {formatTanggal(item[col.key])}
                                </span>
                              ) : (
                                item[col.key] || (
                                  <span className="text-slate-300">-</span>
                                )
                              )}
                            </td>
                          );
                        })}
                        <td className="px-6 py-4 text-center space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 bg-white border border-amber-200 text-amber-600 rounded-lg hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all shadow-sm hover:shadow-md"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => confirmDelete(item.id)}
                            className="p-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm hover:shadow-md"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* MOBILE VIEW */}
          <div className="md:hidden flex flex-col gap-4">
            {loading ? (
              <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
                <RefreshCw
                  className="animate-spin mx-auto text-emerald-500 mb-4"
                  size={32}
                />
                <span className="font-bold text-slate-400 text-sm tracking-widest uppercase">
                  Memuat Data...
                </span>
              </div>
            ) : processedData.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-semibold text-base bg-white rounded-2xl border border-slate-200">
                {data.length === 0
                  ? "Belum ada data di dalam sistem."
                  : "Pencarian tidak menemukan hasil."}
              </div>
            ) : (
              processedData.map((item, i) => (
                <Card
                  key={item.id || i}
                  className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl relative overflow-hidden"
                >
                  <div className="flex justify-between items-start gap-3 mb-4 pb-4 border-b border-slate-100">
                    <span className="font-black text-slate-800 text-[17px] leading-tight line-clamp-2">
                      {getPrimaryName(item)}
                    </span>
                    <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 shrink-0">
                      #{item.id}
                    </span>
                  </div>

                  <div className="space-y-3 mb-5">
                    {currentConfig.columns.map((col) => {
                      const isPrimaryName =
                        col.key === "id" ||
                        col.key === "nama" ||
                        col.key === "nama_ujian" ||
                        col.key === "nama_mapel" ||
                        col.key === "kunci";
                      if (isPrimaryName) return null;

                      return (
                        <div
                          key={col.key}
                          className="flex justify-between items-center gap-4 text-sm"
                        >
                          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider shrink-0">
                            {col.label}
                          </span>
                          <div className="text-right font-semibold text-slate-700 truncate max-w-[65%]">
                            {col.key === "role" || col.key === "status" ? (
                              <Badge type={item[col.key]} />
                            ) : col.key === "tanggal" ? (
                              <span className="tracking-wide text-[13px]">
                                {formatTanggal(item[col.key])}
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

                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => openEditModal(item)}
                      className="flex-1 py-3 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl font-bold text-sm flex justify-center items-center gap-2 hover:bg-amber-100 transition-colors"
                    >
                      <Edit size={16} /> Edit
                    </button>
                    <button
                      onClick={() => confirmDelete(item.id)}
                      className="flex-1 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold text-sm flex justify-center items-center gap-2 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={16} /> Hapus
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </motion.div>

        {/* MODAL FORM TAMBAH/EDIT */}
        <AnimatePresence>
          {isModalOpen && currentConfig && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-2xl my-auto"
              >
                <Card className="p-4 md:p-8 shadow-2xl border-0 rounded-[1.5rem] md:rounded-[2rem] bg-white">
                  <div className="flex justify-between items-center mb-4 md:mb-6 pb-3 md:pb-5 border-b border-slate-100">
                    <div>
                      <h3 className="text-lg md:text-2xl font-black text-slate-800 tracking-tight">
                        {isEdit ? "Perbarui Data" : "Tambah Data"}
                      </h3>
                      <p className="text-emerald-600 font-bold text-[10px] md:text-xs uppercase tracking-widest mt-0.5 md:mt-1">
                        Modul {currentConfig.title.split(" ")[0]}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      disabled={isSaving}
                      className="p-1.5 md:p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg md:rounded-xl transition-colors disabled:opacity-50 bg-slate-50 border border-slate-100"
                    >
                      <X size={20} className="md:w-6 md:h-6" />
                    </button>
                  </div>

                  <form
                    onSubmit={handleSave}
                    className="space-y-3 md:space-y-5"
                  >
                    <div className="space-y-1 md:space-y-2">
                      <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">
                        ID Sistem (Bisa Diedit)
                      </label>
                      <input
                        type="number"
                        className={`w-full p-2.5 md:p-3.5 text-sm md:text-base rounded-lg md:rounded-xl font-bold outline-none transition-all shadow-sm ${isSaving ? "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed" : "bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 hover:border-emerald-300"}`}
                        value={formData.id}
                        onChange={(e) =>
                          setFormData({ ...formData, id: e.target.value })
                        }
                        disabled={isSaving}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
                      {currentConfig.form.map((field) => (
                        <div key={field.key} className="space-y-1 md:space-y-2">
                          <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 ml-1 flex flex-wrap">
                            {field.label}{" "}
                            {field.required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </label>

                          {field.type === "select" ? (
                            <PremiumSelect
                              value={formData[field.key] || ""}
                              onChange={(val) =>
                                setFormData({ ...formData, [field.key]: val })
                              }
                              options={field.options.map((opt) => ({
                                label: opt,
                                value: opt,
                              }))}
                              placeholder={`Pilih ${field.label.split(" ")[0]}...`}
                              disabled={isSaving}
                            />
                          ) : field.type === "multi-select" ? (
                            <PremiumMultiSelect
                              value={formData[field.key] || ""}
                              onChange={(val) =>
                                setFormData({ ...formData, [field.key]: val })
                              }
                              options={field.options}
                              placeholder={`Pilih (Bisa > 1)...`}
                              disabled={isSaving}
                            />
                          ) : (
                            <input
                              type={field.type}
                              disabled={isSaving}
                              placeholder={`Ketik di sini...`}
                              className={`w-full p-2.5 md:p-3.5 text-xs md:text-sm rounded-lg md:rounded-xl font-semibold outline-none transition-all shadow-sm ${isSaving ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 hover:border-emerald-300"}`}
                              value={formData[field.key] || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  [field.key]: e.target.value,
                                })
                              }
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 md:pt-6 mt-2 md:mt-4">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-sm md:text-base py-3 md:py-4 rounded-lg md:rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 hover:from-amber-600 hover:to-amber-700 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed border border-amber-400 uppercase tracking-widest"
                      >
                        {isSaving ? (
                          <RefreshCw size={18} className="animate-spin" />
                        ) : (
                          <Save size={18} />
                        )}
                        {isSaving
                          ? "Menyimpan Ke Server..."
                          : "Simpan Perubahan"}
                      </button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL CUSTOM ALERT & CONFIRM */}
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
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-2">
                    {customAlert.title}
                  </h3>
                  <p className="text-xs md:text-sm text-slate-500 mb-6 md:mb-8 font-semibold px-2 leading-relaxed">
                    {customAlert.message}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    {customAlert.type === "confirm" && (
                      <button
                        onClick={closeAlert}
                        className="w-full py-3 px-4 bg-slate-100 text-slate-600 rounded-lg md:rounded-xl font-bold hover:bg-slate-200 transition-colors text-sm order-2 sm:order-1"
                      >
                        Batal
                      </button>
                    )}
                    <button
                      onClick={
                        customAlert.onConfirm
                          ? customAlert.onConfirm
                          : closeAlert
                      }
                      className={`w-full py-3 px-4 rounded-lg md:rounded-xl font-bold text-white shadow-lg transition-all text-sm order-1 sm:order-2 ${customAlert.type === "danger" || customAlert.type === "confirm" ? "bg-red-500 hover:bg-red-600 shadow-red-500/30" : customAlert.type === "warning" ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/30" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30"}`}
                    >
                      {customAlert.type === "confirm"
                        ? "Ya, Hapus"
                        : "Mengerti"}
                    </button>
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

export default AdminDashboard;
