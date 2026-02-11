import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js ";
import { ApiResponse } from "../utils/ApiResponse.js";



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


export { registerUser };






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
