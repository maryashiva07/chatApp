const express = require("express");
const cors = require("cors");
const path = require("path");


const userRoute = require("./routes/userRoutes");
const sequelize = require("./config/database");

const app = express();

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, "public")));

app.use("/api", userRoute);

const PORT = process.env.PORT || 7000;

app.get("/", (req, res)=>{
      res.sendFile(path.join(__dirname, "public", "login.html"));
});


async function startServer(){
     try{
           await sequelize.authenticate();
           console.log("Database connected Successfully");

           await sequelize.sync();
           console.log("Table sync!");

           app.listen(PORT, ()=>{
               console.log("App is running on port: ", PORT);
           });
     }
     catch(err){
          console.log("Error on connecting server");
     }
}

startServer();