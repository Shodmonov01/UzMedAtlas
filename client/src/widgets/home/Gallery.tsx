import { useRef, useState } from "react";
import { MOTION_OK, gsap, useGSAP } from "@/shared/lib/gsap";
import { PhotoLightbox, type GalleryPhoto } from "@/shared/ui/PhotoCarousel";
import { useLang, type Text } from "@/shared/i18n/lang";

type Place = { photo: string; place: Text; city: Text; alt: Text };

const SAMARKAND: Text = { ru: "Самарканд", uz: "Samarqand", en: "Samarkand" };
const KHIVA: Text = { ru: "Хива", uz: "Xiva", en: "Khiva" };
const UZBEKISTAN: Text = { ru: "Узбекистан", uz: "Oʻzbekiston", en: "Uzbekistan" };

const PLACES: Place[] = [
  { photo: "story-1", place: { ru: "Регистан в сумерках", uz: "Shom chogʻidagi Registon", en: "Registan at dusk" }, city: SAMARKAND,
    alt: { ru: "Площадь Регистан в Самарканде в подсветке под фиолетовым вечерним небом", uz: "Samarqanddagi Registon maydoni binafsha kechki osmon ostida yoritilgan", en: "Registan Square in Samarkand lit up under a violet evening sky" } },
  { photo: "story-2", place: { ru: "Ичан-Кала", uz: "Ichan qalʼa", en: "Itchan Kala" }, city: KHIVA,
    alt: { ru: "Глиняные ворота и башни стен Ичан-Калы в Хиве", uz: "Xivadagi Ichan qalʼa devorlarining loy darvozasi va minoralari", en: "The clay gate and towers of the Itchan Kala walls in Khiva" } },
  { photo: "story-3", place: { ru: "Шахи-Зинда", uz: "Shohi Zinda", en: "Shah-i-Zinda" }, city: SAMARKAND,
    alt: { ru: "Мавзолеи Шахи-Зинды с голубыми куполами в Самарканде на закате", uz: "Samarqanddagi koʻk gumbazli Shohi Zinda maqbaralari quyosh botishida", en: "The blue-domed mausoleums of Shah-i-Zinda in Samarkand at sunset" } },
  { photo: "story-4", place: { ru: "Народный танец", uz: "Xalq raqsi", en: "Folk dance" }, city: UZBEKISTAN,
    alt: { ru: "Танцоры в ярких национальных костюмах перед изразцовым порталом", uz: "Koshinli peshtoq oldida yorqin milliy libosdagi raqqoslar", en: "Dancers in bright national dress in front of a tiled portal" } },
  { photo: "story-5", place: { ru: "Кальта-Минор в сумерках", uz: "Shom chogʻidagi Kalta Minor", en: "Kalta Minor at dusk" }, city: KHIVA,
    alt: { ru: "Старый город Хивы с минаретом Кальта-Минор в сумерках", uz: "Shom chogʻida Kalta Minor minorasi bilan Xivaning eski shahri", en: "The old town of Khiva with the Kalta Minor minaret at dusk" } },
  { photo: "story-6", place: { ru: "Медресе Шердор", uz: "Sherdor madrasasi", en: "Sher-Dor Madrasa" }, city: SAMARKAND,
    alt: { ru: "Медресе Шердор на Регистане сквозь изразцовую арку", uz: "Koshinli ravoq orqali koʻringan Registondagi Sherdor madrasasi", en: "Sher-Dor Madrasa on Registan seen through a tiled arch" } },
  { photo: "story-7", place: { ru: "Керамика", uz: "Kulolchilik", en: "Ceramics" }, city: UZBEKISTAN,
    alt: { ru: "Расписные голубые керамические кувшины и латунный кумган", uz: "Naqshli koʻk sopol koʻzalar va mis qumgʻon", en: "Painted blue ceramic jugs and a brass ewer" } },
  { photo: "story-8", place: { ru: "Гур-Эмир", uz: "Goʻri Amir", en: "Gur-e-Amir" }, city: SAMARKAND,
    alt: { ru: "Мавзолей Гур-Эмир в ночной подсветке", uz: "Tungi yoritishdagi Goʻri Amir maqbarasi", en: "The Gur-e-Amir mausoleum lit up at night" } },
  { photo: "story-9", place: { ru: "Минарет Ислам-Ходжа", uz: "Islomxoʻja minorasi", en: "Islam Khodja Minaret" }, city: KHIVA,
    alt: { ru: "Изразцовый минарет над крышами Хивы на закате", uz: "Quyosh botishida Xiva tomlari uzra koshinli minora", en: "A tiled minaret over the roofs of Khiva at sunset" } },
  { photo: "story-10", place: { ru: "Мечеть Биби-Ханым", uz: "Bibixonim masjidi", en: "Bibi-Khanym Mosque" }, city: SAMARKAND,
    alt: { ru: "Мечеть Биби-Ханым за куполами Шахи-Зинды", uz: "Shohi Zinda gumbazlari ortidagi Bibixonim masjidi", en: "The Bibi-Khanym Mosque behind the domes of Shah-i-Zinda" } },
  { photo: "story-11", place: { ru: "Расписные потолки", uz: "Naqshinkor shiftlar", en: "Painted ceilings" }, city: UZBEKISTAN,
    alt: { ru: "Расписной деревянный потолок над рядом глиняных кувшинов", uz: "Bir qator loy koʻzalar ustidagi naqshli yogʻoch shift", en: "A painted wooden ceiling over a row of clay jugs" } },
  { photo: "story-12", place: { ru: "Купола Шахи-Зинды", uz: "Shohi Zinda gumbazlari", en: "Domes of Shah-i-Zinda" }, city: SAMARKAND,
    alt: { ru: "Два купола Шахи-Зинды в обрамлении кирпичной арки", uz: "Gʻisht ravoq bilan oʻralgan Shohi Zindaning ikki gumbazi", en: "Two domes of Shah-i-Zinda framed by a brick arch" } },
  { photo: "story-13", place: { ru: "Золочёные купола", uz: "Zarhal gumbazlar", en: "Gilded domes" }, city: SAMARKAND,
    alt: { ru: "Золочёный купол снизу, сияют его сотовые своды", uz: "Pastdan koʻringan zarhal gumbaz, uning muqarnas ravoqlari yaltiraydi", en: "A gilded dome seen from below, its honeycomb vaults shining" } },
  { photo: "story-14", place: { ru: "Купола Регистана", uz: "Registon gumbazlari", en: "Registan domes" }, city: SAMARKAND,
    alt: { ru: "Бирюзовый купол между изразцовыми стенами Регистана", uz: "Registonning koshinli devorlari orasidagi feruza gumbaz", en: "A turquoise dome between the tiled walls of Registan" } },
];
const ROWS = [PLACES.filter((_, i) => i % 2 === 0), PLACES.filter((_, i) => i % 2 === 1)];

