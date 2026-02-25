const axios = require('axios');
const { JADWAL_PELAJARAN, MOTIVASI_SEKOLAH } = require('./constants');

// Merapikan Jadwal Pelajaran agar AI paham
const daftarJadwal = Object.entries(JADWAL_PELAJARAN)
    .map(([hari, mapel]) => `Hari ke-${hari}: ${mapel.replace(/\n/g, ', ')}`)
    .join('\n');

async function askAI(query) {
    try {
        // Kita menggunakan provider AI gratis yang tetap pintar (Hercai)
        // Keuntungan: Nggak perlu API Key, nggak bakal Error 404
        const response = await axios.get(`https://hercai.onrender.com/v3/hercai`, {
            params: {
                question: `Instruksi: Kamu adalah Asisten kelas yang cerdas (nama extension sistem: ridfot). 
                Panggil dirimu 'Asisten'. Jawablah dengan ramah, santai, dan gunakan emoji.
                
                DATA JADWAL:
                ${daftarJadwal}
                
                DATA MOTIVASI:
                ${MOTIVASI_SEKOLAH.join(' | ')}
                
                Pertanyaan User: ${query}`
            }
        });

        // Mengambil jawaban teks
        const reply = response.data.reply;
        
        return reply && reply.length > 0 ? reply : "Maaf, Asisten lagi bingung jawabnya.";
        
    } catch (error) {
        console.error("LOG ERROR ASISTEN AI:", error);
        
        // Pesan jika koneksi ke API gratisannya lagi gangguan
        return "Aduh, otak Asisten lagi nge-lag koneksinya. Coba tanya lagi ya!";
    }
}

module.exports = { askAI };
