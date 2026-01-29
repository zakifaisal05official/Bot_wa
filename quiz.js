// quiz.js
const QUIZ_BANK = {
    1: [ // SENIN (GLADI KOTOR TERAKHIR)
        { 
            question: "Gimana Gladi Kotor terakhir di lapangan tadi? Besok udah Final di panggung loh!", 
            options: ["Udah Siap Pol!", "Masih Deg-degan", "Banyak Evaluasi", "Capek Banget"],
            feedbacks: [
                "Mantap! Pertahankan semangatnya buat besok ya. Kasih yang terbaik buat kelas kita! 🔥",
                "Wajar deg-degan, itu tandanya kalian peduli. Tenang, kita pasti bisa kompak besok! ✨",
                "Masih ada waktu malem ini buat diskusi tipis-tipis. Semangat perbaikannya kawan! 🛠️",
                "Langsung istirahat total ya, jangan mabar dulu. Tenaga kalian butuh buat besok Final! 😴"
            ]
        }
    ],
    2: [ // SELASA (FINAL TAMPIL DI PANGGUNG)
        { 
            question: "FINAL CHECK! Gimana penampilan tari kelas kita di panggung tadi?", 
            options: ["PECAH BANGET!", "Kompak Parah", "Ada Salah Dikit", "Lega Udah Beres"],
            feedbacks: [
                "GILA SIH! Panggung bener-bener milik kita tadi. Proud of you all! 🏆🔥",
                "Kekompakan kalian emang gak perlu diraguin lagi. Kenangan indah banget sebelum lulus! 🤝✨",
                "Gak masalah ada salah dikit, ketutup sama energi kalian yang luar biasa tadi! ❤️",
                "Bener-bener plong ya! Yang penting kita udah nampilin hasil latihan kita selama ini. 😇"
            ]
        }
    ],
    3: [ // RABU (PENGUMUMAN JUARA PENSI NARI - SESUAI PERMINTAAN)
        { 
            question: "Gimana hasil penentuan nilai Pensi Nari tadi? Kelas kita menang atau dapet juara gak?", 
            options: ["ALHAMDULILLAH JUARA!", "Masuk 3 Besar!", "Belum Beruntung", "Gak Masalah, Tetap Solid"],
            feedbacks: [
                "ALHAMDULILLAH! Persembahan tari terakhir kita sebelum lulus ditutup dengan kemenangan manis! Bangga banget sama kerja keras kalian semua! 🏆 Kenangan indah buat kelas kita! ✨",
                "MANTAP! Juara berapapun itu, yang paling penting kita udah nampilin tarian terbaik kita di panggung terakhir ini. Bangga banget sama kekompakan kalian! 🥇🎉",
                "Gak apa-apa, jangan sedih ya. Pensi nari ini bukan soal menang atau kalah, tapi soal momen kebersamaan terakhir kita yang bakal kita inget terus pas udah lulus nanti. ❤️",
                "Meskipun hari ini belum menang, tapi bagi mimin, tarian kelas kita tetep yang paling kompak! Yang penting kita udah seru-seruan bareng sebelum nanti lulus. Tetap solid ya! 🔥"
            ]
        }
    ],
    4: [ // KAMIS
        { 
            question: "Pensi udah beres, properti udah diberesin semua? Gimana mood hari ini?", 
            options: ["Udah Beres", "Masih Kepikiran", "Ngantuk", "Happy"],
            feedbacks: [
                "Kelas teladan! Makasih ya yang udah bantu beres-beres properti pensi kemarin. 👍",
                "Jangan terlalu dipikirin, yang penting momennya udah kita jalanin bareng-bareng. 😊",
                "Efek energi abis buat pensi ya? Sore ini tidur yang nyenyak ya semuanya! 💤",
                "Seneng banget liat kalian happy. Kenangan ini bakal mahal banget nanti! ✨"
            ]
        }
    ],
    5: [ // JUMAT (KHUSUS JAM 11:00)
        { 
            question: "Belajar apa aja hari ini? Ada Bahasa Inggris, Bahasa Cirebon, atau lanjut Gladi Kotor lagi di lapangan?", 
            options: ["Bahasa Inggris", "Bahasa Cirebon", "Gladi Kotor Lapangan", "Gabungan semuanya"],
            feedbacks: [
                "Nice! Bahasa Inggris itu bekal penting buat kalian nanti pas udah lulus. 🇺🇸",
                "Lestarikan budaya lokal! Bahasa Cirebon itu unik dan harus kita jaga bareng-bareng ya. 🦐",
                "Semangat gladi kotornya! Lapangan emang panas tapi usaha kalian pasti membuahkan hasil buat kenangan terakhir! 🔥",
                "Wah produktif banget Jumat ini! Jangan lupa minum air putih biar gak drop sebelum weekend! 🥤"
            ]
        }
    ]
};

module.exports = { QUIZ_BANK };
