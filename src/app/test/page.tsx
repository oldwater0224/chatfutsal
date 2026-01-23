'use client';

import AuthForm from '@/src/components/AuthForm';

export default function TestPage() {
  const handleSubmit = async (email: string, password: string, displayName?: string) => {
    console.log('제출됨:', { email, password, displayName });
  };

  return (
    <div>
      <h2 className="text-center py-4 bg-gray-200">회원가입 모드</h2>
      <AuthForm mode="signup" onSubmit={handleSubmit} />
      
      <h2 className="text-center py-4 bg-gray-200 mt-8">로그인 모드</h2>
      <AuthForm mode="login" onSubmit={handleSubmit} />
    </div>
  );
}