import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || 'campus-market-super-secret-fallback-key-2024'
);

export async function generateMagicToken(phone: string, school: string) {
  return await new SignJWT({ phone, school, role: 'contributor' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET_KEY);
}

export async function verifyMagicToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload; 
  } catch (error) {
    return null;
  }
}
