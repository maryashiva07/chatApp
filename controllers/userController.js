const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");

const User = require("../modules/User");

require("dotenv").config();

// SignUp/Create User

const signup = async (req, res) => {
  const { name, email, phone, password } = req.body;
  try {
    //check user exist

    const userExist = await User.findOne({
      where: {
        email: email,
      },
    });

    if (userExist) {
      return res.status(409).json({
        message: "User already exist",
      });
    }

    const hashedPass = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPass,
    });

    res.status(201).json({
      message: "User created Successfully!",
      newUser: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: "Error on User creation!",
      err: err.message,
    });
  }
};

// login Controller

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    //check user exist
    const isUser = await User.findOne({
      where: {
        email: email,
      },
    });

    if (!isUser) {
      return res.status(401).json({
        message: "Invalid Email or Password",
      });
    }

    //pass verification

    const hashedPass = await bcrypt.compare(password, isUser.password);

    if (!hashedPass) {
      return res.status(401).json({
        message: "Invalid Email or Password",
      });
    }

    //generate token

    const token = await jwt.sign(
      {
        id: isUser.id,
        email: isUser.email,
        name: isUser.name
      },

      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    res.status(201).json({
      message: "Login Successfull",
      token,
      isUser: {
        id: isUser.id,
        name: isUser.name,
        email: isUser.email,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: "Error on login",
      err: err.message,
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email"],

      where: {
        id: {
          [Op.ne]: req.user.id,
        },
      },
    });

    res.status(200).json({
      users,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error getting users",
      err: err.message,
    });
  }
};

module.exports = { signup, login, getUsers };
