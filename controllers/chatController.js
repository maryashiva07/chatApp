const chatMessage = require("../modules/chatMessage");
const {redisClient} = require("../config/redis")


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

           //check on redis
           const cacheKey = `chat:messages:${req.user.id}`;

           await redisClient.del(cacheKey);

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



const getMessages = async (req, res) =>{
       try{
              const cacheKey = `chat:messages:${req.user.id}`;

              //check on redis
              const cachedMessages = await redisClient.get(cacheKey);

              if(cachedMessages){
                  return res.status(200).json({
                      chats: JSON.parse(cachedMessages)
                  })
              }


              //now on databse
              const chats = await chatMessage.findAll({
                   order: [["createdAt" , "ASC"]]
              });

              //redis cache

              await redisClient.setEx(
                   cacheKey,
                   60,
                   JSON.stringify(chats)
              );

              res.status(200).json({
                  chats
              });

              console.log(chats);
       }
       catch(err){
            
            res.status(500).json({
                 message: "Error on getting messages",
                 err: err.message
            })
       }
};



module.exports = {sendMessage, getMessages};