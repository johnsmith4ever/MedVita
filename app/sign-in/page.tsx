import { SignIn } from '@clerk/nextjs'

/**
 * /sign-in — Clerk-hosted sign-in page
 * Magic-link / passwordless only — configured in the Clerk dashboard.
 * After sign-in, Clerk redirects to NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL (/app)
 */
export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-vitaly-canvas px-4 py-12">
      <SignIn
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'rounded-3xl border border-vitaly-line bg-vitaly-surface shadow-soft',
          },
        }}
      />
    </main>
  )
}
