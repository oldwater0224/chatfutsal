import jwt from "jsonwebtoken";

export function createCustomToken(uid: string): string {
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iss: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    sub: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    aud: "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
    iat: now,
    exp: now + 3600,
    uid,
  };

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(
    /\\n/g,
    "\n",
  );

  return jwt.sign(payload, privateKey, { algorithm: "RS256" });
}
