-- ==========================================
-- CREACIÓN DE BASE DE DATOS Y EXTENSIONES
-- ==========================================
DROP DATABASE IF EXISTS ecommerce_db;
CREATE DATABASE ecommerce_db ENCODING 'UTF8' LC_COLLATE='es_ES.UTF-8' LC_CTYPE='es_ES.UTF-8' TEMPLATE=template0;

\c ecommerce_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para búsqueda fuzzy (ILIKE avanzado)

-- ==========================================
-- TABLAS TRANSVERSALES Y SEGURIDAD
-- ==========================================
CREATE TABLE IF NOT EXISTS monedas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(3) UNIQUE NOT NULL, -- Ej: PEN, USD
    nombre VARCHAR(50) NOT NULL,
    simbolo VARCHAR(5) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
INSERT INTO monedas (codigo, nombre, simbolo) VALUES 
('PEN', 'Soles', 'S/'), ('USD', 'Dólares', '$');

CREATE TABLE IF NOT EXISTS tipo_cambio (
    id SERIAL PRIMARY KEY,
    moneda_origen_id INT REFERENCES monedas(id),
    moneda_destino_id INT REFERENCES monedas(id),
    tasa DECIMAL(10,4) NOT NULL CHECK (tasa > 0),
    fecha_registro DATE DEFAULT CURRENT_DATE
);
INSERT INTO tipo_cambio (moneda_origen_id, moneda_destino_id, tasa) VALUES (2, 1, 3.7200);

CREATE TABLE IF NOT EXISTS configuracion_sistema (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    tipo VARCHAR(20) DEFAULT 'STRING', -- STRING, INT, BOOLEAN, JSON
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
INSERT INTO configuracion_sistema (clave, valor, tipo) VALUES 
('IGV_PORCENTAJE', '18', 'INT'), 
('TIEMPO_RESERVA_MINUTOS', '15', 'INT');

CREATE TABLE IF NOT EXISTS seg_permisos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL, -- modulo.recurso.accion (ej. cat.productos.crear)
    descripcion VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
INSERT INTO seg_permisos (nombre) VALUES 
('cat.productos.ver'), ('cat.productos.crear'), ('cat.productos.editar'), ('cat.productos.eliminar'),
('inv.stock.ver'), ('inv.stock.ajustar'),
('ord.ordenes.ver'), ('ord.ordenes.editar_estado'),
('cli.clientes.ver'), ('cli.clientes.editar'),
('seg.usuarios.ver'), ('seg.usuarios.crear');

CREATE TABLE IF NOT EXISTS seg_roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
INSERT INTO seg_roles (nombre, descripcion) VALUES 
('SUPER_ADMIN', 'Acceso total al sistema'), 
('ADMIN_VENTAS', 'Gestión de ventas y clientes'),
('CLIENTE', 'Usuario final de la tienda');

CREATE TABLE IF NOT EXISTS seg_rol_permiso (
    rol_id INT REFERENCES seg_roles(id) ON DELETE CASCADE,
    permiso_id INT REFERENCES seg_permisos(id) ON DELETE CASCADE,
    PRIMARY KEY (rol_id, permiso_id)
);
-- Super admin tiene todos los permisos
INSERT INTO seg_rol_permiso (rol_id, permiso_id) 
SELECT 1, id FROM seg_permisos;
-- Admin Ventas
INSERT INTO seg_rol_permiso (rol_id, permiso_id) VALUES 
(2, 6), (2, 7), (2, 8), (2, 9), (2, 10);

CREATE TABLE IF NOT EXISTS seg_usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    correo VARCHAR(150) UNIQUE NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seg_usuario_rol (
    usuario_id UUID REFERENCES seg_usuarios(id) ON DELETE CASCADE,
    rol_id INT REFERENCES seg_roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (usuario_id, rol_id)
);

CREATE TABLE IF NOT EXISTS auditoria_registro (
    id BIGSERIAL PRIMARY KEY,
    tabla_afectada VARCHAR(50) NOT NULL,
    registro_id UUID NOT NULL,
    accion VARCHAR(20) NOT NULL CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE')),
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    usuario_ejecutor UUID REFERENCES seg_usuarios(id),
    fecha_accion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- CATÁLOGO DE PRODUCTOS
-- ==========================================
CREATE TABLE IF NOT EXISTS cat_categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
INSERT INTO cat_categorias (nombre, slug) VALUES 
('Electrónica', 'electronica'), ('Ropa y Accesorios', 'ropa-accesorios'), ('Hogar y Cocina', 'hogar-cocina');

CREATE TABLE IF NOT EXISTS cat_subcategorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    categoria_id UUID REFERENCES cat_categorias(id) ON DELETE RESTRICT,
    nombre VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    UNIQUE (categoria_id, slug),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
INSERT INTO cat_subcategorias (categoria_id, nombre, slug) VALUES 
((SELECT id FROM cat_categorias WHERE slug='electronica'), 'Smartphones', 'smartphones'),
((SELECT id FROM cat_categorias WHERE slug='electronica'), 'Laptops', 'laptops'),
((SELECT id FROM cat_categorias WHERE slug='ropa-accesorios'), 'Camisetas', 'camisetas'),
((SELECT id FROM cat_categorias WHERE slug='hogar-cocina'), 'Electrodomésticos', 'electrodomesticos');

CREATE TABLE IF NOT EXISTS cat_marcas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) UNIQUE NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
INSERT INTO cat_marcas (nombre) VALUES 
('TechNova'), ('StyleMax'), ('HomePro'), ('AppleSim'), ('SamsungSim');

CREATE TABLE IF NOT EXISTS cat_unidades_medida (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(50) NOT NULL, -- Unidad, Kilogramo, Litro, Metro
    abreviatura VARCHAR(10) NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);
INSERT INTO cat_unidades_medida (nombre, abreviatura) VALUES 
('Unidad', 'UND'), ('Kilogramo', 'KG'), ('Par', 'PAR');

CREATE TABLE IF NOT EXISTS cat_atributos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(50) NOT NULL, -- Color, Talla, Material
    tipo_valor VARCHAR(20) NOT NULL CHECK (tipo_valor IN ('TEXTO', 'NUMERO', 'COLOR')),
    activo BOOLEAN DEFAULT TRUE
);
INSERT INTO cat_atributos (nombre, tipo_valor) VALUES ('Color', 'COLOR'), ('Talla', 'TEXTO'), ('Almacenamiento', 'TEXTO');

