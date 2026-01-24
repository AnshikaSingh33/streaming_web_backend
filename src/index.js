//require('dotenv').config()
import dotenv from 'dotenv';
import connectDB from './db/index.js';
import {app} from './app.js'
dotenv.config({
    path: './env'
})
connectDB()
.then(()=>
{
    console.log("Connected successfully to mongoDB")
    app.listen(process.env.PORT||8000,()=>{
        console.log("server is running on port: ", process.env.PORT);
    })

})
.catch((error)=>
{
    console.log("MongoDB Connection Failed from main index.js!!!", error)
})






// import express from 'express';

// const app=express();

// (async()=>{
//     try{
//        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

//        app.on('error',(error)=>{
//         console.log("application not able to talk to database due to :", error);
//         throw error
//        })
//        app.listen(process.env.PORT,()=>
//     {
//        console.log("process is running on port", process.env.PORT);
//     })
//     }
//     catch(error)
//     {
//        console.error("ERROR:", error)

//        throw error
//     }
// })()
