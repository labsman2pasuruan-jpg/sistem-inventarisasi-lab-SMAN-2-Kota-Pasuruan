import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  History, 
  ArrowLeftRight, 
  LogOut, 
  Menu, 
  AlertTriangle,
  ChevronRight,
  FileText,
  Home as HomeIcon,
  Box,
  ClipboardList,
  Settings as SettingsIcon,
  Image as ImageIcon,
  Search,
  Plus,
  CheckCircle,
  Filter,
  Save,
  Printer,
  Trash2,
  ShoppingCart,
  ArrowRight,
  Pencil,
  X,
  File,
  ExternalLink,
  Check,
  AlertCircle,
  RefreshCw,
  Scan,
  QrCode,
  ArrowUpRight,
  ArrowDownLeft,
  ClipboardCheck
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const getGoogleDriveImageUrl = (url: string) => {
  if (!url) return '';
  if (url.includes('drive.google.com')) {
    const fileId = url.match(/\/d\/([^/]+)/)?.[1] || url.match(/id=([^&]+)/)?.[1];
    if (fileId) {
      // lh3.googleusercontent.com format is generally more reliable for direct display
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }
  return url;
};

const APP_LOGO_URL = getGoogleDriveImageUrl(import.meta.env.VITE_APP_LOGO_URL || 'https://drive.google.com/file/d/1uh_BI1OQLgxbNY4JKadu0dI4cybkGVJp/view?usp=sharing');
const APP_BG_URL = getGoogleDriveImageUrl(import.meta.env.VITE_APP_BG_URL || 'https://drive.google.com/file/d/18U-sQJxoID4TzzEovhrvL_vMgy7zebq-/view?usp=sharing');

interface CategoryThreshold {
  category: string;
  min_stock: number;
}

interface Settings {
  logo_url: string;
  bg_url: string;
  category_thresholds?: CategoryThreshold[];
}

const SettingsContext = createContext<{ 
  settings: Settings; 
  updateSettings: (newSettings: Settings) => Promise<void>; 
  refreshSettings: () => void;
}>({
  settings: { logo_url: '', bg_url: '' },
  updateSettings: async () => {},
  refreshSettings: () => {}
});

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface User {
  id: number;
  username: string;
  role: string;
}

interface Item {
  item_code: string;
  name: string;
  category: string;
  total_stock: number;
  current_stock: number;
  unit: string;
  location: string;
  min_stock: number;
  image_url?: string;
}

interface TransactionHistory {
  id: number;
  item_code: string;
  item_name: string;
  username: string;
  person_name: string;
  type: 'pinjam' | 'kembali';
  quantity: number;
  timestamp: string;
}

// --- Components ---

const LoginPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const { settings } = useContext(SettingsContext);
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        if (password !== confirmPassword) {
          setError('Konfirmasi password tidak cocok');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, role: 'user' }),
        });

        const result = await res.json();
        if (res.ok) {
          onLogin(result);
          navigate('/home');
        } else {
          setError(result.error || 'Gagal registrasi');
        }
      } else {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        const result = await res.json();
        if (res.ok) {
          if (result.status === 'pending' && result.role !== 'admin') {
            setError('Akun Anda sedang menunggu persetujuan admin.');
            setLoading(false);
            return;
          }
          onLogin(result);
          navigate('/home');
        } else {
          setError(result.error || 'Username atau password salah');
        }
      }
    } catch (err) {
      setError('Koneksi sistem bermasalah. Pastikan Apps Script aktif.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat p-4 relative"
      style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), url(${getGoogleDriveImageUrl(settings.bg_url) || APP_BG_URL})` }}
    >
      <div className="absolute top-8 left-8">
        <img src={getGoogleDriveImageUrl(settings.logo_url) || APP_LOGO_URL} alt="Logo" className="h-[91px] w-auto object-contain drop-shadow-md" referrerPolicy="no-referrer" />
      </div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Lab SMAN 2 Pasuruan</h1>
          <p className="text-sm text-gray-500 mt-2">
            {isRegistering ? 'Daftar akun baru laboratorium' : 'Silakan login untuk mengakses sistem inventaris'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Username</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Password</label>
            <input 
              type="password" 
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {isRegistering && (
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Konfirmasi Password</label>
              <input 
                type="password" 
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          {error && <p className="text-xs text-red-500 animate-pulse">{error}</p>}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Memproses...' : (isRegistering ? 'Buat Akun' : 'Login')}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button 
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
              setPassword('');
              setConfirmPassword('');
            }}
            className="text-xs text-emerald-600 hover:underline font-medium"
          >
            {isRegistering ? 'Sudah punya akun? Login di sini' : 'Belum punya akun? Daftar di sini'}
          </button>
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  const { settings } = useContext(SettingsContext);
  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat p-8 relative flex flex-col items-center justify-center font-sans"
      style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.3), rgba(15, 23, 42, 0.3)), url(${getGoogleDriveImageUrl(settings.bg_url) || APP_BG_URL})` }}
    >
      {/* Institutional Header */}
      <div className="absolute top-8 left-8 flex items-center gap-4 group">
        <div className="w-[91px] h-[91px] bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 p-2 group-hover:scale-110 transition-all">
          <img src={getGoogleDriveImageUrl(settings.logo_url) || APP_LOGO_URL} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
        </div>
        <div className="text-white drop-shadow-sm">
          <h2 className="font-serif text-lg leading-tight">Laboratorium SMAN 2</h2>
          <p className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-60">Pasuruan, Jawa Timur</p>
        </div>
      </div>

      <div className="w-full max-w-5xl z-10">
        <header className="mb-16 text-center">
          <h1 className="font-serif text-6xl text-white mb-4 leading-tight drop-shadow-lg">
            Management <span className="font-serif-italic">&</span> Portal
          </h1>
          <div className="w-24 h-1 bg-emerald-500 mx-auto rounded-full mb-6"></div>
          <p className="text-white/80 text-lg max-w-xl mx-auto font-light leading-relaxed">
            Sistem tata kelola inventaris, standarisasi operasional, dan pemantauan alat laboratorium sekolah.
          </p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link to="/sop" className="group glass-card p-10 rounded-[2.5rem] flex flex-col items-center text-center hover:bg-white/90">
            <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center mb-8 group-hover:rotate-6 transition-all duration-500 shadow-xl shadow-slate-900/20">
              <FileText className="text-emerald-400 w-8 h-8" />
            </div>
            <h2 className="font-serif text-2xl mb-4 text-slate-900">Standard Operating Procedure</h2>
            <p className="text-slate-500 font-light leading-relaxed">
              Panduan resmi penggunaan ruangan, pemeliharaan alat, dan keselamatan kerja di area laboratorium.
            </p>
            <div className="mt-8 flex items-center text-emerald-600 font-semibold text-sm group-hover:gap-2 transition-all">
              Buka Dokumen <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
          
          <Link to="/inventory/master" className="group glass-card p-10 rounded-[2.5rem] flex flex-col items-center text-center hover:bg-white/90">
            <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center mb-8 group-hover:-rotate-6 transition-all duration-500 shadow-xl shadow-slate-900/20">
              <Box className="text-emerald-400 w-8 h-8" />
            </div>
            <h2 className="font-serif text-2xl mb-4 text-slate-900">Inventaris Sistem Pusat</h2>
            <p className="text-slate-500 font-light leading-relaxed">
              Akses database alat dan bahan, pencatatan peminjaman, pengembalian barang, serta riwayat inventaris.
            </p>
            <div className="mt-8 flex items-center text-emerald-600 font-semibold text-sm group-hover:gap-2 transition-all">
              Masuk Sistem <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

