# Medion.uz /ru — референс-скриншоты

Источник: https://medion.uz/ru  
Дата съёмки: 2026-09-25  
Desktop: 1440×900 · Mobile: 390×844 · full-page PNG

Использовать как визуальный эталон для точного копирования UI в UzMedAtlas.

## Desktop — основные страницы

| Файл | URL |
|------|-----|
| `01-home-desktop.png` | https://medion.uz/ru |
| `02-doctors-list-desktop.png` | https://medion.uz/ru/doctors |
| `03-directions-list-desktop.png` | https://medion.uz/ru/directions |
| `04-services-list-desktop.png` | https://medion.uz/ru/services |
| `05-checkups-list-desktop.png` | https://medion.uz/ru/checkups |
| `06-branches-list-desktop.png` | https://medion.uz/ru/branches |
| `07-blog-list-desktop.png` | https://medion.uz/ru/blog |
| `08-about-desktop.png` | https://medion.uz/ru/about |
| `09-contacts-desktop.png` | https://medion.uz/ru/contacts |
| `10-news-list-desktop.png` | https://medion.uz/ru/news |
| `11-cart-desktop.png` | https://medion.uz/ru/cart |
| `12-privacy-desktop.png` | https://medion.uz/ru/privacy |
| `13-terms-desktop.png` | https://medion.uz/ru/terms |
| `14-offerta-desktop.png` | https://medion.uz/ru/offerta |

## Desktop — детальные / шаблоны

| Файл | URL |
|------|-----|
| `15-doctor-detail-desktop.png` | https://medion.uz/ru/doctors/abdumajidov-alisher-abdulxayevich |
| `16-direction-detail-desktop.png` | https://medion.uz/ru/directions/ginekologiya |
| `17-service-detail-desktop.png` | https://medion.uz/ru/services/2-x-stakannaya-proba-mochi |
| `18-checkup-detail-desktop.png` | https://medion.uz/ru/checkups/paket-nablyudeniya-beremennosti-odnoplodnaya-s-6-nedel-37982 |
| `19-branch-detail-desktop.png` | https://medion.uz/ru/branches/medion-innovation |
| `20-blog-detail-desktop.png` | https://medion.uz/ru/blog/akne |
| `21-news-detail-desktop.png` | https://medion.uz/ru/news/ktg-i-vedeniye-beremennosti |
| `22-404-not-found-desktop.png` | 404 шаблон (несуществующий URL) |
| `23-appointment-modal-desktop.png` | модалка «Записаться на приём» |
| `24-search-overlay-desktop.png` | оверлей поиска |
| `25-login-modal-desktop.png` | модалка «Войти» |
| `26-direction-kardiologiya-desktop.png` | https://medion.uz/ru/directions/kardiologiya |

## Mobile (ключевые шаблоны)

| Файл | URL |
|------|-----|
| `01-home-mobile.png` | главная |
| `02-doctors-list-mobile.png` | врачи |
| `03-directions-list-mobile.png` | направления |
| `04-services-list-mobile.png` | услуги |
| `05-checkups-list-mobile.png` | чек-апы |
| `08-about-mobile.png` | о нас |
| `09-contacts-mobile.png` | контакты |
| `15-doctor-detail-mobile.png` | карточка врача |
| `16-direction-detail-mobile.png` | направление |

## Навигация сайта (карта)

```
Главная
├── Врачи → /doctors → /doctors/[slug]
├── Направления → /directions → /directions/[slug]
├── Услуги → /services → /services/[slug]
├── Чек-апы → /checkups → /checkups/[slug]
├── Ещё
│   ├── Филиалы → /branches → /branches/[slug]
│   ├── Блог → /blog → /blog/[slug]
│   ├── О нас → /about
│   ├── Контакты → /contacts
│   └── News → /news → /news/[slug]
├── Корзина → /cart
└── Legal: /privacy, /terms, /offerta
```

Пересъёмка: `node docs/medion-reference/_tools/capture.mjs`
