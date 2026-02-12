CREATE SEQUENCE IF NOT EXISTS order_number_seq AS INT;

ALTER TABLE online_orders ADD COLUMN IF NOT EXISTS order_number INT;
ALTER TABLE online_orders ADD COLUMN IF NOT EXISTS order_code TEXT;

WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY created_at ASC, id ASC) AS rn
  FROM online_orders
)
UPDATE online_orders o
SET order_number = ordered.rn,
    order_code = 'ONL-' || LPAD(ordered.rn::text, 6, '0')
FROM ordered
WHERE o.id = ordered.id
  AND (o.order_number IS NULL OR o.order_code IS NULL);

DO $$
DECLARE max_num INT;
BEGIN
  SELECT COALESCE(MAX(order_number), 0) INTO max_num FROM online_orders;
  IF max_num < 1 THEN
    PERFORM setval('order_number_seq', 1, false);
  ELSE
    PERFORM setval('order_number_seq', max_num);
  END IF;
END $$;

ALTER TABLE online_orders ALTER COLUMN order_number SET DEFAULT nextval('order_number_seq'::regclass);
ALTER TABLE online_orders ALTER COLUMN order_number SET NOT NULL;
ALTER TABLE online_orders ALTER COLUMN order_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS online_orders_order_number_key ON online_orders(order_number);
CREATE UNIQUE INDEX IF NOT EXISTS online_orders_order_code_key ON online_orders(order_code);
