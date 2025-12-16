package com.example.licoreriaApp.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.licoreriaApp.model.Producto;
import com.example.licoreriaApp.repository.ProductoRepository;
import com.example.licoreriaApp.service.CarritoService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/carrito")
public class CarritoController {

    @Autowired
    private CarritoService carritoService;

    @Autowired
    private ProductoRepository productoRepository;

    @PostMapping("/agregar")
    public ResponseEntity<Map<String, Object>> agregarItem(
            HttpSession session,
            @RequestParam int cantidad,
            @RequestParam(required = false) Integer productoId) {

        System.out.println("=== AGREGAR ITEM ===");
        System.out.println("ProductoId param: " + productoId);
        System.out.println("Cantidad: " + cantidad);

        // Restricción: SuperAdmin no puede agregar al carrito
        com.example.licoreriaApp.model.Usuario usuario = (com.example.licoreriaApp.model.Usuario) session.getAttribute("usuario");
        if (usuario != null && usuario.getRoles() != null && 
            usuario.getRoles().stream().anyMatch(rol -> "ROLE_SUPER_ADMIN".equals(rol.getNombre()))) {
            return ResponseEntity.status(403).body(Map.of(
                "success", false,
                "message", "Los administradores no pueden usar el carrito de compras"));
        }

        try {
            // Si no viene productoId como parámetro, intentar leer del body
            if (productoId == null) {
                System.out.println("⚠️ ProductoId no encontrado en parámetros");
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Se requiere el ID del producto"));
            }

            // Buscar el producto
            Producto producto = productoRepository.findById(productoId)
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

            Long usuarioId = (Long) session.getAttribute("usuarioId");
            System.out.println("UsuarioId en sesión: " + usuarioId);

            if (usuarioId == null) {
                // Usuario anónimo
                Map<Integer, Integer> carritoAnonimo = (Map<Integer, Integer>) session.getAttribute("carritoAnonimo");
                if (carritoAnonimo == null) {
                    carritoAnonimo = new HashMap<>();
                }

                carritoAnonimo.put(productoId, carritoAnonimo.getOrDefault(productoId, 0) + cantidad);
                session.setAttribute("carritoAnonimo", carritoAnonimo);

                int cantidadTotal = carritoAnonimo.values().stream()
                        .mapToInt(Integer::intValue)
                        .sum();

                System.out.println("✅ Producto agregado al carrito anónimo. Total items: " + cantidadTotal);

                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Item agregado",
                        "cantidad", cantidadTotal));
            }

            // Usuario autenticado
            carritoService.agregarItem(usuarioId, producto, cantidad);
            int cantidadTotal = carritoService.getCantidadTotal(usuarioId);

