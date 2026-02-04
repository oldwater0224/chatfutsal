'use client';

import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import AuthForm from '@/src/components/AuthForm';
import { getFirebaseErrorMessage } from '@/src/lib/firebaseError';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (err: any) {
      throw new Error(getFirebaseErrorMessage(err.code));
    }
  };

  return <AuthForm mode="login" onSubmit={handleLogin} />;
}