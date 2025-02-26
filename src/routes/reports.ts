import { Router } from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { createReport, deleteReport, getAllRegionMaps, getAllSosReports, getReportById, updateReport } from "../controllers/reports.js";
import multer from "multer";



const router = Router()

const upload = multer();


router.get('/', getAllRegionMaps)
router.get('/:id', getReportById)
router.get('/sos', getAllSosReports)
router.post('/',verifyToken,upload.none(), createReport)

router.put('/:id',verifyToken,upload.none(), updateReport)
router.delete('/:id',verifyToken,upload.none(), deleteReport)




export default router