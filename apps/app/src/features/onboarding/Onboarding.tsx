import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';

/**
 * First-run tutorial. Four steps, skippable, shown once per device.
 *
 * Copy here is held to roughly a grade-6 reading level and avoids any
 * claim that the system prevents lipohypertrophy — the app supports a
 * rotation habit, it does not guarantee an outcome.
 */

const STEPS = [
  {
    title: 'Rotate your injection sites',
    body: 'Injecting in the same spot again and again can thicken the tissue under your skin. That makes insulin absorb unevenly. Spreading injections out lowers that risk.',
  },
  {
    title: 'Pick a region, then a zone',
    body: 'Choose which part of your body you are injecting into, then tap the zone on the dial that matches the port you used on the guide.',
  },
  {
    title: 'Follow the suggestion',
    body: 'The highlighted zone is the one furthest from where you have injected recently. You can always pick a different one.',
  },
  {
    title: 'Your data stays here',
    body: 'Everything is stored on this device. Nothing is sent anywhere unless you turn on cloud backup in Settings.',
  },
] as const;

export function Onboarding() {
  const completeTutorial = useStore((s) => s.completeTutorial);
  const [step, setStep] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the new heading each step so a screen reader announces
  // it rather than leaving focus on a button whose label just changed.
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  if (!current) return null;

  return (
    <div className="onboard" role="dialog" aria-modal="true" aria-labelledby="onboardTitle">
      <div className="onboard__card">
        <div className="onboard__dots" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span
              key={s.title}
              className={`onboard__dot ${i === step ? 'onboard__dot--active' : ''}`}
            />
          ))}
        </div>

        <h2
          id="onboardTitle"
          ref={headingRef}
          tabIndex={-1}
          style={{ fontSize: 'var(--rg-text-xl)', margin: '0 0 var(--rg-space-3)' }}
        >
          {current.title}
        </h2>
        <p className="muted" style={{ marginBottom: 'var(--rg-space-8)' }}>
          {current.body}
        </p>
        <p className="sr-only" aria-live="polite">
          Step {step + 1} of {STEPS.length}
        </p>

        <div style={{ display: 'flex', gap: 'var(--rg-space-3)' }}>
          <button type="button" className="btn" style={{ flex: 1 }} onClick={completeTutorial}>
            Skip
          </button>
          <button
            type="button"
            className="btn"
            style={{
              flex: 2,
              background: 'var(--rg-accent)',
              color: '#fff',
              borderColor: 'transparent',
            }}
            onClick={() => (isLast ? completeTutorial() : setStep(step + 1))}
          >
            {isLast ? 'Get started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
