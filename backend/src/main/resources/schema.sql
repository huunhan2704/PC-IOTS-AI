-- ==============================================================================
-- ĐỒ ÁN TỐT NGHIỆP: ỨNG DỤNG IOTS VÀ AI VÀO HỆ THỐNG WEB BÁN LINH KIỆN MÁY TÍNH
-- Tác giả: Trần Hữu Nhân - HCMUNRE - GVHD: ThS. Nguyễn Thanh Truyền
-- Database: PostgreSQL 15+
-- ==============================================================================

-- 1. USERS & ROLES
CREATE TABLE IF NOT EXISTS users (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(50) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    phone           VARCHAR(20),
    role            VARCHAR(30) NOT NULL DEFAULT 'ROLE_CUSTOMER'
                    CHECK (role IN ('ROLE_CUSTOMER', 'ROLE_ADMIN', 'ROLE_TECHNICIAN')),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(100) NOT NULL UNIQUE,
    icon            VARCHAR(50),
    description     TEXT,
    display_order   INT NOT NULL DEFAULT 0
);

-- 3. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id              BIGSERIAL PRIMARY KEY,
    category_id     BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) NOT NULL UNIQUE,
    brand           VARCHAR(100) NOT NULL,
    price           DECIMAL(15, 2) NOT NULL,
    original_price  DECIMAL(15, 2),
    stock_quantity  INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    warranty_months INT NOT NULL DEFAULT 12,
    image_url       VARCHAR(500),
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    version         BIGINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. PRODUCT IMAGES (nhiều ảnh trên 1 sản phẩm)
CREATE TABLE IF NOT EXISTS product_images (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url       VARCHAR(500) NOT NULL,
    sort_order      INT NOT NULL DEFAULT 0
);

-- 5. PRODUCT SPECS (Phục vụ quy tắc kiểm tra tương thích PC Builder BR01 - BR06)
CREATE TABLE IF NOT EXISTS product_specs (
    id                     BIGSERIAL PRIMARY KEY,
    product_id             BIGINT NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    socket                 VARCHAR(50),
    ram_generation         VARCHAR(50),
    ram_bus                INT,
    form_factor            VARCHAR(50),
    tdp                    INT NOT NULL DEFAULT 0,
    psu_wattage            INT,
    psu_efficiency         VARCHAR(50),
    vram                   INT,
    storage_interface      VARCHAR(50),
    cooling_type           VARCHAR(50),
    dimensions             VARCHAR(100),
    cooler_tdp_rating      INT,
    gpu_length_mm          INT,
    max_gpu_length_mm      INT,
    supported_form_factors VARCHAR(100),
    cores                  INT,
    threads                INT,
    base_clock             VARCHAR(30),
    boost_clock            VARCHAR(30),
    capacity_gb            INT,
    technical_json         TEXT
);

