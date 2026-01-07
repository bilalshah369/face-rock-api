import CryptoJS from "crypto-js";

const QR_SECRET = process.env.QR_SECRET_KEY!;

/**
 * Encrypt 128-D embedding safely
 */
export const encryptEmbedding = (embedding: number[]): string => {
  const float32 = new Float32Array(embedding);
  const buffer = Buffer.from(float32.buffer);
  const base64 = buffer.toString("base64");

  return CryptoJS.AES.encrypt(base64, QR_SECRET).toString();
};
