import { verifyMagicToken } from '@/lib/jwt';
import StudioClient from './StudioClient';

// This is the Secure Gatekeeper
export default async function StudioPage({
  searchParams,
}: {
  searchParams: { key?: string };
}) {
  const token = searchParams.key;

  // 🔴 CASE 1: NO KEY FOUND
  if (!token) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-mono">
        <div className="text-6xl mb-6">🔒</div>
        <h1 className="text-2xl font-black text-red-600 mb-2 tracking-widest uppercase">Access Denied</h1>
        <p className="text-gray-500 text-xs font-bold">You need a secure Magic Link to enter the Studio.</p>
      </div>
    );
  }

  // 🟡 CASE 2: VERIFYING CRYPTOGRAPHY
  const payload = await verifyMagicToken(token);

  // 🔴 CASE 3: INVALID OR EXPIRED KEY
  if (!payload) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-mono">
        <div className="text-6xl mb-6">⏳</div>
        <h1 className="text-2xl font-black text-yellow-500 mb-2 tracking-widest uppercase">Link Expired</h1>
        <p className="text-gray-500 text-xs font-bold">This security token is dead. Request a new one from Admin.</p>
      </div>
    );
  }

  // 🟢 CASE 4: ACCESS GRANTED -> RENDER CLIENT
  // We pass the verified user data and the raw token to the client interface
  return <StudioClient user={payload} token={token} />;
}