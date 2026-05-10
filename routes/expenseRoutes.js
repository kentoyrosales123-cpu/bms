const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const c = require('../controllers/expenseController');
router.use(auth);
router.get('/', c.getExpenses);
router.post('/', c.createExpense);
router.put('/:id', c.updateExpense);
router.delete('/:id', c.deleteExpense);
module.exports = router;
