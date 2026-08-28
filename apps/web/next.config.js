/** @type {import('next').NextConfig} */
module.exports = {
  async rewrites() {
    return [
      { source: "/v1/:path*", destination: "http://localhost:3333/v1/:path*" },
    ];
  },
  reactStrictMode: true,
  allowedDevOrigins: [
    "192.168.1.17",              // troque pelo IP real da sua máquina
    "http://192.168.1.17:3000",
    "unwilling-stoppage-congenial.ngrok-free.dev",              // seu domínio do ngrok, sem https://
    "https://unwilling-stoppage-congenial.ngrok-free.dev",
  ],
};