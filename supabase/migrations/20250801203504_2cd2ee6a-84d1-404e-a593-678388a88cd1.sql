-- Reset the payments table to only store processed receipts data
DELETE FROM payments;

-- Update the payments table structure to better separate tracking from actual payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_file_path TEXT;