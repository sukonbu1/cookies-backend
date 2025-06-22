-- =============================================
-- PRODUCT SERVICE DATABASE SETUP
-- =============================================

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create Shops table (if not exists)
CREATE TABLE IF NOT EXISTS Shops (
    shop_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL, -- Using VARCHAR for user_id to match your requirement
    name VARCHAR(255) NOT NULL,
    description TEXT,
    contact_email VARCHAR(255),
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

-- Create ProductCategories table
CREATE TABLE IF NOT EXISTS ProductCategories (
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

-- Create Products table
CREATE TABLE IF NOT EXISTS Products (
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

-- Create ProductImages table
CREATE TABLE IF NOT EXISTS ProductImages (
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

-- Create ProductVariants table
CREATE TABLE IF NOT EXISTS ProductVariants (
    variant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2),
    stock_quantity INT DEFAULT 0,
    weight DECIMAL(10,2),
    weight_unit VARCHAR(10),
    dimensions VARCHAR(50),
    color VARCHAR(50),
    size VARCHAR(50),
    material VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE
);

-- Create ProductCategorization table
CREATE TABLE IF NOT EXISTS ProductCategorization (
    product_category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    category_id UUID NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES ProductCategories(category_id) ON DELETE CASCADE,
    UNIQUE (product_id, category_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_shop ON Shops (user_id);
CREATE INDEX IF NOT EXISTS idx_shop_status ON Shops (status);
CREATE INDEX IF NOT EXISTS idx_parent_category ON ProductCategories (parent_id);
CREATE INDEX IF NOT EXISTS idx_shop_products ON Products (shop_id);
CREATE INDEX IF NOT EXISTS idx_product_slug ON Products (slug);
CREATE INDEX IF NOT EXISTS idx_product_status ON Products (status);
CREATE INDEX IF NOT EXISTS idx_product_images ON ProductImages (product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants ON ProductVariants (product_id);
CREATE INDEX IF NOT EXISTS idx_category_products ON ProductCategorization (category_id);

-- Create triggers
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON Shops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productcategories_updated_at BEFORE UPDATE ON ProductCategories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON Products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productvariants_updated_at BEFORE UPDATE ON ProductVariants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data
INSERT INTO Shops (shop_id, user_id, name, description, status) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 's2xuRCsmU5WHqWIXeFlAc7TkQrF2', 'Bakery Delights', 'Fresh baked goods and pastries', 'active')
ON CONFLICT (shop_id) DO NOTHING;

INSERT INTO ProductCategories (category_id, name, slug, description, status) VALUES 
('11111111-1111-1111-1111-111111111111', 'Cookies & Biscuits', 'cookies-biscuits', 'Fresh baked cookies and biscuits', 'active'),
('22222222-2222-2222-2222-222222222222', 'Cakes & Cupcakes', 'cakes-cupcakes', 'Delicious cakes and cupcakes', 'active'),
('33333333-3333-3333-3333-333333333333', 'Baking Mixes', 'baking-mixes', 'Baking mixes and ingredients', 'active')
ON CONFLICT (category_id) DO NOTHING; 