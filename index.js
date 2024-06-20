const app = require("./app");
const mongoose = require("mongoose");
const http = require("http");
const socketIo = require("socket.io");

const port = process.env.PORT || 8000;
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.BASE_ADDR,
        credentials: true
    }
});

const url = `${process.env.MONGODB_URI}Users?retryWrites=true&w=majority`;

mongoose
    .connect(url)
    .then(() => {
        console.log("Connected to the database successfully");
        server.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((error) => {
        console.error("Error connecting to the database: ", error);
    });

// Include the Socket.IO logic
const User = require('./model/datamodal');
const { ConversationModel, MessageModel } = require('./model/message');
const getUserDetailsFromToken = require('./helpers/getUserDetailsFromToken');
const getConversation = require('./helpers/getConversation');

// Online users set
const onlineUser = new Set();


io.on('connection', async (socket) => {
    console.log("User connected", socket.id);

    const token = socket.handshake.auth.token;

    // Get current user details (assuming getUserDetailsFromToken is implemented)
    const user = await getUserDetailsFromToken(token);
    // console.log("aalu",user);
    // Create a room
    // console.log(user._id);
    socket.join(user?._id.toString());
    onlineUser.add(user?._id.toString());

    io.emit('onlineUser', Array.from(onlineUser));

    socket.on('message-page', async (userId) => {
        const userDetails = await User.findById(userId).select("-password");
        const payload = {
            _id: userDetails?._id,
            name: userDetails?.name,
            email: userDetails?.email,
            profileImage: userDetails?.profileImage,
            online: onlineUser.has(userId)
        };
        socket.emit('message-user', payload);

        // const getConversationMessage = await ConversationModel.findOne({
        //     "$or": [
        //         { sender: user?._id, receiver: userId },
        //         { sender: userId, receiver: user?._id }
        //     ]
        // }).populate('messages').sort({ updatedAt: -1 });

        // socket.emit('message', getConversationMessage?.messages || []);
    });

    //NEW MESSAGE
    socket.on('new message', async (data) => {
        let conversation = await ConversationModel.findOne({
            "$or": [
                { sender: data?.sender, receiver: data?.receiver },
                { sender: data?.receiver, receiver: data?.sender }
            ]
        });
        
        //if conversation is not available
        if (!conversation) {
            const createConversation = await ConversationModel({
                sender: data?.sender,
                receiver: data?.receiver
            });
            conversation = await createConversation.save();
        }

        const message = new MessageModel({
            text: data.text,
            imageUrl: data.imageUrl,
            videoUrl: data.videoUrl,
            msgByUserId: data?.msgByUserId,
        });
        const saveMessage = await message.save();

        await ConversationModel.updateOne({ _id: conversation?._id }, {
            "$push": { messages: saveMessage?._id }
        });

        const getConversationMessage = await ConversationModel.findOne({
            "$or": [
                { sender: data?.sender, receiver: data?.receiver },
                { sender: data?.receiver, receiver: data?.sender }
            ]
        }).populate('messages').sort({ updatedAt: -1 });

        io.to(data?.sender).emit('message', getConversationMessage?.messages || []);
        io.to(data?.receiver).emit('message', getConversationMessage?.messages || []);

    //     const conversationSender = await getConversation(data?.sender);
    //     const conversationReceiver = await getConversation(data?.receiver);

    //     io.to(data?.sender).emit('conversation', conversationSender);
    //     io.to(data?.receiver).emit('conversation', conversationReceiver);
    });

    // socket.on('sidebar', async (currentUserId) => {
    //     const conversation = await getConversation(currentUserId);
    //     socket.emit('conversation', conversation);
    // });

    // socket.on('seen', async (msgByUserId) => {
    //     let conversation = await ConversationModel.findOne({
    //         "$or": [
    //             { sender: user?._id, receiver: msgByUserId },
    //             { sender: msgByUserId, receiver: user?._id }
    //         ]
    //     });

    //     const conversationMessageId = conversation?.messages || [];

    //     await MessageModel.updateMany(
    //         { _id: { "$in": conversationMessageId }, msgByUserId: msgByUserId },
    //         { "$set": { seen: true } }
    //     );

    //     const conversationSender = await getConversation(user?._id?.toString());
    //     const conversationReceiver = await getConversation(msgByUserId);

    //     io.to(user?._id?.toString()).emit('conversation', conversationSender);
    //     io.to(msgByUserId).emit('conversation', conversationReceiver);
    // });

    socket.on('disconnect', () => {
        onlineUser.delete(user?._id?.toString());
        console.log('User disconnected', socket.id);
    });
});

// async function getUserDetailsFromToken(token) {
//     // Implementation of getting user details from token
// }

// async function getConversation(userId) {
//     // Implementation of getting conversation details
// }
