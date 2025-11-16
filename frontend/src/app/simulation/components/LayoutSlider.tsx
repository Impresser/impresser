'use client';

import React, { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

interface LayoutSliderProps {
  children: React.ReactNode[];
  className?: string;
  singleView?: boolean;
}

export default function LayoutSlider({ children, className = '', singleView = false }: LayoutSliderProps) {
  const swiperRef = useRef<SwiperType | null>(null);

  // singleView가 아닌 경우에만 개수에 따라 그리드 처리
  if (!singleView && children.length < 3) {
    if (children.length === 1) {
      return <div className={`flex justify-center ${className}`}>{children}</div>;
    }
    return <div className={`grid gap-4 lg:grid-cols-2 ${className}`}>{children}</div>;
  }

  return (
    <>
      <style jsx>{`
        .layout-slider-wrapper {
          position: relative;
          padding: 0 60px;
        }

        .nav-button {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          width: 40px;
          height: 40px;
          background: none;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0059FF;
        }

        .nav-button:hover {
          color: #0047CC;
          transform: translateY(-50%) scale(1.15);
        }

        .nav-button:disabled {
          opacity: 0.35;
          cursor: auto;
          pointer-events: none;
        }

        .nav-button-prev {
          left: 0;
        }

        .nav-button-next {
          right: 0;
        }

        .layout-slider-wrapper :global(.swiper-pagination-bullet) {
          height: 13px;
          width: 13px;
          opacity: 0.5;
          background: #0059FF;
        }

        .layout-slider-wrapper :global(.swiper-pagination-bullet-active) {
          opacity: 1;
        }

        @media screen and (max-width: 768px) {
          .layout-slider-wrapper {
            padding: 0 10px;
          }

          .nav-button {
            display: none;
          }
        }
      `}</style>
      <div className={`layout-slider-wrapper ${className}`}>
        <button
          className="nav-button nav-button-prev"
          onClick={() => swiperRef.current?.slidePrev()}
          aria-label="Previous slide"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <Swiper
          modules={[Pagination]}
          loop={true}
          speed={700}
          spaceBetween={30}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          breakpoints={
            singleView
              ? {
                  0: { slidesPerView: 1 },
                  768: { slidesPerView: 1 },
                  1024: { slidesPerView: 1 },
                }
              : {
                  0: { slidesPerView: 1 },
                  768: { slidesPerView: 2 },
                  1024: { slidesPerView: 2 },
                }
          }
          className="swiper"
        >
          {children.map((child, index) => (
            <SwiperSlide key={index} className="swiper-slide">
              {child}
            </SwiperSlide>
          ))}
          <div className="swiper-pagination"></div>
        </Swiper>
        <button
          className="nav-button nav-button-next"
          onClick={() => swiperRef.current?.slideNext()}
          aria-label="Next slide"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </>
  );
}

