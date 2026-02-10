class ApiError extends Error{
    constructor(statusCode,message="Something Went Wrong",errors=[],stack="")//errors[] is taken as there can be multiple errors
    {
        super(message);
        this.message=message;
        this.statusCode=statusCode;
        this.data=null;
        this.success=false;
        this.errors=errors; 
        if(stack)
        {
           this.stack=stack;
        }
        else
        {
            Error.captureStackTrace(this,this.constructor);
        }
    }
}
export {ApiError}