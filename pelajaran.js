// pelajaran.js

const MAPEL_CONFIG = {
    'BING': 'Bahasa Inggris 💂',
    'BCRB': 'Bahasa Cirebon ☁️༄.°',
    'PANCASILA': 'Pancasila 🦅',
    'SBK': 'Sbk 🎨',
    'IPS': 'Ips 🌍',
    'TIK': 'Informatika 📡',
    'IPA': 'Ipa 🔬',
    'BSUN': 'Bahasa Sunda 🦚',
    'MTK': 'Matematika 🧮',
    'PJOK': 'Pjok 🏃',
    'BIND': 'Bahasa Indonesia 🐦‍🔥'
};

const STRUKTUR_JADWAL = {
    'senin': ['BING', 'BCRB', 'PANCASILA'],
    'selasa': ['SBK', 'IPS', 'PANCASILA'],
    'rabu': ['TIK', 'IPA'],
    'kamis': ['BSUN', 'MTK', 'PJOK'],
    'jumat': ['BIND', 'IPS']
};

const LABELS = {
    'ulangan': '🏷️ 📝 Ulangan harian',
    'biasa': '🏷️ 📒 Tugas biasa',
    'lks': '🏷️ 📕 Tugas lks',
    'hafalan': '🏷️ 📃 Tugas afalan',
    'kelompok': '🏷️ 🤼 Tugas Kelompok',
    'berenang': '🏷️ 🏊🏻 Berenang / praktek',
    'pdf': '🏷️ 📂 Tugas PDF Atau Gambar',
    'gambar': '🏷️ 📂 Tugas PDF Atau Gambar'
};

module.exports = { MAPEL_CONFIG, STRUKTUR_JADWAL, LABELS };
