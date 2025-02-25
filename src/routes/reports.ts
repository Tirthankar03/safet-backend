import { Router } from "express";
import { verifyToken } from "../middlewares/authMiddleware";
import { createReport, deleteReport, getAllRegionMaps, getAllSosReports, getReportById, updateReport } from "../controllers/reports";



const router = Router()

router.get('/', getAllRegionMaps)
router.get('/:id', getReportById)
router.get('/sos', getAllSosReports)
router.post('/',verifyToken, createReport)

router.put('/:id',verifyToken, updateReport)
router.delete('/:id',verifyToken, deleteReport)




export default router