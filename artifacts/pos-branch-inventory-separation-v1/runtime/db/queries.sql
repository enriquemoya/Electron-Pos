-- Optional validation queries once runtime credentials are available.
SELECT * FROM inventory_stock WHERE branch_id = '<BRANCH_ID>' AND product_id = '<PRODUCT_ID_1>';
SELECT * FROM inventory_movement WHERE branch_id = '<BRANCH_ID>' AND product_id = '<PRODUCT_ID_1>' ORDER BY created_at DESC LIMIT 20;
