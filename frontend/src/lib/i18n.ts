/**
 * Simple i18n system for LokaClean
 */

type Language = "id" | "en";

const translations = {
  id: {
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
      tapToSetLocation: "Ketuk/klik peta untuk mengatur lokasi.",
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
      couldNotGetLocation: "Tidak dapat mendapatkan lokasi Anda: {error}. Tip: Klik pada peta untuk mengatur lokasi secara manual."
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
      no: "Tidak"
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
      serviceFeatures: "Fitur Layanan"
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
      unpaid: "Belum Lunas"
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
      capturePhoto: "Ambil",
      cameraAccessError: "Tidak dapat mengakses kamera. Silakan gunakan pilihan galeri.",
      selected: "Dipilih",
      usingDefaultLocationHint: "Menggunakan lokasi default yang tersimpan. Kamu bisa tap/klik peta untuk menyesuaikan lokasi pesanan ini.",
      addressPlaceholder: "Nama hotel, nomor kamar, jalan, dll.",
      duration: "menit",
      cashPaymentInfo: "Pembayaran <strong>tunai</strong> akan ditandai sebagai LUNAS oleh admin setelah layanan selesai.",
      nonCashPaymentInfo: "Pembayaran <strong>{method}</strong> diproses dengan aman via Midtrans. Kamu akan diarahkan untuk menyelesaikan pembayaran setelah membuat pesanan ya."
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
      afterPhotoRestriction: "Foto \"after\" hanya bisa di-upload setelah admin mengkonfirmasi dan status order menjadi IN_PROGRESS.",
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
      completeFirst: "Selesaikan pesanan terlebih dahulu untuk mengirim rating/tip."
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
    }
  },
  en: {
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
      couldNotGetLocation: "Could not get your location: {error}. Tip: Click on the map to set your location manually."
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
      no: "No"
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
      serviceFeatures: "Service Features"
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
      unpaid: "Unpaid"
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
      capturePhoto: "Capture",
      cameraAccessError: "Cannot access camera. Please use gallery option.",
      selected: "Selected",
      usingDefaultLocationHint: "Using saved default location. You can tap/click the map to adjust for this order.",
      addressPlaceholder: "Hotel name, room number, street, etc.",
      duration: "min",
      cashPaymentInfo: "<strong>Cash</strong> payments will be marked as PAID by admin after service completion.",
      nonCashPaymentInfo: "<strong>{method}</strong> payments are processed securely via Midtrans. You'll be redirected to complete payment after creating your order."
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
      afterPhotoRestriction: "After photo can only be uploaded after admin confirms and order status becomes IN_PROGRESS.",
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
      completeFirst: "Complete the order first to submit rating/tip."
    },
    // Login
    login: {
      title: "Welcome back",
      subtitle: "Clean Comfort, Island Style",
      email: "Email",
      password: "Password",
      login: "Login",
      loggingIn: "Logging in...",
      noAccount: "Don't have an account?",
      register: "Register",
      forgotPassword: "Forgot password?",
      error: "Invalid email or password"
    },
    // Register
    register: {
      title: "Create New Account",
      subtitle: "Join LokaClean",
      fullName: "Full Name",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      register: "Register",
      registering: "Registering...",
      haveAccount: "Already have an account?",
      login: "Login",
      passwordMismatch: "Passwords do not match",
      passwordTooShort: "Password must be at least 6 characters"
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
    }
  }
};

const STORAGE_KEY = "lokaclean_language";

export function getLanguage(): Language {
  if (typeof window === "undefined") return "id";
  const stored = localStorage.getItem(STORAGE_KEY);
  return (stored === "en" || stored === "id") ? stored : "id";
}

export function setLanguage(lang: Language): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, lang);
  window.dispatchEvent(new Event("languagechange"));
}

export function t(key: string): string {
  const lang = getLanguage();
  const keys = key.split(".");
  let value: any = translations[lang];
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      // Fallback to Indonesian if key not found
      value = translations.id;
      for (const k2 of keys) {
        value = value?.[k2];
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

