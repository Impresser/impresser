'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface CommonRadioButtonProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  name: string;
  value: string;
  label?: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // 기존 RadioButton 호환성을 위한 onChangeValue (value만 전달)
  onChangeValue?: (value: string) => void;
}

const getVar = (key: string, elem: HTMLElement | null = null) => {
  const target = elem || document.documentElement;
  return getComputedStyle(target).getPropertyValue(key);
};

export default function CommonRadioButton({
  name,
  value,
  label,
  checked = false,
  onChange,
  onChangeValue,
  className = '',
  ...rest
}: CommonRadioButtonProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e);
    }
    if (onChangeValue) {
      onChangeValue(e.target.value);
    }
  };
  const labelRef = useRef<HTMLLabelElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const label = labelRef.current;
    const input = inputRef.current;
    const svg = svgRef.current;

    if (!label || !input || !svg) return;

    const handleChange = () => {
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
    };

    input.addEventListener('change', handleChange);

    return () => {
      input.removeEventListener('change', handleChange);
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        .common-radio-button {
          display: table;
          border-radius: 12px;
          position: relative;
        }

        .common-radio-button input {
          appearance: none;
          outline: none;
          border: none;
          background: none;
          display: block;
          cursor: pointer;
          margin: 0;
          padding: 0;
          border-radius: inherit;
          width: 24px;
          height: 24px;
          --border-color: var(--c-default, #d2d6e9);
          --border-width: 2px;
          box-shadow: inset 0 0 0 var(--border-width) var(--border-color);
        }

        .common-radio-button input:not(:checked) {
          transition: box-shadow 0.25s;
        }

        .common-radio-button input:not(:checked):hover {
          --border-width: 3px;
          --border-color: var(--c-active, #0059ff);
        }

        .common-radio-button input:checked {
          --border-color: var(--c-active, #0059ff);
          --border-width: 6.75px;
        }

        .common-radio-button svg {
          display: block;
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          top: 0;
          pointer-events: none;
          fill: var(--c-active-inner, #ffffff);
          transform: scale(1.01) translateZ(0);
          --top-y: 0;
          --dot-y: -17px;
          --drop-y: -14px;
          --top-s-x: 1.75;
          --top-s-y: 1;
        }

        .common-radio-button svg .top {
          transform-origin: 12px -12px;
          transform: translateY(var(--top-y)) scale(var(--top-s-x), var(--top-s-y)) translateZ(0);
        }

        .common-radio-button svg .dot {
          transform: translateY(var(--dot-y)) translateZ(0);
        }

        .common-radio-button svg .drop {
          transform: translateY(var(--drop-y)) translateZ(0);
        }
      `}</style>
      <div className={`flex items-center space-x-2 ${className}`}>
        <label ref={labelRef} className="common-radio-button">
          <input
            ref={inputRef}
            type="radio"
            name={name}
            value={value}
            checked={checked}
            onChange={handleChange}
            {...rest}
          />
          <svg ref={svgRef} viewBox="0 0 24 24" filter="url(#goo-light)">
            <circle className="top" cx="12" cy="-12" r="8" />
            <circle className="dot" cx="12" cy="12" r="5" />
            <circle className="drop" cx="12" cy="12" r="2" />
          </svg>
        </label>
        {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
      </div>
    </>
  );
}

