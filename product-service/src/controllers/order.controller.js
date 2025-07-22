const OrderService = require('../services/order.service');
const { sendToQueue } = require('../utils/rabbitmq.util'); // Adjust path as needed

class OrderController {
  async createOrder(req, res, next) {
    try {
      const user_id = req.user.uid || req.user.userId || req.user.id || req.user.sub;
      const orderData = { ...req.body, user_id };
      
      if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        return res.status(400).json({ status: 'error', message: 'Order must contain at least one item.' });
      }

      const order = await OrderService.createOrder(orderData);
      // After order is created and before sending the response:
      console.log('Publishing order notification event:', {
        type: 'order',
        target_user_id: shop_id,
        actor_name: user_id,
        order_id: order.order_id,
        order_number: order.order_number,
        for_shop_owner: true // or false for buyer
      });
      await sendToQueue('notification-events', {
        type: 'order',
        target_user_id: shop_id,
        actor_name: user_id,
        order_id: order.order_id,
        order_number: order.order_number,
        for_shop_owner: true // or false for buyer
      });
      res.status(201).json({ status: 'success', data: order });
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const order = await OrderService.getOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({ status: 'error', message: 'Order not found' });
      }
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
      filters.user_id = req.user.uid || req.user.userId || req.user.id || req.user.sub;
      if (req.query.order_status) {
        filters.order_status = req.query.order_status;
      }
      const orders = await OrderService.getAllOrders(filters, { page, limit });
      res.json({ status: 'success', data: orders });
    } catch (error) {
      next(error);
    }
  }

  async getOrdersByUser(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = { user_id: req.user.uid || req.user.userId || req.user.id || req.user.sub };
      const orders = await OrderService.getOrdersWithDetails(filters, { page, limit });
      res.json({ status: 'success', data: orders });
    } catch (error) {
      next(error);
    }
  }

  async getOrdersByShop(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const shopId = req.params.shopId;
      const orders = await OrderService.getOrdersByShopWithDetails(shopId, { page, limit });
      res.json({ status: 'success', data: orders });
    } catch (error) {
      next(error);
    }
  }

  async updateOrder(req, res, next) {
    try {
      const order = await OrderService.updateOrder(req.params.id, req.body);
      if (!order) {
        return res.status(404).json({ status: 'error', message: 'Order not found' });
      }
      res.json({ status: 'success', data: order });
    } catch (error) {
      next(error);
    }
  }

  async deleteOrder(req, res, next) {
    try {
      const deleted = await OrderService.deleteOrder(req.params.id);
      if (!deleted) {
        return res.status(404).json({ status: 'error', message: 'Order not found' });
      }
      res.json({ status: 'success', message: 'Order deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController(); 