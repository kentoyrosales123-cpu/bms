const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const controller = require('../controllers/authController');
router.post('/login', controller.login);
router.get('/me', auth, controller.me);
module.exports = router;
