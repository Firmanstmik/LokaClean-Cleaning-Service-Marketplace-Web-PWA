import { Helmet } from "react-helmet-async";
import type React from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import { ArrowRight, MapPin, Star, Shield, Clock } from "lucide-react";

type PageConfig = {
  title: string;
  h1: string;
  desc: string;
  content: React.ReactNode;
};

const PAGES: Record<string, PageConfig> = {
  "/jasa-kebersihan-lombok": {
    title: "Jasa Kebersihan Lombok Terpercaya | LokaClean",
    h1: "Jasa Kebersihan Lombok Profesional & Terpercaya",
    desc: "Layanan jasa kebersihan di Lombok untuk rumah, villa, dan kantor. Tim profesional, alat lengkap, dan harga transparan. Pesan LokaClean sekarang.",
    content: (
      <>
        <p className="mb-4">
          Mencari <strong>jasa kebersihan Lombok</strong> yang terpercaya dan berkualitas? LokaClean hadir sebagai solusi utama kebutuhan kebersihan properti Anda di seluruh wilayah Lombok, khususnya Lombok Tengah dan sekitarnya. Kami memahami bahwa kebersihan adalah kunci kenyamanan dan kesehatan, baik untuk hunian pribadi maupun properti komersial seperti villa dan homestay.
        </p>
        <p className="mb-4">
          Tim LokaClean terdiri dari tenaga kerja profesional yang telah terlatih dengan standar hospitality. Kami tidak hanya membersihkan, tetapi juga merawat properti Anda. Layanan kami mencakup pembersihan menyeluruh (deep cleaning), pembersihan harian (daily cleaning), hingga penanganan khusus untuk pasca-renovasi.
        </p>
        <h3 className="text-xl font-bold text-slate-800 mt-6 mb-3">Mengapa Memilih Jasa Kebersihan Lombok LokaClean?</h3>
        <ul className="list-disc pl-5 mb-6 space-y-2">
          <li><strong>Tenaga Terlatih:</strong> Staff kami melewati proses seleksi dan pelatihan ketat.</li>
          <li><strong>Peralatan Lengkap:</strong> Kami membawa peralatan dan bahan pembersih sendiri.</li>
          <li><strong>Harga Transparan:</strong> Tidak ada biaya tersembunyi, semua tercantum di aplikasi.</li>
          <li><strong>Bergaransi:</strong> Kepuasan pelanggan adalah prioritas utama kami.</li>
        </ul>
        <p className="mb-4">
          Sebagai penyedia <em>cleaning service Lombok</em> terdepan, kami melayani berbagai area termasuk Lombok Barat, Mataram, Praya, Rembitan, dan fokus utama kami di kawasan pariwisata Mandalika. Jangan biarkan debu dan kotoran mengganggu kenyamanan Anda. Percayakan kebersihan hunian Anda kepada ahlinya.
        </p>
        <p>
          Download aplikasi LokaClean sekarang dan nikmati kemudahan memesan jasa kebersihan di Lombok dalam genggaman Anda. Bersih, wangi, dan rapi kini hanya sejauh satu klik.
        </p>
      </>
    )
  },
  "/cleaning-service-mandalika": {
    title: "Cleaning Service Mandalika Kuta | LokaClean",
    h1: "Cleaning Service Mandalika Terbaik untuk Villa & Hotel",
    desc: "Jasa cleaning service di Kuta Mandalika. Spesialis kebersihan villa, homestay, dan hotel. Standar kebersihan internasional. Booking online.",
    content: (
      <>
        <p className="mb-4">
          Kawasan Kuta Mandalika kini menjadi primadona pariwisata Indonesia. Seiring dengan menjamurnya villa, homestay, dan penginapan, kebutuhan akan <strong>cleaning service Mandalika</strong> yang berkualitas semakin meningkat. LokaClean hadir untuk menjawab tantangan tersebut dengan layanan kebersihan standar internasional.
        </p>
        <p className="mb-4">
          Kami mengkhususkan diri dalam melayani properti di area Kuta Mandalika, Rembitan, hingga Lombok Barat dan Mataram. LokaClean mengerti standar tinggi yang diharapkan oleh wisatawan mancanegara dan domestik. Oleh karena itu, SOP (Standar Operasional Prosedur) kami dirancang menyerupai housekeeping hotel berbintang.
        </p>
        <h3 className="text-xl font-bold text-slate-800 mt-6 mb-3">Layanan Unggulan Kami di Mandalika</h3>
        <p className="mb-4">
          Selain pembersihan harian, kami menawarkan paket khusus untuk villa management:
        </p>
        <ul className="list-disc pl-5 mb-6 space-y-2">
          <li><strong>Turnover Cleaning:</strong> Pembersihan cepat dan detail saat pergantian tamu (check-in/check-out).</li>
          <li><strong>Deep Cleaning Berkala:</strong> Pembersihan mendalam untuk menjaga aset properti agar awet.</li>
          <li><strong>Pool & Garden:</strong> Layanan tambahan untuk menjaga keasrian lingkungan villa.</li>
        </ul>
        <p className="mb-4">
          Jangan ambil risiko dengan kebersihan properti investasi Anda. Reputasi villa Anda di Airbnb atau Booking.com sangat bergantung pada ulasan kebersihan. Dengan menggunakan <em>cleaning service Mandalika</em> dari LokaClean, Anda memastikan tamu mendapatkan pengalaman menginap terbaik.
        </p>
        <p>
          Hubungi kami atau pesan langsung via aplikasi LokaClean untuk menjadwalkan layanan kebersihan villa Anda hari ini.
        </p>
      </>
    )
  },
  "/villa-cleaning-kuta": {
    title: "Villa Cleaning Kuta Lombok | LokaClean",
    h1: "Jasa Villa Cleaning Kuta Lombok Standar Hotel",
    desc: "Spesialis jasa pembersih villa di Kuta Lombok. Housekeeping harian, deep cleaning, dan perawatan kolam renang. Mitra terbaik pemilik villa.",
    content: (
      <>
        <p className="mb-4">
          Memiliki villa di Kuta Lombok adalah investasi yang menguntungkan, namun perawatannya bisa menjadi tantangan tersendiri. LokaClean menawarkan layanan <strong>villa cleaning Kuta</strong> yang dirancang khusus untuk membantu pemilik villa menjaga aset mereka tetap dalam kondisi prima.
        </p>
        <p className="mb-4">
          Layanan kami fleksibel, mulai dari panggilan harian hingga kontrak bulanan. Kami memahami bahwa setiap villa memiliki karakteristik unik, mulai dari material lantai, jenis furnitur, hingga area outdoor yang luas. Staff kami dilatih untuk menangani berbagai jenis permukaan dan material dengan chemical yang tepat agar tidak merusak.
        </p>
        <h3 className="text-xl font-bold text-slate-800 mt-6 mb-3">Solusi Lengkap Kebersihan Villa</h3>
        <p className="mb-4">
          LokaClean bukan sekadar tukang bersih-bersih biasa. Kami adalah mitra housekeeping Anda. Layanan <em>villa cleaning Kuta</em> kami mencakup:
        </p>
        <ul className="list-disc pl-5 mb-6 space-y-2">
          <li>Pembersihan kamar tidur dan penggantian linen.</li>
          <li>Sanitasi kamar mandi dan toilet secara menyeluruh.</li>
          <li>Pembersihan dapur, kulkas, dan peralatan makan.</li>
          <li>Penyapuan dan pel area teras serta balkon.</li>
        </ul>
        <p className="mb-4">
          Kami juga menyediakan laporan foto "Before & After" melalui aplikasi, sehingga Anda dapat memantau hasil kerja kami dari mana saja, bahkan jika Anda sedang berada di luar pulau atau luar negeri. Transparansi dan kualitas adalah jaminan kami.
        </p>
        <p>
          Optimalkan rating villa Anda dengan kebersihan yang terjaga. Pesan LokaClean sekarang.
        </p>
      </>
    )
  },
  "/home-cleaning-lombok": {
    title: "Home Cleaning Lombok Service | LokaClean",
    h1: "Home Cleaning Lombok: Bersih, Cepat, Terjangkau",
    desc: "Layanan home cleaning panggilan di Lombok. Bersihkan rumah, kos, dan apartemen. Harga hemat, hasil memikat. Pesan via aplikasi.",
    content: (
      <>
        <p className="mb-4">
          Kesibukan sehari-hari seringkali membuat kita tidak sempat membersihkan rumah. Tumpukan debu, lantai lengket, dan kamar mandi kotor bisa menjadi sumber penyakit dan stres. LokaClean menghadirkan layanan <strong>home cleaning Lombok</strong> untuk mengembalikan kenyamanan hunian Anda.
        </p>
        <p className="mb-4">
          Layanan kami cocok untuk rumah tinggal, rumah kontrakan, hingga kamar kos mahasiswa. Dengan harga yang kompetitif, Anda mendapatkan layanan kebersihan setara hotel. Kami melayani area Lombok Tengah (Praya, Kuta), Lombok Barat, Mataram, Rembitan, dan sekitarnya dengan respon cepat.
        </p>
        <h3 className="text-xl font-bold text-slate-800 mt-6 mb-3">Paket Home Cleaning Favorit</h3>
        <p className="mb-4">
          Kami menyediakan berbagai opsi paket yang bisa disesuaikan dengan kebutuhan Anda:
        </p>
        <ul className="list-disc pl-5 mb-6 space-y-2">
          <li><strong>General Cleaning:</strong> Sapu, pel, lap debu, dan merapikan ruangan.</li>
          <li><strong>Kamar Mandi Deep Clean:</strong> Membersihkan kerak membandel di lantai dan dinding kamar mandi.</li>
          <li><strong>Pindah Rumah:</strong> Pembersihan total sebelum Anda menempati rumah baru atau meninggalkan rumah lama.</li>
        </ul>
        <p className="mb-4">
          Mengapa repot membersihkan sendiri jika ada ahlinya? Hemat waktu dan tenaga Anda untuk hal yang lebih produktif. Tim <em>home cleaning Lombok</em> LokaClean siap datang ke lokasi Anda lengkap dengan peralatan. Anda cukup duduk manis dan menikmati hasilnya.
        </p>
        <p>
          Segera download aplikasi LokaClean dan jadwalkan pembersihan rumah Anda hari ini!
        </p>
      </>
    )
  }
};

