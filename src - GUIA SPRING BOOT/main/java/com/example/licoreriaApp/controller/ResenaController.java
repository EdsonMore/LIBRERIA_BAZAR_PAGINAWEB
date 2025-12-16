// src/main/java/com/example/licoreriaApp/controller/ResenaController.java
package com.example.licoreriaApp.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import com.example.licoreriaApp.model.Resena;
import com.example.licoreriaApp.model.Usuario;
import com.example.licoreriaApp.service.ResenaService;
import jakarta.servlet.http.HttpSession;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
public class ResenaController {

    @Autowired
    private ResenaService resenaService;

    // ========== PÁGINAS HTML ==========
    @GetMapping("/mis-resenas")
    public String mostrarMisResenas(HttpSession session, Model model) {
        Usuario usuario = (Usuario) session.getAttribute("usuario");
        if (usuario == null) {
            model.addAttribute("error", "Debe iniciar sesión para ver sus reseñas");
            model.addAttribute("resenas", new ArrayList<>());
            return "mis-resenas";
        }

        try {
            List<Resena> resenas = resenaService.obtenerResenasPorUsuario(usuario.getId());

            if (resenas == null) {
                resenas = new ArrayList<>();
            }

            // Debug mejorado
            System.out.println("=== DEBUG RESEÑAS ===");
            System.out.println("Usuario ID: " + usuario.getId());
            System.out.println("Total reseñas: " + resenas.size());

            model.addAttribute("resenas", resenas);

        } catch (Exception e) {
            System.err.println("Error en mis-resenas: " + e.getMessage());
            e.printStackTrace();
            model.addAttribute("errorMessage", "Error al cargar las reseñas: " + e.getMessage());
            model.addAttribute("resenas", new ArrayList<>());
        }

        return "mis-resenas";
    }

    // Nueva ruta para compras que pueden ser reseñadas
    @GetMapping("/mis-compras-resena")
    public String mostrarComprasParaResena(HttpSession session, Model model) {
        System.out.println("=== MIS-COMPRAS-RESENA INICIADO ===");
        
        Usuario usuario = (Usuario) session.getAttribute("usuario");
        if (usuario == null) {
            System.out.println("Sin usuario, redirigiendo a login");
            return "redirect:/login";
        }
        
        System.out.println("Usuario: " + usuario.getId());
        
        List<Map<String, Object>> compras = new ArrayList<>();
        
        try {
            System.out.println("Llamando a obtenerComprasPendientesDeResena...");
            compras = resenaService.obtenerComprasPendientesDeResena(usuario.getId());
            System.out.println("Compras obtenidas: " + (compras != null ? compras.size() : "null"));
        } catch (Exception e) {
            System.err.println("❌ EXCEPTION: " + e.getClass().getName() + " - " + e.getMessage());
            e.printStackTrace();
        }
        
        if (compras == null) {
            System.out.println("Compras es null, usando lista vacía");
            compras = new ArrayList<>();
        }
        
        System.out.println("Agregando atributos al modelo...");
        model.addAttribute("compras", compras);
        model.addAttribute("usuario", usuario);
        
        System.out.println("Retornando template: mis-compras-resena");
        return "mis-compras-resena";
    }

