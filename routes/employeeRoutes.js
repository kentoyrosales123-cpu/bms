const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const c = require('../controllers/employeeController');
router.use(auth);
router.get('/', c.getEmployees);
router.post('/', c.createEmployee);
router.put('/:id', c.updateEmployee);
router.delete('/:id', c.deleteEmployee);
module.exports = router;
