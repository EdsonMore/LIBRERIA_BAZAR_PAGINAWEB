package com.example.licoreriaApp.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import com.example.licoreriaApp.model.Usuario;
import jakarta.servlet.http.HttpSession;

@Controller
public class MainController {

    @GetMapping("/sobre-nosotros")
    public String sobreNosotros() {
        return "sobre-nosotros";
    }

    @GetMapping("/contacto")
    public String contacto(HttpSession session) {
        // Restricción: SuperAdmin no puede acceder a contacto
        Usuario usuario = (Usuario) session.getAttribute("usuario");
        if (usuario != null && usuario.getRoles() != null && 
            usuario.getRoles().stream().anyMatch(rol -> "ROLE_SUPER_ADMIN".equals(rol.getNombre()))) {
            return "redirect:/superAdmin/dashboard";
        }
        return "contacto";
    }

    @GetMapping("/libro-reclamaciones")
    public String libroReclamaciones(HttpSession session) {
        // Restricción: SuperAdmin no puede acceder a libro de reclamaciones
        Usuario usuario = (Usuario) session.getAttribute("usuario");
        if (usuario != null && usuario.getRoles() != null && 
            usuario.getRoles().stream().anyMatch(rol -> "ROLE_SUPER_ADMIN".equals(rol.getNombre()))) {
            return "redirect:/superAdmin/dashboard";
        }
        return "libro-reclamaciones";
    }
}
