import os
import glob
import json
import hashlib
import uuid
import pandas as pd
import streamlit as st

st.set_page_config(
    page_title="Depo Radarı v30",
    page_icon="🌲",
    layout="wide",
    initial_sidebar_state="expanded"
)

CSV_DOSYA = "depo_radari_temiz_v6.csv"
CSV_ONCELIKLI_DOSYALAR = [
    "depo_radari_turkiye_tum_ihaleler.csv",
        "depo_radari_tum_ihaleler_guvenli_v3.csv",
    "depo_radari_tum_ihaleler_guvenli_v2.csv",
    "depo_radari_tum_ihaleler_guvenli.csv",
    "depo_radari_temiz_v6.csv",
    "depo_radari_temiz_v5.csv",
]

OZET_DOSYASI = "depo_radari_ozet.json"

st.markdown(
    """
    <style>
    .block-container {
        padding-top: 1.2rem;
        padding-bottom: 2rem;
    }
    .hero {
        border-radius: 20px;
        padding: 22px 26px;
        margin-bottom: 18px;
        background: linear-gradient(135deg, rgba(25, 90, 60, .24), rgba(30, 30, 30, .05));
        border: 1px solid rgba(150,150,150,.25);
    }
    .hero-title {
        font-size: 38px;
        font-weight: 900;
        margin-bottom: 4px;
    }
    .hero-sub {
        font-size: 16px;
        opacity: .80;
        margin-bottom: 0px;
    }
    .small-note {
        font-size: 13px;
        opacity: .72;
        margin-top: 8px;
    }
    .result-card {
        border: 1px solid rgba(150,150,150,.22);
        border-radius: 18px;
        padding: 16px 18px;
        margin-bottom: 14px;
        background: rgba(255,255,255,.035);
    }
    .result-title {
        font-size: 18px;
        font-weight: 850;
        margin-bottom: 8px;
    }
    .badge {
        display: inline-block;
        border: 1px solid rgba(150,150,150,.32);
        border-radius: 999px;
        padding: 4px 9px;
        margin-right: 5px;
        margin-bottom: 8px;
        font-size: 12px;
    }
    .score-badge {
        display: inline-block;
        border-radius: 999px;
        padding: 5px 11px;
        margin-right: 6px;
        margin-bottom: 8px;
        font-size: 12px;
        font-weight: 900;
        background: rgba(46, 204, 113, .16);
        border: 1px solid rgba(46, 204, 113, .50);
    }
    .price {
        font-size: 27px;
        font-weight: 900;
        margin-top: 5px;
        margin-bottom: 6px;
    }
    .mini {
        font-size: 13px;
        opacity: .84;
        line-height: 1.6;
    }
    .warn {
        display: inline-block;
        padding: 4px 9px;
        border-radius: 999px;
        border: 1px solid rgba(255, 193, 7, .55);
        background: rgba(255, 193, 7, .13);
        font-size: 12px;
        font-weight: 800;
        margin-left: 6px;
    }

    .product-board {
        border: 1px solid rgba(150,150,150,.20);
        border-radius: 16px;
        padding: 12px 14px;
        background: rgba(255,255,255,.032);
        min-height: 132px;
        margin-bottom: 10px;
        border-left-width: 7px;
    }
    .product-board-title {
        font-size: 13px;
        opacity: .82;
        margin-bottom: 6px;
        font-weight: 850;
    }
    .product-board-main {
        font-size: 17px;
        font-weight: 900;
        line-height: 1.25;
    }
    .product-board-sub {
        font-size: 12.5px;
        opacity: .82;
        margin-top: 7px;
        line-height: 1.45;
    }
    .urun-tomruk {
        border-left-color: #f1c40f;
        background: linear-gradient(135deg, rgba(241,196,15,.14), rgba(255,255,255,.025));
    }
    .urun-maden {
        border-left-color: #3498db;
        background: linear-gradient(135deg, rgba(52,152,219,.14), rgba(255,255,255,.025));
    }
    .urun-kagitlik {
        border-left-color: #e74c3c;
        background: linear-gradient(135deg, rgba(231,76,60,.14), rgba(255,255,255,.025));
    }
    .urun-sanayi {
        border-left-color: #2ecc71;
        background: linear-gradient(135deg, rgba(46,204,113,.14), rgba(255,255,255,.025));
    }
    .urun-dikili {
        border-left-color: #9b59b6;
        background: linear-gradient(135deg, rgba(155,89,182,.14), rgba(255,255,255,.025));
    }
    .urun-genel {
        border-left-color: #95a5a6;
        background: linear-gradient(135deg, rgba(149,165,166,.14), rgba(255,255,255,.025));
    }
    .compact-note {
        font-size: 13px;
        opacity: .74;
        margin-top: -4px;
        margin-bottom: 10px;
    }
    .price-status {
        display: inline-block;
        border-radius: 999px;
        padding: 4px 9px;
        margin-right: 6px;
        margin-bottom: 8px;
        font-size: 12px;
        font-weight: 850;
        border: 1px solid rgba(150,150,150,.32);
        background: rgba(255,255,255,.04);
    }

    .topbox {
        border: 1px solid rgba(150,150,150,.22);
        border-radius: 16px;
        padding: 13px 14px;
        background: rgba(255,255,255,.035);
        min-height: 126px;
    }
    .topbox-title {
        font-size: 13px;
        opacity: .76;
        margin-bottom: 6px;
    }
    .topbox-main {
        font-size: 19px;
        font-weight: 850;
        line-height: 1.25;
    }
    .topbox-sub {
        font-size: 13px;
        opacity: .78;
        margin-top: 8px;
        line-height: 1.45;
    }



    .watch-card {
        border: 1px solid rgba(150,150,150,.22);
        border-radius: 16px;
        padding: 12px 14px;
        background: rgba(255,255,255,.035);
        margin-bottom: 10px;
    }
    .watch-title {
        font-size: 15px;
        font-weight: 900;
        margin-bottom: 5px;
    }
    .watch-sub {
        font-size: 13px;
        opacity: .82;
        line-height: 1.45;
    }



    .new-record-card {
        border: 1px solid rgba(52, 152, 219, .45);
        border-radius: 16px;
        padding: 13px 15px;
        background: rgba(52, 152, 219, .10);
        margin-bottom: 10px;
    }
    .new-record-title {
        font-size: 16px;
        font-weight: 900;
        margin-bottom: 6px;
    }
    .new-record-sub {
        font-size: 13px;
        opacity: .84;
        line-height: 1.45;
    }

    .alarm-center-card {
        border: 1px solid rgba(46, 204, 113, .45);
        border-radius: 16px;
        padding: 13px 15px;
        background: rgba(46, 204, 113, .10);
        margin-bottom: 10px;
    }
    .alarm-center-title {
        font-size: 16px;
        font-weight: 900;
        margin-bottom: 6px;
    }
    .alarm-center-sub {
        font-size: 13px;
        opacity: .84;
        line-height: 1.45;
    }

    .alarm-on {
        display: inline-block;
        border-radius: 999px;
        padding: 5px 10px;
        margin-top: 8px;
        font-size: 12px;
        font-weight: 900;
        border: 1px solid rgba(46, 204, 113, .65);
        background: rgba(46, 204, 113, .18);
    }
    .alarm-off {
        display: inline-block;
        border-radius: 999px;
        padding: 5px 10px;
        margin-top: 8px;
        font-size: 12px;
        font-weight: 900;
        border: 1px solid rgba(255, 193, 7, .55);
        background: rgba(255, 193, 7, .10);
    }

    .watch-hit {
        display: inline-block;
        border-radius: 999px;
        padding: 4px 9px;
        margin-top: 7px;
        font-size: 12px;
        font-weight: 850;
        border: 1px solid rgba(46, 204, 113, .50);
        background: rgba(46, 204, 113, .13);
    }

    .package-card {
        border: 1px solid rgba(150,150,150,.22);
        border-radius: 16px;
        padding: 13px 15px;
        background: rgba(255,255,255,.035);
        margin-bottom: 12px;
    }
    .package-title {
        font-size: 15px;
        font-weight: 900;
        margin-bottom: 5px;
    }
    .package-sub {
        font-size: 13px;
        opacity: .80;
        line-height: 1.45;
    }
    .locked-card {
        border: 1px dashed rgba(255, 193, 7, .55);
        border-radius: 16px;
        padding: 14px 16px;
        background: rgba(255, 193, 7, .08);
        margin-bottom: 12px;
    }
    .locked-title {
        font-size: 16px;
        font-weight: 900;
        margin-bottom: 5px;
    }
    .locked-sub {
        font-size: 13px;
        opacity: .82;
        line-height: 1.5;
    }

    .updatebox {
        border: 1px solid rgba(150,150,150,.22);
        border-radius: 16px;
        padding: 14px 16px;
        background: rgba(255,255,255,.035);
        margin-bottom: 12px;
    }
    .updatebox-title {
        font-size: 14px;
        opacity: .76;
        margin-bottom: 5px;
    }
    .updatebox-main {
        font-size: 18px;
        font-weight: 850;
    }
    .updatebox-sub {
        font-size: 13px;
        opacity: .78;
        margin-top: 6px;
        line-height: 1.45;
    }

    div[data-testid="stMetricValue"] {
        font-size: 28px;
    }
    </style>
    """,
    unsafe_allow_html=True
)

st.markdown(
    """
    <div class="hero">
        <div class="hero-title">🌲 Depo Radarı</div>
        <p class="hero-sub">Tomruk, maden direği, kağıtlık odun ve diğer emvaller için filtreli ihale takip ekranı.</p>
        <p class="small-note">Bu sürüm Türkiye geneli CSV dosyasını öncelikli okur. v30: arama kutusuna parti no yazınca da sonuç getirir.nı okur. v28: GitHub Actions günlük veri güncelleme altyapısı hazırlandı.</p>
    </div>
    """,
    unsafe_allow_html=True
)




LISANS_DOSYASI = "depo_radari_lisanslar.txt"
TAKIP_DOSYASI = "depo_radari_takip_listesi.json"

