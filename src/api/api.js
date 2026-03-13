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

    // 3. CREATE (Tambah Data Baru)
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
    // FITUR KEAMANAN: HYBRID AUTO-SAVE & SESSION LOCK
    // ========================================================

    // Menyimpan progres sekaligus status (ACTIVE/LOCKED)
    saveSesi: async (username, idUjian, jawaban, sisaWaktu, cheatWarn, status = "ACTIVE") => {
        const idSesi = `${username}_${idUjian}`;
        const { error } = await supabase
            .from('sesi_ujian')
            .upsert({
                id_sesi: idSesi,
                username_siswa: username,
                id_ujian: idUjian,
                jawaban_sementara: jawaban,
                sisa_waktu: sisaWaktu,
                peringatan_cheat: cheatWarn,
                status: status // Kolom status untuk mengunci/membuka sesi
            }, { onConflict: 'id_sesi' });

        if (error) console.error("Gagal auto-save ke server:", error.message);
    },

    // Mengambil data sesi terakhir siswa
    getSesi: async (username, idUjian) => {
        const idSesi = `${username}_${idUjian}`;
        const { data, error } = await supabase
            .from('sesi_ujian')
            .select('*')
            .eq('id_sesi', idSesi)
            .single();

        if (error && error.code !== 'PGRST116') console.error("Gagal tarik sesi:", error.message);
        return data;
    },

    // Fitur Guru: Membuka kunci (Unlock) sesi siswa yang terblokir
    updateSesiStatus: async (username, idUjian, statusBaru) => {
        const idSesi = `${username}_${idUjian}`;
        const { data, error } = await supabase
            .from('sesi_ujian')
            .update({ status: statusBaru })
            .eq('id_sesi', idSesi)
            .select();

        if (error) throw new Error(error.message);
        return data;
    }
};