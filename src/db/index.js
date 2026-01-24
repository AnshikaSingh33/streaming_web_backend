import mongoose from 'mongoose';
import {DB_NAME} from "../constants.js";


//async is liye kyuki database kisi bhi continent me ho skta so it might take time to give output , so.....we need to async and a___wait

//this is some weird kind of function of js where a variable is made a function  >:( 
const connectDB= async()=>{
    try{
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log("mongoDB Connected DB HOST",connectionInstance.connection.host);

    }
    catch(error)
    {
       console.log("mongoDB connection Error: ",error);
       //there can be so many types of exits , when you see this code in future, you can hover over this and read the types and use cases
       process.exit(1);
    }

}


export default connectDB;