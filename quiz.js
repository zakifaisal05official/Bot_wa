// quiz.js
const QUIZ_BANK = {
    1: [ // SENIN (UB, PAI, BING, IPA, BIND)
        { 
            question: "Senin produktif! 📝 Tadi ada Upacara lanjut PAI, B. Inggris, IPA, sampe B. Indonesia. Mana yang paling bikin mikir?", 
            options: ["Pelajaran IPA", "B. Inggris", "Agama (PAI)", "B. Indonesia"],
            feedbacks: ["Materi IPA emang butuh fokus ekstra, tapi seru kan kalau udah paham? 🧪✨", "Pasti kosa kata kalian makin jago hari ini. Keep it up! 🇬🇧📚", "Materi PAI emang adem banget buat awali minggu, jadi bekal ibadah! 🌙🙏", "Bahasa Indonesia penting biar makin pinter komunikasi dan paham sastra! 📖🇮🇩"]
        },
        { 
            question: "Monday Check! 🇮🇩 Gimana kondisi upacara dan pelajaran hari pertama minggu ini?", 
            options: ["Upacara Khidmat", "IPA Menantang", "B. Inggris Aman", "Laper Pengen Jajan"],
            feedbacks: ["Jiwa nasionalis terpupuk sejak pagi! Semangat terus belajarnya. 🫡🔥", "IPA emang selalu bikin penasaran sama rumus-rumusnya! 🔬🧬", "Nice! Language is a window to the world. Mantap! 🌎✨", "Sabar! Habis ini istirahat, langsung serbu kantin ya! 🍜🥤"]
        },
        {
            question: "Gimana materi B. Indonesia tadi? Udah siap jadi sastrawan belum?",
            options: ["Sangat Paham", "Lumayan Lah", "Agak Ngantuk", "Bahasanya Dalem"],
            feedbacks: ["Keren! Kemampuan bahasa itu kunci sukses di masa depan. ✍️✨", "Gak apa-apa, yang penting inti materinya nyangkut di kepala! 📖", "Cuci muka dulu! Bahasa Indonesia itu seru kalau dibawa santai. 💧", "Emang dalem banget, bikin kita makin cinta bahasa sendiri! 🇮🇩"]
        },
        {
            question: "English Class tadi bahas apa aja nih? Masih lancar kan ngomongnya?",
            options: ["Very Well!", "Dikit-dikit Bisa", "Masih Bingung", "Listeningnya Seru"],
            feedbacks: ["Awesome! Keep practicing every day. You are great! 🇬🇧🌟", "Pelan tapi pasti, yang penting jangan takut salah! 🗣️", "Wajar, bahasa asing emang butuh waktu. Coba dengerin lagu Inggris ya! 🎧", "Listening emang seru, melatih telinga biar makin peka! 👂"]
        },
        {
            question: "Pelajaran Agama tadi gimana? Udah dapet pencerahan buat minggu ini?",
            options: ["Dapet Banget", "Bikin Adem", "Diskusi Seru", "Sangat Fokus"],
            feedbacks: ["Alhamdulillah, semoga jadi berkah buat hari-hari ke depan! 🌙", "Adem banget, jadi semangat menjalani sekolah seminggu ini. ✨", "Diskusi tadi emang bikin kita makin paham nilai kehidupan. 🤝", "Fokus yang bagus! Bekal dunia akhirat nih. 🙏"]
        }
    ],
    2: [ // SELASA (PJOK, MTK, IPS, TIK)
        { 
            question: "Selasa Sporty & Logika! 🏀 Tadi habis olahraga (PJOK), lanjut MTK, IPS, sampe TIK. Gimana rasanya?", 
            options: ["Serunya PJOK", "MTK Menantang", "Materi IPS", "Pelajaran TIK"],
            feedbacks: ["Habis gerak pas olahraga pasti badan jadi seger banget ya! Sehat terus. ⚽👟", "MTK emang butuh logika tajam, tapi kalau ketemu jawabannya puas! 🔢📐", "Belajar IPS bikin kita makin tau fenomena sosial. Wawasan luas! 🌍🤝", "Dunia digital di tangan kalian! Belajar TIK itu bekal keren. 💻🖱️"]
        },
        {
            question: "Gimana sesi PJOK tadi? Udah ngerasa paling atletis belum?",
            options: ["Capek Tapi Senang", "Keringetan Parah", "Fisik Oke!", "Mainnya Seru"],
            feedbacks: ["Olahraga itu investasi buat masa tua. Mantap semangatnya! 💪", "Keringat itu bukti kamu udah gerak maksimal hari ini! 💦", "Pertahankan kondisi fisiknya biar gak gampang sakit pas ujian! 🏃‍♂️", "Keseruan bareng temen di lapangan emang gak ada duanya! 🏀"]
        },
        {
            question: "MTK hari ini gimana? Rumusnya udah masuk ke memori permanen?",
            options: ["Udah Dong!", "Masih di RAM", "Lagi Direstart", "Sulit Tapi Bisa"],
            feedbacks: ["Hebat! Calon insinyur atau akuntan masa depan nih. 📊", "Jangan lupa di-save ya biar gak ilang pas tugas! 💾", "Refresh dulu otaknya, nanti coba latihan soal lagi ya. 🔄", "Usaha gak bakal mengkhianati hasil. Terus berlatih! 📝"]
        },
        {
            question: "Tadi di lab komputer (TIK) bahas apa aja nih? Udah jago ngetik?",
            options: ["Coding Dikit", "Desain Grafis", "Office Aman", "Browsing Materi"],
            feedbacks: ["Keren! Skill teknologi itu sangat mahal di zaman sekarang. 💻", "Kreativitas tanpa batas! Hasil desainnya pasti kece. 🎨", "Skill dasar yang wajib banget dikuasai buat kerja nanti. 📁", "Gunakan internet buat hal positif ya, biar makin pinter! 🌐"]
        },
        {
            question: "IPS tadi seru gak bahas dunianya? Udah siap keliling global?",
            options: ["Siap Banget!", "Banyak Hafalan", "Peta Menarik", "Diskusi Sosial"],
            feedbacks: ["Global citizen! Semoga suatu saat bisa keliling dunia beneran. ✈️", "IPS emang banyak baca, tapi ceritanya asik buat diikuti! 📚", "Belajar baca peta biar gak tersesat di masa depan! 🗺️", "Memahami orang lain itu penting buat hidup bermasyarakat. 🤝"]
        }
    ],
    3: [ // RABU (BIND, BSUN, IPS, MTK)
        { 
            question: "Hari Rabu penuh bahasa & logika! Gimana tadi pelajaran Bahasa Sunda & MTK-nya?", 
            options: ["Sampurasun! Aman", "MTK Lanjut", "B. Indo Seru", "IPS Banyak Materi"],
            feedbacks: ["Rampes! Lestarikan budaya lokal lewat bahasa daerah ya! 📖✨", "Gas terus! Hari ini emang jatahnya asah otak buat hitung-hitungan. 💪📉", "Bahasa Indonesia penting buat nambah kosa kata kita! 🇮🇩📚", "Makin paham dong soal fenomena sosial di sekitar kita? 🗺️🤝"]
        },
        {
            question: "Basa Sunda tadi kumaha? Lancar ngomongna?",
            options: ["Lancar Pisan", "Agak Hese", "Seru Diajarna", "Ngamumule Budaya"],
            feedbacks: ["Alus pisan! Ulah poho kana basa sorangan nya. 🎭", "Teu nanaon, lalaunan we diajarna pasti bisa! 😊", "Diajar basa daerah teh emang loba pisan senina. ✨", "Mantap! Ieu teh jati diri urang sarerea. 📖"]
        },
        {
            question: "MTK sesi kedua di hari Rabu gimana? Masih semangat?",
            options: ["Masih!", "Mulai Lelah", "Seru Itungannya", "Butuh Snack"],
            feedbacks: ["Logikanya makin tajem nih kalau diasah tiap hari! 🧠", "Istirahat dulu, tarik napas biar otak gak panas. 🌬️", "Hitung-hitungan itu seni memecahkan masalah! 🔢", "Cemilan bisa nambah mood buat ngerjain soal lagi! 🍫"]
        },
        {
            question: "IPS hari ini bahas sejarah atau ekonomi nih? Seruan mana?",
            options: ["Sejarah Seru", "Ekonomi Menarik", "Dua-duanya Oke", "Lumayan Pusing"],
            feedbacks: ["Belajar dari masa lalu buat masa depan yang lebih baik! ⏳", "Penting banget biar pinter ngatur keuangan nantinya! 💰", "Wawasan yang lengkap bikin kamu makin bijak. 🌍", "Santai aja, dibaca pelan-pelan kayak baca novel. 📖"]
        },
        {
            question: "Gimana perasaan kamu di tengah minggu (Rabu) ini?",
            options: ["On Fire!", "Butuh Weekend", "Biasa Saja", "Semangat Terus"],
            feedbacks: ["Gaspol! Perjalanan menuju weekend tinggal dikit lagi. 🔥", "Sabar, dua hari lagi udah Jumat kok! 🗓️", "Tetep jaga kondisi ya biar tetep stabil sekolahnya. ⚖️", "Semangat itu energi yang gak boleh abis! ⚡"]
        }
    ],
    4: [ // KAMIS (IPA, PANCASILA, SBK)
        { 
            question: "Kamis Berwarna! 🧪 Dari IPA lanjut Pancasila terus SBK. Pelajaran apa yang paling berkesan?", 
            options: ["Pelajaran IPA", "Materi Pancasila", "Karya SBK", "Capek Tapi Seru"],
            feedbacks: ["Eksperimen IPA emang selalu bikin penasaran ya! Berasa jadi ilmuwan. 🧪🔬", "Makin paham soal nilai-nilai negara kita. Penting banget! 🇮🇩✨", "Waktunya keluarin jiwa seni! Hasil karyanya pasti keren. 🎨🎸", "Wajar capek, tapi tetep seru kan bisa bareng temen sekelas? ❤️"]
        },
        {
            question: "Pendidikan Pancasila tadi bahas apa? Udah hafal butir-butirnya?",
            options: ["Sangat Paham", "Lagi Dipelajari", "Seru Diskusinya", "Siap Mengamalkan"],
            feedbacks: ["Bagus! Jadi warga negara yang cerdas dan berkarakter. 🇮🇩", "Terus dibaca ya, itu dasar negara kita yang sangat hebat. ✨", "Diskusi soal negara emang gak ada abisnya dan seru! 🗣️", "Itu yang paling penting, dipraktekkan di kehidupan nyata! 👍"]
        },
        {
            question: "Seni Budaya (SBK) tadi bikin karya apa? Lagi gambar atau musik?",
            options: ["Lagi Menggambar", "Main Musik", "Teori Seni", "Bikin Kerajinan"],
            feedbacks: ["Ekspresikan dirimu lewat warna dan garis! Keren. 🎨", "Musik itu bahasa universal yang bikin jiwa tenang. 🎵", "Memahami keindahan itu butuh wawasan yang luas. 🖼️", "Tangan kreatif bakal menghasilkan karya yang berharga! 💎"]
        },
        {
            question: "Materi IPA tadi bahas tentang apa nih? Udah paham teorinya?",
            options: ["Biologi Seru", "Fisika Mantap", "Kimia Menarik", "Lagi Praktikum"],
            feedbacks: ["Memahami makhluk hidup bikin kita makin bersyukur! 🌱", "Logika fisika emang bikin dunia jadi masuk akal. ⚙️", "Dunia atom dan zat emang penuh keajaiban! ⚛️", "Praktikum itu cara paling asik buat belajar sains! 🧪"]
        },
        {
            question: "Gimana vibes kelas di hari Kamis ini? Udah pada wangi weekend?",
            options: ["Udah Kerasa", "Masih Fokus", "Mulai Ngantuk", "Happy Terus"],
            feedbacks: ["Satu hari lagi menuju Jumat Berkah! Semangat. ✨", "Fokus yang bagus, selesaikan tugas sebelum libur! 📝", "Cuci muka dulu biar segerrr lagi belajarnya! 💦", "Kegembiraan itu menular, bikin kelas makin asik! 😊"]
        }
    ],
    5: [ // JUMAT (YASINAN, JUMSIH, BING, BCRB)
        {
            question: "Tadi ada Jumsih (Jumat Bersih) atau Yasinan? Gimana suasananya?",
            options: ["Bersih Banget", "Sangat Khidmat", "Capek Bersih-bersih", "Damai Sekali"],
            feedbacks: ["Kebersihan itu sebagian dari iman. Kelas jadi nyaman! ✨", "Semoga berkah dan bikin hati jadi lebih tenang. 🙏", "Capeknya jadi pahala karena bikin lingkungan bersih! 💪", "Suasana yang damai bikin belajar makin fokus. 🕊️"]
        },
        {
            question: "B. Inggris di hari Jumat tadi gimana? Masih semangat?",
            options: ["Seru Banget", "Makin Paham", "Ngantuk Dikit", "Mantap Lah"],
            feedbacks: ["Belajar bahasa di akhir pekan bikin otak tetep aktif! 🇬🇧", "Ilmu baru buat bekal masa depan yang global. 🌍", "Kopi atau air putih dulu biar melek lagi! ☕", "Mantap! Persiapan buat istirahat panjang besok. 😎"]
        },
        {
            question: "Gimana rencana weekend kamu setelah seminggu sekolah?",
            options: ["Tidur Seharian", "Main Bareng Temen", "Nugas Lagi", "Jalan-jalan"],
            feedbacks: ["Recharge energi itu penting banget buat Senin besok! 💤", "Nikmati waktu bareng temen mumpung libur! 🤝", "Cicil dikit-dikit biar minggu malem gak begadang ya! 📝", "Have a safe trip! Nikmati udara segar di luar. 🚗"]
        },
        {
            question: "Pesan buat diri sendiri setelah perjuangan satu minggu ini?",
            options: ["Hebat Kamu!", "Ayo Lebih Baik", "Butuh Libur", "Tetap Bersyukur"],
            feedbacks: ["Self-reward itu perlu, kamu udah keren minggu ini! 🏆", "Setiap hari adalah kesempatan buat jadi lebih jago. 💪", "Weekend ini waktunya kamu istirahat total. 🛋️", "Bersyukur bikin apa yang kita kerjakan jadi berkah. ❤️"]
        }
    ]
};

module.exports = { QUIZ_BANK };
    
