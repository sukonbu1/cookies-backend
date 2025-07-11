const { Order } = require('../models/order.model');

class OrderService {
  static async createOrder(orderData) {
    return Order.create(orderData);
  }

  static async getOrderById(orderId) {
    return Order.findById(orderId);
  }

  static async getAllOrders(filters, pagination) {
    return Order.findAll(filters, pagination);
  }

  static async getOrdersByShop(shopId, filters, pagination) {
    return Order.findByShopId(shopId, filters, pagination);
  }

  static async updateOrder(orderId, updateData) {
    return Order.update(orderId, updateData);
  }

  static async deleteOrder(orderId) {
    return Order.delete(orderId);
  }
  
}

module.exports = OrderService; 