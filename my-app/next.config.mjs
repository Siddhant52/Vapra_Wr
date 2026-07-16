/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    // Serve apex as canonical — www was redirecting after http→https (extra hop)
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
