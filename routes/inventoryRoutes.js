const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const c = require('../controllers/inventoryController');
router.use(auth);
router.get('/', c.getProducts);
router.post('/', c.createProduct);
router.put('/:id', c.updateProduct);
router.delete('/:id', c.deleteProduct);
module.exports = router;
