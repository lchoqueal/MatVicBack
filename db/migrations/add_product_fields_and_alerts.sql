-- Agrega columnas descripcion y codigo (sku) a producto si no existen, y crea tabla alerta
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='producto' AND column_name='descripcion') THEN
    ALTER TABLE producto ADD COLUMN descripcion TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='producto' AND column_name='codigo') THEN
    ALTER TABLE producto ADD COLUMN codigo VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='producto' AND column_name='min_stock') THEN
    ALTER TABLE producto ADD COLUMN min_stock INT DEFAULT 0;
  END IF;
  -- crear tabla alerta para persistir alertas de stock
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='alerta') THEN
    CREATE TABLE alerta (
      id_alerta SERIAL PRIMARY KEY,
      id_producto INT NOT NULL REFERENCES producto(id_producto),
      tipo VARCHAR(50) NOT NULL,
      stock_actual INT NOT NULL,
      min_stock INT,
      mensaje TEXT,
      creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
      atendido BOOLEAN DEFAULT FALSE
    );
  END IF;
END$$;
