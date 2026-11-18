import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { glideTo } from "@/shared/lib/gsap";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";

/** Site footer on white: the brand with a way back to the top, then the mission, two link columns and the
 *  invitation for clinics on one row (rising in the first time they scroll into view), and the fine print.
 *  Link hovers only darken the text. */
export function Footer() {
  const root = useRef<HTMLElement>(null);
  const brand = "Association of Medical Organizations";

  return (
    <footer ref={root} className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-top">
          <Link to="/" className="site-footer-brand">
            <img src="/brand/logo.svg?v=2" alt="" width={44} height={44} />
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
            Medical tourism in Uzbekistan made simple: we help you find your way among the country's private clinics and choose the right course of treatment.
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
