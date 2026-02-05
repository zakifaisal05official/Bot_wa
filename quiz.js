// quiz.js
const QUIZ_BANK = {
    1: [ // SENIN (YEARBOOK KOBOY)
        { 
            question: "Gimana sesi foto Yearbook tema KOBOY tadi? Udah ngerasa paling keren belum se-kabupaten?", 
            options: ["Gagah Banget!", "Aesthetic Parah", "Salah Kostum Dikit", "Capek Bergaya"],
            feedbacks: [
                "Yeehaaa! Pasti hasil fotonya gahar banget tuh. Aura-aura sukses kalian mulai kelihatan dari gaya koboynya! 🤠🔥",
                "Fix! Ini bakal jadi halaman paling ikonik di buku tahunan nanti. Kenangan keren yang gak bakal terlupa! 📸✨",
                "Gak masalah, justru itu yang bikin unik dan bakal jadi bahan ketawa seru pas kita reuni nanti! 😂🌵",
                "Bergaya ala koboy emang butuh effort, tapi demi dokumentasi terakhir sebelum lulus, semuanya worth it! Istirahat ya Sheriff! 🐎💤"
            ]
        }
    ],
    2: [ // SELASA (MULAI BELAJAR)
        { 
            question: "Selasa Check! 🖊️ Udah mulai masuk materi lagi nih, gimana rasanya balik liat papan tulis hari ini?", 
            options: ["Masih Fokus Kok", "Otak Lagi Loading", "Kangen Masa Latihan Pensi", "Pasrah Sama Tugas"],
            feedbacks: [
                "Mantap! Fokusnya dijaga ya, biar materi pelajaran hari ini langsung nyangkut di kepala. 🔥📖",
                "Wajar banget, efek habis seru-seruan foto koboy emang bikin otak butuh waktu buat sinkron sama pelajaran. Semangat! 🧠⚡",
                "Asli, vibes latihan sore-sore bareng temen emang gak ada tandingannya. Bakal jadi cerita indah pas udah lulus nanti! ✨🎭",
                "Jangan pasrah dulu! Yuk pelan-pelan dibuka buku paketnya, kita babat bareng tugas hari ini biar gak numpuk! 💪📚"
            ]
        }
    ],
    3: [ // RABU (B. INDO, B. SUNDA, IPS, MTK)
        { 
            question: "Hari Rabu penuh bahasa & logika! Gimana tadi pelajaran Bahasa Sunda & MTK-nya?", 
            options: ["Sampurasun! Aman", "MTK Lanjut Terus", "B. Indo Seru", "IPS Banyak Materi"],
            feedbacks: [
                "Rampes! Lestarikan budaya lokal lewat bahasa daerah ya, biar makin luwes ngomongnya! 📖✨",
                "Gas terus! Hari ini emang jatahnya asah otak buat hitung-hitungan. Dikit lagi tuntas kok! 💪📉",
                "Bahasa Indonesia emang penting banget buat nambah kosa kata dan cara komunikasi kita! 🇮🇩📚",
                "Makin paham dong soal fenomena sosial di sekitar kita? Belajar IPS emang bikin wawasan luas! 🗺️🤝"
            ]
        }
    ],
    4: [ // KAMIS (IPA, PANCASILA, SBK)
        { 
            question: "Kamis Berwarna! 🧪 Dari praktikum IPA lanjut Pancasila terus SBK. Pelajaran apa yang paling berkesan hari ini?", 
            options: ["Praktikum IPA", "Materi Pancasila", "Karya SBK", "Capek Tapi Seru"],
            feedbacks: [
                "Eksperimen di laboratorium emang selalu bikin penasaran ya! Berasa jadi ilmuwan sehari. 🧪🔬",
                "Makin paham soal nilai-nilai negara kita. Penting banget buat bekal jadi warga negara yang baik! 🇮🇩✨",
                "Waktunya keluarin jiwa seni! Hasil karya kalian hari ini pasti keren-keren banget. 🎨🎸",
                "Wajar capek, jadwal hari ini emang padat materi tapi tetep seru kan bisa bareng temen sekelas? ❤️"
            ]
        }
    ],
    5: [ // JUMAT (PERSIAPAN TKA)
        { 
            question: "Friday Check! 🕒 Gimana Try Out TKA hari ini? Masih aman atau mulai berasap nih kepalanya?", 
            options: ["Lancar Jaya!", "Susah di Penalaran", "Waktunya Kurang", "Pasrah yang Penting Beres"],
            feedbacks: [
                "Mantap! Kalau TO aja lancar, yakin deh nanti pas ujian beneran kalian bakal babat habis soalnya. 🧠🔥",
                "Tenang, bagian penalaran emang butuh jam terbang. Sering-sering bahas soal bareng ya, kita sukses bareng-bareng! 📚✨",
                "Manajemen waktu itu kunci! Jadikan TO hari ini pelajaran biar besok pas 'perang' beneran gak keteteran. Semangat! ⏳💪",
                "Eits, jangan pasrah dulu! Masa-masa terakhir sekolah ini emang capek, tapi hasilnya bakal manis nanti. Istirahat dulu! ☕🍀"
            ]
        }
    ]
};

module.exports = { QUIZ_BANK };
