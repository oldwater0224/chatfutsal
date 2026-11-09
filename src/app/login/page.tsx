'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { getFirebaseErrorMessage } from '@/src/lib/firebase/firebaseError';
import { resolveNextPath } from '@/src/lib/utils/internalLink';
import AuthForm from '@/src/components/AuthForm';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // 로그인 후 돌아갈 내부 경로 (외부 주소면 resolveNextPath가 "/"로 바꾼다)
  const next = searchParams.get('next');

  const handleLogin = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push(resolveNextPath(next));
    } catch (error) {
      const firebaseError = error as { code: string };
      throw new Error(getFirebaseErrorMessage(firebaseError.code));
    }
  };

  return <AuthForm mode="login" onSubmit={handleLogin} next={next} />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginContent />
    </Suspense>
  );
}
