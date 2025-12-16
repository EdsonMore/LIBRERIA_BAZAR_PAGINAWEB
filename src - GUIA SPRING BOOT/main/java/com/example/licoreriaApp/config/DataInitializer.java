// licoreriaApp/src/main/java/com/example/licoreriaApp/config/DataInitializer.java
package com.example.licoreriaApp.config;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.licoreriaApp.model.Categoria;
import com.example.licoreriaApp.model.Producto;
import com.example.licoreriaApp.model.Rol;
import com.example.licoreriaApp.model.Usuario;
import com.example.licoreriaApp.model.Ruta;
import com.example.licoreriaApp.repository.CategoriaRepository;
import com.example.licoreriaApp.repository.ProductoRepository;
import com.example.licoreriaApp.repository.UsuarioRepository;
import com.example.licoreriaApp.repository.RutaRepository;
import com.example.licoreriaApp.service.PermisoService;
import com.example.licoreriaApp.service.RolService;
import com.example.licoreriaApp.service.UsuarioService;
import com.example.licoreriaApp.service.RutaService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.transaction.Transactional;

@Component
public class DataInitializer implements ApplicationListener<ApplicationReadyEvent> {

    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;

    @Autowired
    private RolService rolService;

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private PermisoService permisoService;

    @Autowired
    private RutaService rutaService;

