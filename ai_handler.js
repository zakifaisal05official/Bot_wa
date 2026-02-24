const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const { JADWAL_PELAJARAN, MOTIVASI_SEKOLAH } = require('./constants');

// Gunakan API Key kamu yang baru
const genAI = new GoogleGenerativeAI("AIzaSyAqLg4A-W-M-zjynUDMAm1Esmg_G4djgJM");

const daftarJadwal = Object.entries(JADWAL_PELAJARAN)
    .map(([hari, mapel]) => `Hari ke-${hari}: ${mapel.replace(/\n/g, ', ')}`)
    .join('\n');

// PERUBAHAN DI SINI: Kita definisikan model dengan cara yang lebih eksplisit
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash", 
}, { apiVersion: 'v1' }); // Memaksa menggunakan API v1 (bukan v1beta yang sering error 404)

async function askAI(query) {
    try {
        // Konfigurasi instruksi sistem dipindah ke sini agar lebih stabil
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: `Kamu adalah asisten kelas yang cerdas (ridfot). Gunakan data ini: ${daftarJadwal}` }],
                },
                {
                    role: "model",
                    parts: [{ text: "Siap, Asisten di sini! Ada yang bisa dibantu?" }],
                },
            ],
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        const result = await chat.sendMessage(query);
        const response = await result.response;
        return response.text();
        
    } catch (error) {
        console.error("LOG ERROR ASISTEN AI:", error);
        
        // Jika masih error 404, kita beri instruksi ganti model ke pro
        if (error.message.includes("404")) {
            return "❌ Model Flash gagal. Coba ganti baris model di ai_handler.js menjadi 'gemini-pro'.";
        }
        return `Aduh, otak Asisten lagi nge-lag. (Error: ${error.message})`;
    }
}

module.exports = { askAI };
