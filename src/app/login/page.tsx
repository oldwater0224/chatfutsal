'use client';

import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { getFirebaseErrorMessage } from '@/src/lib/firebase/firebaseError';
import AuthForm from '@/src/components/AuthForm';

export default function LoginPage() {
  const router = useRouter();
  

  const handleLogin = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (error) {
      const firebaseError = error as { code: string };
      throw new Error(getFirebaseErrorMessage(firebaseError.code));
    }
  };

  return <AuthForm mode="login" onSubmit={handleLogin}/>;
}