const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const { JADWAL_PELAJARAN, MOTIVASI_SEKOLAH } = require('./constants');

// API Key kamu
const genAI = new GoogleGenerativeAI("AIzaSyAqLg4A-W-M-zjynUDMAm1Esmg_G4djgJM");

const daftarJadwal = Object.entries(JADWAL_PELAJARAN)
    .map(([hari, mapel]) => `Hari ke-${hari}: ${mapel.replace(/\n/g, ', ')}`)
    .join('\n');

// GANTI KE GEMINI-PRO (Paling stabil, anti 404)
const model = genAI.getGenerativeModel({ 
    model: "gemini-pro", 
});

async function askAI(query) {
    try {
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: `Kamu adalah asisten kelas cerdas bernama Asisten (extension: ridfot). Jadwal: ${daftarJadwal}. Motivasi: ${MOTIVASI_SEKOLAH.join(' | ')}` }],
                },
                {
                    role: "model",
                    parts: [{ text: "Halo! Asisten siap membantu menjawab jadwal atau kasih motivasi. Ada apa nih?" }],
                },
            ],
        });

        const result = await chat.sendMessage(query);
        const response = await result.response;
        const text = response.text();
        
        return text;
        
    } catch (error) {
        console.error("LOG ERROR ASISTEN AI:", error);
        
        // Jika gemini-pro pun gagal, berarti ada masalah koneksi dari server ke Google
        return "Aduh, otak Asisten lagi beneran nge-lag. Coba tanya lagi ya!";
    }
}

module.exports = { askAI };
