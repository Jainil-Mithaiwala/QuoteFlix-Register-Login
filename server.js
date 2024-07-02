const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());
app.use(cors());

const port = 5000;

// MySQL database setup
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password:'',
  database: 'quoteflix',
});

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  secure: true,
  port: 465,
  auth: {
    user: 'web.quoteflix@gmail.com',
    pass: 'pjdhuqdoiokrcdwi',
  },
});

// Connect to MySQL database
db.connect((err) => {
  if (err) throw err;
  console.log('Database connected');
});

// Endpoint for user signup
app.post('/signup', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please fill in all required fields' });
  }

  const sql = "INSERT INTO login (name, email, password) VALUES (?, ?, ?)";
  db.query(sql, [name, email, password], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Registration failed' });
    }

    // Send confirmation email
    try {
      await transporter.sendMail({
        from: 'web.quoteflix@gmail.com',
        to: email,
        subject: 'Registration Successful',
        text: `Hello ${name},\n\nYou have successfully signed up on Quoteflix.`,
      });
      console.log('Registration email sent to:', email);
    } catch (error) {
      console.error('Error sending registration email:', error);
    }

    return res.json({ message: 'Registration successful! Please log in.' });
  });
});

// Endpoint for user login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter email and password' });
  }

  const sql = "SELECT name FROM login WHERE email = ? AND password = ?";
  db.query(sql, [email, password], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Login failed' });
    }

    if (results.length > 0) {
      const userName = results[0].name;

      // Send login success email
      try {
        await transporter.sendMail({
          from: 'web.quoteflix@gmail.com',
          to: email,
          subject: 'Login Successful',
          text: `Hello ${userName},\n\nYou have successfully logged in to Quoteflix.`,
        });
        console.log('Login email sent to:', email);
      } catch (error) {
        console.error('Error sending login email:', error);
      }

      return res.json({ message: 'Login successful' });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  });
});

// Endpoint to fetch user data based on email
app.get('/user/:email', (req, res) => {
  const email = req.params.email;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const sql = "SELECT name, email FROM login WHERE email = ?";
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (results.length > 0) {
      return res.json(results[0]); // Assuming there's only one user with the given email
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  });
});

// Endpoint for updating user profile
app.put('/user/:email', (req, res) => {
  const email = req.params.email;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const { name } = req.body;

  const sql = "UPDATE login SET name = ? WHERE email = ?";
  db.query(sql, [name, email], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Failed to update user data' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ success: true });
  });
});

// Endpoint to check email existence
app.get('/check-email', (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const sql = "SELECT * FROM login WHERE email = ?";
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (results.length > 0) {
      return res.json({ exists: true });
    } else {
      return res.json({ exists: false });
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