CREATE TABLE IF NOT EXISTS cat_valores_atributo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    atributo_id UUID REFERENCES cat_atributos(id) ON DELETE CASCADE,
    valor VARCHAR(100) NOT NULL, -- Rojo, M, 128GB
    UNIQUE (atributo_id, valor)
);
INSERT INTO cat_valores_atributo (atributo_id, valor) VALUES 
((SELECT id FROM cat_atributos WHERE nombre='Color'), 'Negro'),
((SELECT id FROM cat_atributos WHERE nombre='Color'), 'Blanco'),
((SELECT id FROM cat_atributos WHERE nombre='Color'), 'Azul'),
((SELECT id FROM cat_atributos WHERE nombre='Talla'), 'S'),
((SELECT id FROM cat_atributos WHERE nombre='Talla'), 'M'),
((SELECT id FROM cat_atributos WHERE nombre='Talla'), 'L'),
((SELECT id FROM cat_atributos WHERE nombre='Almacenamiento'), '64GB'),
((SELECT id FROM cat_atributos WHERE nombre='Almacenamiento'), '128GB');

CREATE TABLE IF NOT EXISTS cat_productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    slug VARCHAR(220) UNIQUE NOT NULL,
    descripcion_corta TEXT,
    descripcion_larga TEXT,
    categoria_id UUID REFERENCES cat_categorias(id) ON DELETE RESTRICT,
    subcategoria_id UUID REFERENCES cat_subcategorias(id) ON DELETE SET NULL,
    marca_id UUID REFERENCES cat_marcas(id) ON DELETE SET NULL,
    unidad_medida_id UUID REFERENCES cat_unidades_medida(id) ON DELETE RESTRICT,
    precio_costo DECIMAL(12,2) DEFAULT 0.00 CHECK (precio_costo >= 0),
    precio_venta DECIMAL(12,2) NOT NULL CHECK (precio_venta >= 0),
    precio_oferta DECIMAL(12,2) CHECK (precio_oferta >= 0),
    fecha_inicio_oferta TIMESTAMP WITH TIME ZONE,
    fecha_fin_oferta TIMESTAMP WITH TIME ZONE,
    peso DECIMAL(8,3), -- En kilogramos
    estado VARCHAR(20) DEFAULT 'BORRADOR' CHECK (estado IN ('BORRADOR', 'ACTIVO', 'INACTIVO')),
    activo BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES seg_usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_productos_sku ON cat_productos(sku);
