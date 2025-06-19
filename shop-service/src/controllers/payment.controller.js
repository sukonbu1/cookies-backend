const PaymentService = require('../services/payment.service');

class PaymentController {
  async createPayment(req, res, next) {
    try {
      const payment = await PaymentService.createPayment(req.body);
      res.status(201).json({ status: 'success', data: payment });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentById(req, res, next) {
    try {
      const payment = await PaymentService.getPaymentById(req.params.id);
      if (!payment) return res.status(404).json({ status: 'error', message: 'Payment not found' });
      res.json({ status: 'success', data: payment });
    } catch (error) {
      next(error);
    }
  }

  async getAllPayments(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {};
      if (req.query.order_id) filters.order_id = req.query.order_id;
      if (req.query.status) filters.status = req.query.status;
      const payments = await PaymentService.getAllPayments(filters, { page, limit });
      res.json({ status: 'success', data: payments });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController(); 