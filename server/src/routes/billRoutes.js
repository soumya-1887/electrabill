const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');

router.post('/calculate', billController.calculatePreview);
router.get('/', billController.getBills);
router.post('/', billController.createBill);
router.get('/:id', billController.getBillById);
router.delete('/:id', billController.deleteBill);

module.exports = router;
