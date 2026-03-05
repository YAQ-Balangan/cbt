// src/api/api.js
export const API_URL = "https://script.google.com/macros/s/AKfycbyxSATXD45GwdXCmTFj5o8ilIuTMgzrOzlZ4FKbvFpV8rwt6GocIO1pBYfio2ntpq9q/exec";
export const APP_NAME = "CBT-MASDA-2026";

export const api = {
    // 1. LOGIN
    login: async (username, password) => {
        const response = await fetch(`${API_URL}?action=login&user=${encodeURIComponent(username)}&pass=${encodeURIComponent(password)}`);
        const result = await response.json();
        if (result.status === "success") return result.data;
        throw new Error(result.message || "Gagal Login");
    },

    // 2. READ (Ambil Data)
    read: async (sheet) => {
        const response = await fetch(`${API_URL}?action=read&sheet=${sheet}`);
        const result = await response.json();
        return result.data || [];
    },

    // 3. CREATE (Tambah Data Baru)
    create: async (sheet, data) => {
        // TAMBAHAN: headers text/plain untuk mencegah pemblokiran CORS oleh Google
        const response = await fetch(`${API_URL}?action=insert&sheet=${sheet}`, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify(data),
            redirect: "follow" // Penting agar Google tidak nyasar saat redirect
        });
        return await response.json();
    },

    // 4. UPDATE (Edit Data)
    update: async (sheet, id, data) => {
        const response = await fetch(`${API_URL}?action=update&sheet=${sheet}&id=${id}`, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify(data),
            redirect: "follow"
        });
        return await response.json();
    },

    // 5. DELETE (Hapus Data)
    delete: async (sheet, id) => {
        // Karena API aslimu pakai GET untuk delete, kita pakai GET (bisa ubah ke POST jika di backend pakai doPost)
        const response = await fetch(`${API_URL}?action=delete&sheet=${sheet}&id=${id}`, {
            method: "GET",
            redirect: "follow"
        });
        return await response.json();
    }
};