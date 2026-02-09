/**
 * Simple i18n system for LokaClean
 */

import { useState, useEffect } from "react";

type Language = "id" | "en";

const translations = {
  id: {
    home: {
      hero: {
        titlePart1: "LokaClean - Solusi ",
        titleHighlight1: "Kebersihan",
        titlePart2: " Premium di ",
        titleHighlight2: "Lokasi",
        titlePart3: " Kamu",
        subtitle: "Gabungan sentuhan lokal Lombok dengan standar kebersihan modern. Kami datang, bersihkan, kamu tinggal santai.",
        feature1: { title: "Langsung ke Lokasi", desc: "Fleksibel & dekat" },
        feature2: { title: "Standar Profesional", desc: "Terstandar & aman" },
        feature3: { title: "Terpercaya", desc: "Lokal & Wisatawan" },
        ctaRegister: "Daftar Sekarang",
        ctaLogin: "Masuk"
      },
      packages: {
        title: "Pilihan Paket Terbaik",
        subtitle: "Pilih layanan kebersihan sesuai kebutuhan Anda."
      },
      premiumCTA: {
        badge: "Aplikasi Mobile LokaClean",
        title: {
          part1: "Upgrade ke",
          part2: "Pengalaman Premium"
        },
        description: "Login sekarang untuk kemudahan pemesanan & pelacakan lokasi. Atau install aplikasi untuk pengalaman yang lebih cepat dan praktis!",
        buttons: {
          login: "Login Member Web",
          install: "Install Aplikasi Mobile"
        },
        socialProof: "Telah digunakan oleh 1,000+ pengguna di Lombok"
      },
      header: {
        subtitle: "Layanan Kebersihan Premium"
      },
        userHero: {
          titlePart1: "Kebersihan",
          titleHighlight: "Profesional",
          titlePart2: "di Kuta Mandalika.",
          description: "Menggabungkan sentuhan lokal dengan standar modern. LokaClean hadir di Lombok untuk pertama kali sebagai inovasi baru untuk kenyamanan maksimal hunian Anda.",
          feature1: "Datang ke Lokasi",
          feature2: "Standar Pro",
          feature3: "Terpercaya"
        },
        userPackages: {
          eyebrow: "Koleksi Kami",
          title: "Pilihan Paket Spesial",
          viewAll: "Lihat Semua"
        },
        steps: {
          step1: { title: "Pilih Paket", desc: "Pilih layanan kebersihan sesuai kebutuhan Anda." },
          step2: { title: "Atur Jadwal", desc: "Tentukan waktu dan lokasi pembersihan." },
          step3: { title: "Bayar Aman", desc: "Lakukan pembayaran dengan metode aman." },
          step4: { title: "Terima Beres", desc: "Petugas kami datang, rumah Anda bersih!" }
        },
        userFeatures: {
        eyebrow: "Kenapa Pilih Kami",
        titleLine1: "Standar Hotel Bintang 5",
        titleLine2: "di Rumah Anda",
        guarantee: { title: "100% Garansi", desc: "Puas atau uang kembali" },
        trusted: { title: "Terpercaya", desc: "Lokal & Wisatawan" },
        equipment: { title: "Alat Lengkap", desc: "Chemical aman & premium" },
        location: { title: "Langsung ke Lokasi", desc: "Fleksibel & dekat" }
      },
      navbar: {
        login: "Masuk",
        register: "Daftar",
        home: "Beranda",
        packages: "Paket",
        newOrder: "Pesan",
        profile: "Profil"
      },
      featured: {
        newHome: {
          badge: "Baru",
          title: "Pembersihan Rumah Baru",
          desc: "Layanan deep cleaning menyeluruh untuk rumah baru atau pasca renovasi. Siap huni, bebas debu & bau cat.",
          cta: "Lihat Paket"
        }
      },
      howItWorks: {
        title: "Cara Kerja",
        subtitle: "Pesan layanan profesional dalam hitungan menit.",
        step1: { title: "Daftar", desc: "Daftar & lengkapi profilmu." },
        step2: { title: "Pesan", desc: "Pilih paket & jadwal." },
        step3: { title: "Verifikasi", desc: "Upload foto & pin lokasi." },
        step4: { title: "Nilai", desc: "Pantau, verifikasi & beri rating." }
      },
      services: {
        title: "Layanan Premium",
        subtitle: "Pilih paket kebersihan yang pas buat kamu."
      },
      testimonials: {
        title: "Kata Mereka",
        subtitle: "Dipercaya oleh turis, expat, dan pemilik villa di Kuta Mandalika.",
        item1: {
          name: "Jake & Friends",
          role: "Surfers dari Australia",
          text: "Habis surfing seharian di Tanjung Aan, balik ke homestay udah bersih total. Pasir-pasir di lantai hilang semua. LokaClean penyelamat anak pantai!"
        },
        item2: {
          name: "Sarah & Tom",
          role: "Honeymooners dari UK",
          text: "Kami sewa villa di bukit Kuta. Staff LokaClean sangat profesional, bahkan debu-debu konstruksi dari proyek sebelah hilang bersih. Sangat detail!"
        },
        item3: {
          name: "Elena Petrova",
          role: "Digital Nomad / Expat",
          text: "Tinggal 3 bulan di Kuta buat kerja remote. Kamar selalu rapi, wangi, dan WiFi tidak terganggu saat mereka bersih-bersih. Wajib buat long-stay!"
        },
        item4: {
          name: "Bli Komang",
          role: "Villa Manager",
          text: "Sangat terbantu untuk handle kebersihan saat high season. Tamu check-in selalu puas dengan kebersihan villa. Partner andalan!"
        }
      },
      footer: {
        tagline: "Kenyamanan Bersih, Sentuhan Pulau",
        description: "Layanan kebersihan profesional untuk rumah dan kantor Anda. Layanan berkualitas, keramahan khas pulau.",
        contactUs: "Hubungi Kami",
        followUs: "Ikuti Kami",
        socialText: "Tetap terhubung untuk update, tips, dan penawaran spesial.",
        rightsReserved: "Hak cipta dilindungi undang-undang.",
        privacyPolicy: "Kebijakan Privasi",
        termsOfService: "Syarat Layanan",
        hours: "Sen - Sab: 08.00 - 18.00"
      },
      mascot: {
        speech: "Siap Bersih-bersih? 🧹✨"
      },
      welcome: {
        title: "Tahap Pengembangan 🚧",
        desc: "Mohon maaf jika aplikasi belum maksimal, saat ini sedang dalam pengembangan awal."
      }
    },
    auth: {
        hero: {
          titlePart1: "Kenyamanan Bersih, ",
          titleHighlight: "Sentuhan Pulau.",
          subtitle: "Layanan kebersihan terbaik di Lombok, kini dalam genggaman. Profesional, asik, dan terpercaya.",
          trustedUsers: "Gabung sama 2000+ pengguna lain",
          joinRevolution: "Yuk Gabung ",
          revolutionHighlight: "Revolusi Kebersihan.",
          joinHappyCustomers: "Join ",
          happyCustomersHighlight: "2.000+ ",
          happyCustomers: "pelanggan happy"
        },
        login: {
          welcomeTitle: "Selamat Datang Kembali!",
          welcomeSubtitle: "Senang melihatmu lagi. Siap untuk ruangan yang bersih?",
          methodLabel: "PILIH METODE MASUK",
          emailLabel: "Alamat Email",
          emailPlaceholder: "contoh@email.com",
          whatsappLabel: "Nomor WhatsApp",
          whatsappPlaceholder: "0812...",
          passwordLabel: "Kata Sandi",
          forgotPassword: "Lupa kata sandi?",
          submitButton: "Masuk Sekarang",
          footerText: "Belum punya akun?",
          footerLink: "Daftar di sini",
          loading: "Sedang memproses..."
        },
        register: {
          title: "Daftar Akun Baru",
          subtitle: "Cuma butuh 1 menit buat mulai hidup lebih bersih dan nyaman.",
          fullNameLabel: "Nama Lengkap",
          fullNamePlaceholder: "Masukkan nama lengkapmu",
          emailLabel: "Alamat Email",
          emailPlaceholder: "contoh@email.com",
          whatsappLabel: "Nomor WhatsApp",
          whatsappPlaceholder: "0812...",
          passwordLabel: "Kata Sandi",
          confirmPasswordLabel: "Ulangi Kata Sandi",
          submitButton: "Daftar Sekarang",
          footerText: "Sudah punya akun?",
          footerLink: "Masuk di sini",
          loading: "Sedang memproses..."
        },
        validation: {
        emailRequired: "Eits, emailnya belum diisi nih!",
        emailInvalid: "Waduh, format emailnya agak aneh.",
        whatsappRequired: "Nomor WA wajib diisi biar gampang kontaknya.",
        whatsappInvalid: "Coba cek lagi nomornya, kawan.",
        whatsappInvalidFormat: "Nomornya unik nih, tapi coba format 0812... atau +62812... ya.",
        passwordRequired: "Passwordnya jangan lupa diisi.",
        passwordMin: "Minimal 6 karakter ya biar aman sentosa.",
        passwordMismatch: "Eh, passwordnya beda. Coba samain dulu.",
        nameRequired: "Kenalan dong, namanya siapa?",
        loginFailed: "Ups, kunci salah! Cek email/nomor atau passwordnya lagi ya.",
        emailRegistered: "Email ini udah ada yang punya. Coba yang lain atau langsung login aja.",
        phoneRegistered: "Nomor WA ini udah terdaftar. Coba login aja atau pakai nomor lain."
      }
    },
    // Complete Profile (Professional & Classy)
    completeProfile: {
      step2: "Langkah Terakhir",
      title: "Lengkapi Profil",
      subtitle: "Data Anda membantu kami memberikan layanan terbaik dan akurat.",
      completionStatus: "Kelengkapan Profil",
      profilePhoto: "Foto Profil",
      uploadPhotoHint: "Unggah foto yang jelas untuk identifikasi petugas.",
      photoSelected: "Foto Terpilih",
      personalInfo: "Informasi Pribadi",
      fullName: "Nama Lengkap",
      fullNamePlaceholder: "Contoh: Dian Sastro",
      phone: "Nomor WhatsApp",
      phonePlaceholder: "Contoh: 08123456789",
      defaultLocation: "Lokasi Utama",
      locationSubtitle: "Titik penjemputan atau layanan utama.",
      tapMapHint: "Ketuk peta untuk menandai lokasi",
      addressDetail: "Detail Alamat",
      addressPlaceholder: "Nama jalan, nomor rumah, blok, dll.",
      geocoding: "Mencari alamat...",
      saving: "Menyimpan Data...",
      save: "Simpan Profil",
      errorConnection: "Koneksi terputus.",
      tryAgain: "Coba Lagi",
      errorName: "Nama lengkap wajib diisi.",
      errorPhone: "Nomor WhatsApp wajib diisi.",
      errorPhoto: "Foto profil wajib diunggah.",
      errorLocation: "Lokasi wajib dipilih.",
      preparing: "Menyiapkan profil...",
      connectionIssue: "Masalah Koneksi",
      connectionIssueText: "Periksa koneksi internet Anda dan coba lagi.",
      tapToUpload: "Ketuk untuk unggah foto",
      mapHintOverlay: "Ketuk peta untuk pilih lokasi",
      addressDetailLabel: "Detail Alamat",
      completed: "Lengkap",
      optional: "Opsional",
      required: "Wajib Diisi",
      noteTitle: "Penting",
      noteSubtitle: "Info penting untuk Anda",
      noteAddress: "Alamat yang akurat memudahkan Anda saat melakukan pemesanan tanpa perlu input ulang.",
      notePhoto: "Foto profil membantu petugas kami mengenali Anda saat tiba di lokasi demi keamanan dan kenyamanan."
    },
    // Orders Page

      // Notifications
    notifications: {
      orderConfirmed: {
        title: "Pesanan Dikonfirmasi! 🎉",
        message: "Petugas OTW bro! Pesanan kamu sedang dalam proses. Ditunggu ya! 😊"
      },
      orderInProgress: {
        title: "Pesanan Sedang Diproses",
        message: "Petugas sudah sampai lokasi dan sedang membersihkan. Sabar ya bro! 🧹"
      },
      orderCompleted: {
        title: "Pesanan Selesai! ✅",
        message: "Pembersihan selesai! Jangan lupa kasih rating ya bro. Terima kasih! 🙏"
      },
      paymentPaid: {
        title: "Pembayaran Diterima",
        message: "Pembayaran kamu sudah diterima. Terima kasih sudah menggunakan LokaClean! 💰"
      },
      reminderUploadAfterPhoto: {
        title: "Yuk Upload Foto Setelah Pembersihan! 📸",
        message: "Halo! Pembersihan untuk pesanan {paketName} sudah selesai nih. Jangan lupa upload foto setelahnya ya! Review dan feedback kamu sangat membantu kami untuk terus memberikan pelayanan terbaik. Terima kasih banyak! 🙏✨"
      }
    },
    // Profile
    profile: {
      title: "Profile",
      yourProfile: "Profil Anda",
      subtitle: "Jaga detail Anda tetap akurat untuk operasi yang lebih lancar.",
      personalDetails: "Detail Pribadi",
      changePassword: "Ubah Kata Sandi",
      profilePhoto: "Foto Profil",
      defaultLocation: "Lokasi Default",
      fullName: "Nama Lengkap",
      phoneNumber: "Nomor Telepon",
      email: "Email",
      newPassword: "Kata Sandi Baru",
      confirmPassword: "Konfirmasi Kata Sandi",
      enterNewPassword: "Masukkan kata sandi baru",
      confirmNewPassword: "Konfirmasi kata sandi baru",
      passwordsDoNotMatch: "Kata sandi tidak cocok",
      uploadPhoto: "Upload Foto",
      clickToSelect: "Klik untuk memilih",
      locationHint: "Ini akan digunakan sebagai pin default saat membuat pesanan.",
      saveChanges: "Simpan Perubahan",
      saving: "Menyimpan...",
      profileUpdated: "Profil berhasil diperbarui! ✨",
      loadingProfile: "Memuat profil...",
      couldNotLoadProfile: "Tidak dapat memuat profil",
      passwordMinLength: "Kata sandi minimal 6 karakter",
      invalidPhoneNumber: "Nomor WhatsApp tidak valid. Contoh: +628123456789 atau 08123456789.",
      language: "Bahasa",
      selectLanguage: "Pilih Bahasa",
      indonesian: "Bahasa Indonesia",
      english: "English",
      save: "Simpan",
      saved: "Tersimpan!",
      settings: "Pengaturan"
      ,
      androidPromo: {
        title: "Install Aplikasi LokaClean",
        desc: "Lebih cepat, ringan, dan notifikasi real‑time.",
        cta: "Install Sekarang",
        dismiss: "Nanti saja",
        manualInstallTip: "Untuk Android: Buka menu browser (titik tiga) > 'Install App'.\n\nUntuk iPhone (iOS): Tekan tombol Share (kotak panah) > 'Tambahkan ke Layar Utama' (Add to Home Screen)."
      }
    },
    // Map
    map: {
      useMyLocation: "Gunakan lokasi saya",
      locating: "Mencari lokasi...",
      coordinates: "Koordinat",
      tipUseMyLocation: "Tip: Gunakan 'Gunakan lokasi saya' untuk mendapatkan akurasi GPS.",
      approxAddress: "Alamat perkiraan:",
      lookingUp: "Mencari...",
      openInOpenStreetMap: "Buka di OpenStreetMap",
      tapToSetLocation: "Ketuk peta untuk pilih lokasi",
      tipClickMap: "Tip: Anda dapat mengklik di mana saja pada peta untuk mengatur lokasi secara manual.",
      locationAccessIssue: "⚠️ Masalah akses lokasi:",
      quickSolution: "💡 Solusi Cepat:",
      quickSolutionText: "Anda dapat mengklik di mana saja pada peta di atas untuk mengatur lokasi secara manual. Ini bekerja secara instan tanpa perlu GPS!",
      dismiss: "Tutup",
      tryGpsAgain: "Coba GPS lagi",
      couldNotResolveAddress: "Tidak dapat menemukan alamat (periksa koneksi).",
      accuracy: "Akurasi:",
      accuracyLow: "Akurasi rendah (±{meters}). Untuk hasil terbaik, aktifkan GPS/Wi‑Fi atau sesuaikan pin pada peta.",
      locationRequiresHttps: "Lokasi memerlukan HTTPS (atau localhost) untuk bekerja.",
      geolocationNotSupported: "Geolokasi tidak didukung pada perangkat/browser ini.",
      permissionDenied: "Izin ditolak.",
      positionUnavailable: "Posisi tidak tersedia. Pastikan GPS diaktifkan (mobile) atau Wi‑Fi terhubung. Pindah ke area dengan sinyal lebih baik, atau klik pada peta untuk mengatur lokasi secara manual.",
      locationTimeout: "Permintaan lokasi habis waktu. Sinyal GPS mungkin lemah (coba pindah dekat jendela), jaringan mungkin lambat, atau Anda berada di dalam ruangan. Tip: Klik pada peta untuk mengatur lokasi secara manual untuk hasil yang lebih cepat.",
      couldNotGetLocation: "Tidak dapat mendapatkan lokasi Anda: {error}. Tip: Klik pada peta untuk mengatur lokasi secara manual.",
      dragMarkerToAdjust: "Geser pin untuk sesuaikan lokasi",
      saveAddress: {
        title: "Simpan Alamat",
        selectLabel: "Pilih Label Lokasi",
        label: "Label",
        customLabel: "Label Khusus",
        addressDetails: "Detail Alamat / Patokan",
        addressDetailsPlaceholder: "Contoh: Rumah pagar hitam, sebelah warung...",
        notes: "Detail Catatan untuk Petugas",
        notesPlaceholder: "Contoh: Kode pagar 1234, lantai 2...",
        simpleNotesPlaceholder: "Contoh: Pagar hitam, dekat warung...",
        photo: "Foto Gerbang/Rumah",
        photoPlaceholder: "Tempel link foto di sini...",
        save: "Simpan Alamat",
        cancel: "Batal",
        success: "Alamat berhasil disimpan",
        failed: "Gagal menyimpan alamat",
        primary: "Lokasi Utama",
        primaryBadge: "UTAMA",
        primaryDesc: "Ini akan menjadi alamat utama Anda",
        backup: "Lokasi Cadangan",
        backupDesc: "Simpan sebagai alamat alternatif",
        labels: {
          home: "Rumah",
          office: "Kantor",
          villa: "Villa",
          custom: "Lainnya"
        },
        villagePlaceholder: "Desa / Kelurahan",
        districtPlaceholder: "Kecamatan",
        deleteMainConfirm: "Hapus lokasi utama ini?",
        deleteMainFailed: "Gagal menghapus lokasi utama"
      },
      welcomeOverlay: "Selamat datang di NTB 🌴 Ketuk di mana saja untuk memilih lokasi.",
      deleteConfirm: "Hapus alamat ini?",
      deleteFailed: "Gagal menghapus alamat",
      savedLocations: "Lokasi Tersimpan",
      addBackup: "Tambah Cadangan",
      searchPlaceholder: "Cari alamat, desa, jalan...",
      searchCityPlaceholder: "Cari di {city}...",
      searchError: "Alamat tidak ditemukan. Coba kata kunci lain.",
      searchFailed: "Gagal mencari alamat",
      selectedPoint: "Titik Terpilih",
      loadingAddress: "Memuat alamat...",
      street: "Jalan",
      district: "Kecamatan",
      city: "Kota/Kabupaten",
      allRegions: "Semua Wilayah (NTB)",
      gpsError: "Gagal mengambil lokasi: {error}. Pastikan GPS aktif."
    },
    // Common
    common: {
      close: "Tutup",
      viewOrder: "Lihat Pesanan",
      markAsRead: "Tandai sudah dibaca",
      markAllAsRead: "Tandai semua sudah dibaca",
      noNotifications: "Tidak ada notifikasi",
      allCaughtUp: "Kamu sudah up to date!",
      notifications: "Notifikasi",
      loading: "Memuat...",
      error: "Terjadi kesalahan",
      save: "Simpan",
      cancel: "Batal",
      delete: "Hapus",
      edit: "Edit",
      back: "Kembali",
      next: "Selanjutnya",
      previous: "Sebelumnya",
      search: "Cari",
      filter: "Filter",
      sort: "Urutkan",
      actions: "Aksi",
      status: "Status",
      date: "Tanggal",
      time: "Waktu",
      price: "Harga",
      total: "Total",
      payment: "Pembayaran",
      location: "Lokasi",
      address: "Alamat",
      phone: "Telepon",
      email: "Email",
      name: "Nama",
      description: "Deskripsi",
      photo: "Foto",
      submit: "Kirim",
      confirm: "Konfirmasi",
      yes: "Ya",
      no: "Tidak",
      optional: "Opsional"
    },
    // Packages
    packages: {
      title: "Paket",
      subtitle: "Bersih • Cepat • Ramah • Profesional",
      newOrder: "Pesanan Baru",
      loading: "Memuat paket...",
      bookNow: "Pesan Sekarang",
      startingFrom: "Mulai dari",
      duration: "Durasi",
      features: "Fitur",
      popular: "Populer",
      save: "Hemat",
      noPackages: "Tidak ada paket tersedia",
      professional: "Profesional",
      fast: "Cepat",
      willAppearSoon: "Paket akan muncul di sini segera",
      detail: "Detail",
      premium: "Premium",
      feature: {
        bathroom: "Kamar Mandi",
        bedroom: "Area Tidur",
        floor: "Pembersihan Lantai",
        organizing: "Penataan Barang",
        kitchen: "Pembersihan Dapur",
        deepClean: "Pembersihan Menyeluruh",
        detailClean: "Pembersihan Detail"
      },
      guaranteed: "100% Dijamin",
      topRated: "Rating Tertinggi",
      description: "Deskripsi Paket",
      serviceFeatures: "Fitur Layanan",
      badges: {
        bestSeller: "TERLARIS",
        deepClean: "BERSIH TUNTAS",
        save: "HEMAT",
        premium: "PREMIUM",
        recommended: "REKOMENDASI",
        new: "TERBARU"
      }
    },
    // Orders
    orders: {
      title: "Pesanan Anda",
      subtitle: "Lacak status, foto, pembayaran, dan feedback.",
      loading: "Memuat pesanan...",
      noOrders: "Belum ada pesanan",
      createFirst: "Buat pesanan pertama Anda",
      orderNumber: "Pesanan",
      scheduledDate: "Tanggal Dijadwalkan",
      status: "Status",
      paymentStatus: "Status Pembayaran",
      viewDetails: "Lihat Detail",
      pending: "Menunggu",
      processing: "Diproses",
      inProgress: "Sedang Berlangsung",
      completed: "Selesai",
      paid: "Lunas",
      unpaid: "Belum Lunas",
      tabs: {
        all: "Semua",
        pending: "Belum Bayar",
        confirmed: "Dikonfirmasi",
        inProgress: "Diproses",
        rate: "Beri Nilai",
        completed: "Selesai",
        cancelled: "Dibatalkan"
      },
      empty: {
        title: "Belum ada pesanan",
        subtitle: "Yuk pesan layanan kebersihan sekarang!",
        action: "Pesan Sekarang"
      },
      card: {
        track: "Lacak",
        detail: "Detail",
        pay: "Bayar",
        rate: "Nilai",
        orderAgain: "Pesan Lagi"
      }
    },
    // New Order
    newOrder: {
      title: "Buat Pesanan",
      subtitle: "Upload foto sebelum pembersihan dan pesan layanan kebersihan kamu.",
      progress: "Progress",
      step1: "Langkah 1",
      step2: "Langkah 2",
      step3: "Langkah 3",
      selectPackage: "Pilih Paket",
      selectLocation: "Pilih Lokasi",
      uploadBeforePhoto: "Upload Foto Sebelum",
      selectPaymentMethod: "Pilih Metode Pembayaran",
      scheduleDate: "Jadwalkan Tanggal",
      selectedDay: "Hari terpilih",
      locationAndPhoto: "Lokasi & Foto Ruangan (Sebelum)",
      cash: "Tunai",
      midtrans: "Kartu Kredit/Debit",
      useDefaultLocation: "Gunakan Lokasi Default",
      createOrder: "Buat Pesanan",
      creating: "Sedang membuat pesanan...",
      processingPayment: "Sedang memproses pembayaran...",
      openingPayment: "Membuka pembayaran...",
      required: "Wajib diisi",
      invalidLocation: "Lokasi tidak valid",
      invalidPhoto: "Foto tidak valid",
      pleaseSelectPackage: "Pilih paket dulu ya",
      pleaseSelectLocation: "Pilih lokasi di peta dulu",
      pleaseUploadPhoto: "Upload foto sebelum pembersihan dulu ya",
      loadingUserData: "Mohon tunggu sebentar, sedang memuat data...",
      pleaseSelectPaymentMethod: "Pilih metode pembayaran dulu ya",
      paymentFailed: "Pembayaran gagal. Coba lagi ya atau pakai metode pembayaran lain.",
      failedToInitializePayment: "Gagal memproses pembayaran. Coba lagi ya.",
      orderSummary: "Ringkasan Pesanan",
      tipsForGoodPhoto: "Tips untuk foto yang baik",
      tip1: "Ambil foto seluruh ruangan dan area yang perlu dibersihkan",
      tip2: "Pastikan pencahayaannya cukup terang ya",
      tip3: "Satu foto yang jelas lebih baik daripada banyak foto yang buram",
      clickOrDragToUpload: "Klik atau seret foto ke sini untuk upload",
      dropYourPhotoHere: "Lepaskan foto kamu di sini",
      photoFormats: "PNG, JPG, atau JPEG (maks 5MB)",
      takePhoto: "Ambil Foto",
      chooseFromGallery: "Pilih dari Galeri",
      swipeHint: "Geser untuk melihat semua tanggal",
      capturePhoto: "Ambil",
      cameraAccessError: "Tidak dapat mengakses kamera. Silakan gunakan pilihan galeri.",
      selected: "Dipilih",
      usingDefaultLocationHint: "Menggunakan lokasi default yang tersimpan. Kamu bisa tap/klik peta untuk menyesuaikan lokasi pesanan ini.",
      addressPlaceholder: "Nama hotel, nomor kamar, jalan, dll.",
      duration: "menit",
      cashPaymentInfo: "Pembayaran <strong>tunai</strong> akan ditandai sebagai LUNAS oleh admin setelah layanan selesai.",
      nonCashPaymentInfo: "Pembayaran <strong>{method}</strong> diproses dengan aman via Midtrans. Kamu akan diarahkan untuk menyelesaikan pembayaran setelah membuat pesanan ya.",
      step1Title: "Pilih Layanan",
      step1Desc: "Sesuaikan dengan kebutuhan kebersihanmu",
      hygienicTools: "Peralatan Higienis",
      localStaff: "Staff Lokal Lombok",
      step2Title: "Atur Jadwal",
      step2Desc: "Pilih waktu kedatangan staff kami",
      selectDate: "Pilih Tanggal",
      selectTime: "Pilih Jam",
      scheduleNote: "✨ Jadwal fleksibel untuk turis! Kamu bisa mengubah jadwal maksimal 2 jam sebelum waktu kedatangan.",
      step3Title: "Lokasi & Detail",
      step3Desc: "Pastikan alamat dan foto sudah benar",
      locationPoint: "Titik Lokasi",
      infoLabel: "Info:",
      locationInfo: "Jika alamat sudah tepat, langkah ini boleh dilewati. Jika ingin mengubah, silakan pilih alamat lain di sini.",
      addressPlaceholderDetail: "Detail alamat (Contoh: Villa Sunset No. 8, pagar putih...)",
      roomPhoto: "Foto Ruangan (Opsional)",
      photoBtn: "Foto",
      paymentMethod: "Metode Pembayaran",
      cashPayment: "Tunai (Bayar di Tempat)",
      onlinePaymentMaintenance: "⚠️ Pembayaran online sedang maintenance",
      totalPayment: "Total Pembayaran",
      summaryPackage: "Paket",
      summarySchedule: "Jadwal",
      summaryLocation: "Lokasi",
      nextBtn: "Lanjut",
      orderNowBtn: "Pesan Sekarang",
      validationError: "Mohon lengkapi semua data pesanan."
    },
    // Order Detail
    orderDetail: {
      title: "Detail Pesanan",
      orderNumber: "Nomor Pesanan",
      package: "Paket",
      status: "Status",
      paymentStatus: "Status Pembayaran",
      scheduledDate: "Tanggal Dijadwalkan",
      location: "Lokasi",
      address: "Alamat",
      beforePhoto: "Foto Sebelum",
      afterPhoto: "Foto Sesudah",
      paymentMethod: "Metode Pembayaran",
      total: "Total",
      verifyCompletion: "Verifikasi Penyelesaian",
      verifying: "Memverifikasi...",
      markCompleted: "Tandai Selesai",
      loading: "Memuat pesanan...",
      couldNotLoad: "Tidak dapat memuat pesanan",
      backToOrders: "Kembali ke pesanan",
      orderHash: "Pesanan #",
      paymentLabel: "Pembayaran:",
      photos: "Foto",
      before: "Sebelum",
      after: "Sesudah",
      noPhoto: "Tidak ada foto",
      notUploadedYet: "Belum diupload",
      uploadAfterPhoto: "Upload foto sesudah",
      uploadAfterPhotoHint: "Upload foto setelah pembersihan selesai",
      selectAfterPhoto: "Pilih foto sesudah",
      uploading: "Mengupload...",
      afterPhotoRestriction: "Foto \"after\" hanya bisa di-upload minimal 5 menit setelah jam jadwal. Untuk pembayaran non-tunai, pastikan status pembayaran sudah PAID. Admin juga perlu mengkonfirmasi pesanan sampai status IN_PROGRESS.",
      scheduleAndPayment: "Jadwal & Pembayaran",
      scheduled: "Dijadwalkan",
      amount: "Jumlah",
      paymentStatusLabel: "Status Pembayaran",
      completeOrder: "Selesaikan Pesanan",
      giveTip: "Berikan Tip (Opsional)",
      tipTransparency: "Tip yang Anda berikan akan diteruskan kepada petugas untuk transparansi.",
      tipAmount: "Jumlah Tip (Rp)",
      saving: "Menyimpan...",
      saveTip: "Simpan Tip Rp {amount}",
      skipTip: "Lewati (Tanpa Tip)",
      yourTip: "Tip Anda",
      noTip: "Tidak ada tip (Rp 0)",
      tipForwarded: "Tip telah diteruskan kepada petugas untuk transparansi.",
      tipSkipped: "Anda memilih untuk tidak memberikan tip.",
      processing: "Memproses...",
      complete: "✓ Selesai",
      clickToComplete: "Klik untuk menyelesaikan pesanan",
      uploadAfterFirst: "Upload foto \"after\" terlebih dahulu untuk melanjutkan.",
      orderStatus: "Status Pesanan",
      currentStatus: "Status saat ini:",
      waitingAdmin: "Menunggu admin mengkonfirmasi dan menugaskan petugas.",
      ratingAndTip: "Rating & Tip",
      availableAfterCompletion: "Tersedia setelah penyelesaian.",
      yourRating: "Rating Anda: {value}/5",
      leaveRating: "Berikan Rating",
      ratingLabel: "Rating (1–5)",
      reviewOptional: "Ulasan (opsional)",
      reviewPlaceholder: "Ceritakan pengalaman Anda...",
      submitRating: "Kirim Rating",
      yourTipLabel: "Tip Anda: Rp {amount}",
      leaveTip: "Berikan Tip (Opsional)",
      tipAmountLabel: "Jumlah",
      submitTip: "Kirim Tip",
      completeFirst: "Selesaikan pesanan terlebih dahulu untuk mengirim rating/tip.",
      successTitle: "Pesanan Berhasil Dibuat 🎉",
      successSubtitle: "Staff kami sedang bersiap menuju lokasi Anda",
      cleanerOnWay: "Cleaner Menuju Lokasi",
      working: "Sedang berlangsung...",
      uploadCleaningResult: "Upload Hasil Pembersihan",
      chatCleaner: "Chat Cleaner",
      help: "Bantuan",
      orderAgain: "Pesan Lagi",
      paymentError: "Pembayaran gagal",
      statusSteps: {
         created: "Pesanan Dibuat",
         confirmed: "Jadwal Dikonfirmasi",
         cleanerOnWay: "Cleaner Menuju Lokasi",
         completed: "Selesai",
         waiting: "Menunggu Konfirmasi",
         inProgress: "Dalam Proses",
         cancelled: "Dibatalkan"
      },
      scheduleTime: "Waktu Jadwal",
      documentation: "Dokumentasi Pekerjaan",
      uploadResult: "Upload Hasil",
      notAvailable: "Belum tersedia",
      completedTitle: "Pesanan Selesai 🎉",
      completedSubtitle: "Terima kasih telah menggunakan LokaClean",
      cancelledTitle: "Pesanan Dibatalkan",
      cancelledSubtitle: "Silakan buat pesanan baru jika Anda berubah pikiran",
      inProgressTitle: "Cleaner Sedang Bekerja",
      inProgressSubtitle: "Mohon tunggu hasil kebersihan terbaik dari kami"
     },
     // Login
    login: {
      title: "Selamat Datang Kembali",
      subtitle: "Clean Comfort, Island Style",
      email: "Email",
      password: "Kata Sandi",
      login: "Masuk",
      loggingIn: "Masuk...",
      noAccount: "Belum punya akun?",
      register: "Daftar",
      forgotPassword: "Lupa kata sandi?",
      error: "Email atau kata sandi salah"
    },
    // Register
    register: {
      title: "Buat Akun Baru",
      subtitle: "Bergabung dengan LokaClean",
      fullName: "Nama Lengkap",
      email: "Email",
      password: "Kata Sandi",
      confirmPassword: "Konfirmasi Kata Sandi",
      register: "Daftar",
      registering: "Mendaftar...",
      haveAccount: "Sudah punya akun?",
      login: "Masuk",
      passwordMismatch: "Kata sandi tidak cocok",
      passwordTooShort: "Kata sandi minimal 6 karakter"
    },
    // Admin
    admin: {
      orders: "Pesanan",
      packages: "Paket",
      users: "Pengguna",
      revenue: "Pendapatan",
      login: "Masuk Admin",
      logout: "Keluar",
      dashboard: "Dashboard",
      confirmAssign: "Konfirmasi/Tugaskan Petugas/Karyawan",
      deleteOrder: "Hapus Pesanan",
      deleteConfirm: "Apakah Anda yakin ingin menghapus pesanan ini? Tindakan ini tidak dapat dibatalkan."
    },
    mobileWelcome: {
      premiumBadge: "PREMIUM",
      subtitle: "Gabungan sentuhan lokal Lombok dengan standar kebersihan modern.",
      ctaRegister: "Buat Akun Baru",
      ctaLogin: "Masuk ke Akun",
      features: {
        tracking: "Pelacakan Real-time",
        easy: "Pemesanan Mudah",
        promo: "Promo Eksklusif"
      },
      terms: {
        prefix: "Dengan masuk, Anda menyetujui",
        link: "Syarat & Ketentuan",
        suffix: "LokaClean."
      }
    }
  },
  en: {
    home: {
      hero: {
        titlePart1: "LokaClean - Premium ",
        titleHighlight1: "Cleaning Solution",
        titlePart2: " Right at Your",
        titleHighlight2: " Location",
        titlePart3: "",
        subtitle: "Combining Lombok's local touch with modern cleaning standards. We come, we clean, you just relax.",
        feature1: { title: "Straight to Location", desc: "Flexible & Close" },
        feature2: { title: "Professional Standard", desc: "Standardized & Safe" },
        feature3: { title: "Trusted", desc: "Locals & Tourists" },
        ctaRegister: "Register Now",
        ctaLogin: "Login"
      },
      packages: {
        title: "Best Package Selection",
        subtitle: "Choose cleaning service according to your needs."
      },
      premiumCTA: {
        badge: "LokaClean Mobile App",
        title: {
          part1: "Upgrade to",
          part2: "Premium Experience"
        },
        description: "Login now for easy booking & location tracking. Or install the app for a faster and more practical experience!",
        buttons: {
          login: "Login Member Web",
          install: "Install Mobile App"
        },
        socialProof: "Used by 1,000+ users in Lombok"
      },
      header: {
        subtitle: "Premium Cleaning Service"
      },
      userHero: {
        titlePart1: "Professional",
        titleHighlight: "Cleaning",
        titlePart2: "in Kuta Mandalika.",
        description: "Combining local touch with modern standards. LokaClean arrives in Lombok as a new innovation for your home's maximum comfort.",
        feature1: "We Come to You",
        feature2: "Pro Standards",
        feature3: "Trusted"
      },
      userPackages: {
        eyebrow: "Our Collection",
        title: "Premium Packages",
        viewAll: "View All"
      },
      steps: {
        step1: { title: "Select Package", desc: "Choose the service that fits your needs." },
        step2: { title: "Set Schedule", desc: "Pick a date and time that works for you." },
        step3: { title: "Secure Payment", desc: "Secure payment with various methods." },
        step4: { title: "Sit Back & Relax", desc: "Our team will handle the rest!" }
      },
      userFeatures: {
        eyebrow: "Why Choose Us",
        titleLine1: "5-Star Hotel Standard",
        titleLine2: "at Your Home",
        guarantee: { title: "100% Guarantee", desc: "Satisfaction or money back" },
        trusted: { title: "Trusted", desc: "Locals & Tourists" },
        equipment: { title: "Full Equipment", desc: "Safe & premium chemicals" },
        location: { title: "Straight to Location", desc: "Flexible & Close" }
      },
      navbar: {
        login: "Login",
        register: "Register",
        home: "Home",
        packages: "Package",
        newOrder: "New Order"
      },
      featured: {
        newHome: {
          badge: "New",
          title: "New Home Cleaning",
          desc: "Deep cleaning service for new or post-renovation homes. Move-in ready, dust-free & paint smell-free.",
          cta: "View Packages"
        }
      },
      howItWorks: {
        title: "How It Works",
        subtitle: "Book professional services in minutes.",
        step1: { title: "Register", desc: "Sign up & complete profile." },
        step2: { title: "Order", desc: "Choose package & schedule." },
        step3: { title: "Verify", desc: "Upload photo & pin location." },
        step4: { title: "Rate", desc: "Track, verify & rate." }
      },
      services: {
        title: "Premium Services",
        subtitle: "Choose the perfect cleaning package for you."
      },
      testimonials: {
        title: "Testimonials",
        subtitle: "Trusted by tourists, expats, and villa owners in Kuta Mandalika.",
        item1: {
          name: "Jake & Friends",
          role: "Surfers from Australia",
          text: "After surfing all day at Tanjung Aan, coming back to a spotless homestay is the best. No sand on the floor. LokaClean is a lifesaver!"
        },
        item2: {
          name: "Sarah & Tom",
          role: "Honeymooners from UK",
          text: "We rented a villa in Kuta hill. LokaClean staff were super professional, even construction dust from next door is gone. Very detailed!"
        },
        item3: {
          name: "Elena Petrova",
          role: "Digital Nomad / Expat",
          text: "Stayed 3 months in Kuta for remote work. Room always tidy, smells good, and WiFi not interrupted while they clean. Must-have for long-stays!"
        },
        item4: {
          name: "Bli Komang",
          role: "Villa Manager",
          text: "Really helpful for handling cleaning during high season. Guests checking in are always happy with villa cleanliness. Reliable partner!"
        }
      },
      footer: {
        tagline: "Clean Comfort, Island Style",
        description: "Professional cleaning services for your home and office. Quality service, island hospitality.",
        contactUs: "Contact Us",
        followUs: "Follow Us",
        socialText: "Stay connected for updates, tips, and special offers.",
        rightsReserved: "All rights reserved.",
        privacyPolicy: "Privacy Policy",
        termsOfService: "Terms of Service",
        hours: "Mon - Sat: 8:00 AM - 6:00 PM"
      },
      mascot: {
        speech: "Ready to Clean? 🧹✨"
      },
      welcome: {
        title: "Under Development 🚧",
        desc: "Please excuse any imperfections as we are currently in early development."
      },
      map: {
        useMyLocation: "Use my location",
        locating: "Locating...",
        coordinates: "Coordinates",
        tipUseMyLocation: "Tip: Use 'Use my location' for better GPS accuracy.",
        approxAddress: "Approx. Address:",
        lookingUp: "Looking up...",
        openInOpenStreetMap: "Open in OpenStreetMap",
        tapToSetLocation: "Tap map to set location",
        tipClickMap: "Tip: You can click anywhere on the map to set location manually.",
        locationAccessIssue: "⚠️ Location Access Issue:",
        quickSolution: "💡 Quick Solution:",
        quickSolutionText: "You can click anywhere on the map above to set your location manually. This works instantly without GPS!",
        dismiss: "Dismiss",
        tryGpsAgain: "Try GPS Again",
        couldNotResolveAddress: "Could not resolve address (check connection).",
        accuracy: "Accuracy:",
        accuracyLow: "Low accuracy (±{meters}m). For best results, enable GPS/Wi-Fi or adjust pin on map.",
        locationRequiresHttps: "Location requires HTTPS (or localhost) to work.",
        geolocationNotSupported: "Geolocation is not supported on this device/browser.",
        permissionDenied: "Permission denied.",
        positionUnavailable: "Position unavailable. Ensure GPS is on (mobile) or Wi-Fi connected. Move to better signal area, or click map to set location manually.",
        locationTimeout: "Location request timed out. GPS signal might be weak (try moving near a window), network slow, or you are indoors. Tip: Click map to set location manually for faster results.",
        couldNotGetLocation: "Could not get your location: {error}. Tip: Click map to set location manually.",
        dragMarkerToAdjust: "Drag marker to adjust location",
        saveAddress: {
          title: "Save Address",
          label: "Label",
          customLabel: "Custom Label",
          addressDetails: "Address Details / Landmark",
          addressDetailsPlaceholder: "E.g. Black gate, next to warung...",
          notes: "Detailed Notes for Staff",
          notesPlaceholder: "E.g. Gate code 1234, 2nd floor...",
        photo: "Gate/House Photo",
        photoPlaceholder: "Paste photo link here...",
        save: "Save Address",
          cancel: "Cancel",
          success: "Address saved successfully",
          failed: "Failed to save address",
          primary: "Main Location",
          primaryBadge: "Main",
          primaryDesc: "This will be your default address",
          backup: "Backup Location",
          backupDesc: "Save as an alternative address",
          labels: {
            home: "Home",
            office: "Office",
            villa: "Villa",
            custom: "Other"
          },
          villagePlaceholder: "Village",
          districtPlaceholder: "District"
        },
        welcomeOverlay: "Welcome to West Nusa Tenggara 🌴 Tap anywhere to choose your cleaning location.",
        deleteConfirm: "Delete this address?",
        deleteFailed: "Failed to delete address",
        deleteMainConfirm: "Delete main location?",
        deleteMainFailed: "Failed to delete location",
        savedLocations: "Saved Locations",
        addBackup: "Add Backup",
        searchPlaceholder: "Search address, village, street...",
        searchCityPlaceholder: "Search in {city}...",
        searchError: "Address not found. Try another keyword.",
        searchFailed: "Failed to search address",
        selectedPoint: "Selected Point",
        loadingAddress: "Loading address...",
        street: "Street",
        district: "District",
        city: "City/Regency",
        allRegions: "All Regions (NTB)",
        gpsError: "Failed to get location: {error}. Ensure GPS is active."
      }
    },
    // Auth
    auth: {
      hero: {
        titlePart1: "Clean Comfort, ",
        titleHighlight: "Island Style.",
        subtitle: "Top-tier cleaning in Lombok, right in your pocket. Professional, fun, and totally trusted.",
        trustedUsers: "Join 2,000+ happy locals & travelers",
        joinRevolution: "Join the ",
        revolutionHighlight: "Clean Revolution.",
        joinHappyCustomers: "Join ",
        happyCustomersHighlight: "2,000+ ",
        happyCustomers: "happy customers"
      },
      login: {
        welcomeTitle: "Welcome Back!",
        welcomeSubtitle: "Good to see you again. Ready for a clean room?",
        methodLabel: "CHOOSE LOGIN METHOD",
        emailLabel: "Email Address",
        emailPlaceholder: "example@email.com",
        whatsappLabel: "WhatsApp Number",
        whatsappPlaceholder: "+62 812...",
        passwordLabel: "Password",
        forgotPassword: "Forgot password?",
        submitButton: "Log In",
        footerText: "No account yet?",
        footerLink: "Register here",
        loading: "Logging in..."
      },
      register: {
        title: "Create Account",
        subtitle: "Sign up to start booking cleaning services.",
        fullNameLabel: "Full Name",
        fullNamePlaceholder: "Your name",
        emailLabel: "Email Address",
        emailPlaceholder: "example@email.com",
        whatsappLabel: "WhatsApp Number",
        whatsappPlaceholder: "+62...",
        passwordLabel: "Password",
        confirmPasswordLabel: "Confirm Password",
        submitButton: "Sign Up",
        footerText: "Have an account?",
        footerLink: "Log in here",
        loading: "Signing up..."
      },
      validation: {
        emailRequired: "Hey, we need your email!",
        emailInvalid: "Hmm, that email looks a bit off.",
        whatsappRequired: "WhatsApp is a must for easy contact.",
        whatsappInvalid: "Double-check that number, friend.",
        whatsappInvalidFormat: "Number looks unique! Try 0812... or +62812...",
        passwordRequired: "Don't forget the secret code (password)!",
        passwordMin: "At least 6 chars to keep it safe.",
        passwordMismatch: "Passwords don't match. Try again!",
        nameRequired: "Don't be shy, what's your name?",
        loginFailed: "Oops, wrong key! Check your email/number or password.",
        emailRegistered: "This email is already part of the fam. Try another or login.",
        phoneRegistered: "This WhatsApp number is already registered. Try logging in or use another number."
      }
    },
    // Complete Profile (Professional & Classy)
    completeProfile: {
      step2: "Final Step",
      title: "Complete Your Profile",
      subtitle: "Your data helps us provide accurate and secure service.",
      completionStatus: "Profile Completion",
      profilePhoto: "Profile Photo",
      uploadPhotoHint: "Upload a clear photo for staff identification.",
      photoSelected: "Photo Selected",
      personalInfo: "Personal Information",
      fullName: "Full Name",
      fullNamePlaceholder: "e.g. John Doe",
      phone: "WhatsApp Number",
      phonePlaceholder: "e.g. +628123456789",
      defaultLocation: "Main Location",
      locationSubtitle: "Main pickup or service point.",
      tapMapHint: "Tap map to pin location",
      addressDetail: "Address Details",
      addressPlaceholder: "Street name, house number, block, etc.",
      geocoding: "Finding address...",
      saving: "Saving Data...",
      save: "Save Profile",
      errorConnection: "Connection lost.",
      tryAgain: "Try Again",
      errorName: "Full name is required.",
      errorPhone: "WhatsApp number is required.",
      errorPhoto: "Profile photo is required.",
      errorLocation: "Location is required.",
      preparing: "Preparing profile...",
      connectionIssue: "Connection Issue",
      connectionIssueText: "Check your internet connection and try again.",
      tapToUpload: "Tap to upload photo",
      mapHintOverlay: "Tap map to select location",
      addressDetailLabel: "Address Detail",
      addressHelp: "Add details to help staff find the location (e.g., fence color, landmarks).",
      completed: "Completed",
      optional: "Optional",
      required: "Required",
      noteTitle: "Important",
      noteSubtitle: "Important info for you",
      noteAddress: "Accurate address helps you book orders easily without re-entering details.",
      notePhoto: "Profile photo helps our staff recognize you upon arrival for security and convenience."
    },
    // Notifications
    notifications: {
      orderConfirmed: {
        title: "Order Confirmed! 🎉",
        message: "Staff is on the way! Your order is being processed. Please wait! 😊"
      },
      orderInProgress: {
        title: "Order In Progress",
        message: "Staff has arrived and is cleaning. Please be patient! 🧹"
      },
      orderCompleted: {
        title: "Order Completed! ✅",
        message: "Cleaning is done! Don't forget to rate us. Thank you! 🙏"
      },
      paymentPaid: {
        title: "Payment Received",
        message: "Your payment has been received. Thank you for using LokaClean! 💰"
      },
      reminderUploadAfterPhoto: {
        title: "Hey! Upload Your After Photo! 📸",
        message: "Hi there! The cleaning for order {paketName} is complete. Don't forget to upload the after photo! Your review and feedback really help us keep improving our service. Thank you so much! 🙏✨"
      }
    },
    // Profile
    profile: {
      title: "Profile",
      yourProfile: "Your Profile",
      subtitle: "Keep your details accurate for smoother operations.",
      personalDetails: "Personal Details",
      changePassword: "Change Password",
      profilePhoto: "Profile Photo",
      defaultLocation: "Default Location",
      fullName: "Full Name",
      phoneNumber: "Phone Number",
      email: "Email",
      newPassword: "New Password",
      confirmPassword: "Confirm Password",
      enterNewPassword: "Enter new password",
      confirmNewPassword: "Confirm new password",
      passwordsDoNotMatch: "Passwords do not match",
      uploadPhoto: "Upload Photo",
      clickToSelect: "Click to select",
      locationHint: "This will be used as the default pin when creating orders.",
      saveChanges: "Save Changes",
      saving: "Saving...",
      profileUpdated: "Profile updated successfully! ✨",
      loadingProfile: "Loading profile...",
      couldNotLoadProfile: "Could not load profile",
      passwordMinLength: "Password must be at least 6 characters long",
      invalidPhoneNumber: "Invalid WhatsApp number. Example: +628123456789 or 08123456789.",
      language: "Language",
      selectLanguage: "Select Language",
      indonesian: "Indonesian",
      english: "English",
      save: "Save",
      saved: "Saved!",
      settings: "Settings"
      ,
      androidPromo: {
        title: "Install LokaClean App",
        desc: "Faster, lighter, with real‑time notifications.",
        cta: "Install Now",
        dismiss: "Maybe later",
        manualInstallTip: "For Android: Open browser menu (three dots) > 'Install App'.\n\nFor iPhone (iOS): Tap Share button > 'Add to Home Screen'."
      }
    },
    // Map
    map: {
      useMyLocation: "Use my location",
      locating: "Locating...",
      coordinates: "Coordinates",
      tipUseMyLocation: "Tip: Use 'Use my location' to get GPS accuracy.",
      approxAddress: "Approx. address:",
      lookingUp: "Looking up…",
      openInOpenStreetMap: "Open in OpenStreetMap",
      tapToSetLocation: "Tap/click the map to set the location.",
      tipClickMap: "Tip: You can click anywhere on the map to set your location manually.",
      locationAccessIssue: "⚠️ Location access issue:",
      quickSolution: "💡 Quick Solution:",
      quickSolutionText: "You can click anywhere on the map above to set your location manually. This works instantly without needing GPS!",
      dismiss: "Dismiss",
      tryGpsAgain: "Try GPS again",
      couldNotResolveAddress: "Could not resolve address (check connection).",
      accuracy: "Accuracy:",
      accuracyLow: "Accuracy is low (±{meters}). For best results, turn on GPS/Wi‑Fi or adjust the pin on the map.",
      locationRequiresHttps: "Location requires HTTPS (or localhost) to work.",
      geolocationNotSupported: "Geolocation is not supported on this device/browser.",
      permissionDenied: "Permission denied.",
      positionUnavailable: "Position unavailable. Ensure GPS is enabled (mobile) or Wi‑Fi is connected. Move to an area with better signal, or click on the map to set location manually.",
      locationTimeout: "Location request timed out. GPS signal may be weak (try moving near a window), network may be slow, or you're indoors. Tip: Click on the map to set your location manually for faster results.",
      couldNotGetLocation: "Could not get your location: {error}. Tip: Click on the map to set your location manually.",
      dragMarkerToAdjust: "Drag marker to adjust location",
      saveAddress: {
        title: "Save Address",
        selectLabel: "Select Location Label",
        label: "Label",
        customLabel: "Custom Label",
        addressDetails: "Address Details / Landmark",
        addressDetailsPlaceholder: "Example: Black gate house, next to shop...",
        notes: "Notes for Staff",
        notesPlaceholder: "Example: Gate code 1234, 2nd floor...",
        simpleNotesPlaceholder: "Example: Black fence, near shop...",
        photo: "Gate/House Photo",
        photoPlaceholder: "Paste photo link here...",
        save: "Save Address",
        cancel: "Cancel",
        success: "Address saved successfully",
        failed: "Failed to save address",
        primary: "Primary Location",
        primaryBadge: "PRIMARY",
        primaryDesc: "This will be your main address",
        backup: "Backup Location",
        backupDesc: "Save as alternative address",
        deleteMainConfirm: "Delete this main location?",
        deleteMainFailed: "Failed to delete main location",
        labels: {
          home: "Home",
          office: "Office",
          villa: "Villa",
          custom: "Custom"
        },
        villagePlaceholder: "Village",
        districtPlaceholder: "District"
      },
      welcomeOverlay: "Welcome to NTB 🌴 Tap anywhere to pick a location.",
      deleteConfirm: "Delete this address?",
      deleteFailed: "Failed to delete address",
      savedLocations: "Saved Locations",
      addBackup: "Add Backup",
      searchPlaceholder: "Search address, village, street...",
      searchCityPlaceholder: "Search in {city}...",
      searchError: "Address not found. Try another keyword.",
      searchFailed: "Failed to search address",
      selectedPoint: "Selected Point",
      loadingAddress: "Loading address...",
      street: "Street",
      district: "District",
      city: "City/Regency",
      allRegions: "All Regions (NTB)",
      gpsError: "Failed to get location: {error}. Ensure GPS is active."
    },
    // Common
    common: {
      close: "Close",
      viewOrder: "View Order",
      markAsRead: "Mark as read",
      markAllAsRead: "Mark all as read",
      noNotifications: "No notifications",
      allCaughtUp: "You're all caught up!",
      notifications: "Notifications",
      loading: "Loading...",
      error: "An error occurred",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      back: "Back",
      next: "Next",
      previous: "Previous",
      search: "Search",
      filter: "Filter",
      sort: "Sort",
      actions: "Actions",
      status: "Status",
      date: "Date",
      time: "Time",
      price: "Price",
      total: "Total",
      payment: "Payment",
      location: "Location",
      address: "Address",
      phone: "Phone",
      email: "Email",
      name: "Name",
      description: "Description",
      photo: "Photo",
      submit: "Submit",
      confirm: "Confirm",
      yes: "Yes",
      no: "No",
      optional: "Optional"
    },
    // Packages
    packages: {
      title: "Package",
      subtitle: "Clean • Fast • Friendly • Professional",
      newOrder: "New Order",
      loading: "Loading packages...",
      bookNow: "Book Now",
      startingFrom: "Starting from",
      duration: "Duration",
      features: "Features",
      popular: "Popular",
      save: "Save",
      noPackages: "No packages available",
      professional: "Professional",
      fast: "Fast",
      willAppearSoon: "Packages will appear here soon",
      detail: "Detail",
      premium: "Premium",
      feature: {
        bathroom: "Bathroom",
        bedroom: "Bedroom",
        floor: "Floor Cleaning",
        organizing: "Organizing",
        kitchen: "Kitchen Cleaning",
        deepClean: "Deep Cleaning",
        detailClean: "Detail Cleaning"
      },
      guaranteed: "100% Guaranteed",
      topRated: "Top Rated",
      description: "Package Description",
      serviceFeatures: "Service Features",
      badges: {
        bestSeller: "BEST SELLER",
        deepClean: "DEEP CLEAN",
        save: "SAVER",
        premium: "PREMIUM",
        recommended: "RECOMMENDED",
        new: "NEW"
      }
    },
    // Orders
    orders: {
      title: "Your Orders",
      subtitle: "Track status, photos, payments, and feedback.",
      loading: "Loading orders...",
      noOrders: "No orders yet",
      createFirst: "Create your first order",
      orderNumber: "Order",
      scheduledDate: "Scheduled Date",
      status: "Status",
      paymentStatus: "Payment Status",
      viewDetails: "View Details",
      pending: "Pending",
      processing: "Processing",
      inProgress: "In Progress",
      completed: "Completed",
      paid: "Paid",
      unpaid: "Unpaid",
      tabs: {
        all: "All",
        pending: "Unpaid",
        confirmed: "Confirmed",
        inProgress: "In Progress",
        rate: "To Rate",
        completed: "Completed",
        cancelled: "Cancelled"
      },
      empty: {
        title: "No orders yet",
        subtitle: "Let's book a cleaning service now!",
        action: "Book Now"
      },
      card: {
        track: "Track",
        detail: "Detail",
        pay: "Pay",
        rate: "Rate",
        orderAgain: "Order Again"
      }
    },
    // New Order
    newOrder: {
      title: "Create Order",
      subtitle: "Upload a before photo and book your cleaning.",
      progress: "Progress",
      step1: "Step 1",
      step2: "Step 2",
      step3: "Step 3",
      selectPackage: "Select Package",
      selectLocation: "Select Location",
      uploadBeforePhoto: "Upload Before Photo",
      selectPaymentMethod: "Select Payment Method",
      scheduleDate: "Schedule Date",
      selectedDay: "Selected day",
      locationAndPhoto: "Location & Room Photo (Before)",
      cash: "Cash",
      midtrans: "Credit/Debit Card",
      useDefaultLocation: "Use Default Location",
      createOrder: "Create Order",
      creating: "Creating your order...",
      processingPayment: "Processing payment...",
      openingPayment: "Opening payment...",
      required: "Required",
      invalidLocation: "Invalid location",
      invalidPhoto: "Invalid photo",
      pleaseSelectPackage: "Please select a package first",
      pleaseSelectLocation: "Please select location on the map",
      pleaseUploadPhoto: "Please upload a before photo",
      loadingUserData: "Please wait, loading user data...",
      pleaseSelectPaymentMethod: "Please select a payment method first",
      paymentFailed: "Payment failed. Please try again or use another payment method.",
      failedToInitializePayment: "Failed to initialize payment. Please try again.",
      orderSummary: "Order Summary",
      tipsForGoodPhoto: "Tips for a good photo",
      tip1: "Capture the entire room and visible mess.",
      tip2: "Make sure lighting is adequate.",
      tip3: "One clear photo is better than many blurry ones.",
      clickOrDragToUpload: "Click or drag to upload",
      dropYourPhotoHere: "Drop your photo here",
      photoFormats: "PNG, JPG, or JPEG (max 5MB)",
      takePhoto: "Take Photo",
      chooseFromGallery: "Choose from Gallery",
      swipeHint: "Swipe to see all available dates",
      capturePhoto: "Capture",
      cameraAccessError: "Cannot access camera. Please use gallery option.",
      selected: "Selected",
      usingDefaultLocationHint: "Using saved default location. You can tap/click the map to adjust for this order.",
      addressPlaceholder: "Hotel name, room number, street, etc.",
      duration: "min",
      cashPaymentInfo: "<strong>Cash</strong> payments will be marked as PAID by admin after service completion.",
      nonCashPaymentInfo: "<strong>{method}</strong> payments are processed securely via Midtrans. You'll be redirected to complete payment after creating your order.",
      step1Title: "Select Service",
      step1Desc: "Customize your cleaning needs",
      hygienicTools: "Hygienic Tools",
      localStaff: "Local Lombok Staff",
      step2Title: "Set Schedule",
      step2Desc: "Choose arrival time for our staff",
      selectDate: "Select Date",
      selectTime: "Select Time",
      scheduleNote: "✨ Flexible schedule for tourists! You can change schedule up to 2 hours before arrival.",
      step3Title: "Location & Details",
      step3Desc: "Ensure address and photo are correct",
      locationPoint: "Location Point",
      infoLabel: "Info:",
      locationInfo: "If the address is correct, you can skip this step. To change, please select another address here.",
      addressPlaceholderDetail: "Address details (E.g. Villa Sunset No. 8, white fence...)",
      roomPhoto: "Room Photo (Optional)",
      photoBtn: "Photo",
      paymentMethod: "Payment Method",
      cashPayment: "Cash (Pay on Site)",
      onlinePaymentMaintenance: "⚠️ Online payment is under maintenance",
      totalPayment: "Total Payment",
      summaryPackage: "Package",
      summarySchedule: "Schedule",
      summaryLocation: "Location",
      nextBtn: "Next",
      orderNowBtn: "Order Now",
      validationError: "Please complete all order data."
    },
    // Order Detail
    orderDetail: {
      title: "Order Details",
      orderNumber: "Order Number",
      package: "Package",
      status: "Status",
      paymentStatus: "Payment Status",
      scheduledDate: "Scheduled Date",
      location: "Location",
      address: "Address",
      beforePhoto: "Before Photo",
      afterPhoto: "After Photo",
      paymentMethod: "Payment Method",
      total: "Total",
      verifyCompletion: "Verify Completion",
      verifying: "Verifying...",
      markCompleted: "Mark Completed",
      loading: "Loading order...",
      couldNotLoad: "Could not load order",
      backToOrders: "Back to orders",
      orderHash: "Order #",
      paymentLabel: "Payment:",
      photos: "Photos",
      before: "Before",
      after: "After",
      noPhoto: "No photo",
      notUploadedYet: "Not uploaded yet",
      uploadAfterPhoto: "Upload after photo",
      uploadAfterPhotoHint: "Upload photo after cleaning is complete",
      selectAfterPhoto: "Select after photo",
      uploading: "Uploading...",
      afterPhotoRestriction: "After photo can only be uploaded at least 5 minutes after the scheduled time. For non-cash payments, payment status must be PAID. Admin also needs to confirm the order so its status becomes IN_PROGRESS.",
      scheduleAndPayment: "Schedule & payment",
      scheduled: "Scheduled",
      amount: "Amount",
      paymentStatusLabel: "Payment status",
      completeOrder: "Complete Order",
      giveTip: "Give Tip (Optional)",
      tipTransparency: "The tip you give will be forwarded to the staff for transparency.",
      tipAmount: "Tip Amount (Rp)",
      saving: "Saving...",
      saveTip: "Save Tip Rp {amount}",
      skipTip: "Skip (No Tip)",
      yourTip: "Your Tip",
      noTip: "No tip (Rp 0)",
      tipForwarded: "Tip has been forwarded to the staff for transparency.",
      tipSkipped: "You chose not to give a tip.",
      processing: "Processing...",
      complete: "✓ Complete",
      clickToComplete: "Click to complete the order",
      uploadAfterFirst: "Upload \"after\" photo first to continue.",
      orderStatus: "Order Status",
      currentStatus: "Current status:",
      waitingAdmin: "Waiting for admin to confirm and assign staff.",
      ratingAndTip: "Rating & tip",
      availableAfterCompletion: "Available after completion.",
      yourRating: "Your rating: {value}/5",
      leaveRating: "Leave a rating",
      ratingLabel: "Rating (1–5)",
      reviewOptional: "Review (optional)",
      reviewPlaceholder: "Tell us how it went...",
      submitRating: "Submit rating",
      yourTipLabel: "Your tip: Rp {amount}",
      leaveTip: "Leave a tip (optional)",
      tipAmountLabel: "Amount",
      submitTip: "Submit tip",
      completeFirst: "Complete the order first to submit rating/tip.",
      successTitle: "Order Created Successfully 🎉",
      successSubtitle: "Our staff is getting ready to head to your location",
      cleanerOnWay: "Cleaner on the Way",
      working: "Work in progress...",
      uploadCleaningResult: "Upload Cleaning Result",
      chatCleaner: "Chat Cleaner",
      help: "Help",
      orderAgain: "Order Again",
      paymentError: "Payment failed",
      statusSteps: {
         created: "Order Created",
         confirmed: "Schedule Confirmed",
         cleanerOnWay: "Cleaner on the Way",
         completed: "Completed",
         waiting: "Waiting for Confirmation",
         inProgress: "In Progress",
         cancelled: "Cancelled"
      },
      scheduleTime: "Schedule Time",
      documentation: "Job Documentation",
      uploadResult: "Upload Result",
      notAvailable: "Not available",
      completedTitle: "Order Completed 🎉",
      completedSubtitle: "Thank you for using LokaClean",
      cancelledTitle: "Order Cancelled",
      cancelledSubtitle: "Please place a new order if you change your mind",
      inProgressTitle: "Cleaner is Working",
      inProgressSubtitle: "Please wait for our best cleaning results"
     },
 
     // Admin
    admin: {
      orders: "Orders",
      packages: "Packages",
      users: "Users",
      revenue: "Revenue",
      login: "Admin Login",
      logout: "Logout",
      dashboard: "Dashboard",
      confirmAssign: "Confirm/Assign Staff/Employee",
      deleteOrder: "Delete Order",
      deleteConfirm: "Are you sure you want to delete this order? This action cannot be undone."
    },
    mobileWelcome: {
      premiumBadge: "PREMIUM",
      subtitle: "Combining Lombok's local touch with modern cleaning standards.",
      ctaRegister: "Create New Account",
      ctaLogin: "Login to Account",
      features: {
        tracking: "Real-time Tracking",
        easy: "Easy Booking",
        promo: "Exclusive Promos"
      },
      terms: {
        prefix: "By logging in, you agree to LokaClean's",
        link: "Terms & Conditions",
        suffix: "."
      }
    }
  }
};

