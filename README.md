# Sentinel — Container İzleme & Alarm Panosu

Google Cloud VM'lerde Docker Compose ile çalışan servisleri (Django/FastAPI,
Nginx, PostgreSQL, Redis, Celery/Flower, RabbitMQ) izleyen, eşik kuralları
tetiklendiğinde alarm üreten ve container'lara müdahale ettirebilen operasyon
panosunun web arayüzü.

> Veriler `backend/` içindeki Sentinel API'sinden gelir (FastAPI). Giriş JWT ile
> yapılır; uygulama açılışta filoyu ve alarmları çeker ve 15 sn'de bir yeniler.
> API adresi `VITE_API_URL` ile ayarlanır (varsayılan `http://localhost:8000`).
> Önce backend'i çalıştırın: `cd backend && uvicorn app.main:app --reload`.

## Teknoloji

- **React 18 + TypeScript + Vite**
- **React Router** — sayfa yönlendirme
- **Zustand** — canlı filo verisi ve overlay (toast/modal/terminal) state'i
- **CSS değişkenleri** — `src/styles/global.css` içindeki design token'ları
- Grafikler elle yazılmış SVG'dir (bağımlılık yok)

## Komutlar

```bash
npm install      # bağımlılıklar
npm run dev      # geliştirme sunucusu (http://localhost:5173)
npm run build    # tip kontrolü + prodüksiyon derlemesi
npm run preview  # derlemeyi önizle
npm run lint     # ESLint
npm run format   # Prettier
```

## Ekranlar

| Rota                          | Ekran            | Açıklama                                            |
| ----------------------------- | ---------------- | --------------------------------------------------- |
| `/`                           | Genel bakış      | Filo KPI'ları + uygulama kartları                   |
| `/app/:id`                    | App detayı       | VM bilgisi, bağımlılık haritası, container tablosu  |
| `/app/:id/container/:cid`     | Container detayı | Metrikler / loglar / inspect / health + aksiyonlar  |
| `/alarms`                     | Alarmlar         | Seviye özeti + durum/seviye filtreleri              |
| `/incident/:id`               | Olay detayı      | Zaman çizelgesi, runbook, ilgili alarmlar           |
| `/add`                        | Uygulama ekle    | 3 adımlı kurulum sihirbazı                          |
| `/settings`                   | Ayarlar          | Alarm kuralları, otomatik onarım, kanallar, genel   |

Global: sidebar, topbar (canlı göstergesi + bildirim zili), kritik alarm
banner'ı, komut paleti (⌘K), toast/onay-modalı/terminal overlay'leri.

## Dizin Yapısı

```
src/
  components/
    ui/        Paylaşılan primitifler (Icon, Card, Button, Sparkline, …)
    layout/    Sidebar, Topbar, CriticalBanner, AlarmDropdown
    overlays/  Toast host, ConfirmModal, TerminalModal, CommandPalette
    form/       Field, TextInput, Toggle
    *.tsx       Özellik bileşenleri (AppCard, ContainerTable, DependencyMap, …)
  api/         API istemcisi, uç noktalar, tipler ve adaptörler (map)
  data/        UI meta verisi (servis / durum / severity renk & etiketleri)
  lib/         Yardımcılar (health, series, routes, containerActions)
  screens/     Sayfa bileşenleri (her rota için bir dosya + Login)
  store/       Zustand store'ları (auth, fleet, alarms, overlay)
  styles/      Design token'ları ve temel stiller
  types.ts     Domain modeli
```

## Tasarım Token'ları

Renkler, tipografi ve boşluklar `src/styles/global.css` içindeki CSS
değişkenlerinde tek noktada tutulur. UI bileşenleri bu token'lara `var(--…)`
ile başvurur — temayı değiştirmek için yalnızca bu dosyayı güncellemek yeterli.
