/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'lh3.googleusercontent.com',  // Google user profile images
      'via.placeholder.com',        // Placeholder images
      'firebasestorage.googleapis.com', // Firebase Storage (for future use)
    ],
  },
  // Other Next.js config options...
}

module.exports = nextConfig 