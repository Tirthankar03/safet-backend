import { Router } from "express";
import { deleteUser, updateUser } from "../controllers/users";
import { verifyToken } from "../middlewares/authMiddleware";



const router = Router()

router.put('/',verifyToken, updateUser)
router.delete('/:id', deleteUser)




export default router