export function SEOPage() {
  const location = useLocation();
  const path = location.pathname;
  const config = PAGES[path];

  if (!config) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-600">
      <Helmet>
        <title>{config.title}</title>
        <meta name="description" content={config.desc} />
        <link rel="canonical" href={`https://lokaclean.com${path}`} />
      </Helmet>

      {/* Navbar Minimal */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
             <img src="/img/logo.jpg" alt="LokaClean Logo" className="h-8 w-8 rounded-lg" />
             <span className="font-bold text-lg text-slate-900">LokaClean</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900">Login</Link>
            <Link to="/register" className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors">
              Pesan Sekarang
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold mb-6">
            <Star className="w-3 h-3 fill-current" />
            Jasa Kebersihan No. 1 di Lombok
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 mb-6 leading-tight">
            {config.h1}
          </h1>
          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            {config.desc}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <article className="prose prose-slate prose-lg mx-auto">
          {config.content}
        </article>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 my-12 not-prose">
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <Shield className="w-8 h-8 text-emerald-600 mb-3" />
            <h3 className="font-bold text-slate-900 mb-1">Terpercaya</h3>
            <p className="text-sm text-slate-500">Mitra resmi dengan verifikasi ketat.</p>
          </div>
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <Clock className="w-8 h-8 text-emerald-600 mb-3" />
            <h3 className="font-bold text-slate-900 mb-1">Tepat Waktu</h3>
            <p className="text-sm text-slate-500">Jadwal fleksibel sesuai kebutuhan Anda.</p>
          </div>
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <MapPin className="w-8 h-8 text-emerald-600 mb-3" />
            <h3 className="font-bold text-slate-900 mb-1">Lokasi Luas</h3>
            <p className="text-sm text-slate-500">Melayani Kuta, Praya, Mataram, & Lombok Barat.</p>
          </div>
        </div>

        {/* CTA Box */}
        <div className="mt-12 p-8 bg-slate-900 rounded-3xl text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-600/20 mix-blend-overlay"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-4">Siap Membersihkan Properti Anda?</h2>
            <p className="text-slate-300 mb-8 max-w-lg mx-auto">
              Dapatkan penawaran terbaik dan layanan berkualitas standar hotel sekarang juga.
            </p>
            <Link 
              to="/register" 
              className="inline-flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-xl font-bold hover:bg-emerald-50 transition-transform hover:scale-105"
            >
              Booking Sekarang <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer Simple */}
      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        <div className="max-w-7xl mx-auto px-4">
          <p>&copy; {new Date().getFullYear()} LokaClean Mandalika. All rights reserved.</p>
          <div className="mt-4 flex justify-center gap-4">
            <Link to="/" className="hover:text-slate-600">Home</Link>
            <Link to="/packages" className="hover:text-slate-600">Layanan</Link>
            <Link to="/login" className="hover:text-slate-600">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
