const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const c = require('../controllers/salesController');
router.use(auth);
router.get('/', c.getSales);
router.post('/', c.createSale);
router.delete('/:id', c.deleteSale);
module.exports = router;
