CREATE DATABASE IF NOT EXISTS finance_dashboard;
USE finance_dashboard;

CREATE TABLE IF NOT EXISTS banks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bank_id INT NOT NULL,
  account_number_masked VARCHAR(20),
  account_type ENUM('savings','current','credit_card') DEFAULT 'savings',
  FOREIGN KEY (bank_id) REFERENCES banks(id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  account_id INT NOT NULL,
  txn_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  txn_type ENUM('debit','credit') NOT NULL,
  raw_description VARCHAR(255),
  merchant_normalized VARCHAR(120),
  category VARCHAR(60),
  FOREIGN KEY (account_id) REFERENCES accounts(id),
  INDEX idx_merchant_amount (merchant_normalized, amount),
  INDEX idx_account_date (account_id, txn_date)
);

CREATE TABLE IF NOT EXISTS recurring_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  merchant_normalized VARCHAR(120),
  avg_amount DECIMAL(12,2),
  interval_days INT,
  confidence DECIMAL(3,2),
  label VARCHAR(60),
  last_seen DATE
);

INSERT IGNORE INTO banks (name) VALUES ('SBI'), ('HDFC'), ('ICICI'), ('Axis');
