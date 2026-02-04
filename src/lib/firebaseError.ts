export function getFirebaseErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': '이미 사용 중인 이메일입니다',
    'auth/invalid-email': '올바른 이메일 형식이 아닙니다',
    'auth/weak-password': '비밀번호는 6자 이상이어야 합니다',
    'auth/user-not-found': '등록되지 않은 이메일입니다',
    'auth/wrong-password': '비밀번호가 올바르지 않습니다',
    'auth/too-many-requests': '잠시 후 다시 시도해주세요',
    'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다',
    'auth/network-request-failed': '네트워크 연결을 확인해주세요',
  };

  return errorMessages[errorCode] || '오류가 발생했습니다. 다시 시도해주세요';
}