CREATE INDEX idx_productos_nombre_trgm ON cat_productos USING gin (nombre gin_trgm_ops);
CREATE INDEX idx_productos_categoria ON cat_productos(categoria_id);
CREATE INDEX idx_productos_estado ON cat_productos(estado);

-- Inserción de 20 Productos de Ejemplo
INSERT INTO cat_productos (sku, nombre, slug, descripcion_corta, categoria_id, subcategoria_id, marca_id, unidad_medida_id, precio_costo, precio_venta, precio_oferta, peso, estado) VALUES
('ELEC-001', 'Smartphone Pro Max X', 'smartphone-pro-max-x', 'El mejor teléfono del mercado', (SELECT id FROM cat_categorias WHERE slug='electronica'), (SELECT id FROM cat_subcategorias WHERE slug='smartphones'), (SELECT id FROM cat_marcas WHERE nombre='TechNova'), (SELECT id FROM cat_unidades_medida WHERE abreviatura='UND'), 800.00, 1200.00, 1099.00, 0.200, 'ACTIVO'),
('ELEC-002', 'Smartphone Estándar Y', 'smartphone-estandar-y', 'Buena relación calidad-precio', (SELECT id FROM cat_categorias WHERE slug='electronica'), (SELECT id FROM cat_subcategorias WHERE slug='smartphones'), (SELECT id FROM cat_marcas WHERE nombre='TechNova'), (SELECT id FROM cat_unidades_medida WHERE abreviatura='UND'), 300.00, 500.00, NULL, 0.180, 'ACTIVO'),
('ELEC-003', 'Laptop Gamer Ultra 15', 'laptop-gamer-ultra-15', 'Potencia para juegos AAA', (SELECT id FROM cat_categorias WHERE slug='electronica'), (SELECT id FROM cat_subcategorias WHERE slug='laptops'), (SELECT id FROM cat_marcas WHERE nombre='TechNova'), (SELECT id FROM cat_unidades_medida WHERE abreviatura='UND'), 2500.00, 3500.00, 3200.00, 2.500, 'ACTIVO'),
('ELEC-004', 'Laptop Ultrabook Slim 14', 'laptop-ultrabook-slim-14', 'Perfecta para trabajar', (SELECT id FROM cat_categorias WHERE slug='electronica'), (SELECT id FROM cat_subcategorias WHERE slug='laptops'), (SELECT id FROM cat_marcas WHERE nombre='AppleSim'), (SELECT id FROM cat_unidades_medida WHERE abreviatura='UND'), 3000.00, 4500.00, NULL, 1.400, 'ACTIVO'),
('ELEC-005', 'Tablet Educativa 10"', 'tablet-educativa-10', 'Para el aprendizaje de los más pequeños', (SELECT id FROM cat_categorias WHERE slug='electronica'), (SELECT id FROM cat_subcategorias WHERE slug='smartphones'), (SELECT id FROM cat_marcas WHERE nombre='SamsungSim'), (SELECT id FROM cat_unidades_medida WHERE abreviatura='UND'), 100.00, 180.00, 150.00, 0.450, 'ACTIVO'),
('ROPA-001', 'Camiseta Algodón Classic', 'camiseta-algodon-classic', 'Básica y cómoda', (SELECT id FROM cat_categorias WHERE slug='ropa-accesorios'), (SELECT id FROM cat_subcategorias WHERE slug='camisetas'), (SELECT id FROM cat_marcas WHERE nombre='StyleMax'), (SELECT id FROM cat_unidades_medida WHERE abreviatura='UND'), 15.00, 45.00, NULL, 0.200, 'ACTIVO'),
('ROPA-002', 'Camiseta Polo Premium', 'camiseta-polo-premium', 'Elegancia casual', (SELECT id FROM cat_categorias WHERE slug='ropa-accesorios'), (SELECT id FROM cat_subcategorias WHERE slug='camisetas'), (SELECT id FROM cat_marcas WHERE nombre='StyleMax'), (SELECT id FROM cat_unidades_medida WHERE abreviatura='UND'), 25.00, 75.00, NULL, 0.250, 'ACTIVO'),
('ROPA-003', 'Camiseta Deportiva DryFit', 'camiseta-deportiva-dryfit', 'Transpirable para el gym', (SELECT id FROM cat_categorias WHERE slug='ropa-accesorios'), (SELECT id FROM cat_subcategorias WHERE slug='camisetas'), (SELECT id FROM cat_marcas WHERE nombre='StyleMax'), (SELECT id FROM cat_unidades_medida WHERE abreviatura='UND'), 20.00, 60.00, 50.00, 0.150, 'ACTIVO'),
('ROPA-004', 'Jeans Slim Fit Azul', 'jeans-slim-fit-azul', 'Corte moderno', (SELECT id FROM cat_categorias WHERE slug='ropa-accesorios'), (SELECT id FROM cat_subcategorias WHERE slug='camisetas'), (SELECT id FROM cat_marcas WHERE nombre='StyleMax'), (SELECT id FROM cat_unidades_medida WHERE abreviatura='UND'), 30.00, 90.00, NULL, 0.800, 'ACTIVO'),
('ROPA-005', 'Zapatillas Urban Runner', 'zapatillas-urban-runner', 'Estilo y comodidad', (SELECT id FROM cat_categorias WHERE slug='ropa-accesorios'), (SELECT id FROM cat_subcategorias WHERE slug='camisetas'), (SELECT id FROM cat_marcas WHERE nombre='StyleMax'), (SELECT id FROM cat_unidades_medida WHERE abreviatura='PAR'), 40.00, 120.00, NULL, 0.700, 'ACTIVO'),
('HOG-001', 'Olla de Presión 6L', 'olla-presion-6l', 'Cocina rápido y seguro', (SELECT id FROM cat_categorias WHERE slug='hogar-cocina'), (SELECT id FROM cat_subcategorias WHERE slug='electrodomesticos'), (SELECT id FROM cat_marcas WHERE nombre='HomePro'), (SELECT id FROM cat_unidades_medida WHERE abreviatura='UND'), 80.00, 150.00, 130.00, 2.000, 'ACTIVO'),
('HOG-002', 'Licuadora Industrial', 'licuadora-industrial', 'Motor potente 1200W', (SELECT id FROM cat_categorias WHERE slug='hogar-cocina'), (SELECT id FROM cat_subcategorias WHERE slug='electrodomesticos'), (SELECT id FROM cat_marcas WHERE nombre='HomePro'), (SELECT id FROM cat_unidades_medida WHERE abreviatura='UND'), 120.00, 220.00, NULL, 3.500, 'ACTIVO'),
('HOG-003', 'Set de Sartenes Antiadherentes', 'set-sartenes-antiadherentes', '3 piezas', (SELECT id FROM cat_categorias WHERE slug='hogar-cocina'), (SELECT id FROM cat_subcategorias WHERE slug='electrodomesticos'), (SELECT id FROM cat_marcas WHERE nombre='HomePro'), (SELECT id FROM cat_unidades_medida WHERE abreviatura='UND'), 50.00, 110.00, NULL, 2.500, 'ACTIVO'),
('HOG-004', 'Freidora de Aire 5L', 'freidora-aire-5l', 'Cocina sin aceite', (SELECT id FROM cat_categorias WHERE slug='hogar-cocina'), (SELECT id FROM cat_subcategorias WHERE slug='electrodomesticos'), (SELECT id FROM cat_marcas WHERE nombre='HomePro'), (SELECT id FROM cat_unidades_medida WHERE abreviatura='UND'), 150.00, 280.00, 250.00, 4.000, 'ACTIVO'),
('HOG-005', 'Cafetera Espresso Automática', 'cafetera-espresso-automatica', 'Café de especialidad en casa', (SELECT id FROM cat_categorias WHERE slug='hogar-cocina'), (SELECT id FROM cat_subcategorias WHERE slug='electrodomesticos'), (SELECT id FROM cat_marcas WHERE nombre='HomePro'), (SELECT id FROM cat_unidades_medida WHERE abreviatura='UND'), 400.00, 650.00, NULL, 5.000, 'ACTIVO'),
('ELEC-006', 'Audífonos Inalámbricos ANC', 'audifonos-inalambricos-anc', 'Cancelación de ruido activa', (SELECT id FROM cat_categorias WHERE slug='electronica'), (SELECT id FROM cat_subcategorias WHERE slug='smartphones'), (SELECT id FROM cat_marcas WHERE nombre='AppleSim'), (SELECT id FROM cat_unidades_medida WHERE abreviatura='UND'), 60.00, 150.00, NULL, 0.250, 'ACTIVO'),
('ELEC-007', 'Smartwatch Serie 8', 'smartwatch-serie-8', 'Monitorea tu salud', (SELECT id FROM cat_categorias WHERE slug='electronica'), (SELECT id FROM cat_subcategorias WHERE slug='smartphones'), (SELECT id FROM cat_marcas WHERE nombre='SamsungSim'), (SELECT id FROM cat_unidades_medida WHERE abreviatura='UND'), 120.00, 250.00, 220.00, 0.050, 'ACTIVO'),
('ROPA-006', 'Camiseta Oversize Vintage', 'camiseta-oversize-vintage', 'Tendencia urbana', (SELECT id FROM cat_categorias WHERE slug='ropa-accesorios'), (SELECT id FROM cat_subcategorias WHERE slug='camisetas'), (SELECT id FROM cat_marcas WHERE nombre='StyleMax'), (SELECT id FROM cat_unidades_medida WHERE abreviatura='UND'), 18.00, 55.00, NULL, 0.220, 'ACTIVO'),
('HOG-006', 'Aspiradora Robot Mapping', 'aspiradora-robot-mapping', 'Limpia por ti', (SELECT id FROM cat_categorias WHERE slug='hogar-cocina'), (SELECT id FROM cat_subcategorias WHERE slug='electrodomesticos'), (SELECT id FROM cat_marcas WHERE nombre='HomePro'), (SELECT id FROM cat_unidades_medida WHERE abreviatura='UND'), 350.00, 600.00, 550.00, 3.000, 'ACTIVO'),
('ELEC-008', 'Cargador Solar Portátil', 'cargador-solar-portatil', 'Energía limpia en tus viajes', (SELECT id FROM cat_categorias WHERE slug='electronica'), (SELECT id FROM cat_subcategorias WHERE slug='smartphones'), (SELECT id FROM cat_marcas WHERE nombre='TechNova'), (SELECT id FROM cat_unidades_medida WHERE abreviatura='UND'), 40.00, 85.00, NULL, 0.500, 'ACTIVO');

