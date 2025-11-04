-- Migration script for order tracking with geolocation
-- Creates tables for tracking order history, real-time delivery, and notifications
-- Compatible with SQLite

-- Table 1: Order Status History (with geolocation)
CREATE TABLE IF NOT EXISTS order_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    changed_by INTEGER,
    notes TEXT,
    latitude REAL,
    longitude REAL,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for order_status_history
CREATE INDEX IF NOT EXISTS idx_osh_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_osh_created_at ON order_status_history(created_at);
CREATE INDEX IF NOT EXISTS idx_osh_status ON order_status_history(status);

-- Table 2: Delivery Tracking (real-time tracking)
CREATE TABLE IF NOT EXISTS delivery_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL UNIQUE,
    
    -- Current location
    current_latitude REAL,
    current_longitude REAL,
    current_address TEXT,
    
    -- Destination
    destination_latitude REAL,
    destination_longitude REAL,
    destination_address TEXT,
    
    -- Driver information
    driver_id INTEGER,
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    vehicle_info VARCHAR(100),
    
    -- Estimates
    distance_km REAL,
    time_minutes INTEGER,
    eta DATETIME,
    
    -- Status
    is_active BOOLEAN DEFAULT 1,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for delivery_tracking
CREATE INDEX IF NOT EXISTS idx_dt_order_id ON delivery_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_dt_is_active ON delivery_tracking(is_active);
CREATE INDEX IF NOT EXISTS idx_dt_last_updated ON delivery_tracking(last_updated);

-- Table 3: Order Notifications
CREATE TABLE IF NOT EXISTS order_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50),
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Indexes for order_notifications
CREATE INDEX IF NOT EXISTS idx_on_user_id ON order_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_on_order_id ON order_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_on_is_read ON order_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_on_created_at ON order_notifications(created_at);
