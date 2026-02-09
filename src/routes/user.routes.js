import { Router } from "express";
import { registerUser } from "../controllers/user.controllers.js";
const router=Router();

router.route("/register").post(registerUser);

//exporting the function in default allows us to name however we want it to
export default router;