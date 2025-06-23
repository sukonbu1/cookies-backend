-- =============================================
-- DATABASE SCHEMA CREATION FOR POSTGRESQL
-- =============================================

-- Create databases
CREATE DATABASE user_service_db;
CREATE DATABASE post_service_db;
CREATE DATABASE recipe_service_db;
CREATE DATABASE follow_service_db;
CREATE DATABASE tag_service_db;
CREATE DATABASE shop_service_db;
CREATE DATABASE content_moderation_db;

-- =============================================
-- USER SERVICE DATABASE
-- =============================================
-- Connect to user_service_db and run the following:

-- Users table (main)
CREATE TABLE Users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    bio TEXT,
    avatar_url VARCHAR(255),
    cover_photo_url VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    country VARCHAR(100),
    city VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    is_chef BOOLEAN DEFAULT FALSE,
    followers_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    posts_count INT DEFAULT 0,
    total_likes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'banned')) DEFAULT 'active',
    notification_settings JSONB
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON Users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- UserWallet table
CREATE TABLE UserWallet (
    wallet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    balance DECIMAL(12,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    UNIQUE (user_id)
);

CREATE TRIGGER update_userwallet_updated_at BEFORE UPDATE ON UserWallet
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- WalletTransactions table
CREATE TABLE WalletTransactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('deposit', 'withdrawal', 'recipe_purchase', 'recipe_sale', 'product_purchase', 'product_sale', 'refund')) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
    reference_id UUID,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES UserWallet(wallet_id) ON DELETE CASCADE
);

