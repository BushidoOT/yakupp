/* source: mesaha-v359-forest-facts-rotator */
(function () {
        const FACTS = [
          "Dünya kara alanının yaklaşık %31’i ormanlarla kaplıdır.",
          "Dünyada yaklaşık 4,06 milyar hektar orman alanı bulunur.",
          "Dünya orman alanı kişi başına yaklaşık 5.000 m²’ye denk gelir.",
          "Ormanların yaklaşık yarısı görece bozulmamış doğal yapıdadır.",
          "Dünya ormanlarının üçte birinden fazlası birincil ormandır.",
          "Dünya ormanlarının yarısından fazlası sadece 5 ülkede bulunur.",
          "Dünya ormanlarının yaklaşık %66’sı sadece 10 ülkede yer alır.",
          "Rusya, Brezilya, Kanada, ABD ve Çin en büyük orman alanlarına sahip ülkelerdendir.",
          "1990’dan beri yaklaşık 420 milyon hektar orman başka kullanımlara dönüştürüldü.",
          "2015-2020 arasında yıllık ormansızlaşma yaklaşık 10 milyon hektar oldu.",
          "1990’larda yıllık ormansızlaşma yaklaşık 16 milyon hektardı.",
          "Birincil orman alanı 1990’dan bu yana 80 milyon hektardan fazla azaldı.",
          "Tarımsal genişleme, ormansızlaşmanın ana nedenlerinden biridir.",
          "2000-2010’da tropikal ormansızlaşmanın yaklaşık %40’ı büyük ölçekli tarımdan geldi.",
          "2000-2010’da tropikal ormansızlaşmanın yaklaşık %33’ü geçimlik tarımdan kaynaklandı.",
          "Dünyada bilimsel olarak kaydedilmiş 60 binden fazla ağaç türü vardır.",
          "Ağaç türlerinin yaklaşık %45’i yalnızca 10 bitki ailesinde toplanır.",
          "Ağaç türlerinin yaklaşık %58’i sadece tek bir ülkede doğal olarak bulunur.",
          "2019’da 20 binden fazla ağaç türü IUCN Kırmızı Listesi’nde yer aldı.",
          "Kırmızı Liste’deki ağaç türlerinin 8 binden fazlası küresel ölçekte tehdit altındadır.",
          "1.400’den fazla ağaç türü kritik tehlike altında kabul edilir.",
          "Dünyada yaklaşık 392 bin damarlı bitki türü bilimce tanınır.",
          "Damarlı bitkilerin yaklaşık %94’ü çiçekli bitkilerdir.",
          "Bilinen damarlı bitkilerin yaklaşık %21’i yok olma tehdidi altındadır.",
          "Tropikal ormanlar, damarlı bitkilerin büyük bölümüne yaşam alanı sağlar.",
          "Bilimce adlandırılmış yaklaşık 144 bin mantar türü vardır.",
          "Mantar türlerinin büyük kısmının hâlâ bilimce tanımlanmadığı tahmin edilir.",
          "Toplam mantar türü sayısının 2,2 ile 3,8 milyon arasında olabileceği düşünülür.",
          "Dünyada yaklaşık 70 bin omurgalı türü tanımlanmıştır.",
          "Ormanlar yaklaşık 5 bin amfibi türüne yaşam alanı sağlar.",
          "Ormanlar yaklaşık 7.500 kuş türü için yaşam alanıdır.",
          "Ormanlar 3.700’den fazla memeli türüne ev sahipliği yapar.",
          "Ormanlar sadece ağaç değil; bitki, hayvan, mantar ve mikroorganizma sistemidir.",
          "Toprak mikropları, orman döngüsünün görünmeyen çalışanlarıdır.",
          "Tozlayıcı böcekler ve kuşlar, orman yenilenmesinde önemli rol oynar.",
          "Mangrov ormanları birçok balık ve deniz canlısı için üreme alanıdır.",
          "Ormanlar dünya genelinde 86 milyondan fazla yeşil işe katkı sağlar.",
          "Yaklaşık 880 milyon insan yakacak odun veya odun kömürü toplama işiyle ilişkilidir.",
          "Aşırı yoksulluk içinde yaşayan birçok insan geçiminin bir kısmında ormanlara bağlıdır.",
          "Korunan alanlara yılda yaklaşık 8 milyar ziyaret yapıldığı tahmin edilir.",
          "Yerel ve yerli halkların yönettiği alanlar, dünyanın kara alanının yaklaşık %28’ini kapsar.",
          "Dünya orman alanının yaklaşık %18’i yasal koruma statüsündedir.",
          "Korunan orman alanı dünya genelinde 700 milyon hektardan fazladır.",
          "Güney Amerika’da korunan orman oranı yaklaşık %31’dir.",
          "Avrupa’da korunan orman oranı yaklaşık %5 olarak verilir.",
          "2015’te tropikal yağmur ormanlarının %30’dan fazlası korunan alan içindeydi.",
          "Bazı boreal ve step orman tiplerinde koruma oranı %10’un altındadır.",
          "Bonn Challenge kapsamında 170 milyon hektar bozulmuş alanın onarımı taahhüt edilmiştir.",
          "Orman restorasyonu doğru yapılırsa yaşam alanlarını ve yerel geçimi destekler.",
          "Ormanlar karbon, su ve besin döngülerinin temel parçalarındandır.",
          "Orman toprağı suyu tutarak yer altı sularının beslenmesine yardım eder.",
          "Ağaç kökleri toprağı tutar ve erozyon riskini azaltır.",
          "Yaşlı ormanlar karbon depolama açısından çok değerli doğal alanlardır.",
          "Genç ormanlar hızlı büyür; olgun ormanlar ekosisteme denge katar.",
          "Orman yangınlarında küçük bir kıvılcım geniş alanları etkileyebilir.",
          "Bir olgun ağaç, yıllık oksijen üretimiyle yaklaşık iki kişinin ihtiyacına katkı sağlayabilir.",
          "Bir olgun ağaç yılda yaklaşık 50 pound karbondioksiti bağlayabilir.",
          "Şehir çevresindeki ağaçlar gölge sağlayarak sıcaklık etkisini azaltır.",
          "Ormanların korunması; suyu, toprağı, havayı ve canlı çeşitliliğini korur.",
          "Her doğru ölçüm, ormanın gelecekteki planlamasına katkı sağlar.",
        ];
        function pickTextBox() {
          const hero = document.querySelector(".hero-card");
          if (!hero) return null;
          let wrap = hero.querySelector("div");
          if (!wrap) wrap = hero;
          let p = document.getElementById("forestFactText");
          if (!p) {
            p = hero.querySelector("p") || document.createElement("p");
            p.id = "forestFactText";
            if (!p.parentElement) wrap.appendChild(p);
          }
          return p;
        }
        let index = 0;
        function setFact(force) {
          const p = pickTextBox();
          if (!p || !FACTS.length) return;
          if (!force) p.classList.add("fact-changing");
          setTimeout(
            function () {
              p.textContent = FACTS[index % FACTS.length];
              p.classList.remove("fact-changing");
              index++;
            },
            force ? 0 : 180,
          );
        }
        function shouldRotate() {
          var home = document.getElementById("homeView"),
            u = window.MesahaUtils;
          return (
            document.visibilityState !== "hidden" &&
            (!home || home.classList.contains("active")) &&
            !(u && u.lowPower && u.lowPower())
          );
        }
        function schedule() {
          clearTimeout(window.__mesahaForestFactTimer);
          if (!shouldRotate()) return;
          window.__mesahaForestFactTimer = setTimeout(function () {
            setFact(false);
            schedule();
          }, 8000);
        }
        function boot() {
          setFact(true);
          schedule();
        }
        document.addEventListener("visibilitychange", schedule, {
          passive: true,
        });
        window.addEventListener("mesaha:view-changed", schedule, {
          passive: true,
        });
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", boot, { once: true });
        else boot();
      })();