const SOPPage = ({ user }: { user: User | null }) => {
  const { settings } = useContext(SettingsContext);
  const [activeTab, setActiveTab] = useState('ruangan');
  const [editingIndex, setEditingIndex] = useState<{tab: string, index: number} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newItemValue, setNewItemValue] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddPdf, setShowAddPdf] = useState(false);
  const [newPdfData, setNewPdfData] = useState({ title: '', url: '' });

  const [sops, setSops] = useState<{ [key: string]: string[] }>(() => {
    const saved = localStorage.getItem('lab_sops');
    return saved ? JSON.parse(saved) : {
      ruangan: [
        "Wajib mengenakan Jas Laboratorium dan kartu identitas selama di area praktik.",
        "Dilarang membawa konsumsi (makanan/minuman) ke dalam zona steril laboratorium.",
        "Kebersihan meja kerja adalah tanggung jawab pengguna sebelum dan sesudah praktikum."
      ],
      peralatan: [
        "Verifikasi integritas fisik alat sebelum melakukan aktivasi atau penggunaan.",
        "Gunakan instrumen sesuai manual teknis dan supervisi tenaga ahli/pendidik.",
        "Segera laporkan anomali, kerusakan, atau malfungsi alat kepada petugas laboran."
      ],
      peminjaman: [
        "Seluruh prosedur peminjaman wajib tercatat dalam Sistem Informasi Inventaris.",
        "Aset yang dipinjam harus dikembalikan dalam status bersih dan terkalibrasi.",
        "Pelanggaran durasi peminjaman akan berakibat pada pembekuan hak akses layanan."
      ]
    };
  });

  const [pdfDocs, setPdfDocs] = useState<{ title: string, url: string }[]>(() => {
    const saved = localStorage.getItem('lab_sops_pdfs');
    return saved ? JSON.parse(saved) : [
      { title: "Buku Panduan Laboratorium (PDF)", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" }
    ];
  });

  useEffect(() => {
    localStorage.setItem('lab_sops', JSON.stringify(sops));
  }, [sops]);

  useEffect(() => {
    localStorage.setItem('lab_sops_pdfs', JSON.stringify(pdfDocs));
  }, [pdfDocs]);

  const isAdmin = user?.role === 'admin';

  const handleAddPdf = () => {
    if (newPdfData.title.trim() && isValidUrl(newPdfData.url)) {
      setPdfDocs([...pdfDocs, { title: newPdfData.title.trim(), url: newPdfData.url.trim() }]);
      setNewPdfData({ title: '', url: '' });
      setShowAddPdf(false);
    }
  };

  const isValidUrl = (urlString: string) => {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (e) {
      return false;
    }
  };

  const [deletingPdfIndex, setDeletingPdfIndex] = useState<number | null>(null);

  const handleDeletePdf = (index: number) => {
    setPdfDocs(pdfDocs.filter((_, i) => i !== index));
    setDeletingPdfIndex(null);
  };

  const handleEdit = (tab: string, index: number) => {
    setEditingIndex({ tab, index });
    setEditValue(sops[tab][index]);
  };

  const handleSave = () => {
    if (editingIndex) {
      const newSops = { ...sops };
      newSops[editingIndex.tab][editingIndex.index] = editValue;
      setSops(newSops);
      setEditingIndex(null);
    }
  };

  const handleDelete = (tab: string, index: number) => {
    if (!window.confirm('SOP ini akan dihapus secara permanen. Lanjutkan?')) return;
    const newSops = { ...sops };
    newSops[tab] = newSops[tab].filter((_, i) => i !== index);
    setSops(newSops);
  };

  const handleAddItem = () => {
    if (newItemValue.trim()) {
      const newSops = { ...sops };
      newSops[activeTab] = [...newSops[activeTab], newItemValue.trim()];
      setSops(newSops);
      setNewItemValue('');
      setShowAddItem(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat p-12 relative flex flex-col items-center pt-32 font-sans"
      style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.5), rgba(15, 23, 42, 0.5)), url(${getGoogleDriveImageUrl(settings.bg_url) || APP_BG_URL})` }}
    >
      {/* Top Left Logo */}
      <div className="absolute top-8 left-8 flex items-center gap-3">
        <img src={getGoogleDriveImageUrl(settings.logo_url) || APP_LOGO_URL} alt="Logo" className="h-[91px] w-auto object-contain" referrerPolicy="no-referrer" />
        <div className="h-12 w-[1px] bg-white/20 mx-2"></div>
        <span className="text-white font-serif text-lg">Official SOP Dashboard</span>
      </div>

      <div className="w-full max-w-4xl z-10">
        <Link to="/home" className="inline-flex items-center text-sm text-white/60 hover:text-white mb-12 transition-all uppercase tracking-widest font-bold">
          <ChevronRight className="rotate-180 mr-2 w-4 h-4" /> Kembali ke Portal Utama
        </Link>
        
        <header className="mb-12">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-5xl font-serif text-white mb-4">Prosedur Operasional Standar</h1>
              <p className="text-white/60 font-light text-lg tracking-wide italic">Menjamin standarisasi, keamanan, and efisiensi di setiap sudut Laboratorium SMAN 2 Pasuruan.</p>
            </div>
            {isAdmin && (
              <button 
                onClick={() => setShowAddItem(true)}
                className="bg-emerald-500 text-slate-900 px-6 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-400 transition-all shadow-lg"
              >
                <Plus className="w-4 h-4" /> Tambah Poin SOP
              </button>
            )}
          </div>
        </header>

        <div className="glass-card rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="flex bg-slate-900/50 backdrop-blur-md p-2">
            {Object.keys(sops).map((key) => (
              <button
                key={key}
                onClick={() => {
                  setActiveTab(key);
                  setEditingIndex(null);
                  setShowAddItem(false);
                }}
                className={cn(
                  "flex-1 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all rounded-2xl mx-1 transform",
                  activeTab === key 
                    ? "bg-emerald-500 text-slate-900 shadow-lg" 
                    : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                {key === 'ruangan' ? 'Protokol Ruangan' : key === 'peralatan' ? 'Manajemen Alat' : 'Sirkulasi Aset'}
              </button>
            ))}
          </div>
          <div className="p-16 bg-white/95">
            <div className="flex items-center justify-between gap-4 mb-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-1 bg-emerald-500 rounded-full"></div>
                <h3 className="font-serif text-2xl text-slate-900 uppercase tracking-tight">
                  {activeTab === 'ruangan' ? 'Standard Protocol: Ruangan' : activeTab === 'peralatan' ? 'Operating Manual: Peralatan' : 'Mutation Policy: Peminjaman'}
                </h3>
              </div>
            </div>

            <ul className="space-y-8 mb-16">
              {sops[activeTab].map((sop, i) => (
                <li key={i} className="flex items-start group">
                  <span className="w-10 h-10 rounded-2xl bg-slate-900 text-emerald-400 text-sm font-serif-italic flex items-center justify-center mr-6 mt-0.5 flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                    {i + 1}
                  </span>
                  
                  <div className="flex-1 flex items-start gap-4">
                    {editingIndex?.tab === activeTab && editingIndex?.index === i ? (
                      <div className="flex-1 flex flex-col gap-3">
                        <textarea 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 text-lg font-light min-h-[100px]"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={handleSave}
                            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-all"
                          >
                            <Save className="w-3 h-3" /> Simpan
                          </button>
                          <button 
                            onClick={() => setEditingIndex(null)}
                            className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-slate-200 transition-all"
                          >
                            <X className="w-3 h-3" /> Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-slate-600 text-lg leading-relaxed font-light flex-1">{sop}</p>
                        {isAdmin && (
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleEdit(activeTab, i)}
                              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center"
                              title="Edit SOP"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(activeTab, i)}
                              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all flex items-center justify-center"
                              title="Hapus SOP"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </li>
              ))}
              
              {showAddItem && (
                <li className="flex items-start animate-in slide-in-from-top-4 duration-300">
                  <span className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-900 text-sm font-serif-italic flex items-center justify-center mr-6 mt-0.5 flex-shrink-0 shadow-lg">
                    {sops[activeTab].length + 1}
                  </span>
                  <div className="flex-1 flex flex-col gap-3">
                    <textarea 
                      placeholder="Tulis poin prosedur baru di sini..."
                      autoFocus
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 text-lg font-light min-h-[100px]"
                      value={newItemValue}
                      onChange={(e) => setNewItemValue(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={handleAddItem}
                        className="bg-emerald-500 text-slate-900 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-400 transition-all"
                      >
                        <Plus className="w-3 h-3" /> Tambahkan
                      </button>
                      <button 
                        onClick={() => {
                          setShowAddItem(false);
                          setNewItemValue('');
                        }}
                        className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-slate-200 transition-all"
                      >
                        <X className="w-3 h-3" /> Batal
                      </button>
                    </div>
                  </div>
                </li>
              )}
            </ul>

            <div className="mt-16 pt-12 border-t border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-1 bg-blue-500 rounded-full"></div>
                  <h3 className="font-serif text-2xl text-slate-900 uppercase tracking-tight">Dokumen PDF Terintegrasi</h3>
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => setShowAddPdf(true)}
                    className="text-blue-600 hover:text-blue-700 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Link PDF Baru
                  </button>
                )}
              </div>

              {showAddPdf && (
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 mb-8 animate-in fade-in slide-in-from-top-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Judul Dokumen</label>
                      <input 
                        type="text" 
                        placeholder="Contoh: Panduan Teknis Lab"
                        className="px-6 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
                        value={newPdfData.title}
                        onChange={(e) => setNewPdfData({...newPdfData, title: e.target.value})}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2 flex justify-between items-center">
                        URL PDF Online
                        {newPdfData.url && (
                          isValidUrl(newPdfData.url) ? (
                            <span className="text-emerald-500 flex items-center gap-1 normal-case font-medium">
                              <Check className="w-3 h-3" /> Valid Link
                            </span>
                          ) : (
                            <span className="text-red-500 flex items-center gap-1 normal-case font-medium">
                              <AlertCircle className="w-3 h-3" /> URL tidak valid
                            </span>
                          )
                        )}
                      </label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="https://..."
                          className={cn(
                            "w-full px-6 py-3 bg-white border rounded-2xl outline-none focus:ring-2 transition-all text-slate-900",
                            !newPdfData.url ? "border-slate-200 focus:ring-blue-500/20" :
                            isValidUrl(newPdfData.url) 
                              ? "border-emerald-200 focus:ring-emerald-500/20" 
                              : "border-red-200 focus:ring-red-500/20"
                          )}
                          value={newPdfData.url}
                          onChange={(e) => setNewPdfData({...newPdfData, url: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={() => {
                        setShowAddPdf(false);
                        setNewPdfData({ title: '', url: '' });
                      }}
                      className="px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-all"
                    >
                      Batal
                    </button>
                    <button 
                      onClick={handleAddPdf}
                      disabled={!newPdfData.title.trim() || !isValidUrl(newPdfData.url)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none disabled:bg-slate-300"
                    >
                      Simpan Link PDF
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pdfDocs.map((doc, i) => (
                  <div key={i} className="group relative bg-slate-50 hover:bg-emerald-50 rounded-[2rem] p-6 border border-slate-100 hover:border-emerald-200 transition-all flex items-center gap-6 shadow-sm hover:shadow-xl hover:-translate-y-1">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-emerald-500 shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      <File className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-emerald-900">{doc.title}</h4>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">Digital PDF Resource</p>
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="w-10 h-10 rounded-xl bg-white text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 transition-all flex items-center justify-center shadow-sm"
                        title="View Online"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      {isAdmin && (
                        <div className="relative flex items-center">
                          {deletingPdfIndex === i ? (
                            <div className="flex gap-1 animate-in fade-in zoom-in duration-200">
                              <button 
                                onClick={() => handleDeletePdf(i)}
                                className="px-3 h-10 rounded-xl bg-red-600 text-white text-[9px] font-bold uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-600/20"
                              >
                                Ya, Hapus
                              </button>
                              <button 
                                onClick={() => setDeletingPdfIndex(null)}
                                className="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 hover:bg-slate-300 transition-all flex items-center justify-center shadow-sm"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setDeletingPdfIndex(i)}
                              className="w-10 h-10 rounded-xl bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all flex items-center justify-center shadow-sm"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InventoryLayout = ({ children, user }: { children: React.ReactNode, user: User | null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useContext(SettingsContext);

  const menuItems = [
    { path: '/inventory/master', icon: Box, label: 'Katalog Barang' },
    { path: '/inventory/transaction', icon: ArrowLeftRight, label: 'Peminjaman & Pengembalian' },
    { path: '/inventory/history', icon: History, label: 'Arsip Riwayat' },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ path: '/inventory/settings', icon: SettingsIcon, label: 'Konfigurasi' });
  }

  return (
    <div className="flex min-h-screen bg-[#fcfcfb] font-sans">
      {/* Elegant Sidebar */}
      <aside className="w-72 bg-slate-900 flex flex-col sticky top-0 h-screen shadow-2xl">
        <div className="p-8 border-b border-white/10 flex flex-col items-center text-center gap-4">
          <div className="w-[91px] h-[91px] bg-white rounded-2xl p-2 flex items-center justify-center shadow-lg">
            <img src={getGoogleDriveImageUrl(settings.logo_url) || APP_LOGO_URL} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h2 className="font-serif text-white text-xl tracking-tight">Portal Lab</h2>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-semibold">SMAN 2 Pasuruan</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-2">
          <Link to="/home" className="flex items-center px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all mb-8 group">
            <HomeIcon className="w-5 h-5 mr-3 group-hover:-translate-y-0.5 transition-transform" /> 
            <span className="text-sm font-medium">Dashboard Portal</span>
          </Link>
          
          <div className="px-4 mb-4">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">Menu Utama</p>
          </div>

          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center px-4 py-4 text-sm font-medium rounded-2xl transition-all group",
                location.pathname === item.path 
                  ? "bg-emerald-500 text-slate-900 shadow-xl shadow-emerald-500/20" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 mr-3 transition-transform group-hover:scale-110",
                location.pathname === item.path ? "text-slate-900" : "text-slate-500 group-hover:text-emerald-400"
              )} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-6 bg-black/20">
          <div className="bg-white/5 rounded-3xl p-4 mb-4 flex items-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-slate-900 font-bold mr-3 shadow-lg">
              {user?.username[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={() => { localStorage.removeItem('user'); window.location.href = '/login'; }}
            className="w-full flex items-center justify-center p-4 text-sm font-bold text-red-400 hover:bg-red-500/10 rounded-2xl transition-all gap-2"
          >
            <LogOut className="w-4 h-4" /> SIGN OUT
          </button>
        </div>
      </aside>

      {/* High-Quality Main Content Area */}
      <main className="flex-1 p-16 max-h-screen overflow-auto bg-[#fafafa]">
        <div className="max-w-[1400px] mx-auto min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
};

const MasterInventory = ({ user }: { user: User | null }) => {
  const { settings } = useContext(SettingsContext);
  const [items, setItems] = useState<Item[]>([]);
  const [history, setHistory] = useState<TransactionHistory[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState<Partial<Item>>({ category: 'alat', total_stock: 0, min_stock: 0 });

  const [editingImage, setEditingImage] = useState<{ code: string, url: string } | null>(null);
  const [viewItem, setViewItem] = useState<Item | null>(null);

  const [sortConfig, setSortConfig] = useState<{ key: keyof Item | 'status'; direction: 'asc' | 'desc' } | null>(null);

  const isAdmin = user?.role === 'admin';

  const lowStockItems = useMemo(() => items.filter(item => item.current_stock <= item.min_stock), [items]);

  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aVal: any = a[sortConfig.key as keyof Item];
        let bVal: any = b[sortConfig.key as keyof Item];

        if (sortConfig.key === 'status') {
          aVal = a.current_stock <= a.min_stock ? 0 : 1;
          bVal = b.current_stock <= b.min_stock ? 0 : 1;
        }

        if (aVal === undefined || aVal === null) aVal = '';
        if (bVal === undefined || bVal === null) bVal = '';

        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = String(bVal).toLowerCase();
        }

        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key: keyof Item | 'status') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Item | 'status') => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />;
  };

  const fetchItems = async () => {
    try {
      const [itemsRes, historyRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/history')
      ]);

      if (!itemsRes.ok || !historyRes.ok) {
        throw new Error('Gagal mengambil data');
      }

      const itemsData = await itemsRes.json();
      const historyData = await historyRes.json();

      if (Array.isArray(itemsData)) setItems(itemsData);
      if (Array.isArray(historyData)) setHistory(historyData);

    } catch (err: any) {
      console.error('Failed to fetch data', err);
      setItems([]);
      setHistory([]);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  useEffect(() => {
    if (showAdd && settings.category_thresholds) {
      const threshold = settings.category_thresholds.find(t => t.category.toLowerCase() === (newItem.category || 'alat').toLowerCase());
      if (threshold) {
        setNewItem(prev => ({ ...prev, min_stock: threshold.min_stock }));
      }
    }
  }, [showAdd, settings.category_thresholds]);

  const handleUpdateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingImage) return;

    const res = await fetch('/api/items/update-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_code: editingImage.code, image_url: editingImage.url }),
    });

    if (res.ok) {
      setEditingImage(null);
      fetchItems();
    } else {
      alert('Gagal memperbarui gambar');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm('Apakah Anda yakin ingin mendaftarkan aset baru ini ke sistem?')) return;
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });
    if (res.ok) {
      setShowAdd(false);
      setNewItem({ category: 'alat', total_stock: 0, min_stock: 0 });
      fetchItems();
    }
  };

  return (
    <div className="font-sans">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="font-serif text-4xl text-slate-900">Katalog Barang</h1>
          <p className="text-slate-500 mt-2 font-light tracking-wide uppercase text-[10px]">Database Inventaris & Manajemen Aset</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowAdd(true)}
            className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-sm font-semibold hover:bg-emerald-600 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2 group"
          >
            <Box className="w-4 h-4 group-hover:scale-110 transition-transform" /> Tambah Barang
          </button>
        )}
      </div>

      {lowStockItems.length > 0 && (
        <div className="mb-12 animate-in fade-in slide-in-from-top-6 duration-700">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-[2.5rem] p-10 flex flex-col lg:flex-row items-start gap-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/10 rounded-full blur-3xl -mr-32 -mt-32 uppercase"></div>
            <div className="w-16 h-16 bg-amber-500 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-amber-500/40 shrink-0 transform -rotate-3">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-amber-900 font-bold uppercase tracking-[0.3em] text-[10px]">Security & Inventory Alert</h3>
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
              </div>
              <p className="text-slate-700 text-lg font-serif mb-8 leading-relaxed max-w-2xl">
                Sistem mendeteksi <span className="text-amber-600 font-semibold">{lowStockItems.length} aset</span> kritis yang membutuhkan atensi segera karena berada di bawah batas minimum operasional.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lowStockItems.slice(0, 6).map(item => (
                  <div 
                    key={item.item_code} 
                    className="bg-white/80 backdrop-blur-sm border border-amber-200/50 rounded-3xl p-5 flex items-center justify-between group hover:bg-white hover:shadow-xl hover:shadow-amber-900/5 transition-all cursor-pointer border-l-4 border-l-amber-500"
                    onClick={() => isAdmin && setViewItem(item)}
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
                        {item.image_url ? (
                          <img 
                            src={getGoogleDriveImageUrl(item.image_url)} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Box className="w-full h-full p-3 text-slate-200" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-sm font-bold text-slate-900 truncate tracking-tight">{item.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[14px] font-serif text-amber-600 leading-none">{item.current_stock}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{item.unit}</span>
                          <span className="text-[9px] text-slate-300">/</span>
                          <span className="text-[9px] text-slate-400">Min {item.min_stock}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm">
                         <ChevronRight className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                ))}
                {lowStockItems.length > 6 && (
                  <div className="flex items-center justify-center p-5 bg-amber-100/30 rounded-3xl border border-dashed border-amber-300 text-[10px] font-bold text-amber-700 uppercase tracking-widest cursor-default">
                    + {lowStockItems.length - 6} Aset Lainnya
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th 
                className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
                onClick={() => requestSort('image_url')}
              >
                <div className="flex items-center gap-2">Visual {getSortIcon('image_url')}</div>
              </th>
              <th 
                className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
                onClick={() => requestSort('name')}
              >
                <div className="flex items-center gap-2">Identitas {getSortIcon('name')}</div>
              </th>
              <th 
                className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
                onClick={() => requestSort('item_code')}
              >
                <div className="flex items-center gap-2">
                  <QrCode className="w-3 h-3" /> QR Code {getSortIcon('item_code')}
                </div>
              </th>
              <th 
                className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
                onClick={() => requestSort('category')}
              >
                <div className="flex items-center gap-2">Kategori {getSortIcon('category')}</div>
              </th>
              <th 
                className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
                onClick={() => requestSort('current_stock')}
              >
                <div className="flex items-center gap-2">Ketersediaan {getSortIcon('current_stock')}</div>
              </th>
              <th 
                className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
                onClick={() => requestSort('location')}
              >
                <div className="flex items-center gap-2">Lokasi {getSortIcon('location')}</div>
              </th>
              <th 
                className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
                onClick={() => requestSort('status')}
              >
                <div className="flex items-center gap-2">Status {getSortIcon('status')}</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {Array.isArray(items) && sortedItems.map((item) => (
              <tr 
                key={item.item_code} 
                onClick={() => isAdmin && setViewItem(item)}
                className={cn(
                  "hover:bg-slate-50/50 transition-colors group",
                  isAdmin && "cursor-pointer",
                  item.current_stock <= item.min_stock && "bg-amber-50/30"
                )}
              >
                <td className="px-8 py-6">
                  <div className="relative group/mini-img w-16 h-16 rounded-2xl bg-white overflow-hidden border border-slate-200 shadow-sm group-hover:shadow-md transition-all">
                    {item.image_url ? (
                      <img 
                        src={getGoogleDriveImageUrl(item.image_url)} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200 bg-slate-50">
                        <Box className="w-8 h-8" />
                      </div>
                    )}
                    {isAdmin && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingImage({ code: item.item_code, url: item.image_url || '' }); }}
                        className="absolute inset-0 bg-slate-900/60 text-white opacity-0 group-hover/mini-img:opacity-100 flex items-center justify-center transition-all text-[8px] font-bold tracking-widest"
                      >
                        UPDATE
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    <div>
                      <h3 className="text-slate-900 font-medium text-base mb-1 tracking-tight flex items-center gap-2">
                        {item.name}
                        {item.current_stock <= item.min_stock && (
                          <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                        )}
                      </h3>
                      <p className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">{item.item_code}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                   <div className="bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm inline-block group/qr cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all">
                     <img 
                       src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${item.item_code}`} 
                       alt={`QR Code for ${item.item_code}`}
                       className="h-12 w-12 mix-blend-multiply group-hover:scale-110 transition-transform duration-300"
                       referrerPolicy="no-referrer"
                     />
                   </div>
                </td>
                <td className="px-8 py-6">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block",
                    item.category?.toLowerCase() === 'alat' ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-700"
                  )}>
                    {item.category}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-xl text-slate-900">{item.current_stock}</span>
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{item.unit}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center text-slate-500 text-sm italic font-serif">
                    {item.location}
                  </div>
                </td>
                <td className="px-8 py-6">
                  {item.current_stock <= item.min_stock ? (
                    <span className="flex items-center text-red-500 text-[10px] font-bold uppercase tracking-wider">
                      <AlertTriangle className="w-3 h-3 mr-1" /> Stok Kritis
                    </span>
                  ) : (
                    <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider">Terjamin</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingImage && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl animate-in fade-in zoom-in duration-300">
            <h2 className="font-serif text-2xl text-slate-900 mb-2">Update Visual Aset</h2>
            <p className="text-[10px] text-slate-400 mb-8 uppercase tracking-[0.2em] font-bold">Identitas Kode: {editingImage.code}</p>
            <form onSubmit={handleUpdateImage} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">URL Sumber Gambar</label>
                <input 
                  autoFocus
                  required
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm" 
                  value={editingImage.url}
                  onChange={e => setEditingImage({...editingImage, url: e.target.value})} 
                  placeholder="https://drive.google.com/..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditingImage(null)} className="flex-1 py-4 rounded-2xl hover:bg-slate-50 text-sm font-semibold text-slate-500 transition-all">Batal</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl hover:bg-emerald-600 text-sm font-semibold shadow-lg shadow-slate-900/10 transition-all">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {viewItem && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 my-auto">
            <div className="relative h-[28rem] bg-slate-100">
              {viewItem.image_url ? (
                <img 
                  src={getGoogleDriveImageUrl(viewItem.image_url)} 
                  className="w-full h-full object-cover"
                  alt={viewItem.name}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                  <Box className="w-32 h-32 mb-4 opacity-20" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tidak ada gambar</span>
                </div>
              )}
              <button 
                onClick={() => setViewItem(null)}
                className="absolute top-8 right-8 w-14 h-14 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl hover:scale-110 hover:rotate-90 transition-all duration-300 z-10"
              >
                <X className="w-6 h-6 text-slate-900" />
              </button>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-12">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-4 py-1.5 bg-emerald-500 text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/30">
                    {viewItem.category}
                  </span>
                  {(viewItem.current_stock / viewItem.min_stock) <= 1 && (
                    <span className="px-4 py-1.5 bg-red-500 text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-red-500/30 animate-pulse">
                      Low Stock
                    </span>
                  )}
                </div>
                <h2 className="text-4xl font-serif text-white mb-2 leading-tight">{viewItem.name}</h2>
                <div className="flex items-center gap-4 text-white/60 font-mono text-xs tracking-widest uppercase">
                  <span>ID: {viewItem.item_code}</span>
                  <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                  <span>{viewItem.location || 'No Location'}</span>
                </div>
              </div>
            </div>
            
            <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-12 bg-white">
              <div className="space-y-8">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-3 block">Informasi Utama</label>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 group">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-emerald-50 transition-colors">
                        <HomeIcon className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Penyimpanan</p>
                        <p className="text-sm font-medium text-slate-700">{viewItem.location || 'Belum diatur'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 group">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-emerald-50 transition-colors">
                        <Package className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Satuan / Unit</p>
                        <p className="text-sm font-medium text-slate-700">{viewItem.unit || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-4 block">Batas Minimum</label>
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold text-amber-700">Minimum Stock Reorder</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-amber-900">{viewItem.min_stock}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-[3rem] p-10 flex flex-col justify-between border border-slate-100 ring-4 ring-slate-50/50">
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div className="text-center flex-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tersedia</p>
                      <p className="text-5xl font-serif text-slate-900 tracking-tighter">{viewItem.current_stock}</p>
                    </div>
                    <div className="w-px h-12 bg-slate-200"></div>
                    <div className="text-center flex-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total</p>
                      <p className="text-5xl font-serif text-slate-400 tracking-tighter">{viewItem.total_stock}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-500 uppercase tracking-wider">Kondisi Stok</span>
                      <span className={cn(
                        "font-mono font-bold",
                        (viewItem.current_stock / viewItem.total_stock) < 0.2 ? "text-red-500" : "text-emerald-600"
                      )}>
                        {Math.round((viewItem.current_stock / viewItem.total_stock) * 100)}%
                      </span>
                    </div>
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden p-0.5">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000 ease-out shadow-sm",
                          (viewItem.current_stock / viewItem.total_stock) < 0.2 ? "bg-red-500" : 
                          (viewItem.current_stock / viewItem.total_stock) < 0.5 ? "bg-amber-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${(viewItem.current_stock / viewItem.total_stock) * 100}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 italic text-center pt-2">
                      Persentase stok relatif terhadap kapasitas total gudang
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-12 pb-6 max-h-72 overflow-y-auto">
              <div className="sticky top-0 bg-white py-4 z-10 flex items-center justify-between border-b border-slate-50 mb-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em]">Riwayat Log Transaksi</h3>
                <span className="text-[10px] font-mono text-slate-300">Newest First</span>
              </div>
              <div className="space-y-3 pb-6">
                {history
                  .filter(h => h.item_code === viewItem.item_code)
                  .map((log, idx) => (
                    <div key={idx} className="group relative flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-2xl flex items-center justify-center border",
                          log.type === 'pinjam' ? "bg-red-50 border-red-100 text-red-500" : "bg-emerald-50 border-emerald-100 text-emerald-500"
                        )}>
                          {log.type === 'pinjam' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">
                            {new Date(log.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-tighter">
                            {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8">
                        <div className="text-center hidden sm:block">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                            log.type === 'pinjam' ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                          )}>
                            {log.type === 'pinjam' ? 'Out' : 'In'}
                          </span>
                          <p className="text-xs font-bold text-slate-900 mt-1">{log.quantity} <span className="text-[10px] font-normal text-slate-400 uppercase">{viewItem.unit}</span></p>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <p className="text-xs font-bold text-slate-900 truncate">{log.person_name || '-'}</p>
                          <p className="text-[9px] text-slate-400 uppercase group-hover:text-emerald-600/60 transition-colors">{log.username}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                {history.filter(h => h.item_code === viewItem.item_code).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-300 italic opacity-50">
                    <History className="w-12 h-12 mb-3" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Belum ada riwayat transaksi</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-12 pb-12 bg-white pt-6 border-t border-slate-50">
              <button 
                onClick={() => setViewItem(null)}
                className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-bold text-xs tracking-[0.25em] uppercase hover:bg-emerald-600 transform hover:-translate-y-1 transition-all shadow-2xl shadow-slate-900/20 active:scale-95"
              >
                Close Inventory Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-12 shadow-2xl animate-in fade-in zoom-in duration-300 overflow-auto max-h-[90vh]">
            <h2 className="font-serif text-3xl text-slate-900 mb-2">Registrasi Aset Baru</h2>
            <p className="text-[10px] text-slate-400 mb-10 uppercase tracking-[0.2em] font-bold text-center">Formulir Pendataan Inventaris Laboratorium</p>
            
            <form onSubmit={handleAdd} className="grid grid-cols-2 gap-8">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Kode Inventaris</label>
                <input required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all" value={newItem.item_code || ''} onChange={e => setNewItem({...newItem, item_code: e.target.value})} />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nama Nama Aset</label>
                <input required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Klasifikasi</label>
                <select 
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm appearance-none" 
                  value={newItem.category}
                  onChange={e => {
                    const cat = e.target.value;
                    const threshold = (settings.category_thresholds || []).find(t => t.category.toLowerCase() === cat.toLowerCase());
                    setNewItem({
                      ...newItem, 
                      category: cat, 
                      min_stock: threshold ? threshold.min_stock : newItem.min_stock
                    });
                  }}
                >
                  <option value="alat">Peralatan (Tools)</option>
                  <option value="bahan">Bahan (Chemicals)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Satuan Unit</label>
                <input required placeholder="Pcs, Unit, Set, dll" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm transition-all" value={newItem.unit || ''} onChange={e => setNewItem({...newItem, unit: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Kapasitas Maksimal</label>
                <input type="number" required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm transition-all" value={newItem.total_stock || 0} onChange={e => setNewItem({...newItem, total_stock: parseInt(e.target.value) || 0})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Ambang Batas (Alert)</label>
                <input 
                  type="number" 
                  required 
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm transition-all" 
                  value={newItem.min_stock}
                  onChange={e => setNewItem({...newItem, min_stock: parseInt(e.target.value) || 0})} 
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Lokasi Distribusi</label>
                <input required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm transition-all" value={newItem.location || ''} onChange={e => setNewItem({...newItem, location: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">URL Representasi Visual</label>
                <input 
                  placeholder="https://drive.google.com/file/d/..." 
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm transition-all" 
                  value={newItem.image_url || ''}
                  onChange={e => setNewItem({...newItem, image_url: e.target.value})} 
                />
              </div>
              <div className="col-span-2 flex gap-4 mt-8">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 rounded-2xl hover:bg-slate-50 text-sm font-semibold text-slate-500 transition-all border border-slate-100">Batalkan</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl hover:bg-emerald-600 text-sm font-semibold shadow-xl shadow-slate-900/20 transition-all">Daftarkan Aset</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const TransactionPage = ({ user }: { user: User | null }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [history, setHistory] = useState<TransactionHistory[]>([]);
  const [cart, setCart] = useState<{ item_code: string, quantity: number, name: string, category: string }[]>([]);
  const [formData, setFormData] = useState({ item_code: '', type: 'pinjam' as 'pinjam' | 'kembali', quantity: 1, person_name: '' });
  const [message, setMessage] = useState<{ text: string, type: string, docUrl?: string }>({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showReturnConfirm, setShowReturnConfirm] = useState<{ item: Item, qty: number, borrowed: number } | null>(null);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState<{ type: 'pinjam' | 'kembali', message: string, docUrl?: string } | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(items.map(item => item.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [items]);

  const loadItems = () => {
    fetch('/api/items')
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.error || 'Gagal mengambil data katalog'); });
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setItems(data);
        } else {
          throw new Error('Format data katalog tidak valid');
        }
      })
      .catch(err => {
        console.error('Failed to fetch items', err);
        setItems([]);
        setMessage({ text: err.message, type: 'error' });
      });
  };

  const loadHistory = () => {
    fetch('/api/history')
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.error || 'Gagal mengambil riwayat'); });
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setHistory(data);
        } else {
          throw new Error('Format data riwayat tidak valid');
        }
      })
      .catch(err => {
        console.error('Failed to fetch history', err);
        // We don't necessarily want to alert for history failure here as it's secondary
      });
  };

  useEffect(() => {
    loadItems();
    loadHistory();
  }, []);

  // Auto-populate person_name on return
  useEffect(() => {
    if (formData.type === 'kembali' && formData.item_code && !formData.person_name) {
      // Find latest loan for this item by this user
      const latestLoan = history.find(h => 
        h.item_code === formData.item_code && 
        h.type === 'pinjam' && 
        (h.username === user?.username || h.person_name.toLowerCase() === user?.username?.toLowerCase())
      );

      if (latestLoan) {
        setFormData(prev => ({ ...prev, person_name: latestLoan.person_name }));
      }
    }
  }, [formData.item_code, formData.type, history, user]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(search.toLowerCase()) || 
        item.item_code.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = filterCategory === 'all' || 
        (item.category && item.category.toLowerCase().trim() === filterCategory.toLowerCase().trim());
      return matchesSearch && matchesCategory;
    });
  }, [items, search, filterCategory]);

  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const codeReaderRef = React.useRef<any>(null);

  const stopScanner = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    setScanning(false);
  };

  const startScanner = async () => {
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/library');
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserMultiFormatReader();
      }
      
      const devices = await codeReaderRef.current.listVideoInputDevices();
      if (!devices || devices.length === 0) {
        alert("Tidak ditemukan kamera pada perangkat ini.");
        return;
      }
      
      setVideoDevices(devices);
      if (!selectedDevice) {
        setSelectedDevice(devices[0].deviceId);
      }
      setScanning(true);
    } catch (err) {
      console.error("Failed to list devices:", err);
      alert("Gagal mengakses kamera. Pastikan izin kamera telah diberikan.");
    }
  };

  useEffect(() => {
    if (scanning && videoRef.current && selectedDevice && codeReaderRef.current) {
      const startDecoding = async () => {
        try {
          await codeReaderRef.current.decodeFromVideoDevice(
            selectedDevice, 
            videoRef.current!, 
            async (result: any) => {
              if (result) {
                const text = result.getText();
                stopScanner();
                await handleQRScan(text);
              }
            }
          );
        } catch (err) {
          console.error("Decoding error:", err);
        }
      };
      startDecoding();
    }
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, [scanning, selectedDevice]);

  const handleQRScan = async (code: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/return-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_text: code, user_id: user?.username })
      });
      const result = await res.json();
      if (res.ok) {
        setScanStatus({ type: 'success', message: 'QR Terverifikasi' });
        setTimeout(() => setScanStatus({ type: 'idle', message: '' }), 2000);
        setShowSuccessModal({ 
          type: 'kembali', 
          message: 'Item telah berhasil dikembalikan ke inventaris melalui pemindaian QR.' 
        });
        loadItems();
        if (typeof loadHistory === 'function') loadHistory();
      } else {
        setScanStatus({ type: 'error', message: result.error || 'QR Tidak Valid' });
        setTimeout(() => setScanStatus({ type: 'idle', message: '' }), 2000);
      }
    } catch (err) {
      setScanStatus({ type: 'error', message: 'Gangguan Koneksi' });
      setTimeout(() => setScanStatus({ type: 'idle', message: '' }), 2000);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = () => {
    if (!formData.item_code) return;
    if (!formData.person_name.trim()) {
      setMessage({ text: 'Nama peminjam/pengembali wajib diisi.', type: 'error' });
      return;
    }
    const item = items.find(i => i.item_code === formData.item_code);
    if (!item) return;

    // Stock validation
    const inCart = cart.filter(c => c.item_code === formData.item_code).reduce((acc, curr) => acc + curr.quantity, 0);
    const totalAfterAction = formData.type === 'pinjam' 
      ? item.current_stock - (formData.quantity + inCart)
      : item.current_stock + (formData.quantity + inCart);

    if (formData.type === 'pinjam' && totalAfterAction < 0) {
      setMessage({ text: `Stok tidak mencukupi untuk meminjam ${item.name}. Tersedia: ${item.current_stock}`, type: 'error' });
      return;
    }

    if (formData.type === 'kembali' && totalAfterAction > item.total_stock) {
      setMessage({ text: `Gagal mengembalikan ${item.name}. Kapasitas maksimal (${item.total_stock}) akan terlampaui.`, type: 'error' });
      return;
    }

    if (formData.type === 'kembali' && !showReturnConfirm) {
      // Ensure history is an array and person_name matches robustly
      const historyList = Array.isArray(history) ? history : [];
      const personNameNormalized = formData.person_name.toLowerCase().trim();
      
      const borrowedCount = historyList
        .filter(h => 
          h.item_code === formData.item_code && 
          (h.person_name || "").toLowerCase().trim() === personNameNormalized
        )
        .reduce((acc, curr) => curr.type === 'pinjam' ? acc + curr.quantity : acc - curr.quantity, 0);
      
      const inCartSameItem = cart
        .filter(c => c.item_code === formData.item_code)
        .reduce((acc, curr) => acc + curr.quantity, 0);

      const totalReturning = formData.quantity + inCartSameItem;

      if (totalReturning > borrowedCount) {
        setMessage({ 
          text: `Gagal mengembalikan. ${formData.person_name} tercatat meminjam total ${borrowedCount} unit ${item.name} (Termasuk yang sudah di antrean).`, 
          type: 'error' 
        });
        return;
      }

      // Show confirmation dialog
      setShowReturnConfirm({ item, qty: formData.quantity, borrowed: borrowedCount });
      return;
    }

    const existingIndex = cart.findIndex(c => c.item_code === formData.item_code);
    if (existingIndex > -1) {
      setCart(prev => prev.map((item, idx) => 
        idx === existingIndex 
          ? { ...item, quantity: item.quantity + formData.quantity }
          : item
      ));
    } else {
      setCart(prev => [...prev, { 
        item_code: formData.item_code, 
        quantity: formData.quantity, 
        name: item.name, 
        category: item.category 
      }]);
    }
    setFormData({ ...formData, item_code: '', quantity: 1 });
    setMessage({ text: '', type: '' });
    setShowReturnConfirm(null);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      setMessage({ text: 'Antrean masih kosong.', type: 'error' });
      return;
    }
    
    const pName = formData.person_name.trim();
    if (!pName) {
      setMessage({ text: 'Identitas Nama Peminjam/Pengembali wajib diisi.', type: 'error' });
      return;
    }

    setShowCheckoutConfirm(true);
  };

  const executeCheckout = async () => {
    setShowCheckoutConfirm(false);
    setLoading(true);
    setMessage({ text: 'Sedang memproses transaksi...', type: 'info' });

    try {
      const pName = formData.person_name.trim();
      const payload = {
        user_id: user?.username || 'unknown',
        person_name: pName,
        type: formData.type,
        items: cart.map(c => ({ item_code: c.item_code, quantity: c.quantity }))
      };

      console.log('Sending transaction payload:', payload);

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      
      if (res.ok) {
        setShowSuccessModal({
          type: formData.type as 'pinjam' | 'kembali',
          message: `Transaksi ${formData.type === 'pinjam' ? 'peminjaman' : 'pengembalian'} telah berhasil direkam ke dalam sistem.`,
          docUrl: result.docUrl
        });
        setCart([]);
        setFormData(prev => ({ ...prev, person_name: '' }));
        loadItems();
        if (typeof loadHistory === 'function') loadHistory();
      } else {
        console.error('Transaction failed:', result);
        setMessage({ text: `Gagal merekam transaksi: ${result.error || 'Terjadi kesalahan pada server'}`, type: 'error' });
      }
    } catch (e) {
      console.error('System error during checkout:', e);
      setMessage({ text: 'Kesalahan sistem dalam sinkronisasi data. Pastikan koneksi stabil.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans">
      <header className="mb-12">
        <h1 className="font-serif text-4xl text-slate-900 leading-tight">Layanan Peminjaman & Pengembalian</h1>
        <p className="text-slate-500 mt-2 font-light tracking-wide uppercase text-[10px]">Pusat Sirkulasi Alat & Bahan Laboratorium</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-10 overflow-hidden relative transition-all hover:shadow-xl hover:shadow-slate-200/50">
            <div className="mb-10">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Metode Pengembalian Cepat (Scan QR)</label>
              <button 
                type="button"
                onClick={startScanner}
                disabled={scanning}
                className={cn(
                  "w-full py-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 transition-all group",
                  scanning ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600"
                )}
              >
                {scanning ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Mencari QR...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Auto-Return QR Scan</span>
                  </>
                )}
              </button>
              {scanning && (
                <div className="mt-4 relative aspect-square rounded-2xl overflow-hidden bg-black border border-slate-200 shadow-xl group/scanner">
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover opacity-80" 
                    playsInline 
                    muted 
                    autoPlay
                  />
                  
                  {/* Viewfinder Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    {/* Corners */}
                    <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-emerald-500/80 rounded-tl-xl" />
                    <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-emerald-500/80 rounded-tr-xl" />
                    <div className="absolute bottom-16 left-8 w-12 h-12 border-b-4 border-l-4 border-emerald-500/80 rounded-bl-xl" />
                    <div className="absolute bottom-16 right-8 w-12 h-12 border-b-4 border-r-4 border-emerald-500/80 rounded-br-xl" />
                    
                    {/* Pulsing Guide Area */}
                    <div className="w-1/2 h-1/2 border-2 border-emerald-500/20 rounded-3xl animate-pulse-soft" />
                    
                    {/* Scanning Line */}
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-scan-line" />
                    
                    {/* Status Feedback */}
                    {scanStatus.type !== 'idle' && (
                      <div className={cn(
                        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 px-6 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-xl border-2 transition-all scale-110",
                        scanStatus.type === 'success' ? "bg-emerald-500/90 border-emerald-400 text-white shadow-lg shadow-emerald-500/40" : "bg-red-500/90 border-red-400 text-white shadow-lg shadow-red-500/40"
                      )}>
                        {scanStatus.type === 'success' ? (
                          <Check className="w-5 h-5 animate-bounce" />
                        ) : (
                          <AlertCircle className="w-5 h-5 animate-shake" />
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-widest">{scanStatus.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Camera Switcher */}
                  {videoDevices.length > 1 && (
                    <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                       <select 
                        className="flex-1 bg-black/60 text-white text-[10px] py-3 px-4 rounded-xl border border-white/10 outline-none backdrop-blur-md appearance-none hover:bg-black/80 transition-all font-bold tracking-wider"
                        value={selectedDevice}
                        onChange={(e) => {
                          setSelectedDevice(e.target.value);
                        }}
                       >
                         {videoDevices.map(device => (
                           <option key={device.deviceId} value={device.deviceId}>
                              {device.label || `Camera ${device.deviceId.substring(0, 5)}`}
                           </option>
                         ))}
                       </select>
                    </div>
                  )}

                  {/* Close Button */}
                  <button 
                    onClick={stopScanner}
                    className="absolute top-4 right-4 p-3 bg-black/50 text-white rounded-xl hover:bg-red-500/80 transition-all backdrop-blur-sm group/close"
                  >
                    <X className="w-4 h-4 group-hover/close:rotate-90 transition-transform" />
                  </button>
                  
                  {/* Scanning Info */}
                  <div className="absolute bottom-20 left-0 right-0 text-center">
                    <p className="text-[9px] font-bold text-white/60 uppercase tracking-[0.3em] animate-pulse">Scanning...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-10">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Seleksi Aksi Manual</label>
              <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                <button 
                  type="button"
                  onClick={() => {
                    setFormData({...formData, type: 'pinjam'});
                    setCart([]); // Clear cart when switching modes to avoid mixing
                  }}
                  className={cn(
                    "flex-1 py-3 text-xs font-bold rounded-xl transition-all uppercase tracking-wider",
                    formData.type === 'pinjam' ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Pinjam
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setFormData({...formData, type: 'kembali'});
                    setCart([]); // Clear cart when switching modes
                  }}
                  className={cn(
                    "flex-1 py-3 text-xs font-bold rounded-xl transition-all uppercase tracking-wider",
                    formData.type === 'kembali' ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Kembali
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Cari aset..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/10"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div className="relative">
                   <select 
                    className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-wider outline-none focus:ring-2 focus:ring-emerald-500/10 cursor-pointer pr-8"
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                   >
                     <option value="all">Semua</option>
                     {categories.map(cat => (
                       <option key={cat} value={cat}>Filt: {cat}</option>
                     ))}
                   </select>
                   <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {filteredItems.length === 0 && (search || filterCategory !== 'all') && (
                <div className="px-6 py-4 bg-amber-50 border border-amber-100 rounded-2xl text-[10px] text-amber-700 font-bold uppercase tracking-[0.1em] text-center mb-4 transition-all">
                  <p className="mb-2">Aset tidak ditemukan sesuai kriteria.</p>
                  <button 
                    onClick={() => { setSearch(''); setFilterCategory('all'); }}
                    className="text-emerald-600 hover:underline cursor-pointer"
                  >
                    Reset Filter
                  </button>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Seleksi Aset</label>
                <select 
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm appearance-none transition-all"
                  value={formData.item_code}
                  onChange={e => {
                    setFormData({...formData, item_code: e.target.value});
                    setMessage({ text: '', type: '' });
                  }}
                >
                  <option value="">{filteredItems.length === 0 ? 'Tidak ada hasil' : 'Pilih barang...'}</option>
                  {filteredItems.map(item => (
                    <option key={item.item_code} value={item.item_code}>
                      [{item.category.toUpperCase()}] {item.name.substring(0, 30)}{item.name.length > 30 ? '...' : ''} ({item.current_stock} {item.unit})
                    </option>
                  ))}
                </select>
                {formData.item_code && (
                  <p className="mt-2 text-[10px] text-emerald-600 font-bold uppercase tracking-widest italic animate-pulse">
                    Tersedia: {items.find(i => i.item_code === formData.item_code)?.current_stock} Unit
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Nama {formData.type === 'pinjam' ? 'Peminjam' : 'Pengembali'}
                </label>
                <input 
                  type="text"
                  placeholder="Masukkan nama lengkap..."
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm transition-all"
                  value={formData.person_name}
                  onChange={e => setFormData({...formData, person_name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Jumlah</label>
                <input 
                  type="number"
                  min="1"
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm transition-all"
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                />
              </div>

              <button 
                onClick={addToCart}
                disabled={!formData.item_code || !formData.person_name}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:shadow-none"
              >
                <Plus className="w-4 h-4" /> Masukkan Antrean
              </button>
            </div>
          </div>
        </div>

        {/* Right Section: List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-10 min-h-[500px] flex flex-col transition-all hover:shadow-xl hover:shadow-slate-200/50">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
              <h2 className="font-serif text-2xl text-slate-900 italic">Antrean {formData.type === 'pinjam' ? 'Peminjaman' : 'Pengembalian'}</h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cart.length} Item</span>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                <Box className="w-16 h-16 mb-4 opacity-10" />
                <p className="text-sm font-light italic">Belum ada item dalam antrean {formData.type === 'pinjam' ? 'peminjaman' : 'pengembalian'}.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-4">
                  {cart.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl group hover:bg-slate-100/50 transition-all border border-transparent hover:border-slate-200">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 font-mono text-[10px] font-bold shadow-sm">
                          {i + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-slate-900 leading-none">{c.name}</p>
                            <span className={cn(
                              "text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border",
                              c.category?.toLowerCase() === 'alat' ? "text-blue-500 border-blue-100 bg-blue-50/50" : "text-orange-500 border-orange-100 bg-orange-50/50"
                            )}>{c.category}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase font-bold">{c.item_code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-serif text-xl text-slate-900">{c.quantity}</p>
                          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2rem] leading-none">Voucher Cap</p>
                        </div>
                        <button 
                          onClick={() => removeFromCart(i)}
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <LogOut className="w-4 h-4 rotate-180" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 pt-8 border-t border-slate-50">
                  <div className="flex justify-between items-center mb-6 px-4">
                    <p className="text-xs text-slate-400 font-medium">Total Volume Aset:</p>
                    <p className="text-xl font-serif text-slate-900">{cart.reduce((acc, curr) => acc + curr.quantity, 0)} Unit</p>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    disabled={loading || !formData.person_name}
                    className="w-full bg-emerald-500 text-slate-900 py-6 rounded-[2rem] font-bold text-sm uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all shadow-2xl shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? 'Menyinkronkan Basis Data...' : `Finalisasi ${formData.type === 'pinjam' ? 'Peminjaman' : 'Pengembalian'}`}
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {message.text && (
        <div className={cn(
          "fixed bottom-8 right-8 px-8 py-5 rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-500 flex items-center gap-4 border z-50",
          message.type === 'success' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
        )}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold uppercase tracking-wider">{message.text}</p>
            {message.docUrl && (
              <a 
                href={message.docUrl} 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] bg-emerald-600 text-white px-3 py-1.5 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-500 transition-all font-bold tracking-widest mt-1"
              >
                <Printer className="w-3 h-3" /> Cetak Surat Bukti (DOCX)
              </a>
            )}
          </div>
          <button onClick={() => setMessage({text: '', type: ''})} className="ml-4 opacity-30 hover:opacity-100">
            <Plus className="w-4 h-4 rotate-45" />
          </button>
        </div>
      )}

      {/* Return Confirmation Modal */}
      {showReturnConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 p-10 text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-500 mx-auto mb-6">
              <RefreshCw className="w-10 h-10" />
            </div>
            
            <h2 className="text-2xl font-serif text-slate-900 mb-2">Konfirmasi Pengembalian</h2>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              Anda akan mengembalikan item berikut ke inventaris laboratorium:
            </p>
            
            <div className="bg-slate-50 rounded-3xl p-6 mb-8 text-left space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-widest">Barang</span>
                <span className="text-slate-900 font-bold">{showReturnConfirm.item.name}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-widest">Total Pinjaman</span>
                  <span className="text-slate-900 font-bold">{showReturnConfirm.borrowed} {showReturnConfirm.item.unit}</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-600 font-bold uppercase tracking-widest">Kembali Sekarang</span>
                  <span className="text-emerald-600 font-black">-{showReturnConfirm.qty} {showReturnConfirm.item.unit}</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-400 h-full rounded-full opacity-50" 
                    style={{ width: `${Math.min((showReturnConfirm.qty / showReturnConfirm.borrowed) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-dashed border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Sisa Pinjaman</span>
                  <span className={`font-bold text-sm ${showReturnConfirm.borrowed - showReturnConfirm.qty === 0 ? 'text-blue-600' : 'text-slate-900'}`}>
                    {showReturnConfirm.borrowed - showReturnConfirm.qty} {showReturnConfirm.item.unit}
                    {showReturnConfirm.borrowed - showReturnConfirm.qty === 0 && (
                      <span className="ml-2 text-[8px] bg-blue-100 px-2 py-0.5 rounded-full align-middle">LUNAS</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowReturnConfirm(null)}
                className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-[10px] tracking-widest uppercase hover:bg-slate-200 transition-all font-sans"
              >
                Batal
              </button>
              <button 
                onClick={addToCart}
                className="py-4 bg-emerald-600 text-white rounded-2xl font-bold text-[10px] tracking-widest uppercase hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 font-sans"
              >
                Ya, Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Checkout Confirmation Modal */}
      {showCheckoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 p-10 text-center border border-slate-100">
            <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-500 mx-auto mb-6 shadow-inner">
              <ClipboardCheck className="w-10 h-10" />
            </div>
            
            <h2 className="text-2xl font-serif text-slate-900 mb-2">Finalisasi Transaksi</h2>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              Anda akan memproses <span className="font-bold text-slate-900">{cart.length} item</span> {formData.type === 'pinjam' ? 'peminjaman' : 'pengembalian'} untuk <span className="font-bold text-slate-900">{formData.person_name}</span>.
            </p>
            
            <div className="bg-slate-50 rounded-3xl p-6 mb-8 text-left space-y-3">
               <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 border-b border-slate-200 pb-2">
                 <span>Item</span>
                 <span>Jumlah</span>
               </div>
               <div className="max-h-[120px] overflow-y-auto space-y-2 pr-2">
                 {cart.map((item, idx) => (
                   <div key={idx} className="flex justify-between items-center text-xs">
                     <span className="text-slate-600 truncate max-w-[200px]">{item.name}</span>
                     <span className="text-slate-900 font-bold whitespace-nowrap">{item.quantity} Unit</span>
                   </div>
                 ))}
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowCheckoutConfirm(false)}
                className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-[10px] tracking-widest uppercase hover:bg-slate-200 transition-all font-sans"
              >
                Tinjau Ulang
              </button>
              <button 
                onClick={executeCheckout}
                className="py-4 bg-slate-900 text-white rounded-2xl font-bold text-[10px] tracking-widest uppercase hover:bg-emerald-600 transition-all shadow-lg shadow-slate-900/10 font-sans"
              >
                Kirim Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Confirmation Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 p-10 text-center border border-slate-100">
            <div className={`w-20 h-20 ${showSuccessModal.type === 'pinjam' ? 'bg-slate-50 text-slate-900' : 'bg-emerald-50 text-emerald-500'} rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner`}>
              {showSuccessModal.type === 'pinjam' ? <LogOut className="w-10 h-10" /> : <RefreshCw className="w-10 h-10" />}
            </div>
            
            <h2 className="text-2xl font-serif text-slate-900 mb-2">
              Berhasil {showSuccessModal.type === 'pinjam' ? 'Diproses' : 'Dikembalikan'}
            </h2>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              {showSuccessModal.message}
            </p>
            
            <div className="space-y-4">
              {showSuccessModal.docUrl && (
                <a 
                  href={showSuccessModal.docUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-[10px] tracking-widest uppercase hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 font-sans"
                >
                  <Printer className="w-4 h-4" /> Cetak Surat Bukti (DOCX)
                </a>
              )}
              
              <button 
                onClick={() => setShowSuccessModal(null)}
                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-[10px] tracking-widest uppercase hover:bg-slate-200 transition-all font-sans"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const HistoryPage = ({ user }: { user: User | null }) => {
  const [history, setHistory] = useState<TransactionHistory[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<TransactionHistory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportParams, setReportParams] = useState({ personName: '', itemName: '', type: '' });
  const [searchParams, setSearchParams] = useState({ personName: '', itemName: '', type: '' });
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [deletingLog, setDeletingLog] = useState<TransactionHistory | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isAdmin = user?.role === 'admin';

  const fetchHistory = () => {
    fetch('/api/history')
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.error || 'Server error'); });
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setHistory(data);
          setFilteredHistory(data);
          setError(null);
        } else {
          throw new Error('Format data riwayat tidak valid');
        }
      })
      .catch(err => {
        console.error('Failed to fetch history', err);
        setError(err.message);
        setHistory([]);
        setFilteredHistory([]);
      });
  };

  useEffect(() => {
    fetchHistory();

    // Fetch Items for reference
    fetch('/api/items')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setItems(data);
        }
      });
  }, []);

  const handleSearch = () => {
    setSearchParams(reportParams);
    let filtered = [...history];
    
    if (reportParams.personName) {
      const term = reportParams.personName.toLowerCase();
      filtered = filtered.filter(item => 
        item.person_name && item.person_name.toLowerCase().includes(term)
      );
    }

    if (reportParams.itemName) {
      const term = reportParams.itemName.toLowerCase();
      filtered = filtered.filter(item => 
        item.item_name && item.item_name.toLowerCase().includes(term)
      );
    }
    
    if (reportParams.type) {
      filtered = filtered.filter(item => item.type === reportParams.type);
    }
    
    setFilteredHistory(filtered);
  };

  const handleDeleteHistory = async () => {
    if (!deletingLog) return;
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/history/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingLog.id })
      });
      if (res.ok) {
        setDeletingLog(null);
        fetchHistory();
      } else {
        const result = await res.json();
        alert(result.error || 'Gagal menghapus riwayat');
      }
    } catch (e) {
      alert('Kesalahan sistem saat menghapus riwayat');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRowClick = (itemCode: string) => {
    const item = items.find(i => i.item_code === itemCode);
    if (item) {
      setSelectedItem(item);
    }
  };

  const handleGenerateReport = async () => {
    setReportLoading(true);
    setReportUrl(null);
    try {
      const res = await fetch(`/api/reports/generate?transactionType=${reportParams.type}&personName=${reportParams.personName}`);
      const result = await res.json();
      if (res.ok) {
        setReportUrl(result.url);
      } else {
        alert(result.error || 'Gagal membuat laporan');
      }
    } catch (e) {
      alert('Kesalahan sistem saat membuat laporan');
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="font-sans">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-serif text-4xl text-slate-900 leading-tight">Arsip Riwayat Layanan</h1>
          <p className="text-slate-500 mt-2 font-light tracking-wide uppercase text-[10px]">Log Aktivitas & Jejak Digital Sirkulasi Aset</p>
        </div>
        
        {error && (
          <div className="flex-1 max-w-md bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="w-5 h-5" />
            <div className="text-xs">
              <p className="font-bold uppercase tracking-wider mb-0.5">Kesalahan Sistem</p>
              <p className="opacity-80">{error}</p>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Peminjam</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Nama peminjam..."
                  className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 w-40"
                  value={reportParams.personName}
                  onChange={e => setReportParams({...reportParams, personName: e.target.value})}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nama Barang</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Cari barang..."
                  className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 w-40"
                  value={reportParams.itemName}
                  onChange={e => setReportParams({...reportParams, itemName: e.target.value})}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tipe</label>
              <select 
                className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={reportParams.type}
                onChange={e => setReportParams({...reportParams, type: e.target.value})}
              >
                <option value="">Semua Tipe</option>
                <option value="pinjam">Peminjaman</option>
                <option value="kembali">Pengembalian</option>
              </select>
            </div>
            
            <div className="flex items-end self-stretch pt-4 md:pt-0">
              <button 
                onClick={handleSearch}
                className="h-10 px-6 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20"
              >
                <Search className="w-3 h-3" /> Cari
              </button>
            </div>

            {isAdmin && (
              <div className="flex items-end self-stretch pt-4 md:pt-0 border-l border-slate-100 pl-4">
                {reportUrl ? (
                  <a 
                    href={reportUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="h-10 px-6 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                  >
                    <Printer className="w-3 h-3" /> Buka Laporan
                  </a>
                ) : (
                  <button 
                    onClick={handleGenerateReport}
                    disabled={reportLoading}
                    className="h-10 px-6 bg-slate-100 text-slate-900 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-slate-200 transition-all disabled:opacity-50"
                  >
                    {reportLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-ping"></span>
                        Working...
                      </span>
                    ) : (
                      <>
                        <FileText className="w-3 h-3" /> Rekapitulasi
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-x-auto transition-all hover:shadow-xl hover:shadow-slate-200/50">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Waktu & Tanggal</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Operator</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Identitas Barang</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Status</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Nama Peminjam</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-right pr-12">Volume</th>
              {isAdmin && <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {Array.isArray(filteredHistory) && filteredHistory.map((log) => (
              <tr 
                key={log.id} 
                className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
              >
                <td className="px-6 py-5 whitespace-nowrap" onClick={() => handleRowClick(log.item_code)}>
                  <div className="flex flex-col">
                    <span className="text-slate-900 text-sm font-medium">{new Date(log.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    <span className="text-xs text-slate-400 font-mono font-bold tracking-tighter uppercase">{new Date(log.timestamp).toLocaleTimeString('id-ID')}</span>
                  </div>
                </td>
                <td className="px-6 py-5" onClick={() => handleRowClick(log.item_code)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
                      {log.username[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-slate-900 whitespace-nowrap">{log.username}</span>
                  </div>
                </td>
                <td className="px-6 py-5 text-sm text-slate-700 font-medium" onClick={() => handleRowClick(log.item_code)}>{log.item_name}</td>
                <td className="px-6 py-5 text-sm whitespace-nowrap" onClick={() => handleRowClick(log.item_code)}>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block border",
                    log.type === 'pinjam' ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                  )}>
                    {log.type === 'pinjam' ? 'Peminjaman Out' : 'Pengembalian In'}
                  </span>
                </td>
                <td className="px-6 py-5 text-sm text-slate-700 font-medium whitespace-nowrap" onClick={() => handleRowClick(log.item_code)}>{log.person_name || '-'}</td>
                <td className="px-6 py-5 text-right pr-12" onClick={() => handleRowClick(log.item_code)}>
                  <span className="text-sm font-bold text-slate-900">{log.quantity}</span>
                </td>
                {isAdmin && (
                  <td className="px-6 py-5 text-center">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingLog(log);
                      }}
                      className="w-10 h-10 rounded-xl bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all flex items-center justify-center shadow-sm"
                      title="Hapus Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {filteredHistory.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="px-10 py-20 text-center text-slate-300 italic font-light">Tidak menemukan rekaman riwayat yang sesuai dengan pencarian Anda.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="relative h-64 bg-slate-100">
              {selectedItem.image_url ? (
                <img 
                  src={getGoogleDriveImageUrl(selectedItem.image_url)} 
                  className="w-full h-full object-cover"
                  alt={selectedItem.name}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <ImageIcon className="w-20 h-20" />
                </div>
              )}
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-6 right-6 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:rotate-90 transition-all duration-300"
              >
                <X className="w-5 h-5 text-slate-900" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-slate-900/80 to-transparent">
                <span className="px-4 py-1.5 bg-emerald-500 text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-3 inline-block">
                  {selectedItem.category}
                </span>
                <h2 className="text-3xl font-serif text-white">{selectedItem.name}</h2>
              </div>
            </div>
            
            <div className="p-10 grid grid-cols-2 gap-8 bg-white">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Kode Inventaris</label>
                  <p className="text-lg font-mono font-bold text-slate-900 tracking-tight">{selectedItem.item_code}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Lokasi Penyimpanan</label>
                  <div className="flex items-center gap-2 text-slate-700">
                    <HomeIcon className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium">{selectedItem.location || 'Tidak ditentukan'}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-[2rem] p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Tersedia</label>
                    <p className="text-3xl font-serif text-slate-900 leading-none">{selectedItem.current_stock}</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200"></div>
                  <div className="text-center flex-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Total</label>
                    <p className="text-3xl font-serif text-slate-900 leading-none">{selectedItem.total_stock}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-500">Kapasitas Stok</span>
                    <span className="font-bold text-slate-900">{Math.round((selectedItem.current_stock / selectedItem.total_stock) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-500",
                        (selectedItem.current_stock / selectedItem.total_stock) < 0.2 ? "bg-red-500" : "bg-emerald-500"
                      )}
                      style={{ width: `${(selectedItem.current_stock / selectedItem.total_stock) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-10 pb-10 bg-white">
              <button 
                onClick={() => setSelectedItem(null)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm tracking-widest uppercase hover:bg-emerald-600 transition-all shadow-xl shadow-slate-900/10"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 p-10 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-500 mx-auto mb-6">
              <Trash2 className="w-10 h-10" />
            </div>
            
            <h2 className="text-2xl font-serif text-slate-900 mb-2">Hapus Rekaman Riwayat?</h2>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              Anda akan menghapus rekaman transaksi berikut secara permanen:
            </p>
            
            <div className="bg-slate-50 rounded-3xl p-6 mb-8 text-left space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-widest">Aset</span>
                <span className="text-slate-900 font-bold">{deletingLog.item_name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-widest">Jumlah</span>
                <span className="text-slate-900 font-bold">{deletingLog.quantity} Unit</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-widest">Tipe</span>
                <span className={cn(
                  "font-bold uppercase tracking-widest",
                  deletingLog.type === 'pinjam' ? "text-red-600" : "text-emerald-600"
                )}>
                  {deletingLog.type === 'pinjam' ? 'Peminjaman' : 'Pengembalian'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-dashed border-slate-200 pt-3">
                <span className="text-slate-400 font-bold uppercase tracking-widest">Peminjam</span>
                <span className="text-slate-900 font-bold">{deletingLog.person_name || '-'}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setDeletingLog(null)}
                className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-[10px] tracking-widest uppercase hover:bg-slate-200 transition-all"
              >
                Batal
              </button>
              <button 
                onClick={handleDeleteHistory}
                disabled={deleteLoading}
                className="py-4 bg-red-600 text-white rounded-2xl font-bold text-[10px] tracking-widest uppercase hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {deleteLoading ? 'Menghapus...' : 'Ya, Hapus Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main App ---

const SettingsPage = () => {
  const { settings, updateSettings } = useContext(SettingsContext);
  const [formData, setFormData] = useState<Settings>(settings);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSyncStructure = async () => {
    setSyncLoading(true);
    setMsg({ text: '', type: '' });
    try {
      const res = await fetch('/api/sync-structure', { method: 'POST' });
      const result = await res.json();
      if (res.ok) {
        setMsg({ text: 'Struktur database berhasil disinkronisasi (Kolom Status aktif).', type: 'success' });
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setMsg({ text: `Gagal sinkronisasi: ${err.message}`, type: 'error' });
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateSettings(formData);
      setMsg({ text: 'Identitas visual berhasil diperbarui.', type: 'success' });
    } catch (err) {
      setMsg({ text: 'Gagal sinkronisasi identitas visual.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans max-w-2xl">
      <header className="mb-12">
        <h1 className="font-serif text-4xl text-slate-900 leading-tight">Konfigurasi Identitas</h1>
        <p className="text-slate-500 mt-2 font-light tracking-wide uppercase text-[10px]">Personalisasi Aset Visual & Branding Institusi</p>
      </header>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-12 transition-all hover:shadow-xl hover:shadow-slate-200/50">
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="group">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Aset Logo Institusi</label>
            <div className="flex gap-6 items-center">
              <div className="flex-1">
                <input 
                  required
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                  value={formData.logo_url}
                  onChange={e => setFormData({...formData, logo_url: e.target.value})}
                  placeholder="https://drive.google.com/file/d/..."
                />
                <p className="mt-2 text-[8px] text-slate-400 italic">Disarankan menggunakan format PNG transparan untuk hasil optimal.</p>
              </div>
              <div className="w-20 h-20 rounded-2xl bg-white border border-slate-100 flex items-center justify-center p-3 shadow-inner overflow-hidden group-hover:scale-105 transition-transform">
                <img src={getGoogleDriveImageUrl(formData.logo_url)} alt="Preview Logo" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>

          <div className="group">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Aset Latar Belakang (Portal)</label>
            <div className="flex gap-6 items-center">
              <div className="flex-1">
                <input 
                  required
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                  value={formData.bg_url}
                  onChange={e => setFormData({...formData, bg_url: e.target.value})}
                  placeholder="https://drive.google.com/file/d/..."
                />
                <p className="mt-2 text-[8px] text-slate-400 italic">Gunakan resolusi minimal High Definition (1920x1080).</p>
              </div>
              <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-100 flex items-center justify-center shadow-inner overflow-hidden group-hover:scale-105 transition-transform">
                <img src={getGoogleDriveImageUrl(formData.bg_url)} alt="Preview BG" className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>

          <div className="group border-t border-slate-100 pt-10">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Ambang Batas Stok per Kategori</label>
            <div className="space-y-4">
              {(formData.category_thresholds || []).map((ct, idx) => (
                <div key={idx} className="flex gap-4 items-center animate-in slide-in-from-left duration-300">
                  <div className="flex-[2]">
                    <input 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/10 text-xs font-bold"
                      value={ct.category}
                      onChange={e => {
                        const newThresholds = [...(formData.category_thresholds || [])];
                        newThresholds[idx].category = e.target.value;
                        setFormData({...formData, category_thresholds: newThresholds});
                      }}
                      placeholder="Nama Kategori (misal: Alat)"
                    />
                  </div>
                  <div className="flex-1 flex gap-2 items-center">
                    <input 
                      type="number"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/10 text-xs text-center font-mono"
                      value={ct.min_stock}
                      onChange={e => {
                        const newThresholds = [...(formData.category_thresholds || [])];
                        newThresholds[idx].min_stock = parseInt(e.target.value) || 0;
                        setFormData({...formData, category_thresholds: newThresholds});
                      }}
                    />
                    <span className="text-[10px] font-bold text-slate-400">MIN</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      const newThresholds = (formData.category_thresholds || []).filter((_, i) => i !== idx);
                      setFormData({...formData, category_thresholds: newThresholds});
                    }}
                    className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button 
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData, 
                    category_thresholds: [...(formData.category_thresholds || []), { category: '', min_stock: 0 }]
                  });
                }}
                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:border-emerald-500 hover:text-emerald-500 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-3 h-3" /> Tambah Kategori
              </button>
            </div>
            <p className="mt-4 text-[8px] text-slate-400 italic">Nilai ini akan menjadi default minimum stock saat pendaftaran aset baru berdasarkan kategorinya.</p>
          </div>

          {msg.text && (
            <div className={cn(
              "px-8 py-5 rounded-3xl text-[10px] font-bold uppercase tracking-widest animate-in fade-in duration-500",
              msg.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
            )}>
              {msg.text}
            </div>
          )}

          <div className="pt-4 flex flex-col gap-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-bold text-xs uppercase tracking-[0.3em] hover:bg-emerald-600 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Sinkronisasi...' : 'Terapkan Perubahan'}
            </button>

            <button 
              type="button"
              onClick={handleSyncStructure}
              disabled={syncLoading}
              className="w-full bg-slate-100 text-slate-600 py-5 rounded-[2rem] font-bold text-xs uppercase tracking-[0.3em] hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center justify-center gap-3 border border-slate-200"
            >
              <RefreshCw className={cn("w-4 h-4", syncLoading && "animate-spin")} />
              {syncLoading ? 'Sinkronisasi Struktur...' : 'Sync Database Structure'}
            </button>
          </div>
        </form>
      </div>

      <UserManagement />
    </div>
  );
};

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        console.error('Data received from /api/users is not an array:', data);
        setUsers([]);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateStatus = async (userId: string, status: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch('/api/users/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status }),
      });
      if (res.ok) {
        await fetchUsers();
      }
    } catch (err) {
      console.error('Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="flex justify-center p-12 text-slate-400">Memuat data pengguna...</div>;

  return (
    <div className="mt-12 pt-12 border-t border-slate-100">
      <header className="mb-8">
        <h2 className="font-serif text-2xl text-slate-900">Manajemen Pengguna</h2>
        <p className="text-slate-500 mt-2 font-light tracking-wide uppercase text-[10px]">Verifikasi & Otorisasi Akun Baru</p>
      </header>

      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Username</th>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Array.isArray(users) && users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-5 text-sm font-medium text-slate-900">{u.username}</td>
                <td className="px-8 py-5">
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                    {u.role}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    u.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                  )}>
                    {u.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  {u.role !== 'admin' && (
                    u.status === 'pending' ? (
                      <button 
                        onClick={() => handleUpdateStatus(u.id, 'active')}
                        disabled={actionLoading === u.id}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-2 ml-auto"
                      >
                        {actionLoading === u.id ? 'Loading...' : <>Approve Access <Check className="w-3 h-3" /></>}
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleUpdateStatus(u.id, 'pending')}
                        disabled={actionLoading === u.id}
                        className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-300 disabled:opacity-50 transition-all flex items-center gap-2 ml-auto"
                      >
                        {actionLoading === u.id ? 'Loading...' : <>Suspend Access <X className="w-3 h-3" /></>}
                      </button>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function App() {
  const [settings, setSettings] = useState<Settings>({ logo_url: '', bg_url: '' });

  const refreshSettings = () => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setSettings(data);
      });
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const updateSettings = async (newSettings: Settings) => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    });
    if (res.ok) {
      setSettings(newSettings);
    } else {
      throw new Error('Gagal update settings');
    }
  };

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, refreshSettings }}>
      <Router>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/home" /> : <LoginPage onLogin={handleLogin} />} />
          
          <Route path="/home" element={user ? <HomePage /> : <Navigate to="/login" />} />
          <Route path="/sop" element={user ? <SOPPage user={user} /> : <Navigate to="/login" />} />
          
          <Route path="/inventory/*" element={
            user ? (
              <InventoryLayout user={user}>
                <Routes>
                  <Route path="master" element={<MasterInventory user={user} />} />
                  <Route path="transaction" element={<TransactionPage user={user} />} />
                  <Route path="history" element={<HistoryPage user={user} />} />
                  <Route path="settings" element={user.role === 'admin' ? <SettingsPage /> : <Navigate to="../master" />} />
                  <Route path="*" element={<Navigate to="master" />} />
                </Routes>
              </InventoryLayout>
            ) : <Navigate to="/login" />
          } />

          <Route path="/" element={<Navigate to={user ? "/home" : "/login"} />} />
        </Routes>
      </Router>
    </SettingsContext.Provider>
  );
}
