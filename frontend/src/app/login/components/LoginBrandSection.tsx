'use client';

import React from 'react';
import Image from 'next/image';

export default function LoginBrandSection() {
  return (
    <>
      <style jsx global>{`
        /* Blender Pro 폰트 로드 */
        @font-face {
          font-family: 'Blender Pro';
          src: url('/fonts/BlenderPro-Book.woff2') format('woff2'),
               url('/fonts/BlenderPro-Book.ttf') format('truetype');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: 'Blender Pro';
          src: url('/fonts/BlenderPro-Bold.woff2') format('woff2'),
               url('/fonts/BlenderPro-Bold.woff') format('woff');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in {
          animation: fadeIn 1.5s ease-out 0.5s forwards;
          opacity: 0;
        }

        .blender-pro {
          font-family: 'Blender Pro', sans-serif;
        }
      `}</style>

      <div className="text-center max-w-3xl fade-in" style={{ opacity: 0 }}>
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/images/logos/Impresser_logo_icon_w.png"
            alt="Impresser Brand Icon"
            width={120}
            height={120}
            className="object-contain"
            style={{ filter: 'drop-shadow(0 0 15px rgba(0, 31, 63, 0.5)) drop-shadow(0 0 30px rgba(0, 31, 63, 0.3))' }}
          />
          <Image
            src="/images/logos/Impresser_logo_text_w.png"
            alt="Impresser"
            width={450}
            height={150}
            className="object-contain"
            style={{ filter: 'drop-shadow(0 0 15px rgba(0, 31, 63, 0.5)) drop-shadow(0 0 30px rgba(0, 31, 63, 0.3))' }}
          />
        </div>
        <p className="mt-4 text-3xl md:text-3xl text-white max-w-2xl mx-auto blender-pro" style={{ fontWeight: 700 }}>
          <br />
          <br />
          We Make IMPRESSIVE Answers
        </p>
      </div>
    </>
  );
}

