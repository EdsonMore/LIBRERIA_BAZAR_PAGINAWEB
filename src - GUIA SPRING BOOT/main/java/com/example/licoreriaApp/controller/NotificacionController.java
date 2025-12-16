package com.example.licoreriaApp.controller;

import com.example.licoreriaApp.model.Notificacion;
import com.example.licoreriaApp.model.Usuario;
import com.example.licoreriaApp.service.UsuarioService;
import com.example.licoreriaApp.service.NotificacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notificaciones")
public class NotificacionController {
    
    @Autowired
    private NotificacionService notificacionService;
    
    @Autowired
    private UsuarioService usuarioService;
    
    @GetMapping("/usuario")
    public ResponseEntity<List<Notificacion>> obtenerNotificacionesDelUsuario(HttpSession session) {
        String email = (String) session.getAttribute("usuario");
        if (email == null) {
            return ResponseEntity.status(401).build();
        }
        
        Usuario usuario = usuarioService.obtenerPorCorreo(email).orElse(null);
        if (usuario == null) {
            return ResponseEntity.status(401).build();
        }
        List<Notificacion> notificaciones = notificacionService.obtenerNotificacionesDelUsuario(usuario);
        return ResponseEntity.ok(notificaciones);
    }
    
    @GetMapping("/no-leidas")
    public ResponseEntity<Map<String, Object>> obtenerNotificacionesNoLeidas(HttpSession session) {
        String email = (String) session.getAttribute("usuario");
        if (email == null) {
            return ResponseEntity.status(401).build();
        }
        
        Usuario usuario = usuarioService.obtenerPorCorreo(email).orElse(null);
        if (usuario == null) {
            return ResponseEntity.status(401).build();
        }
        List<Notificacion> notificacionesNoLeidas = notificacionService.obtenerNotificacionesNoLeidas(usuario);
        long cantidad = notificacionService.contarNotificacionesNoLeidas(usuario);
        
        Map<String, Object> response = new HashMap<>();
        response.put("notificaciones", notificacionesNoLeidas);
        response.put("cantidad", cantidad);
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/contar-no-leidas")
    public ResponseEntity<Map<String, Object>> contarNotificacionesNoLeidas(HttpSession session) {
        String email = (String) session.getAttribute("usuario");
        if (email == null) {
            return ResponseEntity.status(401).build();
        }
        
        Usuario usuario = usuarioService.obtenerPorCorreo(email).orElse(null);
        if (usuario == null) {
            return ResponseEntity.status(401).build();
        }
        long cantidad = notificacionService.contarNotificacionesNoLeidas(usuario);
        
        Map<String, Object> response = new HashMap<>();
        response.put("cantidad", cantidad);
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/{id}/marcar-leida")
    public ResponseEntity<Map<String, Object>> marcarComoLeida(
            @PathVariable Long id,
            HttpSession session) {
        String email = (String) session.getAttribute("usuario");
        if (email == null) {
            return ResponseEntity.status(401).build();
        }
        
        try {
            notificacionService.marcarComoLeida(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Notificación marcada como leída");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PostMapping("/marcar-todas-leidas")
    public ResponseEntity<Map<String, Object>> marcarTodasComoLeidas(HttpSession session) {
        String email = (String) session.getAttribute("usuario");
        if (email == null) {
            return ResponseEntity.status(401).build();
        }
        
        try {
            Usuario usuario = usuarioService.obtenerPorCorreo(email).orElse(null);
            if (usuario == null) {
                throw new RuntimeException("Usuario no encontrado");
            }
            notificacionService.marcarTodasComoLeidas(usuario);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Todas las notificaciones marcadas como leídas");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> eliminarNotificacion(
            @PathVariable Long id,
            HttpSession session) {
        String email = (String) session.getAttribute("usuario");
        if (email == null) {
            return ResponseEntity.status(401).build();
        }
        
        try {
            notificacionService.eliminarNotificacion(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Notificación eliminada");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}
