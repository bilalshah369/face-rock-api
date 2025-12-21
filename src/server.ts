import dotenv from "dotenv";
import express from "express";
dotenv.config();

import app from "./app";
import db from "./config/db";
const PORT = process.env.PORT || 3000;
import path from "path";
app.disable("etag");
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});
