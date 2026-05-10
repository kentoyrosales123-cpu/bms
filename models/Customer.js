const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactNumber: String,
  email: { type: String, lowercase: true },
  address: String,
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