-- 6. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating          INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 7. COUPONS
CREATE TABLE IF NOT EXISTS coupons (
    code            VARCHAR(50) PRIMARY KEY,
    description     VARCHAR(255) NOT NULL,
    discount_type   VARCHAR(20) NOT NULL CHECK (discount_type IN ('PERCENT', 'FIXED', 'FREESHIP')),
    discount_value  DECIMAL(15, 2) NOT NULL,
    max_discount    DECIMAL(15, 2),
    min_order       DECIMAL(15, 2) NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

-- 8. ORDERS
CREATE TABLE IF NOT EXISTS orders (
    id              BIGSERIAL PRIMARY KEY,
    order_code      VARCHAR(50) NOT NULL UNIQUE,
    user_id         BIGINT REFERENCES users(id) ON DELETE SET NULL,
    customer_name   VARCHAR(150) NOT NULL,
    phone           VARCHAR(20) NOT NULL,
    shipping_address TEXT NOT NULL,
    city            VARCHAR(100) NOT NULL,
    payment_method  VARCHAR(30) NOT NULL CHECK (payment_method IN ('COD', 'BANK_TRANSFER_QR')),
    payment_status  VARCHAR(30) NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PAID', 'REFUNDED')),
    order_status    VARCHAR(30) NOT NULL DEFAULT 'CHO_XAC_NHAN'
                    CHECK (order_status IN ('CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DANG_GIAO', 'DA_GIAO', 'DA_HUY')),
    total_amount    DECIMAL(15, 2) NOT NULL,
    discount_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    coupon_code     VARCHAR(50),
    shipping_fee    DECIMAL(15, 2) NOT NULL DEFAULT 0,
    final_amount    DECIMAL(15, 2) NOT NULL,
    note            TEXT,
    cancel_reason   TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 9. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
    id              BIGSERIAL PRIMARY KEY,
    order_id        BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      BIGINT REFERENCES products(id) ON DELETE SET NULL,
    product_name    VARCHAR(255) NOT NULL,
    unit_price      DECIMAL(15, 2) NOT NULL,
    quantity        INT NOT NULL CHECK (quantity > 0),
    subtotal        DECIMAL(15, 2) NOT NULL
);

-- 10. IOT DEVICES
CREATE TABLE IF NOT EXISTS iot_devices (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT REFERENCES users(id) ON DELETE CASCADE,
    device_code         VARCHAR(50) NOT NULL UNIQUE,
    device_name         VARCHAR(150) NOT NULL,
    mac_address         VARCHAR(50),
    status              VARCHAR(30) NOT NULL DEFAULT 'OFFLINE' CHECK (status IN ('ONLINE', 'OFFLINE', 'WARNING')),
    esp32_ip            VARCHAR(50),
    room_location       VARCHAR(150),
    last_ping           TIMESTAMP,
    current_scenario    VARCHAR(30) DEFAULT 'IDLE',
    current_cpu_id      BIGINT REFERENCES products(id) ON DELETE SET NULL,
    current_mainboard_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
    current_ram_id      BIGINT REFERENCES products(id) ON DELETE SET NULL,
    current_gpu_id      BIGINT REFERENCES products(id) ON DELETE SET NULL,
    current_psu_id      BIGINT REFERENCES products(id) ON DELETE SET NULL,
    current_cooler_id   BIGINT REFERENCES products(id) ON DELETE SET NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 11. TELEMETRY LOGS (Time-series data)
CREATE TABLE IF NOT EXISTS telemetry_logs (
    id                  BIGSERIAL PRIMARY KEY,
    device_id           BIGINT NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
    cpu_load            REAL NOT NULL,
    cpu_temp            REAL NOT NULL,
    cpu_clock_mhz       INT NOT NULL DEFAULT 3600,
    ram_usage           REAL NOT NULL,
    ram_used_gb         REAL NOT NULL,
    ram_total_gb        REAL NOT NULL DEFAULT 16.0,
    gpu_load            REAL NOT NULL,
    gpu_temp            REAL NOT NULL,
    fan_speed_rpm       INT NOT NULL,
    power_draw_w        INT NOT NULL DEFAULT 150,
    ambient_temp        REAL NOT NULL,
    ambient_humidity    REAL NOT NULL,
    status_flag         VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
    recorded_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 12. IOT ALERTS
CREATE TABLE IF NOT EXISTS iot_alerts (
    id                  BIGSERIAL PRIMARY KEY,
    device_id           BIGINT NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
    type                VARCHAR(50) NOT NULL,
    severity            VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    message             TEXT NOT NULL,
    value               REAL NOT NULL DEFAULT 0,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 13. AI RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id                          BIGSERIAL PRIMARY KEY,
    device_id                   BIGINT NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
    user_id                     BIGINT REFERENCES users(id) ON DELETE CASCADE,
    bottleneck_type             VARCHAR(50) NOT NULL,
    severity                    VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    diagnostic_text             TEXT NOT NULL,
    current_product_id          BIGINT REFERENCES products(id) ON DELETE SET NULL,
    recommended_product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    expected_performance_gain   VARCHAR(255),
    is_viewed                   BOOLEAN NOT NULL DEFAULT FALSE,
    is_applied                  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 14. PC BUILDS (Cấu hình PC Builder lưu lại)
CREATE TABLE IF NOT EXISTS pc_builds (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT REFERENCES users(id) ON DELETE CASCADE,
    build_name          VARCHAR(150) NOT NULL,
    cpu_id              BIGINT REFERENCES products(id) ON DELETE SET NULL,
    mainboard_id        BIGINT REFERENCES products(id) ON DELETE SET NULL,
    ram_id              BIGINT REFERENCES products(id) ON DELETE SET NULL,
    gpu_id              BIGINT REFERENCES products(id) ON DELETE SET NULL,
    storage_id          BIGINT REFERENCES products(id) ON DELETE SET NULL,
    psu_id              BIGINT REFERENCES products(id) ON DELETE SET NULL,
    cooler_id           BIGINT REFERENCES products(id) ON DELETE SET NULL,
    case_id             BIGINT REFERENCES products(id) ON DELETE SET NULL,
    total_price         DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_tdp           INT NOT NULL DEFAULT 0,
    recommended_psu     INT NOT NULL DEFAULT 0,
    is_compatible       BOOLEAN NOT NULL DEFAULT TRUE,
    compatibility_report TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 15. INVENTORY LOGS (Quản lý kho admin)
CREATE TABLE IF NOT EXISTS inventory_logs (
    id                  BIGSERIAL PRIMARY KEY,
    product_id          BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    admin_id            BIGINT REFERENCES users(id) ON DELETE SET NULL,
    quantity            INT NOT NULL,
    note                TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_specs_socket ON product_specs(socket);
CREATE INDEX IF NOT EXISTS idx_specs_ram_gen ON product_specs(ram_generation);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_code ON orders(order_code);
CREATE INDEX IF NOT EXISTS idx_telemetry_device_time ON telemetry_logs(device_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_rec_device ON ai_recommendations(device_id, created_at DESC);
