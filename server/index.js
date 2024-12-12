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
        // Validate input
        if (!username || !email || !password || !usertype) {
          return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
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

    // Promote Restaurants
    app.post('/update-promote-list', async (req, res) => {
      const { promoteList } = req.body;

      try {
        if (!promoteList || !Array.isArray(promoteList)) {
          return res.status(400).json({ message: 'Invalid promote list' });
        }

        const admin = await Admin.findOne();
        if (!admin) {
          return res.status(404).json({ message: 'Admin record not found' });
        }

        admin.promotedRestaurants = promoteList;
        await admin.save();

        res.json({ message: 'Promote list updated successfully' });
      } catch (error) {
        handleError(res, error);
      }
    });

    // Approve User
    app.post('/approve-user', async (req, res) => {
      const { id } = req.body;

      try {
        if (!id) {
          return res.status(400).json({ message: 'User ID is required' });
        }

        const user = await User.findById(id);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        user.approval = 'approved';
        await user.save();

        res.json({ message: 'User approved' });
      } catch (error) {
        handleError(res, error);
      }
    });

    // Reject User
    app.post('/reject-user', async (req, res) => {
      const { id } = req.body;

      try {
        if (!id) {
          return res.status(400).json({ message: 'User ID is required' });
        }

        const user = await User.findById(id);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        user.approval = 'rejected';
        await user.save();

        res.json({ message: 'User rejected' });
      } catch (error) {
        handleError(res, error);
      }
    });

    // Fetch Users
    app.get('/fetch-users', async (req, res) => {
      try {
        const users = await User.find();
        res.json(users);
      } catch (error) {
        handleError(res, error);
      }
    });

    // Fetch Restaurants
    app.get('/fetch-restaurants', async (req, res) => {
      try {
        const restaurants = await Restaurant.find();
        res.json(restaurants);
      } catch (error) {
        handleError(res, error);
      }
    });

    // Add Cart Item
    app.post('/add-to-cart', async (req, res) => {
      const { userId, foodItemId, foodItemName, restaurantId, foodItemImg, price, discount, quantity } = req.body;

      try {
        if (!userId || !foodItemId || !quantity) {
          return res.status(400).json({ message: 'Missing required cart item fields' });
        }

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
          return res.status(404).json({ message: 'Restaurant not found' });
        }

        const newItem = new Cart({
          userId,
          foodItemId,
          foodItemName,
          restaurantId,
          restaurantName: restaurant.title,
          foodItemImg,
          price,
          discount,
          quantity,
        });

        await newItem.save();
        res.json({ message: 'Item added to cart' });
      } catch (error) {
        handleError(res, error);
      }
    });

    // Start Server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection error:', error.message);
    process.exit(1); // Exit if the database connection fails
  });
