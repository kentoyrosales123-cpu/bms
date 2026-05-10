const Expense = require('../models/Expense');

exports.getExpenses = async (req, res) => {
  try { res.json(await Expense.find().sort({ expenseDate: -1 })); }
  catch (error) { res.status(500).json({ message: error.message }); }
};
exports.createExpense = async (req, res) => {
  try { res.status(201).json(await Expense.create(req.body)); }
  catch (error) { res.status(400).json({ message: error.message }); }
};
exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
  } catch (error) { res.status(400).json({ message: error.message }); }
};
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
