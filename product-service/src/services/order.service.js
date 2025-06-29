const pool = require('../../../common/src/config/database');
const Order = require('../models/order.model');
const OrderItem = require('../models/orderItem.model');
const Product = require('../models/product.model');
const ProductVariant = require('../models/productVariant.model');

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
        // Require variant_id for each item
        if (!item.variant_id) {
          throw new Error('Each order item must include a variant_id.');
        }
        const variant = await ProductVariant.findById(item.variant_id);
        if (!variant) {
          throw new Error(`Variant with ID ${item.variant_id} not found.`);
        }
        if (variant.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for variant: ${variant.name || variant.sku || variant.variant_id}.`);
        }
        const unit_price = parseFloat(variant.price);
        const total_price = unit_price * item.quantity;
        subtotal += total_price;
        
        processedItems.push({
          ...item,
          product_id: variant.product_id,
          unit_price,
          total_price,
          shop_id: item.shop_id || null, // Optionally fetch from product if needed
          variant_id: item.variant_id
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

        // Decrement variant stock
        await ProductVariant.updateStock(item.variant_id, variant.stock_quantity - item.quantity);
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