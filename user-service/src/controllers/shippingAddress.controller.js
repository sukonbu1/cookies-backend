const ShippingAddress = require('../models/shippingAddress.model');

const shippingAddressController = {
  async getShippingAddress(req, res, next) {
    try {
      const user_id = req.user.user_id;
      const address = await ShippingAddress.findByUserId(user_id);
      if (!address) {
        return res.status(404).json({ status: 'error', message: 'Shipping address not found' });
      }
      res.json({ status: 'success', data: address });
    } catch (error) {
      next(error);
    }
  },

  async updateShippingAddress(req, res, next) {
    try {
      const user_id = req.user.user_id;
      const updateData = { ...req.body };
      const address = await ShippingAddress.updateByUserId(user_id, updateData);
      res.json({ status: 'success', data: address });
    } catch (error) {
      next(error);
    }
  },

  async createShippingAddress(req, res, next) {
    try {
      const user_id = req.user.user_id;
      const existing = await ShippingAddress.findByUserId(user_id);
      if (existing) {
        return res.status(400).json({ status: 'error', message: 'Shipping address already exists' });
      }
      const addressData = { ...req.body, user_id };
      const address = await ShippingAddress.create(addressData);
      res.status(201).json({ status: 'success', data: address });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = shippingAddressController; 