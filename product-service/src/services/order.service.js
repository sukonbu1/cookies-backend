const pool = require('../../../common/src/config/database');
const Order = require('../models/order.model');
const OrderItem = require('../models/orderItem.model');
const Product = require('../models/product.model');

class OrderService {
  static async createOrder(orderData) {
    const { user_id, items, ...restOfOrderData } = orderData;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Calculate totals and check stock
      let subtotal = 0;
      const processedItems = [];

      for (const item of items) {
        const product = await Product.findById(item.product_id);
        if (!product) {
          throw new Error(`Product with ID ${item.product_id} not found.`);
        }
        if (product.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for product: ${product.name}.`);
        }

        const unit_price = parseFloat(product.price);
        const total_price = unit_price * item.quantity;
        subtotal += total_price;
        
        processedItems.push({
          ...item,
          unit_price,
          total_price,
          shop_id: product.shop_id
        });
      }

      // Assume total_amount is subtotal for simplicity. 
      // In a real app, this would include taxes, shipping, etc.
      const total_amount = subtotal;

      // 2. Create the Order
      const newOrderData = {
        ...restOfOrderData,
        user_id,
        order_number: `ORD-${Date.now()}`,
        subtotal,
        total_amount,
      };
      const newOrder = await Order.create(newOrderData, client);

      // 3. Create Order Items and update stock
      const orderItems = [];
      for (const item of processedItems) {
        const orderItemData = {
          ...item,
          order_id: newOrder.order_id,
        };
        const newOrderItem = await OrderItem.create(orderItemData, client);
        orderItems.push(newOrderItem);

        // Update stock
        await Product.updateStock(item.product_id, -item.quantity, client);
      }

      await client.query('COMMIT');

      return { ...newOrder, items: orderItems };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getOrderById(orderId) {
    const order = await Order.findById(orderId);
    if (!order) return null;
    const items = await OrderItem.findByOrderId(orderId);
    return { ...order, items };
  }

  static async getAllOrders(filters, pagination) {
    return Order.findAll(filters, pagination);
  }

  static async updateOrder(orderId, updateData) {
    return Order.update(orderId, updateData);
  }

  static async deleteOrder(orderId) {
    return Order.delete(orderId);
  }
}

module.exports = OrderService; 