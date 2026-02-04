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
    3: [ // RABU (PENGUMUMAN JUARA PENSI NARI)
        { 
            question: "Gimana hasil penentuan nilai Pensi Nari tadi? Kelas kita menang atau dapet juara gak?", 
            options: ["ALHAMDULILLAH JUARA!", "TOP 2 ALUR CERITA TERBAIK!", "Masuk 3 Besar!", "Belum Beruntung", "Gak Masalah, Tetap Solid"],
            feedbacks: [
                "ALHAMDULILLAH! Persembahan tari terakhir kita sebelum lulus ditutup dengan kemenangan manis! Bangga banget sama kerja keras kalian semua! 🏆 Kenangan indah buat kelas kita! ✨",
                "KEREN PARAH! Dapet Top 2 Alur Cerita Terbaik itu bukti kalau konsep kita emang berkelas. Perjuangan latihan tiap Jumat & Sabtu yang nguras waktu sekarang udah tuntas dan terbayar lunas. Akhirnya kalian bisa tarik napas lega, gak perlu latihan lagi di hari sibuk atau hari libur. Enjoy the victory, kalian hebat banget! Proud of you all! 🎭✨",
                "MANTAP! Juara berapapun itu, yang paling penting kita udah nampilin tarian terbaik kita di panggung terakhir ini. Bangga banget sama kekompakan kalian! 🥇🎉",
                "Gak apa-apa, jangan sedih ya. Pensi nari ini bukan soal menang atau kalah, tapi soal momen kebersamaan terakhir kita yang bakal kita inget terus pas udah lulus nanti. ❤️",
                "Meskipun hari ini belum menang, tapi bagi mimin, tarian kelas kita tetep yang paling kompak! Yang penting kita udah seru-seruan bareng sebelum nanti lulus. Tetap solid ya! 🔥"
            ]
        }
    ],
    4: [ // KAMIS (PASCA PENSI)
        { 
            question: "Pensi udah beres, properti udah bersih. Gimana rasanya hari ini setelah semua perjuangan tuntas?", 
            options: ["Lega & Bangga", "Masih Kepikiran Serunya", "Kangen Latihan Bareng", "Happy Banget"],
            feedbacks: [
                "Bener-bener lega ya! Akhirnya tugas kita selesai dengan indah. Makasih ya yang udah bantu beres-beres properti kemarin, kalian luar biasa! 🤝",
                "Sama! Rasanya masih pengen denger musik tariannya diputer lagi. Emang momen paling pecah sih selama sekolah! 🤩🔥",
                "Iya ya, gak bakal ada lagi jadwal latihan Jumat-Sabtu yang bikin capek tapi seru. Makasih udah jadi partner berjuang yang hebat! 🥺✨",
                "Seneng banget liat aura positif kalian. Hasil yang kita dapet kemarin emang buah manis dari kompaknya kelas kita. Stay happy! 🥂✨"
            ]
        }
    ],
  5: [ // JUMAT (KHUSUS JAM 11:00)
        { 
            question: "Friday Check! 🕒 Belajar apa aja hari ini? Ada B. Inggris, B. Cirebon, atau lagi pada santai?", 
            options: ["Bahasa Inggris", "Bahasa Cirebon", "Gladi Lapangan", "Jamkos / Gak Belajar"],
            feedbacks: [
                "Nice! Bahasa Inggris itu modal keren buat kalian setelah lulus nanti. Semangat belajarnya! 🇺🇸📚",
                "Lestarikan budaya lokal! Bahasa Cirebon itu jati diri kita, jangan sampai lupa bahasa daerah sendiri ya. 🦐✨",
                "Semangat gladi nya! Lapangan emang panas, tapi keringat kalian hari ini adalah sejarah buat masa depan! 🔥",
                "WADUH! Menikmati masa-masa terakhir di sekolah ya? Meskipun jamkos, tetep jangan bikin keributan di kelas ya kawan! 🤫☕"
            ]
        }
    ]
};

module.exports = { QUIZ_BANK };
