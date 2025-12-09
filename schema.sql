-- Schema proporcionado por el usuario (adaptado)

CREATE TABLE producto(
  id_producto SERIAL PRIMARY KEY,
  nombre VARCHAR(50),
  categoria VARCHAR(50),
  stock INT,
  min_stock INT DEFAULT 0,
  precio_unit DECIMAL(10,2)
);

CREATE TABLE locale(
  id_local SERIAL PRIMARY KEY,
  nombre VARCHAR(50),
  direccion VARCHAR(50)
);

CREATE TABLE almacenado_en(
  id_local INT,
  id_producto INT,
  PRIMARY KEY (id_local, id_producto),
  FOREIGN KEY (id_local) REFERENCES locale(id_local),
  FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
);

CREATE TABLE usuario (
  id_usuario SERIAL PRIMARY KEY,
  nombres VARCHAR(50),
  apellidos VARCHAR(50),
  name_user VARCHAR(50), 
  contrasena VARCHAR(255),
  dni VARCHAR(50),
  id_locale_usuario INT,
  FOREIGN KEY (id_locale_usuario) REFERENCES locale(id_local)
);

CREATE TABLE cliente (
  id_usuario_cliente INT PRIMARY KEY,
  telefono VARCHAR(9),
  correo VARCHAR(50),
  direccion VARCHAR(50),
  FOREIGN KEY (id_usuario_cliente) REFERENCES usuario(id_usuario)
);

CREATE TABLE carrito(
  id_carrito SERIAL PRIMARY KEY,
  estado VARCHAR(50),
  id_cliente INT,
  FOREIGN KEY (id_cliente) REFERENCES cliente(id_usuario_cliente)
);

CREATE TABLE detalle_carrito(
  id_detalle_carrito SERIAL PRIMARY KEY,
  cantidad INT,
  id_carrito INT,
  id_producto INT,
  FOREIGN KEY (id_carrito) REFERENCES carrito(id_carrito),
  FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
);

CREATE TABLE empleado(
  id_usuario_empleado INT PRIMARY KEY,
  fecha_ingreso DATE,
  horario VARCHAR(50),
  cargo VARCHAR(50),
  FOREIGN KEY (id_usuario_empleado) REFERENCES usuario(id_usuario)
);

CREATE TABLE boleta(
  id_boleta SERIAL PRIMARY KEY,
  metodo_pago VARCHAR(50),
  fecha_emision DATE,
  total DECIMAL(10,2),
  id_empleado_boleta INT,
  id_cliente_boleta INT,
  FOREIGN KEY (id_empleado_boleta) REFERENCES empleado(id_usuario_empleado),
  FOREIGN KEY (id_cliente_boleta) REFERENCES cliente(id_usuario_cliente)
);

CREATE TABLE detalle_boleta(
  id_detalle_boleta SERIAL PRIMARY KEY,
  sub_total DECIMAL(10,2),
  cantidad INT,
  id_boleta INT,
  id_producto INT,
  FOREIGN KEY (id_boleta) REFERENCES boleta(id_boleta),
  FOREIGN KEY (id_producto) REFERENCES producto (id_producto)
);

CREATE TABLE administrador(
  id_usuario_admin INT PRIMARY KEY,
  area_gestion VARCHAR(50),
  nivel_acceso INT,
  FOREIGN KEY (id_usuario_admin) REFERENCES usuario(id_usuario)
);

CREATE TABLE reporte(
  id_reporte SERIAL PRIMARY KEY,
  periodo VARCHAR(50),
  fecha_generacion DATE,
  id_admin_reporte INT,
  FOREIGN KEY (id_admin_reporte) REFERENCES administrador(id_usuario_admin)
);

CREATE TABLE contiene(
  id_reporte INT,
  id_boleta INT,
  PRIMARY KEY (id_reporte, id_boleta),
  FOREIGN KEY (id_reporte) REFERENCES reporte(id_reporte),
  FOREIGN KEY (id_boleta) REFERENCES boleta(id_boleta)
);