    @Autowired
    private RutaRepository rutaRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    public DataInitializer(CategoriaRepository categoriaRepository,
            ProductoRepository productoRepository,
            UsuarioRepository usuarioRepository) {
        this.categoriaRepository = categoriaRepository;
        this.productoRepository = productoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    @Transactional
    public void onApplicationEvent(ApplicationReadyEvent event) {
        System.out.println("==============================================");
        System.out.println("🔧 INICIANDO SISTEMA DE ROLES Y PERMISOS");
        System.out.println("==============================================");

        try {
            // Primero inicializar permisos y roles
            inicializarPermisosYRoles();

            // Luego crear usuarios de prueba para cada rol
            crearUsuariosPorRol();

            // Inicializar todas las rutas del sistema
            inicializarTodasLasRutas();

            // Finalmente cargar datos normales
            cargarDatosIniciales();

            System.out.println("\n==============================================");
            System.out.println("✅ SISTEMA INICIALIZADO CORRECTAMENTE");
            System.out.println("==============================================\n");

        } catch (Exception e) {
            System.err.println("\n❌ ERROR AL INICIALIZAR EL SISTEMA: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void inicializarPermisosYRoles() {
        try {
            // 1. Inicializar permisos básicos
            System.out.println("\n🔐 Paso 1: Inicializando permisos básicos...");
            permisoService.inicializarPermisosBasicos();

            // 2. Inicializar roles del sistema
            System.out.println("\n📋 Paso 2: Inicializando roles del sistema...");
            rolService.inicializarRoles();

            // 3. Asignar permisos a cada rol según la estructura del Código 1
            System.out.println("\n👑 Paso 3: Configurando permisos para SUPER_ADMIN...");
            asignarPermisosSuperAdmin();

            System.out.println("\n🛡️ Paso 4: Configurando permisos para ADMIN...");
            asignarPermisosAdmin();

            System.out.println("\n📦 Paso 5: Configurando permisos para ENCARGADO_PRODUCTOS...");
            asignarPermisosEncargadoProductos();

            System.out.println("\n💰 Paso 6: Configurando permisos para ENCARGADO_VENTAS...");
            asignarPermisosEncargadoVentas();

            System.out.println("\n👤 Paso 7: Configurando permisos para CLIENTE...");
            asignarPermisosCliente();

        } catch (Exception e) {
            System.err.println("❌ Error inicializando permisos y roles: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void asignarPermisosSuperAdmin() {
        Optional<Rol> rolOpt = rolService.obtenerPorNombre("ROLE_SUPER_ADMIN");
        if (rolOpt.isEmpty()) {
            System.err.println("⚠️  Rol ROLE_SUPER_ADMIN no encontrado");
            return;
        }

        Rol rol = rolOpt.get();

        // Super Admin tiene TODOS los permisos
        List<com.example.licoreriaApp.model.Permiso> todosPermisos = permisoService.obtenerTodos();
        rol.setPermisos(new java.util.ArrayList<>(todosPermisos));

        // ✅ USAR actualizarRol en lugar de crearRol
        rolService.actualizarRol(rol.getId(), rol);

        System.out.println("✅ Permisos asignados a SUPER_ADMIN: TODOS (" + todosPermisos.size() + " permisos)");
    }

    private void asignarPermisosAdmin() {
        Optional<Rol> rolOpt = rolService.obtenerPorNombre("ROLE_ADMIN");
        if (rolOpt.isEmpty()) {
            System.err.println("⚠️  Rol ROLE_ADMIN no encontrado");
            return;
        }

        Rol rol = rolOpt.get();

        // Permisos específicos para ADMIN
        String[] permisosAdmin = {
                "USUARIO_VER", "USUARIO_CREAR", "USUARIO_EDITAR", "USUARIO_ELIMINAR",
                "ROL_VER", "ROL_CREAR", "ROL_EDITAR", "ROL_ELIMINAR", "ROL_ASIGNAR",
                "PERMISO_VER", "PERMISO_ASIGNAR",
        };

        List<com.example.licoreriaApp.model.Permiso> permisos = permisoService.obtenerTodos().stream()
                .filter(permiso -> Arrays.asList(permisosAdmin).contains(permiso.getCodigo()))
                .collect(Collectors.toList());

        rol.setPermisos(permisos);

        // ✅ USAR actualizarRol en lugar de crearRol
        rolService.actualizarRol(rol.getId(), rol);

        System.out.println("✅ Permisos asignados a ADMIN: " + permisos.size() + " permisos");
    }

    private void asignarPermisosEncargadoProductos() {
        Optional<Rol> rolOpt = rolService.obtenerPorNombre("ROLE_ENCARGADO_PRODUCTOS");
        if (rolOpt.isEmpty()) {
            System.err.println("⚠️  Rol ROLE_ENCARGADO_PRODUCTOS no encontrado");
            return;
        }

        Rol rol = rolOpt.get();

        // Permisos específicos para ENCARGADO_PRODUCTOS (como en el Código 1)
        String[] permisosEncargado = {
                "PRODUCTO_VER", "PRODUCTO_CREAR", "PRODUCTO_EDITAR", "PRODUCTO_ELIMINAR",
                "CATEGORIA_VER", "CATEGORIA_CREAR", "CATEGORIA_EDITAR", "CATEGORIA_ELIMINAR",
                "REPORTE_VER"
        };

        List<com.example.licoreriaApp.model.Permiso> permisos = permisoService.obtenerTodos().stream()
                .filter(permiso -> Arrays.asList(permisosEncargado).contains(permiso.getCodigo()))
                .collect(Collectors.toList());

        rol.setPermisos(permisos);
        rolService.crearRol(rol);

        System.out.println("✅ Permisos asignados a ENCARGADO_PRODUCTOS: " + permisos.size() + " permisos");
    }

    private void asignarPermisosEncargadoVentas() {
        Optional<Rol> rolOpt = rolService.obtenerPorNombre("ROLE_ENCARGADO_VENTAS");
        if (rolOpt.isEmpty()) {
            System.err.println("⚠️  Rol ROLE_ENCARGADO_VENTAS no encontrado");
            return;
        }

        Rol rol = rolOpt.get();

        // Permisos específicos para ENCARGADO_VENTAS (como en el Código 1)
        String[] permisosVentas = {
                "VENTA_VER", "VENTA_CREAR", "VENTA_CANCELAR",
                "PRODUCTO_VER", "CATEGORIA_VER",
                "REPORTE_VER", "REPORTE_EXPORTAR"
        };

        List<com.example.licoreriaApp.model.Permiso> permisos = permisoService.obtenerTodos().stream()
                .filter(permiso -> Arrays.asList(permisosVentas).contains(permiso.getCodigo()))
                .collect(Collectors.toList());

        rol.setPermisos(permisos);
        rolService.crearRol(rol);

        System.out.println("✅ Permisos asignados a ENCARGADO_VENTAS: " + permisos.size() + " permisos");
    }

    private void asignarPermisosCliente() {
        Optional<Rol> rolOpt = rolService.obtenerPorNombre("ROLE_CLIENTE");
        if (rolOpt.isEmpty()) {
            System.err.println("⚠️  Rol ROLE_CLIENTE no encontrado");
            return;
        }

        Rol rol = rolOpt.get();

        // Permisos mínimos para CLIENTE (como en el Código 2)
        String[] permisosCliente = {
                "PRODUCTO_VER" // Solo puede ver productos
        };

        List<com.example.licoreriaApp.model.Permiso> permisos = permisoService.obtenerTodos().stream()
                .filter(permiso -> Arrays.asList(permisosCliente).contains(permiso.getCodigo()))
                .collect(Collectors.toList());

        rol.setPermisos(permisos);
        rolService.crearRol(rol);

        System.out.println("✅ Permisos asignados a CLIENTE: " + permisos.size() + " permisos");
    }

    private void crearUsuariosPorRol() {
        try {
            // 🔷 SUPER ADMIN (con la lógica de verificación del Código 1)
            crearSuperAdminSiNoExiste();

            // 🔷 ADMIN
            crearUsuarioSiNoExiste(
                    "admin@licoreria.com",
                    "admin",
                    "Juan",
                    "Administrador",
                    "11111111",
                    "ROLE_ADMIN");

            // 🔷 ENCARGADO DE PRODUCTOS
            crearUsuarioSiNoExiste(
                    "productos@licoreria.com",
                    "encargadoproductos",
                    "María",
                    "Gonzales",
                    "22222222",
                    "ROLE_ENCARGADO_PRODUCTOS");

            // 🔷 ENCARGADO DE VENTAS
            crearUsuarioSiNoExiste(
                    "ventas@licoreria.com",
                    "encargadoventas",
                    "Carlos",
                    "López",
                    "33333333",
                    "ROLE_ENCARGADO_VENTAS");

            // 🔷 CLIENTE (múltiples clientes)
            crearUsuarioSiNoExiste(
                    "cliente@licoreria.com",
                    "cliente",
                    "Ana",
                    "Martínez",
                    "44444444",
                    "ROLE_CLIENTE");

            crearUsuarioSiNoExiste(
                    "cliente2@licoreria.com",
                    "cliente2",
                    "Luis",
                    "Rodríguez",
                    "55555555",
                    "ROLE_CLIENTE");

            // 🔷 USUARIO CON MÚLTIPLES ROLES (Encargado de Productos + Ventas)
            crearUsuarioConMultiplesRoles(
                    "multiroles@licoreria.com",
                    "multiroles",
                    "Pedro",
                    "Ramírez",
                    "66666666",
                    Arrays.asList("ROLE_ENCARGADO_PRODUCTOS", "ROLE_ENCARGADO_VENTAS"));

            System.out.println("✅ Todos los usuarios de prueba creados exitosamente");

        } catch (Exception e) {
            System.err.println("❌ Error creando usuarios por rol: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // Método para crear Super Admin (del Código 1)
    private void crearSuperAdminSiNoExiste() {
        String emailSuperAdmin = "superadmin@licoreria.com";

        if (usuarioService.existeCorreo(emailSuperAdmin)) {
            System.out.println("✅ Usuario Super Admin ya existe");
            return;
        }

        try {
            Usuario superAdmin = new Usuario();
            superAdmin.setUser("superadmin");
            superAdmin.setCorreo(emailSuperAdmin);
            superAdmin.setPassword("Admin123!"); // Será encriptado por el servicio
            superAdmin.setNombres("Super");
            superAdmin.setApellidoPaterno("Administrador");
            superAdmin.setDni("00000000");
            superAdmin.setNumero("999888777");
            superAdmin.setFechaRegistro(LocalDateTime.now());

            // Asignar rol SUPER_ADMIN
            Rol rolSuperAdmin = rolService.obtenerPorNombre("ROLE_SUPER_ADMIN")
                    .orElseThrow(() -> new RuntimeException("Rol SUPER_ADMIN no encontrado"));

            superAdmin.setRoles(new java.util.ArrayList<>());
            superAdmin.getRoles().add(rolSuperAdmin);

            usuarioService.registrarUsuario(superAdmin);

            System.out.println("✅ Usuario Super Admin creado exitosamente");
            System.out.println("   📧 Email: " + emailSuperAdmin);
            System.out.println("   🔑 Password: Admin123!");
            System.out.println("   ⚠️  CAMBIAR PASSWORD AL PRIMER LOGIN");

        } catch (Exception e) {
            System.err.println("❌ Error creando Super Admin: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void crearUsuarioSiNoExiste(String correo, String user, String nombres,
            String apellido, String dni, String rolNombre) {
        if (!usuarioService.existeCorreo(correo)) {
            try {
                Usuario usuario = new Usuario();
                usuario.setUser(generarUserUnico(user));
                usuario.setPassword("password123"); // Contraseña por defecto
                usuario.setCorreo(correo);
                usuario.setNombres(nombres);
                usuario.setApellidoPaterno(apellido);
                usuario.setDni(dni);
                usuario.setNumero("999888777");
                usuario.setFechaRegistro(LocalDateTime.now());

                // Obtener el rol específico
                Rol rol = rolService.obtenerPorNombre(rolNombre)
                        .orElseThrow(() -> new RuntimeException("Rol " + rolNombre + " no encontrado"));

                // Asignar solo ese rol
                usuario.setRoles(new java.util.ArrayList<>());
                usuario.getRoles().add(rol);

                // Registrar usando el servicio que codifica la contraseña
                Usuario usuarioGuardado = usuarioService.registrarUsuario(usuario);

                System.out.println("✅ Usuario " + rolNombre + " creado: " + correo + " / password123");
                System.out.println("   🔑 Roles asignados: " +
                        usuarioGuardado.getRoles().stream()
                                .map(Rol::getNombre)
                                .collect(Collectors.joining(", ")));

            } catch (Exception e) {
                System.err.println("❌ Error creando usuario " + correo + ": " + e.getMessage());
            }
        } else {
            System.out.println("ℹ️ Usuario " + correo + " ya existe");
        }
    }

    private void crearUsuarioConMultiplesRoles(String correo, String user, String nombres,
            String apellido, String dni, List<String> rolesNombres) {
        if (!usuarioService.existeCorreo(correo)) {
            try {
                Usuario usuario = new Usuario();
                usuario.setUser(generarUserUnico(user));
                usuario.setPassword("password123");
                usuario.setCorreo(correo);
                usuario.setNombres(nombres);
                usuario.setApellidoPaterno(apellido);
                usuario.setDni(dni);
                usuario.setNumero("999888777");
                usuario.setFechaRegistro(LocalDateTime.now());

                // Obtener y asignar múltiples roles
                usuario.setRoles(new java.util.ArrayList<>());
                for (String rolNombre : rolesNombres) {
                    Rol rol = rolService.obtenerPorNombre(rolNombre)
                            .orElseThrow(() -> new RuntimeException("Rol " + rolNombre + " no encontrado"));
                    usuario.getRoles().add(rol);
                }

                // Registrar usuario
                Usuario usuarioGuardado = usuarioService.registrarUsuario(usuario);

                System.out.println("✅ Usuario multi-roles creado: " + correo + " / password123");
                System.out.println("   🔑 Roles asignados: " +
                        usuarioGuardado.getRoles().stream()
                                .map(Rol::getNombre)
                                .collect(Collectors.joining(", ")));

            } catch (Exception e) {
                System.err.println("❌ Error creando usuario multi-roles " + correo + ": " + e.getMessage());
            }
        } else {
            System.out.println("ℹ️ Usuario " + correo + " ya existe");
        }
    }

    private void inicializarTodasLasRutas() {
        try {
            System.out.println("\n🛣️  Paso 8: Inicializando todas las rutas del sistema...");

            // Verificar si ya existen rutas de manera más eficiente
            List<Ruta> rutasExistentes = rutaRepository.findAll();
            if (!rutasExistentes.isEmpty()) {
                System.out.println("ℹ️  Rutas ya existen en la BD (" + rutasExistentes.size()
                        + " rutas). Saltando inicialización.");
                return;
            }

            System.out.println("📝 Creando rutas del sistema...");

            // Obtener roles una sola vez
            Rol rolCliente = rolService.obtenerPorNombre("ROLE_CLIENTE").orElse(null);
            Rol rolAdmin = rolService.obtenerPorNombre("ROLE_ADMIN").orElse(null);
            Rol rolSuperAdmin = rolService.obtenerPorNombre("ROLE_SUPER_ADMIN").orElse(null);

            System.out.println("👥 Roles cargados - Cliente: " + (rolCliente != null) +
                    ", Admin: " + (rolAdmin != null) +
                    ", SuperAdmin: " + (rolSuperAdmin != null));

            // Lista para guardar todas las rutas y hacer bulk insert
            List<Ruta> todasLasRutas = new ArrayList<>();

            // =====================================================
            // 🔷 RUTAS PÚBLICAS (SIN AUTENTICACIÓN)
            // =====================================================
            System.out.println("\n🌐 Creando rutas públicas...");
            todasLasRutas.add(crearRutaObjeto("/", "GET", "Página principal - Home", true, "PUBLIC"));
            todasLasRutas.add(crearRutaObjeto("/home", "GET", "Página home", true, "PUBLIC"));
            todasLasRutas.add(crearRutaObjeto("/index", "GET", "Página index", true, "PUBLIC"));
            todasLasRutas.add(crearRutaObjeto("/productos", "GET", "Listar todos los productos", true, "PRODUCTOS"));
            todasLasRutas
                    .add(crearRutaObjeto("/productos/buscar", "GET", "Buscar productos por nombre", true, "PRODUCTOS"));
            todasLasRutas
                    .add(crearRutaObjeto("/producto/{id}", "GET", "Ver detalle de un producto", true, "PRODUCTOS"));
            todasLasRutas.add(crearRutaObjeto("/sobre-nosotros", "GET", "Página sobre nosotros", true, "PUBLIC"));
            todasLasRutas.add(crearRutaObjeto("/contacto", "GET", "Página de contacto", true, "PUBLIC"));
            todasLasRutas.add(crearRutaObjeto("/libro-reclamaciones", "GET", "Libro de reclamaciones", true, "PUBLIC"));
            todasLasRutas.add(crearRutaObjeto("/login", "GET", "Mostrar formulario de login", true, "AUTH"));
            todasLasRutas.add(crearRutaObjeto("/login", "POST", "Procesar login", true, "AUTH"));
            todasLasRutas.add(crearRutaObjeto("/registro", "GET", "Mostrar formulario de registro", true, "AUTH"));
            todasLasRutas.add(crearRutaObjeto("/registro", "POST", "Procesar registro de usuario", true, "AUTH"));
            todasLasRutas.add(crearRutaObjeto("/error/**", "GET", "Páginas de error", true, "ERROR"));

            // =====================================================
            // 🔷 API PÚBLICAS
            // =====================================================
            System.out.println("🔗 Creando APIs públicas...");
            todasLasRutas.add(crearRutaObjeto("/api/resenas/producto/{productoId}", "GET",
                    "Obtener reseñas públicas de un producto", true, "API_RESENAS"));
            todasLasRutas.add(crearRutaObjeto("/api/resenas/producto/{productoId}/stats", "GET",
                    "Obtener estadísticas de reseñas", true, "API_RESENAS"));
            todasLasRutas.add(
                    crearRutaObjeto("/api/carrito/agregar", "POST", "Agregar item al carrito", true, "API_CARRITO"));
            todasLasRutas.add(crearRutaObjeto("/api/carrito/actualizar", "PUT", "Actualizar cantidad en carrito", true,
                    "API_CARRITO"));
            todasLasRutas.add(crearRutaObjeto("/api/carrito/eliminar", "DELETE", "Eliminar item del carrito", true,
                    "API_CARRITO"));
            todasLasRutas
                    .add(crearRutaObjeto("/api/carrito/limpiar", "DELETE", "Limpiar carrito", true, "API_CARRITO"));
            todasLasRutas.add(crearRutaObjeto("/api/carrito/cantidad", "GET", "Obtener cantidad total en carrito", true,
                    "API_CARRITO"));
            todasLasRutas.add(
                    crearRutaObjeto("/api/carrito/total", "GET", "Obtener total del carrito", true, "API_CARRITO"));
            todasLasRutas.add(
                    crearRutaObjeto("/api/carrito/items", "GET", "Obtener items del carrito", true, "API_CARRITO"));
            todasLasRutas.add(crearRutaObjeto("/api/compras/realizar-guest", "POST", "Realizar compra como guest", true,
                    "API_COMPRAS"));

            // =====================================================
            // 🔷 RUTAS DE CLIENTES AUTENTICADOS
            // =====================================================
            System.out.println("👤 Creando rutas para clientes...");
            todasLasRutas.add(
                    crearRutaConRolObjeto("/perfil", "GET", "Ver perfil de usuario", false, "USUARIO", rolCliente));
            todasLasRutas.add(crearRutaConRolObjeto("/perfil", "POST", "Actualizar perfil de usuario", false, "USUARIO",
                    rolCliente));
            todasLasRutas.add(crearRutaConRolObjeto("/cambiar-password", "GET", "Mostrar formulario cambiar password",
                    false, "USUARIO", rolCliente));
            todasLasRutas
                    .add(crearRutaConRolObjeto("/mis-compras", "GET", "Ver mis compras", false, "COMPRAS", rolCliente));
            todasLasRutas.add(crearRutaConRolObjeto("/mis-compras/{id}/detalles", "GET", "Ver detalle de una compra",
                    false, "COMPRAS", rolCliente));
            todasLasRutas.add(crearRutaConRolObjeto("/compra/confirmacion/{id}", "GET", "Ver confirmación de compra",
                    false, "COMPRAS", rolCliente));
            todasLasRutas.add(crearRutaConRolObjeto("/compra/detalle/{id}", "GET", "Ver detalle completo de compra",
                    false, "COMPRAS", rolCliente));
            todasLasRutas.add(crearRutaConRolObjeto("/procesar-pago", "POST", "Procesar pago de compra", false,
                    "COMPRAS", rolCliente));
            todasLasRutas.add(
                    crearRutaConRolObjeto("/carrito", "GET", "Ver carrito de compras", false, "CARRITO", rolCliente));
            todasLasRutas
                    .add(crearRutaConRolObjeto("/mis-resenas", "GET", "Ver mis reseñas", false, "RESENAS", rolCliente));
            todasLasRutas.add(crearRutaConRolObjeto("/api/resenas", "POST", "Crear nueva reseña", false, "API_RESENAS",
                    rolCliente));
            todasLasRutas.add(crearRutaConRolObjeto("/api/resenas/{id}", "DELETE", "Eliminar propia reseña", false,
                    "API_RESENAS", rolCliente));
            todasLasRutas.add(crearRutaConRolObjeto("/acceso-denegado", "GET", "Página acceso denegado", false, "ERROR",
                    rolCliente));
            todasLasRutas
                    .add(crearRutaConRolObjeto("/logout-success", "GET", "Logout exitoso", false, "AUTH", rolCliente));
            todasLasRutas
                    .add(crearRutaConRolObjeto("/login-success", "GET", "Login exitoso", false, "AUTH", rolCliente));

            // =====================================================
            // 🔷 RUTAS DE ADMIN
            // =====================================================
            System.out.println("🛡️ Creando rutas para admin...");
            todasLasRutas.add(crearRutaConRolObjeto("/admin", "GET", "Dashboard Admin", false, "ADMIN", rolAdmin));
            todasLasRutas
                    .add(crearRutaConRolObjeto("/admin/dashboard", "GET", "Dashboard Admin", false, "ADMIN", rolAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/admin/productos", "GET", "Gestión de productos (Admin)", false,
                    "ADMIN_PRODUCTOS", rolAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/admin/usuarios", "GET", "Gestión de usuarios (Admin)", false,
                    "ADMIN_USUARIOS", rolAdmin));

            // =====================================================
            // 🔷 RUTAS DE SUPER ADMIN
            // =====================================================
            System.out.println("👑 Creando rutas para super admin...");
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin", "GET", "Home SuperAdmin", false, "SUPER_ADMIN",
                    rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/dashboard", "GET", "Dashboard SuperAdmin", false,
                    "SUPER_ADMIN", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/acceso-denegado", "GET", "Acceso denegado SuperAdmin",
                    false, "SUPER_ADMIN", rolSuperAdmin));

            // SuperAdmin - Gestión de Productos
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/productos", "GET", "Listar productos (SuperAdmin)",
                    false, "SUPER_ADMIN_PRODUCTOS", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/productos/{id}", "GET", "Obtener producto por ID",
                    false, "SUPER_ADMIN_PRODUCTOS", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/productos/agregar", "POST", "Crear nuevo producto",
                    false, "SUPER_ADMIN_PRODUCTOS", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/productos/editar", "POST", "Editar producto existente",
                    false, "SUPER_ADMIN_PRODUCTOS", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/productos/eliminar/{id}", "GET", "Eliminar producto",
                    false, "SUPER_ADMIN_PRODUCTOS", rolSuperAdmin));

            // SuperAdmin - Gestión de Categorías
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/categorias", "GET", "Listar categorías", false,
                    "SUPER_ADMIN_CATEGORIAS", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/categorias/{id}", "GET", "Obtener categoría por ID",
                    false, "SUPER_ADMIN_CATEGORIAS", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/categorias/guardar", "POST", "Guardar categoría",
                    false, "SUPER_ADMIN_CATEGORIAS", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/categorias/toggle-activa/{id}", "POST",
                    "Activar/Desactivar categoría", false, "SUPER_ADMIN_CATEGORIAS", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/categorias/eliminar/{id}", "POST",
                    "Eliminar categoría", false, "SUPER_ADMIN_CATEGORIAS", rolSuperAdmin));

            // SuperAdmin - Gestión de Usuarios
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/usuarios", "GET", "Listar usuarios", false,
                    "SUPER_ADMIN_USUARIOS", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/usuarios/{id}", "GET", "Obtener datos del usuario",
                    false, "SUPER_ADMIN_USUARIOS", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/usuarios/{id}/roles", "GET",
                    "Obtener roles del usuario", false, "SUPER_ADMIN_USUARIOS", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/usuarios/editar", "POST", "Editar usuario", false,
                    "SUPER_ADMIN_USUARIOS", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/usuarios/eliminar/{id}", "GET", "Eliminar usuario",
                    false, "SUPER_ADMIN_USUARIOS", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/usuarios/{usuarioId}/asignar-rol/{rolId}", "POST",
                    "Asignar rol a usuario", false, "SUPER_ADMIN_USUARIOS", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/usuarios/{usuarioId}/remover-rol/{rolId}", "POST",
                    "Remover rol de usuario", false, "SUPER_ADMIN_USUARIOS", rolSuperAdmin));

            // SuperAdmin - Gestión de Roles
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/roles", "GET", "Listar roles", false,
                    "SUPER_ADMIN_ROLES", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/roles/todos", "GET", "Obtener todos los roles (API)",
                    false, "SUPER_ADMIN_ROLES", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/roles/{id}", "GET", "Obtener rol por ID", false,
                    "SUPER_ADMIN_ROLES", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/roles/crear", "POST", "Crear nuevo rol", false,
                    "SUPER_ADMIN_ROLES", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/roles/editar", "POST", "Editar rol", false,
                    "SUPER_ADMIN_ROLES", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/roles/eliminar/{id}", "GET", "Eliminar rol", false,
                    "SUPER_ADMIN_ROLES", rolSuperAdmin));

            // SuperAdmin - Gestión de Permisos
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/permisos/rol/{rolId}", "GET",
                    "Gestionar permisos de rol", false, "SUPER_ADMIN_PERMISOS", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/permisos/asignar", "POST", "Asignar permiso a rol",
                    false, "SUPER_ADMIN_PERMISOS", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/permisos/remover", "POST", "Remover permiso de rol",
                    false, "SUPER_ADMIN_PERMISOS", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/permisos/inicializar", "POST", "Inicializar permisos",
                    false, "SUPER_ADMIN_PERMISOS", rolSuperAdmin));

