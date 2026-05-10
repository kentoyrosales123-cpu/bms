const Customer = require('../models/Customer');
const Sale = require('../models/Sale');

exports.getCustomers = async (req, res) => {
  try { res.json(await Customer.find().sort({ createdAt: -1 })); }
  catch (error) { res.status(500).json({ message: error.message }); }
};
exports.createCustomer = async (req, res) => {
  try { res.status(201).json(await Customer.create(req.body)); }
  catch (error) { res.status(400).json({ message: error.message }); }
};
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (error) { res.status(400).json({ message: error.message }); }
};
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json({ message: 'Customer deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.purchaseHistory = async (req, res) => {
  try {
    const sales = await Sale.find({ customer: req.params.id }).populate('product').sort({ saleDate: -1 });
    res.json(sales);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
