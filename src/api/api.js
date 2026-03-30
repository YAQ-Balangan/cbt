// src/api/api.js
import { createClient } from '@supabase/supabase-js';

export const APP_NAME = "CBT-MASDA-2026";

// Kredensial Supabase
const supabaseUrl = 'https://mmtgtcjwedpfkivdakup.supabase.co';
const supabaseKey = 'sb_publishable_5WrYJLYicZV_dmRLFXkfsw_fHnRF8sj';

export const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// FUNGSI PINTAR: Mengambil kode_sekolah dari memori sesi pengguna saat ini
// Ini yang membuat kita TIDAK PERLU mengedit kode di Dasbor-Dasbor Anda!
// ============================================================================
const getCurrentKodeSekolah = () => {
    try {
        const saved = sessionStorage.getItem(`${APP_NAME}_session`);
        if (saved) {
            const user = JSON.parse(saved);
            return user.kode_sekolah;
        }
    } catch (e) { }
    return null;
};

export const api = {
    // 0. AMBIL INFO SEKOLAH UNTUK HALAMAN LOGIN (Nama Aplikasi & Logo)
    getInstitusi: async (kodeSekolah) => {
        const { data, error } = await supabase
            .from('institusi')
            .select('*')
            .eq('kode_sekolah', kodeSekolah)
            .single();
        if (error) throw new Error("Sekolah tidak ditemukan. Pastikan link URL sudah benar.");
        return data;
    },

    // 1. LOGIN (Sekarang wajib mencocokkan kode_sekolah dari URL)
    login: async (username, password, kodeSekolah) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .eq('kode_sekolah', kodeSekolah); // <-- Saringan Multi-Tenant

        if (error) throw new Error(error.message);
        if (data && data.length > 0) {
            const user = data[0];
            delete user.password; // Hapus password dari memori
            return user;
        }
        throw new Error("Gagal Login: Username atau Password Salah");
    },

    // 2. READ (Tarik Data - Otomatis difilter sesuai sekolah yang login)
    read: async (sheet) => {
        const tableName = sheet.toLowerCase();
        const kodeSekolah = getCurrentKodeSekolah();
        let query = supabase.from(tableName).select('*').order('id', { ascending: true });

        // Jangan filter tabel institusi, tapi filter tabel lainnya
        if (kodeSekolah && tableName !== 'institusi') {
            query = query.eq('kode_sekolah', kodeSekolah);
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);
        return data;
    },

    // 3. READ KHUSUS SESI SISWA
    readSesiSiswa: async (username) => {
        const kodeSekolah = getCurrentKodeSekolah();
        let query = supabase.from('sesi_ujian').select('*').like('id_sesi', `${username}_%`);

        if (kodeSekolah) query = query.eq('kode_sekolah', kodeSekolah);

        const { data, error } = await query;
        if (error) throw new Error(error.message);
        return data;
    },

    // 4. CREATE (Otomatis menyelipkan kode sekolah saat membuat soal/jadwal baru)
    create: async (sheet, rowData) => {
        const tableName = sheet.toLowerCase();
        const kodeSekolah = getCurrentKodeSekolah();

        if (kodeSekolah && tableName !== 'institusi') {
            rowData.kode_sekolah = kodeSekolah; // Sisipkan kepemilikan
        }

        const { data, error } = await supabase.from(tableName).insert([rowData]).select();
        if (error) throw new Error(error.message);
        return data;
    },

    // 5. UPDATE
    update: async (sheet, id, rowData) => {
        const tableName = sheet.toLowerCase();
        const { data, error } = await supabase.from(tableName).update(rowData).eq('id', id).select();
        if (error) throw new Error(error.message);
        return data;
    },

    // 6. DELETE
    delete: async (sheet, id) => {
        const tableName = sheet.toLowerCase();
        const { data, error } = await supabase.from(tableName).delete().eq('id', id).select();
        if (error) throw new Error(error.message);
        return data;
    },

    // 7. SISWA: Submit Ujian (Otomatis menyisipkan kode_sekolah)
    submitUjian: async (dataUjian) => {
        const idSesi = `${dataUjian.username}_${dataUjian.id_ujian}`;
        const kodeSekolah = getCurrentKodeSekolah();

        const payload = {
            id_sesi: idSesi,
            username: dataUjian.username,
            id_ujian: dataUjian.id_ujian,
            jawaban: dataUjian.jawaban,
            sisa_waktu: dataUjian.sisa_waktu,
            status: dataUjian.status,
            nilai: dataUjian.nilai,
            pelanggaran: dataUjian.pelanggaran || 0,
            terakhir_update: new Date().toISOString(),
            kode_sekolah: kodeSekolah
        };

        const { data, error } = await supabase.from('sesi_ujian').upsert(payload, { onConflict: 'id_sesi' }).select();
        if (error) throw new Error(error.message);
        return data;
    },

    // 8. SISWA & GURU: Cek sesi ujian
    getSesiAktif: async (username, idUjian) => {
        const idSesi = `${username}_${idUjian}`;
        const kodeSekolah = getCurrentKodeSekolah();
        let query = supabase.from('sesi_ujian').select('*').eq('id_sesi', idSesi);

        if (kodeSekolah) query = query.eq('kode_sekolah', kodeSekolah);

        const { data, error } = await query.single();
        if (error && error.code !== 'PGRST116') console.error("Gagal tarik sesi:", error.message);
        return data;
    },

    // 9. GURU: Buka Kunci Siswa
    updateSesiStatus: async (username, idUjian, status, pelanggaran = 0) => {
        const idSesi = `${username}_${idUjian}`;
        const { error } = await supabase.from('sesi_ujian').update({ status, pelanggaran }).eq('id_sesi', idSesi);
        if (error) throw new Error(error.message);
    },

    // 10. GURU: Tarik Sesi Terkunci
    getSesiTerkunci: async () => {
        const kodeSekolah = getCurrentKodeSekolah();
        let query = supabase.from('sesi_ujian').select('*').eq('status', 'LOCKED');

        if (kodeSekolah) query = query.eq('kode_sekolah', kodeSekolah);

        const { data, error } = await query;
        if (error) throw new Error(error.message);
        return data || [];
    },

    // 11. SISWA: Hapus Sesi
    deleteSesi: async (username, idUjian) => {
        const idSesi = `${username}_${idUjian}`;
        const { error } = await supabase.from('sesi_ujian').delete().eq('id_sesi', idSesi);
        if (error) throw new Error(error.message);
    }
};