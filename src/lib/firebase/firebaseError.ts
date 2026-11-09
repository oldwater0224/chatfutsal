export function getFirebaseErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': '이미 사용 중인 이메일이에요',
    'auth/invalid-email': '올바른 이메일 형식이 아니에요',
    'auth/weak-password': '비밀번호는 6자 이상이어야 해요',
    'auth/user-not-found': '등록되지 않은 이메일이에요',
    'auth/wrong-password': '비밀번호가 올바르지 않아요',
    'auth/too-many-requests': '잠시 후 다시 시도해 주세요',
    'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않아요',
    'auth/network-request-failed': '네트워크 연결을 확인해 주세요',
  };

  return errorMessages[errorCode] || '오류가 생겼어요. 다시 시도해 주세요';
}