const STORAGE_KEY = "lokaclean_language_v2";

export function getLanguage(): Language {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(STORAGE_KEY);
  return (stored === "en" || stored === "id") ? stored : "en";
}

export function setLanguage(lang: Language): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, lang);
  window.dispatchEvent(new Event("languagechange"));
}

export function t(key: string): string {
  const lang = getLanguage();
  const keys = key.split(".");
  let value: unknown = translations[lang];

  for (const k of keys) {
    if (value && typeof value === "object" && k in (value as Record<string, unknown>)) {
      value = (value as Record<string, unknown>)[k];
    } else {
      value = translations.id;
      for (const k2 of keys) {
        if (value && typeof value === "object" && k2 in (value as Record<string, unknown>)) {
          value = (value as Record<string, unknown>)[k2];
        } else {
          value = undefined;
          break;
        }
      }
      break;
    }
  }

  return typeof value === "string" ? value : key;
}

export function getNotificationMessage(notificationTitle: string, notificationMessage: string): { title: string; message: string } {
  const lang = getLanguage();
  
  // Check if it's an order confirmation notification
  if (notificationTitle.toLowerCase().includes("dikonfirmasi") || notificationTitle.toLowerCase().includes("confirmed")) {
    return translations[lang].notifications.orderConfirmed;
  }
  
  // Check if it's an in progress notification
  if (notificationTitle.toLowerCase().includes("proses") || notificationTitle.toLowerCase().includes("progress")) {
    return translations[lang].notifications.orderInProgress;
  }
  
  // Check if it's a completed notification
  if (notificationTitle.toLowerCase().includes("selesai") || notificationTitle.toLowerCase().includes("completed")) {
    return translations[lang].notifications.orderCompleted;
  }
  
  // Check if it's a payment notification
  if (notificationTitle.toLowerCase().includes("pembayaran") || notificationTitle.toLowerCase().includes("payment")) {
    return translations[lang].notifications.paymentPaid;
  }
  
  // Return original if no match
  return { title: notificationTitle, message: notificationMessage };
}

export function useCurrentLanguage(): Language {
  const [lang, setLang] = useState<Language>(getLanguage());

  useEffect(() => {
    const handleLanguageChange = () => setLang(getLanguage());
    window.addEventListener("languagechange", handleLanguageChange);
    return () => window.removeEventListener("languagechange", handleLanguageChange);
  }, []);

  return lang;
}

