//this is in middleware as , the uploads can be from registration or login or anythin , to jate time mil k jana (middleware ka kaam h ye)me multer se har koi mil k jaega


//  THE WORK OF THIS FILE IS TO UPLOAD THE FILE ON THE SERVER AND SAVE IT WITH THE NAME AND RETURN THE LOCALFILENAME 
import multer from "multer"

//this code template is taken from github readme of multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null,"./public/temp")
  },

  filename: function (req, file, cb) {


    //this uniqueSuffix will give a unique suffix to the files being saved 
    //const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)

    //these files will stay on the server for a very less time as we upload it to cloudinary and then instantly delete it from server
    cb(null, file.originalname)
  }
})

export const upload = multer({ storage})