CREATE TABLE IF NOT EXISTS cat_imagenes_producto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID REFERENCES cat_productos(id) ON DELETE CASCADE,
    url TEXT NOT NULL, -- S3 URL o Cloudinary
    orden INT DEFAULT 0 CHECK (orden >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Añadir imagen placeholder a los 20 productos
INSERT INTO cat_imagenes_producto (producto_id, url, orden)
SELECT id, 'https://placehold.co/600x600/EEE/31343C?text=' || REPLACE(nombre, ' ', '+'), 1 FROM cat_productos;

CREATE TABLE IF NOT EXISTS cat_etiquetas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(50) UNIQUE NOT NULL
);
INSERT INTO cat_etiquetas (nombre) VALUES ('Nuevo'), ('Oferta'), ('Más Vendido'), ('Envío Gratis');

CREATE TABLE IF NOT EXISTS cat_producto_etiqueta (
    producto_id UUID REFERENCES cat_productos(id) ON DELETE CASCADE,
    etiqueta_id UUID REFERENCES cat_etiquetas(id) ON DELETE CASCADE,
    PRIMARY KEY (producto_id, etiqueta_id)
);
-- Marcar los que tienen oferta
INSERT INTO cat_producto_etiqueta (producto_id, etiqueta_id)
SELECT p.id, e.id FROM cat_productos p JOIN cat_etiquetas e ON e.nombre = 'Oferta' WHERE p.precio_oferta IS NOT NULL;

