-- Seed de roles
-- Versión: PostgreSQL 12+

INSERT INTO roles (nombre, descripcion, activo)
VALUES 
  ('ROLE_SUPER_ADMIN', 'Administrador del sistema', TRUE),
  ('ROLE_ADMIN', 'Administrador de contenidos', TRUE),
  ('ROLE_ENCARGADO_PRODUCTOS', 'Encargado de productos', TRUE),
  ('ROLE_ENCARGADO_VENTAS', 'Encargado de ventas', TRUE),
  ('ROLE_CLIENTE', 'Cliente del sistema', TRUE)
ON CONFLICT (nombre) DO NOTHING;


-- Seed de categorías de productos - PostgreSQL
INSERT INTO categorias (nombre, descripcion, activa, imagen) VALUES
('Abarrotes', 'Abarrotes y alimentos básicos', TRUE, '/img/categorias/abarrotes.png'),
('Útiles Escolares', 'Cuadernos, lápices, mochilas y más', TRUE, '/img/categorias/utiles-escolares.png'),
('Decoraciones Navideñas', 'Adornos y decoraciones por temporada', TRUE, '/img/categorias/decoraciones-navidad.png'),
('Juguetes', 'Juguetes para niños y niñas de todas las edades', TRUE, '/img/categorias/juguetes.png'),
('Artículos de Limpieza', 'Productos de limpieza y desinfección', TRUE, '/img/categorias/limpieza.png'),
('Artículos de Cocina', 'Utensilios y accesorios de cocina', TRUE, '/img/categorias/cocina.png'),
('Decoración del Hogar', 'Artículos decorativos para tu hogar', TRUE, '/img/categorias/decoracion.png'),
('Otros', 'Otros artículos variados', TRUE, '/img/categorias/otros.png')
ON CONFLICT (nombre) DO NOTHING;

-- Seed de usuarios de prueba
-- Contraseñas: todas son hasheadas con bcrypt
-- Contraseña original para todos: admin123 (para admins) y cliente123 (para clientes)
-- Hashes bcrypt generados con 10 rondas

-- Usuario Super Admin (usuario: superadmin, password: admin123)
INSERT INTO usuarios ("user", password, correo, nombres, apellido_paterno, apellido_materno, activo, fecha_registro) 
VALUES ('superadmin', '$2b$10$yYyCgX1spvZi0j6RJlDBqOtyFilzBNO1ZdLyb0dmiQhPud2CVQ1Uy', 'superadmin@bazar.com', 'Super', 'Admin', 'Bazar', TRUE, NOW())
ON CONFLICT ("user") DO UPDATE SET password = '$2b$10$yYyCgX1spvZi0j6RJlDBqOtyFilzBNO1ZdLyb0dmiQhPud2CVQ1Uy';

-- Usuario Admin (usuario: admin, password: admin123)
INSERT INTO usuarios ("user", password, correo, nombres, apellido_paterno, activo, fecha_registro) 
VALUES ('admin', '$2b$10$yYyCgX1spvZi0j6RJlDBqOtyFilzBNO1ZdLyb0dmiQhPud2CVQ1Uy', 'admin@bazar.com', 'Administrador', 'Principal', TRUE, NOW())
ON CONFLICT ("user") DO UPDATE SET password = '$2b$10$yYyCgX1spvZi0j6RJlDBqOtyFilzBNO1ZdLyb0dmiQhPud2CVQ1Uy';

-- Usuario Encargado Productos (usuario: productos, password: admin123)
INSERT INTO usuarios ("user", password, correo, nombres, apellido_paterno, activo, fecha_registro) 
VALUES ('productos', '$2b$10$yYyCgX1spvZi0j6RJlDBqOtyFilzBNO1ZdLyb0dmiQhPud2CVQ1Uy', 'productos@bazar.com', 'Encargado', 'Inventario', TRUE, NOW())
ON CONFLICT ("user") DO UPDATE SET password = '$2b$10$yYyCgX1spvZi0j6RJlDBqOtyFilzBNO1ZdLyb0dmiQhPud2CVQ1Uy';

