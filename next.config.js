/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_USE_LLM: process.env.NEXT_PUBLIC_USE_LLM || 'false',
    NEXT_PUBLIC_LLM_MODE: process.env.NEXT_PUBLIC_LLM_MODE || 'none',
    NEXT_PUBLIC_PII_MASK: process.env.NEXT_PUBLIC_PII_MASK || 'true',
    NEXT_PUBLIC_DEMO_SCOREBOARD: process.env.NEXT_PUBLIC_DEMO_SCOREBOARD || 'false',
    NEXT_PUBLIC_SLA_CAL_ENABLED: process.env.NEXT_PUBLIC_SLA_CAL_ENABLED || 'true',
  },
};

module.exports = nextConfig;