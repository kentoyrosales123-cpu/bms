const Product = require('../models/Product');
const Sale = require('../models/Sale');

exports.getSales = async (req, res) => {
  try {
    const sales = await Sale.find().populate('product customer').sort({ saleDate: -1 });
    res.json(sales);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.createSale = async (req, res) => {
  try {
    const { productId, customer, quantity, saleDate, notes } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.stock < Number(quantity)) return res.status(400).json({ message: 'Not enough stock available' });

    const qty = Number(quantity);
    const totalAmount = product.sellingPrice * qty;
    const profit = (product.sellingPrice - product.buyingPrice) * qty;

    const sale = await Sale.create({
      product: product._id,
      customer: customer || undefined,
      quantity: qty,
      unitPrice: product.sellingPrice,
      buyingPrice: product.buyingPrice,
      totalAmount,
      profit,
      saleDate: saleDate || new Date(),
      notes
    });

    product.stock -= qty;
    await product.save();

    res.status(201).json(await sale.populate('product customer'));
  } catch (error) { res.status(400).json({ message: error.message }); }
};

exports.deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    await Product.findByIdAndUpdate(sale.product, { $inc: { stock: sale.quantity } });
    res.json({ message: 'Sale deleted and stock restored' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
