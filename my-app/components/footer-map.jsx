"use client";

import { useState } from "react";

const DESTINATION = {
  address:
    "Vapra Workshop, Chungi Chowki, Gajner road, Antyodaya Nagar, Bikaner, Rajasthan 334001",
  placeUrl: "https://maps.app.goo.gl/Sr5k5xMac6BeWcxJ6",
};

function buildDirectionsUrl(origin) {
  const params = new URLSearchParams({
    api: "1",
    destination: DESTINATION.address,
    travelmode: "driving",
  });

  if (origin?.lat != null && origin?.lng != null) {
    params.set("origin", `${origin.lat},${origin.lng}`);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function openDirections(origin) {
  window.open(buildDirectionsUrl(origin), "_blank", "noopener,noreferrer");
}

export function FooterMap() {
  const [status, setStatus] = useState("");

  const handleGetDirections = () => {
    setStatus("Finding your location…");

    if (!navigator.geolocation) {
      setStatus("Opening your route…");
      openDirections(null);
      setTimeout(() => setStatus(""), 2000);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStatus("Opening path from your location…");
        openDirections({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setTimeout(() => setStatus(""), 2000);
      },
      () => {
        setStatus("Opening Google Maps directions…");
        openDirections(null);
        setTimeout(() => setStatus(""), 2000);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
      <button
        type="button"
        onClick={handleGetDirections}
        className="group relative block h-48 w-full text-left"
        aria-label="Open Google Maps directions from your location to Vapra Workshop"
      >
        {/* Static location thumbnail — workshop photo + map pin overlay */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/vapra1.jpeg"
          alt="Vapra Workshop location thumbnail"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02] group-hover:opacity-90"
          loading="lazy"
          decoding="async"
          width={640}
          height={240}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />

        {/* Map pin badge */}
        <span className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/90 text-white shadow-lg shadow-emerald-900/40">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
          </svg>
        </span>

        <div className="absolute inset-x-0 bottom-0 px-4 py-3">
          <p className="text-sm font-semibold text-emerald-300">
            {status || "Open in Google Maps →"}
          </p>
          <p className="mt-0.5 text-xs text-gray-300">
            Get the path from your location to Vapra Workshop
          </p>
        </div>
      </button>

      <div className="space-y-2 border-t border-gray-800 px-3 py-3">
        <p className="text-xs leading-relaxed text-gray-400">
          {DESTINATION.address}
        </p>
        <div className="flex items-center justify-between gap-2 text-xs">
          <a
            href={DESTINATION.placeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 transition hover:text-emerald-300"
          >
            View on map
          </a>
          <button
            type="button"
            onClick={handleGetDirections}
            className="rounded-md bg-emerald-600/20 px-3 py-1.5 font-semibold text-emerald-300 transition hover:bg-emerald-600/30"
          >
            Open in Google Maps
          </button>
        </div>
      </div>
    </div>
  );
}
