const QUIZ_BANK = {
    // 1. SENIN: HALAL BIHALAL & JADWAL (UB, PAIBP, BING, IPA, BIND)
    1: [
        { 
            question: "Senin pertama masuk! Tadi seru Halal Bihalal bareng temen & sekolah?", 
            options: ["Seru Banget", "Maaf-maafan", "Rame", "Adem Suasananya"], 
            feedbacks: ["Mantap! Mulai hari dengan hati yang bersih. ✨", "Indahnya saling memaafkan, jadi makin akrab! 🤝", "Sekolah jadi hidup lagi ya setelah libur. 🏫", "Suasana damai bikin belajar jadi lebih tenang. 🙏"] 
        },
        { 
            question: "Tadi ada materi PAIBP di jam ke-2. Bahasannya gimana?", 
            options: ["Paham", "Lumayan", "Banyak Catatan", "Menarik"], 
            feedbacks: ["Mantap, ilmu agama buat bekal dunia akhirat. 🙏", "Sip, yang penting intinya nyangkut. ✨", "Catatan rapi bikin belajar lebih enak nanti! 📝", "Diskusi materi emang selalu asik ya. 🗣️"] 
        },
        { 
            question: "Bahasa Inggris (BING) jam ke-5. Sudah lancar speaking-nya?", 
            options: ["Lancar", "Masih Belajar", "Vocab Baru", "Paham"], 
            feedbacks: ["Good job! Keep practicing. 🇬🇧", "Gak apa-apa, step by step pasti bisa! 📈", "Nambah kata baru berarti nambah pinter! 📚", "Excellent! Lanjutkan prestasimu. 🌟"] 
        },
        { 
            question: "Siang-siang belajar IPA (jam 7-8). Otak masih aman?", 
            options: ["Masih Segar", "Mulai Panas", "Seru Eksperimen", "Fokus"], 
            feedbacks: ["Daya tahan kamu keren banget! 🧠", "Wajar, IPA emang butuh logika kuat. 🌬️", "Sains itu emang penuh kejutan ya! 🧪", "Fokus adalah kunci paham materi berat. 🎯"] 
        },
        { 
            question: "Ditutup dengan Bahasa Indonesia (BIND). Bahas apa tadi?", 
            options: ["Sastra", "Teks Laporan", "Diskusi", "Tugas"], 
            feedbacks: ["Cintai bahasa kita sendiri, keren! 🇮🇩", "Struktur teks itu penting buat komunikasi. ✍️", "Berani berpendapat itu mental juara! 🗣️", "Semangat ngerjain tugasnya, jangan ditunda! ✅"] 
        }
    ],

    // 2. SELASA: PJOK, MTK, IPS, TIK
    2: [
        { 
            question: "Selasa Sehat! Tadi PJOK di jam pertama, gimana olahraganya?", 
            options: ["Seru Banget", "Capek", "Materi Teori", "Semangat"], 
            feedbacks: ["Badan sehat, belajar pun jadi lancar! ⚽", "Istirahat cukup ya biar energi balik lagi. 🔋", "Teori olahraga penting buat teknik yang bener. 🏃", "Energi pagi emang gak ada lawan! 🔥"] 
        },
        { 
            question: "Matematika (MTK) di jam ke-4. Gimana angka-angkanya?", 
            options: ["Lancar Jaya", "Agak Pusing", "Seru Ngitung", "Paham Konsep"], 
            feedbacks: ["Calon ahli statistik nih! 📐", "Tarik napas, angka itu cuma teka-teki kok. 🔢", "Ngitung itu melatih logika biar tajam! 🧠", "Kalo konsep udah dapet, soal apa aja lewat! ✅"] 
        },
        { 
            question: "Lanjut IPS di jam ke-6. Bahas fenomena apa tadi?", 
            options: ["Sejarah", "Ekonomi", "Geografi", "Sosial"], 
            feedbacks: ["Belajar masa lalu buat masa depan lebih baik. ⏳", "Paham ekonomi sejak dini itu cerdas! 💰", "Dunia ini luas, asik ya dipelajari. 🌍", "Interaksi sosial itu kunci kehidupan. 🤝"] 
        },
        { 
            question: "TIK di jam ke-8. Udah siap jadi anak tech?", 
            options: ["Paham Software", "Hardware", "Browsing", "Coding Dikit"], 
            feedbacks: ["Skill digital itu wajib di jaman sekarang! 💻", "Makin tau isi PC makin keren! 🖱️", "Gunakan internet buat hal bermanfaat ya. 🌐", "Koding itu seni logika, mantap! 🚀"] 
        },
        { 
            question: "Gimana Selasa kamu secara keseluruhan?", 
            options: ["Produktif", "Melelahkan", "Biasa Saja", "Menyenangkan"], 
            feedbacks: ["Top! Pertahankan ritmenya. 🏆", "Rebahan bentar abis ini biar fresh lagi. 🛌", "Gak apa-apa, besok pasti lebih seru! ✨", "Hati senang, ilmu gampang masuk. 😊"] 
        }
    ],

    // 3. RABU: BIND, BSUN, IPS, MTK
    3: [
        { 
            question: "Rabu Produktif! Tadi B. Indonesia lagi, gimana progresnya?", 
            options: ["Lancar", "Banyak Tugas", "Seru", "Fokus"], 
            feedbacks: ["Bahasa Indonesia emang fleksibel dan asik! 📖", "Tugas adalah latihan mental, semangat! ✍️", "Makin paham cara komunikasi yang baik. ✨", "Fokus kamu juara! 🥇"] 
        },
        { 
            question: "Pelajaran Basa Sunda (BSUN). Kumaha tadi di kelas?", 
            options: ["Tiasa Pisan", "Hese Dikit", "Seru", "Ngamumule"], 
            feedbacks: ["Alus! Lestarikan terus budaya urang. 🎭", "Lalaunan pasti bisa, semangat! 😊", "Bahasa Sunda emang unik dan nyeni. ✨", "Mantap, jati diri kudu dijaga! 📖"] 
        },
        { 
            question: "IPS lagi di jam ke-5. Masih nyambung materinya?", 
            options: ["Masih", "Agak Lupa", "Seru Diskusi", "Nyimak"], 
            feedbacks: ["Keren, ingatan kamu tajam! 🧠", "Wajar, baca-baca lagi nanti di rumah ya. 📚", "Diskusi bikin materi makin nempel. 🗣️", "Menyimak adalah tanda murid pintar. 👂"] 
        },
        { 
            question: "Matematika (MTK) jam ke-7. Udah mulai 'berasap'?", 
            options: ["Aman", "Pusing Dikit", "Selesai Soal", "Seru"], 
            feedbacks: ["Logika kamu kuat banget ya! 💪", "Cuci muka dulu biar fresh lagi. 🚿", "Puas banget kan kalau soal susah kelar? ✅", "MTK emang bikin ketagihan kalau paham! 🔢"] 
        },
        { 
            question: "Rabu sudah lewat! Gimana semangat buat besok?", 
            options: ["Masih Gas", "Butuh Libur", "Stay Cool", "Ready"], 
            feedbacks: ["Energi yang luar biasa! 🔥", "Dikit lagi weekend, tahan ya! 🏁", "Gaya yang tenang tapi pasti. 😎", "Itu baru semangat anak 9G! 🚀"] 
        }
    ],

    // 4. KAMIS: IPA, PANCASILA, SBK
    4: [
       { 
            question: "Udah siap buat tempur di TKA minggu depan? Semangat ya!", 
            options: ["Siap!", "Pasti Bisa", "Bismillah", "Gas Pol"], 
            feedbacks: ["Selamat berjuang! Doa terbaik buat kamu. 🥇", "Kejar nilai terbaik, banggain orang tua! 🌟", "Semoga diberi kemudahan di setiap soal. 🙏", "Energi penuh buat TKA! Kamu hebat! 💪"] 
        }
    ],

    // 5. JUMAT: YASINAN, JUMSIH, BING, BCRB & SEMANGAT TKA
    5: [
        { 
            question: "Jumat Berkah! Tadi awali dengan Yasinan buat bekal TKA minggu depan?", 
            options: ["Khidmat", "Tenang", "Doa Bersama", "Lancar"], 
            feedbacks: ["Alhamdulillah, semoga dilancarkan ujiannya nanti! ✨", "Ketenangan hati itu modal utama ujian. 🙏", "Doa bersama bikin mental makin kuat. 🤝", "Semoga berkah buat perjuanganmu minggu depan! 📖"] 
        },
        { 
            question: "Jumat depan udah mulai TKA. Gimana persiapannya?", 
            options: ["Lagi Belajar", "Siap Tempur", "Deg-degan", "Optimis"], 
            feedbacks: ["Semangat! Kamu pasti bisa ngerjainnya. 📚", "Mental juara! Gas terus! 🔥", "Wajar kok, tarik napas dan fokus ya. 🌬️", "Keyakinan adalah 50% kemenangan! 🏆"] 
        },
        { 
            question: "Bahasa Inggris (BING) tadi ngebahas kisi-kisi buat ujian?", 
            options: ["Iya", "Materi Umum", "Paham", "Lancar"], 
            feedbacks: ["Kisi-kisi itu 'peta' buat dapet nilai bagus! 🗺️", "Pahami strukturnya, ujian pasti gampang. ✍️", "Mantap, skill bahasa kamu makin oke. 📈", "Good luck for your exam next week! 🇬🇧"] 
        },
        { 
            question: "Literasi BCRB tadi bantu buat pemahaman bacaan TKA gak?", 
            options: ["Bantu Banget", "Lumayan", "Fokus Baca", "Selesai"], 
            // BAGIAN INI SUDAH SAYA LENGKAPI AGAR TIDAK EROR LAGI
            feedbacks: ["Membaca teliti itu kunci ngerjain soal cerita! 📖", "Nambah wawasan biar gak kaget liat soal. ✨", "Fokus adalah kekuatan utama kamu. 🎯", "Tuntas semua tugas, tinggal hadapi ujian! 🏁"] 
        }
    ]
};

// Jangan lupa tambahkan module export di paling bawah agar bisa dibaca scheduler.js
module.exports = { QUIZ_BANK };
