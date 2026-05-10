const ExcelJS = require('exceljs');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Customer = require('../models/Customer');
const Employee = require('../models/Employee');

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

exports.dashboard = async (req, res) => {
  try {
    const [sales, expenses, products, customers, employees] = await Promise.all([
      Sale.find().populate('product customer').sort({ saleDate: -1 }),
      Expense.find(),
      Product.find(),
      Customer.find(),
      Employee.find()
    ]);

    const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const grossProfit = sales.reduce((sum, s) => sum + s.profit, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;
    const lowStock = products.filter(p => p.stock <= p.lowStockLimit);

    const monthly = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, sales: 0, expenses: 0, profit: 0 }));
    sales.forEach(s => {
      const m = new Date(s.saleDate).getMonth();
      monthly[m].sales += s.totalAmount;
      monthly[m].profit += s.profit;
    });
    expenses.forEach(e => {
      const m = new Date(e.expenseDate).getMonth();
      monthly[m].expenses += e.amount;
      monthly[m].profit -= e.amount;
    });

    res.json({
      totalSales,
      totalExpenses,
      grossProfit,
      netProfit,
      inventoryItems: products.length,
      totalCustomers: customers.length,
      totalEmployees: employees.length,
      lowStock,
      recentTransactions: sales.slice(0, 8),
      monthly
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.profitLoss = async (req, res) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : new Date('2000-01-01');
    const to = req.query.to ? new Date(req.query.to) : new Date();
    const sales = await Sale.find({ saleDate: { $gte: from, $lte: to } }).populate('product customer');
    const expenses = await Expense.find({ expenseDate: { $gte: from, $lte: to } });
    const totalSales = sales.reduce((a, b) => a + b.totalAmount, 0);
    const grossProfit = sales.reduce((a, b) => a + b.profit, 0);
    const totalExpenses = expenses.reduce((a, b) => a + b.amount, 0);
    res.json({ from, to, totalSales, grossProfit, totalExpenses, netProfit: grossProfit - totalExpenses, sales, expenses });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.exportExcel = async (req, res) => {
  try {
    const report = req.params.type;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(report.toUpperCase());

    if (report === 'inventory') {
      sheet.columns = [
        { header: 'Name', key: 'name', width: 25 }, { header: 'Category', key: 'category', width: 18 },
        { header: 'Stock', key: 'stock', width: 10 }, { header: 'Buying Price', key: 'buyingPrice', width: 15 },
        { header: 'Selling Price', key: 'sellingPrice', width: 15 }, { header: 'Profit / Item', key: 'profit', width: 15 }
      ];
      const data = await Product.find();
      data.forEach(p => sheet.addRow({ ...p.toObject(), profit: p.sellingPrice - p.buyingPrice }));
    } else if (report === 'sales') {
      sheet.columns = [
        { header: 'Date', key: 'date', width: 18 }, { header: 'Product', key: 'product', width: 25 },
        { header: 'Quantity', key: 'quantity', width: 10 }, { header: 'Total', key: 'total', width: 15 }, { header: 'Profit', key: 'profit', width: 15 }
      ];
      const data = await Sale.find().populate('product');
      data.forEach(s => sheet.addRow({ date: s.saleDate.toISOString().slice(0,10), product: s.product?.name || 'Deleted Product', quantity: s.quantity, total: s.totalAmount, profit: s.profit }));
    } else if (report === 'expenses') {
      sheet.columns = [{ header: 'Date', key: 'date', width: 18 }, { header: 'Title', key: 'title', width: 25 }, { header: 'Category', key: 'category', width: 18 }, { header: 'Amount', key: 'amount', width: 15 }];
      const data = await Expense.find();
      data.forEach(e => sheet.addRow({ date: e.expenseDate.toISOString().slice(0,10), title: e.title, category: e.category, amount: e.amount }));
    } else {
      return res.status(400).json({ message: 'Use inventory, sales, or expenses' });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${report}-report.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) { res.status(500).json({ message: error.message }); }
};
