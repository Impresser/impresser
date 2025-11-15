'use client';

import React, { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const slides = [
  {
    id: 1,
    image: 'https://plus.unsplash.com/premium_photo-1732736768075-4738ba4ccf1a?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    badge: 'Mountain',
    title: 'An image slider is a web element that displays multiple images in a rotating format, allowing users to navigate through visuals using arrows or indicators.',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1720048169707-a32d6dfca0b3?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    badge: 'Laptop',
    title: 'An image slider is a web element that displays multiple images in a rotating format, allowing users to navigate through visuals using arrows or indicators.',
  },
  {
    id: 3,
    image: 'https://plus.unsplash.com/premium_photo-1732432913668-71a505632da1?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    badge: 'Lake',
    title: 'An image slider is a web element that displays multiple images in a rotating format, allowing users to navigate through visuals using arrows or indicators.',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1731271140119-34ad9551ff10?q=80&w=1471&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    badge: 'River',
    title: 'An image slider is a web element that displays multiple images in a rotating format, allowing users to navigate through visuals using arrows or indicators.',
  },
  {
    id: 5,
    image: 'https://plus.unsplash.com/premium_photo-1731860726887-6b1cb8129b0f?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    badge: 'Pin on board',
    title: 'An image slider is a web element that displays multiple images in a rotating format, allowing users to navigate through visuals using arrows or indicators.',
  },
];

export default function Test002Page() {
  const swiperRef = useRef<SwiperType | null>(null);

  return (
    <>
      <style jsx>{`
        .test002-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-image: linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%);
        }

        .card-wrapper {
          max-width: 1100px;
          margin: 0 auto 35px;
          padding: 20px 0;
          overflow: visible;
          position: relative;
        }

        .swiper-container {
          position: relative;
          padding: 0 60px;
        }

        .card-wrapper :global(.swiper-slide) {
          list-style: none;
        }

        .card-link {
          user-select: none;
          display: block;
          background: #fff;
          padding: 18px;
          border-radius: 12px;
          text-decoration: none;
          border: 2px solid transparent;
          box-shadow: 0 10px 10px rgba(0, 0, 0, 0.05);
          transition: 0.2s ease;
        }

        .card-link:active {
          cursor: grabbing;
        }

        .card-link:hover {
          border-color: #0059FF;
        }

        .card-image {
          width: 100%;
          aspect-ratio: 16 / 9;
          object-fit: cover;
          border-radius: 10px;
        }

        .badge {
          color: #0059FF;
          margin: 16px 0 18px;
          padding: 8px 16px;
          font-weight: 500;
          font-size: 0.95rem;
          background: #dde4ff;
          width: fit-content;
          border-radius: 50px;
        }

        .card-title {
          font-size: 16px;
          color: #000;
          font-weight: 100;
        }

        .card-button {
          height: 35px;
          width: 35px;
          color: #0059FF;
          border-radius: 50%;
          margin: 30px 0 5px;
          background: none;
          cursor: pointer;
          transform: rotate(-45deg);
          border: 2px solid #0059FF;
          transition: 0.4s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-link:hover .card-button {
          color: #fff;
          background: #0059FF;
        }

        .card-wrapper :global(.swiper-pagination-bullet) {
          height: 13px;
          width: 13px;
          opacity: 0.5;
          background: #0059FF;
        }

        .card-wrapper :global(.swiper-pagination-bullet-active) {
          opacity: 1;
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

        .nav-button svg {
          width: 100%;
          height: 100%;
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

        @media screen and (max-width: 768px) {
          .card-wrapper {
            margin: 0 10px 25px;
            padding: 20px 10px;
          }

          .swiper-container {
            padding: 0 10px;
          }

          .nav-button {
            display: none;
          }
        }
      `}</style>
      <div className="test002-container">
        <div className="card-wrapper">
          <button
            className="nav-button nav-button-prev"
            onClick={() => swiperRef.current?.slidePrev()}
            aria-label="Previous slide"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="swiper-container">
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
              breakpoints={{
                0: {
                  slidesPerView: 1,
                },
                768: {
                  slidesPerView: 2,
                },
                1024: {
                  slidesPerView: 2,
                },
              }}
              className="swiper"
            >
              {slides.map((slide) => (
                <SwiperSlide key={slide.id} className="swiper-slide">
                  <a href="#" className="card-link">
                    <img src={slide.image} alt={slide.badge} className="card-image" />
                    <p className="badge">{slide.badge}</p>
                    <h2 className="card-title">{slide.title}</h2>
                    <button className="card-button">
                      <i className="fa-solid fa-arrow-right"></i>
                    </button>
                  </a>
                </SwiperSlide>
              ))}
              <div className="swiper-pagination"></div>
            </Swiper>
          </div>
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
      </div>
    </>
  );
}

