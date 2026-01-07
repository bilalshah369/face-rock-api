import fs from "fs";
import * as faceapi from "face-api.js";
import canvas from "canvas";
import db from "../config/db";
import { loadFaceModels } from "./faceModelLoader";
import { encryptEmbedding } from "../utils/crypto.util";

const { loadImage } = canvas as any;

/**
 * Enroll student face (ONE-TIME)
 */
export const enrollStudentFace = async (
  applicationRef: string,
  photoPath: string,
  userId: number
) => {
  // 1️⃣ Load models
  await loadFaceModels();

  // 2️⃣ Load image
  if (!fs.existsSync(photoPath)) {
    throw new Error("Photo file not found");
  }

  const img = await loadImage(photoPath);

  // 3️⃣ Detect face + generate embedding
  const detection = await faceapi
    .detectSingleFace(img)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    throw new Error("No face detected in image");
  }

  const embedding = Array.from(detection.descriptor); // 128-D

  // 4️⃣ Encrypt embedding
  const encryptedEmbedding = encryptEmbedding(embedding);

  // 5️⃣ Store in DB
  await db.query(
    `
    UPDATE student_applications
    SET
      face_embedding = $1,
      face_model = 'MobileFaceNet-128',
      face_enrolled_on = NOW(),
      updated_by = $2,
      updated_at = NOW()
    WHERE application_ref_no = $3
    `,
    [encryptedEmbedding, userId, applicationRef]
  );

  return {
    success: true,
    application_ref_no: applicationRef,
    embedding_length: embedding.length,
    model: "MobileFaceNet-128",
  };
};
