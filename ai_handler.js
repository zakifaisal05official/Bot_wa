const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const { JADWAL_PELAJARAN, MOTIVASI_SEKOLAH } = require('./constants');

// Inisialisasi API dengan Key terbaru kamu
const genAI = new GoogleGenerativeAI("AIzaSyAqLg4A-W-M-zjynUDMAm1Esmg_G4djgJM");

// Format Jadwal agar AI paham
const daftarJadwal = Object.entries(JADWAL_PELAJARAN)
    .map(([hari, mapel]) => `Hari ke-${hari}: ${mapel.replace(/\n/g, ', ')}`)
    .join('\n');

// Inisialisasi Model Gemini 1.5 Flash
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: `Kamu adalah asisten kelas yang cerdas (nama extension sistem: ridfot). 
    Panggil dirimu 'Asisten'.
    
    DATA JADWAL SEKOLAH:
    ${daftarJadwal}
    
    DATA MOTIVASI:
    ${MOTIVASI_SEKOLAH.join(' | ')}
    
    ATURAN JAWAB:
    1. Jawablah dengan ramah, santai, dan gunakan emoji.
    2. Gunakan data jadwal untuk menjawab pertanyaan pelajaran.
    3. Jika siswa malas, berikan motivasi dari data di atas.
    4. Kamu asisten yang sopan tapi asik.`,
    
    safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ],
});

async function askAI(query) {
    try {
        const result = await model.generateContent(query);
        const response = await result.response;
        const text = response.text();
        
        return text && text.length > 0 ? text : "Maaf, Asisten tidak bisa menemukan jawaban yang tepat.";
        
    } catch (error) {
        console.error("LOG ERROR ASISTEN AI:", error);

        // Pesan error ramah agar user tahu masalahnya
        if (error.message.includes("404")) {
            return "❌ Model AI tidak ditemukan. Pastikan sudah klik REDEPLOY di Zeabur setelah update package.json.";
        } else if (error.message.includes("quota")) {
            return "⏳ Kuota gratisan Asisten habis, coba lagi 1 menit kemudian ya!";
        } else {
            return `Aduh, otak Asisten lagi nge-lag. (Detail: ${error.message})`;
        }
    }
}

module.exports = { askAI };
