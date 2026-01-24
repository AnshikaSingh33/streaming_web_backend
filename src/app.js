import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app=express()


app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true,

}))
app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true,limit:"16kb"}));
app.use(express.static("public"));
app.use(cookieParser());

export {app};


//==============================================================//
//=== === === === === configurations-Theory === === === === ===//
//============================================================//

//app.use is used with configuration settings or middlewares
//when you see the value of cors_origin I have given it as '*' that means anyone can see access , but in production we give it the url of vercel or wherever the frontend is deployed
//we dont need *body-parser* anymore as js can now accept the json from body direclty
//multer is used for file accepting
//'urlencoded' is used to get info from url,extended means giving objs inside objs
//.static is used to store the assets in the public file
//==============================================================//
//=== === === === === configurations-Theory === === === === ===//
//============================================================// 