def guvenli_dosya_eki(text: str) -> str:
    text = str(text or "").strip()

    if not text:
        text = "varsayilan"

    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def takip_kullanici_kodu_al() -> str:
    """
    Public yayında herkesin aynı takip listesini görmemesi için takip listesi
    kullanıcı koduna göre ayrılır.

    V27 düzeltmesi:
    Bu sidebar input sadece ana akışta bir kez çizilir.
    Alt fonksiyonlar tekrar text_input oluşturmaya çalışmaz.
    """
    if "takip_oturum_kodu_v27" not in st.session_state:
        st.session_state["takip_oturum_kodu_v27"] = "misafir-" + str(uuid.uuid4())[:8]

    st.sidebar.markdown("### 📌 Takip")

    kod = st.sidebar.text_input(
        "Takip kodu",
        value=st.session_state.get("takip_kullanici_kodu_v27", ""),
        placeholder="Örn: yakup veya firma kodu",
        help="Aynı takipleri tekrar görmek için aynı kodu gir. Boş kalırsa geçici misafir takip listesi kullanılır.",
        key="takip_kullanici_kodu_v27",
    )

    kod = str(kod or "").strip()

    if not kod:
        kod = st.session_state["takip_oturum_kodu_v27"]
        st.sidebar.caption("Geçici misafir takip listesi aktif.")
    else:
        st.sidebar.caption("Bu koda özel takip listesi aktif.")

    st.session_state["aktif_takip_kodu_v27"] = kod
    st.session_state["aktif_takip_dosyasi_v27"] = f"depo_radari_takip_listesi_{guvenli_dosya_eki(kod)}.json"

    return kod


def takip_dosyasi_yolu() -> str:
    """
    Takip dosya yolunu döndürür.
    Burada sidebar text_input oluşturulmaz; böylece Streamlit duplicate widget hatası oluşmaz.
    """
    dosya = st.session_state.get("aktif_takip_dosyasi_v27")

    if dosya:
        return dosya

    if "takip_oturum_kodu_v27" not in st.session_state:
        st.session_state["takip_oturum_kodu_v27"] = "misafir-" + str(uuid.uuid4())[:8]

    kod = st.session_state.get("aktif_takip_kodu_v27", st.session_state["takip_oturum_kodu_v27"])
    dosya = f"depo_radari_takip_listesi_{guvenli_dosya_eki(kod)}.json"

    st.session_state["aktif_takip_kodu_v27"] = kod
    st.session_state["aktif_takip_dosyasi_v27"] = dosya

    return dosya


TEST_PREMIUM_KODU = "DEPO-PREMIUM-2026"


def lisans_dosyasi_hazirla():
    """
    Test amaçlı lisans dosyası.
    Gerçek yayında bu dosya yerine kullanıcı girişi / sunucu kontrolü bağlanır.
    """
    if not os.path.exists(LISANS_DOSYASI):
        with open(LISANS_DOSYASI, "w", encoding="utf-8") as f:
            f.write("# Depo Radarı lisans kodları\n")
            f.write("# Test premium kodu aşağıdadır.\n")
            f.write("# Gerçek yayında bu kontrol sunucu tarafına taşınacak.\n\n")
            f.write(TEST_PREMIUM_KODU + "\n")


