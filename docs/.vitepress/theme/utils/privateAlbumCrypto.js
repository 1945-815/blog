function decodeBase64(value) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

export async function decryptPrivateEnvelope(envelope, password) {
  if (!envelope || envelope.version !== 1 || envelope.kdf?.name !== 'PBKDF2' || envelope.cipher?.name !== 'AES-GCM') {
    throw new Error('不支持的加密文件格式')
  }
  const iterations = Number(envelope.kdf.iterations)
  if (!Number.isInteger(iterations) || iterations < 100000 || iterations > 1000000) throw new Error('加密参数无效')

  const passwordBytes = new TextEncoder().encode(password)
  const salt = decodeBase64(envelope.kdf.salt)
  const iv = decodeBase64(envelope.cipher.iv)
  const ciphertext = decodeBase64(envelope.ciphertext)
  if (salt.length !== 16 || iv.length !== 12 || ciphertext.length < 16) throw new Error('加密文件不完整')

  try {
    const keyMaterial = await crypto.subtle.importKey('raw', passwordBytes, 'PBKDF2', false, ['deriveKey'])
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    )
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
    return new TextDecoder().decode(plaintext)
  } finally {
    passwordBytes.fill(0)
  }
}
