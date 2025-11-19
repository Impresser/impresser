'use client';

import React, { useEffect, useRef } from 'react';

export default function LoginBackground() {
  const gradientRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gradientRef.current) return;

    const colors = new Array(
      [0, 89, 255], // 브랜드 텍스트 색상 (#0059FF)
      [50, 75, 167], // #324BA7
      [50, 75, 167], // #324BA7 (기존 [40, 26, 88] 보라색/자주색을 파란색으로 변경)
      [0, 89, 255] // 브랜드 텍스트 색상 (#0059FF)
    );
    let step = 0;
    // 초기 색상을 브랜드 텍스트 색상으로 설정 (모든 인덱스를 0 또는 3으로)
    const colorIndices = [0, 1, 0, 3]; // 처음 로드 시 브랜드 색상이 나오도록
    const gradientSpeed = 0.002;


    function updateGradient() {
      if (!gradientRef.current) return;

      const c0_0 = colors[colorIndices[0]];
      const c0_1 = colors[colorIndices[1]];
      const c1_0 = colors[colorIndices[2]];
      const c1_1 = colors[colorIndices[3]];

      const istep = 1 - step;

      const r1 = Math.round(istep * c0_0[0] + step * c0_1[0]);
      const g1 = Math.round(istep * c0_0[1] + step * c0_1[1]);
      const b1 = Math.round(istep * c0_0[2] + step * c0_1[2]);
      const color1 = `#${((r1 << 16) | (g1 << 8) | b1).toString(16).padStart(6, '0')}`;

      const r2 = Math.round(istep * c1_0[0] + step * c1_1[0]);
      const g2 = Math.round(istep * c1_0[1] + step * c1_1[1]);
      const b2 = Math.round(istep * c1_0[2] + step * c1_1[2]);
      const color2 = `#${((r2 << 16) | (g2 << 8) | b2).toString(16).padStart(6, '0')}`;

      gradientRef.current.style.background = `-webkit-radial-gradient(80% 10%, circle, ${color1}, transparent), -webkit-radial-gradient(80% 50%, circle, ${color2}, transparent)`;

      step += gradientSpeed;

      if (step >= 1) {
        step %= 1;
        colorIndices[0] = colorIndices[1];
        colorIndices[2] = colorIndices[3];

        colorIndices[1] = (colorIndices[1] + Math.floor(1 + Math.random() * (colors.length - 1))) % colors.length;
        colorIndices[3] = (colorIndices[3] + Math.floor(1 + Math.random() * (colors.length - 1))) % colors.length;
      }
    }

    const intervalId = setInterval(updateGradient, 10);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        html {
          width: 100%;
          height: 100%;
        }

        body {
          font-family: 'Inter', sans-serif;
          background-color: transparent;
          padding: 0px;
          margin: 0px;
          height: 100%;
          width: 100%;
          overflow: hidden;
        }

        #gradient {
          position: fixed;
          width: 100%;
          height: 100%;
          padding: 0px;
          margin: 0px;
          z-index: 10;
          top: 0;
          left: 0;
        }

        #gradient2 {
          position: fixed;
          width: 100%;
          height: 100%;
          padding: 0px;
          margin: 0px;
          z-index: 3;
          top: 0;
          left: 0;
          background-color: #0e0438;
          background-image: -webkit-radial-gradient(80% 10%, circle, rgb(27,186,135), transparent),
            -webkit-radial-gradient(80% 50%, circle, rgb(58,164,178), transparent),
            -webkit-radial-gradient(20% 80%, 80em 80em, rgb(30,45,100), transparent),
            -webkit-radial-gradient(10% 10%, circle, rgb(95,151,230), transparent);
        }
      `}</style>

      {/* 전체 그라데이션 배경 */}
      <div id="gradient2" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#0e0438' }}></div>
      <div id="gradient" ref={gradientRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}></div>
    </>
  );
}