def lisans_kodlari_oku():
    lisans_dosyasi_hazirla()

    kodlar = set()

    try:
        with open(LISANS_DOSYASI, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()

                if not line or line.startswith("#"):
                    continue

                kodlar.add(line.upper())
    except Exception:
        pass

    kodlar.add(TEST_PREMIUM_KODU.upper())
    return kodlar


def lisans_kodlarini_oku():
    """
    Yayında lisans kodları GitHub'a yazılmamalı.
    Öncelik sırası:
    1) Streamlit Secrets: PREMIUM_CODES
    2) Ortam değişkeni: PREMIUM_CODES
    3) Yerel geliştirme için depo_radari_lisanslar.txt
    """
    kodlar = set()

    try:
        secret_codes = st.secrets.get("PREMIUM_CODES", "")
        if isinstance(secret_codes, str):
            for kod in secret_codes.replace(",", "\n").splitlines():
                kod = kod.strip()
                if kod and not kod.startswith("#"):
                    kodlar.add(kod)
        elif isinstance(secret_codes, list):
            for kod in secret_codes:
                kod = str(kod).strip()
                if kod:
                    kodlar.add(kod)
    except Exception:
        pass

    try:
        import os
        env_codes = os.environ.get("PREMIUM_CODES", "")
        for kod in env_codes.replace(",", "\n").splitlines():
            kod = kod.strip()
            if kod and not kod.startswith("#"):
                kodlar.add(kod)
    except Exception:
        pass

    # Yerel kullanım için fallback. Public GitHub'da gerçek kod koyma.
    try:
        if os.path.exists(LISANS_DOSYASI):
            with open(LISANS_DOSYASI, "r", encoding="utf-8") as f:
                for satir in f:
                    satir = satir.strip()
                    if satir and not satir.startswith("#"):
                        kodlar.add(satir)
    except Exception:
        pass

    return kodlar


def lisans_kontrolu():
    st.sidebar.markdown("### 🔑 Lisans")

    lisans_kodu = st.sidebar.text_input(
        "Premium kod",
        type="password",
        placeholder="Premium kodunu gir",
        key="lisans_kodu_v23",
    )

    kodlar = lisans_kodlarini_oku()

    if lisans_kodu and lisans_kodu.strip() in kodlar:
        st.sidebar.success("Premium aktif")
        return "Premium"

    st.sidebar.info("Ücretsiz paket")
    return "Ücretsiz"


def premium_aktif(paket):
    """
    Hem eski dict paket yapısını hem de yeni string paket yapısını destekler.
    """
    if isinstance(paket, str):
        return paket == "Premium"

    if isinstance(paket, dict):
        return bool(paket.get("premium", False)) or paket.get("ad") == "Premium"

    return False


def paket_bilgi_goster(paket):
    """
    Sidebar paket bilgisini güvenli gösterir.
    V23/V24 geçişinde bu fonksiyon bazı deploylarda eksik kalınca NameError oluşuyordu.
    """
    try:
        aktif = premium_aktif(paket)
    except Exception:
        aktif = False

    if aktif:
        st.sidebar.success("Paket: Premium")
        st.sidebar.caption("Premium özellikler aktif.")
    else:
        st.sidebar.info("Paket: Ücretsiz")
        st.sidebar.caption("CSV yükleme, analiz ve rapor indirme premiumdur.")


def kilitli_ozellik(baslik, aciklama):
    st.markdown(
        f"""
        <div class="locked-card">
            <div class="locked-title">🔒 {baslik}</div>
            <div class="locked-sub">{aciklama}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def premium_ozellikler_panosu():
    with st.expander("🔒 Premium özellikler", expanded=False):
        kilitli_ozellik(
            "CSV yükleme",
            "Kendi CSV dosyanı yükleyip analiz etme premium lisansa ayrıldı."
        )
        kilitli_ozellik(
            "Analiz görünümü",
            "Grafikler, fiyat dağılımları ve ürün bazlı özetler premium lisansa ayrıldı."
        )
        kilitli_ozellik(
            "Rapor indirme",
            "CSV/Excel raporu indirme premium lisansa ayrıldı."
        )



def takip_listesi_oku():
    dosya = takip_dosyasi_yolu()

    try:
        if os.path.exists(dosya):
            with open(dosya, "r", encoding="utf-8") as f:
                data = json.load(f)

                if isinstance(data, list):
                    return data
    except Exception:
        pass

    # Eski tek dosyalı sistemden gelen takipleri kaybetmemek için
    # sadece varsayılan/yerel durumda eski dosyadan okumaya çalışır.
    try:
        if os.path.exists(TAKIP_DOSYASI):
            with open(TAKIP_DOSYASI, "r", encoding="utf-8") as f:
                data = json.load(f)

                if isinstance(data, list):
                    return data
    except Exception:
        pass

    return []


def takip_listesi_yaz(liste):
    dosya = takip_dosyasi_yolu()

    try:
        with open(dosya, "w", encoding="utf-8") as f:
            json.dump(liste, f, ensure_ascii=False, indent=2)
    except Exception as e:
        st.warning(f"Takip listesi kaydedilemedi: {e}")


def aktif_filtreleri_al():
    filtreler = {
        "arama": st.session_state.get("arama_v7", ""),
        "bolge": st.session_state.get("bolge_v7", "Tümü"),
        "obm": st.session_state.get("obm_v7", "Tümü"),
        "oim": st.session_state.get("oim_v7", "Tümü"),
        "urun": st.session_state.get("urun_v7", "Tümü"),
        "agac": st.session_state.get("agac_v7", "Tümü"),
        "sinif": st.session_state.get("sinif_v7", "Tümü"),
        "boy": st.session_state.get("boy_v7", "Tümü"),
        "cap": st.session_state.get("cap_v7", "Tümü"),
    }

    return filtreler


def filtre_ozet_metni(filtreler):
    parcala = []

    etiketler = {
        "arama": "Arama",
        "bolge": "Bölge",
        "obm": "OBM",
        "oim": "OİM",
        "urun": "Ürün",
        "agac": "Ağaç",
        "sinif": "Sınıf",
        "boy": "Boy",
        "cap": "Çap",
    }

    for key, label in etiketler.items():
        val = filtreler.get(key, "")

        if gecerli_metin(val) and val != "Tümü":
            parcala.append(f"{label}: {val}")

    if not parcala:
        return "Genel takip"

    return " | ".join(parcala)


def filtreleri_uygula(df: pd.DataFrame, filtreler: dict) -> pd.DataFrame:
    sonuc = df.copy()

    arama = str(filtreler.get("arama", "")).strip()
    if arama and "urun_adi" in sonuc.columns:
        sonuc = sonuc[sonuc["urun_adi"].str.contains(arama, case=False, na=False)]

    kolon_haritasi = {
        "bolge": "cografi_bolge",
        "obm": "obm",
        "oim": "oim",
        "urun": "urun_turu",
        "agac": "agac_turu",
        "sinif": "sinif",
        "boy": "boy_kodu",
        "cap": "cap_kodu",
    }

    for key, kolon in kolon_haritasi.items():
        val = filtreler.get(key, "Tümü")

        if val != "Tümü" and kolon in sonuc.columns:
            sonuc = sonuc[sonuc[kolon] == val]

    return sonuc


def takip_hedefini_uygula():
    """
    Streamlit'te bir filtre kutusu oluşturulduktan sonra aynı çalıştırmada o kutunun
    session_state değeri değiştirilemez. Bu yüzden takip kartına basınca önce hedef filtre
    saklanır, sayfa yenilenir, filtre kutuları çizilmeden önce burada uygulanır.
    """
    hedef = st.session_state.pop("takip_hedef_filtre_v22", None)

    if not hedef:
        return

    key_map = {
        "arama": "arama_v7",
        "bolge": "bolge_v7",
        "obm": "obm_v7",
        "oim": "oim_v7",
        "urun": "urun_v7",
        "agac": "agac_v7",
        "sinif": "sinif_v7",
        "boy": "boy_v7",
        "cap": "cap_v7",
    }

    for takip_key, widget_key in key_map.items():
        st.session_state[widget_key] = hedef.get(takip_key, "Tümü")

    st.session_state["takip_uygulandi_v22"] = True


def takip_filtrelerine_git(filtreler: dict):
    """
    Kaydedilmiş takip filtresine gitmek için hedef filtreyi saklar ve sayfayı yeniler.
    Asıl uygulama, filtre kutuları çizilmeden önce takip_hedefini_uygula() içinde yapılır.
    """
    st.session_state["takip_hedef_filtre_v22"] = filtreler
    st.rerun()


def takip_sil(index: int):
    liste = takip_listesi_oku()

    if 0 <= index < len(liste):
        liste.pop(index)
        takip_listesi_yaz(liste)
        st.success("Takip silindi.")
        st.rerun()


def alarm_sarti_var(sartlar: dict) -> bool:
    if not sartlar:
        return False

    for key in ["max_fiyat", "min_puan", "min_miktar"]:
        val = sartlar.get(key)

        if val not in [None, "", 0, "0"]:
            try:
                if float(val) > 0:
                    return True
            except Exception:
                pass

    return False


def alarm_sartlari_uygula(df: pd.DataFrame, sartlar: dict) -> pd.DataFrame:
    # Şart girilmediyse alarm üretme.
    # Sadece takip kaydı olsun; alarm merkezi boş kalsın.
    if not alarm_sarti_var(sartlar):
        return df.iloc[0:0].copy()

    sonuc = df.copy()

    max_fiyat = sartlar.get("max_fiyat")
    min_puan = sartlar.get("min_puan")
    min_miktar = sartlar.get("min_miktar")

    if max_fiyat not in [None, "", 0, "0"] and "muhammen_birim_fiyat" in sonuc.columns:
        try:
            sonuc = sonuc[sonuc["muhammen_birim_fiyat"] <= float(max_fiyat)]
        except Exception:
            pass

    if min_puan not in [None, "", 0, "0"] and "firsat_puani" in sonuc.columns:
        try:
            sonuc = sonuc[sonuc["firsat_puani"] >= float(min_puan)]
        except Exception:
            pass

    if min_miktar not in [None, "", 0, "0"] and "miktar_m3_hesap" in sonuc.columns:
        try:
            sonuc = sonuc[sonuc["miktar_m3_hesap"] >= float(min_miktar)]
        except Exception:
            pass

    return sonuc


def alarm_ozet_metni(sartlar: dict) -> str:
    parcala = []

    max_fiyat = sartlar.get("max_fiyat")
    min_puan = sartlar.get("min_puan")
    min_miktar = sartlar.get("min_miktar")

    if max_fiyat not in [None, "", 0, "0"]:
        parcala.append(f"En fazla fiyat: {tl(float(max_fiyat))}")

    if min_puan not in [None, "", 0, "0"]:
        parcala.append(f"Min. fırsat: {int(float(min_puan))}/100")

    if min_miktar not in [None, "", 0, "0"]:
        parcala.append(f"Min. miktar: {m3(float(min_miktar))}")

    if not parcala:
        return "Alarm şartı yok"

    return " | ".join(parcala)



def yeni_kayitlar_panosu(df: pd.DataFrame):
    with st.expander("🆕 Son güncellemede gelen yeni kayıtlar", expanded=False):
        if "guncelleme_id" not in df.columns:
            st.info("Yeni kayıt takibi için veri güncelleme v4 ile CSV oluşturulmalı.")
            st.caption("Eski CSV dosyalarında guncelleme_id kolonu olmadığı için yeni kayıtlar listelenemez.")
            return

        temp = df.copy()
        temp["guncelleme_id"] = temp["guncelleme_id"].apply(lambda x: temiz_metin(x))

        temp = temp[temp["guncelleme_id"].apply(gecerli_metin)]

        if temp.empty:
            st.info("Bu filtrelerde güncelleme ID bilgisi olan yeni kayıt yok.")
            return

        son_id = sorted(temp["guncelleme_id"].unique().tolist())[-1]
        yeni = temp[temp["guncelleme_id"] == son_id].copy()

        if yeni.empty:
            st.info("Son güncellemede gelen kayıt bulunamadı.")
            return

        en_ucuz = yeni["muhammen_birim_fiyat"].min() if "muhammen_birim_fiyat" in yeni.columns else None
        en_puan = yeni["firsat_puani"].max() if "firsat_puani" in yeni.columns else None
        toplam_miktar = yeni["miktar_m3_hesap"].sum() if "miktar_m3_hesap" in yeni.columns else None

        c1, c2, c3, c4 = st.columns(4)

        with c1:
            st.markdown(
                f"""
                <div class="new-record-card">
                    <div class="new-record-title">{len(yeni)} yeni kayıt</div>
                    <div class="new-record-sub">Güncelleme ID: {son_id}</div>
                </div>
                """,
                unsafe_allow_html=True,
            )

        with c2:
            st.markdown(
                f"""
                <div class="new-record-card">
                    <div class="new-record-title">{tl(en_ucuz)}</div>
                    <div class="new-record-sub">Yeni kayıtlar içinde en ucuz</div>
                </div>
                """,
                unsafe_allow_html=True,
            )

        with c3:
            st.markdown(
                f"""
                <div class="new-record-card">
                    <div class="new-record-title">{sayi(en_puan)}/100</div>
                    <div class="new-record-sub">Yeni kayıtlar içinde en yüksek fırsat</div>
                </div>
                """,
                unsafe_allow_html=True,
            )

        with c4:
            st.markdown(
                f"""
                <div class="new-record-card">
                    <div class="new-record-title">{m3(toplam_miktar)}</div>
                    <div class="new-record-sub">Yeni kayıtlar toplam miktar</div>
                </div>
                """,
                unsafe_allow_html=True,
            )

        kolonlar = [
            "kayit_tarihi",
            "guncelleme_id",
            "parti_no",
            "puan_kategorisi",
            "kalite_puani",
            "kalite_ozeti",
            "urun_adi",
            "urun_turu",
            "agac_turu",
            "miktar_m3_hesap",
            "muhammen_birim_fiyat",
            "firsat_puani",
            "fiyat_durumu",
            "obm",
            "oim",
            "kaynak_link",
        ]

        kolonlar = [c for c in kolonlar if c in yeni.columns]

        siralama_kolonlari = []
        siralama_yonleri = []

        if "firsat_puani" in yeni.columns:
            siralama_kolonlari.append("firsat_puani")
            siralama_yonleri.append(False)

        if "muhammen_birim_fiyat" in yeni.columns:
            siralama_kolonlari.append("muhammen_birim_fiyat")
            siralama_yonleri.append(True)

        if siralama_kolonlari:
            yeni = yeni.sort_values(siralama_kolonlari, ascending=siralama_yonleri)

        st.dataframe(
            yeni[kolonlar],
            use_container_width=True,
            hide_index=True,
            column_config={
                "kaynak_link": st.column_config.LinkColumn("Kaynakta Aç"),
                "miktar_m3_hesap": st.column_config.NumberColumn("Miktar m³", format="%.3f"),
                "muhammen_birim_fiyat": st.column_config.NumberColumn("Birim Fiyat TL", format="%.0f"),
                "firsat_puani": st.column_config.ProgressColumn("Fırsat Puanı", min_value=0, max_value=100, format="%d"),
            },
        )

def alarm_merkezi_panosu(df: pd.DataFrame):
    liste = takip_listesi_oku()

    if not liste:
        return

    alarm_parcalari = []
    alarm_ozetleri = []

    for i, item in enumerate(liste, start=1):
        ad = item.get("ad", f"Takip {i}")
        filtreler = item.get("filtreler", {})
        sartlar = item.get("sartlar", {})

        if not alarm_sarti_var(sartlar):
            continue

        alt = filtreleri_uygula(df, filtreler)
        alarm_alt = alarm_sartlari_uygula(alt, sartlar)

        if alarm_alt.empty:
            continue

        alarm_alt = alarm_alt.copy()
        alarm_alt.insert(0, "takip_adi", ad)
        alarm_alt.insert(1, "alarm_sarti", alarm_ozet_metni(sartlar))

        alarm_parcalari.append(alarm_alt)

        en_ucuz = tl(alarm_alt["muhammen_birim_fiyat"].min()) if "muhammen_birim_fiyat" in alarm_alt.columns else "-"
        en_puan = sayi(alarm_alt["firsat_puani"].max()) if "firsat_puani" in alarm_alt.columns else "-"

        alarm_ozetleri.append({
            "ad": ad,
            "adet": len(alarm_alt),
            "en_ucuz": en_ucuz,
            "en_puan": en_puan,
            "sart": alarm_ozet_metni(sartlar),
        })

    with st.expander("🚨 Alarm merkezi", expanded=bool(alarm_parcalari)):
        if not alarm_parcalari:
            st.info("Şu anda alarm şartına uyan kayıt yok.")
            st.caption("Takip listesine fiyat, fırsat puanı veya miktar şartı ekleyince burada otomatik görünecek.")
            return

        tum_alarm = pd.concat(alarm_parcalari, ignore_index=True)

        st.success(f"{len(tum_alarm)} alarm eşleşmesi bulundu.")

        kolonlar = st.columns(min(3, len(alarm_ozetleri)))
        if not kolonlar:
            kolonlar = st.columns(1)

        for idx, ozet_item in enumerate(alarm_ozetleri):
            with kolonlar[idx % len(kolonlar)]:
                st.markdown(
                    f"""
                    <div class="alarm-center-card">
                        <div class="alarm-center-title">{ozet_item["ad"]}</div>
                        <div class="alarm-center-sub">
                            {ozet_item["adet"]} uygun kayıt<br>
                            En ucuz: {ozet_item["en_ucuz"]}<br>
                            En yüksek fırsat: {ozet_item["en_puan"]}/100<br>
                            Şart: {ozet_item["sart"]}
                        </div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

        st.subheader("Tüm alarm sonuçları")

        siralama_kolonlari = []
        siralama_yonleri = []

        if "firsat_puani" in tum_alarm.columns:
            siralama_kolonlari.append("firsat_puani")
            siralama_yonleri.append(False)

        if "muhammen_birim_fiyat" in tum_alarm.columns:
            siralama_kolonlari.append("muhammen_birim_fiyat")
            siralama_yonleri.append(True)

        if siralama_kolonlari:
            tum_alarm = tum_alarm.sort_values(siralama_kolonlari, ascending=siralama_yonleri)

        kolonlar = [
            "takip_adi",
            "alarm_sarti",
            "parti_no",
            "puan_kategorisi",
            "kalite_puani",
            "kalite_ozeti",
            "urun_adi",
            "urun_turu",
            "agac_turu",
            "miktar_m3_hesap",
            "muhammen_birim_fiyat",
            "firsat_puani",
            "fiyat_durumu",
            "obm",
            "oim",
            "kaynak_link",
        ]

        kolonlar = [c for c in kolonlar if c in tum_alarm.columns]

        st.dataframe(
            tum_alarm[kolonlar],
            use_container_width=True,
            hide_index=True,
            column_config={
                "kaynak_link": st.column_config.LinkColumn("Kaynakta Aç"),
                "miktar_m3_hesap": st.column_config.NumberColumn("Miktar m³", format="%.3f"),
                "muhammen_birim_fiyat": st.column_config.NumberColumn("Birim Fiyat TL", format="%.0f"),
                "firsat_puani": st.column_config.ProgressColumn("Fırsat Puanı", min_value=0, max_value=100, format="%d"),
            },
        )

def takip_listesi_panosu(df: pd.DataFrame):
    with st.expander("📌 Takip listesi ve alarm şartları", expanded=False):
        st.caption("Mevcut filtreyi kaydedebilir, alarm şartı ekleyebilir ve aynı takip koduyla kendi listen üzerinden geri dönebilirsin.")

        if st.session_state.get("takip_uygulandi_v22", False):
            st.success("Takip filtresi uygulandı.")
            st.session_state["takip_uygulandi_v22"] = False

        mevcut_filtreler = aktif_filtreleri_al()
        mevcut_ozet = filtre_ozet_metni(mevcut_filtreler)
        aktif_takip_dosyasi = takip_dosyasi_yolu()

        st.info("Takip listesi artık kullanıcı takip koduna göre ayrılır. Aynı listeyi tekrar görmek için sol menüde aynı takip kodunu gir.")

        st.markdown(
            f"""
            <div class="watch-card">
                <div class="watch-title">Mevcut filtre</div>
                <div class="watch-sub">{mevcut_ozet}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        takip_adi = st.text_input("Takip adı", value=mevcut_ozet[:80], key="takip_adi_v18")

        st.caption("Alarm şartları boş kalırsa sadece filtre takibi yapılır.")
        a1, a2, a3 = st.columns(3)

        with a1:
            max_fiyat = st.number_input(
                "Alarm: en fazla fiyat TL/m³",
                min_value=0,
                value=0,
                step=100,
                key="alarm_max_fiyat_v18"
            )

        with a2:
            min_puan = st.number_input(
                "Alarm: minimum fırsat puanı",
                min_value=0,
                max_value=100,
                value=0,
                step=1,
                key="alarm_min_puan_v18"
            )

        with a3:
            min_miktar = st.number_input(
                "Alarm: minimum miktar m³",
                min_value=0.0,
                value=0.0,
                step=1.0,
                key="alarm_min_miktar_v18"
            )

        sartlar = {
            "max_fiyat": max_fiyat,
            "min_puan": min_puan,
            "min_miktar": min_miktar,
        }

        c1, c2 = st.columns([1, 1])
        with c1:
            if st.button("Bu filtreyi takip listesine ekle", key="takip_ekle_v18"):
                liste = takip_listesi_oku()

                yeni = {
                    "ad": takip_adi.strip() or mevcut_ozet,
                    "filtreler": mevcut_filtreler,
                    "sartlar": sartlar,
                }

                liste.append(yeni)
                takip_listesi_yaz(liste)
                st.success("Takip listesine eklendi.")
                st.rerun()

        with c2:
            if st.button("Takip listesini temizle", key="takip_temizle_v18"):
                takip_listesi_yaz([])
                st.success("Takip listesi temizlendi.")
                st.rerun()

        liste = takip_listesi_oku()

        if not liste:
            st.info("Takip listesi boş.")
            return

        st.subheader("Kayıtlı takipler")

        for i, item in enumerate(liste, start=1):
            ad = item.get("ad", f"Takip {i}")
            filtreler = item.get("filtreler", {})
            sartlar = item.get("sartlar", {})
            alt = filtreleri_uygula(df, filtreler)
            alarm_alt = alarm_sartlari_uygula(alt, sartlar)

            if alt.empty:
                hit = "Eşleşen kayıt yok"
                en_ucuz = "-"
                en_puan = "-"
            else:
                hit = f"{len(alt)} kayıt"
                en_ucuz = tl(alt["muhammen_birim_fiyat"].min()) if "muhammen_birim_fiyat" in alt.columns else "-"
                en_puan = sayi(alt["firsat_puani"].max()) if "firsat_puani" in alt.columns else "-"

            if alarm_alt.empty:
                alarm_badge = '<span class="alarm-off">Alarm yok</span>'
                alarm_detay = "Alarm şartına uyan kayıt yok."
            else:
                alarm_badge = f'<span class="alarm-on">Alarm: {len(alarm_alt)} uygun kayıt</span>'
                alarm_en_ucuz = tl(alarm_alt["muhammen_birim_fiyat"].min()) if "muhammen_birim_fiyat" in alarm_alt.columns else "-"
                alarm_en_puan = sayi(alarm_alt["firsat_puani"].max()) if "firsat_puani" in alarm_alt.columns else "-"
                alarm_detay = f"Alarm en ucuz: {alarm_en_ucuz} | Alarm en yüksek fırsat: {alarm_en_puan}/100"

            st.markdown(
                f"""
                <div class="watch-card">
                    <div class="watch-title">{i}. {ad}</div>
                    <div class="watch-sub">
                        {filtre_ozet_metni(filtreler)}<br>
                        Şart: {alarm_ozet_metni(sartlar)}<br>
                        Genel: {hit} | En ucuz: {en_ucuz} | En yüksek fırsat: {en_puan}/100<br>
                        {alarm_detay}
                    </div>
                    {alarm_badge}
                </div>
                """,
                unsafe_allow_html=True,
            )

            b1, b2, b3 = st.columns([1, 1, 1])
            with b1:
                if st.button("Bu takibe git", key=f"takibe_git_v18_{i}"):
                    takip_filtrelerine_git(filtreler)

            with b2:
                if st.button("Alarm sonuçlarını göster", key=f"alarm_goster_v18_{i}"):
                    st.session_state[f"alarm_detay_v18_{i}"] = not st.session_state.get(f"alarm_detay_v18_{i}", False)

            with b3:
                if st.button("Bu takibi sil", key=f"takip_sil_v18_{i}"):
                    takip_sil(i - 1)

            if st.session_state.get(f"alarm_detay_v18_{i}", False):
                if alarm_alt.empty:
                    st.info("Bu alarm şartına uygun kayıt yok.")
                else:
                    gosterilecek = alarm_alt.sort_values(["firsat_puani", "muhammen_birim_fiyat"], ascending=[False, True])
                    kolonlar = [
                        "parti_no",
                        "puan_kategorisi",
                        "urun_adi",
                        "urun_turu",
                        "agac_turu",
                        "miktar_m3_hesap",
                        "muhammen_birim_fiyat",
                        "firsat_puani",
                        "fiyat_durumu",
                        "obm",
                        "oim",
                        "kaynak_link",
                    ]
                    kolonlar = [c for c in kolonlar if c in gosterilecek.columns]
                    st.dataframe(gosterilecek[kolonlar], use_container_width=True, hide_index=True)


def ozet_json_oku():
    if not os.path.exists(OZET_DOSYASI):
        return {}

    try:
        with open(OZET_DOSYASI, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def guncelleme_ozeti_goster():
    ozet = ozet_json_oku()

    if not ozet:
        st.info("Henüz güncelleme özeti yok. Panelden veri güncelleme çalıştırınca burada özet görünecek.")
        return

    durum = ozet.get("durum", "-")
    son = ozet.get("son_guncelleme", "-")
    yeni = ozet.get("yeni_kayit", 0)
    csv_once = ozet.get("csv_once", 0)
    csv_sonra = ozet.get("csv_sonra", 0)
    denenen = ozet.get("denenen_ihale", 0)
    veri_cikan = ozet.get("veri_cikan_ihale", 0)
    hata = ozet.get("hata_sayisi", 0)
    sure = ozet.get("sure_saniye", 0)
    output = ozet.get("output_csv", "-")

    c1, c2, c3, c4 = st.columns(4)

    with c1:
        st.markdown(
            f"""
            <div class="updatebox">
                <div class="updatebox-title">Son güncelleme</div>
                <div class="updatebox-main">{son}</div>
                <div class="updatebox-sub">Durum: {durum}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with c2:
        st.markdown(
            f"""
            <div class="updatebox">
                <div class="updatebox-title">Yeni kayıt</div>
                <div class="updatebox-main">{yeni}</div>
                <div class="updatebox-sub">CSV: {csv_once} → {csv_sonra}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with c3:
        st.markdown(
            f"""
            <div class="updatebox">
                <div class="updatebox-title">İhale durumu</div>
                <div class="updatebox-main">{veri_cikan}/{denenen}</div>
                <div class="updatebox-sub">Veri çıkan / denenen ihale</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with c4:
        st.markdown(
            f"""
            <div class="updatebox">
                <div class="updatebox-title">Sistem</div>
                <div class="updatebox-main">{hata} hata</div>
                <div class="updatebox-sub">Süre: {sure} sn<br>Çıktı: {output}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )



def en_guncel_csv_bul():
    for dosya in CSV_ONCELIKLI_DOSYALAR:
        if os.path.exists(dosya):
            return dosya

    desenler = [
        "depo_radari_tum_ihaleler*.csv",
        "depo_radari_temiz*.csv",
        "depo_radari*.csv",
    ]

    adaylar = []
    for desen in desenler:
        adaylar.extend(glob.glob(desen))

    adaylar = [a for a in adaylar if os.path.isfile(a)]

    if not adaylar:
        return CSV_DOSYA

    adaylar.sort(key=lambda p: os.path.getmtime(p), reverse=True)
    return adaylar[0]


@st.cache_data(show_spinner=False)
def csv_oku(path: str) -> pd.DataFrame:
    if not os.path.exists(path):
        return pd.DataFrame()
    return pd.read_csv(path)


@st.cache_data(show_spinner=False)
def upload_oku(uploaded_file) -> pd.DataFrame:
    return pd.read_csv(uploaded_file)


def gecerli_metin(value) -> bool:
    if value is None or pd.isna(value):
        return False
    s = str(value).strip()
    if not s:
        return False
    if s.lower() in ["none", "nan", "null", "<na>", "-"]:
        return False
    return True


def temiz_metin(value) -> str:
    return str(value).strip() if gecerli_metin(value) else ""


def hazirla(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    sayi_kolonlari = [
        "parti_no",
        "ihale_no",
        "adet",
        "miktar_m3_hesap",
        "muhammen_birim_fiyat",
        "teminat_tutari",
        "toplam_muhammen_hesap",
        "katilimci_sayisi",
    ]

    for kolon in sayi_kolonlari:
        if kolon in df.columns:
            df[kolon] = pd.to_numeric(df[kolon], errors="coerce")

    bos_degerler = {
        "None": "", "none": "", "NONE": "",
        "nan": "", "NaN": "", "NAN": "",
        "<NA>": "", "null": "", "Null": "", "NULL": "",
        "-": ""
    }

    for kolon in df.columns:
        if df[kolon].dtype == "object":
            df[kolon] = df[kolon].fillna("").astype(str).str.strip().replace(bos_degerler)

    metin_kolonlari = [
        "sinif", "boy_kodu", "cap_kodu", "urun_turu", "agac_turu",
        "parti_durum", "detay_durum", "obm", "oim", "cografi_bolge"
    ]

    for kolon in metin_kolonlari:
        if kolon in df.columns:
            df[kolon] = df[kolon].astype(str).str.strip().replace(bos_degerler)

    df = puan_kategorisi_olustur(df)
    df = supheli_fiyat_isaretle(df)
    df = firsat_puani_hesapla(df)
    df = fiyat_durumu_hesapla(df)

    return df


def supheli_fiyat_isaretle(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["supheli_fiyat"] = False
    df["supheli_neden"] = ""

    if "muhammen_birim_fiyat" not in df.columns:
        return df

    fiyat = pd.to_numeric(df["muhammen_birim_fiyat"], errors="coerce")

    kosul_dusuk = fiyat.notna() & (fiyat < 1000)
    df.loc[kosul_dusuk, "supheli_fiyat"] = True
    df.loc[kosul_dusuk, "supheli_neden"] = "1000 TL altı"

    grup_kolonlari = [k for k in ["urun_turu", "agac_turu"] if k in df.columns]

    if grup_kolonlari:
        medyan = df.groupby(grup_kolonlari)["muhammen_birim_fiyat"].transform("median")
        kosul = fiyat.notna() & medyan.notna() & (medyan > 0) & (fiyat < medyan * 0.5)
        df.loc[kosul, "supheli_fiyat"] = True
        df.loc[kosul, "supheli_neden"] = "Benzerlerinden çok düşük"

    return df





def kalite_ozeti_olustur(row) -> str:
    parcalar = []

    for kolon, etiket in [
        ("sinif", "Sınıf"),
        ("boy_kodu", "Boy"),
        ("cap_kodu", "Çap"),
    ]:
        val = temiz_metin(row.get(kolon, ""))

        if val:
            parcalar.append(f"{etiket}: {val}")

    return " | ".join(parcalar) if parcalar else "Kalite bilgisi yok"


def puan_kategorisi_olustur(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    ana_kategoriler = []
    detay_kategoriler = []
    kalite_ozetleri = []

    for _, row in df.iterrows():
        agac = temiz_metin(row.get("agac_turu", ""))
        urun = temiz_metin(row.get("urun_turu", ""))
        sinif = temiz_metin(row.get("sinif", ""))
        boy = temiz_metin(row.get("boy_kodu", ""))
        cap = temiz_metin(row.get("cap_kodu", ""))

        ana_parcalar = [x for x in [agac, urun] if x]
        detay_parcalar = [x for x in [agac, urun, sinif, boy, cap] if x]

        ana_kategoriler.append(" ".join(ana_parcalar) if ana_parcalar else "Genel")
        detay_kategoriler.append(" ".join(detay_parcalar) if detay_parcalar else "Genel")
        kalite_ozetleri.append(kalite_ozeti_olustur(row))

    df["ana_puan_kategorisi"] = ana_kategoriler
    df["puan_kategorisi"] = detay_kategoriler
    df["kalite_ozeti"] = kalite_ozetleri

    # Eğer detay kategori tek kayıtsa fiyat kıyasını ana kategoriye düşür.
    # Böylece "Karaçam Tomruk 1. sınıf uzun boy" varsa önce kendi içinde,
    # kendi içinde yeterli kayıt yoksa "Karaçam Tomruk" ana grubunda kıyaslanır.
    detay_adet = df.groupby("puan_kategorisi")["puan_kategorisi"].transform("count")
    df["karsilastirma_kategorisi"] = df["puan_kategorisi"]
    df.loc[detay_adet < 2, "karsilastirma_kategorisi"] = df.loc[detay_adet < 2, "ana_puan_kategorisi"]

    return df


def kalite_puani_hesapla(df: pd.DataFrame) -> pd.Series:
    """
    Kalite puanı fiyatı değil, malın niteliğini destekler.
    1. sınıf / uzun boy gibi mallar biraz pahalı olsa bile tamamen haksız yere düşük puan almasın.
    """
    kalite = pd.Series(0, index=df.index, dtype="float")

    if "sinif" in df.columns:
        sinif = df["sinif"].astype(str).str.lower().str.strip()

        birinci = sinif.str.contains(r"\b1\b|1\.|i\.|ı\.|birinci|1 sınıf|1.sınıf", regex=True, na=False)
        ikinci = sinif.str.contains(r"\b2\b|2\.|ii\.|ikinci|2 sınıf|2.sınıf", regex=True, na=False)
        ucuncu = sinif.str.contains(r"\b3\b|3\.|iii\.|üçüncü|ucuncu|3 sınıf|3.sınıf", regex=True, na=False)

        kalite = kalite.mask(birinci, kalite + 12)
        kalite = kalite.mask(ikinci, kalite + 7)
        kalite = kalite.mask(ucuncu, kalite + 3)

    if "boy_kodu" in df.columns:
        boy = df["boy_kodu"].astype(str).str.lower().str.strip()

        uzun = boy.str.contains("uzun|ub|u/b|u b", regex=True, na=False)
        normal = boy.str.contains("normal|nb|n/b|n b", regex=True, na=False)
        kisa = boy.str.contains("kısa|kisa|kb|k/b|k b", regex=True, na=False)

        kalite = kalite.mask(uzun, kalite + 8)
        kalite = kalite.mask(normal, kalite + 5)
        kalite = kalite.mask(kisa, kalite + 2)

    if "cap_kodu" in df.columns:
        cap = df["cap_kodu"].astype(str).str.lower().str.strip()

        kalin = cap.str.contains("kalın|kalin|kln|büyük|buyuk|geniş|genis", regex=True, na=False)
        orta = cap.str.contains("orta|ort", regex=True, na=False)
        ince = cap.str.contains("ince|inc", regex=True, na=False)

        kalite = kalite.mask(kalin, kalite + 6)
        kalite = kalite.mask(orta, kalite + 4)
        kalite = kalite.mask(ince, kalite + 1)

    return kalite.clip(lower=0, upper=25)


def fiyat_durumu_hesapla(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    if "muhammen_birim_fiyat" not in df.columns:
        df["fiyat_durumu"] = "Veri Yok"
        return df

    if "karsilastirma_kategorisi" not in df.columns:
        df = puan_kategorisi_olustur(df)

    fiyat = pd.to_numeric(df["muhammen_birim_fiyat"], errors="coerce")
    df["fiyat_durumu"] = "Normal"

    medyan = df.groupby("karsilastirma_kategorisi")["muhammen_birim_fiyat"].transform("median")
    adet = df.groupby("karsilastirma_kategorisi")["muhammen_birim_fiyat"].transform("count")

    # Kıyas artık kaliteyi dikkate alan kategoriyle yapılır:
    # Önce ağaç + ürün + sınıf + boy + çap, veri azsa ağaç + ürün.
    karsilastirilebilir = fiyat.notna() & medyan.notna() & (medyan > 0) & (adet >= 2)

    df.loc[karsilastirilebilir & (fiyat <= medyan * 0.85), "fiyat_durumu"] = "Ucuz"
    df.loc[karsilastirilebilir & (fiyat >= medyan * 1.15), "fiyat_durumu"] = "Pahalı"

    if "supheli_fiyat" in df.columns:
        df.loc[df["supheli_fiyat"] == True, "fiyat_durumu"] = "Şüpheli"

    df.loc[fiyat.isna(), "fiyat_durumu"] = "Veri Yok"

    return df


def firsat_puani_hesapla(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    if "muhammen_birim_fiyat" not in df.columns:
        df["firsat_puani"] = 0
        df["firsat_seviyesi"] = "Veri Yok"
        df["kalite_puani"] = 0
        return df

    if "karsilastirma_kategorisi" not in df.columns:
        df = puan_kategorisi_olustur(df)

    fiyat = pd.to_numeric(df["muhammen_birim_fiyat"], errors="coerce")
    miktar = pd.to_numeric(df.get("miktar_m3_hesap", pd.Series([None] * len(df))), errors="coerce")

    # KALİTE AĞIRLIKLI PUAN:
    # 1) Fiyat, mümkünse aynı ağaç + ürün + sınıf + boy + çap içinde kıyaslanır.
    # 2) Detay kategori tek kalırsa ağaç + ürün ana grubuna düşer.
    # 3) 1. sınıf / uzun boy / kalın çap gibi kalite bilgileri ayrıca destek puanı alır.
    grup = df.groupby("karsilastirma_kategorisi", dropna=False)

    adet = grup["muhammen_birim_fiyat"].transform("count")
    medyan_fiyat = grup["muhammen_birim_fiyat"].transform("median")
    rank = grup["muhammen_birim_fiyat"].rank(method="min", ascending=True)

    fiyat_puan = pd.Series(35, index=df.index, dtype="float")

    coklu_kategori = adet >= 2
    fiyat_puan = fiyat_puan.mask(
        coklu_kategori,
        20 + ((adet - rank) / (adet - 1)).fillna(0) * 35
    )

    fiyat_puan = fiyat_puan.mask(
        coklu_kategori & fiyat.notna() & medyan_fiyat.notna() & (fiyat <= medyan_fiyat * 0.85),
        fiyat_puan + 8
    )
    fiyat_puan = fiyat_puan.mask(
        coklu_kategori & fiyat.notna() & medyan_fiyat.notna() & (fiyat >= medyan_fiyat * 1.15),
        fiyat_puan - 8
    )

    fiyat_puan = fiyat_puan.clip(lower=8, upper=63)

    kalite_puani = kalite_puani_hesapla(df)
    df["kalite_puani"] = kalite_puani.round(0).astype(int)

    # Miktar puanı da aynı kıyas kategorisi içinde hesaplanır.
    miktar_puan = pd.Series(8, index=df.index, dtype="float")

    if miktar.notna().any() and "miktar_m3_hesap" in df.columns:
        miktar_medyan = grup["miktar_m3_hesap"].transform("median")
        miktar_q75 = grup["miktar_m3_hesap"].transform(lambda x: x.quantile(0.75) if x.notna().any() else None)

        miktar_puan = miktar_puan.mask(miktar.notna() & miktar_medyan.notna() & (miktar >= miktar_medyan), 12)
        miktar_puan = miktar_puan.mask(miktar.notna() & miktar_q75.notna() & (miktar >= miktar_q75), 16)

    durum = df.get("parti_durum", pd.Series([""] * len(df))).astype(str).str.lower()
    durum_puan = pd.Series(4, index=df.index, dtype="float")
    durum_puan = durum_puan.mask(durum.str.contains("bekliyor|açık|satılmayı", case=False, na=False), 8)

    veri_puan = pd.Series(0, index=df.index, dtype="float")
    for kolon in ["kaynak_link", "obm", "oim", "urun_adi", "puan_kategorisi"]:
        if kolon in df.columns:
            veri_puan += df[kolon].apply(lambda x: 1.5 if gecerli_metin(x) else 0)

    ceza = pd.Series(0, index=df.index, dtype="float")
    if "supheli_fiyat" in df.columns:
        ceza = ceza.mask(df["supheli_fiyat"] == True, 25)

    # Kıyas kategorisi tek kayıt kalırsa hâlâ tam emin değiliz; ama kalite varsa puan düşmesin diye ceza az.
    tek_kategori_ceza = pd.Series(0, index=df.index, dtype="float")
    tek_kategori_ceza = tek_kategori_ceza.mask(adet < 2, 5)

    puan = fiyat_puan + kalite_puani + miktar_puan + durum_puan + veri_puan - ceza - tek_kategori_ceza
    puan = puan.clip(lower=0, upper=100).round(0)

    df["firsat_puani"] = puan.astype(int)

    def seviye(p):
        if p >= 80:
            return "Çok İyi"
        if p >= 65:
            return "İyi"
        if p >= 45:
            return "Orta"
        return "Dikkat"

    df["firsat_seviyesi"] = df["firsat_puani"].apply(seviye)
    return df


def secenek(df: pd.DataFrame, kolon: str):
    if kolon not in df.columns:
        return ["Tümü"]
    vals = sorted([str(x).strip() for x in df[kolon].dropna().unique().tolist() if gecerli_metin(x)])
    return ["Tümü"] + vals


def tl(value):
    if value is None or pd.isna(value):
        return "-"
    return f"{float(value):,.0f} TL".replace(",", ".")


def m3(value):
    if value is None or pd.isna(value):
        return "-"
    return f"{float(value):,.3f} m³".replace(",", "X").replace(".", ",").replace("X", ".")


def sayi(value):
    if value is None or pd.isna(value):
        return "-"
    return f"{float(value):,.0f}".replace(",", ".")



def genel_arama_uygula(df: pd.DataFrame, arama: str) -> pd.DataFrame:
    """
    Sidebar arama kutusu artık sadece ürün adında değil;
    parti no, ihale no, ihale id, OİM ve OBM alanlarında da arar.
    """
    q = str(arama or "").strip()

    if not q or df.empty:
        return df

    kolonlar = [
        "urun_adi",
        "parti_no",
        "ihale_no",
        "ihale_id",
        "oim",
        "obm",
        "cografi_bolge",
        "agac_turu",
        "urun_turu",
    ]

    mask = pd.Series(False, index=df.index)

    for kolon in kolonlar:
        if kolon in df.columns:
            mask = mask | df[kolon].astype(str).str.contains(q, case=False, na=False)

    # Sayı girildiyse parti no ve ihale no için tam eşleşmeyi ayrıca garantiye al.
    if q.isdigit():
        for kolon in ["parti_no", "ihale_no", "ihale_id"]:
            if kolon in df.columns:
                mask = mask | (df[kolon].astype(str).str.strip() == q)

    return df[mask]

def filtrele(df: pd.DataFrame, paket=None) -> pd.DataFrame:
    st.sidebar.header("Filtreler")
    st.sidebar.caption("Filtreler birbirine bağlı çalışır. Bölge seçince sadece o bölgedeki OBM/OİM seçenekleri gelir.")

    uploaded = None

    if premium_aktif(paket or {}):
        uploaded = st.sidebar.file_uploader("Farklı CSV yükle", type=["csv"])

        if uploaded is not None:
            st.sidebar.success(f"Yüklenen CSV kullanılıyor: {uploaded.name}")
            df = hazirla(upload_oku(uploaded))
        else:
            st.sidebar.success(f"Okunan CSV: {st.session_state.get('okunan_csv', '-')}")
    else:
        st.sidebar.success(f"Okunan CSV: {st.session_state.get('okunan_csv', '-')}")
        st.sidebar.warning("CSV yükleme premium lisansa ayrıldı.")

    def secenek_kademeli(temp_df: pd.DataFrame, kolon: str):
        return secenek(temp_df, kolon)

    def uygula_esitlik(temp_df: pd.DataFrame, kolon: str, deger: str):
        if deger != "Tümü" and kolon in temp_df.columns:
            return temp_df[temp_df[kolon] == deger]
        return temp_df

    # Önce arama uygulanır, sonra bütün filtre seçenekleri bu arama sonucuna göre daralır.
    arama = st.sidebar.text_input("Genel arama", placeholder="Parti no, ihale no, Karaçam, tomruk...", key="arama_v7")

    sonuc = df.copy()

    sonuc = genel_arama_uygula(sonuc, arama)

    # Kademeli filtreleme:
    # Bölge seçilince OBM seçenekleri sadece o bölgeden gelir.
    # OBM seçilince OİM seçenekleri sadece o OBM'den gelir.
    bolge = st.sidebar.selectbox(
        "Coğrafi Bölge",
        secenek_kademeli(sonuc, "cografi_bolge"),
        key="bolge_v7"
    )
    sonuc = uygula_esitlik(sonuc, "cografi_bolge", bolge)

    obm = st.sidebar.selectbox(
        "OBM",
        secenek_kademeli(sonuc, "obm"),
        key="obm_v7"
    )
    sonuc = uygula_esitlik(sonuc, "obm", obm)

    oim = st.sidebar.selectbox(
        "OİM",
        secenek_kademeli(sonuc, "oim"),
        key="oim_v7"
    )
    sonuc = uygula_esitlik(sonuc, "oim", oim)

    urun = st.sidebar.selectbox(
        "Ürün Türü",
        secenek_kademeli(sonuc, "urun_turu"),
        key="urun_v7"
    )
    sonuc = uygula_esitlik(sonuc, "urun_turu", urun)

    agac = st.sidebar.selectbox(
        "Ağaç Türü",
        secenek_kademeli(sonuc, "agac_turu"),
        key="agac_v7"
    )
    sonuc = uygula_esitlik(sonuc, "agac_turu", agac)

    sinif = st.sidebar.selectbox(
        "Sınıf",
        secenek_kademeli(sonuc, "sinif"),
        key="sinif_v7"
    )
    sonuc = uygula_esitlik(sonuc, "sinif", sinif)

    boy = st.sidebar.selectbox(
        "Boy Kodu",
        secenek_kademeli(sonuc, "boy_kodu"),
        key="boy_v7"
    )
    sonuc = uygula_esitlik(sonuc, "boy_kodu", boy)

    cap = st.sidebar.selectbox(
        "Çap Kodu",
        secenek_kademeli(sonuc, "cap_kodu"),
        key="cap_v7"
    )
    sonuc = uygula_esitlik(sonuc, "cap_kodu", cap)

    # Fiyat ve miktar sliderları artık seçilmiş filtrelerden kalan sonuca göre oluşur.
    if not sonuc.empty and "muhammen_birim_fiyat" in sonuc.columns and sonuc["muhammen_birim_fiyat"].notna().any():
        min_f = int(sonuc["muhammen_birim_fiyat"].min())
        max_f = int(sonuc["muhammen_birim_fiyat"].max())

        if min_f == max_f:
            st.sidebar.caption(f"Birim fiyat: {tl(min_f)}")
        else:
            fiyat = st.sidebar.slider(
                "Birim fiyat aralığı",
                min_value=min_f,
                max_value=max_f,
                value=(min_f, max_f),
                step=100,
                key="fiyat_v7"
            )
            sonuc = sonuc[
                (sonuc["muhammen_birim_fiyat"] >= fiyat[0]) &
                (sonuc["muhammen_birim_fiyat"] <= fiyat[1])
            ]

    if not sonuc.empty and "miktar_m3_hesap" in sonuc.columns and sonuc["miktar_m3_hesap"].notna().any():
        min_m = float(round(sonuc["miktar_m3_hesap"].min(), 2))
        max_m = float(round(sonuc["miktar_m3_hesap"].max(), 2))

        if min_m == max_m:
            st.sidebar.caption(f"Miktar: {m3(min_m)}")
        else:
            miktar = st.sidebar.slider(
                "Miktar aralığı m³",
                min_value=min_m,
                max_value=max_m,
                value=(min_m, max_m),
                step=1.0,
                key="miktar_v7"
            )
            sonuc = sonuc[
                (sonuc["miktar_m3_hesap"] >= miktar[0]) &
                (sonuc["miktar_m3_hesap"] <= miktar[1])
            ]

    if not sonuc.empty and "firsat_puani" in sonuc.columns and sonuc["firsat_puani"].notna().any():
        min_puan = int(sonuc["firsat_puani"].min())
        max_puan = int(sonuc["firsat_puani"].max())

        if min_puan == max_puan:
            st.sidebar.caption(f"Fırsat puanı: {min_puan}")
        else:
            puan_araligi = st.sidebar.slider(
                "Fırsat puanı",
                min_value=min_puan,
                max_value=max_puan,
                value=(min_puan, max_puan),
                step=1,
                key="puan_v7"
            )
            sonuc = sonuc[
                (sonuc["firsat_puani"] >= puan_araligi[0]) &
                (sonuc["firsat_puani"] <= puan_araligi[1])
            ]

    sadece_supheli = st.sidebar.checkbox("Sadece şüpheli fiyatları göster", key="supheli_v7")
    if sadece_supheli:
        sonuc = sonuc[sonuc["supheli_fiyat"] == True]

    siralama = st.sidebar.selectbox(
        "Sıralama",
        [
            "Fırsat puanı yüksek",
            "En ucuz birim fiyat",
            "En pahalı birim fiyat",
            "En yüksek miktar",
            "En düşük miktar",
            "Parti no artan",
        ],
        key="siralama_v7"
    )

    if sonuc.empty:
        return sonuc

    if siralama == "Fırsat puanı yüksek" and {"firsat_puani", "muhammen_birim_fiyat"}.issubset(sonuc.columns):
        sonuc = sonuc.sort_values(["firsat_puani", "muhammen_birim_fiyat"], ascending=[False, True])
    elif siralama == "En ucuz birim fiyat" and "muhammen_birim_fiyat" in sonuc.columns:
        sonuc = sonuc.sort_values("muhammen_birim_fiyat", ascending=True)
    elif siralama == "En pahalı birim fiyat" and "muhammen_birim_fiyat" in sonuc.columns:
        sonuc = sonuc.sort_values("muhammen_birim_fiyat", ascending=False)
    elif siralama == "En yüksek miktar" and "miktar_m3_hesap" in sonuc.columns:
        sonuc = sonuc.sort_values("miktar_m3_hesap", ascending=False)
    elif siralama == "En düşük miktar" and "miktar_m3_hesap" in sonuc.columns:
        sonuc = sonuc.sort_values("miktar_m3_hesap", ascending=True)
    elif siralama == "Parti no artan" and "parti_no" in sonuc.columns:
        sonuc = sonuc.sort_values("parti_no", ascending=True)

    return sonuc


def firsat_puani_bilgi_kutusu():
    with st.expander("ℹ️ Fırsat puanı nasıl hesaplanır?", expanded=False):
        st.markdown(
            """
            **V21 puan mantığı kalite ağırlıklıdır.**

            Önce ürün şu detaylarla kalite kategorisine ayrılır:

            `Ağaç türü + Ürün türü + Sınıf + Boy kodu + Çap kodu`

            Örnekler:

            - Karaçam Tomruk 1. sınıf uzun boy
            - Kızılçam Tomruk 2. sınıf normal boy
            - Göknar Kağıtlık Odun

            Sistem önce ürünü kendi kalite kategorisi içinde kıyaslar. Eğer o detay kategoride yeterli kayıt yoksa ana kategoriye düşer:

            `Ağaç türü + Ürün türü`

            Ayrıca 1. sınıf, uzun boy ve kalın çap gibi kalite göstergeleri ekstra kalite puanı alır. Böylece iyi mal sadece fiyatı daha pahalı diye haksız yere düşük görünmez.
            """
        )

def ozet(df: pd.DataFrame):
    adet = len(df)
    en_ucuz = df["muhammen_birim_fiyat"].min() if adet else None
    ort = df["muhammen_birim_fiyat"].mean() if adet else None
    toplam_miktar = df["miktar_m3_hesap"].sum() if adet else None
    supheli = int(df["supheli_fiyat"].sum()) if adet else 0
    en_yuksek_puan = df["firsat_puani"].max() if adet and "firsat_puani" in df.columns else None

    c1, c2, c3, c4, c5, c6 = st.columns(6)
    c1.metric("Kayıt", sayi(adet))
    c2.metric("En ucuz", tl(en_ucuz))
    c3.metric("Ortalama", tl(ort))
    c4.metric("Toplam miktar", m3(toplam_miktar))
    c5.metric("En yüksek puan", sayi(en_yuksek_puan))
    c6.metric("Şüpheli fiyat", sayi(supheli))


def ozet_kutu(baslik, row):
    if row is None or row.empty:
        st.markdown(
            f"""
            <div class="topbox">
                <div class="topbox-title">{baslik}</div>
                <div class="topbox-main">Veri yok</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
        return

    st.markdown(
        f"""
        <div class="topbox">
            <div class="topbox-title">{baslik}</div>
            <div class="topbox-main">Parti {sayi(row.get("parti_no"))} — {temiz_metin(row.get("urun_adi"))}</div>
            <div class="topbox-sub">
                <b>{tl(row.get("muhammen_birim_fiyat"))} / m³</b><br>
                Miktar: {m3(row.get("miktar_m3_hesap"))}<br>
                Fırsat: {sayi(row.get("firsat_puani"))}/100 — {temiz_metin(row.get("firsat_seviyesi"))}
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def one_cikanlar(df: pd.DataFrame):
    if df.empty:
        return

    st.subheader("Öne çıkanlar")

    uygun = df.copy()

    c1, c2, c3, c4 = st.columns(4)

    with c1:
        row = uygun.sort_values(["firsat_puani", "muhammen_birim_fiyat"], ascending=[False, True]).iloc[0]
        ozet_kutu("En yüksek fırsat puanı", row)

    with c2:
        row = uygun.sort_values("muhammen_birim_fiyat", ascending=True).iloc[0]
        ozet_kutu("En ucuz birim fiyat", row)

    with c3:
        row = uygun.sort_values("miktar_m3_hesap", ascending=False).iloc[0]
        ozet_kutu("En yüksek miktar", row)

    with c4:
        if "Maden Direği" in uygun.get("urun_turu", pd.Series()).values:
            row = uygun[uygun["urun_turu"] == "Maden Direği"].sort_values("muhammen_birim_fiyat", ascending=True).iloc[0]
            ozet_kutu("En ucuz maden direği", row)
        elif "Tomruk" in uygun.get("urun_turu", pd.Series()).values:
            row = uygun[uygun["urun_turu"] == "Tomruk"].sort_values("muhammen_birim_fiyat", ascending=True).iloc[0]
            ozet_kutu("En ucuz tomruk", row)
        else:
            row = uygun.sort_values("muhammen_birim_fiyat", ascending=True).iloc[0]
            ozet_kutu("En ucuz ürün", row)



def urun_eslesir(urun_turu, hedef):
    u = temiz_metin(urun_turu).lower()
    h = hedef.lower()

    if not u:
        return False

    if h == "tomruk":
        return "tomruk" in u
    if h == "maden direği":
        return "maden" in u
    if h == "kağıtlık odun":
        return "kağıt" in u or "kagit" in u
    if h == "sanayi odunu":
        return "sanayi" in u
    if h == "dikili ağaç":
        return "dikili" in u

    return h in u


def urun_pano_kutusu(baslik, alt_df: pd.DataFrame, css_class="urun-genel"):
    if alt_df is None or alt_df.empty:
        st.markdown(
            f"""
            <div class="product-board {css_class}">
                <div class="product-board-title">{baslik}</div>
                <div class="product-board-main">Veri yok</div>
                <div class="product-board-sub">Bu filtrelerde bu ürün türü bulunamadı.</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
        return

    ucuz = alt_df.sort_values("muhammen_birim_fiyat", ascending=True).iloc[0]
    iyi = alt_df.sort_values(["firsat_puani", "muhammen_birim_fiyat"], ascending=[False, True]).iloc[0]
    ort = alt_df["muhammen_birim_fiyat"].mean()
    toplam_miktar = alt_df["miktar_m3_hesap"].sum() if "miktar_m3_hesap" in alt_df.columns else None

    st.markdown(
        f"""
        <div class="product-board {css_class}">
            <div class="product-board-title">{baslik}</div>
            <div class="product-board-main">Parti {sayi(ucuz.get("parti_no"))} — {tl(ucuz.get("muhammen_birim_fiyat"))} / m³</div>
            <div class="product-board-sub">
                Ürün: {temiz_metin(ucuz.get("urun_adi"))}<br>
                En iyi fırsat: Parti {sayi(iyi.get("parti_no"))} — {sayi(iyi.get("firsat_puani"))}/100<br>
                Ortalama: {tl(ort)} / m³<br>
                Toplam: {m3(toplam_miktar)} | Kayıt: {len(alt_df)}
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def urun_bazli_firsat_panosu(df: pd.DataFrame):
    if df.empty or "urun_turu" not in df.columns:
        return

    st.markdown('<div class="compact-note">Renkler: Tomruk sarı, Maden direği mavi, Kağıtlık kırmızı, Sanayi yeşil, Dikili mor.</div>', unsafe_allow_html=True)

    urunler = [
        ("Tomruk fırsatları", "tomruk", "urun-tomruk"),
        ("Maden direği fırsatları", "maden direği", "urun-maden"),
        ("Kağıtlık odun fırsatları", "kağıtlık odun", "urun-kagitlik"),
        ("Sanayi odunu fırsatları", "sanayi odunu", "urun-sanayi"),
        ("Dikili ağaç fırsatları", "dikili ağaç", "urun-dikili"),
    ]

    satir1 = st.columns(3)
    satir2 = st.columns(2)

    kolonlar = list(satir1) + list(satir2)

    for kolon, (baslik, hedef, css_class) in zip(kolonlar, urunler):
        alt = df[df["urun_turu"].apply(lambda x: urun_eslesir(x, hedef))]
        with kolon:
            urun_pano_kutusu(baslik, alt, css_class)


def kart(k):
    parti = sayi(k.get("parti_no"))
    urun = temiz_metin(k.get("urun_adi")) or "-"
    fiyat = tl(k.get("muhammen_birim_fiyat"))
    miktar = m3(k.get("miktar_m3_hesap"))
    toplam = tl(k.get("toplam_muhammen_hesap"))
    teminat = tl(k.get("teminat_tutari"))
    obm = temiz_metin(k.get("obm"))
    oim = temiz_metin(k.get("oim"))
    durum = temiz_metin(k.get("parti_durum"))
    link = temiz_metin(k.get("kaynak_link"))
    supheli = bool(k.get("supheli_fiyat", False))
    neden = temiz_metin(k.get("supheli_neden"))
    puan = sayi(k.get("firsat_puani"))
    seviye = temiz_metin(k.get("firsat_seviyesi"))

    tags = []
    tags.append(f'<span class="score-badge">Fırsat {puan}/100 — {seviye}</span>')

    fiyat_durumu = temiz_metin(k.get("fiyat_durumu"))
    if fiyat_durumu:
        tags.append(f'<span class="price-status">Fiyat: {fiyat_durumu}</span>')

    puan_kategorisi = temiz_metin(k.get("puan_kategorisi"))
    if puan_kategorisi:
        tags.append(f'<span class="badge">Kalite kategorisi: {puan_kategorisi}</span>')

    karsilastirma = temiz_metin(k.get("karsilastirma_kategorisi"))
    if karsilastirma and karsilastirma != puan_kategorisi:
        tags.append(f'<span class="badge">Kıyas: {karsilastirma}</span>')

    kalite_puani = k.get("kalite_puani", None)
    if kalite_puani is not None and not pd.isna(kalite_puani):
        tags.append(f'<span class="badge">Kalite puanı: {sayi(kalite_puani)}</span>')

    for alan in ["urun_turu", "agac_turu", "sinif", "boy_kodu", "cap_kodu"]:
        val = k.get(alan, "")
        if gecerli_metin(val):
            tags.append(f'<span class="badge">{str(val).strip()}</span>')

    uyari = f'<span class="warn">⚠️ {neden}</span>' if supheli else ""
    link_html = f'<a href="{link}" target="_blank">Kaynakta Aç</a>' if link else "-"

    st.markdown(
        f"""
        <div class="result-card">
            <div class="result-title">Parti {parti} — {urun} {uyari}</div>
            <div>{''.join(tags)}</div>
            <div class="price">{fiyat} / m³</div>
            <div class="mini">
                <b>Miktar:</b> {miktar} &nbsp; | &nbsp;
                <b>Toplam:</b> {toplam} &nbsp; | &nbsp;
                <b>Teminat:</b> {teminat}<br>
                <b>Yer:</b> {obm} / {oim}<br>
                <b>Durum:</b> {durum}<br>
                {link_html}
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def kartlar(df: pd.DataFrame):
    if df.empty:
        st.warning("Bu filtrelere uygun sonuç bulunamadı.")
        return

    toplam = len(df)

    # Streamlit slider, min_value ve max_value aynı olunca hata verebiliyor.
    # Tek kayıt kalırsa slider göstermeden doğrudan 1 kart gösteriyoruz.
    if toplam == 1:
        adet = 1
        st.caption("1 kart gösteriliyor.")
    else:
        ust = min(50, toplam)
        varsayilan = min(20, toplam)

        # Ek güvenlik: ust 1'e düşerse slider açma.
        if ust <= 1:
            adet = 1
            st.caption("1 kart gösteriliyor.")
        else:
            adet = st.slider(
                "Gösterilecek kart sayısı",
                min_value=1,
                max_value=ust,
                value=varsayilan,
                key="kart_sayisi_v9"
            )

    for _, row in df.head(adet).iterrows():
        kart(row)


def tablo(df: pd.DataFrame):
    if df.empty:
        st.warning("Bu filtrelere uygun sonuç bulunamadı.")
        return

    kolonlar = [
        "firsat_puani",
        "firsat_seviyesi",
        "fiyat_durumu",
        "kalite_puani",
        "puan_kategorisi",
        "karsilastirma_kategorisi",
        "kalite_ozeti",
        "parti_no",
        "ihale_no",
        "cografi_bolge",
        "obm",
        "oim",
        "urun_adi",
        "urun_turu",
        "agac_turu",
        "sinif",
        "boy_kodu",
        "cap_kodu",
        "adet",
        "miktar_m3_hesap",
        "muhammen_birim_fiyat",
        "teminat_tutari",
        "toplam_muhammen_hesap",
        "supheli_fiyat",
        "supheli_neden",
        "kaynak_link",
    ]

    kolonlar = [c for c in kolonlar if c in df.columns]
    gorunen = df[kolonlar].copy()

    metin_kolonlari = [
        "firsat_seviyesi", "fiyat_durumu", "puan_kategorisi", "karsilastirma_kategorisi", "kalite_ozeti", "cografi_bolge", "obm", "oim", "urun_adi", "urun_turu",
        "agac_turu", "sinif", "boy_kodu", "cap_kodu", "supheli_neden"
    ]
    for kolon in metin_kolonlari:
        if kolon in gorunen.columns:
            gorunen[kolon] = gorunen[kolon].apply(lambda x: temiz_metin(x))

    st.dataframe(
        gorunen,
        use_container_width=True,
        hide_index=True,
        column_config={
            "firsat_puani": st.column_config.ProgressColumn("Fırsat Puanı", min_value=0, max_value=100, format="%d"),
            "firsat_seviyesi": "Fırsat Seviyesi",
            "fiyat_durumu": "Fiyat Durumu",
            "kalite_puani": st.column_config.NumberColumn("Kalite Puanı", format="%d"),
            "puan_kategorisi": "Kalite Kategorisi",
            "karsilastirma_kategorisi": "Kıyas Kategorisi",
            "kalite_ozeti": "Kalite Özeti",
            "parti_no": "Parti",
            "ihale_no": "İhale No",
            "cografi_bolge": "Bölge",
            "obm": "OBM",
            "oim": "OİM",
            "urun_adi": "Ürün",
            "urun_turu": "Ürün Türü",
            "agac_turu": "Ağaç Türü",
            "boy_kodu": "Boy",
            "cap_kodu": "Çap",
            "miktar_m3_hesap": st.column_config.NumberColumn("Miktar m³", format="%.3f"),
            "muhammen_birim_fiyat": st.column_config.NumberColumn("Birim Fiyat TL", format="%.0f"),
            "teminat_tutari": st.column_config.NumberColumn("Teminat TL", format="%.0f"),
            "toplam_muhammen_hesap": st.column_config.NumberColumn("Toplam TL", format="%.0f"),
            "supheli_fiyat": "Şüpheli",
            "supheli_neden": "Şüpheli Nedeni",
            "kaynak_link": st.column_config.LinkColumn("Kaynakta Aç"),
        },
    )


def analiz(df: pd.DataFrame):
    if df.empty:
        st.warning("Bu filtrelere uygun sonuç bulunamadı.")
        return

    c1, c2 = st.columns(2)
    with c1:
        st.subheader("Ürün türü")
        st.bar_chart(df["urun_turu"].value_counts())

    with c2:
        st.subheader("Ağaç türü")
        st.bar_chart(df["agac_turu"].value_counts())

    st.subheader("Fırsat puanı dağılımı")
    st.bar_chart(df["firsat_seviyesi"].value_counts())

    if "fiyat_durumu" in df.columns:
        st.subheader("Fiyat durumu dağılımı")
        st.bar_chart(df["fiyat_durumu"].value_counts())

    if "puan_kategorisi" in df.columns:
        st.subheader("Kalite kategorisi dağılımı")
        st.bar_chart(df["puan_kategorisi"].value_counts())

    if "kalite_puani" in df.columns:
        st.subheader("Kalite puanı özeti")
        kalite_ozet = df["kalite_puani"].describe().to_frame("Kalite Puanı")
        st.dataframe(kalite_ozet, use_container_width=True)

    st.subheader("Ortalama fiyat özeti")
    pivot = (
        df.groupby(["agac_turu", "urun_turu"], dropna=False)["muhammen_birim_fiyat"]
        .agg(["count", "min", "mean", "max"])
        .reset_index()
        .rename(
            columns={
                "agac_turu": "Ağaç Türü",
                "urun_turu": "Ürün Türü",
                "count": "Kayıt",
                "min": "En Ucuz",
                "mean": "Ortalama",
                "max": "En Pahalı",
            }
        )
    )
    st.dataframe(pivot, use_container_width=True, hide_index=True)


okunacak_csv = en_guncel_csv_bul()
st.session_state["okunan_csv"] = okunacak_csv

df_raw = csv_oku(okunacak_csv)

if df_raw.empty:
    st.error(
        f"CSV bulunamadı: {okunacak_csv}\n\n"
        "CSV dosyasını bu uygulamayla aynı klasöre koy veya soldan CSV yükle."
    )
    st.stop()

paket = lisans_kontrolu()

takip_kullanici_kodu_al()

df = hazirla(df_raw)
takip_hedefini_uygula()
sonuc = filtrele(df, paket)

st.caption(f"Okunan dosya: **{okunacak_csv}** — Filtreler kademeli çalışır; seçilen bölgeye göre diğer seçenekler daralır.")

paket_bilgi_goster(paket)

firsat_puani_bilgi_kutusu()

guncelleme_ozeti_goster()

ozet(sonuc)

st.divider()

with st.expander("⭐ Öne çıkanları göster / gizle", expanded=False):
    one_cikanlar(sonuc)

with st.expander("🌲 Ürün bazlı fırsat panosunu göster / gizle", expanded=False):
    urun_bazli_firsat_panosu(sonuc)

yeni_kayitlar_panosu(sonuc)

alarm_merkezi_panosu(df)

takip_listesi_panosu(df)

st.divider()

g1, g2 = st.columns([1, 1])
with g1:
    gorunum = st.radio("Görünüm", ["Kartlar", "Tablo", "Analiz"], horizontal=True, key="gorunum_v6")
with g2:
    st.write("")

if gorunum == "Kartlar":
    kartlar(sonuc)
elif gorunum == "Tablo":
    tablo(sonuc)
else:
    if premium_aktif(paket):
        analiz(sonuc)
    else:
        kilitli_ozellik(
            "Analiz görünümü",
            "Analiz görünümü premium lisansa ayrıldı. Kartlar, Tablo, Öne çıkanlar ve Ürün bazlı fırsat panosu ücretsiz açık kalır."
        )

st.divider()

if premium_aktif(paket):
    st.download_button(
        "Filtrelenen sonuçları CSV indir",
        data=sonuc.to_csv(index=False, encoding="utf-8-sig"),
        file_name="depo_radari_filtreli_sonuclar.csv",
        mime="text/csv",
    )
else:
    kilitli_ozellik(
        "Rapor indirme",
        "CSV/Excel raporu indirme premium lisansa ayrıldı. Ücretsiz kullanımda sonuçlar ekranda görüntülenir."
    )

st.caption("Depo Radarı bağımsız bir analiz prototipidir. Fırsat puanı tahmini karşılaştırma amaçlıdır, kesin alım tavsiyesi değildir.")