-- Usuario Encargado Ventas (usuario: ventas, password: admin123)
INSERT INTO usuarios ("user", password, correo, nombres, apellido_paterno, activo, fecha_registro) 
VALUES ('ventas', '$2b$10$yYyCgX1spvZi0j6RJlDBqOtyFilzBNO1ZdLyb0dmiQhPud2CVQ1Uy', 'ventas@bazar.com', 'Encargado', 'Ventas', TRUE, NOW())
ON CONFLICT ("user") DO UPDATE SET password = '$2b$10$yYyCgX1spvZi0j6RJlDBqOtyFilzBNO1ZdLyb0dmiQhPud2CVQ1Uy';

-- Usuario Cliente de prueba (usuario: cliente, password: cliente123)
INSERT INTO usuarios ("user", password, correo, nombres, apellido_paterno, dni, numero, direccion1, activo, fecha_registro) 
VALUES ('cliente', '$2b$10$yF7CseY09mZ1YPMk192LruNOQkUt3bnE1nEHukHmEkvGYDy4jDoQ2', 'cliente@email.com', 'Carlos', 'Mendoza', '12345678', '987654321', 'Av. Principal 123', TRUE, NOW())
ON CONFLICT ("user") DO UPDATE SET password = '$2b$10$yF7CseY09mZ1YPMk192LruNOQkUt3bnE1nEHukHmEkvGYDy4jDoQ2';


INSERT INTO usuario_roles (usuario_id, rol_id) VALUES
  (1, 1), -- Super Admin -> ROLE_SUPER_ADMIN
  (2, 2), -- Admin -> ROLE_ADMIN
  (3, 3), -- Encargado Productos -> ROLE_ENCARGADO_PRODUCTOS
  (4, 4), -- Encargado Ventas -> ROLE_ENCARGADO_VENTAS
  (5, 5); -- Cliente -> ROLE_CLIENTE
-- Verificar asignaciones
SELECT 
  u.id, u.nombres, u.apellido_paterno,
  r.nombre as rol_nombre
FROM usuario_roles ur
LEFT JOIN usuarios u ON u.id = ur.usuario_id
LEFT JOIN roles r ON r.id = ur.rol_id
ORDER BY u.id;

-- Seed de productos - 30 productos variados por categoría
INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id, imagen, disponible) VALUES
-- ABARROTES (1-5)
('Leche Fresca 1L', 'Leche integral fresca de vaca de alta calidad', 3.50, 100, 1, '/img/productos/leche.png', TRUE),
('Fideos de Trigo 500g', 'Fideos de trigo integral, paquete de 500g', 1.20, 150, 1, '/img/productos/fideos.png', TRUE),
('Arroz Blanco 2kg', 'Arroz blanco grano largo premium', 5.80, 80, 1, '/img/productos/arroz.png', TRUE),
('Aceite de Oliva 750ml', 'Aceite de oliva extra virgen prensado en frío', 12.50, 45, 1, '/img/productos/aceite.png', TRUE),
('Harina de Trigo 1kg', 'Harina de trigo especial para repostería', 2.30, 120, 1, '/img/productos/harina.png', TRUE),

-- ÚTILES ESCOLARES (6-10)
('Cuaderno A4 100 hojas', 'Cuaderno rayado de 100 hojas con pasta flexible', 3.50, 200, 2, '/img/productos/cuaderno-a4.png', TRUE),
('Set de Lápices de Color x24', 'Set completo de 24 lápices de colores variados', 8.90, 60, 2, '/img/productos/lapices-color.png', TRUE),
('Mochila Escolar Azul', 'Mochila ergonómica con varios compartimentos', 25.00, 35, 2, '/img/productos/mochila.png', TRUE),
('Bolígrafo Azul x12', 'Caja de 12 bolígrafos de tinta azul', 4.50, 150, 2, '/img/productos/boligrafos.png', TRUE),
('Compás de Dibujo', 'Compás con aguja y punta de lápiz de metal', 6.80, 40, 2, '/img/productos/compas.png', TRUE),

