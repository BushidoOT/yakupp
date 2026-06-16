// js/app.js

const STORAGE_KEY = "cam_mesaha_kayitlari_v1";
const SETTINGS_KEY = "cam_mesaha_ayarlar_v1";
const USER_STORE_KEY = "mesaha_kullanicilar_v1";
const ADMIN_CODE = "4767";

const PRODUCT_MAP = {
  "Tomruk": { odunId: 1, odunAdi: "Tomruk", shortName: "Tomruk" },
  "Tel Direk": { odunId: 2, odunAdi: "Tel Direği", shortName: "Tel" },
  "Maden Direk": { odunId: 3, odunAdi: "Maden Direği", shortName: "Maden" },
  "Sanayi Odunu": { odunId: 4, odunAdi: "Sanayi Odunu", shortName: "Sanayi" },
  "Kağıtlık": { odunId: 5, odunAdi: "Kağıtlık Odun", shortName: "Kağıtlık" }
};

const state = {
  records: [],
  settings: {},
  userStore: { activeUserId: "", users: [] }
};

// --- YARDIMCI FONKSİYONLAR ---
const $ = (id) => document.getElementById(id);

function showToast(message) {
  const toast = $('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// --- TEMA (DARK/LIGHT) ---
function applyTheme(mode) {
  const isDark = mode === "dark";
  document.body.classList.toggle("theme-dark", isDark);
  document.documentElement.classList.toggle("theme-dark", isDark);
  localStorage.setItem("mesaha_theme_v1", isDark ? "dark" : "light");
  const btn = $('themeToggleV112');
  if(btn) btn.textContent = isDark ? "☀️ Aydınlık" : "🌙 Karanlık";
}

$('themeToggleV112')?.addEventListener('click', () => {
  const current = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
  applyTheme(current);
});

// --- YENİ KAYIT MANTIĞI ---
function calculateDesi(diameter, length, quantity = 1) {
  const d = Number(diameter), l = Number(length), q = Number(quantity);
  if (!d || !l || !q) return 0;
  return Math.round(0.00007854 * d * d * l * 1000 * q);
}

$('entryForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const barcode = $('barcode').value.trim();
  const diameter = Number($('diameter').value);
  const length = Number($('length').value);
  const quantity = Number($('quantity').value || 1);
  const productType = $('productType').value || "Tomruk";

  if (!barcode || barcode.length < 9) return showToast("Geçerli bir barkod giriniz (Min 9 karakter).");
  if (!diameter || !length) return showToast("Boy ve Çap alanları zorunludur.");

  const record = {
    id: String(Date.now()),
    barcode,
    diameter,
    length,
    quantity,
    productType,
    desi: calculateDesi(diameter, length, quantity),
    productionDate: $('productionDate').value || todayISO()
  };

  state.records.unshift(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
  
  $('diameter').value = ""; // Çapı temizle, boy kalsın
  showToast("Kayıt başarıyla eklendi.");
  renderRecords();
});

// --- EXCEL OLUŞTURMA (Dışarıdaki Base64 Değişkenleri ile) ---
$('exportSystemXlsBtn')?.addEventListener('click', () => {
    if (!state.records.length) return showToast("İndirilecek kayıt yok.");
    
    // NOT: s12MakeSystemXls fonksiyonu excel-templates.js içinden gelecek.
    if(typeof s12MakeSystemXls !== "undefined") {
        const xlsBytes = s12MakeSystemXls(state.records);
        const blob = new Blob([xlsBytes], { type: "application/vnd.ms-excel" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Mesaha_${Date.now()}.xls`;
        a.click();
        showToast("Excel dosyası indirildi.");
    } else {
        showToast("Excel kütüphanesi yüklenemedi!");
    }
});

// --- INIT (AÇILIŞ) ---
window.onload = () => {
  state.records = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  applyTheme(localStorage.getItem("mesaha_theme_v1") || "light");
  $('productionDate').value = todayISO();
  renderRecords();
};

function renderRecords() {
    // Kayıt listesi render işlemleri...
    $('recordCount').textContent = `${state.records.length} kayıt`;
}
