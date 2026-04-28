"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const luxon_1 = require("luxon");
const prisma = new client_1.PrismaClient();
const SALT_ROUNDS = 10;
// Utilidades para datos realistas
const NOMBRES_PERU = ['Juan', 'Maria', 'Luis', 'Ana', 'Carlos', 'Elena', 'Victor', 'Rosa', 'Jorge', 'Silvia', 'Miguel', 'Carmen', 'Ricardo', 'Patricia', 'Fernando', 'Isabel', 'Raul', 'Teresa', 'Pedro', 'Monica', 'Jose', 'Gabriela', 'Diego', 'Lucia', 'Francisco', 'Alicia', 'Roberto', 'Beatriz', 'Oscar', 'Vanessa'];
const APELLIDOS_PERU = ['Quispe', 'Garcia', 'Rodriguez', 'Flores', 'Sanchez', 'Mamani', 'Diaz', 'Huaman', 'Chavez', 'Ramos', 'Perez', 'Castillo', 'Torres', 'Gomez', 'Mendoza', 'Lopez', 'Espinoza', 'Vargas', 'Guzman', 'Paredes', 'Salazar', 'Rivera', 'Romero', 'Jimenez', 'Silva', 'Ortiz', 'Machado', 'Luna', 'Campos', 'Farfan'];
const DISTRITOS_LIMA = ['Miraflores', 'San Isidro', 'Santiago de Surco', 'La Molina', 'San Borja', 'Los Olivos', 'San Miguel', 'Magdalena del Mar', 'Chorrillos', 'Lince'];
const DEPARTAMENTOS_PERU = ['Lima', 'Arequipa', 'Cusco', 'La Libertad', 'Piura', 'Junín', 'Ica', 'Ancash'];
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const generateDNI = () => Math.floor(10000000 + Math.random() * 90000000).toString();
const generateRUC = () => '20' + Math.floor(100000000 + Math.random() * 900000000).toString();
async function main() {
    console.log("🚀 Iniciando seed de la base de datos (E-commerce Perú)...");
    // 1. LIMPIEZA DE DATOS
    console.log("🧹 Limpiando datos existentes...");
    await prisma.$transaction([
        prisma.ordTransaccionPago.deleteMany(),
        prisma.ordPago.deleteMany(),
        prisma.ordHistorialEstado.deleteMany(),
        prisma.ordItemOrden.deleteMany(),
        prisma.ordOrden.deleteMany(),
        prisma.ordDireccionEnvio.deleteMany(),
        prisma.ordItemCarrito.deleteMany(),
        prisma.ordCarrito.deleteMany(),
        prisma.invMovimientoInventario.deleteMany(),
        prisma.invStockProducto.deleteMany(),
        prisma.cliItemListaDeseos.deleteMany(),
        prisma.cliListaDeseos.deleteMany(),
        prisma.cliResenaProducto.deleteMany(),
        prisma.cliDireccion.deleteMany(),
        prisma.cliCliente.deleteMany(),
        prisma.catProductoAtributo.deleteMany(),
        prisma.catImagenProducto.deleteMany(),
        prisma.catProducto.deleteMany(),
        prisma.catSubcategoria.deleteMany(),
        prisma.catCategoria.deleteMany(),
        prisma.catMarca.deleteMany(),
        prisma.catUnidadMedida.deleteMany(),
        prisma.catValorAtributo.deleteMany(),
        prisma.catAtributo.deleteMany(),
        prisma.segUsuarioRol.deleteMany(),
        prisma.segRolPermiso.deleteMany(),
        prisma.segRol.deleteMany(),
        prisma.segPermiso.deleteMany(),
        prisma.segUsuario.deleteMany(),
        prisma.moneda.deleteMany(),
        prisma.ordMetodoEnvio.deleteMany(),
        prisma.ordEstadoOrden.deleteMany(),
    ]);
    // 2. DATOS TRANSVERSALES
    console.log("💳 Creando Monedas y Configuraciones...");
    const sol = await prisma.moneda.create({
        data: { codigo: 'PEN', nombre: 'Soles', simbolo: 'S/', activo: true }
    });
    const estadosOrden = await Promise.all([
        prisma.ordEstadoOrden.create({ data: { nombre: 'PENDIENTE' } }),
        prisma.ordEstadoOrden.create({ data: { nombre: 'PAGADA' } }),
        prisma.ordEstadoOrden.create({ data: { nombre: 'ENVIADA' } }),
        prisma.ordEstadoOrden.create({ data: { nombre: 'ENTREGADA' } }),
        prisma.ordEstadoOrden.create({ data: { nombre: 'CANCELADA' } }),
    ]);
    const metodosEnvio = await Promise.all([
        prisma.ordMetodoEnvio.create({ data: { nombre: 'Envío Estándar Lima', precioBase: 10, tiempoEstimado: '2-3 días hábiles' } }),
        prisma.ordMetodoEnvio.create({ data: { nombre: 'Envío Express Lima', precioBase: 25, tiempoEstimado: '24 horas' } }),
        prisma.ordMetodoEnvio.create({ data: { nombre: 'Envío a Provincias', precioBase: 20, tiempoEstimado: '5-7 días hábiles' } }),
    ]);
    // 3. SEGURIDAD (ROLES Y PERMISOS)
    console.log("🔐 Creando Roles y Permisos...");
    const roles = await Promise.all([
        prisma.segRol.create({ data: { nombre: 'ADMIN', descripcion: 'Administrador total del sistema' } }),
        prisma.segRol.create({ data: { nombre: 'MANAGER', descripcion: 'Gerente de ventas y catálogo' } }),
        prisma.segRol.create({ data: { nombre: 'CLIENTE', descripcion: 'Cliente final' } }),
    ]);
    const passwordHash = await bcrypt.hash('password123', SALT_ROUNDS);
    // 4. USUARIOS (ADMIN, MANAGER, 30 CLIENTES)
    console.log("👤 Creando Usuarios y Clientes...");
    const adminUser = await prisma.segUsuario.create({
        data: {
            correo: 'admin@zai.com',
            contrasenaHash: passwordHash,
            roles: { create: { rolId: roles[0].id } }
        }
    });
    const managerUser = await prisma.segUsuario.create({
        data: {
            correo: 'gerente@zai.com',
            contrasenaHash: passwordHash,
            roles: { create: { rolId: roles[1].id } }
        }
    });
    const clientesData = [];
    for (let i = 0; i < 30; i++) {
        const nombre = getRandom(NOMBRES_PERU);
        const apellido = getRandom(APELLIDOS_PERU);
        const dni = generateDNI();
        const email = `${nombre.toLowerCase()}.${apellido.toLowerCase()}${i}@gmail.com`;
        const user = await prisma.segUsuario.create({
            data: {
                correo: email,
                contrasenaHash: passwordHash,
                roles: { create: { rolId: roles[2].id } },
                cliente: {
                    create: {
                        nombre,
                        apellido,
                        documentoIdentidad: dni,
                        telefono: '9' + getRandomInt(10000000, 99999999),
                        activo: true
                    }
                }
            },
            include: { cliente: true }
        });
        if (user.cliente)
            clientesData.push(user.cliente);
    }
    // Direcciones para 15 clientes
    console.log("🏠 Creando Direcciones de envío...");
    for (let i = 0; i < 15; i++) {
        const cliente = clientesData[i];
        const numDirecciones = getRandomInt(1, 2);
        for (let j = 0; j < numDirecciones; j++) {
            await prisma.cliDireccion.create({
                data: {
                    clienteId: cliente.id,
                    alias: j === 0 ? 'Casa' : 'Trabajo',
                    nombreReceptor: `${cliente.nombre} ${cliente.apellido}`,
                    direccion: `Av. Los Próceres ${getRandomInt(100, 2500)}, Dpto ${getRandomInt(101, 805)}`,
                    ciudad: getRandom(DISTRITOS_LIMA),
                    departamento: 'Lima',
                    esPrincipal: j === 0,
                    telefonoReceptor: cliente.telefono
                }
            });
        }
    }
    // 5. CATÁLOGO (CATEGORÍAS, SUBCATEGORÍAS, MARCAS, PRODUCTOS)
    console.log("📦 Creando Catálogo y Productos...");
    const catData = [
        { nombre: 'Tecnología', subs: ['Smartphones', 'Laptops'] },
        { nombre: 'Ropa', subs: ['Calzado', 'Urbano'] },
        { nombre: 'Hogar', subs: ['Electrohogar', 'Decoración'] },
        { nombre: 'Deportes', subs: ['Fitness', 'Outdoor'] },
        { nombre: 'Libros', subs: ['Ficción', 'Autoayuda'] },
    ];
    const categories = await Promise.all(catData.map(c => prisma.catCategoria.create({
        data: {
            nombre: c.nombre,
            slug: c.nombre.toLowerCase(),
            subcategorias: {
                create: c.subs.map(s => ({ nombre: s, slug: s.toLowerCase() }))
            }
        },
        include: { subcategorias: true }
    })));
    const marcas = await Promise.all(['Samsung', 'Nike', 'Xiaomi', 'Apple', 'Adidas', 'Sony', 'LG', 'Lenovo', 'HP', 'Bosch'].map(m => prisma.catMarca.create({ data: { nombre: m } })));
    const unidad = await prisma.catUnidadMedida.create({ data: { nombre: 'Unidad', abreviatura: 'UND' } });
    // Atributos
    const attrColor = await prisma.catAtributo.create({
        data: {
            nombre: 'Color',
            tipoValor: client_1.TipoAtributo.COLOR,
            valores: { create: [{ valor: 'Negro' }, { valor: 'Blanco' }, { valor: 'Rojo' }] }
        },
        include: { valores: true }
    });
    const attrTalla = await prisma.catAtributo.create({
        data: {
            nombre: 'Talla',
            tipoValor: client_1.TipoAtributo.TEXTO,
            valores: { create: [{ valor: 'S' }, { valor: 'M' }, { valor: 'L' }, { valor: 'XL' }] }
        },
        include: { valores: true }
    });
    const attrStorage = await prisma.catAtributo.create({
        data: {
            nombre: 'Almacenamiento',
            tipoValor: client_1.TipoAtributo.TEXTO,
            valores: { create: [{ valor: '64GB' }, { valor: '128GB' }, { valor: '256GB' }] }
        },
        include: { valores: true }
    });
    const productos = [];
    const totalProductos = 50;
    for (let i = 0; i < totalProductos; i++) {
        const cat = getRandom(categories);
        const sub = getRandom(cat.subcategorias);
        const marca = getRandom(marcas);
        const precioCosto = getRandomInt(100, 2000);
        const precioVenta = precioCosto * 1.4; // 40% margen
        const esOferta = Math.random() < 0.2;
        const precioOferta = esOferta ? precioVenta * 0.85 : null;
        const prod = await prisma.catProducto.create({
            data: {
                sku: `SKU-${i + 1000}`,
                nombre: `${cat.nombre} ${marca.nombre} Mod-${i}`,
                slug: `${cat.nombre.toLowerCase()}-${marca.nombre.toLowerCase()}-mod-${i}`,
                descripcionCorta: `Excelente producto de la categoría ${cat.nombre} de la marca ${marca.nombre}.`,
                categoriaId: cat.id,
                subcategoriaId: sub.id,
                marcaId: marca.id,
                unidadMedidaId: unidad.id,
                precioCosto,
                precioVenta,
                precioOferta,
                estado: client_1.EstadoProducto.ACTIVO,
                imagenes: {
                    create: [
                        { url: `/images/default.svg`, orden: 0 }
                    ]
                },
                stock: {
                    create: {
                        stockFisico: getRandomInt(20, 100),
                        stockMinimo: 5
                    }
                }
            },
            include: { stock: true }
        });
        // Relacionar atributos aleatorios
        if (cat.nombre === 'Tecnología') {
            await prisma.catProductoAtributo.create({ data: { productoId: prod.id, valorAtributoId: getRandom(attrStorage.valores).id } });
            await prisma.catProductoAtributo.create({ data: { productoId: prod.id, valorAtributoId: getRandom(attrColor.valores).id } });
        }
        else if (cat.nombre === 'Ropa') {
            await prisma.catProductoAtributo.create({ data: { productoId: prod.id, valorAtributoId: getRandom(attrTalla.valores).id } });
            await prisma.catProductoAtributo.create({ data: { productoId: prod.id, valorAtributoId: getRandom(attrColor.valores).id } });
        }
        productos.push(prod);
    }
    // 6. ÓRDENES Y MÁQUINA DE ESTADOS
    console.log("🛒 Generando 40 órdenes y consistencia de inventario...");
    const estados = ['PENDIENTE', 'PAGADA', 'ENVIADA', 'ENTREGADA', 'CANCELADA'];
    const distEstados = [5, 15, 10, 8, 2]; // Total 40
    let orderCount = 0;
    for (let sIdx = 0; sIdx < estados.length; sIdx++) {
        const estadoNombre = estados[sIdx];
        const cantOrdenes = distEstados[sIdx];
        const estadoObj = estadosOrden.find(e => e.nombre === estadoNombre);
        for (let i = 0; i < cantOrdenes; i++) {
            orderCount++;
            const cliente = getRandom(clientesData);
            const numItems = getRandomInt(1, 4);
            const itemsSeleccionados = [];
            let subtotal = 0;
            for (let j = 0; j < numItems; j++) {
                const prod = getRandom(productos);
                const cantidad = getRandomInt(1, 2);
                const precio = prod.precioOferta ? Number(prod.precioOferta) : Number(prod.precioVenta);
                itemsSeleccionados.push({
                    productoId: prod.id,
                    nombreProducto: prod.nombre,
                    sku: prod.sku,
                    cantidad,
                    precioUnitario: precio,
                    subtotal: precio * cantidad
                });
                subtotal += precio * cantidad;
            }
            const igv = subtotal * 0.18;
            const envio = 15;
            const total = subtotal + igv + envio;
            // Fecha creación en los últimos 6 meses
            const fechaCreacion = luxon_1.DateTime.now().minus({ days: getRandomInt(1, 180) }).toJSDate();
            // Dirección desnormalizada
            const dirCliente = await prisma.cliDireccion.findFirst({ where: { clienteId: cliente.id } });
            const dirEnvio = await prisma.ordDireccionEnvio.create({
                data: {
                    nombreReceptor: dirCliente?.nombreReceptor || `${cliente.nombre} ${cliente.apellido}`,
                    direccion: dirCliente?.direccion || 'Calle Real 123',
                    ciudad: dirCliente?.ciudad || 'Lima',
                    departamento: dirCliente?.departamento || 'Lima',
                    telefonoReceptor: dirCliente?.telefonoReceptor || cliente.telefono
                }
            });
            const orden = await prisma.ordOrden.create({
                data: {
                    numeroOrden: `ORD-${2026}${orderCount.toString().padStart(4, '0')}`,
                    clienteId: cliente.id,
                    direccionEnvioId: dirEnvio.id,
                    metodoEnvioId: getRandom(metodosEnvio).id,
                    estadoOrdenId: estadoObj.id,
                    subtotal,
                    montoIgv: igv,
                    totalEnvio: envio,
                    totalFinal: total,
                    created_at: fechaCreacion,
                    items: {
                        create: itemsSeleccionados.map(item => ({
                            productoId: item.productoId,
                            nombreProducto: item.nombreProducto,
                            sku: item.sku,
                            cantidad: item.cantidad,
                            precioUnitario: item.precioUnitario,
                            subtotal: item.subtotal
                        }))
                    },
                    historial: {
                        create: {
                            estadoOrdenId: estadoObj.id,
                            comentario: `Orden creada en estado ${estadoNombre}`,
                            created_at: fechaCreacion
                        }
                    }
                }
            });
            // Lógica temporal para entregadas
            if (estadoNombre === 'ENTREGADA') {
                const fechaEntrega = luxon_1.DateTime.fromJSDate(fechaCreacion).plus({ days: getRandomInt(2, 5) }).toJSDate();
                await prisma.ordHistorialEstado.create({
                    data: {
                        ordenId: orden.id,
                        estadoOrdenId: estadosOrden.find(e => e.nombre === 'ENTREGADA').id,
                        comentario: 'Pedido entregado satisfactoriamente',
                        created_at: fechaEntrega
                    }
                });
            }
            // Pago si no es pendiente
            if (estadoNombre !== 'PENDIENTE' && estadoNombre !== 'CANCELADA') {
                await prisma.ordPago.create({
                    data: {
                        ordenId: orden.id,
                        metodoPago: client_1.MetodoPago.TARJETA,
                        estado: client_1.EstadoPago.APROBADO,
                        montoPagado: total
                    }
                });
            }
            // Consistencia de Inventario: Descontar stock para órdenes NO canceladas
            if (estadoNombre !== 'CANCELADA') {
                for (const item of itemsSeleccionados) {
                    const stock = await prisma.invStockProducto.findUnique({ where: { productoId: item.productoId } });
                    if (stock) {
                        await prisma.invStockProducto.update({
                            where: { id: stock.id },
                            data: { stockFisico: { decrement: item.cantidad } }
                        });
                        // Registro de movimiento (SALIDA)
                        await prisma.invMovimientoInventario.create({
                            data: {
                                stockId: stock.id,
                                tipoMovimiento: client_1.TipoMovimiento.SALIDA,
                                cantidad: item.cantidad,
                                referenciaId: orden.id,
                                referenciaTipo: 'ORDEN_VENTA',
                                comentario: `Venta orden ${orden.numeroOrden}`
                            }
                        });
                    }
                }
            }
        }
    }
    // Forzar 3 productos con stock bajo
    console.log("⚠️ Ajustando alertas de stock bajo...");
    for (let i = 0; i < 3; i++) {
        await prisma.invStockProducto.update({
            where: { productoId: productos[i].id },
            data: { stockFisico: 2, stockMinimo: 5 }
        });
    }
    // 7. RESEÑAS Y LISTA DE DESEOS
    console.log("⭐ Creando reseñas y listas de deseos...");
    const reviews = [
        'Excelente producto, superó mis expectativas. La entrega fue muy rápida en Lima.',
        'Muy buena calidad, lo recomiendo totalmente. El color es idéntico a la foto.',
        'Llegó bien empaquetado y funciona perfecto. Relación calidad precio 10/10.',
        'Satisfecho con la compra, la talla me quedó exacta. Volveré a comprar.',
        'Un poco demorado el envío a provincia pero el producto vale la pena.'
    ];
    for (let i = 0; i < 15; i++) {
        const prod = getRandom(productos);
        const cliente = getRandom(clientesData);
        try {
            await prisma.cliResenaProducto.create({
                data: {
                    productoId: prod.id,
                    clienteId: cliente.id,
                    calificacion: getRandomInt(4, 5),
                    comentario: getRandom(reviews)
                }
            });
        }
        catch (e) { /* Evitar duplicados si cliente ya reseñó prod */ }
    }
    for (let i = 0; i < 10; i++) {
        const cliente = clientesData[i];
        const wishlist = await prisma.cliListaDeseos.create({ data: { clienteId: cliente.id } });
        const numItems = getRandomInt(1, 3);
        for (let j = 0; j < numItems; j++) {
            try {
                await prisma.cliItemListaDeseos.create({
                    data: { listaDeseosId: wishlist.id, productoId: productos[getRandomInt(0, 49)].id }
                });
            }
            catch (e) { }
        }
    }
    console.log("✅ Seed completado exitosamente. Datos masivos y realistas generados.");
}
main()
    .catch((e) => {
    console.error("❌ Error en el seed:", e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map