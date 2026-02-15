import { SignJWT, jwtVerify } from 'jose';
import { checkIsAdmin } from '@/lib/admin';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || 'campus-market-super-secret-fallback-key-2024'
);

export async function generateMagicToken(phone, school) {
  const isAdmin = checkIsAdmin(null, phone, false);
  return await new SignJWT({ phone, school, is_admin: isAdmin })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET_KEY);
}

export async function verifyMagicToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload;
  } catch (error) {
    return null;
  }
}
