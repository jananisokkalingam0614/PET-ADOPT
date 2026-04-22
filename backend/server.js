// server.js — PawsHome Server
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');
require('dotenv').config();

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth',         require('./routes/auth'));
app.use('/api/pets',         require('./routes/pets'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/admin',        require('./routes/admin'));
app.use('/api/users',        require('./routes/users'));

app.get('/api/health', (req, res) => res.json({ status: 'OK' }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));

const PORT = process.env.PORT || 4000;

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pawshome')
  .then(() => {
    console.log('✅  MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀  Server running → http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌  MongoDB Error:', err.message);
    process.exit(1);
  });
