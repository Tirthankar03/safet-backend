import { Router } from "express";
import {
  addContact,
  deleteUser,
  getAllContacts,
  getAllUsers,
  getContactById,
  updateUser,
} from "../controllers/users";
import { verifyToken } from "../middlewares/authMiddleware";
import multer from "multer";

const router = Router();

const upload = multer();
// app.use(upload.none()); // Parses form-data

router.put("/", verifyToken, upload.none(), updateUser);
router.get("/all", getAllUsers);
router.delete("/:id", upload.none(), deleteUser);

router.post("/contact/:id", verifyToken, upload.none(), addContact);
router.get("/contact", verifyToken, upload.none(), getAllContacts);
router.get("/contact/:id", verifyToken, upload.none(), getContactById);

export default router;
