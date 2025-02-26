import { Router } from "express";
import { addImage } from "../controllers/reportImages";
import multer from "multer";

const router = Router()


const upload = multer({
    storage: multer.memoryStorage(),
  });



router.post('/',upload.fields([
    { name: "img", maxCount: 1 }]), addImage)
// router.post('/match', findMatchingFace)
// router.put('/:id',updateImage)
// router.delete('/:id',deleteImage)





export default router