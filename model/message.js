const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    text:{
        type:String,
        default:""
    },
    imageUrl:{
        type:String,
        default:""
    },
    videoUrl:{
        type:String,
        default:""
    },
    seen:{
        type:Boolean,
        default:false
    },
    msgByUserId:{
        type: mongoose.Schema.ObjectId,
        required:true,
        ref:'User'
    }
},{
    timestamps:true
})


const conversationSchema = new mongoose.Schema({
    sender:{
        //store user id here
        type: mongoose.Schema.ObjectId,
        required:true,
        ref:'User'
        //reference to the table name containing user data
    },
    receiver:{
        type: mongoose.Schema.ObjectId,
        required:true,
        ref:'User'
    },
    messages:[
        {
            type: mongoose.Schema.ObjectId,
            ref:'Message'
            //reference to the table name 'Message'
        }

    ]
},{
    timestamps:true
});

const MessageModel = mongoose.model('Message', messageSchema);
const ConversationModel = mongoose.model('Conversation',conversationSchema);

module.exports = {
    MessageModel,
    ConversationModel
};