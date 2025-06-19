const Payment = require('../models/payment.model');

class PaymentService {
  static async createPayment(paymentData) {
    return Payment.create(paymentData);
  }

  static async getPaymentById(paymentId) {
    return Payment.findById(paymentId);
  }

  static async getAllPayments(filters, pagination) {
    return Payment.findAll(filters, pagination);
  }

  static async updatePayment(paymentId, updateData) {
    return Payment.update(paymentId, updateData);
  }

  static async deletePayment(paymentId) {
    return Payment.delete(paymentId);
  }
}

module.exports = PaymentService; 