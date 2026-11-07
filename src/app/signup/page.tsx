import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthFrame } from '@/components/auth/AuthFrame';
import { SignUpForm } from '@/components/auth/SignUpForm';

export const metadata: Metadata = { title: 'Sign up', robots: { index: false, follow: true }, alternates: { canonical: '/signup' } };

export default function SignUp() {
  return (
    <AuthFrame title="Sign up">
      <Suspense><SignUpForm /></Suspense>
    </AuthFrame>
  );
}
