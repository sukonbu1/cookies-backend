const Shop = require('../models/shop.model');

class ShopService {
  static async createShop(shopData, client) {
    return Shop.create(shopData, client);
  }

  static async getShopById(shopId) {
    return Shop.findById(shopId);
  }

  static async getAllShops(filters, pagination) {
    return Shop.findAll(filters, pagination);
  }

  static async updateShop(shopId, updateData) {
    return Shop.update(shopId, updateData);
  }

  static async deleteShop(shopId) {
    return Shop.delete(shopId);
  }

  static async updateShopStatus(shopId, status) {
    return Shop.updateStatus(shopId, status);
  }
}

module.exports = ShopService; 