;

/* source: mesaha-v361-user-greeting-final */
(function () {
        "use strict";
        var PANEL_KEY = "mesaha_panel_user_v316",
          SETTINGS_KEY = "cam_mesaha_ayarlar_v1";
        function clean(v) {
          return String(v || "").trim();
        }
        function titleName(name) {
          name = clean(name);
          return name
            ? name
                .split(/\s+/)
                .map(function (p) {
                  return p
                    ? p.charAt(0).toLocaleUpperCase("tr-TR") + p.slice(1)
                    : "";
                })
                .join(" ")
            : "";
        }
        function readJson(k) {
          try {
            return JSON.parse(localStorage.getItem(k) || "{}") || {};
          } catch (e) {
            return {};
          }
        }
        function currentName() {
          var p = readJson(PANEL_KEY),
            s = readJson(SETTINGS_KEY);
          return clean(p.name) || clean(s.ekipNot) || "";
        }
        function apply() {
          var h = document.querySelector(".hero-card h1");
          if (!h) return;
          var n = titleName(currentName());
          h.textContent = n ? "Merhaba, " + n : "Merhaba";
        }
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", apply, { once: true });
        else apply();
        [120, 900].forEach(function (ms) { setTimeout(apply, ms); });
        window.addEventListener("storage", apply);
        window.addEventListener("mesaha:user-login", apply, { passive: true });
        window.addEventListener("mesaha:google-access-approved", apply, { passive: true });
        document.addEventListener(
          "visibilitychange",
          function () {
            if (!document.hidden) apply();
          },
          { passive: true },
        );
      })();
;

