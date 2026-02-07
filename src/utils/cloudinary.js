import{v2 as cloudinary} from "cloudinary";
import fs from 'fs';




 cloudinary.config({ 
        cloud_name:process.env.CLOUD_NAME, 
        api_key: process.env.API_KEY, 
        api_secret: process.env.API_SECRET 
    });//these things are taken from the cloudinary documentation

    const uploadOnCloudinary =async (localFilePath)=>{

        try{
            //if there is url is null or empty
            if(!localFilePath)return null;
   
            //different feilds can be given in the upload feild
            const response=await cloudinary.uploader.upload(localFilePath,
                //auto means that type of file uploaded will be detected by the cloudinary
                { 
                     resource_type:"auto"
                
                 });
           //file uploaded successfully
           console.log("file uploaded on cloudinary",response.url);
           return response;
        }


        catch(error)
        {
            //remove the locally saved temporary file as the upload got failed
          fs.unlinkSync(localFilePath); 
          return null;
        }
    }


export {uploadOnCloudinary};