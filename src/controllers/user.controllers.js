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


//Changing password to new password
const changeCurrentPassword = asyncHandler(async()=>{

  //p1
      const {oldPassword, newPassword} = req.body

      const user= await User.findById(user?._id);

  //p2
     const passwordCheck =await user.isPasswordCorrect(oldPassword);
     if(!passwordCheck)
     {
         throw new ApiError(401,"Invalid old Password"); 
     }

  //p3 
    else
     {
      user.password=newPassword;
      user.save({validateBeforeSave:false })

      return res.status(200).json(new ApiError(200,{},"Password saved successfully"))
     }

})

//get current user
const getCurrentUser= asyncHandler(async(req,res)=>{
//p1
  return res.status(200).json(new ApiResponse(200, req.user, "User sent successfully" ));
})


//Update (text based) Account details
const updateAccountDetails= asyncHandler(async(req,res)=>{ 

  //p1
  const {email,fullname} = req.body;

//p2 
  if(!email || !fullname)
  {
    throw new ApiError(401, "Email and fullname are required");
  }
  
  //p3 
   const user=User.findByIdAndUpdate(req.user?._id,
    {
      //p4
      //set is the mongodb operator that is used to directly change the old value to new value , agar isme bas new value bhi likh de to chalega, key value pair ki jarurat nhi h 

        $set:{
          fullname:fullname,
          email:email
        }
    }
    //p5
   
    ,{
      new:true
    }
   ).select("-password");
     return res.status(200).json(new ApiResponse(200,"User DetailsUpdated Successfully"));
})


//update user avatar
const updateUserAvatar= asyncHandler(async(req,res)=>{
  //s1
    const avatarLocalPath=req.file?.path;
//s2
     if(!avatarLocalPath)
     {
      throw new ApiError(401,"Avatar local file path is missing");
     }
//s3
    const avatar = await  uploadOnCloudinary(avatarLocalPath);
//s4
    if(!avatar.url)
    {
      throw new ApiError(401,"Error while uploading the Avatar");
    }
//s5 
    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            avatar : avatar.url
        }
    },{new:true}).select("-password");

    return res.status(200).json(new ApiResponse(200,user,"Avatar updated successfully"));
})

//update cover image same is we did for avatar
const updateUserCoverImage=asyncHandler(async(req,res)=>{
   const coverimageLocalPath=req.file?.path;
   if(!coverimageLocalPath)
   {
    throw new ApiError(401, "coverImage local path is not found");
   }
   
   const coverimage=await uploadOnCloudinary(coverimageLocalPath);

   if(!coverimage.url)
   {
    throw new ApiError(401,"Faild to get url after uploading on cloudinary");
   }

   const user = User.findByIdAndUpdate(req.user._id,{
    $set:{
      coverimage:coverimage.url
    }
   },
   {new:true})
   .select("-passwprd");

   return res.status(200).json(new ApiResponse(200,user,"CoverImage updated succefully"));
})



export { registerUser ,
        loginUser ,
        logOut , 
        refreshAccessToken, 
        updateAccountDetails, 
        updateUserAvatar, 
        getCurrentUser,
        changeCurrentPassword,
        updateUserCoverImage
    };






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



//===========Changing password to new password=================//

//p1
  //we need new as well as the old password to change the pass
  //we can also implement tha functionality of new password and confirm password by if(newPassword===confirmPassword)

//p2
  //ispassword function checks if the old password entered is correct or rong
//p3 
  // since there is only one feild we can directly change the value to the new one and validate before save is discussed before 


//=======================get current user========================
//p1--just get access the user from the request and give it in the response



//=====================//Update (text based) Account details============
 //p1
    //it is advised to not update the text based and file based data together
//p2 
    //if the email and fullname both are not present then erro
//p3 
  // then query the database for the id of the user and update it directly since we already have got the user and its details
//p4
  //set is the mongodb operator that is used to directly change the old value to new value , agar isme bas new value bhi likh de to chalega, key value pair ki jarurat nhi h 
//p5
  //new:true ki help se jab bhi value update hogi to wo new value hame dikhegi
    //-password karne se , jo password h wo respone me nhi aaega

//========================Update Avatar============================
// Step1
    // get the path of the local file from the req

// Step2
    //  check agar local file path aya h ya nhi 
    //   Nhi Aya hoga to error throw kar do 

// Step3 
    // jo local file path aya h usko wloudinary pe upload kar do ek function ki help se jo hamne utils me bana rakhi 
    // Upload hone k baad ek object milega jisme bahut sari ingo hogi ab isme se url lena h

// Step 4 
    // agar link nhi aya to error bhej do 
// Step 5
    //  agar link aa gai h to use update kar do , (user id ko req se access karna h) just like we have done before
    // Iske baad bas respond bhej do ki ha ho gaya kaam 