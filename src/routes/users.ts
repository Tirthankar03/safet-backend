import { Router } from "express";
import {  addContact, deleteUser, getAllContacts, getContactById, updateUser } from "../controllers/users";
import { verifyToken } from "../middlewares/authMiddleware";



const router = Router()

router.put('/',verifyToken, updateUser)
router.delete('/:id', deleteUser)

router.post('/contact/:id',verifyToken, addContact)
router.get('/contact',verifyToken, getAllContacts)
router.get('/contact/:id',verifyToken, getContactById)






export default router