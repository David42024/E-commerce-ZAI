-- CreateEnum
CREATE TYPE "EstadoProducto" AS ENUM ('BORRADOR', 'ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "TipoAtributo" AS ENUM ('TEXTO', 'NUMERO', 'COLOR');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE', 'RESERVA', 'LIBERACION');

-- CreateEnum
CREATE TYPE "EstadoOrdenCompra" AS ENUM ('PENDIENTE', 'APROBADA', 'RECIBIDA_PARCIAL', 'RECIBIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('TARJETA', 'TRANSFERENCIA', 'CONTRA_ENTREGA');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'REEMBOLSADO');

-- CreateEnum
CREATE TYPE "TipoAjuste" AS ENUM ('GANANCIA', 'PERDIDA');

-- CreateEnum
CREATE TYPE "TipoConfiguracion" AS ENUM ('STRING', 'INT', 'BOOLEAN', 'JSON');

-- CreateTable
CREATE TABLE "monedas" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(3) NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "simbolo" VARCHAR(5) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monedas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipo_cambio" (
    "id" SERIAL NOT NULL,
    "moneda_origen_id" INTEGER NOT NULL,
    "moneda_destino_id" INTEGER NOT NULL,
    "tasa" DECIMAL(10,4) NOT NULL,
    "fecha_registro" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tipo_cambio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_sistema" (
    "id" SERIAL NOT NULL,
    "clave" VARCHAR(100) NOT NULL,
    "valor" TEXT NOT NULL,
    "tipo" "TipoConfiguracion" NOT NULL DEFAULT 'STRING',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "configuracion_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seg_permisos" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seg_permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seg_roles" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seg_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seg_rol_permiso" (
    "rol_id" INTEGER NOT NULL,
    "permiso_id" INTEGER NOT NULL,

    CONSTRAINT "seg_rol_permiso_pkey" PRIMARY KEY ("rol_id","permiso_id")
);

-- CreateTable
CREATE TABLE "seg_usuarios" (
    "id" UUID NOT NULL,
    "correo" VARCHAR(150) NOT NULL,
    "contrasena_hash" VARCHAR(255) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seg_usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seg_usuario_rol" (
    "usuario_id" UUID NOT NULL,
    "rol_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seg_usuario_rol_pkey" PRIMARY KEY ("usuario_id","rol_id")
);

-- CreateTable
CREATE TABLE "auditoria_registro" (
    "id" BIGSERIAL NOT NULL,
    "tabla_afectada" VARCHAR(50) NOT NULL,
    "registro_id" UUID NOT NULL,
    "accion" VARCHAR(20) NOT NULL,
    "datos_anteriores" JSONB,
    "datos_nuevos" JSONB,
    "usuario_ejecutor" UUID,
    "fecha_accion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_registro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_categorias" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cat_categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_subcategorias" (
    "id" UUID NOT NULL,
    "categoria_id" UUID NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_subcategorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_marcas" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_marcas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_unidades_medida" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "abreviatura" VARCHAR(10) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cat_unidades_medida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_atributos" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "tipo_valor" "TipoAtributo" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cat_atributos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_valores_atributo" (
    "id" UUID NOT NULL,
    "atributo_id" UUID NOT NULL,
    "valor" VARCHAR(100) NOT NULL,

    CONSTRAINT "cat_valores_atributo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_productos" (
    "id" UUID NOT NULL,
    "sku" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "descripcion_corta" TEXT,
    "descripcion_larga" TEXT,
    "categoria_id" UUID NOT NULL,
    "subcategoria_id" UUID,
    "marca_id" UUID,
    "unidad_medida_id" UUID NOT NULL,
    "precio_costo" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "precio_venta" DECIMAL(12,2) NOT NULL,
    "precio_oferta" DECIMAL(12,2),
    "fecha_inicio_oferta" TIMESTAMPTZ,
    "fecha_fin_oferta" TIMESTAMPTZ,
    "peso" DECIMAL(8,3),
    "estado" "EstadoProducto" NOT NULL DEFAULT 'BORRADOR',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cat_productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_imagenes_producto" (
    "id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_imagenes_producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_etiquetas" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,

    CONSTRAINT "cat_etiquetas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_producto_etiqueta" (
    "producto_id" UUID NOT NULL,
    "etiqueta_id" UUID NOT NULL,

    CONSTRAINT "cat_producto_etiqueta_pkey" PRIMARY KEY ("producto_id","etiqueta_id")
);

-- CreateTable
CREATE TABLE "cat_producto_atributo" (
    "id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "valor_atributo_id" UUID NOT NULL,

    CONSTRAINT "cat_producto_atributo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cli_clientes" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "documento_identidad" VARCHAR(20),
    "telefono" VARCHAR(20),
    "fecha_nacimiento" DATE,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cli_clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cli_direcciones" (
    "id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "alias" VARCHAR(50) NOT NULL,
    "nombre_receptor" VARCHAR(200) NOT NULL,
    "direccion" TEXT NOT NULL,
    "ciudad" VARCHAR(100) NOT NULL,
    "departamento" VARCHAR(100) NOT NULL,
    "codigo_postal" VARCHAR(10),
    "telefono_receptor" VARCHAR(20),
    "es_principal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cli_direcciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cli_lista_deseos" (
    "id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cli_lista_deseos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cli_items_lista_deseos" (
    "lista_deseos_id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cli_items_lista_deseos_pkey" PRIMARY KEY ("lista_deseos_id","producto_id")
);

-- CreateTable
CREATE TABLE "cli_resenas_producto" (
    "id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "calificacion" SMALLINT NOT NULL,
    "comentario" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cli_resenas_producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cli_historial_navegacion" (
    "id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "visto_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cli_historial_navegacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inv_proveedores" (
    "id" UUID NOT NULL,
    "ruc" VARCHAR(11) NOT NULL,
    "razon_social" VARCHAR(200) NOT NULL,
    "contacto_nombre" VARCHAR(100),
    "contacto_telefono" VARCHAR(20),
    "email" VARCHAR(150),
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inv_proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inv_stock_producto" (
    "id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "stock_fisico" INTEGER NOT NULL DEFAULT 0,
    "stock_reservado" INTEGER NOT NULL DEFAULT 0,
    "stock_minimo" INTEGER NOT NULL DEFAULT 5,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inv_stock_producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inv_movimientos_inventario" (
    "id" UUID NOT NULL,
    "stock_id" UUID NOT NULL,
    "tipo_movimiento" "TipoMovimiento" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "referencia_id" UUID,
    "referencia_tipo" VARCHAR(50),
    "comentario" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inv_movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inv_ajustes" (
    "id" UUID NOT NULL,
    "motivo" VARCHAR(200) NOT NULL,
    "tipo" "TipoAjuste" NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inv_ajustes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inv_detalle_ajuste" (
    "ajuste_id" UUID NOT NULL,
    "stock_id" UUID NOT NULL,
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "inv_detalle_ajuste_pkey" PRIMARY KEY ("ajuste_id","stock_id")
);

-- CreateTable
CREATE TABLE "inv_ordenes_compra" (
    "id" UUID NOT NULL,
    "proveedor_id" UUID,
    "estado" "EstadoOrdenCompra" NOT NULL DEFAULT 'PENDIENTE',
    "fecha_orden" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inv_ordenes_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inv_detalle_orden_compra" (
    "id" UUID NOT NULL,
    "orden_compra_id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "cantidad_solicitada" INTEGER NOT NULL,
    "cantidad_recibida" INTEGER NOT NULL DEFAULT 0,
    "costo_unitario" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "inv_detalle_orden_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inv_recepciones" (
    "id" UUID NOT NULL,
    "orden_compra_id" UUID,
    "fecha_recepcion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recibido_por" UUID,
    "comentario" TEXT,

    CONSTRAINT "inv_recepciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_metodos_envio" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "tiempo_estimado" VARCHAR(50),
    "precio_base" DECIMAL(10,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ord_metodos_envio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_estados_orden" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,

    CONSTRAINT "ord_estados_orden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_direcciones_envio" (
    "id" UUID NOT NULL,
    "alias" VARCHAR(50),
    "nombre_receptor" VARCHAR(200) NOT NULL,
    "direccion" TEXT NOT NULL,
    "ciudad" VARCHAR(100) NOT NULL,
    "departamento" VARCHAR(100) NOT NULL,
    "codigo_postal" VARCHAR(10),
    "telefono_receptor" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ord_direcciones_envio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_carritos" (
    "id" UUID NOT NULL,
    "cliente_id" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ord_carritos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_items_carrito" (
    "id" UUID NOT NULL,
    "carrito_id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ord_items_carrito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_ordenes" (
    "id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "numero_orden" VARCHAR(20) NOT NULL,
    "direccion_envio_id" UUID NOT NULL,
    "metodo_envio_id" UUID NOT NULL,
    "estado_orden_id" INTEGER NOT NULL DEFAULT 1,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "porcentaje_igv" DECIMAL(5,2) NOT NULL DEFAULT 18,
    "monto_igv" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_envio" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "descuento_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalFinal" DECIMAL(12,2) NOT NULL,
    "codigo_cupon" VARCHAR(50),
    "notas_cliente" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ord_ordenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_items_orden" (
    "id" UUID NOT NULL,
    "orden_id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "nombre_producto" VARCHAR(200) NOT NULL,
    "sku" VARCHAR(50) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "ord_items_orden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_historial_estados" (
    "id" UUID NOT NULL,
    "orden_id" UUID NOT NULL,
    "estado_orden_id" INTEGER NOT NULL,
    "comentario" TEXT,
    "usuario_accion" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ord_historial_estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_pagos" (
    "id" UUID NOT NULL,
    "orden_id" UUID NOT NULL,
    "metodo_pago" "MetodoPago" NOT NULL,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "monto_pagado" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ord_pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_transacciones_pago" (
    "id" UUID NOT NULL,
    "pago_id" UUID NOT NULL,
    "pasarela_id" VARCHAR(100),
    "respuesta_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ord_transacciones_pago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "monedas_codigo_key" ON "monedas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "configuracion_sistema_clave_key" ON "configuracion_sistema"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "seg_permisos_nombre_key" ON "seg_permisos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "seg_roles_nombre_key" ON "seg_roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "seg_usuarios_correo_key" ON "seg_usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "cat_categorias_slug_key" ON "cat_categorias"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "cat_subcategorias_categoria_id_slug_key" ON "cat_subcategorias"("categoria_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "cat_marcas_nombre_key" ON "cat_marcas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "cat_valores_atributo_atributo_id_valor_key" ON "cat_valores_atributo"("atributo_id", "valor");

-- CreateIndex
CREATE UNIQUE INDEX "cat_productos_sku_key" ON "cat_productos"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "cat_productos_slug_key" ON "cat_productos"("slug");

-- CreateIndex
CREATE INDEX "idx_productos_categoria" ON "cat_productos"("categoria_id");

-- CreateIndex
CREATE INDEX "idx_productos_estado" ON "cat_productos"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "cat_etiquetas_nombre_key" ON "cat_etiquetas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "cat_producto_atributo_producto_id_valor_atributo_id_key" ON "cat_producto_atributo"("producto_id", "valor_atributo_id");

-- CreateIndex
CREATE UNIQUE INDEX "cli_clientes_usuario_id_key" ON "cli_clientes"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "cli_clientes_documento_identidad_key" ON "cli_clientes"("documento_identidad");

-- CreateIndex
CREATE UNIQUE INDEX "cli_lista_deseos_cliente_id_key" ON "cli_lista_deseos"("cliente_id");

-- CreateIndex
CREATE UNIQUE INDEX "cli_resenas_producto_producto_id_cliente_id_key" ON "cli_resenas_producto"("producto_id", "cliente_id");

-- CreateIndex
CREATE INDEX "idx_historial_cliente" ON "cli_historial_navegacion"("cliente_id", "visto_en" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "inv_proveedores_ruc_key" ON "inv_proveedores"("ruc");

-- CreateIndex
CREATE UNIQUE INDEX "inv_stock_producto_producto_id_key" ON "inv_stock_producto"("producto_id");

-- CreateIndex
CREATE INDEX "idx_movimientos_stock" ON "inv_movimientos_inventario"("stock_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ord_estados_orden_nombre_key" ON "ord_estados_orden"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ord_carritos_cliente_id_key" ON "ord_carritos"("cliente_id");

-- CreateIndex
CREATE UNIQUE INDEX "ord_ordenes_numero_orden_key" ON "ord_ordenes"("numero_orden");

-- CreateIndex
CREATE UNIQUE INDEX "ord_ordenes_direccion_envio_id_key" ON "ord_ordenes"("direccion_envio_id");

-- CreateIndex
CREATE INDEX "idx_ordenes_cliente" ON "ord_ordenes"("cliente_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_ordenes_estado" ON "ord_ordenes"("estado_orden_id");

-- CreateIndex
CREATE INDEX "idx_ordenes_numero" ON "ord_ordenes"("numero_orden");

-- CreateIndex
CREATE UNIQUE INDEX "ord_pagos_orden_id_key" ON "ord_pagos"("orden_id");

-- AddForeignKey
ALTER TABLE "tipo_cambio" ADD CONSTRAINT "tipo_cambio_moneda_origen_id_fkey" FOREIGN KEY ("moneda_origen_id") REFERENCES "monedas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipo_cambio" ADD CONSTRAINT "tipo_cambio_moneda_destino_id_fkey" FOREIGN KEY ("moneda_destino_id") REFERENCES "monedas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seg_rol_permiso" ADD CONSTRAINT "seg_rol_permiso_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "seg_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seg_rol_permiso" ADD CONSTRAINT "seg_rol_permiso_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "seg_permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seg_usuario_rol" ADD CONSTRAINT "seg_usuario_rol_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "seg_usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seg_usuario_rol" ADD CONSTRAINT "seg_usuario_rol_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "seg_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_registro" ADD CONSTRAINT "auditoria_registro_usuario_ejecutor_fkey" FOREIGN KEY ("usuario_ejecutor") REFERENCES "seg_usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_subcategorias" ADD CONSTRAINT "cat_subcategorias_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "cat_categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_valores_atributo" ADD CONSTRAINT "cat_valores_atributo_atributo_id_fkey" FOREIGN KEY ("atributo_id") REFERENCES "cat_atributos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_productos" ADD CONSTRAINT "cat_productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "cat_categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_productos" ADD CONSTRAINT "cat_productos_subcategoria_id_fkey" FOREIGN KEY ("subcategoria_id") REFERENCES "cat_subcategorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_productos" ADD CONSTRAINT "cat_productos_marca_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "cat_marcas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_productos" ADD CONSTRAINT "cat_productos_unidad_medida_id_fkey" FOREIGN KEY ("unidad_medida_id") REFERENCES "cat_unidades_medida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_productos" ADD CONSTRAINT "cat_productos_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "seg_usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_imagenes_producto" ADD CONSTRAINT "cat_imagenes_producto_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_producto_etiqueta" ADD CONSTRAINT "cat_producto_etiqueta_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_producto_etiqueta" ADD CONSTRAINT "cat_producto_etiqueta_etiqueta_id_fkey" FOREIGN KEY ("etiqueta_id") REFERENCES "cat_etiquetas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_producto_atributo" ADD CONSTRAINT "cat_producto_atributo_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_producto_atributo" ADD CONSTRAINT "cat_producto_atributo_valor_atributo_id_fkey" FOREIGN KEY ("valor_atributo_id") REFERENCES "cat_valores_atributo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_clientes" ADD CONSTRAINT "cli_clientes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "seg_usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_direcciones" ADD CONSTRAINT "cli_direcciones_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cli_clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_lista_deseos" ADD CONSTRAINT "cli_lista_deseos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cli_clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_items_lista_deseos" ADD CONSTRAINT "cli_items_lista_deseos_lista_deseos_id_fkey" FOREIGN KEY ("lista_deseos_id") REFERENCES "cli_lista_deseos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_items_lista_deseos" ADD CONSTRAINT "cli_items_lista_deseos_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_resenas_producto" ADD CONSTRAINT "cli_resenas_producto_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_resenas_producto" ADD CONSTRAINT "cli_resenas_producto_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cli_clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_historial_navegacion" ADD CONSTRAINT "cli_historial_navegacion_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cli_clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_historial_navegacion" ADD CONSTRAINT "cli_historial_navegacion_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_stock_producto" ADD CONSTRAINT "inv_stock_producto_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_movimientos_inventario" ADD CONSTRAINT "inv_movimientos_inventario_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "inv_stock_producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_movimientos_inventario" ADD CONSTRAINT "inv_movimientos_inventario_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "seg_usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_ajustes" ADD CONSTRAINT "inv_ajustes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "seg_usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_detalle_ajuste" ADD CONSTRAINT "inv_detalle_ajuste_ajuste_id_fkey" FOREIGN KEY ("ajuste_id") REFERENCES "inv_ajustes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_detalle_ajuste" ADD CONSTRAINT "inv_detalle_ajuste_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "inv_stock_producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_ordenes_compra" ADD CONSTRAINT "inv_ordenes_compra_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "inv_proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_ordenes_compra" ADD CONSTRAINT "inv_ordenes_compra_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "seg_usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_detalle_orden_compra" ADD CONSTRAINT "inv_detalle_orden_compra_orden_compra_id_fkey" FOREIGN KEY ("orden_compra_id") REFERENCES "inv_ordenes_compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_detalle_orden_compra" ADD CONSTRAINT "inv_detalle_orden_compra_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_recepciones" ADD CONSTRAINT "inv_recepciones_orden_compra_id_fkey" FOREIGN KEY ("orden_compra_id") REFERENCES "inv_ordenes_compra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_recepciones" ADD CONSTRAINT "inv_recepciones_recibido_por_fkey" FOREIGN KEY ("recibido_por") REFERENCES "seg_usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_carritos" ADD CONSTRAINT "ord_carritos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cli_clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_items_carrito" ADD CONSTRAINT "ord_items_carrito_carrito_id_fkey" FOREIGN KEY ("carrito_id") REFERENCES "ord_carritos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_items_carrito" ADD CONSTRAINT "ord_items_carrito_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_ordenes" ADD CONSTRAINT "ord_ordenes_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cli_clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_ordenes" ADD CONSTRAINT "ord_ordenes_direccion_envio_id_fkey" FOREIGN KEY ("direccion_envio_id") REFERENCES "ord_direcciones_envio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_ordenes" ADD CONSTRAINT "ord_ordenes_metodo_envio_id_fkey" FOREIGN KEY ("metodo_envio_id") REFERENCES "ord_metodos_envio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_ordenes" ADD CONSTRAINT "ord_ordenes_estado_orden_id_fkey" FOREIGN KEY ("estado_orden_id") REFERENCES "ord_estados_orden"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_ordenes" ADD CONSTRAINT "ord_ordenes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "seg_usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_items_orden" ADD CONSTRAINT "ord_items_orden_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "ord_ordenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_items_orden" ADD CONSTRAINT "ord_items_orden_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_historial_estados" ADD CONSTRAINT "ord_historial_estados_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "ord_ordenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_historial_estados" ADD CONSTRAINT "ord_historial_estados_estado_orden_id_fkey" FOREIGN KEY ("estado_orden_id") REFERENCES "ord_estados_orden"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_historial_estados" ADD CONSTRAINT "ord_historial_estados_usuario_accion_fkey" FOREIGN KEY ("usuario_accion") REFERENCES "seg_usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_pagos" ADD CONSTRAINT "ord_pagos_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "ord_ordenes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_transacciones_pago" ADD CONSTRAINT "ord_transacciones_pago_pago_id_fkey" FOREIGN KEY ("pago_id") REFERENCES "ord_pagos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
