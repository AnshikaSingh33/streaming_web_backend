import { Router } from "express";
import { loginUser, 
          registerUser ,
          logOut, 
          refreshAccessToken, 
          changeCurrentPassword, 
          getCurrentUser, 
          updateAccountDetails, 
          updateUserAvatar, 
          updateUserCoverImage, 
          getUserChannelProfile, 
          getWatchHistory } 
          from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
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


router.route("/login").post(loginUser); 

//secure routes
router.route("/logOut").post(verifyJWT,  logOut);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT, changeCurrentPassword);
//yaha pe verify jwt ki need is liye so that koi logged in ho tabhi password change kar pae

router.route("/current-user").get(verifyJWT, getCurrentUser);

router.route("/update-account").patch(verifyJWT, updateAccountDetails);
//patch because we dont want to change all the deatails but rather just want to update one of them

router.route("/avatar").patch(verifyJWT, upload.single("/avatar"), updateUserAvatar);
//we are using two middlewares because , is wale route me upload hona h avatar , to usme multer ka bhi use h , to isiliye we have to make sure ki ek single file upload hui h ya nhi 

router.route("/cover-image").patch(verifyJWT, upload.single("/coverImage"), updateUserCoverImage);

router.route("/c/:username").get(verifyJWT,getUserChannelProfile);

router.route("/watchHistory").get(verifyJWT,getWatchHistory);

//exporting the function in default allows us to name however we want it to
export default router;
