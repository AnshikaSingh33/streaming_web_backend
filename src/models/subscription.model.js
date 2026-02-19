import mongoose,{Schema} from "mongoose";

const subscriptionSchema=new Schema({
    //p1
    subscriber:
    {
        type: Schema.Types.ObjectId,
        ref:"User"
    },

    //p2
    channel: {
        type: Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps: true});

export const Subscription = mongoose.model("Subscription", subscriptionSchema)


//p1
    //this is the person who is subscribing to the channel
//p2
    //this is the channel that is being subscribed