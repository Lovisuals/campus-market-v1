const ENCRYPTION_ALGORITHM = 'AES-GCM';

export async function encryptMessage(
  plaintext: string,
  encryptionKey: string
): Promise<{ ciphertext: string; iv: string; authTag: string }> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(encryptionKey.slice(0, 32)); // Take first 32 bytes
  const key = await crypto.subtle.importKey('raw', keyData, ENCRYPTION_ALGORITHM, false, ['encrypt']);

  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 bits for GCM
  const plaintextData = encoder.encode(plaintext);

  const encrypted = await crypto.subtle.encrypt(
    {
      name: ENCRYPTION_ALGORITHM,
      iv: iv
    },
    key,
    plaintextData
  );

  const encryptedArray = new Uint8Array(encrypted);
  const authTag = encryptedArray.slice(-16); // Last 16 bytes are auth tag
  const ciphertext = encryptedArray.slice(0, -16);

  return {
    ciphertext: Array.from(ciphertext).map(b => b.toString(16).padStart(2, '0')).join(''),
    iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
    authTag: Array.from(authTag).map(b => b.toString(16).padStart(2, '0')).join('')
  };
}

export async function decryptMessage(
  ciphertext: string,
  encryptionKey: string,
  iv: string,
  authTag: string
): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const keyData = encoder.encode(encryptionKey.slice(0, 32));
    const key = await crypto.subtle.importKey('raw', keyData, ENCRYPTION_ALGORITHM, false, ['decrypt']);

    const ivArray = new Uint8Array(iv.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    const ciphertextArray = new Uint8Array(ciphertext.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    const authTagArray = new Uint8Array(authTag.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));

    // Combine ciphertext and auth tag
    const encryptedData = new Uint8Array([...ciphertextArray, ...authTagArray]);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv: ivArray
      },
      key,
      encryptedData
    );

    return decoder.decode(decrypted);
  } catch (err) {
    throw new Error('Message decryption failed');
  }
}

export async function deriveEncryptionKey(userId: string, conversationId: string): Promise<string> {
  const combined = `${userId}:${conversationId}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(combined);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
