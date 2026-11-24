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

    getNilaiChangeMarker: async () => {
        const { data, error } = await supabase
            .from('nilai')
            .select('id')
            .order('id', { ascending: false })
            .limit(1);

        if (error) throw new Error(error.message);
        return data?.[0]?.id ?? null;
    },

    subscribeToChanges: (sheet, onChange, onStatus) => {
        return supabase
            .channel(`monitoring-${sheet.toLowerCase()}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: sheet.toLowerCase() },
                onChange,
            )
            .subscribe(onStatus);
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
    // 7. GET SOAL SPESIFIK MAPEL (Backend Filtering Anti-Lag)
    getSoalUjian: async (mapel) => {
        const { data, error } = await supabase
            .from('soal')
            .select('*')
            .ilike('mapel', mapel); // ilike = mencari teks walau huruf besar/kecil beda

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

    submitNilaiUjian: async (username, idUjian, payloadData) => {
        const usernameSiswa = String(username || '').trim();
        const examId = String(idUjian ?? '').trim();
        if (!usernameSiswa || !examId) {
            throw new Error('Username siswa dan ID ujian diperlukan untuk menyimpan nilai.');
        }

        const idSesi = `${usernameSiswa}_${examId}`;

        const { data, error } = await supabase
            .from('nilai')
            .upsert(
                {
                    ...payloadData,
                    id_sesi: idSesi,
                    username_siswa: usernameSiswa,
                    id_ujian: examId,
                },
                { onConflict: 'id_sesi' },
            )
            .select('id')
            .single();

        if (error) throw new Error(error.message);
        if (!data) throw new Error('Nilai belum terkonfirmasi tersimpan.');

        return data;
    },

    // ========================================================
    // FITUR AUTO-SAVE KE SERVER & ANTI-CHEAT
    // ========================================================

    // Autosave answers and time without overwriting teacher-controlled session status.
    saveSesi: async (username, idUjian, jawaban, sisaWaktu, pelanggaran = 0, statusSesi = 'ACTIVE') => {
        try {
            const idSesi = `${username}_${idUjian}`;
            const waktuSekarang = new Date().toISOString();
            const jawabanData = typeof jawaban === 'string' ? JSON.parse(jawaban) : jawaban || {};
            if (!jawabanData || typeof jawabanData !== 'object' || Array.isArray(jawabanData)) {
                throw new Error('Format jawaban sesi ujian tidak valid.');
            }

            const payload = {
                id_sesi: idSesi,
                username_siswa: username,
                id_ujian: idUjian,
                jawaban_sementara: jawabanData,
                sisa_waktu: sisaWaktu,
                pelanggaran: pelanggaran,
                status: statusSesi,
                updated_at: waktuSekarang
            };

            const { data, error } = await supabase
                .from('sesi_ujian')
                .update({
                    jawaban_sementara: jawabanData,
                    sisa_waktu: sisaWaktu,
                    pelanggaran: pelanggaran,
                    updated_at: waktuSekarang
                })
                .eq('id_sesi', idSesi)
                .neq('status', 'DISQUALIFIED')
                .neq('status', 'COMPLETED')
                .select('deadline_at')
                .maybeSingle();

            if (error) {
                console.error("Gagal memperbarui sesi ujian:", error.message);
                return null;
            }
            if (data) return data.deadline_at || null;

            const { data: existingSession, error: lookupError } = await supabase
                .from('sesi_ujian')
                .select('id_sesi, deadline_at, status')
                .eq('id_sesi', idSesi)
                .maybeSingle();

            if (lookupError) throw new Error(lookupError.message);
            if (existingSession) {
                if (['DISQUALIFIED', 'COMPLETED'].includes(existingSession.status)) {
                    return existingSession.deadline_at || null;
                }
                throw new Error('Sesi ujian ditemukan, tetapi gagal diperbarui.');
            }

            const { data: createdSession, error: insertError } = await supabase
                .from('sesi_ujian')
                .insert(payload)
                .select('deadline_at')
                .single();

            if (insertError) throw new Error(insertError.message);
            return createdSession?.deadline_at || null;
        } catch (error) {
            console.error("Gagal save sesi ujian:", error);
            return null;
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
        if (error && error.code !== 'PGRST116') {
            throw new Error(`Gagal tarik sesi ujian: ${error.message}`);
        }
        return data;
    },

    // GURU: Mengubah status sesi tanpa mengubah hitungan deteksi.
    updateSesiStatus: async (username, idUjian, statusUpdate) => {
        const idSesi = `${username}_${idUjian}`;
        const nextStatus = statusUpdate === 'ACTIVE' ? 'ACTIVE_AFTER_UNLOCK' : statusUpdate;
        const { error } = await supabase
            .from('sesi_ujian')
            .update({
                status: nextStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id_sesi', idSesi);

        if (error) throw new Error(error.message);
    },

    transitionSesiStatus: async (username, idUjian, statusUpdate, expectedStatuses) => {
        const idSesi = `${username}_${idUjian}`;
        const { data, error } = await supabase
            .from('sesi_ujian')
            .update({
                status: statusUpdate,
                updated_at: new Date().toISOString()
            })
            .eq('id_sesi', idSesi)
            .in('status', expectedStatuses)
            .select('status')
            .maybeSingle();

        if (error) throw new Error(error.message);
        return data?.status || null;
    },

    // GURU: Menarik sesi aktif untuk pemantauan dan tindakan pengawas.
    getSesiMonitoring: async () => {
        const { data, error } = await supabase
            .from('sesi_ujian')
            .select('id_sesi, username_siswa, id_ujian, status, pelanggaran, updated_at')
            .in('status', ['ACTIVE', 'WARNING', 'ACTIVE_AFTER_UNLOCK', 'LOCKED', 'DISQUALIFIED']);

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

        if (error) throw new Error(`Gagal menghapus sesi ujian: ${error.message}`);
    }
};