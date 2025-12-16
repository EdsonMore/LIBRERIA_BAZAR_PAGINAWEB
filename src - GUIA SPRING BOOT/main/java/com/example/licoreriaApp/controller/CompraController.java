// src/main/java/com/example/licoreriaApp/controller/CompraController.java
package com.example.licoreriaApp.controller;

import com.example.licoreriaApp.model.Compra;
import com.example.licoreriaApp.model.Usuario;
import com.example.licoreriaApp.service.CompraService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
public class CompraController {

    @Autowired
    private CompraService compraService;

    @PostMapping("/procesar-pago")
    public String procesarPago(
            HttpSession session,
            @RequestParam String nombre,
            @RequestParam String apellido,
            @RequestParam String email,
            @RequestParam String celular,
            @RequestParam String direccion,
            @RequestParam String metodoPago,
            Model model) {

        try {
            Long usuarioId = (Long) session.getAttribute("usuarioId");

            if (usuarioId == null) {
                model.addAttribute("error", "Debes iniciar sesión para realizar una compra");
                return "redirect:/login";
            }

            // Realizar la compra
            Compra compra = compraService.realizarCompra(usuarioId, metodoPago, direccion);

            // Redirigir a confirmación
            return "redirect:/compra/confirmacion/" + compra.getId();

        } catch (Exception e) {
            model.addAttribute("error", "Error al procesar el pago: " + e.getMessage());
            return "redirect:/carrito";
        }
    }

    @GetMapping("/compra/confirmacion/{id}")
    public String mostrarConfirmacion(@PathVariable Long id, Model model, HttpSession session) {
        try {
            Usuario usuario = (Usuario) session.getAttribute("usuario");
            if (usuario == null) {
                return "redirect:/login";
            }

            Compra compra = compraService.obtenerCompraPorId(id);

            // Verificar que la compra pertenece al usuario
            if (!compra.getUsuario().getId().equals(usuario.getId())) {
                return "redirect:/";
            }

            model.addAttribute("compra", compra);
            return "confirmacion-compra";

        } catch (Exception e) {
            model.addAttribute("error", "Compra no encontrada");
            return "redirect:/";
        }
    }

    @GetMapping("/mis-compras")
    public String mostrarMisCompras(Model model, HttpSession session) {
        Usuario usuario = (Usuario) session.getAttribute("usuario");

        if (usuario == null) {
            return "redirect:/login";
        }
        
        // Restricción: SuperAdmin no puede ver compras de cliente
        if (usuario.getRoles() != null && 
            usuario.getRoles().stream().anyMatch(rol -> "ROLE_SUPER_ADMIN".equals(rol.getNombre()))) {
            return "redirect:/superAdmin/compras";
        }

        List<Compra> compras = compraService.obtenerComprasPorUsuario(usuario.getId());
        model.addAttribute("compras", compras);

        return "mis-compras";
    }

    @GetMapping("/compra/detalle/{id}")
    public String mostrarDetalleCompra(@PathVariable Long id, Model model, HttpSession session) {
        try {
            Usuario usuario = (Usuario) session.getAttribute("usuario");
            if (usuario == null) {
                return "redirect:/login";
            }

            Compra compra = compraService.obtenerCompraPorId(id);

            // Verificar que la compra pertenece al usuario
            if (!compra.getUsuario().getId().equals(usuario.getId())) {
                return "redirect:/";
            }

            model.addAttribute("compra", compra);
            return "detalle-compra";

        } catch (Exception e) {
            model.addAttribute("error", "Compra no encontrada");
            return "redirect:/mis-compras";
        }
    }