/* source: mesaha-v365-network-status-final-2 */
(function () {
        "use strict";
        var seq = 0,
          lastMode = "";
        function $(id) {
          return document.getElementById(id);
        }
        function setStatus(mode) {
          lastMode = mode;
          var card = $("netStatusCard"),
            text = $("netText"),
            sub = $("netSubText"),
            icon = $("netIcon");
          var online = mode === "online",
            offline = mode === "offline",
            checking = mode === "checking";
          if (card) {
            card.classList.toggle("net-online", online);
            card.classList.toggle("net-offline", offline);
            card.classList.toggle("net-checking", checking);
          }
          if (text)
            text.textContent = online
              ? "Çevrimiçi"
              : offline
                ? "Çevrimdışı"
                : "Kontrol ediliyor";
          if (sub)
            sub.textContent = online
              ? "Bağlantı doğrulandı"
              : offline
                ? "3 saniye cevap yoksa uygulama offline devam eder"
                : "Bağlantı 3 saniye test ediliyor…";
          if (icon) icon.textContent = online ? "✓" : offline ? "⌁" : "…";
          document.body &&
            document.body.classList.toggle("mesaha-offline", offline);
        }
        async function ping() {
          if (window.MESAHA_SUITE_MODE) {
            setStatus(navigator.onLine ? "online" : "offline");
            return navigator.onLine;
          }
          var token = ++seq;
          setStatus("checking");
          if (!navigator.onLine) {
            setStatus("offline");
            return false;
          }
          try {
            var ctrl = new AbortController();
            var timer = setTimeout(function () {
              try {
                ctrl.abort();
              } catch (e) {}
            }, 3000);
            var res = await fetch("../release.js?net=" + Date.now(), {
              cache: "no-store",
              signal: ctrl.signal,
              headers: { "Cache-Control": "no-cache" },
            });
            clearTimeout(timer);
            if (token !== seq) return false;
            setStatus(res && res.ok ? "online" : "offline");
            return !!(res && res.ok);
          } catch (e) {
            if (token === seq) setStatus("offline");
            return false;
          }
        }
        function boot() {
          ping();
        }
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", boot, { once: true });
        else boot();
        window.addEventListener("online", function () {
          setTimeout(ping, 250);
        });
        window.addEventListener("offline", function () {
          setStatus("offline");
        });
        window.mesahaNetworkPingV365 = ping;
        window.mesahaNetworkStatusV365 = function () {
          return lastMode;
        };
      })();
;

/* source: mesaha-v370-bottom-nav-watch */
(function () {
        "use strict";
        function fix() {
          var nav = document.querySelector(".bottom-nav");
          if (!nav) return;
          nav.style.display = "grid";
          nav.style.visibility = "visible";
          nav.style.opacity = "1";
          nav.style.pointerEvents = "auto";
          nav.style.position = "fixed";
          nav.style.zIndex = "2147482500";
        }
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", fix, { once: true });
        else fix();
        [80, 250, 700, 1500, 3000].forEach(function (ms) {
          setTimeout(fix, ms);
        });
        window.addEventListener("resize", fix, { passive: true });
        window.addEventListener(
          "orientationchange",
          function () {
            setTimeout(fix, 250);
          },
          { passive: true },
        );
      })();
;

/* source: mesaha-local-5 */
(function () {
        "use strict";
        function fixScroll() {
          document.documentElement.classList.add("scroll-fixing-v371");
          try {
            document.body.style.overflowY = "auto";
            document.documentElement.style.overflowY = "auto";
            document.body.style.touchAction = "pan-y";
            document.documentElement.style.touchAction = "pan-y";
          } catch (e) {}
        }
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", fixScroll, {
            once: true,
          });
        else fixScroll();
        window.addEventListener(
          "orientationchange",
          function () {
            setTimeout(fixScroll, 180);
          },
          { passive: true },
        );
        window.mesahaScrollFixV371 = {
          fix: fixScroll,
          saveBindingDisabledBy: "V5.27",
        };
      })();
;

/* source: mesaha-v373-entry-memory-backup-cutters */
(function () {
        "use strict";
        function settings() {
          return window.state && window.state.settings
            ? window.state.settings
            : {};
        }
        function records() {
          return window.state && Array.isArray(window.state.records)
            ? window.state.records
            : [];
        }
        function persist() {
          try {
            if (window.__flushSettings)
              return window.__flushSettings("entry-memory-v543");
          } catch (e) {}
          return Promise.resolve({ ok: true });
        }
        function payload() {
          var s = settings(),
            list = records();
          return {
            app: "Mesaha İO",
            backupVersion: "v554",
            exportedAt: new Date().toISOString(),
            records: list,
            settings: s,
            cutters: Array.from(
              new Set(
                []
                  .concat(
                    s.cutters || [],
                    list.map(function (r) {
                      return r && r.cutter;
                    }),
                  )
                  .filter(Boolean),
              ),
            ),
            activeCutter: s.activeCutter || "",
          };
        }
        window.mesahaEntryMemoryBackupV373 = {
          persist: persist,
          restore: function () {},
          backupPayload: payload,
          backupNow: function () {
            try {
              if (typeof window.backupJson === "function")
                return window.backupJson();
            } catch (e) {}
          },
        };
      })();
;
