    // licoreriaApp/src/main/java/com/example/licoreriaApp/controller/PermisoController.java
    package com.example.licoreriaApp.controller;

    import com.example.licoreriaApp.model.Rol;
    import com.example.licoreriaApp.service.PermisoService;
    import com.example.licoreriaApp.service.RolService;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.http.ResponseEntity;
    import org.springframework.stereotype.Controller;
    import org.springframework.ui.Model;
    import org.springframework.web.bind.annotation.*;
    import org.springframework.web.servlet.mvc.support.RedirectAttributes;

    import jakarta.servlet.http.HttpSession;
    import java.util.List;

    @Controller
    @RequestMapping("/superAdmin/permisos")
    public class PermisoController {

        @Autowired
        private RolService rolService;

        @Autowired
        private PermisoService permisoService;

        // Middleware de permisos
        private boolean tienePermiso(HttpSession session) {
            com.example.licoreriaApp.model.Usuario usuario = (com.example.licoreriaApp.model.Usuario) session
                    .getAttribute("usuario");
            return usuario != null && usuario.esSuperAdmin();
        }

        @GetMapping("/rol/{rolId}")
        public String gestionarPermisosRol(@PathVariable Long rolId, HttpSession session, Model model) {
            if (!tienePermiso(session)) {
                return "redirect:/acceso-denegado";
            }

            try {
                Rol rol = rolService.obtenerPorId(rolId)
                        .orElseThrow(() -> new RuntimeException("Rol no encontrado"));

                model.addAttribute("rol", rol);
                model.addAttribute("permisosRol", rol.getPermisos());
                model.addAttribute("permisosDisponibles", rolService.obtenerPermisosDisponibles(rolId));
                model.addAttribute("categorias", permisoService.obtenerCategorias());

                return "superAdmin/gestion-permisos";

            } catch (Exception e) {
                model.addAttribute("error", "Error al cargar permisos: " + e.getMessage());
                return "redirect:/superAdmin/roles";
            }
        }

        @PostMapping("/asignar")
        public String asignarPermiso(
                @RequestParam Long rolId,
                @RequestParam Long permisoId,
                HttpSession session,
                RedirectAttributes redirectAttributes) {

            if (!tienePermiso(session)) {
                return "redirect:/acceso-denegado";
            }

            try {
                rolService.asignarPermiso(rolId, permisoId);
                redirectAttributes.addFlashAttribute("success", "Permiso asignado correctamente");
            } catch (Exception e) {
                redirectAttributes.addFlashAttribute("error", "Error al asignar permiso: " + e.getMessage());
            }

            return "redirect:/superAdmin/permisos/rol/" + rolId;
        }

        @PostMapping("/remover")
        public String removerPermiso(
                @RequestParam Long rolId,
                @RequestParam Long permisoId,
                HttpSession session,
                RedirectAttributes redirectAttributes) {

            if (!tienePermiso(session)) {
                return "redirect:/acceso-denegado";
            }

            try {
                rolService.removerPermiso(rolId, permisoId);
                redirectAttributes.addFlashAttribute("success", "Permiso removido correctamente");
            } catch (Exception e) {
                redirectAttributes.addFlashAttribute("error", "Error al remover permiso: " + e.getMessage());
            }

            return "redirect:/superAdmin/permisos/rol/" + rolId;
        }

        @PostMapping("/inicializar")
        public String inicializarPermisos(HttpSession session, RedirectAttributes redirectAttributes) {
            if (!tienePermiso(session)) {
                return "redirect:/acceso-denegado";
            }

            try {
                permisoService.inicializarPermisosBasicos();
                redirectAttributes.addFlashAttribute("success", "Permisos inicializados correctamente");
            } catch (Exception e) {
                redirectAttributes.addFlashAttribute("error", "Error al inicializar permisos: " + e.getMessage());
            }

            return "redirect:/superAdmin/roles";
        }
    }