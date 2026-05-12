/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/api/auth/:path*', destination: 'http://localhost:4001/auth/:path*' },
      { source: '/api/users/:path*', destination: 'http://localhost:4001/users/:path*' },
      { source: '/api/teams/:path*', destination: 'http://localhost:4001/teams/:path*' },
      { source: '/api/notify/:path*', destination: 'http://localhost:4004/notify/:path*' },
    ];
  },
};

module.exports = nextConfig;
