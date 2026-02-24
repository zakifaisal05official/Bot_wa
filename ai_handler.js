const { GoogleGenerativeAI } = require("@google/generative-ai");
const { JADWAL_PELAJARAN, MOTIVASI_SEKOLAH } = require('./constants');

const genAI = new GoogleGenerativeAI("AIzaSyDF3G1s3pGc68uRFTuw5DekkLb19bi0jho");

const daftarJadwal = Object.entries(JADWAL_PELAJARAN)
    .map(([hari, mapel]) => `Hari ke-${hari}: ${mapel.replace(/\n/g, ', ')}`)
    .join('\n');

const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: `Kamu adalah asisten kelas yang cerdas. Panggil dirimu 'Asisten'.
    Data Jadwal: ${daftarJadwal}
    Data Motivasi: ${MOTIVASI_SEKOLAH.join(' | ')}
    Jawablah dengan ramah, santai, dan gunakan emoji.`
});

async function askAI(query) {
    try {
        const result = await model.generateContent(query);
        return result.response.text();
    } catch (error) {
        return "Aduh, otak Asisten lagi nge-lag. Coba lagi ya!";
    }
}

module.exports = { askAI };
