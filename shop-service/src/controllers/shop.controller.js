const ShopService = require('../services/shop.service');

class ShopController {
  async createShop(req, res, next) {
    try {
      const user_id = req.user.uid || req.user.userId || req.user.id || req.user.sub;
      const shopData = { ...req.body, user_id };
      
      // Accept logo_url and banner_url from frontend
      if (req.body.logo_url) shopData.logo_url = req.body.logo_url;
      if (req.body.banner_url) shopData.banner_url = req.body.banner_url;
      
      const shop = await ShopService.createShop(shopData);
      res.status(201).json({ status: 'success', data: shop });
    } catch (error) {
      next(error);
    }
  }

  async getShopById(req, res, next) {
    try {
      const shop = await ShopService.getShopById(req.params.id);
      if (!shop) return res.status(404).json({ status: 'error', message: 'Shop not found' });
      res.json({ status: 'success', data: shop });
    } catch (error) {
      next(error);
    }
  }

  async getAllShops(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {};
      if (req.query.status) filters.status = req.query.status;
      if (req.query.user_id) filters.user_id = req.query.user_id;
      if (req.query.is_verified !== undefined) filters.is_verified = req.query.is_verified === 'true';
      const shops = await ShopService.getAllShops(filters, { page, limit });
      res.json({ status: 'success', data: shops });
    } catch (error) {
      next(error);
    }
  }

  async updateShop(req, res, next) {
    try {
      const updateData = { ...req.body };
      // Accept logo_url and banner_url from frontend
      if (req.body.logo_url) updateData.logo_url = req.body.logo_url;
      if (req.body.banner_url) updateData.banner_url = req.body.banner_url;
      // Optionally, only allow update if req.user.uid matches shop.user_id
      const shop = await ShopService.updateShop(req.params.id, updateData);
      if (!shop) return res.status(404).json({ status: 'error', message: 'Shop not found' });
      res.json({ status: 'success', data: shop });
    } catch (error) {
      next(error);
    }
  }

  async deleteShop(req, res, next) {
    console.log('deleteShop controller called, req.user:', req.user);
    try {
      // Get the shop
      const shop = await ShopService.getShopById(req.params.id);
      if (!shop) {
        return res.status(404).json({ status: 'error', message: 'Shop not found' });
      }

      // Check ownership
      const user_id = req.user.uid || req.user.userId || req.user.id || req.user.sub;
      if (shop.user_id !== user_id) {
        return res.status(403).json({ status: 'error', message: 'You are not authorized to delete this shop' });
      }

      // Proceed with deletion
      const deleted = await ShopService.deleteShop(req.params.id);
      if (!deleted) {
        return res.status(404).json({ status: 'error', message: 'Shop not found' });
      }
      res.json({ status: 'success', message: 'Shop deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async updateShopStatus(req, res, next) {
    try {
      const shop = await ShopService.updateShopStatus(req.params.id, req.body.status);
      if (!shop) return res.status(404).json({ status: 'error', message: 'Shop not found' });
      res.json({ status: 'success', data: shop });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ShopController(); 