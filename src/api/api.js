// src/api/api.js
import { createClient } from '@supabase/supabase-js';

export const APP_NAME = "CBT-MASDA-2026";

// Kredensial Supabase diambil dari file .env agar aman dari kebocoran
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const api = {
    // 1. LOGIN
    login: async (username, password) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password);

        if (error) throw new Error(error.message);
        if (data && data.length > 0) {
            const user = data[0];
            delete user.password;
            return user;
        }
        throw new Error("Gagal Login: Username atau Password Salah");
    },

    // 2. READ (Tarik Data)
    read: async (sheet) => {
        const tableName = sheet.toLowerCase();
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .order('id', { ascending: true });

        if (error) throw new Error(error.message);
        return data || [];
    },

    // 3. CREATE (Buat Data Baru)
    create: async (sheet, payloadData) => {
        const tableName = sheet.toLowerCase();
        const { data, error } = await supabase
            .from(tableName)
            .insert([payloadData])
            .select();

        if (error) throw new Error(error.message);
        return data;
    },

    // 3.5 CREATE MASSAL (Import Ratusan Data dalam 1 Detik)
    createBulk: async (sheet, payloadArray) => {
        const tableName = sheet.toLowerCase();
        const { data, error } = await supabase
            .from(tableName)
            .insert(payloadArray)
            .select();

        if (error) throw new Error(error.message);
        return data;
    },

    // 4. UPDATE (Edit Data)
    update: async (sheet, numericId, payloadData) => {
        const tableName = sheet.toLowerCase();
        const { data, error } = await supabase
            .from(tableName)
            .update(payloadData)
            .eq('id', numericId)
            .select();

        if (error) throw new Error(error.message);
        return data;
    },

    // 5. DELETE (Hapus Data)
    delete: async (sheet, numericId) => {
        const tableName = sheet.toLowerCase();
        const { data, error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', numericId);

        if (error) throw new Error(error.message);
        return data;
    },

    // --- FUNGSI BARU: HAPUS MASSAL SUPER CEPAT (1 DETIK) ---
    deleteBulk: async (sheet, arrayIds) => {
        const tableName = sheet.toLowerCase();
        const { error } = await supabase
            .from(tableName)
            .delete()
            .in('id', arrayIds);

        if (error) throw new Error(error.message);
        return true;
    },

    // 6. HITUNG TOTAL SOAL (INDIKATOR SAJA)
    getTotalSoal: async () => {
        try {
            const { count, error } = await supabase
                .from('soal')
                .select('*', { count: 'exact', head: true });

            if (error) throw error;
            return count;
        } catch (error) {
            console.error("Gagal menghitung total soal:", error);
            return 0;
        }
    },
    // 7. GET SOAL SPESIFIK MAPEL (Aman dari Inspect Element)
    getSoalUjian: async (mapel) => {
        const { data, error } = await supabase
            .from('soal')
            // HANYA pilih kolom yang dibutuhkan siswa. JANGAN masukan 'Jawaban_Benar'
            .select('id, mapel, kelas, pertanyaan, wacana, link_gambar, opsi_a, opsi_b, opsi_c, opsi_d, opsi_e, poin')
            .ilike('mapel', mapel);

        if (error) throw new Error(error.message);
        return data || [];
    },

    // 8. GET NILAI SPESIFIK SISWA (Backend Filtering Anti-Lag)
    getNilaiSiswa: async (namaSiswa) => {
        const { data, error } = await supabase
            .from('nilai')
            .select('*')
            .ilike('nama_siswa', namaSiswa);

        if (error) throw new Error(error.message);
        return data || [];
    },

    // FUNGSI BARU: Koreksi Aman (Jawaban diambil hanya saat tombol kumpul ditekan)
    koreksiDanSimpanNilai: async (payload) => {
        // 1. Tarik HANYA kunci jawaban untuk SOAL SPESIFIK yang dikerjakan siswa
        const { data: soalData, error: errSoal } = await supabase
            .from('soal')
            .select('id, jawaban_benar, poin, pertanyaan')
            .in('id', payload.soal_ids); // Murni menarik 40 soal milik siswa ini saja

        if (errSoal) throw new Error("Gagal mengambil kunci jawaban: " + errSoal.message);

        let skorSiswa = 0;
        let benarCount = 0;
        let detailJawabanArray = [];
        const totalSoal = soalData.length;

        // 2. Lakukan pencocokan jawaban
        soalData.forEach((soal) => {
            const poin = parseFloat(soal.poin) || 2;
            const idSoal = String(soal.id).trim();
            const jawabanSiswa = payload.jawaban_siswa[idSoal] || "";
            const jawabanBenar = String(soal.jawaban_benar).toUpperCase().trim();

            if (jawabanSiswa && String(jawabanSiswa).toUpperCase().trim() === jawabanBenar) {
                skorSiswa += poin;
                benarCount++;
            }

            detailJawabanArray.push({
                tanya: soal.pertanyaan,
                jawab_siswa: jawabanSiswa,
                kunci: jawabanBenar,
            });
        });

        // 3. Buat ID unik dan format data nilai (pakai huruf kecil untuk database)
        const amanId = Number(Date.now().toString() + Math.floor(Math.random() * 1000).toString().padStart(3, "0"));
        const dataNilai = {
            id: amanId,
            nama_siswa: payload.nama_siswa,
            kelas: payload.kelas,
            mapel: payload.mapel,
            skor: Number(skorSiswa.toFixed(2)),
            benar: benarCount,
            salah: totalSoal - benarCount,
            total_soal: totalSoal,
            status: payload.status,
            detail_jawaban: JSON.stringify(detailJawabanArray),
        };

        // 4. Simpan nilai ke tabel
        const { error: errInsert } = await supabase
            .from('nilai')
            .insert([dataNilai]);

        if (errInsert) throw new Error("Gagal menyimpan nilai: " + errInsert.message);

        return true;
    },

    // ========================================================
    // FITUR AUTO-SAVE KE SERVER & ANTI-CHEAT
    // ========================================================

    // Auto-Save setiap 15 Detik & Saat Pindah Soal (Optimasi Jalur Kilat 300 Siswa)
    saveSesi: async (username, idUjian, jawaban, sisaWaktu, pelanggaran = 0, statusSesi = 'ACTIVE') => {
        try {
            const idSesi = `${username}_${idUjian}`;
            const waktuSekarang = new Date().toISOString();
            const jawabanString = typeof jawaban === 'string' ? jawaban : JSON.stringify(jawaban);

            // GANTI LOGIKA LAMA MENJADI JALUR TUNGGAL (UPSERT)
            const payload = {
                id_sesi: idSesi,
                username_siswa: username,
                id_ujian: idUjian,
                jawaban_sementara: jawabanString,
                sisa_waktu: sisaWaktu,
                pelanggaran: pelanggaran,
                status: statusSesi,
                updated_at: waktuSekarang
            };

            const { error } = await supabase
                .from('sesi_ujian')
                .upsert(payload, { onConflict: 'id_sesi' });

            if (error) console.error("Upsert error:", error.message);
        } catch (error) {
            console.error("Gagal save sesi ujian:", error);
        }
    },

    // Tarik progres sebelumnya saat Siswa mulai/melanjutkan ujian
    getSesi: async (username, idUjian) => {
        const idSesi = `${username}_${idUjian}`;
        const { data, error } = await supabase
            .from('sesi_ujian')
            .select('*')
            .eq('id_sesi', idSesi)
            .single();

        // Abaikan error jika sesi memang belum ada (belum pernah ngerjain)
        if (error && error.code !== 'PGRST116') console.error("Gagal tarik sesi:", error.message);
        return data;
    },

    // GURU: Buka Kunci Siswa
    updateSesiStatus: async (username, idUjian, statusUpdate, pelanggaranReset = 0) => {
        const idSesi = `${username}_${idUjian}`;
        const { error } = await supabase
            .from('sesi_ujian')
            .update({
                status: statusUpdate,
                pelanggaran: pelanggaranReset,
                updated_at: new Date().toISOString()
            })
            .eq('id_sesi', idSesi);

        if (error) throw new Error(error.message);
    },

    // GURU: Menarik daftar Siswa yang ngeyel keluar / Terkunci
    getSesiTerkunci: async () => {
        const { data, error } = await supabase
            .from('sesi_ujian')
            .select('*')
            .eq('status', 'LOCKED');

        if (error) throw new Error(error.message);
        return data || [];
    },

    // SISWA: Menghapus sesi setelah ujian berhasil dikumpul agar reset
    deleteSesi: async (username, idUjian) => {
        const idSesi = `${username}_${idUjian}`;
        const { error } = await supabase
            .from('sesi_ujian')
            .delete()
            .eq('id_sesi', idSesi);

        if (error) console.error("Gagal reset sesi ujian:", error.message);
    }
};