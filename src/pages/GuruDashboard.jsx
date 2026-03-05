// src/pages/GuruDashboard.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Layers,
  Award,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  X,
  Save,
  Filter,
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
} from "lucide-react";
import { api } from "../api/api";
import Dashboard from "../components/layout/Dashboard";
import { Card, Badge } from "../components/ui/Ui";

// 🟢 IMPORT LIBRARY EXPORT (Pastikan sudah npm install xlsx docx file-saver)
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
// 1. KONFIGURASI DINAMIS GURU
// ==========================================
const TAB_CONFIG = {
  soal: {
    sheet: "Soal",
    title: "Bank Soal",
    subtitle: "Manajemen Soal Ujian & Kunci Jawaban",
    form: [
      { key: "mapel", label: "Mata Pelajaran", type: "text", required: true },
      {
        key: "kelas",
        label: "Kelas Sasaran (Contoh: XII MIPA)",
        type: "text",
        required: true,
      },
      { key: "poin", label: "Bobot Poin Soal", type: "number", required: true },
      {
        key: "wacana",
        label: "Teks Cerita / Wacana (Opsional)",
        type: "textarea",
        required: false,
      },
      {
        key: "pertanyaan",
        label: "Pertanyaan Inti",
        type: "textarea",
        required: true,
      },
      {
        key: "link_gambar",
        label: "Link Gambar / Rumus (Opsional)",
        type: "text",
        required: false,
      },
      { key: "opsi_a", label: "Pilihan A", type: "text", required: true },
      { key: "opsi_b", label: "Pilihan B", type: "text", required: true },
      { key: "opsi_c", label: "Pilihan C", type: "text", required: true },
      { key: "opsi_d", label: "Pilihan D", type: "text", required: true },
      { key: "opsi_e", label: "Pilihan E", type: "text", required: false },
      {
        key: "jawaban_benar",
        label: "Kunci Jawaban",
        type: "select",
        options: ["A", "B", "C", "D", "E"],
        required: true,
      },
    ],
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
      { key: "skor", label: "Nilai Akhir" },
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

const KKM_SCORE = 75; // Batas KKM

const GuruDashboard = () => {
  const [tab, setTab] = useState("soal");
  const [data, setData] = useState([]);

  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [isEdit, setIsEdit] = useState(false);

  // State Import Masal
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [parsedBulkData, setParsedBulkData] = useState([]);
  const [bulkMapel, setBulkMapel] = useState("");
  const [bulkKelas, setBulkKelas] = useState("");
  const [bulkPoin, setBulkPoin] = useState("2");
  const [bulkProgress, setBulkProgress] = useState(0);

  // State untuk Tampilan Tab Nilai
  const [nilaiViewMode, setNilaiViewMode] = useState("rekap");

  const currentConfig = TAB_CONFIG[tab];

  // ==========================================
  // 🟢 FUNGSI FETCH DATA (SILENT SYNC & DIFFING)
  // ==========================================
  const fetchData = async (isBackground = false) => {
    if (!currentConfig) return;

    // Hanya tampilkan loading besar jika ini pertama kali muat
    if (!isBackground) setLoading(true);

    // Sengaja dimatikan (ninja mode) agar tidak ada kedip tulisan "Syncing..."
    // if (isBackground) setIsSyncing(true);

    try {
      const result = await api.read(currentConfig.sheet);
      const newData = result || [];

      // 🌟 THE MAGIC: Bandingkan data baru dengan data lama
      setData((prevData) => {
        const isDataChanged =
          JSON.stringify(prevData) !== JSON.stringify(newData);

        if (isDataChanged) {
          return newData; // Render ulang karena ada data ujian baru masuk / soal baru
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

    fetchData(false); // Muat pertama kali dengan loading layar

    const intervalId = setInterval(() => {
      fetchData(true); // Muat silent setiap 30 detik
    }, 30000);

    return () => clearInterval(intervalId);
  }, [tab]);

  // --- CRUD FUNCTIONS ---
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
    if (!isEdit) {
      const isDuplicate = data.some(
        (item) => String(item.id) === String(formData.id),
      );
      if (isDuplicate) {
        const maxId = Math.max(...data.map((item) => parseInt(item.id) || 0));
        setFormData({ ...formData, id: maxId + 1 });
        alert(
          `ID terpakai! Dialihkan ke ID yang aman: ${maxId + 1}. Silakan klik simpan lagi.`,
        );
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
      alert("Kesalahan menyimpan: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const openAddModal = () => {
    setIsEdit(false);
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

  // --- IMPORT MASAL PARSER ---
  const handleParseBulkText = () => {
    if (!bulkText.trim()) return;

    const blocks = bulkText.split(/(?:Jawaban|Kunci):\s*([A-E])/i);
    const parsed = [];
    let currentId =
      data.length > 0
        ? Math.max(...data.map((item) => parseInt(item.id) || 0))
        : 0;

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
      let pertanyaan = teksSebelumOpsi;

      if (teksSebelumOpsi.includes("\n\n")) {
        let paragraf = teksSebelumOpsi.split(/\n\s*\n/);
        pertanyaan = paragraf.pop().trim();
        wacana = paragraf.join("\n\n").trim();
      } else {
        let barisTeks = teksSebelumOpsi.split("\n");
        if (barisTeks.length > 1) {
          pertanyaan = barisTeks.pop().trim();
          wacana = barisTeks.join("\n").trim();
        }
      }

      parsed.push({
        id: currentId,
        mapel: bulkMapel,
        kelas: bulkKelas,
        poin: bulkPoin,
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
      alert(`Berhasil menyimpan ${parsedBulkData.length} soal!`);
      setIsBulkOpen(false);
      setBulkText("");
      setParsedBulkData([]);
      fetchData(false);
    } catch (error) {
      alert("Gagal saat menyimpan soal masal: " + error.message);
    } finally {
      setIsSaving(false);
      setBulkProgress(0);
    }
  };

  // ==========================================
  // 🟢 LOGIKA PEMROSESAN DATA & PIVOT NILAI
  // ==========================================
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
    return result;
  }, [data, search, filters]);

  const pivotNilaiData = useMemo(() => {
    if (tab !== "nilai") return { data: [], mapels: [] };

    const mapels = [
      ...new Set(data.map((item) => item.mapel).filter(Boolean)),
    ].sort();

    const grouped = {};
    data.forEach((row) => {
      if (!row.nama_siswa) return;
      const key = `${row.nama_siswa}_${row.kelas}`;
      if (!grouped[key]) {
        grouped[key] = { nama_siswa: row.nama_siswa, kelas: row.kelas };
      }
      grouped[key][row.mapel] = parseFloat(row.skor) || 0;
    });

    const finalData = Object.values(grouped).map((student) => {
      let total = 0;
      let count = 0;
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
    if (search) {
      filteredPivot = filteredPivot.filter((s) =>
        s.nama_siswa.toLowerCase().includes(search.toLowerCase()),
      );
    }
    if (filters.kelas) {
      filteredPivot = filteredPivot.filter((s) =>
        String(s.kelas).toLowerCase().includes(filters.kelas.toLowerCase()),
      );
    }

    return { data: filteredPivot, mapels };
  }, [data, tab, search, filters.kelas]);

  const getFilterOptions = (key) => {
    return [...new Set(data.map((item) => item[key]))]
      .filter((val) => val)
      .sort();
  };

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

  // ==========================================
  // 🟢 LOGIKA EXPORT & CETAK CERDAS (IFRAME)
  // ==========================================
  const handleExport = async (type) => {
    // === CETAK PRINT & PDF (Murni Tabel + Judul Saja, Tanpa Dashboard) ===
    if (type === "print" || type === "pdf") {
      if (
        (nilaiViewMode === "rekap" && pivotNilaiData.data.length === 0) ||
        (nilaiViewMode === "log" && processedData.length === 0)
      ) {
        return alert("Tidak ada data untuk dicetak!");
      }

      const tableElement = document.getElementById("data-table-guru");
      if (!tableElement) return;

      const title =
        nilaiViewMode === "rekap"
          ? "REKAPITULASI BUKU NILAI SISWA"
          : "LOG RIWAYAT UJIAN SISWA";
      const subtitle = `Total Data: ${nilaiViewMode === "rekap" ? pivotNilaiData.data.length : processedData.length} | Waktu Cetak: ${new Date().toLocaleString("id-ID")}`;

      // Buat HTML murni khusus untuk diprint
      const printContent = `
        <!DOCTYPE html>
        <html lang="id">
          <head>
            <meta charset="UTF-8">
            <title>Cetak Data Nilai</title>
            <style>
              /* Size auto membiarkan user bebas memilih kertas/orientasi di dialog browser */
              @page { size: auto; margin: 15mm; } 
              body { font-family: Arial, sans-serif; color: #000; margin: 0; padding: 0; }
              
              .header-print { text-align: center; margin-bottom: 25px; }
              .header-print h1 { font-size: 22pt; font-weight: 900; margin: 0 0 5px 0; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 10px; display: inline-block; }
              .header-print p { font-size: 11pt; color: #444; margin: 10px 0 0 0; }
              
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #000; padding: 8px; font-size: 10pt; text-align: center; }
              th { background-color: #f1f5f9 !important; font-weight: bold; -webkit-print-color-adjust: exact; color: #000; }
              
              /* Nama murid rata kiri */
              td.col-nama { text-align: left; font-weight: bold; text-transform: uppercase; }
              
              /* Gaya warna standar untuk nilai merah / hijau */
              .text-red-500, .text-red-600 { color: #dc2626 !important; font-weight: bold; }
              .text-blue-600 { color: #2563eb !important; font-weight: bold; }
              .text-emerald-600 { color: #059669 !important; font-weight: bold; }
              .bg-red-50 { background-color: #fef2f2 !important; -webkit-print-color-adjust: exact; }
              
              /* Sembunyikan tombol Aksi dan elemen yang tidak perlu saat diprint */
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

      // Buat Virtual Iframe agar Print Dialog tidak terpengaruh CSS Dashboard Utama
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

      // Tulis HTML ke dalam Iframe dan Panggil fungsi Print
      const iframeDoc = printIframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();

      printIframe.contentWindow.focus();
      // Jeda sejenak agar browser selesai me-render tabel sebelum print
      setTimeout(() => {
        printIframe.contentWindow.print();
      }, 500);

      return;
    }

    // === EXPORT XLSX & DOCX (Tetap seperti aslinya) ===
    let exportData = [];
    let exportHeaders = [];
    let wscols = [];

    if (nilaiViewMode === "rekap") {
      if (pivotNilaiData.data.length === 0)
        return alert("Tidak ada data untuk diekspor!");
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
        return alert("Tidak ada data untuk diekspor!");
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

        const dataRows = exportData.map((rowData) => {
          return new TableRow({
            children: rowData.map(
              (text, cIdx) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      text: String(text),
                      alignment:
                        cIdx === 1 ? AlignmentType.LEFT : AlignmentType.CENTER,
                    }),
                  ],
                  margins: { top: 100, bottom: 100, left: 100, right: 100 },
                }),
            ),
          });
        });

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
        alert("Terjadi kesalahan saat membuat file DOCX.");
      }
      return;
    }
  };

  return (
    <Dashboard menu={MENU_ITEMS} active={tab} setActive={setTab}>
      {/* HEADER UTAMA */}
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

        <div className="flex gap-3">
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
                className="bg-emerald-100 text-emerald-700 px-6 py-4 rounded-2xl font-black shadow-sm flex items-center gap-2 hover:bg-emerald-200 active:scale-95 transition-all"
              >
                <FileText size={20} /> Import Soal Massal
              </button>
              <button
                onClick={openAddModal}
                className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black shadow-xl shadow-blue-200 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
              >
                <Plus size={20} /> Buat Manual
              </button>
            </>
          )}

          {tab === "nilai" && (
            <div className="flex gap-2">
              <button
                onClick={() => handleExport("print")}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold uppercase rounded-xl transition-colors shadow-sm"
              >
                <Printer size={14} /> Print
              </button>
              <button
                onClick={() => handleExport("pdf")}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold uppercase rounded-xl transition-colors shadow-sm"
              >
                <Download size={14} /> PDF
              </button>
              <button
                onClick={() => handleExport("xls")}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold uppercase rounded-xl transition-colors shadow-sm"
              >
                <Download size={14} /> XLSX
              </button>
              <button
                onClick={() => handleExport("doc")}
                className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-bold uppercase rounded-xl transition-colors shadow-sm"
              >
                <Download size={14} /> DOCX
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FILTER & SEARCH GLOBAL */}
      <div className="flex flex-col xl:flex-row gap-4 mb-6">
        <Card className="p-6 bg-gradient-to-br from-white to-blue-50/30 border-none shadow-sm min-w-[200px] shrink-0">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
              Total{" "}
              {tab === "nilai" && nilaiViewMode === "rekap" ? "Siswa" : "Data"}
            </p>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-black text-slate-900">
              {tab === "nilai" && nilaiViewMode === "rekap"
                ? pivotNilaiData.data.length
                : processedData.length}
            </p>
          </div>
        </Card>

        <Card className="flex-1 px-4 py-2 bg-white flex flex-col md:flex-row items-center gap-4 border-none shadow-sm w-full overflow-hidden">
          <div className="flex items-center gap-3 flex-1 w-full md:border-r border-slate-100 pr-0 md:pr-4 py-2">
            <Search className="text-slate-300 shrink-0" size={20} />
            <input
              className="w-full bg-transparent border-none outline-none font-bold text-sm text-slate-600 placeholder:text-slate-300"
              placeholder={`Cari nama ${tab === "soal" ? "soal" : "siswa"}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto py-2 scrollbar-hide">
            <Filter
              size={16}
              className="text-slate-300 shrink-0 hidden md:block"
            />

            {currentConfig.filterKeys.map((key) => {
              if (
                tab === "nilai" &&
                nilaiViewMode === "rekap" &&
                key !== "kelas"
              )
                return null;

              return (
                <select
                  key={key}
                  value={filters[key] || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, [key]: e.target.value })
                  }
                  className="bg-slate-50 border border-slate-100 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl outline-none focus:border-blue-400 cursor-pointer shrink-0 uppercase"
                >
                  <option value="">Semua {key}</option>
                  {getFilterOptions(key).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              );
            })}

            <button
              onClick={() => fetchData(false)}
              className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all shrink-0 ml-auto md:ml-2"
            >
              <RefreshCw
                size={18}
                className={loading || isSyncing ? "animate-spin" : ""}
              />
            </button>
          </div>
        </Card>
      </div>

      {/* 🟢 TOGGLE VIEW MODE & STATISTIK */}
      {tab === "nilai" && (
        <>
          <div className="flex items-center gap-2 mb-6 bg-white p-1.5 rounded-2xl w-max border border-slate-100 shadow-sm">
            <button
              onClick={() => setNilaiViewMode("rekap")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${nilaiViewMode === "rekap" ? "bg-blue-50 text-blue-700 shadow-sm" : "text-slate-400 hover:text-slate-700"}`}
            >
              <TableProperties size={16} /> Rekap Buku Nilai
            </button>
            <button
              onClick={() => setNilaiViewMode("log")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${nilaiViewMode === "log" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-700"}`}
            >
              <LayoutList size={16} /> Log Ujian (Edit/Hapus)
            </button>
          </div>

          {nilaiViewMode === "rekap" && statsNilai && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 animate-fade-in">
              <Card className="p-5 border-none shadow-sm bg-gradient-to-br from-indigo-500 to-blue-600 text-white">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">
                  Rata-Rata Umum
                </p>
                <div className="text-3xl font-black">{statsNilai.rataRata}</div>
              </Card>
              <Card className="p-5 border-none shadow-sm bg-emerald-50 border-l-4 border-l-emerald-500">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Nilai Tertinggi
                </p>
                <div className="text-3xl font-black text-emerald-600">
                  {statsNilai.tertinggi}
                </div>
              </Card>
              <Card className="p-5 border-none shadow-sm bg-rose-50 border-l-4 border-l-rose-500">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Siswa Remedial (&lt; {KKM_SCORE})
                </p>
                <div className="text-3xl font-black text-rose-600 flex items-center gap-2">
                  <BarChart3 size={24} /> {statsNilai.remedial} Siswa
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {/* KONTEN UTAMA */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center">
          <RefreshCw className="animate-spin text-blue-500 mb-4" size={32} />
          <span className="font-black text-slate-400 uppercase tracking-widest text-xs">
            Menarik Data dari Database...
          </span>
        </div>
      ) : tab === "soal" ? (
        <div className="grid grid-cols-1 gap-10 max-w-5xl mx-auto">
          {processedData.length === 0 ? (
            <div className="py-10 text-center text-slate-400 font-bold">
              Tidak ada soal ditemukan.
            </div>
          ) : (
            processedData.map((s, i) => {
              const isWacanaSama =
                i > 0 &&
                processedData[i - 1].wacana === s.wacana &&
                s.wacana !== "";
              const tampilkanWacana = s.wacana && !isWacanaSama;

              return (
                <div key={s.id || i} className="flex flex-col gap-4">
                  {tampilkanWacana && (
                    <div className="p-6 md:p-8 bg-amber-50 border border-amber-200 rounded-3xl relative shadow-sm mt-4 animate-fade-in">
                      <div className="absolute -top-4 left-6 bg-amber-500 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-md">
                        <BookOpen size={16} /> Teks Cerita / Wacana
                      </div>
                      <p className="font-semibold text-amber-900 leading-relaxed text-sm md:text-base whitespace-pre-wrap mt-2">
                        {s.wacana}
                      </p>
                    </div>
                  )}
                  <Card className="p-6 md:p-8 border-t-8 border-t-blue-600 relative group overflow-hidden bg-white shadow-md hover:shadow-xl transition-all">
                    <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center mb-6 pr-24">
                      <span className="bg-slate-900 text-white font-black px-4 py-1.5 rounded-lg text-xs uppercase">
                        NO. {s.id}
                      </span>
                      <span className="bg-indigo-50 text-indigo-600 font-black px-3 py-1.5 rounded-lg text-[10px] uppercase border border-indigo-100 flex items-center gap-1">
                        <Target size={12} /> {s.poin} POIN
                      </span>
                      <span className="bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-lg text-xs uppercase">
                        {s.mapel} | {s.kelas}
                      </span>
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                        <CheckCircle2 size={14} /> KUNCI: {s.jawaban_benar}
                      </span>
                    </div>

                    <p className="font-bold text-slate-900 leading-relaxed text-base md:text-lg mb-6 whitespace-pre-wrap">
                      {s.pertanyaan}
                    </p>

                    {s.link_gambar && (
                      <div className="mb-6 max-w-lg rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                        <img
                          src={s.link_gambar}
                          alt="Soal"
                          className="w-full object-contain bg-slate-50"
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-3">
                      {["A", "B", "C", "D", "E"].map((opt) => {
                        const keyMap = `opsi_${opt.toLowerCase()}`;
                        const isCorrect =
                          String(s.jawaban_benar).toUpperCase() === opt;
                        if (!s[keyMap]) return null;
                        return (
                          <div
                            key={opt}
                            className={`px-5 py-3.5 rounded-xl border flex items-start gap-4 transition-all ${isCorrect ? "bg-emerald-50 border-emerald-300 shadow-sm" : "bg-white border-slate-200 hover:border-blue-300"}`}
                          >
                            <span
                              className={`font-black text-lg w-6 flex-shrink-0 pt-0.5 ${isCorrect ? "text-emerald-600" : "text-slate-800"}`}
                            >
                              {opt}.
                            </span>
                            <span
                              className={`text-base font-medium leading-relaxed ${isCorrect ? "text-emerald-900" : "text-slate-700"}`}
                            >
                              {s[keyMap]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </div>
              );
            })
          )}
        </div>
      ) : tab === "nilai" && nilaiViewMode === "rekap" ? (
        <Card className="overflow-hidden border-none shadow-xl shadow-slate-200/50 bg-white">
          <div className="overflow-x-auto">
            {pivotNilaiData.data.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-bold">
                Belum ada siswa yang menyelesaikan ujian.
              </div>
            ) : (
              <table
                id="data-table-guru"
                className="w-full text-left text-sm whitespace-nowrap"
              >
                <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-widest font-black">
                  <tr>
                    <th className="px-6 py-5 sticky left-0 z-10 bg-slate-900">
                      No
                    </th>
                    <th className="px-6 py-5 sticky left-[3.5rem] z-10 bg-slate-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                      Nama Murid
                    </th>
                    <th className="px-6 py-5 text-center">Kelas</th>
                    {pivotNilaiData.mapels.map((m) => (
                      <th
                        key={m}
                        className="px-6 py-5 text-center bg-slate-800 border-l border-slate-700"
                      >
                        {m}
                      </th>
                    ))}
                    <th className="px-6 py-5 text-center bg-emerald-900 border-l border-emerald-800">
                      Rata-Rata
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pivotNilaiData.data.map((item, idx) => (
                    <tr
                      key={`${item.nama_siswa}_${item.kelas}`}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-6 py-4 font-bold text-slate-400 sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-4 font-black text-slate-800 uppercase sticky left-[3.5rem] bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-r border-slate-100 col-nama">
                        {item.nama_siswa}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-slate-100 rounded-md font-bold text-xs">
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
                            className={`px-6 py-4 text-center font-bold text-lg border-l border-slate-100 ${isKkmFailed ? "text-red-500 bg-red-50" : "text-slate-600"}`}
                          >
                            {skor !== undefined ? skor : "-"}
                          </td>
                        );
                      })}
                      <td
                        className={`px-6 py-4 text-center font-black text-xl border-l border-slate-100 ${parseFloat(item.RataRata) < KKM_SCORE ? "text-red-600 bg-red-50" : "text-emerald-600 bg-emerald-50/30"}`}
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
      ) : (
        <Card className="overflow-hidden border-none shadow-xl shadow-slate-200/50 bg-white">
          <div className="overflow-x-auto">
            {processedData.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-bold">
                Tidak ada log ujian.
              </div>
            ) : (
              <table
                id="data-table-guru"
                className="w-full text-left text-sm whitespace-nowrap"
              >
                <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-widest font-black">
                  <tr>
                    {currentConfig.columns.map((col) => (
                      <th key={col.key} className="px-8 py-5">
                        {col.label}
                      </th>
                    ))}
                    {/* Tambahkan kelas print-hidden agar header aksi tidak tercetak */}
                    <th className="px-8 py-5 text-right print-hidden">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {processedData.map((item, i) => (
                    <tr
                      key={item.id || i}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {currentConfig.columns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-8 py-4 font-bold text-slate-700 ${col.key === "nama_siswa" ? "col-nama" : ""}`}
                        >
                          {col.key === "status" ? (
                            <Badge type={item[col.key]} />
                          ) : col.key === "skor" ? (
                            <span
                              className={`text-lg font-black ${parseFloat(item[col.key]) < KKM_SCORE ? "text-red-500" : "text-blue-600"}`}
                            >
                              {item[col.key]}
                            </span>
                          ) : (
                            item[col.key] || "-"
                          )}
                        </td>
                      ))}
                      {/* Tambahkan kelas print-hidden agar tombol hapus tidak tercetak */}
                      <td className="px-8 py-4 text-right print-hidden">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                          title="Hapus Ujian Siswa Ini"
                        >
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
      )}

      {/* MODAL IMPORT MASAL (SMART PASTE) */}
      {isBulkOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-5xl p-6 md:p-8 shadow-3xl animate-fade-in border-none my-auto mt-10 mb-10">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                  <UploadCloud className="text-blue-500" /> Import Soal Massal
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-1">
                  Sistem otomatis memisahkan Wacana, Pertanyaan Inti, dan
                  Pilihan Ganda huruf kecil/besar.
                </p>
              </div>
              <button
                onClick={() => setIsBulkOpen(false)}
                disabled={isSaving}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
              >
                <X />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-emerald-500"
                placeholder="Mata Pelajaran (Contoh: Sejarah)"
                value={bulkMapel}
                onChange={(e) => setBulkMapel(e.target.value)}
                disabled={isSaving}
              />
              <input
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-emerald-500"
                placeholder="Kelas Sasaran (Contoh: XII IPS)"
                value={bulkKelas}
                onChange={(e) => setBulkKelas(e.target.value)}
                disabled={isSaving}
              />
              <div className="relative flex items-center">
                <Target className="absolute left-4 text-indigo-500" size={18} />
                <input
                  type="number"
                  className="w-full p-4 pl-12 bg-indigo-50 border border-indigo-100 rounded-xl font-black text-indigo-700 outline-none focus:border-indigo-400"
                  placeholder="Poin per Soal"
                  value={bulkPoin}
                  onChange={(e) => setBulkPoin(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>
            <textarea
              className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-sm outline-none focus:border-emerald-500 transition-all resize-y h-64 text-slate-800"
              placeholder="Teks cerita sejarah berikut untuk soal no 11-13\nBilyarta kembali bertanya...\nInformasi yang sesuai dengan kutipan tersebut adalah…\na. Tokoh Bilyarta...\nb. Tokoh Bilyarta merasa...\nc. Tokoh memiliki...\njawaban: D"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              disabled={isSaving}
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleParseBulkText}
                disabled={!bulkText || !bulkMapel || !bulkKelas || isSaving}
                className="bg-slate-800 text-white font-black px-6 py-4 rounded-xl shadow-lg hover:bg-slate-900 transition-all disabled:opacity-50"
              >
                Pratinjau (Preview) Soal
              </button>
            </div>
            {parsedBulkData.length > 0 && (
              <div className="mt-8 border-t border-slate-200 pt-6 animate-fade-in">
                <h4 className="text-lg font-black text-slate-800 mb-4">
                  Terdeteksi: {parsedBulkData.length} Soal
                </h4>
                <div className="max-h-80 overflow-y-auto bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4 mb-6">
                  {parsedBulkData.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-4 rounded-lg shadow-sm border border-slate-100"
                    >
                      {item.wacana && (
                        <div className="mb-2 p-2 bg-amber-50 border border-amber-200 text-xs text-amber-900 rounded">
                          <strong className="text-amber-600">Wacana:</strong>{" "}
                          {item.wacana}
                        </div>
                      )}
                      <p className="text-sm font-bold text-slate-800 whitespace-pre-wrap mb-3">
                        {item.pertanyaan}
                      </p>
                      <div className="flex flex-col gap-1 text-[11px] text-slate-600">
                        {item.opsi_a && (
                          <div>
                            <strong>A.</strong> {item.opsi_a}
                          </div>
                        )}
                        {item.opsi_b && (
                          <div>
                            <strong>B.</strong> {item.opsi_b}
                          </div>
                        )}
                        {item.opsi_c && (
                          <div>
                            <strong>C.</strong> {item.opsi_c}
                          </div>
                        )}
                        {item.opsi_d && (
                          <div>
                            <strong>D.</strong> {item.opsi_d}
                          </div>
                        )}
                        {item.opsi_e && (
                          <div>
                            <strong>E.</strong> {item.opsi_e}
                          </div>
                        )}
                      </div>
                      <div className="mt-3 text-xs font-black text-emerald-600">
                        KUNCI: {item.jawaban_benar} | {item.poin} POIN
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleSaveBulk}
                  disabled={isSaving}
                  className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all uppercase tracking-widest disabled:opacity-70"
                >
                  {isSaving ? (
                    <RefreshCw className="animate-spin" />
                  ) : (
                    <Check />
                  )}{" "}
                  Simpan Semua Soal ke Database
                </button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* MODAL FORM EDIT / BUAT MANUAL */}
      {isModalOpen && tab === "soal" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <Card className="w-full max-w-4xl p-8 md:p-10 shadow-3xl animate-fade-in border-none my-auto mt-10 mb-10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                {isEdit ? "Edit Soal" : "Buat Soal Baru"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
              >
                <X />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                    ID Soal
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none disabled:bg-slate-100"
                    value={formData.id}
                    onChange={(e) =>
                      setFormData({ ...formData, id: e.target.value })
                    }
                    disabled={isEdit || isSaving}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                    Mapel
                  </label>
                  <input
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none"
                    value={formData.mapel || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, mapel: e.target.value })
                    }
                    disabled={isSaving}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                    Kelas
                  </label>
                  <input
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none"
                    value={formData.kelas || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, kelas: e.target.value })
                    }
                    disabled={isSaving}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-indigo-500 ml-1">
                    Bobot Poin
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 bg-indigo-50 border border-indigo-100 rounded-xl font-black text-indigo-700 outline-none"
                    value={formData.poin || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, poin: e.target.value })
                    }
                    disabled={isSaving}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                  Teks Cerita / Wacana (Opsional)
                </label>
                <textarea
                  disabled={isSaving}
                  placeholder="Contoh: Bacalah paragraf berikut..."
                  rows="3"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium outline-none focus:border-blue-500 transition-all resize-none text-slate-700"
                  value={formData.wacana || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, wacana: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                  Teks Pertanyaan Inti
                </label>
                <textarea
                  required
                  disabled={isSaving}
                  rows="3"
                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all resize-none text-slate-900"
                  value={formData.pertanyaan || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, pertanyaan: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-amber-500 ml-1 flex items-center gap-1">
                  Link Gambar / Rumus MTK (Opsional)
                </label>
                <input
                  type="text"
                  disabled={isSaving}
                  placeholder="Contoh: https://i.imgur.com/rumus.png"
                  className="w-full p-4 bg-amber-50 border border-amber-200 rounded-2xl font-bold text-amber-800 outline-none focus:border-amber-500 transition-all"
                  value={formData.link_gambar || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, link_gambar: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["A", "B", "C", "D", "E"].map((opt) => {
                  const keyMap = `opsi_${opt.toLowerCase()}`;
                  return (
                    <div key={opt} className="space-y-1 relative">
                      <label
                        className={`text-[10px] font-black uppercase ml-1 ${formData.jawaban_benar === opt ? "text-emerald-500" : "text-slate-400"}`}
                      >
                        Pilihan {opt}{" "}
                        {formData.jawaban_benar === opt && "(Kunci)"}
                      </label>
                      <input
                        required={opt !== "E"}
                        disabled={isSaving}
                        className={`w-full p-4 border rounded-2xl font-bold outline-none transition-all ${formData.jawaban_benar === opt ? "bg-emerald-50 border-emerald-300 text-emerald-900" : "bg-slate-50 border-slate-200 text-slate-700"}`}
                        value={formData[keyMap] || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, [keyMap]: e.target.value })
                        }
                      />
                    </div>
                  );
                })}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-emerald-500 ml-1">
                    Kunci Jawaban Benar
                  </label>
                  <select
                    required
                    disabled={isSaving}
                    className="w-full p-4 bg-emerald-500 border border-emerald-600 text-white rounded-2xl font-black outline-none shadow-lg cursor-pointer"
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
              <div className="pt-4 mt-6 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2 shadow-xl hover:bg-blue-700 transition-all uppercase tracking-widest disabled:opacity-70"
                >
                  {isSaving ? (
                    <RefreshCw size={20} className="animate-spin" />
                  ) : (
                    <Save size={20} />
                  )}{" "}
                  {isSaving ? "Menyimpan..." : "Simpan Soal"}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </Dashboard>
  );
};

export default GuruDashboard;
