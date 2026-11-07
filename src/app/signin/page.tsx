import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthFrame } from '@/components/auth/AuthFrame';
import { SignInForm } from '@/components/auth/SignInForm';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false, follow: true }, alternates: { canonical: '/signin' } };

export default function SignIn() {
  return (
    <AuthFrame title="Sign in">
      <Suspense><SignInForm /></Suspense>
    </AuthFrame>
  );
}
