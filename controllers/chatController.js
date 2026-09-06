const chatMessage = require("../modules/chatMessage");


//send Message

const sendMessage = async (req, res) =>{
     
    const {message} = req.body;

    try{
           if(!message || message.trim()===""){
               return res.status(400).json({
                   message: "Message is required"
               })
           };

           const newMessage = await chatMessage.create({
                 userId: req.user.id,
                 message: message.trim()
           })

           res.status(201).json({
               message: "Message set Successfully",
               chat: newMessage
           });
    }
    catch(err){
         res.status(500).json({
             message: "Error Sending Message",
             err: err.message
         })
    }
};



module.exports = {sendMessage};