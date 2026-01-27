// quiz.js
const QUIZ_BANK = {
    1: [ // Senin
        { question: "Gimana pelajaran IPA tadi? Banyak rumus atau ada praktikum?", options: ["Pusing banget", "Biasa aja", "Seru percobaannya", "Ngantuk"] },
        { question: "Pelajaran Bahasa Inggris tadi aman? Udah paham materinya?", options: ["Paham dong", "Masih bingung", "Skip dulu", "Lumayan"] },
        { question: "Tadi pas jam pelajaran Agama, dapet poin penting apa nih?", options: ["Sabar & Disiplin", "Etika & Akhlak", "Ikhlas", "Lupa euy"] }
    ],
    2: [ // Selasa (Latihan Pensi & Pelajaran Umum)
        { question: "Gimana latihan Pensi tadi? Udah mulai kelihatan hasilnya?", options: ["Lancar jaya", "Masih kaku", "Seru banget", "Capek tapi asik"] },
        { question: "Tadi pas latihan, bagian mana yang paling bikin ribet?", options: ["Koreografi/Gerakan", "Blocking panggung", "Properti", "Semuanya susah"] },
        { question: "Gimana Matematika hari ini? Otak masih sanggup mikir?", options: ["Aman terkendali", "Berasap dikit", "Tolong menyerah", "Biasa aja"] }
    ],
    3: [ // Rabu
        { question: "Bahasa Sunda tadi lancar? Bisa ngikutin materinya?", options: ["Lancar pisan", "Teu bisa", "Dikit-dikit", "Bingung"] },
        { question: "IPS hari ini bahas apa? Seru gak materinya?", options: ["Seru", "Bosenin", "Banyak nyatet", "Lupa materi"] },
        { question: "Udah jam ke-10, masih semangat sekolah atau pengen cepet pulang?", options: ["Gas terus", "Udah limit", "Ngantuk parah", "Butuh jajan"] }
    ],
    4: [ // Kamis (Gladi Kotor di Lapangan)
        { question: "Gimana Gladi Kotor di lapangan tadi? Udah berasa vibe manggungnya?", options: ["Keren banget!", "Masih banyak salah", "Deg-degan parah", "Panas tapi seru"] },
        { question: "Pas Gladi Kotor tadi, apa yang paling perlu dievaluasi lagi?", options: ["Suara/Audio", "Kekompakan", "Properti", "Mental"] },
        { question: "Pelajaran Pancasila tadi bahas materi apa?", options: ["Diskusi", "Presentasi", "Nyatet", "Dengerin aja"] }
    ],
    5: [ // Jumat
        { question: "Gimana kegiatan Jumsih & Yasinan tadi pagi?", options: ["Adem banget", "Capek bersih-bersih", "Seru", "Mager"] },
        { question: "Bahasa Cirebon tadi gimana? Paham kata-katanya?", options: ["Bisa dikit", "Susah banget", "Lancar", "Cuma nyatet"] }
    ],
    "umum": [
        { question: "Siapa yang paling semangat pas latihan Pensi hari ini?", options: ["Aku dong", "Ketua Kelas", "Semuanya semangat", "Gak ada yang semangat"] },
        { question: "Mood balik sekolah hari ini gimana?", options: ["Happy", "Laper", "Ngantuk", "Butuh healing"] }
    ]
};

module.exports = { QUIZ_BANK };
