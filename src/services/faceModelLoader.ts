import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-cpu";
import * as faceapi from "face-api.js";
import * as canvas from "canvas";

const { Canvas, Image, ImageData } = canvas as any;

faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let modelsLoaded = false;

export const loadFaceModels = async () => {
  if (modelsLoaded) return;

  await tf.setBackend("cpu");
  await tf.ready();

  await faceapi.nets.ssdMobilenetv1.loadFromDisk("./models");
  await faceapi.nets.faceLandmark68Net.loadFromDisk("./models");
  await faceapi.nets.faceRecognitionNet.loadFromDisk("./models");

  modelsLoaded = true;
};
