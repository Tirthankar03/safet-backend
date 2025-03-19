import express, { json, urlencoded } from "express";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import reportRoutes from "./routes/reports";
import reportImagesRoutes from "./routes/reportImages";
import cors from "cors";
import multer from "multer";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = 3005;
// Multer for handling form-data
// const upload = multer();
// app.use(upload.none()); // Parses form-data

app.use(cors());
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/report-images", reportImagesRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
