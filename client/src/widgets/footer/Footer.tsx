import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { MOTION_OK, glideTo, gsap, useGSAP } from "@/shared/lib/gsap";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";

/** Site footer on white: the brand with a way back to the top, then the mission, two link columns and the
 *  invitation for clinics on one row (rising in the first time they scroll into view), and the fine print.
 *  Link hovers only darken the text. */
export function Footer() {
  const root = useRef<HTMLElement>(null);
  const brand = "Association of Medical Organizations";

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(".site-footer-grid > *", {
          y: 32,
          autoAlpha: 0,
          duration: 1,
          stagger: 0.08,
          ease: "expo.out",
          scrollTrigger: { trigger: root.current, start: "top 85%", once: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <footer ref={root} className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-top">
          <Link to="/" className="site-footer-brand">
            <img src="/brand/logo.svg" alt="" width={44} height={44} />
            <span>
              <strong>Association</strong>
              <span>of Medical Organizations</span>
            </span>
          </Link>
          <button type="button" className="site-footer-up" onClick={() => glideTo(0)}>
            Back to top
            <span>
              <ArrowIcon />
            </span>
          </button>
        </div>

        <div className="site-footer-grid">
          <p className="site-footer-about">
            We help you find your way among Uzbekistan's clinics and choose the right course of treatment.
          </p>

          <nav className="site-footer-col" aria-label="For patients">
            <p>For patients</p>
            <a href="/#medtourism">Medical tourism</a>
            <a href="/#catalog">Clinic catalog</a>
            <Link to="/checker">Find a specialty</Link>
          </nav>

          <nav className="site-footer-col" aria-label="For clinics">
            <p>For clinics</p>
            <Link to="/cabinet/login">Clinic account</Link>
            <Link to="/moderation/login">Moderator account</Link>
          </nav>

          <div className="site-footer-cta">
            <p className="site-footer-cta-title">Do you represent a clinic?</p>
            <p>List your clinic in the catalog and receive requests from patients.</p>
            <Link to="/cabinet/login" className="pill-btn is-brand">
              Add your clinic
              <span className="pill-btn-icon">
                <ArrowIcon />
              </span>
            </Link>
          </div>
        </div>

        <div className="site-footer-bottom">
          <span>© {new Date().getFullYear()} {brand}</span>
          <span>Health Checker helps choose a specialty and does not make a diagnosis.</span>
        </div>
      </div>
    </footer>
  );
}
