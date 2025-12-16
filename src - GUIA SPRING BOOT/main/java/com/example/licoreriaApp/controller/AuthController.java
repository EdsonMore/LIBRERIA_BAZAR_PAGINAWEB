// licoreriaApp/src/main/java/com/example/licoreriaApp/controller/AuthController.java
package com.example.licoreriaApp.controller;

import java.time.LocalDate;
import java.time.Period;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.example.licoreriaApp.model.Usuario;
import com.example.licoreriaApp.service.UsuarioService;

import jakarta.servlet.http.HttpSession;

@Controller
public class AuthController {

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping("/login")
    public String mostrarLogin(@RequestParam(value = "error", required = false) String error,
            @RequestParam(value = "logout", required = false) String logout,
            Model model) {

        if (error != null) {
            model.addAttribute("errorLogin", "Credenciales inválidas. Por favor, intenta de nuevo.");
        }

        if (logout != null) {
            model.addAttribute("mensaje", "Has cerrado sesión exitosamente.");
            return "redirect:/";
        }

        return "auth/login";
    }

    // Mostrar formulario de registro
    @GetMapping("/registro")
    public String mostrarRegistro(Model model) {
        // Asegurar que el objeto usuario esté en el modelo
        if (!model.containsAttribute("usuario")) {
            model.addAttribute("usuario", new Usuario());
        }
        return "auth/registro";
    }

    // Procesar registro
    @PostMapping("/registro")
    public String procesarRegistro(@ModelAttribute Usuario usuario,
            RedirectAttributes redirectAttributes) {
        try {
            // Validar edad (mayor de 18 años)
            LocalDate fechaNacimiento = usuario.getFechaNacimiento();
            if (fechaNacimiento != null) {
                int edad = Period.between(fechaNacimiento, LocalDate.now()).getYears();
                if (edad < 18) {
                    redirectAttributes.addFlashAttribute("errorEdad",
                            "Debes ser mayor de 18 años para registrarte");
                    return "redirect:/registro";
                }
            }

            // Verificar si el correo ya existe
            if (usuarioService.existeCorreo(usuario.getCorreo())) {
                redirectAttributes.addFlashAttribute("errorCorreo",
                        "El correo ya está registrado");
                return "redirect:/registro";
            }

            // Verificar si el DNI ya existe
            if (usuarioService.existeDni(usuario.getDni())) {
                redirectAttributes.addFlashAttribute("errorDni",
                        "El DNI ya está registrado");
                return "redirect:/registro";
            }

            // Establecer el user como el correo si no se proporcionó
            if (usuario.getUser() == null || usuario.getUser().isEmpty()) {
                usuario.setUser(usuario.getCorreo());
            }

            // Registrar usuario
            usuarioService.registrarUsuario(usuario);

            redirectAttributes.addFlashAttribute("mensaje",
                    "Registro exitoso. Por favor, inicia sesión");
            return "redirect:/login";

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error",
                    "Error al registrar: " + e.getMessage());
            return "redirect:/registro";
        }
    }

    @GetMapping("/logout-success")
    public String logoutSuccess(HttpSession session, RedirectAttributes redirectAttributes) {
        // Limpiar cualquier dato residual
        session.invalidate();

        redirectAttributes.addFlashAttribute("mensaje", "Has cerrado sesión exitosamente");
        return "redirect:/";
    }
}