CREATE INDEX idx_wallet_type_status ON WalletTransactions (wallet_id, type, status);
CREATE TRIGGER update_wallettransactions_updated_at BEFORE UPDATE ON WalletTransactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- UserBadges table
CREATE TABLE UserBadges (
    badge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    badge_type VARCHAR(50) NOT NULL,
    badge_name VARCHAR(100) NOT NULL,
    badge_icon VARCHAR(255),
    description TEXT,
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_user_badge_type ON UserBadges (user_id, badge_type);

-- ShippingAddresses table
CREATE TABLE ShippingAddresses (
    address_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    recipient_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    address_type VARCHAR(10) CHECK (address_type IN ('home', 'work', 'other')) DEFAULT 'home',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_user_addresses ON ShippingAddresses (user_id);
CREATE TRIGGER update_shippingaddresses_updated_at BEFORE UPDATE ON ShippingAddresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Notifications table
CREATE TABLE Notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type VARCHAR(20) CHECK (type IN ('like', 'comment', 'follow', 'share', 'mention', 'purchase', 'order', 'system')) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    reference_type VARCHAR(50),
    reference_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_user_notifications ON Notifications (user_id, type, is_read, created_at);

-- =============================================
-- POST SERVICE DATABASE
-- =============================================
-- Connect to post_service_db and run the following:

-- Posts table (main)
CREATE TABLE Posts (
    post_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    content_type VARCHAR(10) CHECK (content_type IN ('video', 'image', 'text', 'multi')) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    cooking_time INT,
    difficulty_level VARCHAR(10) CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')),
    serving_size INT,
    has_recipe BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    premium_price DECIMAL(10,2),
    views_count INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(10) CHECK (status IN ('published', 'draft', 'archived', 'reported', 'removed')) DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_user_posts ON Posts (user_id);
CREATE INDEX idx_content_type ON Posts (content_type);
CREATE INDEX idx_created_at ON Posts (created_at);
CREATE INDEX idx_status ON Posts (status);
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON Posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PostMedia table
CREATE TABLE PostMedia (
    media_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
    media_type VARCHAR(10) CHECK (media_type IN ('video', 'image')) NOT NULL,
    media_url VARCHAR(255) NOT NULL,
    thumbnail_url VARCHAR(255),
    duration INT,
    width INT,
    height INT,
    file_size INT,
    position INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES Posts(post_id) ON DELETE CASCADE
);

CREATE INDEX idx_post_media ON PostMedia (post_id);

-- Comments table
CREATE TABLE Comments (
    comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
    user_id UUID NOT NULL,
    parent_comment_id UUID,
    content TEXT NOT NULL,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(10) CHECK (status IN ('active', 'deleted', 'hidden')) DEFAULT 'active',
    FOREIGN KEY (post_id) REFERENCES Posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES Comments(comment_id) ON DELETE CASCADE
);

CREATE INDEX idx_post_comments ON Comments (post_id);
CREATE INDEX idx_user_comments ON Comments (user_id);
CREATE INDEX idx_parent_comments ON Comments (parent_comment_id);
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON Comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Likes table
CREATE TABLE Likes (
    like_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    content_type VARCHAR(10) CHECK (content_type IN ('post', 'comment')) NOT NULL,
    content_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, content_type, content_id)
);

CREATE INDEX idx_content_likes ON Likes (content_type, content_id);

-- Shares table
CREATE TABLE Shares (
    share_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
    user_id UUID NOT NULL,
    share_platform VARCHAR(20) CHECK (share_platform IN ('app', 'facebook', 'twitter', 'instagram', 'whatsapp', 'other')) DEFAULT 'app',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES Posts(post_id) ON DELETE CASCADE
);

CREATE INDEX idx_post_shares ON Shares (post_id);
CREATE INDEX idx_user_shares ON Shares (user_id);

-- =============================================
-- RECIPE SERVICE DATABASE
-- =============================================
-- Connect to recipe_service_db and run the following:

-- Recipes table (main)
CREATE TABLE Recipes (
    recipe_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    cuisine_type VARCHAR(100),
    meal_type VARCHAR(15) CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'dessert', 'snack', 'appetizer')),
    dietary_info TEXT[] CHECK (dietary_info <@ ARRAY['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'low-carb', 'keto']),
    calories INT,
    protein DECIMAL(5,2),
    carbs DECIMAL(5,2),
    fat DECIMAL(5,2),
    preparation_time INT,
    cooking_time INT,
    total_time INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_post_recipe ON Recipes (post_id);
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON Recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RecipeIngredients table
CREATE TABLE RecipeIngredients (
    ingredient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,2),
    unit VARCHAR(50),
    note TEXT,
    is_optional BOOLEAN DEFAULT FALSE,
    position INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES Recipes(recipe_id) ON DELETE CASCADE
);

CREATE INDEX idx_recipe_ingredients ON RecipeIngredients (recipe_id);

-- RecipeSteps table
CREATE TABLE RecipeSteps (
    step_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL,
    step_number INT NOT NULL,
    description TEXT NOT NULL,
    media_url VARCHAR(255),
    duration INT,
    tip TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES Recipes(recipe_id) ON DELETE CASCADE
);

CREATE INDEX idx_recipe_steps ON RecipeSteps (recipe_id, step_number);

-- RecipePurchases table
CREATE TABLE RecipePurchases (
    purchase_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    recipe_id UUID NOT NULL,
    post_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(15) CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
    transaction_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES Recipes(recipe_id) ON DELETE CASCADE,
    UNIQUE (user_id, recipe_id)
);

CREATE INDEX idx_user_purchases ON RecipePurchases (user_id);
CREATE INDEX idx_recipe_purchases ON RecipePurchases (recipe_id);

-- =============================================
-- FOLLOW SERVICE DATABASE
-- =============================================
-- Connect to follow_service_db and run the following:

-- UserFollowers table (main)
CREATE TABLE UserFollowers (
    follow_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL,
    following_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (follower_id, following_id)
);

CREATE INDEX idx_follower ON UserFollowers (follower_id);
CREATE INDEX idx_following ON UserFollowers (following_id);

-- =============================================
-- TAG SERVICE DATABASE
-- =============================================
-- Connect to tag_service_db and run the following:

-- Tags table (main)
CREATE TABLE Tags (
    tag_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    post_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (name),
    UNIQUE (slug)
);

-- PostTags table
CREATE TABLE PostTags (
    post_tag_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
    tag_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tag_id) REFERENCES Tags(tag_id) ON DELETE CASCADE,
    UNIQUE (post_id, tag_id)
);

CREATE INDEX idx_post_tags ON PostTags (post_id);
CREATE INDEX idx_tag_posts ON PostTags (tag_id);

-- =============================================
-- SHOP SERVICE DATABASE
-- =============================================
-- Connect to shop_service_db and run the following:

-- Shops table (main)
CREATE TABLE Shops (
    shop_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url VARCHAR(255),
    cover_photo_url VARCHAR(255),
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    business_registration VARCHAR(100),
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(15) CHECK (status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_shop ON Shops (user_id);
CREATE INDEX idx_shop_status ON Shops (status);
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON Shops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ProductCategories table
CREATE TABLE ProductCategories (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(255),
    image_url VARCHAR(255),
    level INT DEFAULT 0,
    position INT DEFAULT 0,
    product_count INT DEFAULT 0,
    status VARCHAR(15) CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES ProductCategories(category_id) ON DELETE SET NULL,
    UNIQUE (slug)
);

CREATE INDEX idx_parent_category ON ProductCategories (parent_id);
CREATE TRIGGER update_productcategories_updated_at BEFORE UPDATE ON ProductCategories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Products table
CREATE TABLE Products (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    stock_quantity INT DEFAULT 0,
    sku VARCHAR(100),
    weight DECIMAL(10,2),
    weight_unit VARCHAR(10),
    dimensions VARCHAR(50),
    condition_status VARCHAR(15) CHECK (condition_status IN ('new', 'used', 'refurbished')) DEFAULT 'new',
    is_featured BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    total_sales INT DEFAULT 0,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'out_of_stock', 'discontinued')) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES Shops(shop_id) ON DELETE CASCADE
);

CREATE INDEX idx_shop_products ON Products (shop_id);
CREATE INDEX idx_product_slug ON Products (slug);
CREATE INDEX idx_product_status ON Products (status);
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON Products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ProductImages table
CREATE TABLE ProductImages (
    image_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    thumbnail_url VARCHAR(255),
    alt_text VARCHAR(255),
    position INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE
);

CREATE INDEX idx_product_images ON ProductImages (product_id);

-- ProductCategorization table
CREATE TABLE ProductCategorization (
    product_category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    category_id UUID NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES ProductCategories(category_id) ON DELETE CASCADE,
    UNIQUE (product_id, category_id)
);

CREATE INDEX idx_category_products ON ProductCategorization (category_id);

-- ProductReviews table
CREATE TABLE ProductReviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    user_id UUID NOT NULL,
    order_item_id UUID,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT,
    likes_count INT DEFAULT 0,
    media_urls JSONB,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(15) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE,
    UNIQUE (user_id, product_id)
);

