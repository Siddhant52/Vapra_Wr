import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { HeaderShell } from "@/components/header-shell";
import { FooterMap } from "@/components/footer-map";
import { ClerkAuthShell } from "@/components/clerk-auth-shell";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const SITE_URL = "https://vapraworkshop.com";

export const metadata = {
  title: "Vapra Workshop | Expert Auto Repair in Bikaner",
  description:
    "Expert car repair and garage services including oil change, brake repair, engine diagnostics, tyre replacement and general servicing in Bikaner, Rajasthan.",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon-32x32.png",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
        <head>
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="description" content="Expert car repair and garage services including oil change, brake repair, engine diagnostics, tyre replacement and general servicing in Bikaner, Rajasthan." />
          <meta name="keywords" content="car repair Bikaner, garage services Bikaner, oil change, brake repair, engine diagnostics, tyre replacement, vehicle servicing, auto maintenance Rajasthan" />
          <meta name="author" content="Vapra Workshop" />
          <meta name="robots" content="index, follow" />
          <link rel="canonical" href="https://vapraworkshop.com" />
          <meta name="geo.region" content="IN-RJ" />
          <meta name="geo.placename" content="Bikaner" />

          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://vapraworkshop.com" />
          <meta property="og:title" content="Vapra Workshop | Trusted Auto Repair in Bikaner" />
          <meta property="og:description" content="Expert car repair and garage services including oil change, brake repair, engine diagnostics, tyre replacement and general servicing." />
          <meta property="og:image" content="https://vapraworkshop.com/images/preview.jpg" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:site_name" content="Vapra Workshop" />
          <meta property="og:locale" content="en_IN" />

          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@VapraWorkshop" />
          <meta name="twitter:creator" content="@VapraWorkshop" />
          <meta name="twitter:title" content="Vapra Workshop | Expert Car Repair in Bikaner" />
          <meta name="twitter:description" content="Expert car repair and garage services including oil change, brake repair, engine diagnostics, tyre replacement and general servicing." />
          <meta name="twitter:image" content="https://vapraworkshop.com/images/preview.jpg" />
          <meta name="twitter:image:alt" content="Vapra Workshop - Professional Auto Repair Services in Bikaner" />

          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "AutoRepair",
                name: "Vapra Workshop",
                image: "https://vapraworkshop.com/images/preview.jpg",
                url: "https://vapraworkshop.com",
                telephone: "+91-7062416273",
                address: {
                  "@type": "PostalAddress",
                  streetAddress: "Chungi Chowki, Gajner road, Antyodaya Nagar",
                  addressLocality: "Bikaner",
                  addressRegion: "Rajasthan",
                  postalCode: "334001",
                  addressCountry: "IN",
                },
                geo: {
                  "@type": "GeoCoordinates",
                  latitude: "28.022544",
                  longitude: "73.311083",
                },
                openingHoursSpecification: [
                  {
                    "@type": "OpeningHoursSpecification",
                    dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
                    opens: "09:00",
                    closes: "18:00",
                  },
                ],
                sameAs: [
                  "https://www.facebook.com/share/18GGSfqFTn/",
                  "https://www.instagram.com/wapra_workshop_bkn/",
                  "https://youtube.com/@ashokdevra2986",
                ],
              }),
            }}
          />

          <meta name="theme-color" content="#0f172a" />
          <meta name="msapplication-TileColor" content="#0f172a" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="shortcut icon" href="/favicon-32x32.png" />
        </head>
        <body className={`${inter.className}`}>
          <ClerkAuthShell>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <HeaderShell />
            <main className="min-h-screen pt-24">{children}</main>
            <footer className="bg-gray-900 text-gray-100 py-16 border-t border-gray-800">
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                  <div>
                    <h3 className="text-xl font-bold text-emerald-400 mb-4">Vapra Workshop</h3>
                    <p className="text-gray-300 mb-4">
                      Your trusted automotive service center providing professional vehicle maintenance and repair solutions.
                    </p>
                    <div className="flex gap-4">
                      <a href="https://www.facebook.com/share/18GGSfqFTn/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-gray-400 hover:text-emerald-400 transition">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      </a>
                      <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-gray-400 hover:text-emerald-400 transition">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M23.953 4.57a10 10 0 002.856-3.915 9.953 9.953 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.868 9.868 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                      </a>
                      <a href="https://www.instagram.com/wapra_workshop_bkn/?hl=en" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-400 hover:text-emerald-400 transition">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37Z" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/></svg>
                      </a>
                      <a href="https://youtube.com/@ashokdevra2986?si=r55B1UqIAFMr4kDR" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-gray-400 hover:text-emerald-400 transition">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                      </a>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-emerald-400 mb-4">Contact Us</h3>
      <div className="space-y-3 text-gray-300">
                      <div>
                        <p className="text-sm font-medium text-gray-200">Phone</p>
                        <a href="tel:+917062416273" className="font-semibold text-gray-100 hover:text-emerald-400 transition">+91-7062416273</a>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-200">Location</p>
                        <p className="text-gray-300">Chungi Chowki, Gajner road, Antyodaya Nagar<br/>Bikaner, Rajasthan 334001</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-200">Hours</p>
                        <p className="text-gray-300">Mon - Sun: 9:00 AM - 6:00 PM</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-emerald-400 mb-4">Location</h3>
                    <FooterMap />
                  </div>
                </div>
                <div className="border-t border-gray-800 pt-8 text-center text-gray-300 text-sm">
                  <p>© 2026 Vapra Workshop. All rights reserved.</p>
                  <p className="mt-2">
                    <a
                      href="https://www.google.com/maps/dir/?api=1&destination=Vapra+Workshop%2C+Chungi+Chowki%2C+Gajner+road%2C+Antyodaya+Nagar%2C+Bikaner%2C+Rajasthan+334001&travelmode=driving"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 transition"
                    >
                      Get directions on Google Maps
                    </a>
                    {" · "}
                    <a
                      href="https://maps.app.goo.gl/Sr5k5xMac6BeWcxJ6"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-emerald-300 transition"
                    >
                      View location
                    </a>
                  </p>
                </div>
              </div>
            </footer>
          </ThemeProvider>
          </ClerkAuthShell>
        </body>
      </html>
  );
}