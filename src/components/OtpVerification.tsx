'use client';
import { useState, useEffect } from 'react';
import { captureDeviceInfo, generateDeviceFingerprint } from '@/lib/device-fingerprint';
import { verifyOtp } from '@/lib/otp-service';

export function OtpVerification({ userId }: { userId: string }) {
  const [code, setCode] = useState('');
  const [isNewDevice, setIsNewDevice] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkIfNewDevice();
  }, []);

  async function checkIfNewDevice() {
    const fingerprint = generateDeviceFingerprint(captureDeviceInfo());
    const stored = localStorage.getItem('device_fingerprint');

    if (stored !== fingerprint) {
      setIsNewDevice(true);
      localStorage.setItem('device_fingerprint', fingerprint);
    }
  }

  async function handleSubmit() {
    setLoading(true);

    const deviceInfo = captureDeviceInfo();
    const fingerprint = generateDeviceFingerprint(deviceInfo);
    const ip = await fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then(d => d.ip);

    const result = await verifyOtp(userId, code, fingerprint, ip);

    if (result.valid) {
      localStorage.setItem('otp_verified', 'true');
      window.location.href = '/dashboard';
    } else {
      alert(result.error);
    }

    setLoading(false);
  }

  if (isNewDevice) {
    return (
      <div className="p-6 border rounded-lg">
        <h3 className="font-semibold mb-4">New Device Detected</h3>
        <p className="text-gray-600 mb-4">
          For security, we need to verify your identity on this device.
        </p>
        <input
          type="text"
          maxLength={6}
          placeholder="Enter 6-digit code"
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
          className="w-full px-3 py-2 border rounded"
        />
        <button
          onClick={handleSubmit}
          disabled={loading || code.length !== 6}
          className="mt-4 w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </div>
    );
  }

  return <div className="text-green-600">Device verified</div>;
}
