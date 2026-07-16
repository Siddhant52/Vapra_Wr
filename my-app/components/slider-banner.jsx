"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function SliderBanner({ images = [], interval = 3500, alt = "hero image" }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!images.length) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images, interval]);

  if (!images.length) {
    return null;
  }

  return (
    <div className="relative h-[220px] sm:h-[280px] md:h-[350px] lg:h-[500px] rounded-xl overflow-hidden">
      {/* First slide stays mounted so LCP preload stays valid */}
      <Image
        src={`/${images[0]}`}
        alt={`${alt} 1`}
        fill
        priority
        fetchPriority="high"
        sizes="(max-width: 1024px) 100vw, 50vw"
        className={`object-cover transition-opacity duration-700 ${
          current === 0 ? "opacity-100" : "opacity-0"
        }`}
      />
      {current > 0 ? (
        <Image
          key={images[current]}
          src={`/${images[current]}`}
          alt={`${alt} ${current + 1}`}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover transition-opacity duration-700 opacity-100"
        />
      ) : null}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, idx) => (
          <span
            key={idx}
            className={`h-2 w-2 rounded-full ${idx === current ? "bg-white" : "bg-white/40"}`}
          />
        ))}
      </div>
    </div>
  );
}
