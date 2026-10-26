import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/shared/ui/Reveal";
import { PhotoSlides, type Slide } from "@/shared/ui/PhotoSlides";

const PHOTOS: Slide[] = [
  { src: "/images/agency/photo-3.jpg", alt: "Встреча в Агентстве по развитию медицинской и фармацевтической отрасли" },
  { src: "/images/agency/photo-1.jpg", alt: "Участники встречи", position: "30% center" },
  { src: "/images/agency/photo-2.jpg", alt: "Представители частных медицинских компаний", position: "60% center" },
  { src: "/images/agency/photo-4.jpg", alt: "Подписание меморандума о взаимопонимании" },
  { src: "/images/agency/photo-5.jpg", alt: "Обмен подписанным меморандумом" },
];

/** The meeting at the Agency: its film stays pinned beside the story, which rises in paragraph by paragraph,
 *  with the photos changing below it. */
export function AgencyMeeting() {
  return (
    <section id="agency" className="agency">
      <AgencyFilm />

      <div className="agency-story">
        <Reveal>
          <p className="agency-eyebrow">Сотрудничество</p>
          <h2>Обсуждены вопросы развития сотрудничества с частными медицинскими организациями</h2>
        </Reveal>
        <Reveal className="agency-lead">
          Директор Агентства по развитию медицинской и фармацевтической отрасли Абдулла Азизов встретился с
          директором Ассоциации медицинских организаций Салохиддином Мухитдиновым, генеральным директором компании
          Medion Исломбеком Кодировым и генеральным директором компании ShohMed Муродом Назировым.
        </Reveal>
        <Reveal className="agency-text">
          В ходе встречи обсуждались расширение деятельности Ассоциации медицинских организаций, возможности Агентства
          и практические механизмы содействия в поддержке частных медицинских учреждений.
        </Reveal>
        <Reveal className="agency-text">
          Также внимание было уделено организации повышения квалификации и обучения медицинских работников за рубежом,
          изучению передового международного опыта и его внедрению в национальную медицинскую практику.
        </Reveal>
        <Reveal className="agency-text">
          На встрече состоялся обмен мнениями о существующих проблемах в частной медицине и путях их решения,
          рассмотрены перспективы сотрудничества, направленного на развитие отрасли.
        </Reveal>
        <Reveal className="agency-result">
          <strong>Итог встречи</strong>
          Между Агентством по развитию медицинской и фармацевтической отрасли и Ассоциацией медицинских организаций
          подписан меморандум о взаимопонимании.
        </Reveal>

        <PhotoSlides photos={PHOTOS} className="agency-photos" />
      </div>
    </section>
  );
}

/** Muted on a loop while on screen; not fetched until the section comes near. */
function AgencyFilm() {
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [sound, setSound] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "30% 0px" });
    io.observe(frameRef.current!);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current!;
    video.muted = !sound;
    // iOS reads the muted attribute for autoplay; React only sets the property.
    if (!sound) video.setAttribute("muted", "");
    else video.removeAttribute("muted");
    if (visible) {
      if (!video.getAttribute("src")) {
        video.src = "/videos/agency/agency.mp4";
        video.load();
      }
      void video.play().catch(() => {});
    } else video.pause();
  }, [visible, sound]);

  // A tap on the toggle is a user gesture, so it also starts the film where autoplay was refused.
  function toggleSound() {
    const video = videoRef.current!;
    video.muted = sound;
    void video.play().catch(() => {});
    setSound(!sound);
  }

  return (
    <Reveal className="agency-film">
      <div ref={frameRef} className="agency-frame">
        <video
          ref={videoRef}
          poster="/videos/agency/agency-poster.jpg"
          muted
          loop
          playsInline
          preload="none"
          aria-label="Видео о встрече в Агентстве"
        />
        <button type="button" className="cases-sound" onClick={toggleSound} aria-pressed={sound}>
          {sound ? "Выключить звук" : "Включить звук"}
        </button>
      </div>
    </Reveal>
  );
}
