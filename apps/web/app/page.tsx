import Link from 'next/link';
import { DevicePlate } from '@/components/device/DevicePlate';
import {
  BUDGET,
  CREDITS,
  DEVICE,
  FMEA_TOP_RISKS,
  PRIOR_ART,
  PROBLEM_STATS,
  PROJECT,
  REFERENCES,
  REGULATORY,
  TEST_CAVEATS,
  TEST_RESULTS,
  UNVERIFIED_SPECS,
} from '@/content/project';

export default function Home() {
  return (
    <>
      {/* ── 1. Hero ─────────────────────────────────────────── */}
      <section className="hero">
        <div className="shell">
          <div className="hero__grid">
            <div>
              <p className="notice">
                <span className="notice__dot" aria-hidden="true" />
                Academic prototype — not a medical device
              </p>
              <h1>Injection-site rotation, guided by something physical.</h1>
              <p className="lede">{PROJECT.tagline}</p>
              <div className="cta-row">
                <Link className="button button--primary" href="/app">
                  See the tracker
                </Link>
                <a className="button" href={PROJECT.repo} rel="noreferrer noopener">
                  Read the code
                </a>
              </div>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="device-photo"
              src="/prototype-plate-v1.jpg"
              alt="The printed V1 guide: a red PLA plate with twelve numbered circular ports arranged in four columns and three rows, with rounded corners."
              width={677}
              height={512}
            />
          </div>
        </div>
      </section>

      {/* ── 2. The problem ──────────────────────────────────── */}
      <section id="problem">
        <div className="shell">
          <p className="eyebrow">The problem</p>
          <h2 className="section-title">
            Injecting into the same place changes how insulin is absorbed.
          </h2>
          <p className="lede">
            Repeated injection into one area thickens the subcutaneous tissue — lipohypertrophy.
            Insulin absorbs from that tissue slowly and unpredictably, which makes doses harder to
            reason about.
          </p>

          <div className="stat-grid">
            {PROBLEM_STATS.map((stat) => (
              <div key={stat.value} className="stat-card">
                <span className="stat-card__value">{stat.value}</span>
                <span className="stat-card__label">{stat.label}</span>
                <p className="stat-card__detail">{stat.detail}</p>
                <cite className="stat-card__source">{stat.source}</cite>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Why existing approaches fall short ───────────── */}
      <section id="prior-art">
        <div className="shell">
          <p className="eyebrow">Prior art</p>
          <h2 className="section-title">Rotation is well understood. Doing it is the problem.</h2>
          <p className="lede">
            We reviewed seven existing approaches and five patents. Each one leaves the same gap:
            nothing connects where the needle actually goes to what should come next.
          </p>

          <div className="compare">
            {PRIOR_ART.map((row) => (
              <div key={row.approach} className="compare__row">
                <span className="compare__approach">{row.approach}</span>
                <span className="compare__limit">{row.limitation}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. The device ───────────────────────────────────── */}
      <section id="device">
        <div className="shell">
          <p className="eyebrow">The guide</p>
          <h2 className="section-title">A plate that makes the next site unambiguous.</h2>
          <p className="lede">{DEVICE.form}</p>

          <div className="device-grid">
            <DevicePlate />

            <div>
              <ul className="spec-list">
                {DEVICE.specs.map((spec) => (
                  <li key={spec.label}>
                    <span className="spec-list__label">{spec.label}</span>
                    <span className="spec-list__value">{spec.value}</span>
                    <span className="spec-list__note">{spec.note}</span>
                  </li>
                ))}
              </ul>

              <div className="callout callout--accent">
                <p className="callout__label">V1 → V2</p>
                <p style={{ marginBottom: 'var(--rg-space-3)' }}>{DEVICE.iteration.finding}</p>
                <p style={{ marginBottom: 'var(--rg-space-3)' }}>{DEVICE.iteration.change}</p>
                <p style={{ fontSize: 'var(--rg-text-sm)', color: 'var(--rg-text-muted)' }}>
                  {DEVICE.iteration.why}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. The app ──────────────────────────────────────── */}
      <section id="app">
        <div className="shell">
          <p className="eyebrow">The tracker</p>
          <h2 className="section-title">
            The plate says where. The app remembers where you have been.
          </h2>
          <p className="lede">
            A local-first progressive web app mirroring the plate&apos;s zones. It suggests the site
            furthest from your recent injections, flags repeats before you log them, and keeps
            everything on your device.
          </p>
          <div className="cta-row">
            <Link className="button button--primary" href="/app">
              How the app works
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. Results, with caveats at equal weight ────────── */}
      <section id="results">
        <div className="shell">
          <p className="eyebrow">Validation</p>
          <h2 className="section-title">What we measured — and what we could not.</h2>
          <p className="lede">
            Five participants, simulated use, three evaluations. Both halves of this section matter
            equally.
          </p>

          <div className="table-scroll">
            <table className="results">
              <caption className="sr-only">
                Verified test results against specification, n = 5
              </caption>
              <thead>
                <tr>
                  <th scope="col">Metric</th>
                  <th scope="col">Specification</th>
                  <th scope="col">Result</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {TEST_RESULTS.map((row) => (
                  <tr key={row.metric}>
                    <td>{row.metric}</td>
                    <td>{row.spec}</td>
                    <td>{row.result}</td>
                    <td>
                      <span className="pill pill--pass">meets</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 'var(--rg-space-12)' }}>
            <h3 style={{ fontSize: 'var(--rg-text-xl)' }}>
              Five of nine specifications could not be determined
            </h3>
            <p
              style={{
                color: 'var(--rg-text-muted)',
                fontSize: 'var(--rg-text-sm)',
                marginTop: 'var(--rg-space-3)',
              }}
            >
              Each of these needs bench testing the course had neither the budget nor the timeline
              for. They are listed rather than omitted.
            </p>
            <ul className="unverified">
              {UNVERIFIED_SPECS.map((item) => (
                <li key={item.spec}>
                  <span className="pill pill--unknown">cannot determine</span> {item.spec}
                  <span>{item.blocker}</span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="caveats">
            <p className="callout__label">Read the results with these in mind</p>
            <ul>
              {TEST_CAVEATS.map((caveat) => (
                <li key={caveat}>{caveat}</li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      {/* ── 7. Rigour & ethics ──────────────────────────────── */}
      <section id="rigour">
        <div className="shell">
          <p className="eyebrow">Risk &amp; ethics</p>
          <h2 className="section-title">The failure we designed hardest against was our own.</h2>
          <p className="lede">
            The top-ranked ethical risk in our analysis was not a mechanical failure — it was the
            system convincing someone their rotation was fine when it was not. That constraint
            shaped the app&apos;s copy as much as its code.
          </p>

          <div className="rpn">
            {FMEA_TOP_RISKS.map((risk) => (
              <div key={risk.mode}>
                <p className="rpn__mode">{risk.mode}</p>
                <p className="rpn__mitigation">{risk.mitigation}</p>
                <div className="rpn__bars">
                  <div className="rpn__bar">
                    <span style={{ width: '5.5rem' }}>RPN before</span>
                    <span className="rpn__track">
                      <span
                        className="rpn__fill"
                        style={{
                          width: `${(risk.rpnBefore / 300) * 100}%`,
                          background: 'var(--rg-warn)',
                        }}
                      />
                    </span>
                    <span style={{ width: '2.5rem', textAlign: 'right' }}>{risk.rpnBefore}</span>
                  </div>
                  <div className="rpn__bar">
                    <span style={{ width: '5.5rem' }}>after</span>
                    <span className="rpn__track">
                      <span
                        className="rpn__fill"
                        style={{
                          width: `${(risk.rpnAfter / 300) * 100}%`,
                          background: 'var(--rg-accent)',
                        }}
                      />
                    </span>
                    <span style={{ width: '2.5rem', textAlign: 'right' }}>{risk.rpnAfter}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="callout">
            <p className="callout__label">Regulatory position</p>
            <p style={{ marginBottom: 'var(--rg-space-3)' }}>
              <strong>{REGULATORY.status}</strong> {REGULATORY.detail}
            </p>
            <p style={{ fontSize: 'var(--rg-text-sm)', color: 'var(--rg-text-muted)' }}>
              {REGULATORY.ifCommercialised}
            </p>
          </div>

          <div className="callout">
            <p className="callout__label">Cost</p>
            <p>
              <strong style={{ fontFamily: 'var(--rg-font-mono)' }}>{BUDGET.spent}</strong> spent
              against a {BUDGET.ceiling} ceiling. {BUDGET.note}
            </p>
          </div>

          <div className="callout">
            <p className="callout__label">Credits</p>
            <p style={{ marginBottom: 'var(--rg-space-3)' }}>{CREDITS.team}</p>
            <p style={{ fontSize: 'var(--rg-text-sm)', color: 'var(--rg-text-muted)' }}>
              {CREDITS.myRole} {CREDITS.note}
            </p>
          </div>

          <h3 style={{ fontSize: 'var(--rg-text-lg)', marginTop: 'var(--rg-space-12)' }}>
            References
          </h3>
          <ol className="refs">
            {REFERENCES.map((ref) => (
              <li key={ref}>{ref}</li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
