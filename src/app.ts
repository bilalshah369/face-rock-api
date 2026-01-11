import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";
import routes from "./routes";
import downloadRoutes from "./routes/download.routes";
import appVersionRouter from "./routes/appversion.route";
const app = express();

app.use(cors());
//app.use(express.json());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use("/api", routes);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/download", downloadRoutes);
app.use("/app", appVersionRouter);
export default app;
