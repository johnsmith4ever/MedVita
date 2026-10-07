import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'

import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://medvita.perenne-ai.co.uk'),
  title: 'MedVita - Student-made symptom guide',
  description:
    'A student-made project that gives general information about symptoms and when to get help. Not a medical service or diagnosis. Can make mistakes.',
  openGraph: {
    title: 'MedVita - Student-made symptom guide',
    description:
      'A student-made project that gives general information about symptoms and when to get help. Not a medical service or diagnosis. Can make mistakes.',
    siteName: 'MedVita',
  },
  verification: {
    google: 'PASTE_TOKEN_HERE',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#a8443f',
          borderRadius: '1rem',
        },
      }}
    >
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="font-sans">{children}</body>
      </html>
    </ClerkProvider>
  )
}
