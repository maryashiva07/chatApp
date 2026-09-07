const chatMessage = require("../modules/chatMessage");
const { redisClient } = require("../config/redis");
const { Op } = require("sequelize");


// Send Message
const sendMessage = async (req, res) => {

    const { message, receiverId } = req.body;

    console.log("REQ USER:", req.user);
    console.log("RECEIVER ID:", receiverId);

    try {

        if (!message || message.trim() === "") {

            return res.status(400).json({
                message: "Message is required"
            });

        }

        if (!receiverId) {

            return res.status(400).json({
                message: "Receiver is required"
            });

        }

        const senderId = Number(req.user.id);
        const receiver = Number(receiverId);

        const newMessage = await chatMessage.create({

            userId: senderId,

            receiverId: receiver,

            message: message.trim(),

            seen: false

        });

        console.log(
            "NEW MESSAGE:",
            newMessage.toJSON()
        );

        // Delete sender conversation cache
        await redisClient.del(
            `chat:messages:${senderId}:${receiver}`
        );

        // Delete receiver conversation cache
        await redisClient.del(
            `chat:messages:${receiver}:${senderId}`
        );

        res.status(201).json({

            message:
                "Message sent successfully",

            chat:
                newMessage

        });

    }
    catch (err) {

        console.log(
            "Send Message Error:",
            err
        );

        res.status(500).json({

            message:
                "Error Sending Message",

            err:
                err.message

        });

    }

};


// Get Messages
const getMessages = async (req, res) => {

    try {

        const receiverId =
            Number(req.query.receiverId);

        const currentUserId =
            Number(req.user.id);

        if (!receiverId) {

            return res.status(400).json({

                message:
                    "Receiver is required"

            });

        }

        const cacheKey =
            `chat:messages:${currentUserId}:${receiverId}`;


        // Check Redis cache
        const cachedMessages =
            await redisClient.get(cacheKey);

        if (cachedMessages) {

            return res.status(200).json({

                chats:
                    JSON.parse(cachedMessages)

            });

        }


        // Get messages from database
        const chats =
            await chatMessage.findAll({

                where: {

                    [Op.or]: [

                        {
                            userId:
                                currentUserId,

                            receiverId:
                                receiverId
                        },

                        {
                            userId:
                                receiverId,

                            receiverId:
                                currentUserId
                        }

                    ]

                },

                order: [
                    ["createdAt", "ASC"]
                ]

            });


        // Save messages in Redis
        await redisClient.setEx(

            cacheKey,

            60,

            JSON.stringify(chats)

        );


        res.status(200).json({

            chats

        });

    }
    catch (err) {

        console.log(
            "Get Messages Error:",
            err
        );

        res.status(500).json({

            message:
                "Error on getting messages",

            err:
                err.message

        });

    }

};


// Mark Messages as Seen
const markMessagesAsSeen = async (req, res) => {

    try {

        const senderId =
            Number(req.body.senderId);

        const receiverId =
            Number(req.user.id);

        if (!senderId) {

            return res.status(400).json({

                message:
                    "Sender is required"

            });

        }


        // Mark only unseen messages as seen
        await chatMessage.update(

            {
                seen: true
            },

            {
                where: {

                    userId:
                        senderId,

                    receiverId:
                        receiverId,

                    seen:
                        false

                }

            }

        );


        // Delete both conversation caches
        await redisClient.del(
            `chat:messages:${receiverId}:${senderId}`
        );

        await redisClient.del(
            `chat:messages:${senderId}:${receiverId}`
        );


        res.status(200).json({

            message:
                "Messages marked as seen"

        });

    }
    catch (err) {

        console.log(
            "Mark Seen Error:",
            err
        );

        res.status(500).json({

            message:
                "Error marking messages as seen",

            err:
                err.message

        });

    }

};


module.exports = {

    sendMessage,

    getMessages,

    markMessagesAsSeen

};