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
      if (!payment) {
        return res.status(404).json({ status: 'error', message: 'Payment not found' });
      }
      res.json({ status: 'success', data: payment });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentsByOrderId(req, res, next) {
    try {
      const payments = await PaymentService.getPaymentsByOrderId(req.params.orderId);
      res.json({ status: 'success', data: payments });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController(); 