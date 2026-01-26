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
    getAll: () => {
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    },
    updateTugas: (hari, isi) => {
        const data = database.getAll();
        data[hari.toLowerCase()] = isi;
        data.terakhir_update = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    },
    resetHari: (hari) => {
        const data = database.getAll();
        data[hari.toLowerCase()] = "Belum ada tugas.";
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    }
};

module.exports = database;