            System.out.println("✅ Producto agregado al carrito del usuario. Total items: " + cantidadTotal);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Item agregado correctamente",
                    "cantidad", cantidadTotal));
        } catch (Exception e) {
            System.err.println("❌ Error al agregar item: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()));
        }
    }

    @PutMapping("/actualizar")
    public ResponseEntity<Map<String, Object>> actualizarCantidad(
            HttpSession session,
            @RequestParam int productoId,
            @RequestParam int cantidad) {
        // Restricción: SuperAdmin no puede actualizar carrito
        com.example.licoreriaApp.model.Usuario usuario = (com.example.licoreriaApp.model.Usuario) session.getAttribute("usuario");
        if (usuario != null && usuario.getRoles() != null && 
            usuario.getRoles().stream().anyMatch(rol -> "ROLE_SUPER_ADMIN".equals(rol.getNombre()))) {
            return ResponseEntity.status(403).body(Map.of(
                "success", false,
                "message", "Los administradores no pueden usar el carrito de compras"));
        }
        
        try {
            Long usuarioId = (Long) session.getAttribute("usuarioId");

            if (usuarioId == null) {
                // Usuario anónimo
                Map<Integer, Integer> carritoAnonimo = (Map<Integer, Integer>) session.getAttribute("carritoAnonimo");
                if (carritoAnonimo == null) {
                    carritoAnonimo = new HashMap<>();
                    session.setAttribute("carritoAnonimo", carritoAnonimo);
                }

                if (cantidad <= 0) {
                    carritoAnonimo.remove(productoId);
                } else {
                    carritoAnonimo.put(productoId, cantidad);
                }

                session.setAttribute("carritoAnonimo", carritoAnonimo);
                int cantidadTotal = carritoAnonimo.values().stream()
                        .mapToInt(Integer::intValue)
                        .sum();

                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Cantidad actualizada",
                        "cantidad", cantidadTotal));
            }

            // Usuario autenticado
            carritoService.actualizarCantidad(usuarioId, productoId, cantidad);
            int cantidadTotal = carritoService.getCantidadTotal(usuarioId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Cantidad actualizada",
                    "cantidad", cantidadTotal));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()));
        }
    }

    @DeleteMapping("/eliminar")
    public ResponseEntity<Map<String, Object>> eliminarItem(
            HttpSession session,
            @RequestParam int productoId) {
        // Restricción: SuperAdmin no puede eliminar del carrito
        com.example.licoreriaApp.model.Usuario usuario = (com.example.licoreriaApp.model.Usuario) session.getAttribute("usuario");
        if (usuario != null && usuario.getRoles() != null && 
            usuario.getRoles().stream().anyMatch(rol -> "ROLE_SUPER_ADMIN".equals(rol.getNombre()))) {
            return ResponseEntity.status(403).body(Map.of(
                "success", false,
                "message", "Los administradores no pueden usar el carrito de compras"));
        }
        
        try {
            Long usuarioId = (Long) session.getAttribute("usuarioId");

            if (usuarioId == null) {
                // Usuario anónimo
                Map<Integer, Integer> carritoAnonimo = (Map<Integer, Integer>) session.getAttribute("carritoAnonimo");
                if (carritoAnonimo == null) {
                    carritoAnonimo = new HashMap<>();
                }

                carritoAnonimo.remove(productoId);
                session.setAttribute("carritoAnonimo", carritoAnonimo);

                int cantidadTotal = carritoAnonimo.values().stream()
                        .mapToInt(Integer::intValue)
                        .sum();

                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Item eliminado",
                        "cantidad", cantidadTotal));
            }

            // Usuario autenticado
            carritoService.eliminarItem(usuarioId, productoId);
            int cantidadTotal = carritoService.getCantidadTotal(usuarioId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Item eliminado",
                    "cantidad", cantidadTotal));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()));
        }
    }

    @DeleteMapping("/limpiar")
    public ResponseEntity<Map<String, Object>> limpiarCarrito(HttpSession session) {
        // Restricción: SuperAdmin no puede limpiar carrito
        com.example.licoreriaApp.model.Usuario usuario = (com.example.licoreriaApp.model.Usuario) session.getAttribute("usuario");
        if (usuario != null && usuario.getRoles() != null && 
            usuario.getRoles().stream().anyMatch(rol -> "ROLE_SUPER_ADMIN".equals(rol.getNombre()))) {
            return ResponseEntity.status(403).body(Map.of(
                "success", false,
                "message", "Los administradores no pueden usar el carrito de compras"));
        }
        
        try {
            Long usuarioId = (Long) session.getAttribute("usuarioId");

            if (usuarioId == null) {
                // Usuario anónimo - limpiar sesión
                session.removeAttribute("carritoAnonimo");
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Carrito limpiado",
                        "cantidad", 0));
            }

            // Usuario autenticado
            carritoService.limpiarCarrito(usuarioId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Carrito limpiado",
                    "cantidad", 0));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()));
        }
    }

    @GetMapping("/cantidad")
    public ResponseEntity<Integer> obtenerCantidadTotal(HttpSession session) {
        try {
            Long usuarioId = (Long) session.getAttribute("usuarioId");

            if (usuarioId == null) {
                // Usuario anónimo
                Map<Integer, Integer> carritoAnonimo = (Map<Integer, Integer>) session.getAttribute("carritoAnonimo");
                int cantidad = (carritoAnonimo == null) ? 0
                        : carritoAnonimo.values().stream()
                                .mapToInt(Integer::intValue)
                                .sum();
                return ResponseEntity.ok(cantidad);
            }

            // Usuario autenticado
            int cantidad = carritoService.getCantidadTotal(usuarioId);
            return ResponseEntity.ok(cantidad);
        } catch (Exception e) {
            return ResponseEntity.ok(0);
        }
    }

    @GetMapping("/total")
    public ResponseEntity<?> obtenerTotal(HttpSession session) {
        try {
            Long usuarioId = (Long) session.getAttribute("usuarioId");

            if (usuarioId == null) {
                // Usuario anónimo
                Map<Integer, Integer> carritoAnonimo = (Map<Integer, Integer>) session.getAttribute("carritoAnonimo");
                if (carritoAnonimo == null || carritoAnonimo.isEmpty()) {
                    return ResponseEntity.ok(0.0);
                }

                double subtotal = 0.0;
                for (Map.Entry<Integer, Integer> entry : carritoAnonimo.entrySet()) {
                    Producto p = productoRepository.findById(entry.getKey()).orElse(null);
                    if (p != null) {
                        subtotal += p.getPrecio() * entry.getValue();
                    }
                }

                double igv = subtotal * 0.18;
                double total = subtotal + igv + 15.0;
                return ResponseEntity.ok(total);
            }

            // Usuario autenticado
            double total = carritoService.calcularTotal(usuarioId);
            return ResponseEntity.ok(total);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Nuevo endpoint: obtener lista de items con detalles para renderizado dinámico
    @GetMapping("/items")
    public ResponseEntity<?> obtenerItems(HttpSession session) {
        try {
            Long usuarioId = (Long) session.getAttribute("usuarioId");

            if (usuarioId == null) {
                // Usuario anónimo: leer del atributo de sesión carritoAnonimo
                Map<Integer, Integer> carritoAnonimo = (Map<Integer, Integer>) session.getAttribute("carritoAnonimo");
                if (carritoAnonimo == null || carritoAnonimo.isEmpty()) {
                    return ResponseEntity.ok(List.of());
                }

                List<Map<String, Object>> items = new java.util.ArrayList<>();
                for (Map.Entry<Integer, Integer> entry : carritoAnonimo.entrySet()) {
                    Producto p = productoRepository.findById(entry.getKey()).orElse(null);
                    if (p != null) {
                        Map<String, Object> m = new HashMap<>();
                        m.put("id", p.getId());
                        m.put("nombre", p.getNombre());
                        m.put("precio", p.getPrecio());
                        m.put("imagen", p.getImagen());
                        m.put("stock", p.getStock());
                        m.put("cantidad", entry.getValue());
                        items.add(m);
                    }
                }

                return ResponseEntity.ok(items);
            }

            // Usuario autenticado: usar el servicio para obtener Items
            java.util.List<com.example.licoreriaApp.model.ItemCarrito> itemsObj = carritoService.obtenerItems(usuarioId);
            List<Map<String, Object>> items = new java.util.ArrayList<>();
            if (itemsObj != null) {
                for (com.example.licoreriaApp.model.ItemCarrito ic : itemsObj) {
                    Producto p = ic.getProducto();
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", p.getId());
                    m.put("nombre", p.getNombre());
                    m.put("precio", p.getPrecio());
                    m.put("imagen", p.getImagen());
                    m.put("stock", p.getStock());
                    m.put("cantidad", ic.getCantidad());
                    items.add(m);
                }
            }

            return ResponseEntity.ok(items);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}