'use client';

import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/src/lib/firebase';
import AuthForm from '@/src/components/AuthForm';
import { getFirebaseErrorMessage } from '@/src/lib/firebaseError';

export default function SignupPage() {
  const router = useRouter();

  const handleSignup = async (email: string, password: string, displayName?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        createdAt: new Date(),
      });

      router.push('/');
    } catch (err : any) {
      throw new Error(getFirebaseErrorMessage(err.code));
    }
  };

  return <AuthForm mode="signup" onSubmit={handleSignup} />;
}