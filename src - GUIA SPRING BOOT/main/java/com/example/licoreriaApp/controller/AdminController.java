// licoreriaApp/src/main/java/com/example/licoreriaApp/controller/AdminController.java
package com.example.licoreriaApp.controller;

import com.example.licoreriaApp.model.Usuario;
import com.example.licoreriaApp.service.ProductoService;
import com.example.licoreriaApp.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import jakarta.servlet.http.HttpSession;

@Controller
@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private ProductoService productoService;

    @Autowired
    private UsuarioService usuarioService;

    /**
     * Verifica si el usuario tiene un permiso específico
     */
    private boolean tienePermisoEspecifico(HttpSession session, String codigoPermiso) {
        Usuario usuario = (Usuario) session.getAttribute("usuario");
        if (usuario == null)
            return false;

        // Super Admin y Admin tienen todos los permisos
        if (usuario.esSuperAdmin() || usuario.esAdmin()) {
            return true;
        }

        return usuario.getRoles().stream()
                .anyMatch(rol -> rol.tienePermiso(codigoPermiso));
    }

    @GetMapping("/dashboard")
    public String dashboard(HttpSession session, Model model) {
        Usuario usuario = (Usuario) session.getAttribute("usuario");
        if (usuario == null) {
            return "redirect:/login";
        }

        model.addAttribute("usuario", usuario);

        // Agregar información de permisos para mostrar en el dashboard
        model.addAttribute("puedeVerProductos", tienePermisoEspecifico(session, "PRODUCTO_VER"));
        model.addAttribute("puedeVerUsuarios", tienePermisoEspecifico(session, "USUARIO_VER"));
        model.addAttribute("puedeVerVentas", tienePermisoEspecifico(session, "VENTA_VER"));
        model.addAttribute("puedeVerReportes", tienePermisoEspecifico(session, "REPORTE_VER"));

        // Estadísticas según permisos
        if (tienePermisoEspecifico(session, "PRODUCTO_VER")) {
            model.addAttribute("totalProductos", productoService.contarTotal());
            model.addAttribute("productosDisponibles", productoService.contarDisponibles());
        }

        return "admin/dashboard";
    }

    @GetMapping("/productos")
    public String gestionProductos(HttpSession session, Model model) {
        // Verificar permiso específico
        if (!tienePermisoEspecifico(session, "PRODUCTO_VER")) {
            return "redirect:/acceso-denegado";
        }

        Usuario usuario = (Usuario) session.getAttribute("usuario");
        model.addAttribute("usuario", usuario);
        model.addAttribute("productos", productoService.listarTodos());

        // Agregar información de permisos para la vista
        model.addAttribute("puedeCrear", tienePermisoEspecifico(session, "PRODUCTO_CREAR"));
        model.addAttribute("puedeEditar", tienePermisoEspecifico(session, "PRODUCTO_EDITAR"));
        model.addAttribute("puedeEliminar", tienePermisoEspecifico(session, "PRODUCTO_ELIMINAR"));

        return "admin/gestion-productos";
    }

    @GetMapping("/usuarios")
    public String gestionUsuarios(HttpSession session, Model model) {
        // Verificar permiso específico
        if (!tienePermisoEspecifico(session, "USUARIO_VER")) {
            return "redirect:/acceso-denegado";
        }

        Usuario usuario = (Usuario) session.getAttribute("usuario");
        model.addAttribute("usuario", usuario);
        model.addAttribute("usuarios", usuarioService.obtenerTodos());

        // Agregar información de permisos para la vista
        model.addAttribute("puedeEditar", tienePermisoEspecifico(session, "USUARIO_EDITAR"));
        model.addAttribute("puedeEliminar", tienePermisoEspecifico(session, "USUARIO_ELIMINAR"));
        model.addAttribute("puedeAsignarRoles", tienePermisoEspecifico(session, "USUARIO_ASIGNAR_ROLES"));

        return "admin/gestion-usuarios";
    }
}