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
      let subtotal = 0;
      let tax_amount = 0;
      const processedItems = [];
      for (const item of items) {
        // Check if product has variants
        const product = await Product.findById(item.product_id);
        if (!product) {
          throw new Error(`Product with ID ${item.product_id} not found.`);
        }
        const variants = await ProductVariant.findByProductId(item.product_id);
        if (variants.length > 0) {
          // Product has variants, variant_id is required
          if (!item.variant_id) {
            throw new Error('Each order item must include a variant_id for products with variants.');
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
          const item_tax = total_price * 0.08;
          subtotal += total_price;
          tax_amount += item_tax;
          processedItems.push({
            ...item,
            product_id: variant.product_id,
            unit_price,
            total_price,
            shop_id: item.shop_id || null,
            variant_id: item.variant_id
          });
          await ProductVariant.updateStock(item.variant_id, variant.stock_quantity - item.quantity);
        } else {
          // Product has no variants, use product's price/stock
          if (product.stock_quantity < item.quantity) {
            throw new Error(`Insufficient stock for product: ${product.name || product.product_id}.`);
          }
          const unit_price = parseFloat(product.price);
          const total_price = unit_price * item.quantity;
          const item_tax = total_price * 0.08;
          subtotal += total_price;
          tax_amount += item_tax;
          processedItems.push({
            ...item,
            product_id: product.product_id,
            unit_price,
            total_price,
            shop_id: item.shop_id || null,
            variant_id: null
          });
          // Update product stock
          await Product.updateStockQuantity(product.product_id, product.stock_quantity - item.quantity);
        }
      }
      // Use total_amount from request if provided, otherwise calculate
      let total_amount = restOfOrderData.total_amount;
      if (typeof total_amount === 'undefined' || total_amount === null) {
        total_amount = subtotal + tax_amount;
      }

      const newOrderData = {
        ...restOfOrderData,
        user_id,
        order_number: `ORD-${Date.now()}`,
        subtotal,
        tax_amount,
        total_amount,
      };
      const newOrder = await Order.create(newOrderData, client);
      const orderItems = [];
      for (const item of processedItems) {
        const orderItemData = {
          ...item,
          order_id: newOrder.order_id,
        };
        const newOrderItem = await OrderItem.create(orderItemData, client);
        orderItems.push(newOrderItem);
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
    const items = await OrderItem.findDetailedByOrderId(orderId);
    return { ...order, items };
  }

  static async getOrdersWithDetails(filters, pagination) {
    const orders = await Order.findAll(filters, pagination);
    const detailedOrders = await Promise.all(
      orders.map(async (order) => {
        const items = await OrderItem.findDetailedByOrderId(order.order_id);
        return { ...order, items };
      })
    );
    return detailedOrders;
  }

  static async getAllOrders(filters, pagination) {
    return Order.findAll(filters, pagination);
  }

  static async getOrdersByShopWithDetails(shop_id, pagination) {
    const orderIdsQuery = `
      SELECT DISTINCT order_id FROM orderitems WHERE shop_id = $1
      LIMIT $2 OFFSET $3
    `;
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const offset = (page - 1) * limit;
    const { rows: orderIdRows } = await pool.query(orderIdsQuery, [shop_id, limit, offset]);
    const orderIds = orderIdRows.map(r => r.order_id);
    if (orderIds.length === 0) return [];
    const orders = await Promise.all(orderIds.map(async (order_id) => {
      const order = await Order.findById(order_id);
      const items = await OrderItem.findDetailedByOrderId(order_id);
      const shopItems = items.filter(item => item.shop_id === shop_id);
      return { ...order, items: shopItems };
    }));
    return orders;
  }

  static async updateOrder(orderId, updateData) {
    return Order.update(orderId, updateData);
  }

  static async deleteOrder(orderId) {
    return Order.delete(orderId);
  }
}

module.exports = OrderService; 