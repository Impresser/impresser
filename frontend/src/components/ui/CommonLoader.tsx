'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export interface CommonLoaderProps {
  color?: string;
  className?: string;
  timeScale?: number;
  viewBox?: string;
}

export default function CommonLoader({
  color = '#0059FF',
  className = '',
  timeScale = 3,
  viewBox = '0 0 800 600',
}: CommonLoaderProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const q = gsap.utils.selector(containerRef.current);

    const blendEases = (startEase: string, endEase: string, blender?: string) => {
      const s = gsap.parseEase(startEase);
      const e = gsap.parseEase(endEase);
      const b = gsap.parseEase(blender || 'power3.inOut');
      return (v: number) => {
        const bv = b(v);
        return s(v) * (1 - bv) + e(v) * bv;
      };
    };

    gsap.set(q('svg'), { visibility: 'visible' });

    const tl = gsap.timeline({ repeat: -1 });

    tl.to(q('#leader'), {
      duration: 4,
      x: 36 * 3,
      ease: blendEases('circ.in', 'expo'),
    })
      .to(
        q('.follower'),
        {
          duration: 2,
          svgOrigin: (index: number) => {
            const origins = ['328 300', '364 300', '400 300', '436 300', '472 300'];
            return origins[index % origins.length];
          },
          rotation: -180,
          stagger: { amount: 2 },
          ease: blendEases('circ.in', 'expo'),
        },
        0,
      )
      .to(
        q('#whole'),
        {
          x: 36,
          duration: 5,
          ease: 'linear',
        },
        0,
      )
      .to(
        q('.follower'),
        {
          duration: 1.5,
          stagger: { amount: 1, repeat: 1, yoyo: true },
          ease: blendEases('power3.in', 'expo'),
          fillOpacity: 0,
        },
        0,
      );

    tl.timeScale(timeScale);

    return () => {
      tl.kill();
    };
  }, [timeScale]);

  return (
    <div ref={containerRef} className={className}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox}
        className="w-full h-full"
        style={{ visibility: 'hidden' }}
      >
        <g id="whole" fill={color} stroke={color} strokeWidth={2}>
          <circle id="leader" cx="328" cy="300" r="13" />
          <circle className="follower" cx="364" cy="300" r="13" />
          <circle className="follower" cx="400" cy="300" r="13" />
          <circle className="follower" cx="436" cy="300" r="13" />
          <circle className="follower" cx="472" cy="300" r="13" />
        </g>
      </svg>
    </div>
  );
}