-- DECORACIONES NAVIDEÑAS (11-15)
('Guirnalda Navideña 2m', 'Guirnalda de plástico con adornos rojos y verdes', 9.99, 50, 3, '/img/productos/guirnalda.png', TRUE),
('Árbol de Navidad Artificial 1.5m', 'Árbol navideño sintetizado con ramas frondosas', 45.00, 20, 3, '/img/productos/arbol-navidad.png', TRUE),
('Luces Navideñas LED x100', 'Tira de 100 luces LED multicolor con control', 15.50, 35, 3, '/img/productos/luces-navidad.png', TRUE),
('Esferas Navideñas x12', 'Set de 12 esferas decorativas varios colores', 7.80, 80, 3, '/img/productos/esferas.png', TRUE),
('Coronita Navideña Decorativa', 'Corona navideña con lazo dorado para puerta', 12.00, 40, 3, '/img/productos/corona-navidad.png', TRUE),

-- JUGUETES (16-20)
('Juego de Mesa Estrategia', 'Juego de mesa educativo para toda la familia', 35.00, 25, 4, '/img/productos/juego-mesa.png', TRUE),
('Muñeca Baby Doll 45cm', 'Muñeca de trapo con ojos y boca bordada', 18.50, 45, 4, '/img/productos/muneca.png', TRUE),
('Auto Rc Recargable', 'Auto de control remoto recargable, batería incluida', 32.00, 20, 4, '/img/productos/auto-rc.png', TRUE),
('Legos Construcción x500', 'Caja de 500 piezas de Legos variados de colores', 42.99, 15, 4, '/img/productos/legos.png', TRUE),
('Pelota Saltarina Neon', 'Pelota saltarina de caucho con luz LED', 6.50, 100, 4, '/img/productos/pelota-saltarina.png', TRUE),

-- ARTÍCULOS DE LIMPIEZA (21-25)
('Detergente Líquido 2L', 'Detergente concentrado para lavar ropa', 8.50, 90, 5, '/img/productos/detergente.png', TRUE),
('Escoba Sintética', 'Escoba de cerdas sintéticas con mango de madera', 7.99, 70, 5, '/img/productos/escoba.png', TRUE),
('Cloro Desinfectante 1L', 'Cloro desinfectante con poder blanqueador', 3.20, 120, 5, '/img/productos/cloro.png', TRUE),
('Papel Higiénico x12 rollos', 'Papel higiénico suave doble hoja, 12 rollos', 10.50, 200, 5, '/img/productos/papel-higienico.png', TRUE),
('Jabón Líquido para Manos 500ml', 'Jabón antibacterial para manos aromático', 5.80, 80, 5, '/img/productos/jabon-manos.png', TRUE),

-- ARTÍCULOS DE COCINA (26-28)
('Olla de Aluminio 6L', 'Olla de aluminio con tapa, capacidad 6 litros', 24.99, 30, 6, '/img/productos/olla.png', TRUE),
('Juego de Cucharas Medidoras', 'Set de 4 cucharas medidoras de acero inoxidable', 8.50, 60, 6, '/img/productos/cucharas-medidoras.png', TRUE),
('Tabla de Picar de Plástico', 'Tabla de picar antideslizante color blanco', 9.99, 50, 6, '/img/productos/tabla-picar.png', TRUE),

-- DECORACIÓN DEL HOGAR (29-30)
('Cuadro Decorativo 50x40cm', 'Cuadro con marco de madera para pared', 22.00, 25, 7, '/img/productos/cuadro.png', TRUE),
('Planta Artificial Decorativa', 'Planta ornamental de plástico en maceta', 14.99, 40, 7, '/img/productos/planta-artificial.png', TRUE);

