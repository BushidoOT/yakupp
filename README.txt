Mesaha App v82 Firebase / Mesaha İO v1.11

Bu sürüm Firebase Firestore bağlantısı ekler.

Yapılanlar:
- Firebase config uygulamaya eklendi.
- Yeni kullanıcı kayıtları Firebase'e yazılır.
- Yeni bulut yedekleri Firebase Firestore'a yazılır.
- Buluttan Getir önce Firebase'i kontrol eder, Firebase'te yoksa eski Google Apps Script sisteminden arar.
- Admin Paneli önce Firebase kullanıcılarını gösterir; gerekirse eski sistem yedek olarak çalışır.
- Admin Paneli'ne "Eski Kullanıcıları Firebase’e Aktar" butonu eklendi.
- Google Apps Script sistemi yedek/fallback olarak korunur.
- Görünen uygulama sürümü Mesaha İO v1.11 yapıldı.

Firebase'de yapılacaklar:
1. Authentication > Sign-in method > Anonymous etkinleştir.
2. Firestore > Rules kısmına FIRESTORE_RULES.txt içindeki kuralları yapıştırıp Publish/Yayınla.
3. GitHub'a index.html, manifest.json, service-worker.js, .nojekyll yükle.

Apps Script:
- Zorunlu değişiklik yoktur. Eski sistem fallback olarak kalır.

Eski Apps Script URL:
https://script.google.com/macros/s/AKfycbzv8rw3n4FuwDmiFnW3ttKuoK0mUQnzEYizjaD46z0uuFiKtqLl1zkupkB9AkOehC7ECg/exec
