// licoreriaApp/src/main/java/com/example/licoreriaApp/controller/UsuarioController.java
package com.example.licoreriaApp.controller;

import java.time.LocalDate;
import java.time.Period;
import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import com.example.licoreriaApp.model.Producto;
import com.example.licoreriaApp.repository.ProductoRepository;
import com.example.licoreriaApp.service.CarritoService;
import java.util.Map;

import com.example.licoreriaApp.model.Usuario;
import com.example.licoreriaApp.service.UsuarioService;

import jakarta.servlet.http.HttpSession;

@Controller
public class UsuarioController {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private CarritoService carritoService;

    @Autowired
    private UsuarioService usuarioService;

    // En UsuarioController.java - AGREGAR ESTE MÉTODO
    @GetMapping("/login-success")
    public String loginSuccess(HttpSession session, RedirectAttributes redirectAttributes) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication != null && authentication.isAuthenticated() &&
                    !"anonymousUser".equals(authentication.getPrincipal())) {

                String correo = authentication.getName();
                Usuario usuario = usuarioService.obtenerPorCorreo(correo)
                        .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

                // Guardar usuario en sesión
                session.setAttribute("usuario", usuario);
                System.out.println("DEBUG: Usuario autenticado: " + usuario.getCorreo());
                System.out.println("DEBUG: Roles: " + usuario.getRoles());

                // ✅ MEJORADO: Redirección específica por rol
                if (usuario.esSuperAdmin()) {
                    System.out.println("DEBUG: Redirigiendo SUPER_ADMIN a dashboard");
                    return "redirect:/superAdmin/dashboard";
                } else if (usuario.esAdmin()) {
                    System.out.println("DEBUG: Redirigiendo ADMIN a dashboard admin");
                    return "redirect:/admin/dashboard";
                } else if (usuario.esEncargadoProductos() || usuario.esEncargadoVentas()) {
                    System.out.println("DEBUG: Redirigiendo ENCARGADO a dashboard específico");
                    return "redirect:/admin/dashboard";
                } else {
                    System.out.println("DEBUG: Redirigiendo CLIENTE a página principal");
                    return "redirect:/";
                }
            }

            return "redirect:/";

        } catch (Exception e) {
            System.err.println("ERROR en login-success: " + e.getMessage());
            e.printStackTrace();
            redirectAttributes.addFlashAttribute("error", "Error al cargar datos de usuario");
            return "redirect:/";
        }
    }

    // Mostrar perfil
    @GetMapping("/perfil")
    public String mostrarPerfil(HttpSession session, Model model) {
        System.out.println("=== DEBUG /perfil ===");

        // Restricción: SuperAdmin no puede acceder al perfil de cliente
        Usuario usuarioSesion = (Usuario) session.getAttribute("usuario");
        if (usuarioSesion != null && usuarioSesion.getRoles() != null && 
            usuarioSesion.getRoles().stream().anyMatch(rol -> "ROLE_SUPER_ADMIN".equals(rol.getNombre()))) {
            return "redirect:/superAdmin/dashboard";
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("Authentication: " + authentication);
        System.out.println("Is authenticated: " + (authentication != null && authentication.isAuthenticated()));
        System.out.println("Principal: " + (authentication != null ? authentication.getPrincipal() : "null"));

        if (authentication == null || !authentication.isAuthenticated() ||
                "anonymousUser".equals(authentication.getPrincipal())) {
            System.out.println("DEBUG: Usuario no autenticado, redirigiendo a login");
            return "redirect:/login";
        }

        try {
            String username = authentication.getName();
            System.out.println("DEBUG: Username autenticado: " + username);

            // Buscar usuario por email en la base de datos
            Usuario usuario = usuarioService.obtenerPorCorreo(username)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            System.out.println("DEBUG: Usuario encontrado: " + usuario.getNombres());
            System.out.println("DEBUG: Roles del usuario: " + usuario.getRoles());

            // Actualizar la sesión con los datos actualizados
            session.setAttribute("usuario", usuario);

            // Agregar usuario al modelo
            model.addAttribute("usuario", usuario);
            model.addAttribute("roles", usuario.getRoles());

            // Géneros
            List<String> generos = Arrays.asList("Masculino", "Femenino", "Otro");
            model.addAttribute("generos", generos);

            System.out.println("DEBUG: Redirigiendo a página perfil");
            return "perfil";

        } catch (Exception e) {
            System.err.println("ERROR en /perfil: " + e.getMessage());
            e.printStackTrace();
            return "redirect:/login";
        }
    }

    // ACTUALIZAR PERFIL - MEJORADO
    @PostMapping("/perfil")
    public String actualizarPerfil(@ModelAttribute Usuario usuarioActualizado,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() ||
                "anonymousUser".equals(authentication.getPrincipal())) {
            return "redirect:/login";
        }

        try {
            String username = authentication.getName();
            Usuario usuarioExistente = usuarioService.obtenerPorCorreo(username)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            // Actualizar campos editables
            usuarioExistente.setNombres(usuarioActualizado.getNombres());
            usuarioExistente.setApellidoPaterno(usuarioActualizado.getApellidoPaterno());
            usuarioExistente.setApellidoMaterno(usuarioActualizado.getApellidoMaterno());

            if (usuarioActualizado.getGenero() != null && !usuarioActualizado.getGenero().isEmpty()) {
                usuarioExistente.setGenero(usuarioActualizado.getGenero());
            }

            usuarioExistente.setCorreo(usuarioActualizado.getCorreo());
            usuarioExistente.setNumero(usuarioActualizado.getNumero());
            usuarioExistente.setDireccion1(usuarioActualizado.getDireccion1());
            usuarioExistente.setDireccion2(usuarioActualizado.getDireccion2());

            // Guardar cambios
            Usuario usuarioGuardado = usuarioService.actualizarUsuario(usuarioExistente);

            // Actualizar sesión
            session.setAttribute("usuario", usuarioGuardado);

            redirectAttributes.addFlashAttribute("successMessage",
                    "Perfil actualizado correctamente");
            return "redirect:/perfil";

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage",
                    "Error al actualizar perfil: " + e.getMessage());
            return "redirect:/perfil";
        }
    }

    @GetMapping("/cambiar-password")
    public String mostrarCambiarPassword(HttpSession session) {
        if (session.getAttribute("usuario") == null) {
            return "redirect:/login";
        }
        return "cambiar-password";
    }

    @GetMapping("/acceso-denegado")
    public String accesoDenegado() {
        return "acceso-denegado";
    }
}