CREATE INDEX idx_product_reviews ON ProductReviews (product_id);
CREATE INDEX idx_user_reviews ON ProductReviews (user_id);
CREATE TRIGGER update_productreviews_updated_at BEFORE UPDATE ON ProductReviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Orders table
CREATE TABLE Orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    order_number VARCHAR(50) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    shipping_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50),
    payment_status VARCHAR(15) CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
    shipping_method VARCHAR(100),
    shipping_status VARCHAR(15) CHECK (shipping_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending',
    order_status VARCHAR(15) CHECK (order_status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')) DEFAULT 'pending',
    tracking_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    UNIQUE (order_number)
);

CREATE INDEX idx_user_orders ON Orders (user_id);
CREATE INDEX idx_order_status ON Orders (order_status);
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON Orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- OrderItems table
CREATE TABLE OrderItems (
    order_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    product_id UUID NOT NULL,
    shop_id UUID NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(15) CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE RESTRICT,
    FOREIGN KEY (shop_id) REFERENCES Shops(shop_id) ON DELETE RESTRICT
);

CREATE INDEX idx_order_items ON OrderItems (order_id);
CREATE INDEX idx_product_orders ON OrderItems (product_id);
CREATE INDEX idx_shop_orders ON OrderItems (shop_id);
CREATE TRIGGER update_orderitems_updated_at BEFORE UPDATE ON OrderItems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- CONTENT MODERATION SERVICE DATABASE
-- =============================================
-- Connect to content_moderation_db and run the following:

-- ReportedContent table (main)
CREATE TABLE ReportedContent (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL,
    content_type VARCHAR(15) CHECK (content_type IN ('post', 'comment', 'user', 'recipe', 'product', 'shop')) NOT NULL,
    content_id UUID NOT NULL,
    reason VARCHAR(15) CHECK (reason IN ('spam', 'inappropriate', 'copyright', 'offensive', 'scam', 'other')) NOT NULL,
    description TEXT,
    status VARCHAR(15) CHECK (status IN ('pending', 'reviewed', 'actioned', 'rejected')) DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reporter_reports ON ReportedContent (reporter_id);
CREATE INDEX idx_content_reports ON ReportedContent (content_type, content_id);
CREATE INDEX idx_report_status ON ReportedContent (status);