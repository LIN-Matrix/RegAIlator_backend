const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  from: String,
  to: String,
  subject: String,
  date: Date,
  text: String,
  html: String
});

const Email = mongoose.model('Email', emailSchema);

module.exports = Email;
