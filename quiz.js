// quiz.js - VERSI FINAL: SOAL BANYAK & RANDOM (ACAK)
// Berdasarkan Jadwal SMPN 4 Kota Cirebon Ramadhan 1447 H

const QUIZ_BANK = {
    // --- PERIODE FEBRUARI ---
    
    "16-21 Februari": [ // Libur Imlek & Belajar Mandiri
        { 
            question: "📅 [Februari] Lagi masa Belajar Mandiri nih. Apa fokus utamamu di rumah hari ini?", 
            options: ["Review Materi TKA", "Bantu Orang Tua", "Kegiatan Masjid", "Istirahat"],
            feedbacks: ["Bagus! Persiapan mandiri bikin kamu selangkah lebih maju.", "Keren, membantu keluarga adalah bagian dari belajar karakter!", "Mantap, menjaga silaturahmi dengan tetangga itu penting.", "Jaga kesehatan ya, jadwal minggu depan bakal padat!"]
        },
        { 
            question: "🏮 Kemarin habis libur Imlek, gimana perasaanmu memulai kegiatan mandiri?", 
            options: ["Semangat Baru", "Masih Ngantuk", "Biasa Saja", "Siap Tempur"],
            feedbacks: ["Energi positif! Gunakan buat cicil materi yang sulit.", "Yuk bangun! Dikit lagi kamu bakal menghadapi Simulasi TKA.", "Tetap stabil ya, jangan lupa pantau info dari sekolah.", "Ini baru pejuang kelas 9! Gaspol!"]
        },
        {
            question: "🏠 Belajar di lingkungan keluarga (18-21 Feb) itu asiknya karena...",
            options: ["Waktunya Fleksibel", "Dekat Orang Tua", "Bisa Sambil Ibadah", "Gak Perlu Seragam"],
            feedbacks: ["Tapi tetap disiplin ya, jangan kebablasan santainya!", "Minta doa restu orang tua juga biar ujiannya lancar.", "Suasana rumah yang tenang emang pas buat tadarus.", "Tetap rapi dan fokus ya biar ilmunya berkah!"]
        }
    ],

    "24-26 Februari": [ // Simulasi TKA
        { 
            question: "📝 [Simulasi TKA] Hari ini jadwal simulasi. Apa hal teknis yang paling kamu perhatikan?", 
            options: ["Koneksi Internet", "Login & Password", "Waktu Pengerjaan", "Kesiapan Laptop"],
            feedbacks: ["Penting! Pastikan sinyal stabil biar gak keputus di tengah jalan.", "Jangan sampai lupa ya, kalau bingung langsung tanya proktor.", "Manajemen waktu adalah kunci biar semua soal terbaca.", "Cek baterai juga ya kalau pakai laptop sendiri!"]
        },
        { 
            question: "🤔 Ketemu soal yang sulit pas simulasi TKA tadi? Apa tindakanmu?", 
            options: ["Lewati Dulu", "Tebak Saja", "Pikir Sampai Bisa", "Tandai Ragu-ragu"],
            feedbacks: ["Strategi cerdas! Kerjakan yang mudah dulu baru balik lagi.", "Boleh, daripada kosong. Tapi usahakan eliminasi jawaban salah dulu.", "Jangan kelamaan di satu soal ya, nanti waktu habis!", "Gunakan fitur ragu-ragu kalau sistemnya menyediakan!"]
        }
    ],

    // --- PERIODE MARET ---

    "27 Februari - 4 Maret": [ // Pesantren Kilat Kelas 9
        { 
            question: "🌙 [Sanlat Kls 9] Lagi jadwal Sanlat nih. Materi apa yang paling bikin kamu 'adem'?", 
            options: ["Kajian Akhlak", "Tata Cara Shalat", "Kisah Nabi", "Tadarus Bareng"],
            feedbacks: ["Akhlak mulia adalah identitas siswa SMPN 4 yang sukses.", "Biar ibadah kita makin sempurna di bulan Ramadhan ini.", "Banyak pelajaran hidup yang bisa diambil dari perjuangan Nabi.", "Suasana tenang pas ngaji bareng temen itu mahal harganya."]
        },
        { 
            question: "✨ Pas kamu Sanlat, kelas lain tetap KBM biasa. Gimana perasaanmu?", 
            options: ["Beruntung Banget", "Fokus Ibadah", "Kangen Belajar", "Nikmati Saja"],
            feedbacks: ["Gunakan waktu ini buat 'recharge' mental kamu ya!", "Masya Allah, semoga puasanya makin berkah dengan ilmu baru.", "Sabar, nanti juga bakal balik belajar buat persiapan TKA.", "Bener, nikmati kedamaian di masjid sekolah bareng temen."]
        }
    ],

    "9-14 Maret": [ // Gladi Bersih TKA
        { 
            question: "💻 [Gladi Bersih] Gladi bersih TKA dimulai! Sudah cek Web TKA hari ini?", 
            options: ["Sudah Update", "Lagi Loading", "Lupa Alamatnya", "Nunggu Info WA"],
            feedbacks: ["Mantap! Mandiri cek info adalah ciri siswa siap lulus.", "Sabar ya, mungkin server lagi banyak yang akses.", "Cek di grup kelas atau tanya wali kelas ya, linknya penting!", "Bagus, tapi tetap harus verifikasi sendiri di web resminya ya."]
        },
        { 
            question: "🎯 Gladi bersih bertujuan agar pas hari-H kamu...", 
            options: ["Gak Grogi", "Paham Teknis", "Soal Terbayang", "Semua Benar"],
            feedbacks: ["Latihan mental itu penting banget buat kelas 9!", "Biar gak bingung lagi klik sana-sini pas ujian beneran.", "Gambaran tipe soal biasanya mirip-mirip nih pola pengerjaannya.", "Tepat! Ini adalah simulasi final sebelum perang sesungguhnya!"]
        }
    ],

    "16-27 Maret": [ // Libur Idul Fitri (Dibuat Banyak & Random)
        { 
            question: "🎉 [Lebaran] Selamat Idul Fitri! Apa hidangan wajib yang harus ada di piringmu?", 
            options: ["Opor Ayam", "Ketupat Sayur", "Rendang Daging", "Kue Kering"],
            feedbacks: ["Klasik! Lebaran gak lengkap tanpa kuah kuning opor.", "Ketupat dan sambal goreng itu kombinasi maut!", "Wah, selera kelas berat nih! Enak banget!", "Nastar atau kastengel? Hati-hati jangan dihabisin sendiri ya!"]
        },
        { 
            question: "🌙 Momen lebaran paling asik itu pas...", 
            options: ["Sungkeman", "Ketemu Saudara", "Dapet THR", "Baju Baru"],
            feedbacks: ["Hati jadi bersih lagi setelah saling memaafkan.", "Rame-rame cerita pengalaman setahun terakhir, seru!", "Alhamdulillah, bisa buat tabungan masa depan atau jajan!", "Tampil beda dan segar di hari kemenangan. Keren!"]
        },
        { 
            question: "📅 Libur sampai tanggal 27 Maret. Gimana caramu menjaga semangat belajar?", 
            options: ["Baca Buku Dikit", "Gak Belajar Sama Sekali", "Nugas Santai", "Diskusi di Grup"],
            feedbacks: ["Bagus, biar otak gak 'kaku' pas masuk sekolah nanti.", "Gak apa-apa, namanya juga liburan. Puas-puasin istirahat!", "Cicil dikit-dikit biar pas masuk gak numpuk tugasnya.", "Seru nih, lebaran sambil sharing ilmu bareng temen."]
        }
    ],

    "30 Maret": [ // Awal Masuk
        { 
            question: "🎒 [30 Maret] Hari pertama masuk! Apa target terbesarmu di sisa semester ini?", 
            options: ["Lulus Nilai Bagus", "Masuk SMA Impian", "Makin Rajin", "Bahagiain Ortu"],
            feedbacks: ["Ayo gaspol! Sisa waktu harus dimanfaatkan maksimal.", "Kejar terus! SMPN 4 Cirebon bangga punya pejuang sepertimu.", "Disiplin adalah kunci utama alumni sukses.", "Ibadah dan belajar yang rajin adalah kado terbaik buat mereka."]
        }
    ]
};

// FUNGSI UNTUK MENGAMBIL SOAL SECARA ACAK (LOGIKA RANDOM)
function getRandomQuiz(dateKey) {
    const questions = QUIZ_BANK[dateKey];
    if (questions) {
        const randomIndex = Math.floor(Math.random() * questions.length);
        return questions[randomIndex];
    }
    return null;
}

module.exports = { QUIZ_BANK, getRandomQuiz };
                        
