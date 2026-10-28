/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NAGEKEO_SLIDES, NagekeoSlide } from '../data/nagekeoSlides';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Landmark,
  Pause,
  Play,
} from 'lucide-react';

export const NagekeoBannerSlider: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const totalSlides = NAGEKEO_SLIDES.length;

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPlaying, totalSlides]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const currentSlide: NagekeoSlide = NAGEKEO_SLIDES[currentIndex];

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-stone-200/90 shadow-sm bg-stone-900 text-white group select-none"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
    >
      {/* Slide Image Background */}
      <div className="relative h-64 sm:h-72 md:h-80 w-full overflow-hidden bg-stone-950">
        <img
          src={currentSlide.imageSrc}
          alt={currentSlide.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Gradient Scrim for WCAG readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-950/40 to-black/30" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#701524]/90 backdrop-blur-xs text-rose-100 border border-rose-300/30">
              <Landmark className="w-3.5 h-3.5 text-rose-200" />
              <span>Kabupaten Nagekeo · Flores NTT</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono bg-black/50 backdrop-blur-xs text-stone-300 border border-white/10">
              <MapPin className="w-3 h-3 text-rose-400" />
              <span>{currentSlide.location}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Jeda Slide' : 'Putar Slide'}
              className="p-1 rounded bg-black/40 hover:bg-black/70 backdrop-blur-xs text-stone-300 hover:text-white transition-colors text-xs"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <div className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-black/60 backdrop-blur-xs text-rose-200 font-bold border border-white/10">
              {String(currentIndex + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Bottom Slide Content */}
        <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 z-10 space-y-1.5">
          <div className="text-[11px] uppercase tracking-wider text-rose-300 font-bold font-mono">
            {currentSlide.subtitle}
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight leading-snug drop-shadow-sm">
            {currentSlide.title}
          </h2>
          <p className="text-xs sm:text-sm text-stone-200/90 max-w-3xl line-clamp-2 drop-shadow-xs leading-relaxed">
            {currentSlide.description}
          </p>

          {/* Dots Indicator */}
          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {NAGEKEO_SLIDES.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentIndex(idx)}
                  title={slide.title}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? 'w-7 bg-rose-400'
                      : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>

            <span className="text-[10px] text-stone-300 font-mono hidden sm:inline">
              Pengadaan Barang/Jasa Pemerintah Kabupaten Nagekeo
            </span>
          </div>
        </div>

        {/* Left / Right Nav Arrows */}
        <button
          onClick={handlePrev}
          aria-label="Slide sebelumnya"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-xs text-white flex items-center justify-center transition-all opacity-80 hover:opacity-100 z-10"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={handleNext}
          aria-label="Slide berikutnya"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-xs text-white flex items-center justify-center transition-all opacity-80 hover:opacity-100 z-10"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
