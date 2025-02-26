import { Router } from "express";
import {  addContact, deleteUser, getAllContacts, getContactById, updateUser } from "../controllers/users.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import multer from "multer";



const router = Router()

const upload = multer();
// app.use(upload.none()); // Parses form-data


router.put('/',verifyToken, upload.none(), updateUser)
router.delete('/:id', upload.none(), deleteUser)

router.post('/contact/:id',verifyToken,upload.none(), addContact)
router.get('/contact',verifyToken,upload.none(), getAllContacts)
router.get('/contact/:id',verifyToken,upload.none(), getContactById)






export default router