            // SuperAdmin - Gestión de Rutas (NUEVO)
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/rutas", "GET", "Listar todas las rutas", false,
                    "SUPER_ADMIN_RUTAS", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/rutas/todos", "GET", "Obtener todas las rutas (API)",
                    false, "SUPER_ADMIN_RUTAS", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/rutas/{id}", "GET", "Obtener ruta por ID", false,
                    "SUPER_ADMIN_RUTAS", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/rutas/crear", "POST", "Crear nueva ruta", false,
                    "SUPER_ADMIN_RUTAS", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/rutas/editar", "POST", "Editar ruta", false,
                    "SUPER_ADMIN_RUTAS", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/rutas/eliminar/{id}", "DELETE", "Eliminar ruta", false,
                    "SUPER_ADMIN_RUTAS", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/rutas/{rutaId}/asignar-rol/{rolId}", "POST",
                    "Asignar rol a ruta", false, "SUPER_ADMIN_RUTAS", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/rutas/{rutaId}/remover-rol/{rolId}", "POST",
                    "Remover rol de ruta", false, "SUPER_ADMIN_RUTAS", rolSuperAdmin));

            // SuperAdmin - Gestión de Reseñas
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/resenas", "GET", "Listar todas las reseñas", false,
                    "SUPER_ADMIN_RESENAS", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/resenas/cambiar-estado", "POST",
                    "Cambiar estado de reseña", false, "SUPER_ADMIN_RESENAS", rolSuperAdmin));

            // SuperAdmin - Gestión de Compras
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/compras", "GET", "Listar todas las compras", false,
                    "SUPER_ADMIN_COMPRAS", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/compras/{id}", "GET", "Obtener detalle de compra",
                    false, "SUPER_ADMIN_COMPRAS", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/compras/actualizar-estado", "POST",
                    "Actualizar estado de compra", false, "SUPER_ADMIN_COMPRAS", rolSuperAdmin));
            todasLasRutas.add(crearRutaConRolObjeto("/superAdmin/compras/eliminar/{id}", "GET", "Eliminar compra",
                    false, "SUPER_ADMIN_COMPRAS", rolSuperAdmin));

            // =====================================================
            // 🔷 GUARDAR TODAS LAS RUTAS DE UNA VEZ
            // =====================================================
            System.out.println("💾 Guardando " + todasLasRutas.size() + " rutas en la base de datos...");

            // Filtrar rutas nulas (por si hay errores en la creación)
            List<Ruta> rutasValidas = todasLasRutas.stream()
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            // Guardar todas las rutas de una vez
            List<Ruta> rutasGuardadas = rutaRepository.saveAll(rutasValidas);

            System.out.println("✅ " + rutasGuardadas.size() + " rutas inicializadas correctamente");

        } catch (Exception e) {
            System.err.println("❌ Error inicializando rutas: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // Métodos auxiliares para crear objetos Ruta sin guardar en BD
    private Ruta crearRutaObjeto(String ruta, String metodo, String descripcion, Boolean esPublica, String categoria) {
        try {
            return new Ruta(ruta, metodo, descripcion, esPublica, categoria);
        } catch (Exception e) {
            System.err.println("  ❌ Error creando objeto ruta " + ruta + ": " + e.getMessage());
            return null;
        }
    }

    private Ruta crearRutaConRolObjeto(String ruta, String metodo, String descripcion, Boolean esPublica,
            String categoria, Rol rol) {
        try {
            Ruta nuevaRuta = new Ruta(ruta, metodo, descripcion, esPublica, categoria);
            if (rol != null) {
                nuevaRuta.agregarRol(rol);
            }
            return nuevaRuta;
        } catch (Exception e) {
            System.err.println("  ❌ Error creando objeto ruta con rol " + ruta + ": " + e.getMessage());
            return null;
        }
    }

    private void crearRutaSiNoExiste(String ruta, String metodo, String descripcion, Boolean esPublica,
            String categoria) {
        try {
            if (!rutaRepository.existsByRutaAndMetodo(ruta, metodo)) {
                Ruta nuevaRuta = new Ruta(ruta, metodo, descripcion, esPublica, categoria);
                rutaRepository.save(nuevaRuta);
                rutaRepository.flush();
                System.out.println("  ✅ " + metodo + " " + ruta + " - " + descripcion);
            } else {
                System.out.println("  ℹ️  " + metodo + " " + ruta + " ya existe");
            }
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            System.err.println("  ⚠️  " + metodo + " " + ruta + " - Duplicado, saltando");
        } catch (Exception e) {
            System.err.println("  ❌ Error creando ruta " + ruta + ": " + e.getMessage());
        }
    }

    private void crearRutaConRol(String ruta, String metodo, String descripcion, Boolean esPublica, String categoria,
            Rol rol) {
        try {
            if (!rutaRepository.existsByRutaAndMetodo(ruta, metodo)) {
                Ruta nuevaRuta = new Ruta(ruta, metodo, descripcion, esPublica, categoria);
                if (rol != null) {
                    nuevaRuta.agregarRol(rol);
                }
                rutaRepository.save(nuevaRuta);
                rutaRepository.flush();
                String rolesStr = rol != null ? " [" + rol.getNombre() + "]" : "";
                System.out.println("  ✅ " + metodo + " " + ruta + rolesStr + " - " + descripcion);
            } else {
                System.out.println("  ℹ️  " + metodo + " " + ruta + " ya existe");
            }
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            System.err.println("  ⚠️  " + metodo + " " + ruta + " - Duplicado, saltando");
        } catch (Exception e) {
            System.err.println("  ❌ Error creando ruta " + ruta + ": " + e.getMessage());
        }
    }

    private String generarUserUnico(String baseUser) {
        String user = baseUser;
        int suffix = 1;
        while (usuarioService.existeUser(user)) {
            user = baseUser + suffix++;
        }
        return user;
    }

    private void cargarDatosIniciales() {
        ObjectMapper mapper = new ObjectMapper();

        try {
            // Cargar categorías
            if (categoriaRepository.count() == 0) {
                InputStream is = new ClassPathResource("static/data/categorias.json").getInputStream();
                JsonNode root = mapper.readTree(is);
                if (root.isArray()) {
                    Iterator<JsonNode> it = root.elements();
                    while (it.hasNext()) {
                        JsonNode n = it.next();
                        String nombre = n.path("nombre").asText(null);
                        if (nombre == null || nombre.isBlank()) {
                            continue;
                        }
                        // evitar duplicados por nombre
                        Categoria existente = categoriaRepository.findByNombre(nombre);
                        if (existente != null) {
                            continue;
                        }
                        Categoria c = new Categoria();
                        c.setNombre(nombre);
                        c.setDescripcion(n.path("descripcion").asText(null));
                        c.setImagen(n.path("imagen").asText(null));
                        c.setActiva(n.path("activa").asBoolean(true));
                        categoriaRepository.save(c);
                    }
                }
            }

            // Cargar productos
            if (productoRepository.count() == 0) {
                InputStream is = new ClassPathResource("static/data/productos.json").getInputStream();
                JsonNode root = mapper.readTree(is);
                if (root.isArray()) {
                    Iterator<JsonNode> it = root.elements();
                    while (it.hasNext()) {
                        JsonNode n = it.next();
                        String nombre = n.path("nombre").asText(null);
                        if (nombre == null || nombre.isBlank()) {
                            continue;
                        }
                        // evitar duplicados por nombre
                        boolean exists = productoRepository.findByNombreContainingIgnoreCase(nombre).stream()
                                .anyMatch(p -> p.getNombre().equalsIgnoreCase(nombre));
                        if (exists) {
                            continue;
                        }

                        Producto p = new Producto();
                        p.setNombre(nombre);
                        // categoria: puede venir anidada
                        JsonNode catNode = n.path("categoria");
                        String catNombre = null;
                        if (catNode.isObject()) {
                            catNombre = catNode.path("nombre").asText(null);
                        } else if (catNode.isTextual()) {
                            catNombre = catNode.asText(null);
                        }
                        Categoria cat = null;
                        if (catNombre != null) {
                            cat = categoriaRepository.findByNombre(catNombre);
                        }
                        if (cat == null) {
                            // si no existe, tomar la primera categoría (fallback)
                            cat = categoriaRepository.findByActiva(true).stream().findFirst().orElse(null);
                        }
                        if (cat == null) {
                            continue; // no hay dónde asociar
                        }
                        p.setCategoria(cat);
                        p.setPrecio(n.path("precio").asDouble(0.0));
                        p.setStock(n.path("stock").asInt(0));
                        p.setDisponible(n.path("disponible").asBoolean(p.getStock() > 0));
                        p.setImagen(n.path("imagen").asText(null));
                        p.setDescripcion(n.path("descripcion").asText(null));
                        productoRepository.save(p);
                    }
                }
            }

            System.out.println("\n✅ DataInitializer: carga inicial finalizada.");
            System.out.println("   📊 Categorías: " + categoriaRepository.count());
            System.out.println("   📦 Productos: " + productoRepository.count());
            System.out.println("   👥 Usuarios: " + usuarioRepository.count());

            // Mostrar resumen de usuarios creados
            System.out.println("\n🎉 USUARIOS DE PRUEBA CREADOS:");
            System.out.println("┌─────────────────────────────────────────────┬──────────────┐");
            System.out.println("│ Correo                                      │ Contraseña   │");
            System.out.println("├─────────────────────────────────────────────┼──────────────┤");
            System.out.println("│ superadmin@licoreria.com                    │ Admin123!    │");
            System.out.println("│ admin@licoreria.com                         │ password123  │");
            System.out.println("│ productos@licoreria.com                     │ password123  │");
            System.out.println("│ ventas@licoreria.com                        │ password123  │");
            System.out.println("│ cliente@licoreria.com                       │ password123  │");
            System.out.println("│ cliente2@licoreria.com                      │ password123  │");
            System.out.println("│ multiroles@licoreria.com                    │ password123  │");
            System.out.println("└─────────────────────────────────────────────┴──────────────┘");

        } catch (Exception e) {
            System.err.println("❌ Error en DataInitializer: " + e.getMessage());
            e.printStackTrace();
        }
    }
}