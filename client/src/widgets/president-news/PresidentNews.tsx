import { Reveal } from "@/shared/ui/Reveal";
import { PhotoSlides, type Slide } from "@/shared/ui/PhotoSlides";

const PHOTOS: Slide[] = [
  { src: "/images/president-news/photo-1.jpg", alt: "Президент Шавкат Мирзиёев на презентации", position: "60% center" },
  { src: "/images/president-news/photo-2.jpg", alt: "Презентация по развитию системы здравоохранения", position: "center 55%" },
  { src: "/images/president-news/photo-3.jpg", alt: "Выступление на презентации", position: "55% center" },
];

const SOURCE = "https://president.uz/ru/lists/view/9164";

/** News of the President's healthcare presentation, with its photos changing beside the text. */
export function PresidentNews() {
  return (
    <section id="president-news" className="president-news">
      <div className="president-news-copy">
        <Reveal>
          <p className="president-news-eyebrow">Новости</p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2>
            Президент Шавкат Мирзиёев ознакомился с презентацией по мерам дальнейшего развития системы
            здравоохранения, повышения качества медицинских услуг и расширения участия частного сектора.
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <a href={SOURCE} target="_blank" rel="noopener noreferrer" className="president-news-link">
            Читать на president.uz
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M7 17 17 7M8 7h9v9" />
            </svg>
          </a>
        </Reveal>
      </div>
      <PhotoSlides photos={PHOTOS} className="president-news-photos" />
    </section>
  );
}