CREATE TABLE IF NOT EXISTS cat_producto_atributo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID REFERENCES cat_productos(id) ON DELETE CASCADE,
    valor_atributo_id UUID REFERENCES cat_valores_atributo(id) ON DELETE CASCADE,
    UNIQUE (producto_id, valor_atributo_id)
);
-- Atributos para laptops y polos (ejemplo)
INSERT INTO cat_producto_atributo (producto_id, valor_atributo_id)
SELECT p.id, v.id FROM cat_productos p JOIN cat_valores_atributo v ON v.valor = 'Negro' 
WHERE p.sku IN ('ELEC-003', 'ELEC-004', 'ROPA-002');

-- ==========================================
-- CLIENTES
-- ==========================================
CREATE TABLE IF NOT EXISTS cli_clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID UNIQUE NOT NULL REFERENCES seg_usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    documento_identidad VARCHAR(20) UNIQUE,
    telefono VARCHAR(20),
    fecha_nacimiento DATE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cli_direcciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES cli_clientes(id) ON DELETE CASCADE,
    alias VARCHAR(50) NOT NULL, -- 'Casa', 'Oficina'
    nombre_receptor VARCHAR(200) NOT NULL,
    direccion LINE NOT NULL, -- PostgreSQL native type for addresses
    ciudad VARCHAR(100) NOT NULL,
    departamento VARCHAR(100) NOT NULL,
    codigo_postal VARCHAR(10),
    telefono_receptor VARCHAR(20),
    es_principal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cli_lista_deseos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID UNIQUE NOT NULL REFERENCES cli_clientes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cli_items_lista_deseos (
    lista_deseos_id UUID REFERENCES cli_lista_deseos(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES cat_productos(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (lista_deseos_id, producto_id)
);

CREATE TABLE IF NOT EXISTS cli_resenas_producto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID REFERENCES cat_productos(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES cli_clientes(id) ON DELETE CASCADE,
    calificacion INT NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
    comentario TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (producto_id, cliente_id) -- Un cliente por reseña por producto
);

CREATE TABLE IF NOT EXISTS cli_historial_navegacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES cli_clientes(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES cat_productos(id) ON DELETE CASCADE,
    visto_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_historial_cliente ON cli_historial_navegacion(cliente_id, visto_en DESC);

-- ==========================================
-- INVENTARIO
-- ==========================================
CREATE TABLE IF NOT EXISTS inv_proveedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ruc VARCHAR(11) UNIQUE NOT NULL,
    razon_social VARCHAR(200) NOT NULL,
    contacto_nombre VARCHAR(100),
    contacto_telefono VARCHAR(20),
    email VARCHAR(150),
    direccion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inv_stock_producto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID UNIQUE NOT NULL REFERENCES cat_productos(id) ON DELETE RESTRICT,
    stock_fisico INT NOT NULL DEFAULT 0 CHECK (stock_fisico >= 0),
    stock_reservado INT NOT NULL DEFAULT 0 CHECK (stock_reservado >= 0),
    stock_minimo INT NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Añadir stock a los 20 productos
INSERT INTO inv_stock_producto (producto_id, stock_fisico, stock_minimo)
SELECT id, CASE WHEN RIGHT(sku, 3) LIKE '00%' THEN 100 ELSE 50 END, 5 FROM cat_productos;

CREATE TABLE IF NOT EXISTS inv_movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_id UUID NOT NULL REFERENCES inv_stock_producto(id),
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA', 'AJUSTE', 'RESERVA', 'LIBERACION')),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    referencia_id UUID, -- Puede ser ord_ordenes.id o inv_ajustes.id
    referencia_tipo VARCHAR(50),
    comentario TEXT,
    created_by UUID REFERENCES seg_usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_movimientos_stock ON inv_movimientos_inventario(stock_id, created_at DESC);

CREATE TABLE IF NOT EXISTS inv_ajustes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    motivo VARCHAR(200) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('GANANCIA', 'PERDIDA')),
    created_by UUID NOT NULL REFERENCES seg_usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inv_detalle_ajuste (
    ajuste_id UUID REFERENCES inv_ajustes(id) ON DELETE CASCADE,
    stock_id UUID NOT NULL REFERENCES inv_stock_producto(id),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    PRIMARY KEY (ajuste_id, stock_id)
);

CREATE TABLE IF NOT EXISTS inv_ordenes_compra (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proveedor_id UUID REFERENCES inv_proveedores(id),
    estado VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'APROBADA', 'RECIBIDA_PARCIAL', 'RECIBIDA', 'CANCELADA')),
    fecha_orden TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES seg_usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inv_detalle_orden_compra (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orden_compra_id UUID REFERENCES inv_ordenes_compra(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES cat_productos(id),
    cantidad_solicitada INT NOT NULL CHECK (cantidad_solicitada > 0),
    cantidad_recibida INT DEFAULT 0 CHECK (cantidad_recibida >= 0),
    costo_unitario DECIMAL(12,2) NOT NULL CHECK (costo_unitario >= 0)
);

CREATE TABLE IF NOT EXISTS inv_recepciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orden_compra_id UUID REFERENCES inv_ordenes_compra(id),
    fecha_recepcion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recibido_por UUID REFERENCES seg_usuarios(id),
    comentario TEXT
);

-- ==========================================
-- CARrito Y ÓRDENES
-- ==========================================
CREATE TABLE IF NOT EXISTS ord_carritos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID UNIQUE REFERENCES cli_clientes(id) ON DELETE CASCADE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ord_items_carrito (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrito_id UUID REFERENCES ord_carritos(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES cat_productos(id),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(12,2) NOT NULL CHECK (precio_unitario >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ord_metodos_envio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(50) NOT NULL, -- 'Estándar', 'Express', 'Recogo en Tienda'
    descripcion TEXT,
    tiempo_estimado VARCHAR(50), -- '3-5 días', '24 horas'
    precio_base DECIMAL(10,2) NOT NULL CHECK (precio_base >= 0),
    activo BOOLEAN DEFAULT TRUE
);
INSERT INTO ord_metodos_envio (nombre, tiempo_estimado, precio_base) VALUES 
('Estándar', '3 a 5 días hábiles', 15.00), 
('Express', '24 horas', 35.00), 
('Recogo en Tienda', 'Inmediato', 0.00);

CREATE TABLE IF NOT EXISTS ord_estados_orden (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);
INSERT INTO ord_estados_orden (nombre) VALUES 
('PENDIENTE_PAGO'), ('PAGADA'), ('EN_PROCESO'), ('ENVIADA'), ('ENTREGADA'), ('CANCELADA'), ('DEVUELTA');

CREATE TABLE IF NOT EXISTS ord_direcciones_envio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Copia desnormalizada para inmutabilidad de la orden
    alias VARCHAR(50),
    nombre_receptor VARCHAR(200) NOT NULL,
    direccion LINE NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    departamento VARCHAR(100) NOT NULL,
    codigo_postal VARCHAR(10),
    telefono_receptor VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ord_ordenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES cli_clientes(id),
    numero_orden VARCHAR(20) UNIQUE NOT NULL, -- Ej: ORD-20231025-001
    direccion_envio_id UUID NOT NULL REFERENCES ord_direcciones_envio(id),
    metodo_envio_id UUID NOT NULL REFERENCES ord_metodos_envio(id),
    estado_orden_id INT NOT NULL DEFAULT 1 REFERENCES ord_estados_orden(id),
    subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
    porcentaje_igv DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    monto_igv DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (monto_igv >= 0),
    total_envio DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (total_envio >= 0),
    descuento_total DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (descuento_total >= 0),
    total_final DECIMAL(12,2) NOT NULL CHECK (total_final >= 0),
    codigo_cupon VARCHAR(50),
    notas_cliente TEXT,
    created_by UUID REFERENCES seg_usuarios(id), -- Nulo si lo hizo el cliente
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_ordenes_cliente ON ord_ordenes(cliente_id, created_at DESC);
CREATE INDEX idx_ordenes_estado ON ord_ordenes(estado_orden_id);
CREATE INDEX idx_ordenes_numero ON ord_ordenes(numero_orden);

CREATE TABLE IF NOT EXISTS ord_items_orden (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orden_id UUID NOT NULL REFERENCES ord_ordenes(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES cat_productos(id),
    nombre_producto VARCHAR(200) NOT NULL, -- Snapshot
    sku VARCHAR(50) NOT NULL, -- Snapshot
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(12,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0)
);

CREATE TABLE IF NOT EXISTS ord_historial_estados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orden_id UUID NOT NULL REFERENCES ord_ordenes(id) ON DELETE CASCADE,
    estado_orden_id INT NOT NULL REFERENCES ord_estados_orden(id),
    comentario TEXT,
    usuario_accion UUID REFERENCES seg_usuarios(id), -- Admin o sistema
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ord_pagos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orden_id UUID UNIQUE NOT NULL REFERENCES ord_ordenes(id),
    metodo_pago VARCHAR(50) NOT NULL CHECK (metodo_pago IN ('TARJETA', 'TRANSFERENCIA', 'CONTRA_ENTREGA')),
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'REEMBOLSADO')),
    monto_pagado DECIMAL(12,2) NOT NULL CHECK (monto_pagado >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ord_transacciones_pago (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pago_id UUID NOT NULL REFERENCES ord_pagos(id) ON DELETE CASCADE,
    pasarela_id VARCHAR(100), -- ID de Stripe, Niubiz, etc.
    respuesta_json JSONB, -- Respuesta cruda de la pasarela
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);