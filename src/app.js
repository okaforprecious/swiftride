const express = require('express'); 
const cors = require('cors'); 
const morgan = require('morgan'); 

const authroutes =require('./routes/authroutes')
console.log("✅ Auth routes loaded");
 
const app = express(); 
 
// Middlewares 
app.use(cors()); 
app.use(express.json()); 
app.use(morgan('dev')); 
app.use ("/api/auth", authroutes)

 
// Health check route 
app.get('/api/health', (req, res) => { 
  res.json({ status: 'ok', service: 'swiftride' }); 
}); 
 
module.exports = app; 