/** Uzbekistan in photos: the label, the heading and one line on top, then two full-width rows of rounded photos.
 *  As the page scrolls through the section, both rows glide in from the left and out to the right, the lower one a
 *  little slower, so the photos keep sliding past. A photo opens full screen on a click, to stop and look at it (and
 *  swipe through the rest). With reduced motion the rows stand still and can be swiped. */
export function Gallery() {
  const root = useRef<HTMLElement>(null);
  const [viewing, setViewing] = useState<number | null>(null);
  const { lang, t } = useLang();
  // The same photos for the full-screen viewer, captioned "place · city".
  const viewer: GalleryPhoto[] = PLACES.map((p) => ({ id: p.photo, url: `/images/discover/${p.photo}.webp`, alt: `${t(p.place)} · ${t(p.city)}` }));

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // Each row starts shifted left by most of what it overflows and ends shifted right of where it began,
        // so the photos come in from the left and leave to the right while the section crosses the screen.
        gsap.utils.toArray<HTMLElement>(".story-track").forEach((track, i) => {
          const travel = () => Math.max(track.scrollWidth - window.innerWidth, 0) + window.innerWidth * 0.25;
          gsap.fromTo(
            track,
            { x: () => -travel() },
            {
              x: () => (i === 0 ? 0 : -travel() * 0.35),
              ease: "none",
              scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.6, invalidateOnRefresh: true },
            },
          );
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="story" aria-labelledby="story-title">
      <div className="wrap story-head">
        <div>
          <p className="story-chip">{t({ ru: "Наша страна", uz: "Bizning yurt", en: "Our country" })}</p>
          <h2 id="story-title" className="story-title">
            {lang === "ru" ? (
              <>
                Узбекистан <em>в фотографиях</em>
              </>
            ) : lang === "uz" ? (
              <>
                Oʻzbekiston <em>suratlarda</em>
              </>
            ) : (
              <>
                Uzbekistan <em>in photos</em>
              </>
            )}
          </h2>
        </div>
        <p className="story-lead">
          {t({
            ru: "Голубые купола, глиняные стены, ремёсла и танцы — недалеко от клиник.",
            uz: "Koʻk gumbazlar, loy devorlar, hunarmandchilik va raqslar — klinikalardan uncha uzoq emas.",
            en: "Blue domes, clay walls, crafts and dances, a short way from the clinics.",
          })}
        </p>
      </div>

      <div className="story-rows">
        {ROWS.map((row, r) => (
          <ul key={r} className="story-track">
            {row.map((p) => (
              <li key={p.photo} className="story-card">
                <button type="button" className="story-card-open" aria-label={`${t({ ru: "Открыть фото", uz: "Suratni ochish", en: "Open the photo" })}: ${t(p.place)}, ${t(p.city)}`} onClick={() => setViewing(PLACES.indexOf(p))}>
                <img
                  src={`/images/discover/${p.photo}-1000.webp`}
                  srcSet={`/images/discover/${p.photo}-1000.webp 1000w, /images/discover/${p.photo}.webp 1284w`}
                  sizes="(max-width: 767px) 82vw, 38vw"
                  alt={t(p.alt)}
                  loading="lazy"
                  decoding="async"
                />
                <span className="story-card-label">
                  <img src="/brand/logo.svg?v=2" alt="" width={18} height={18} />
                  <strong>{t(p.place)}</strong>
                  <span>· {t(p.city)}</span>
                </span>
                </button>
              </li>
            ))}
          </ul>
        ))}
      </div>

      <PhotoLightbox photos={viewer} index={viewing} onIndexChange={setViewing} />
    </section>
  );
}
