require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = 3000;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize the SQLite database
const db = new sqlite3.Database('./mydatabase.db', (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));
app.use(cors());
app.use(express.json()); // Add this line near the top of your file, with other middleware

// Add this near your other middleware setup
app.use('/nutriai.js', (req, res, next) => {
    res.type('application/javascript');
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Home page (Login)
app.get('/', (req, res) => {
    res.render('login', { message: null });
});

// Sign-up page
app.get('/signup', (req, res) => {
    res.render('signup', { message: null });
});

// Sign-up form submission
app.post('/signup', (req, res) => {
    const { name, email, password, height, weight } = req.body;

    // Hash the password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Insert new user into the database
    db.run('INSERT INTO users (name, email, password, height, weight) VALUES (?, ?, ?, ?, ?)', [name, email, hashedPassword, height, weight], function(err) {
        if (err) {
            console.error('Error inserting data:', err.message);
            return res.render('signup', { message: 'Email already exists!' });
        }
        res.redirect('/');
    });
});

// Login form submission
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Check if user exists in the database
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
            console.error('Error querying database:', err.message);
            return res.render('login', { message: 'An error occurred. Please try again later.' });
        }

        if (user && bcrypt.compareSync(password, user.password)) {
            // Password is correct
            req.session.userId = user.id;
            res.redirect('/dashboard');
        } else {
            // Invalid credentials
            res.render('login', { message: 'Invalid email or password!' });
        }
    });
});

// Assuming you have a route for the dashboard, it should look something like this:
app.get('/dashboard', (req, res) => {
    console.log('Session ID:', req.session.userId);
    
    if (!req.session.userId) {
        console.log('No user ID in session, redirecting to login');
        return res.redirect('/login');
    }

    db.get('SELECT id, name, email, height, weight FROM users WHERE id = ?', [req.session.userId], (err, user) => {
        if (err) {
            console.error('Error fetching user data:', err.message);
            return res.status(500).send('An error occurred');
        }
        
        if (!user) {
            console.log('No user found for ID:', req.session.userId);
            return res.redirect('/login');
        }
        
        console.log('User data:', user);
        res.render('dashboard', { user: user });
    });
});

// New route for meals
app.get('/meals', (req, res) => {
    // You would typically fetch meal data from your database here
    const meals = [
        { name: 'Breakfast', calories: 300, time: '8:00 AM' },
        { name: 'Lunch', calories: 500, time: '12:30 PM' },
        { name: 'Snack', calories: 150, time: '3:00 PM' },
        { name: 'Dinner', calories: 600, time: '7:00 PM' },
    ];

    res.render('meals', { meals: meals });
});

// New route for fitness
app.get('/fitness', (req, res) => {
    // You would typically fetch this data from your database
    const workouts = [
        { name: 'Morning Run', duration: 30, calories: 300, date: '2023-06-01' },
        { name: 'Yoga', duration: 60, calories: 200, date: '2023-06-02' },
        { name: 'Weight Training', duration: 45, calories: 250, date: '2023-06-03' },
    ];

    const stats = {
        totalWorkouts: 15,
        totalDuration: 600,
        totalCaloriesBurned: 4500
    };

    res.render('fitness', { workouts: workouts, stats: stats });
});

app.get('/progress', (req, res) => {
    res.render('progress');
});

// Add this new route for NutriAI
app.get('/nutriai', (req, res) => {
    res.render('nutriai');
});

app.post('/nutriai-chat', async (req, res) => {
    const { message } = req.body;
    
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro"});
        
        const prompt = `You are a nutrition expert assistant. Please answer the following question about nutrition, providing concise and accurate information. If suggesting meals, include a brief description and a table of nutritional information. Format your response using HTML for better readability. Keep your response under 150 words.

User query: ${message}

Your response:`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let aiMessage = response.text();
        
        // Remove asterisks
        aiMessage = aiMessage.replace(/\*/g, '');
        
        // Convert simple nutritional information lists into HTML tables
        aiMessage = aiMessage.replace(/(\w+):\s*(\d+)\s*(calories|g|mg)([,\n])/g, (match, item, value, unit, separator) => {
            return `<tr><td>${item}</td><td>${value} ${unit}</td></tr>${separator === ',' ? '' : '\n'}`;
        });
        
        if (aiMessage.includes('<tr>')) {
            aiMessage = aiMessage.replace(/(Nutritional information:|Nutrition facts:)?\s*\n?(<tr>.*<\/tr>)/s, (match, title, tableContent) => {
                return `${title || 'Nutritional information:'}\n<table border="1"><thead><tr><th>Item</th><th>Value</th></tr></thead><tbody>${tableContent}</tbody></table>`;
            });
        }
        
        res.json({ message: aiMessage });
    } catch (error) {
        console.error('Error with NutriAI:', error);
        res.status(500).json({ message: "Sorry, I'm having trouble answering that right now. Please try again later." });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
