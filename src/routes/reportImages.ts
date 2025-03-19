import { Router } from "express";
import {
  addImage,
  deleteImage,
  findMatchingFace,
  updateImage,
} from "../controllers/reportImages";
import multer from "multer";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

router.post("/", upload.fields([{ name: "img", maxCount: 1 }]), addImage);
router.post(
  "/match",
  upload.fields([{ name: "img", maxCount: 1 }]),
  findMatchingFace
);

router.put(
  "/:reportImageId",
  upload.fields([{ name: "img", maxCount: 1 }]),
  updateImage
);
router.delete("/:reportImageId", deleteImage);

export default router;
