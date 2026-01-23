'use client';

import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/src/lib/firebase';
import AuthForm from '@/src/components/AuthForm';

export default function SignupPage() {
  const router = useRouter();

  const handleSignup = async (email: string, password: string, displayName?: string) => {
    // 1. Firebase Auth에 유저 생성
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. 프로필에 닉네임 저장
    await updateProfile(user, { displayName });

    // 3. Firestore에 유저 정보 저장
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      createdAt: new Date(),
    });

    // 4. 홈으로 이동
    router.push('/');
  };

  return <AuthForm mode="signup" onSubmit={handleSignup} />;
}