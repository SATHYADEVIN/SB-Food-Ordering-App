import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { Admin, Cart, FoodItem, Orders, Restaurant, User } from './Schema.js';

const app = express();

// Middleware
app.use(express.json());
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

const PORT = 6001;

// MongoDB Connection
mongoose
  .connect('mongodb://127.0.0.1:27017/delivery', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');

    // ** Helper Function for Common Response **
    const handleError = (res, error) => {
      console.error(error);
      return res.status(500).json({ message: 'Server Error', error: error.message });
    };

    // ** Routes **

    // User Registration
    app.post('/register', async (req, res) => {
      const { username, email, usertype, password, restaurantAddress, restaurantImage } = req.body;

      try {
        if (!username || !email || !password || !usertype) {
          return res.status(400).json({ message: 'Missing required fields' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        if (usertype === 'restaurant') {
          const newUser = new User({
            username,
            email,
            usertype,
            password: hashedPassword,
            approval: 'pending',
          });
          const user = await newUser.save();

          const restaurant = new Restaurant({
            ownerId: user._id,
            title: username,
            address: restaurantAddress,
            mainImg: restaurantImage,
            menu: [],
          });
          await restaurant.save();

          return res.status(201).json({ message: 'Restaurant registered', user });
        } else {
          const newUser = new User({
            username,
            email,
            usertype,
            password: hashedPassword,
            approval: 'approved',
          });
          const userCreated = await newUser.save();

          return res.status(201).json({ message: 'User registered', user: userCreated });
        }
      } catch (error) {
        handleError(res, error);
      }
    });

    // User Login
    app.post('/login', async (req, res) => {
      const { email, password } = req.body;

      try {
        if (!email || !password) {
          return res.status(400).json({ message: 'Missing email or password' });
        }

        const user = await User.findOne({ email });
        if (!user) {
          return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid email or password' });
        }

        res.json({ message: 'Login successful', user });
      } catch (error) {
        handleError(res, error);
      }
    });

    // Other routes like /approve-user, /reject-user, etc.

    // Start Server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection error:', error.message);
    process.exit(1); // Exit if the database connection fails
  });
