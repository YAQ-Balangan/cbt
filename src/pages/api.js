// src/api/api.js
export const APP_NAME = "CBT-MASDA-2026";

// Token Airtable SUDAH DIHAPUS dari sini demi keamanan!
// Masukkan URL Cloudflare Worker Anda di bawah ini (Tanpa garis miring '/' di akhir)
const API_URL = "https://api-masda.printeryaq.workers.dev"; // GANTI DENGAN URL CLOUDFLARE ANDA

const headers = {
    "Content-Type": "application/json"
};

// Fungsi cerdas penerjemah ID Angka -> ID Airtable
const getAirtableRecordId = async (sheetName, numericId) => {
    const tableName = sheetName.toLowerCase();
    const formula = `id='${numericId}'`;
    const res = await fetch(`${API_URL}/${tableName}?filterByFormula=${encodeURIComponent(formula)}`, { headers });
    const data = await res.json();

    if (data.records && data.records.length > 0) {
        return data.records[0].id;
    }
    throw new Error(`Data dengan ID #${numericId} tidak ditemukan di database!`);
};

export const api = {
    // 1. LOGIN
    login: async (username, password) => {
        const formula = `AND({username}='${username}', {password}='${password}')`;
        const url = `${API_URL}/users?filterByFormula=${encodeURIComponent(formula)}`;

        const response = await fetch(url, { headers });
        const result = await response.json();

        if (result.records && result.records.length > 0) {
            const user = result.records[0].fields;
            delete user.password; // Keamanan
            return user;
        }
        throw new Error("Gagal Login: Username atau Password Salah");
    },

    // 2. READ (Tarik Data dengan Skala Besar)
    read: async (sheet) => {
        const tableName = sheet.toLowerCase();
        let allRecords = [];
        let offset = '';

        do {
            const url = `${API_URL}/${tableName}${offset ? `?offset=${offset}` : ''}`;
            const response = await fetch(url, { headers });
            const result = await response.json();

            if (result.records) {
                allRecords = [...allRecords, ...result.records.map(rec => rec.fields)];
            }
            offset = result.offset;
        } while (offset);

        return allRecords;
    },

    // 3. CREATE (Tambah Data Baru)
    create: async (sheet, data) => {
        const tableName = sheet.toLowerCase();
        const payload = { records: [{ fields: data }] };
        const response = await fetch(`${API_URL}/${tableName}`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload)
        });
        return await response.json();
    },

    // 4. UPDATE (Edit Data)
    update: async (sheet, numericId, data) => {
        const tableName = sheet.toLowerCase();
        const recordId = await getAirtableRecordId(tableName, numericId);

        const payload = { records: [{ id: recordId, fields: data }] };
        const response = await fetch(`${API_URL}/${tableName}`, {
            method: "PATCH",
            headers: headers,
            body: JSON.stringify(payload)
        });
        return await response.json();
    },

    // 5. DELETE (Hapus Data)
    delete: async (sheet, numericId) => {
        const tableName = sheet.toLowerCase();
        const recordId = await getAirtableRecordId(tableName, numericId);

        const response = await fetch(`${API_URL}/${tableName}/${recordId}`, {
            method: "DELETE",
            headers: headers
        });
        return await response.json();
    }
};