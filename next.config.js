/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@anthropic-ai/sdk']
  },
  images: {
    domains: ['vsdkjhafqvwfnqgsbnyz.supabase.co']
  }
}

module.exports = nextConfig
