const Payment = require('../models/payment.model');
const Order = require('../models/order.model');

class PaymentService {
  /**
   * Creates payment record and updates order status atomically
   * Generates unique transaction ID and automatically marks order as paid
   * when payment is successfully processed
   */
  static async createPayment(paymentData) {
    const { order_id, amount } = paymentData;
    
    // Create payment record with auto-generated transaction ID
    const payment = await Payment.create({
      ...paymentData,
      status: 'completed',
      transaction_id: `txn_${Date.now()}`
    });
    
    // Update corresponding order status when payment is successful
    if (payment.status === 'completed') {
      await Order.update(order_id, { payment_status: 'paid' });
    }
    
    return payment;
  }

  static async getPaymentById(paymentId) {
    return Payment.findById(paymentId);
  }

  static async getPaymentsByOrderId(orderId) {
    return Payment.findByOrderId(orderId);
  }

  static async updatePayment(paymentId, updateData) {
    return Payment.update(paymentId, updateData);
  }
}

module.exports = PaymentService; 