    // ========== ENDPOINTS API ==========
    @GetMapping("/api/resenas/producto/{productoId}")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> obtenerResenasPorProducto(@PathVariable Integer productoId) {
        try {
            List<Resena> resenas = resenaService.obtenerResenasAprobadasPorProducto(productoId);
            
            // Convertir a DTOs para evitar problemas de lazy loading
            List<Map<String, Object>> resenasDTO = new ArrayList<>();
            for (Resena resena : resenas) {
                Map<String, Object> resenaMap = new HashMap<>();
                resenaMap.put("id", resena.getId());
                resenaMap.put("calificacion", resena.getCalificacion());
                resenaMap.put("comentario", resena.getComentario());
                resenaMap.put("estado", resena.getEstado());
                resenaMap.put("fecha", resena.getFecha());
                
                if (resena.getUsuario() != null) {
                    Map<String, Object> usuarioMap = new HashMap<>();
                    usuarioMap.put("id", resena.getUsuario().getId());
                    usuarioMap.put("nombres", resena.getUsuario().getNombres());
                    usuarioMap.put("apellidoPaterno", resena.getUsuario().getApellidoPaterno());
                    resenaMap.put("usuario", usuarioMap);
                }
                
                if (resena.getProducto() != null) {
                    Map<String, Object> productoMap = new HashMap<>();
                    productoMap.put("id", resena.getProducto().getId());
                    productoMap.put("nombre", resena.getProducto().getNombre());
                    resenaMap.put("producto", productoMap);
                }
                
                resenasDTO.add(resenaMap);
            }
            
            return ResponseEntity.ok(resenasDTO);
        } catch (Exception e) {
            System.err.println("Error al obtener reseñas: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/api/resenas/producto/{productoId}/stats")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> obtenerEstadisticasResenas(@PathVariable Integer productoId) {
        try {
            List<Resena> resenas = resenaService.obtenerResenasAprobadasPorProducto(productoId);
            Map<String, Object> stats = new HashMap<>();

            if (resenas.isEmpty()) {
                stats.put("total", 0);
                stats.put("promedio", 0.0);
            } else {
                double promedio = resenas.stream()
                        .mapToInt(Resena::getCalificacion)
                        .average()
                        .orElse(0.0);
                stats.put("total", resenas.size());
                stats.put("promedio", Math.round(promedio * 10.0) / 10.0);
            }

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/api/resenas")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> crearResena(@RequestBody Map<String, Object> resenaData, HttpSession session) {
        try {
            Usuario usuario = (Usuario) session.getAttribute("usuario");
            if (usuario == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("mensaje", "Debe iniciar sesión");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }
            
            // Restricción: SuperAdmin no puede crear reseñas
            if (usuario.getRoles() != null && 
                usuario.getRoles().stream().anyMatch(rol -> "ROLE_SUPER_ADMIN".equals(rol.getNombre()))) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("mensaje", "Los administradores no pueden crear reseñas");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
            }

            // Convertir y validar productoId
            Integer productoId = null;
            Object productoIdObj = resenaData.get("productoId");
            if (productoIdObj != null) {
                productoId = productoIdObj instanceof Integer ? (Integer) productoIdObj : Integer.parseInt(productoIdObj.toString());
            }
            
            // Convertir y validar calificacion
            Integer calificacion = null;
            Object calificacionObj = resenaData.get("calificacion");
            if (calificacionObj != null) {
                calificacion = calificacionObj instanceof Integer ? (Integer) calificacionObj : Integer.parseInt(calificacionObj.toString());
            }
            
            String comentario = (String) resenaData.get("comentario");

            // Validaciones
            if (productoId == null || calificacion == null || comentario == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("mensaje", "Datos incompletos");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            if (calificacion < 1 || calificacion > 5) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("mensaje", "Calificación debe ser entre 1 y 5");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            if (comentario.trim().length() < 10) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("mensaje", "El comentario debe tener al menos 10 caracteres");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // ===== VALIDACIÓN NUEVA: Verificar que el usuario compró el producto =====
            if (!resenaService.puedeResenaProducto(usuario.getId(), productoId)) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("mensaje", "No puedes reseñar este producto. Solo puedes reseñar productos que hayas comprado y recibido.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
            }

            // Crear reseña
            Resena nuevaResena = resenaService.crearResena(
                    usuario.getId(),
                    productoId,
                    calificacion,
                    comentario.trim());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("id", nuevaResena.getId());
            response.put("mensaje", "Reseña creada exitosamente - En proceso de moderación");
            response.put("estado", nuevaResena.getEstado());
            response.put("fecha", nuevaResena.getFecha());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("mensaje", "Error al crear reseña: " + e.getMessage());
            System.err.println("Error en /api/resenas POST: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @DeleteMapping("/api/resenas/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> eliminarResena(@PathVariable Long id, HttpSession session) {
        try {
            Usuario usuario = (Usuario) session.getAttribute("usuario");
            if (usuario == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("mensaje", "Debe iniciar sesión");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }

            // Verificar que la reseña pertenece al usuario
            Resena resena = resenaService.obtenerPorId(id)
                    .orElseThrow(() -> new RuntimeException("Reseña no encontrada"));

            if (!resena.getUsuario().getId().equals(usuario.getId())) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("mensaje", "No tiene permisos para eliminar esta reseña");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
            }

            resenaService.eliminarResena(id);
            Map<String, Object> successResponse = new HashMap<>();
            successResponse.put("success", true);
            successResponse.put("mensaje", "Reseña eliminada exitosamente");
            return ResponseEntity.ok(successResponse);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("mensaje", "Error al eliminar reseña: " + e.getMessage());
            System.err.println("Error en /api/resenas DELETE: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}