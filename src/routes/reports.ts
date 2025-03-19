import { Router } from "express";
import { verifyToken } from "../middlewares/authMiddleware";
import {
  createReport,
  deleteReport,
  getAllRegionMaps,
  getAllSosReports,
  getNewsReport,
  getReportById,
  sendNotification,
  updateReport,
} from "../controllers/reports";
import multer from "multer";

const router = Router();

const upload = multer();

router.get("/", getAllRegionMaps);
router.get("/:id", getReportById);
router.get("/sos", getAllSosReports);
router.post("/", verifyToken, upload.none(), createReport);

router.put("/:id", verifyToken, upload.none(), updateReport);
router.delete("/:id", verifyToken, upload.none(), deleteReport);
router.get("/crime-news", getNewsReport)

router.post("/notify",upload.none(), sendNotification)

export default router;
