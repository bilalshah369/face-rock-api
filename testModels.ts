import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-cpu";
import * as faceapi from "face-api.js";
import * as canvas from "canvas";

// 👇 Node canvas bindings for face-api
const { Canvas, Image, ImageData } = canvas as any;

faceapi.env.monkeyPatch({
  Canvas,
  Image,
  ImageData,
});

async function init() {
  // 🔧 Force CPU backend
  await tf.setBackend("cpu");
  await tf.ready();

  // 📦 Load models from disk
  await faceapi.nets.ssdMobilenetv1.loadFromDisk("./models");
  await faceapi.nets.faceLandmark68Net.loadFromDisk("./models");
  await faceapi.nets.faceRecognitionNet.loadFromDisk("./models");

  console.log("✅ face-api.js + pure tfjs (TypeScript) WORKING");
}

init().catch((err) => {
  console.error("❌ Init failed:", err);
});
