const Employee = require('../models/Employee');

exports.getEmployees = async (req, res) => {
  try { res.json(await Employee.find().sort({ createdAt: -1 })); }
  catch (error) { res.status(500).json({ message: error.message }); }
};
exports.createEmployee = async (req, res) => {
  try { res.status(201).json(await Employee.create(req.body)); }
  catch (error) { res.status(400).json({ message: error.message }); }
};
exports.updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json(employee);
  } catch (error) { res.status(400).json({ message: error.message }); }
};
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
