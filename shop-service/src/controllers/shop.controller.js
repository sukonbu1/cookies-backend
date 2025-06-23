const ShopService = require('../services/shop.service');
const pool = require('../../../common/src/config/database');
const axios = require('axios');

// Helper to fetch user info from user-service
async function fetchUserInfoFromUserService(user_id, token) {
  const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
  try {
    // Check if the URL already includes /api/users
    const baseUrl = userServiceUrl.includes('/api/users') ? userServiceUrl : `${userServiceUrl}/api/users`;
    const fullUrl = `${baseUrl}/${user_id}`;
    
    console.log('Fetching user info with:', {
      url: fullUrl,
      token: token ? 'Token exists' : 'No token',
      userId: user_id
    });

    if (!token) {
      throw new Error('No authentication token provided');
    }

    // Create a new axios instance with proper headers
    const response = await axios.get(fullUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Cookie: `token=${token}`  // Keep cookie for backward compatibility
      },
      withCredentials: true
    });

    console.log('User service response:', {
      status: response.status,
      hasData: !!response.data
    });

    if (!response.data) {
      throw new Error('Empty response from user-service');
    }

    const userData = response.data.data || response.data;
    if (!userData || !userData.email) {
      throw new Error('Invalid user data received from user-service');
    }

    return userData;
  } catch (err) {
    console.error('Failed to fetch user info:', {
      error: err.message,
      status: err.response?.status,
      data: err.response?.data
    });

    if (err.code === 'ECONNREFUSED') {
      throw new Error(`Cannot connect to user-service at ${userServiceUrl}`);
    }
    if (err.response?.status === 401) {
      throw new Error('Authentication failed with user-service - invalid or expired token');
    }
    if (err.response?.status === 404) {
      throw new Error(`User ${user_id} not found in user-service`);
    }
    if (err.response?.status === 403) {
      throw new Error('CORS error - user-service rejected the request');
    }
    throw new Error(`Failed to fetch user info: ${err.message}`);
  }
}

class ShopController {
  async createShop(req, res, next) {
    const user_id = req.user.uid || req.user.userId || req.user.id || req.user.sub;
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let userCheck = await client.query('SELECT id FROM users WHERE id = $1', [user_id]);
      if (userCheck.rowCount === 0) {
        // Fetch user info from user-service
        const userInfo = await fetchUserInfoFromUserService(user_id, token);
        if (!userInfo) {
          console.error('User info not found for user_id:', user_id);
          throw new Error('User does not exist in user-service');
        }
        // Use username if available, else fallback to name
        const username = userInfo.username || userInfo.name || null;
        console.log('Attempting to insert user:', { user_id, email: userInfo.email, username });
        try {
          await client.query(
            'INSERT INTO users (id, email, username) VALUES ($1, $2, $3)',
            [user_id, userInfo.email, username]
          );
          const check = await client.query('SELECT * FROM users WHERE id = $1', [user_id]);
          console.log('User in DB after insert:', check.rows[0]);
        } catch (err) {
          console.error('User insert error:', err);
          throw err;
        }
      } else {
        // Optionally update user info
        const userInfo = await fetchUserInfoFromUserService(user_id, token);
        if (userInfo) {
          const username = userInfo.username || userInfo.name || null;
          console.log('Attempting to update user:', { user_id, email: userInfo.email, username });
          try {
            await client.query(
              'UPDATE users SET email = $2, username = $3 WHERE id = $1',
              [user_id, userInfo.email, username]
            );
            const check = await client.query('SELECT * FROM users WHERE id = $1', [user_id]);
            console.log('User in DB after update:', check.rows[0]);
          } catch (err) {
            console.error('User update error:', err);
            throw err;
          }
        }
      }
      // Now create the shop
      const shop = await ShopService.createShop({ ...req.body, user_id }, client);
      await client.query('COMMIT');
      res.status(201).json({ status: 'success', data: shop });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
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
      // Optionally, only allow update if req.user.uid matches shop.user_id
      const shop = await ShopService.updateShop(req.params.id, req.body);
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