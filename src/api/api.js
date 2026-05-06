// src/api/api.js
import { createClient } from '@supabase/supabase-js';

export const APP_NAME = "CBT-MASDA-2026";

// Kredensial Supabase
const supabaseUrl = 'https://mmtgtcjwedpfkivdakup.supabase.co';
const supabaseKey = 'sb_publishable_5WrYJLYicZV_dmRLFXkfsw_fHnRF8sj';

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

    // ========================================================
    // FITUR AUTO-SAVE KE SERVER & ANTI-CHEAT
    // ========================================================

    // Auto-Save setiap 15 Detik & Saat Pindah Soal
    saveSesi: async (username, idUjian, jawaban, sisaWaktu, pelanggaran = 0, statusSesi = 'ACTIVE') => {
        try {
            const idSesi = `${username}_${idUjian}`;
            const waktuSekarang = new Date().toISOString();
            const jawabanString = typeof jawaban === 'string' ? jawaban : JSON.stringify(jawaban);

            // 1. Cek apakah sesi ini sudah ada di database
            const { data: existingSesi } = await supabase
                .from('sesi_ujian')
                .select('id_sesi')
                .eq('id_sesi', idSesi)
                .single();

            if (existingSesi) {
                // JIKA SUDAH ADA: Lakukan UPDATE (Hanya perbarui updated_at)
                const payloadUpdate = {
                    jawaban_sementara: jawabanString,
                    sisa_waktu: sisaWaktu,
                    pelanggaran: pelanggaran,
                    status: statusSesi,
                    updated_at: waktuSekarang
                };

                const { error: updateError } = await supabase
                    .from('sesi_ujian')
                    .update(payloadUpdate)
                    .eq('id_sesi', idSesi);

                if (updateError) console.error("Update error:", updateError.message);

            } else {
                // JIKA BELUM ADA (Baru Login): Lakukan INSERT (Isi created_at dan updated_at)
                const payloadInsert = {
                    id_sesi: idSesi,
                    username_siswa: username,
                    id_ujian: idUjian,
                    jawaban_sementara: jawabanString,
                    sisa_waktu: sisaWaktu,
                    pelanggaran: pelanggaran,
                    status: statusSesi,
                    created_at: waktuSekarang,
                    updated_at: waktuSekarang
                };

                const { error: insertError } = await supabase
                    .from('sesi_ujian')
                    .insert([payloadInsert]);

                if (insertError) console.error("Insert error:", insertError.message);
            }
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