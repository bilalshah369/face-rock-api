import dotenv from "dotenv";
import express from "express";
dotenv.config();

import app from "./app";
import db from "./config/db";
const PORT = process.env.PORT || 3000;
import path from "path";

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
