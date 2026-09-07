const {DataTypes} = require("sequelize");
const sequelize = require("../config/database");


const chatMessage = sequelize.define("chatMessage", {
      id:{
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      userId:{
          type: DataTypes.INTEGER,
          allowNull: false
      },
      receiverId:{
          type: DataTypes.INTEGER,
          allowNull: false
      },
      message:{
           type: DataTypes.TEXT,
           allowNull: false
      },
      seen:{
          type: DataTypes.BOOLEAN,
          defaultValue: false
      }
});


module.exports = chatMessage;