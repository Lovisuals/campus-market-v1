'use client';
import { useState } from 'react';
import { encryptMessage, deriveEncryptionKey } from '@/lib/message-encryption';

export function SecureDM({ conversationId, userId }: { conversationId: string; userId: string }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSend() {
    setSending(true);

    const encryptionKey = deriveEncryptionKey(userId, conversationId);
    const { ciphertext, iv, authTag } = await encryptMessage(message, encryptionKey);

    const response = await fetch('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId,
        ciphertext,
        iv,
        authTag,
        timestamp: new Date()
      })
    });

    if (response.ok) {
      setMessage('');
    }

    setSending(false);
  }

  return (
    <div className="space-y-2">
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Type message (encrypted)"
        className="w-full px-3 py-2 border rounded"
      />
      <button
        onClick={handleSend}
        disabled={sending || !message.trim()}
        className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
      >
        {sending ? 'Sending...' : 'Send Encrypted'}
      </button>
    </div>
  );
}
