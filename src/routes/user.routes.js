import { Router } from "express";
import { registerUser } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();

router.route("/register").post(
  upload.fields//this feilds function of upload can accept any number of unrelated inputs
  ([//here we are using  the middleware multer to ge the input as a file (image , avatar) as we cant directly accept files from body or json
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverimage",
      maxCount: 1,
    },
  ]),
  registerUser
);

//exporting the function in default allows us to name however we want it to
export default router;
