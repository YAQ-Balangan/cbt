// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useMemo } from "react";
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
  Filter,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { api } from "../api/api";
import Dashboard from "../components/layout/Dashboard";
import { Card, Badge } from "../components/ui/Ui";

// ==========================================
// 1. KONFIGURASI DINAMIS (SCHEMA)
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
        type: "text",
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
      {
        key: "kelas",
        label: "Kelas Peserta",
        sortable: true,
        filterable: true,
      },
      { key: "tanggal", label: "Tanggal", sortable: true },
      { key: "durasi_menit", label: "Durasi" },
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
        label: "Kelas Peserta (Contoh: XII MIPA)",
        type: "text",
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
      {
        key: "kunci",
        label: "Nama Pengaturan (Contoh: nama_ujian, pengumuman)",
        type: "text",
        required: true,
      },
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
// 2. KOMPONEN UTAMA
// ==========================================
const AdminDashboard = () => {
  const [tab, setTab] = useState("siswa");
  const [data, setData] = useState([]);

  // State Loading Indikator
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // State Search, Filter, & Sort
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [isEdit, setIsEdit] = useState(false);

  const currentConfig = TAB_CONFIG[tab];

  // ==========================================
  // 🟢 FUNGSI FETCH DATA (SILENT SYNC & DIFFING)
  // ==========================================
  const fetchData = async (isBackground = false) => {
    if (!currentConfig) return;

    // Hanya tampilkan loading besar jika ini pertama kali muat
    if (!isBackground) setLoading(true);

    // Mematikan efek kedip tulisan "Syncing..." agar refresh 30 detik terasa sunyi
    // if (isBackground) setIsSyncing(true);

    try {
      const result = await api.read(currentConfig.sheet);
      const newData = result || [];

      // 🌟 THE MAGIC: Bandingkan data baru dengan data lama
      setData((prevData) => {
        const isDataChanged =
          JSON.stringify(prevData) !== JSON.stringify(newData);

        if (isDataChanged) {
          // Render ulang layar karena ada perubahan data yang nyata
          return newData;
        }

        // Jika data sama persis, kembalikan state lama (Mencegah React render ulang = 0 Lag)
        return prevData;
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
    setSortConfig({ key: null, direction: "asc" });

    fetchData(false); // Ambil data pertama kali

    const intervalId = setInterval(() => {
      fetchData(true); // Ambil data silent setiap 30 detik
    }, 30000);

    return () => clearInterval(intervalId);
  }, [tab]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      setSortConfig({ key: null, direction: "asc" });
      return;
    }
    setSortConfig({ key, direction });
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Yakin ingin menghapus data dengan ID: ${id}?`)) {
      setLoading(true);
      try {
        await api.delete(currentConfig.sheet, id);
        await fetchData(false);
      } catch (error) {
        alert("Gagal menghapus data: " + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // VALIDASI ANTI-DUPLIKAT (Hanya saat tambah data)
    if (!isEdit) {
      const isDuplicate = data.some(
        (item) => String(item.id) === String(formData.id),
      );
      if (isDuplicate) {
        const maxId = Math.max(...data.map((item) => parseInt(item.id) || 0));
        const safeId = maxId + 1;
        alert(
          `⛔ SIMPAN DITOLAK!\n\nID "${formData.id}" sudah dipakai oleh data lain.\nSistem otomatis mengarahkan ke ID yang aman: ${safeId}.\n\nSilakan klik 'Simpan Data' lagi.`,
        );
        setFormData({ ...formData, id: safeId });
        return;
      }
    }

    setIsSaving(true);
    try {
      if (isEdit) {
        await api.update(currentConfig.sheet, formData.id, formData);
      } else {
        await api.create(currentConfig.sheet, formData);
      }
      setIsModalOpen(false);
      await fetchData(false);
    } catch (error) {
      alert("Terjadi kesalahan saat menyimpan: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const openAddModal = () => {
    setIsEdit(false);

    // AUTO-INCREMENT: Cari ID terbesar dan tambah 1
    let nextId = 1;
    if (data.length > 0) {
      const maxId = Math.max(...data.map((item) => parseInt(item.id) || 0));
      nextId = maxId + 1;
    }

    setFormData({ id: nextId, ...currentConfig.defaultValues });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setIsEdit(true);
    setFormData(item);
    setIsModalOpen(true);
  };

  const processedData = useMemo(() => {
    let result = [...data];

    // Search
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(s),
        ),
      );
    }

    // Filter
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

    // Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = String(a[sortConfig.key] || "").toLowerCase();
        const bVal = String(b[sortConfig.key] || "").toLowerCase();

        const aNum = Number(aVal);
        const bNum = Number(bVal);

        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
        }

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

  return (
    <Dashboard menu={MENU_ITEMS} active={tab} setActive={setTab}>
      <>
        {/* HEADER & TOMBOL TAMBAH */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fade-in">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
                {currentConfig.title}
              </h2>
              {isSyncing && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse border border-emerald-200">
                  <RefreshCw size={12} className="animate-spin" /> Syncing
                </span>
              )}
            </div>
            <p className="text-slate-400 font-bold text-sm italic mt-1">
              {currentConfig.subtitle}
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-200 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={20} /> Tambah Data
          </button>
        </div>

        {/* STATISTIK & TOOLBAR */}
        <div className="flex flex-col xl:flex-row gap-4 mb-6">
          <Card className="p-6 bg-gradient-to-br from-white to-emerald-50/30 border-none shadow-sm min-w-[200px] shrink-0">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                Total Ditampilkan
              </p>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-3xl font-black text-slate-900">
                {processedData.length}
              </p>
              {processedData.length !== data.length && (
                <p className="text-xs font-bold text-slate-400">
                  dari {data.length}
                </p>
              )}
            </div>
          </Card>

          <Card className="flex-1 px-4 py-2 bg-white flex flex-col md:flex-row items-center gap-4 border-none shadow-sm w-full overflow-hidden">
            <div className="flex items-center gap-3 flex-1 w-full md:border-r border-slate-100 pr-0 md:pr-4 py-2">
              <Search className="text-slate-300 shrink-0" size={20} />
              <input
                className="w-full bg-transparent border-none outline-none font-bold text-sm text-slate-600 placeholder:text-slate-300"
                placeholder={`Cari data ${currentConfig.title}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto py-2 scrollbar-hide">
              <Filter
                size={16}
                className="text-slate-300 shrink-0 hidden md:block"
              />

              {currentConfig.columns.some((c) => c.key === "kelas") && (
                <select
                  value={filters["jurusan"] || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, jurusan: e.target.value })
                  }
                  className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs px-4 py-2.5 rounded-xl outline-none focus:border-indigo-400 cursor-pointer shrink-0"
                >
                  <option value="">Semua Jurusan</option>
                  <option value="MIPA">Jurusan MIPA</option>
                  <option value="IPS">Jurusan IPS</option>
                </select>
              )}

              {currentConfig.columns
                .filter((c) => c.filterable)
                .map((col) => (
                  <select
                    key={col.key}
                    value={filters[col.key] || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, [col.key]: e.target.value })
                    }
                    className="bg-slate-50 border border-slate-100 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl outline-none focus:border-indigo-400 cursor-pointer shrink-0"
                  >
                    <option value="">Semua {col.label}</option>
                    {getFilterOptions(col.key).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ))}

              <button
                onClick={() => fetchData(false)}
                className="p-2.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all shrink-0 ml-auto md:ml-2"
                title="Sinkronkan Ulang"
              >
                <RefreshCw
                  size={18}
                  className={loading || isSyncing ? "animate-spin" : ""}
                />
              </button>
            </div>
          </Card>
        </div>

        {/* TABEL DATA */}
        <Card className="overflow-hidden border-none shadow-2xl shadow-slate-200/50 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-900 text-slate-300 uppercase text-[10px] tracking-widest font-black select-none">
                <tr>
                  {currentConfig.columns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-8 py-5 transition-colors ${col.sortable ? "cursor-pointer hover:bg-slate-800" : ""}`}
                      onClick={() => col.sortable && handleSort(col.key)}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`${sortConfig.key === col.key ? "text-white" : ""}`}
                        >
                          {col.label}
                        </span>
                        {col.sortable && (
                          <div className="flex items-center">
                            {sortConfig.key === col.key ? (
                              sortConfig.direction === "asc" ? (
                                <ChevronUp
                                  size={16}
                                  className="text-emerald-400 font-black"
                                />
                              ) : (
                                <ChevronDown
                                  size={16}
                                  className="text-emerald-400 font-black"
                                />
                              )
                            ) : (
                              <ArrowUpDown
                                size={14}
                                className="text-slate-500 hover:text-white transition-colors"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="px-8 py-5 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td
                      colSpan={currentConfig.columns.length + 1}
                      className="py-20 text-center"
                    >
                      <RefreshCw className="animate-spin mx-auto text-indigo-500 mb-2" />
                      <span className="font-black text-slate-300 uppercase text-xs">
                        Memuat Data...
                      </span>
                    </td>
                  </tr>
                ) : processedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={currentConfig.columns.length + 1}
                      className="py-20 text-center text-slate-400 font-bold text-sm"
                    >
                      {data.length === 0
                        ? "Belum ada data di Google Sheet."
                        : "Tidak ada data yang cocok dengan pencarian/filter."}
                    </td>
                  </tr>
                ) : (
                  processedData.map((item, i) => (
                    <tr
                      key={item.id || i}
                      className="hover:bg-indigo-50/30 transition-colors group"
                    >
                      {currentConfig.columns.map((col) => (
                        <td
                          key={col.key}
                          className="px-8 py-5 font-bold text-slate-700"
                        >
                          {col.key === "role" || col.key === "status" ? (
                            <Badge type={item[col.key]} />
                          ) : col.key === "id" ? (
                            <span className="font-mono text-xs text-slate-400">
                              {item[col.key]}
                            </span>
                          ) : (
                            item[col.key] || "-"
                          )}
                        </td>
                      ))}
                      <td className="px-8 py-5 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
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
      </>

      {/* MODAL FORM */}
      {isModalOpen && currentConfig && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <Card className="w-full max-w-2xl p-8 md:p-10 shadow-3xl animate-fade-in border-none my-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                {isEdit ? "Update Data" : "Tambah Data"}{" "}
                {currentConfig.title.split(" ")[0]}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
              >
                <X />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                  ID Sistem{" "}
                  {isEdit ? "(Tidak bisa diedit saat Update)" : "(Bisa diedit)"}
                </label>
                <input
                  type="number"
                  className={`w-full p-4 border rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${
                    isEdit || isSaving
                      ? "bg-slate-100 border-none text-slate-400 cursor-not-allowed"
                      : "bg-slate-50 border-slate-100 focus:border-indigo-500 text-slate-900"
                  }`}
                  value={formData.id}
                  onChange={(e) =>
                    setFormData({ ...formData, id: e.target.value })
                  }
                  disabled={isEdit || isSaving}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentConfig.form.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                      {field.label}{" "}
                      {field.required && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>

                    {field.type === "select" ? (
                      <select
                        required={field.required}
                        disabled={isSaving}
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer disabled:opacity-50"
                        value={formData[field.key] || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [field.key]: e.target.value,
                          })
                        }
                      >
                        <option value="" disabled>
                          -- Pilih {field.label} --
                        </option>
                        {field.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        required={field.required}
                        disabled={isSaving}
                        placeholder={`Masukkan ${field.label.toLowerCase()}...`}
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all disabled:opacity-50"
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

              <div className="pt-4 mt-6 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all uppercase tracking-widest disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSaving ? (
                    <RefreshCw size={20} className="animate-spin" />
                  ) : (
                    <Save size={20} />
                  )}
                  {isSaving ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </Dashboard>
  );
};

export default AdminDashboard;
