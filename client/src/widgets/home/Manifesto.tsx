import { useRef } from "react";

const STATS: { prefix?: string; value: number; unit: string; label: string }[] = [
  {
    prefix: "from",
    value: 30,
    unit: "%",
    label: "savings compared with clinics abroad",
  },
  {
    value: 24,
    unit: "h",
    label: "for the clinic's reply and a preliminary treatment plan",
  },
  {
    value: 6,
    unit: "languages",
    label: "to talk with coordinators and doctors",
  },
];

/** Why Uzbekistan, right under the hero: one statement whose words fill in as the reader scrolls through it,
 *  then three figures that count up while their rules draw in. With reduced motion the text and figures are final. */
export function Manifesto() {
  const root = useRef<HTMLElement>(null);

  return (
    <section ref={root} id="medtourism" className="manifesto" aria-label="About medical tourism">
      <div className="wrap">
        <div className="manifesto-head">
          <p className="manifesto-kicker">
            <span className="manifesto-kicker-dot" aria-hidden="true" />
            Why Uzbekistan
          </p>
          <p className="manifesto-text">
            <>
                Uzbekistan is becoming a country people travel to <em>for treatment</em>. We have gathered <em>vetted clinics</em>,{" "}
                <em>honest prices</em> and coordinators who speak <span className="manifesto-keep">your language.</span>
              </>
          </p>
        </div>

        <ul className="manifesto-stats">
          {STATS.map((stat) => (
            <li key={stat.value} className="manifesto-stat">
              <span className="manifesto-rule" aria-hidden="true" />
              <div className="manifesto-stat-body">
                <p className="manifesto-figure">
                  {stat.prefix ? <small>{stat.prefix}</small> : null}
                  <span className="manifesto-count">{stat.value}</span>
                  <small>{stat.unit}</small>
                </p>
                <p className="manifesto-label">{stat.label}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
