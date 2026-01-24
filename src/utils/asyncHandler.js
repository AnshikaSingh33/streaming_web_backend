// const asyncHandler=()=>{}
// const asyncHandler=(func)=>{()=>{}}
// const asyncHandler=(func)=>()=>{}
//const asyncHandler=(func)=>async()=>{}

  //**************** USING TRY-CATCH *****************/

// const asyncHandler=(fn)=>async(err,req,res,next)=>{
//     try{
//           await fn(err,req,res,next);
//     }
//     catch(error)
//     {
//       res.status(err.code||404).json({
//            success:false,
//            message:err.message
//       })
//     }
// }


//**************** USING PROMISES *****************/

 const asyncHandler=(requestHandler)=>{
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err));
    }
 }

export {asyncHandler}