    @GetMapping("/compras/{id}/detalle")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> obtenerDetalleCompraJSON(
            @PathVariable Long id,
            HttpSession session) {
        try {
            Usuario usuario = (Usuario) session.getAttribute("usuario");
            if (usuario == null) {
                return ResponseEntity.status(401).build();
            }

            Compra compra = compraService.obtenerCompraPorId(id);

            // Verificar que la compra pertenece al usuario
            if (!compra.getUsuario().getId().equals(usuario.getId())) {
                return ResponseEntity.status(403).build();
            }

            Map<String, Object> response = new HashMap<>();
            response.put("id", compra.getId());
            response.put("fechaCompra", compra.getFechaCompra());
            response.put("estado", compra.getEstado());
            response.put("metodoPago", compra.getMetodoPago());
            response.put("direccionEntrega", compra.getDireccionEntrega());
            response.put("subtotal", compra.getSubtotal());
            response.put("igv", compra.getIgv());
            response.put("costoEnvio", compra.getCostoEnvio());
            response.put("total", compra.getTotal());
            response.put("numeroSeguimiento", compra.getNumeroSeguimiento());
            response.put("motivoRechazo", compra.getMotivoRechazo());
            response.put("igvActivo", compra.isIgvActivo());
            response.put("envioActivo", compra.isEnvioActivo());
            
            List<Map<String, Object>> detalles = new java.util.ArrayList<>();
            for (com.example.licoreriaApp.model.DetalleCompra detalle : compra.getDetalles()) {
                Map<String, Object> det = new HashMap<>();
                det.put("productoNombre", detalle.getProducto().getNombre());
                det.put("productoImagen", detalle.getProducto().getImagen());
                det.put("cantidad", detalle.getCantidad());
                det.put("precioUnitario", detalle.getPrecioUnitario());
                det.put("subtotal", detalle.getSubtotal());
                detalles.add(det);
            }
            response.put("detalles", detalles);
            
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    // ============================================================================
    // 🔥 NUEVO: API REST para compras de usuarios anónimos
    // ============================================================================

    @PostMapping("/api/compras/realizar-guest")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> realizarCompraGuest(
            @RequestBody Map<String, Object> payload,
            HttpSession session) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Extraer datos del cliente
            String nombres = (String) payload.get("nombres");
            String apellido = (String) payload.get("apellido");
            String correo = (String) payload.get("correo");
            String telefono = (String) payload.get("telefono");
            String direccion = (String) payload.get("direccion");
            String metodoPago = (String) payload.get("metodoPago");

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> items = (List<Map<String, Object>>) payload.get("items");

            // Validaciones básicas
            if (nombres == null || nombres.trim().isEmpty()) {
                throw new IllegalArgumentException("El nombre es obligatorio");
            }
            if (correo == null || correo.trim().isEmpty()) {
                throw new IllegalArgumentException("El correo es obligatorio");
            }
            if (direccion == null || direccion.trim().isEmpty()) {
                throw new IllegalArgumentException("La dirección es obligatoria");
            }
            if (items == null || items.isEmpty()) {
                throw new IllegalArgumentException("El carrito está vacío");
            }

            // Verificar si el usuario está autenticado
            Usuario usuario = (Usuario) session.getAttribute("usuario");
            Long usuarioId = (Long) session.getAttribute("usuarioId");

            Long compraId;

            if (usuario != null && usuarioId != null) {
                // Usuario autenticado: usar el servicio normal de compra
                Compra compra = compraService.realizarCompra(usuarioId, metodoPago, direccion);
                compraId = compra.getId();
                
                System.out.println("✅ Compra realizada por usuario autenticado:");
                System.out.println("   Usuario ID: " + usuarioId);
                System.out.println("   Compra ID: " + compraId);
            } else {
                // Usuario anónimo: crear compra directa en la base de datos
                Compra compra = compraService.realizarCompraDirecta(
                    nombres, apellido, correo, telefono, direccion, metodoPago, items
                );
                compraId = compra.getId();
                
                System.out.println("✅ Compra anónima guardada en BD:");
                System.out.println("   Cliente: " + nombres + " " + apellido);
                System.out.println("   Correo: " + correo);
                System.out.println("   Compra ID: " + compraId);
                System.out.println("   Items guardados: " + compra.getDetalles().size());
                
                // Limpiar carrito de sesión
                session.removeAttribute("carritoAnonimo");
            }

            response.put("success", true);
            response.put("message", "Compra registrada exitosamente");
            response.put("compraId", compraId);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}