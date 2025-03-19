import { Router } from "express";
import { loginUser, registerUser } from "../controllers/auth";
import multer from "multer";

const router = Router();

const upload = multer();

router.post("/register", upload.none(), registerUser);
router.post("/login", upload.none(), loginUser);

export default router;
