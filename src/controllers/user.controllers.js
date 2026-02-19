import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js ";
import { ApiResponse } from "../utils/ApiResponse.js";
import { JsonWebTokenError } from "jsonwebtoken";
//combine access of refresh and access tokens
const generateAccessAndRefreshToken = async(userId)=>{
  try{
      const user= await User.findById(userId);
      const accessToken = await user.generateAccessTokens();
      const refreshToken = await user.generateRefreshTokens();
      user.refreshToken=refreshToken; 
      await user.save({ validateBeforeSave:false })

      return { accessToken , refreshToken };
  }
  catch(error){
           throw new ApiError(501,"SOmething went wrong while generating Access and Refresh Token");
  }
}

//Register
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullname } = req.body;
  //===. METHOD 2(ADV JS, method 1 in point 2). ===//
  if (
    [username, email, password, fullname].some((feild) => feild?.trim() === "")
  )
    throw new ApiError(400, "Feild can't be empty  ");




  //check in db
  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser) throw new ApiError(409, "Username or email already exists");




  //files check point 3
   
  const avatarLocalPath = req.files?.avatar[0]?.path;

  let coverimageLocalPath;
  if(req.files&& Array.isArray(req.files.coverimage)&&req.files.coverimage.length>0)
   coverimageLocalPath=req.files.coverimage[0].path;

  if (!avatarLocalPath) throw new ApiError(400, "Avatar file is required");





  //upload the files on cloudinary point 4
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverimage = await uploadOnCloudinary(coverimageLocalPath);

  if (!avatar) throw new ApiError(400, "Avatar file is required");




  //make an object and database me entry kar do point 5

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverimage: coverimage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findOne(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser)
    throw new ApiError(500, "Sometihng went wrong while registering a user");

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User Registered Successfully"));
});

//login start, L1

const loginUser = asyncHandler(async (req, res) => {
 const {email,username,password}= req.body;
  if(!(username||password))
    throw new ApiError(400,"Username or email is required");

//L2 
    const user=await  User.findOne({
      $or:[{username},{email}]
    })
//l3
    if(!user)
      throw new ApiError(404,"User does not exist");
//l4
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid)
      throw new ApiError(401,"Password incorrect");

//l5
    const{accessToken,refreshToken}= await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    
    const options={
      httpOnly:true,
      secure:true,
    }
//l6
    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(new ApiResponse(200,
      {
        user:loggedInUser,accessToken,refreshToken
      }
      ,"User Logged in successfully"
    ))
})

//LogOut --l01
const logOut=asyncHandler(async(req,res)=>{
  const updateToken=await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:
     { refreshToken:undefined}
     },
      {
        new:true
      }
  )
   console.log(updateToken);   
   const options={
      httpOnly:true,
      secure:true,
    } 

    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(
      new ApiResponse(200,{},"User logged out successfully")
    )
 
})


//controller for access point of access of Refresh token 
//p1
const refreshAccessToken= asyncHandler( async(req,res)=>
  {
   //p2
 const incomingRefreshToken= req.cookies.refreshToken||req.body.refreshToken;
  if(!incomingRefreshToken)
 {
  throw new ApiError(401, "Unauthorised Request");
 }

     try {
     //p2
       const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
       //p3
     const user= await User.findById(decodedToken?._id) 
     if(!user)
     {
       throw new ApiError(401,"Invalid RefreshToken"); 
     }
 //p4
     if(incomingRefreshToken!==user.refreshToken)
     {
       throw new ApiError(401,"Refresh Token expired or used");
     }
 
     const options={
       httpOnly:true,
       secure:true
     }
 
     const  {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id);
 
     return res
     .status(200)
     .cookies("accessToken",accessToken,options)
     .cookies("refreshToken",newRefreshToken,options)
     .json(new ApiResponse(200,{accessToken,refreshToken:newRefreshToken},"Access Token refreshed succefully")); 
 
     } catch (error) {
        throw new ApiError(401,"Something wrong with decoding"); 
     }
})
export { registerUser , loginUser , logOut,refreshAccessToken};






//=================POINT 1======================/

//to register user
//take their input
//validation-->check of empty ,format  and all
//   compare it with the existing database
//  and if it is present and matches tell that a user with this email or username exists
//based on designed user model----> check for images and avtar
//upload them to cloudinary
//take the link from cloudinary
//create user obj --create entry in db
//remove password and refresh token feild from the response , as we dont want to show it to the user
//check for user creation
//return res

//=================POINT 2======================/
//=== METHOD 1 ===
// if(fullname==="")
//    throw new ApiError(400,"Name feild can't be empty");//this classes i have made in utils

// if(email==="")
//    throw new ApiError(400,"email feild can't be empty");
// if(password==="")
//    throw new ApiError(400,"password feild can't be empty");
// if(username==="")
//    throw new ApiError(400,"username feild can't be empty");

//=================POINT 3======================/

//$ sign allows us to use the logical operators like and, or, nor, xor, etc.


//=================POINT 4======================/
//local path is returned , as the files is not yet upluaded to the cloudinary
//in this we are using the output from multer middleware
//the path is at the index 0 of the info returned
//checking is required only for avatar and not cover image
//const coverimageLocalPath = req.files?.coverimage[0]?.path;-->was giving because we are not checking it and hence it gives the error as cant access undefined 

//=================POINT 5======================/

//coverimage?.url means agar url hai to de do nahi to " " de do
//this is done kyuki upar kahi coverimage k liye check nhi lagaya h to user name give empty feild in the cover image
//database se baat karte time error aa skti h and it takes time to await laga dete h and error to handel ho hi rhi h
//has entry k sath database me ek _id add ho jati h
//so to valudate the user has been successfully we check if the database has the id or not
//by this the number of calls to database is increased but it is better ans more secure

//select -password and -refreshtokens is done to remove pass and re..n fron the output to the user


//================= LOGIN (L1)======================/
// 1. take the input from user
// 2. validate the inputs (not empty)
// 3. match the input with the database and give the response based on that.
// 4. if password not match then error
// 5. if password match we create the access token and the 
// refresh token.
// 6. send tokens as cookie  

//======================(L5)======================/
//this option lets someone edit the cookies on the server side only


//======================(Refresh and Access Token)======================/

//  INTRO = we are doing this so that we can create an endpoint where the user can
//    generate a new refresh token when the access token has expired without needing a     new login 
//p1
    //the incoming token can come from cookies saved in the backend or the body
//p2
      //the refreshtoken that we have is encrypted due to safety reasons and is not same as the one we have in database
      //so we use verify function along with the secret key to get the decoded token
//p3
       //then we search the databse for the user info by the helf of the decodedtoken as it has the id 
//p4
      //then we match the decoded refresh token with the refreshtoken in the database, if is exists then generate the access and refresh tokens based on the id of the user 
      //then send the responses 