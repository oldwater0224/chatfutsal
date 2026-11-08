'use client';

import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/src/lib/firebase';
import { getFirebaseErrorMessage } from '@/src/lib/firebase/firebaseError';
import AuthForm from '@/src/components/AuthForm';
import { validateDisplayName } from '@/src/lib/services/userRules';

export default function SignupPage() {
  const router = useRouter();

  const handleSignup = async (email: string, password: string, rawDisplayName?: string) => {
    // 계정을 만들기 전에 검사해, 보안 규칙에 막혀 users 문서 없는 계정이 남지 않게 한다
    const nameCheck = validateDisplayName(rawDisplayName ?? '');
    if (!nameCheck.ok) {
      throw new Error(nameCheck.reason === 'invalid' ? nameCheck.message : '닉네임을 확인해주세요.');
    }
    const displayName = nameCheck.value;

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
    } catch (error) {
      const firebaseError = error as { code: string };
      throw new Error(getFirebaseErrorMessage(firebaseError.code));
    }
  };

  return <AuthForm mode="signup" onSubmit={handleSignup} />;
}