'use client';

import React, { useEffect } from 'react';
import { gsap } from 'gsap';

const getVar = (key: string, elem: HTMLElement | null = null) => {
  const target = elem || document.documentElement;
  return getComputedStyle(target).getPropertyValue(key);
};

export default function Test004Page() {
  useEffect(() => {
    // Radio 애니메이션
    document.querySelectorAll('.radio').forEach((elem) => {
      const svg = elem.querySelector('svg');
      const input = elem.querySelector('input') as HTMLInputElement;

      if (!svg || !input) return;

      input.addEventListener('change', () => {
        gsap.fromTo(
          input,
          {
            '--border-width': '3px',
          },
          {
            '--border-color': getVar('--c-active'),
            '--border-width': '12px',
            duration: 0.2,
          }
        );

        gsap.to(svg, {
          keyframes: [
            {
              '--top-y': '6px',
              '--top-s-x': 1,
              '--top-s-y': 1.25,
              duration: 0.2,
              delay: 0.2,
            },
            {
              '--top-y': '0px',
              '--top-s-x': 1.75,
              '--top-s-y': 1,
              duration: 0.6,
            },
          ],
        });

        gsap.to(svg, {
          keyframes: [
            {
              '--dot-y': '2px',
              duration: 0.3,
              delay: 0.2,
            },
            {
              '--dot-y': '0px',
              duration: 0.3,
            },
          ],
        });

        gsap.to(svg, {
          '--drop-y': '0px',
          duration: 0.6,
          delay: 0.4,
          clearProps: true,
          onComplete: () => {
            input.removeAttribute('style');
          },
        });
      });
    });

    // Checkbox 애니메이션
    document.querySelectorAll('.checkbox').forEach((elem) => {
      const svg = elem.querySelector('svg');
      const input = elem.querySelector('input') as HTMLInputElement;

      if (!svg || !input) return;

      input.addEventListener('change', () => {
        const checked = input.checked;

        if (!checked) {
          return;
        }

        gsap.fromTo(
          input,
          {
            '--border-width': '3px',
          },
          {
            '--border-color': getVar('--c-active'),
            '--border-width': '12px',
            duration: 0.2,
            clearProps: true,
          }
        );

        gsap.set(svg, {
          '--dot-x': '14px',
          '--dot-y': '-14px',
          '--tick-offset': '20.5px',
          '--tick-array': '16.5px',
          '--drop-s': 1,
        });

        gsap.to(elem, {
          keyframes: [
            {
              '--border-radius-corner': '14px',
              duration: 0.2,
              delay: 0.2,
            },
            {
              '--border-radius-corner': '5px',
              duration: 0.3,
              clearProps: true,
            },
          ],
        });

        gsap.to(svg, {
          '--dot-x': '0px',
          '--dot-y': '0px',
          '--dot-s': 1,
          duration: 0.4,
          delay: 0.4,
        });

        gsap.to(svg, {
          keyframes: [
            {
              '--tick-offset': '48px',
              '--tick-array': '14px',
              duration: 0.3,
              delay: 0.2,
            },
            {
              '--tick-offset': '46.5px',
              '--tick-array': '16.5px',
              duration: 0.35,
              clearProps: true,
            },
          ],
        });
      });
    });

    // Switch 애니메이션
    document.querySelectorAll('.switch').forEach((elem) => {
      const svg = elem.querySelector('svg');
      const input = elem.querySelector('input') as HTMLInputElement;

      if (!svg || !input) return;

      input.addEventListener('pointerenter', () => {
        if ((elem as any).animated || input.checked) {
          return;
        }

        gsap.to(input, {
          '--input-background': getVar('--c-default-dark'),
          duration: 0.2,
        });
      });

      input.addEventListener('pointerleave', () => {
        if ((elem as any).animated || input.checked) {
          return;
        }

        gsap.to(input, {
          '--input-background': getVar('--c-default'),
          duration: 0.2,
        });
      });

      input.addEventListener('change', () => {
        const checked = input.checked;
        const hide = checked ? 'default' : 'dot';
        const show = checked ? 'dot' : 'default';

        gsap.fromTo(
          svg,
          {
            '--default-s': checked ? 1 : 0,
            '--default-x': checked ? '0px' : '8px',
            '--dot-s': checked ? 0 : 1,
            '--dot-x': checked ? '-8px' : '0px',
          },
          {
            [`--${hide}-s`]: 0,
            [`--${hide}-x`]: checked ? '8px' : '-8px',
            duration: 0.25,
            delay: 0.15,
          }
        );

        gsap.fromTo(
          input,
          {
            '--input-background': getVar(checked ? '--c-default' : '--c-active'),
          },
          {
            '--input-background': getVar(checked ? '--c-active' : '--c-default'),
            duration: 0.35,
            clearProps: true,
          }
        );

        gsap.to(svg, {
          keyframes: [
            {
              [`--${show}-x`]: checked ? '2px' : '-2px',
              [`--${show}-s`]: 1,
              duration: 0.25,
            },
            {
              [`--${show}-x`]: '0px',
              duration: 0.2,
              clearProps: true,
            },
          ],
        });
      });
    });
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Poppins, Arial', justifyContent: 'center', alignItems: 'center', background: '#fff' }}>
      <style jsx global>{`
        :root {
          --c-active: #0059ff;
          --c-active-inner: #ffffff;
          --c-default: #d2d6e9;
          --c-default-dark: #c7cbdf;
          --c-black: #1b1b22;
        }

        .radio,
        .checkbox,
        .switch {
          display: table;
          border-radius: var(--border-radius, 12px) var(--border-radius-corner, 12px) var(--border-radius, 12px) var(--border-radius, 12px);
          position: relative;
        }

        .radio input,
        .checkbox input,
        .switch input {
          appearance: none;
          outline: none;
          border: none;
          background: var(--input-background, none);
          display: block;
          cursor: pointer;
          margin: 0;
          padding: 0;
          border-radius: inherit;
          width: var(--input-width, 24px);
          height: var(--input-height, 24px);
        }

        .radio svg,
        .checkbox svg,
        .switch svg {
          display: block;
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          top: 0;
          pointer-events: none;
          fill: var(--c-active-inner);
          transform: scale(1.01) translateZ(0);
        }

        .radio input,
        .checkbox input {
          --border-color: var(--c-default);
          --border-width: 2px;
          box-shadow: inset 0 0 0 var(--border-width) var(--border-color);
        }

        .radio input:checked,
        .checkbox input:checked {
          --border-color: var(--c-active);
        }

        .radio input:not(:checked):hover,
        .checkbox input:not(:checked):hover {
          --border-width: 3px;
          --border-color: var(--c-active);
        }

        .radio input:not(:checked) {
          transition: box-shadow 0.25s;
        }

        .radio input:checked {
          --border-width: 6.75px;
        }

        .radio input + svg {
          --top-y: 0;
          --dot-y: -17px;
          --drop-y: -14px;
          --top-s-x: 1.75;
          --top-s-y: 1;
        }

        .radio input + svg .top {
          transform-origin: 12px -12px;
          transform: translateY(var(--top-y)) scale(var(--top-s-x), var(--top-s-y)) translateZ(0);
        }

        .radio input + svg .dot {
          transform: translateY(var(--dot-y)) translateZ(0);
        }

        .radio input + svg .drop {
          transform: translateY(var(--drop-y)) translateZ(0);
        }

        .checkbox {
          --border-radius: 5px;
          --border-radius-corner: 5px;
        }

        .checkbox input:checked {
          --border-width: 12px;
        }

        .checkbox input:checked + svg {
          --tick-offset: 46.5px;
        }

        .checkbox input + svg {
          --dot-x: 14px;
          --dot-y: -14px;
          --dot-s: 1;
          --tick-offset: 20.5px;
          --tick-array: 16px;
          --tick-s: 1;
          --drop-s: 1;
        }

        .checkbox input + svg .tick {
          fill: none;
          stroke-width: 3px;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke: var(--c-active-inner);
          stroke-dasharray: var(--tick-array) 33px;
          stroke-dashoffset: var(--tick-offset);
          transform-origin: 10.5px 16px;
          transform: scale(var(--tick-s)) translateZ(0);
        }

        .checkbox input + svg .dot {
          transform-origin: 10.5px 15.5px;
          transform: translate(var(--dot-x), var(--dot-y)) scale(var(--dot-s)) translateZ(0);
        }

        .checkbox input + svg .drop {
          transform-origin: 25px -1px;
          transform: scale(var(--drop-s)) translateZ(0);
        }

        .switch {
          --input-width: 38px;
        }

        .switch input {
          --input-background: var(--c-default);
        }

        .switch input:checked {
          --input-background: var(--c-active);
        }

        .switch input:checked + svg {
          --default-s: 0;
          --default-x: 8px;
          --dot-s: 1;
          --dot-x: 0px;
        }

        .switch input + svg {
          --input-background: var(--c-default);
          --default-s: 1;
          --default-x: 0px;
          --dot-s: 0;
          --dot-x: -8px;
        }

        .switch svg .default {
          transform-origin: 12px 12px;
          transform: translateX(var(--default-x)) scale(var(--default-s)) translateZ(0);
        }

        .switch svg .dot {
          transform-origin: 26px 12px;
          transform: translateX(var(--dot-x)) scale(var(--dot-s)) translateZ(0);
        }

        .btn {
          appearance: none;
          border: none;
          position: relative;
          background: var(--c-black);
          color: #fff;
          outline: none;
          cursor: pointer;
          font-size: 14px;
          line-height: 21px;
          font-weight: 600;
          display: block;
          width: 132px;
          text-align: center;
          border-radius: 7px;
          margin: 0 auto;
          padding: 12px 0;
        }

        .btn span {
          position: relative;
          z-index: 1;
        }

        .btn svg {
          display: block;
          width: 100%;
          height: 100%;
          position: absolute;
          left: 0;
          top: 0;
          fill: var(--c-active);
        }

        .btn svg circle {
          transition: transform var(--duration, 0.25s) ease-out;
        }

        .btn svg circle.top-left {
          transform: translate(var(--spacing, -16px), var(--spacing, -40px));
        }

        .btn svg circle.middle-bottom {
          transform: translate(var(--spacing, 8px), var(--spacing, 40px));
        }

        .btn svg circle.top-right {
          transform: translate(var(--spacing, 40px), var(--spacing, -40px));
        }

        .btn svg circle.right-bottom {
          transform: translate(var(--spacing, 4px), var(--spacing, 40px));
        }

        .btn svg circle.left-bottom {
          transform: translate(var(--spacing, -40px), var(--spacing, 40px));
        }

        .btn:hover {
          --spacing: 0;
          --duration: 0.45s;
        }

        .grid {
          display: grid;
          grid-gap: 24px 32px;
          grid-template-columns: repeat(3, auto);
          grid-template-rows: repeat(3, auto);
          grid-auto-flow: column;
        }

        .grid .last {
          grid-column: 1 / 4;
          grid-row: 3;
        }

        html {
          box-sizing: border-box;
          -webkit-font-smoothing: antialiased;
        }

        * {
          box-sizing: inherit;
        }

        *:before,
        *:after {
          box-sizing: inherit;
        }
      `}</style>

      <div className="grid">
        <label className="radio">
          <input type="radio" name="r" value="1" defaultChecked />
          <svg viewBox="0 0 24 24" filter="url(#goo-light)">
            <circle className="top" cx="12" cy="-12" r="8" />
            <circle className="dot" cx="12" cy="12" r="5" />
            <circle className="drop" cx="12" cy="12" r="2" />
          </svg>
        </label>

        <label className="radio">
          <input type="radio" name="r" value="2" />
          <svg viewBox="0 0 24 24" filter="url(#goo-light)">
            <circle className="top" cx="12" cy="-12" r="8" />
            <circle className="dot" cx="12" cy="12" r="5" />
            <circle className="drop" cx="12" cy="12" r="2" />
          </svg>
        </label>

        <label className="switch">
          <input type="checkbox" defaultChecked />
          <svg viewBox="0 0 38 24" filter="url(#goo)">
            <circle className="default" cx="12" cy="12" r="8" />
            <circle className="dot" cx="26" cy="12" r="8" />
            <circle className="drop" cx="25" cy="-1" r="2" />
          </svg>
        </label>

        <label className="switch">
          <input type="checkbox" />
          <svg viewBox="0 0 38 24" filter="url(#goo)">
            <circle className="default" cx="12" cy="12" r="8" />
            <circle className="dot" cx="26" cy="12" r="8" />
          </svg>
        </label>

        <label className="checkbox">
          <input type="checkbox" defaultChecked />
          <svg viewBox="0 0 24 24" filter="url(#goo-light)">
            <path className="tick" d="M4.5 10L10.5 16L24.5 1" />
            <circle className="dot" cx="10.5" cy="15.5" r="1.5" />
          </svg>
        </label>

        <label className="checkbox">
          <input type="checkbox" />
          <svg viewBox="0 0 24 24" filter="url(#goo-light)">
            <path className="tick" d="M4.5 10L10.5 16L24.5 1" />
            <circle className="dot" cx="10.5" cy="15.5" r="1.5" />
            <circle className="drop" cx="25" cy="-1" r="2" />
          </svg>
        </label>

        <div className="last">
          <button className="btn">
            <span>Submit</span>
            <svg preserveAspectRatio="none" viewBox="0 0 132 45">
              <g clipPath="url(#clip)" filter="url(#goo-big)">
                <circle className="top-left" cx="49.5" cy="-0.5" r="26.5" />
                <circle className="middle-bottom" cx="70.5" cy="40.5" r="26.5" />
                <circle className="top-right" cx="104" cy="6.5" r="27" />
                <circle className="right-bottom" cx="123.5" cy="36.5" r="26.5" />
                <circle className="left-bottom" cx="16.5" cy="28" r="30" />
              </g>
              <defs>
                <clipPath id="clip">
                  <rect width="132" height="45" rx="7" />
                </clipPath>
              </defs>
            </svg>
          </button>
        </div>
      </div>

      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="goo" x="-50%" width="200%" y="-50%" height="200%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 21 -7"
              result="cm"
            />
          </filter>
          <filter id="goo-light" x="-50%" width="200%" y="-50%" height="200%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.25" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 21 -7"
              result="cm"
            />
          </filter>
          <filter id="goo-big" x="-50%" width="200%" y="-50%" height="200%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 21 -7"
              result="cm"
            />
          </filter>
        </defs>
      </svg>
    </div>
  );
}

