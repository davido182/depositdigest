
-- Create the RentFlow database
CREATE DATABASE IF NOT EXISTS rentflow_db;
USE rentflow_db;

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  unit VARCHAR(20),
  moveInDate DATE,
  leaseEndDate DATE,
  rentAmount DECIMAL(10,2) NOT NULL,
  depositAmount DECIMAL(10,2),
  status ENUM('active', 'inactive', 'late', 'notice') NOT NULL DEFAULT 'active',
  notes TEXT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  type ENUM('rent', 'deposit', 'fee', 'other') NOT NULL,
  method ENUM('cash', 'check', 'transfer', 'card', 'other') NOT NULL,
  status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL,
  notes TEXT,
  createdAt DATETIME NOT NULL,
  FOREIGN KEY (tenantId) REFERENCES tenants(id)
);

-- Create maintenance_requests table
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category ENUM('plumbing', 'electrical', 'heating', 'appliance', 'structural', 'other') NOT NULL,
  priority ENUM('emergency', 'high', 'medium', 'low') NOT NULL,
  status ENUM('pending', 'assigned', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  images JSON,
  assignedTo VARCHAR(100),
  notes TEXT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  completedAt DATETIME,
  FOREIGN KEY (tenantId) REFERENCES tenants(id)
);

-- Create indexes for better performance
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_payments_tenantId ON payments(tenantId);
CREATE INDEX idx_payments_date ON payments(date);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_maintenance_tenantId ON maintenance_requests(tenantId);
CREATE INDEX idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_priority ON maintenance_requests(priority);
