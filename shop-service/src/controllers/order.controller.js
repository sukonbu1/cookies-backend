const OrderService = require('../services/order.service');
const { sendToQueue } = require('../utils/rabbitmq.util');
const { OrderItem } = require('../models/order.model');

class OrderController {
  async createOrder(req, res, next) {
    try {
      // Get user_id from the authenticated user
      const user_id = req.user.uid || req.user.userId || req.user.id || req.user.sub;
      const actor_name = req.user.displayName || req.user.name || req.user.email || user_id;
      // Generate a unique order_number
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const orderData = { ...req.body, user_id, order_number: orderNumber }; // Inject user_id and order_number
      const order = await OrderService.createOrder(orderData);

      // Fetch order items to get shop_id(s)
      const orderItems = await OrderItem.findByOrderId(order.order_id);
      // Notify each shop owner (shop_id) about the new order
      const notifiedShops = new Set();
      for (const item of orderItems) {
        if (!item.shop_id || notifiedShops.has(item.shop_id)) continue;
        notifiedShops.add(item.shop_id);
        // Send notification event to RabbitMQ (shop owner)
        await sendToQueue('notification-events', {
          type: 'order',
          target_user_id: item.shop_id, // Assuming shop_id is the user_id of the shop owner
          actor_name,
          order_id: order.order_id,
          order_number: order.order_number,
          total_amount: order.total_amount,
          reference_type: 'order',
          reference_id: order.order_id,
          for_shop_owner: true
        });
      }

      // Notify the buyer (user who placed the order)
      await sendToQueue('notification-events', {
        type: 'order',
        target_user_id: user_id,
        actor_name,
        order_id: order.order_id,
        order_number: order.order_number,
        total_amount: order.total_amount,
        reference_type: 'order',
        reference_id: order.order_id,
        for_shop_owner: false
      });

      res.status(201).json({ status: 'success', data: order });
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const order = await OrderService.getOrderById(req.params.id);
      if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });
      res.json({ status: 'success', data: order });
    } catch (error) {
      next(error);
    }
  }

  async getAllOrders(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {};
      if (req.query.shop_id) filters.shop_id = req.query.shop_id;
      if (req.query.order_status) filters.order_status = req.query.order_status;
      const orders = await OrderService.getAllOrders(filters, { page, limit });
      res.json({ status: 'success', data: orders });
    } catch (error) {
      next(error);
    }
  }

  async getOrdersByShop(req, res, next) {
    try {
      const { shopId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {};
      
      if (req.query.order_status) filters.order_status = req.query.order_status;
      if (req.query.payment_status) filters.payment_status = req.query.payment_status;
      if (req.query.shipping_status) filters.shipping_status = req.query.shipping_status;
      
      const orders = await OrderService.getOrdersByShop(shopId, filters, { page, limit });
      res.json({ status: 'success', data: orders });
    } catch (error) {
      next(error);
    }
  }

  async updateOrder(req, res, next) {
    try {
      const order = await OrderService.updateOrder(req.params.id, req.body);
      if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });
      res.json({ status: 'success', data: order });
    } catch (error) {
      next(error);
    }
  }

  async deleteOrder(req, res, next) {
    try {
      const deleted = await OrderService.deleteOrder(req.params.id);
      if (!deleted) return res.status(404).json({ status: 'error', message: 'Order not found' });
      res.json({ status: 'success', message: 'Order deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController(); 