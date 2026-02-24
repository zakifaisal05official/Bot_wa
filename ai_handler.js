const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const { JADWAL_PELAJARAN, MOTIVASI_SEKOLAH } = require('./constants');

// Inisialisasi API dengan Key Baru
const genAI = new GoogleGenerativeAI("AIzaSyAqLg4A-W-M-zjynUDMAm1Esmg_G4djgJM");

// Merapikan Jadwal Pelajaran agar mudah dibaca AI
const daftarJadwal = Object.entries(JADWAL_PELAJARAN)
    .map(([hari, mapel]) => `Hari ke-${hari}: ${mapel.replace(/\n/g, ', ')}`)
    .join('\n');

const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: `Kamu adalah asisten kelas yang cerdas (nama extension sistem: ridfot). 
    Panggil dirimu 'Asisten'.
    
    DATA JADWAL SEKOLAH:
    ${daftarJadwal}
    
    DATA MOTIVASI:
    ${MOTIVASI_SEKOLAH.join(' | ')}
    
    ATURAN JAWAB:
    1. Jawablah dengan ramah, santai, dan gunakan emoji yang relevan.
    2. Gunakan data jadwal di atas untuk menjawab pertanyaan seputar pelajaran.
    3. Jika siswa terlihat malas, berikan salah satu motivasi dari data di atas.
    4. Kamu bisa menjawab pertanyaan umum di luar sekolah, tapi tetap sopan.`,
    
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
        // Mencatat error di console terminal
        console.error("LOG ERROR ASISTEN AI:", error);

        // Memberikan jawaban yang memberitahu jenis errornya agar mudah dilacak
        let errorMessage = error.message;
        
        if (errorMessage.includes("API key not valid")) {
            return "❌ API Key tidak valid. Coba buat Key baru di Google AI Studio.";
        } else if (errorMessage.includes("quota")) {
            return "⏳ Maaf, Asisten lagi capek (Quota Habis). Tunggu 1 menit ya!";
        } else {
            return `Aduh, otak Asisten lagi nge-lag. (Detail: ${errorMessage})`;
        }
    }
}

module.exports = { askAI };
