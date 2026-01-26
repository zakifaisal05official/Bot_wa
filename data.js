const fs = require('fs');
const DATA_FILE = './data.json';

const defaultData = {
    senin: "Belum ada tugas.",
    selasa: "Belum ada tugas.",
    rabu: "Belum ada tugas.",
    kamis: "Belum ada tugas.",
    jumat: "Belum ada tugas.",
    terakhir_update: "-"
};

const database = {
    // Memastikan file ada saat bot baru dinyalakan
    init: () => {
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
            console.log("📁 Database JSON baru berhasil dibuat.");
        }
    },

    getAll: () => {
        try {
            if (!fs.existsSync(DATA_FILE)) return defaultData;
            const content = fs.readFileSync(DATA_FILE, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            console.error("Gagal membaca database, menggunakan default.");
            return defaultData;
        }
    },

    updateTugas: (hari, isi) => {
        const data = database.getAll();
        const key = hari.toLowerCase();
        
        if (data.hasOwnProperty(key)) {
            data[key] = isi;
            data.terakhir_update = new Date().toLocaleString('id-ID', { 
                timeZone: 'Asia/Jakarta',
                dateStyle: 'medium',
                timeStyle: 'short'
            });
            fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
            return true;
        }
        return false;
    },

    resetSemua: () => {
        fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
        return true;
    }
};

// Jalankan init otomatis saat modul dipanggil
database.init();

module.exports = database;
