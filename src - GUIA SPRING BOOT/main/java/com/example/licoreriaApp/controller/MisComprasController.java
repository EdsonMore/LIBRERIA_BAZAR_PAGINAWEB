package com.example.licoreriaApp.controller;

import com.example.licoreriaApp.model.Compra;
import com.example.licoreriaApp.model.DetalleCompra;
import com.example.licoreriaApp.model.Usuario;
import com.example.licoreriaApp.service.CompraService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
public class MisComprasController {

    @Autowired
    private CompraService compraService;

    /*
     * @GetMapping("/mis-compras")
     * public String verMisCompras(HttpSession session, Model model) {
     * Usuario usuario = (Usuario) session.getAttribute("usuario");
     * List<Compra> compras;
     * if (usuario == null) {
     * // Usuario no autenticado: mostrar la vista pero con lista vacía
     * compras = java.util.Collections.emptyList();
     * model.addAttribute("usuarioAnonimo", true);
     * } else {
     * compras = compraService.obtenerComprasPorUsuario(usuario.getId());
     * model.addAttribute("usuarioAnonimo", false);
     * }
     * 
     * model.addAttribute("compras", compras);
     * return "mis-compras";
     * }
     * 
     */
    @GetMapping("/mis-compras/{id}/detalles")
    @ResponseBody
    public ResponseEntity<?> obtenerDetallesCompra(@PathVariable Long id, HttpSession session) {
        Usuario usuario = (Usuario) session.getAttribute("usuario");
        if (usuario == null) {
            return ResponseEntity.status(401).body("Usuario no autenticado");
        }

        try {
            Compra compra = compraService.obtenerCompraPorId(id);
            if (!compra.getUsuario().getId().equals(usuario.getId())) {
                return ResponseEntity.status(403).body("No autorizado");
            }

            Map<String, Object> result = new HashMap<>();
            result.put("id", compra.getId());
            result.put("fechaCompra", compra.getFechaCompra());
            result.put("estado", compra.getEstado().name());
            result.put("metodoPago", compra.getMetodoPago());
            result.put("direccionEntrega", compra.getDireccionEntrega());
            result.put("numeroSeguimiento", compra.getNumeroSeguimiento());
            result.put("subtotal", compra.getSubtotal());
            result.put("igv", compra.getIgv());
            result.put("total", compra.getTotal());

            List<Map<String, Object>> items = compra.getDetalles().stream().map((DetalleCompra d) -> {
                Map<String, Object> it = new HashMap<>();
                Map<String, Object> prod = new HashMap<>();
                if (d.getProducto() != null) {
                    prod.put("id", d.getProducto().getId());
                    prod.put("nombre", d.getProducto().getNombre());
                    prod.put("imagen", d.getProducto().getImagen());
                    prod.put("precio", d.getPrecioUnitario());
                }
                it.put("producto", prod);
                it.put("cantidad", d.getCantidad());
                it.put("subtotal", d.getSubtotal());
                return it;
            }).collect(Collectors.toList());

            result.put("items", items);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(404).body("Compra no encontrada");
        }
    }
}
