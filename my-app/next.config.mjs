/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin-allow-popups",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  {
    // Tuned for Next.js + Clerk + Razorpay. Avoid Trusted Types enforce (breaks React).
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "form-action 'self' https://*.clerk.com https://*.clerk.accounts.dev https://api.razorpay.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.com https://*.clerk.accounts.dev https://checkout.razorpay.com https://cdn.razorpay.com",
      "connect-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://api.razorpay.com https://lumberjack.razorpay.com wss://*.clerk.accounts.dev",
      "frame-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://api.razorpay.com https://checkout.razorpay.com https://maps.google.com https://www.google.com",
      "worker-src 'self' blob:",
    ].join("; "),
  },
];

const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    // Keep in sync with Vercel primary domain (currently apex).
    // Run Lighthouse against https://vapraworkshop.com to avoid www→apex hops.
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.vapraworkshop.com" }],
        destination: "https://vapraworkshop.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
