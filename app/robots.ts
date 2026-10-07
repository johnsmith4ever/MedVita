import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/app', '/api', '/sign-in'],
      },
    ],
    sitemap: 'https://medvita.perenne-ai.co.uk/sitemap.xml',
  }
}
