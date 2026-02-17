import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import cookieParser from "cookie-parser";
export const verifyJWT=asyncHandler(async(req , res , next)=>
{
     try {
        //point-1
        const token=req.cookies?.accessToken|| req.header("Authorization")?.replace("Bearer ","");
        if(!token)
        {
           throw new ApiError(401,"Unauthorised request");
        }
       
        //point-2
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        const user=await User.findById(decodedToken?._id).select("-password -refreshToken  ");
        if(!user)
           {
               throw new ApiError(401,"Invalid Access token")
           } 
       req.user=user;
       next();
     } catch (error) {
        throw new ApiError(401,error?.message||"Invalid Access Token"); 
     }
}) 

//============================pre-start===============================//
//this file was made when we needed to access the cookie inorder to delete id for logout
//middleware me next as a parameter is needed along with req and res, 
//next ka kaam hota h ki , jab middleware ka kaam khtm ho jae to wo result ko ya process ko uske next step pe bhej de

//app.js me app.use(cookieparser()) ki wjh se cookie ka access mil jata h , req ko and res ko  

//============================P-1===============================//
//we can either get the access token or form the header like in the case of mobile applications,
//when the access token is coming from the header , it comes in the format-"Authorization: Bearer <Token>"
 
