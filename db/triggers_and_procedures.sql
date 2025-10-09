-- Procedimientos y triggers para ventas, actualizacion de stock y notificaciones

-- 1) Función process_sale: procesa una venta atómica
-- p_items: JSON array [{"id_producto":1,"cantidad":2,"precio_unit":1.5}, ...]
CREATE OR REPLACE FUNCTION process_sale(
  p_metodo_pago VARCHAR,
  p_id_empleado INT,
  p_id_cliente INT,
  p_items JSON
) RETURNS JSON AS $$
DECLARE
  v_total NUMERIC := 0;
  v_boleta_id INT;
  item JSON;
  product_id INT;
  qty INT;
  price NUMERIC;
  new_stock INT;
  rec RECORD;
BEGIN
  -- validar y calcular total, bloqueando filas para evitar race conditions
  FOR item IN SELECT * FROM json_array_elements(p_items) LOOP
    product_id := (item->>'id_producto')::INT;
    qty := (item->>'cantidad')::INT;
    price := COALESCE((item->>'precio_unit')::NUMERIC, (SELECT precio_unit FROM producto WHERE id_producto = product_id));
    IF price IS NULL THEN
      RAISE EXCEPTION 'Producto % no tiene precio', product_id;
    END IF;
    SELECT stock INTO new_stock FROM producto WHERE id_producto = product_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto % no existe', product_id;
    END IF;
    IF new_stock < qty THEN
      RAISE EXCEPTION 'Stock insuficiente para producto % (solicitado %, disponible %)', product_id, qty, new_stock;
    END IF;
    v_total := v_total + (qty * price);
  END LOOP;

  -- insertar boleta
  INSERT INTO boleta (metodo_pago, fecha_emision, total, id_empleado_boleta, id_cliente_boleta)
  VALUES (p_metodo_pago, NOW(), v_total, p_id_empleado, p_id_cliente)
  RETURNING id_boleta INTO v_boleta_id;

  -- insertar detalles y actualizar stock
  FOR item IN SELECT * FROM json_array_elements(p_items) LOOP
    product_id := (item->>'id_producto')::INT;
    qty := (item->>'cantidad')::INT;
    price := COALESCE((item->>'precio_unit')::NUMERIC, (SELECT precio_unit FROM producto WHERE id_producto = product_id));
    INSERT INTO detalle_boleta (sub_total, cantidad, id_boleta, id_producto)
      VALUES (qty * price, qty, v_boleta_id, product_id);

    UPDATE producto
    SET stock = stock - qty
    WHERE id_producto = product_id
    RETURNING stock INTO new_stock;

    -- Notificar cambios
    PERFORM pg_notify('stock_updated', json_build_object('productId', product_id, 'stock', new_stock)::text);

    SELECT min_stock INTO rec FROM producto WHERE id_producto = product_id;
    IF new_stock <= COALESCE(rec.min_stock, 0) THEN
      PERFORM pg_notify('stock_alert', json_build_object('productId', product_id, 'stock', new_stock, 'min_stock', rec.min_stock)::text);
    END IF;
  END LOOP;

  RETURN json_build_object('id_boleta', v_boleta_id, 'total', v_total);
END;
$$ LANGUAGE plpgsql;

-- 2) Trigger function para notificar cambios cuando stock se actualiza manualmente
CREATE OR REPLACE FUNCTION fn_notify_stock_change() RETURNS trigger AS $$
BEGIN
  IF NEW.stock IS DISTINCT FROM OLD.stock THEN
    PERFORM pg_notify('stock_updated', json_build_object('productId', NEW.id_producto, 'stock', NEW.stock)::text);
    IF NEW.stock <= COALESCE(NEW.min_stock,0) AND OLD.stock > COALESCE(NEW.min_stock,0) THEN
      PERFORM pg_notify('stock_alert', json_build_object('productId', NEW.id_producto, 'stock', NEW.stock, 'min_stock', NEW.min_stock)::text);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_stock_change ON producto;
CREATE TRIGGER trg_notify_stock_change
AFTER UPDATE ON producto
FOR EACH ROW
WHEN (OLD.stock IS DISTINCT FROM NEW.stock)
EXECUTE PROCEDURE fn_notify_stock_change();
