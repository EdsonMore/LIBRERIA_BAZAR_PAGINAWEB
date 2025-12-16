// CarritoViewController.java - VERSIÓN MEJORADA
package com.example.licoreriaApp.controller;

import com.example.licoreriaApp.model.ItemCarrito;
import com.example.licoreriaApp.model.Usuario;
import com.example.licoreriaApp.service.CarritoService;
import com.example.licoreriaApp.model.Producto;
import com.example.licoreriaApp.repository.ProductoRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

@Controller
public class CarritoViewController {

    @Autowired
    private CarritoService carritoService;

    @Autowired
    private ProductoRepository productoRepository;

    private static final double TASA_IGV = 0.18;
    private static final double COSTO_ENVIO = 15.00;

    @GetMapping("/carrito")
    public String mostrarCarrito(HttpSession session, Model model) {
        System.out.println("=== DEBUG /carrito ===");

        Usuario usuario = (Usuario) session.getAttribute("usuario");
        
        // Restricción: SuperAdmin no puede acceder al carrito
        if (usuario != null && usuario.getRoles() != null && 
            usuario.getRoles().stream().anyMatch(rol -> "ROLE_SUPER_ADMIN".equals(rol.getNombre()))) {
            model.addAttribute("error", "Los administradores no pueden acceder al carrito de compras");
            return "redirect:/acceso-denegado";
        }
        
        Long usuarioId = (Long) session.getAttribute("usuarioId");

        System.out.println("Usuario en sesión: " + (usuario != null ? usuario.getCorreo() : "null"));
        System.out.println("UsuarioId en sesión: " + usuarioId);

        Map<String, Object> carritoData = new HashMap<>();

        if (usuario == null) {
            // Usuario NO autenticado - carrito anónimo
            System.out.println("🔓 Cargando carrito anónimo");
            Map<Integer, Integer> carritoAnonimo = (Map<Integer, Integer>) session.getAttribute("carritoAnonimo");
            System.out.println("Items en sesión: " + (carritoAnonimo != null ? carritoAnonimo.size() : 0));

            // IMPORTANTE: Inicializar lista vacía por defecto
            List<ItemCarrito> itemsAnonimos = new ArrayList<>();

            if (carritoAnonimo != null && !carritoAnonimo.isEmpty()) {
                for (Map.Entry<Integer, Integer> entry : carritoAnonimo.entrySet()) {
                    Producto producto = productoRepository.findById(entry.getKey()).orElse(null);
                    if (producto != null) {
                        ItemCarrito item = new ItemCarrito();
                        item.setProducto(producto);
                        item.setCantidad(entry.getValue());
                        item.actualizarSubtotal();
                        itemsAnonimos.add(item);
                    }
                }
            }

            carritoData.put("items", itemsAnonimos);
            carritoData.put("estaVacio", itemsAnonimos.isEmpty());

            if (!itemsAnonimos.isEmpty()) {
                double subtotal = itemsAnonimos.stream()
                        .mapToDouble(ItemCarrito::getSubtotal)
                        .sum();
                double igv = subtotal * TASA_IGV;
                double total = subtotal + igv + COSTO_ENVIO;

                carritoData.put("subtotal", subtotal);
                carritoData.put("igv", igv);
                carritoData.put("costoEnvio", COSTO_ENVIO);
                carritoData.put("total", total);
            } else {
                carritoData.put("subtotal", 0.0);
                carritoData.put("igv", 0.0);
                carritoData.put("costoEnvio", 0.0);
                carritoData.put("total", 0.0);
            }

            model.addAttribute("carrito", carritoData);
            model.addAttribute("usuario", null);
            return "carrito";
        }

        // Usuario AUTENTICADO - carrito de BD
        try {
            List<ItemCarrito> items = carritoService.obtenerItems(usuario.getId());
            carritoData.put("items", items != null ? items : new ArrayList<>());
            carritoData.put("estaVacio", items == null || items.isEmpty());

            if (items != null && !items.isEmpty()) {
                double subtotal = carritoService.calcularSubtotal(usuario.getId());
                double igv = subtotal * TASA_IGV;
                double total = subtotal + igv + COSTO_ENVIO;

                carritoData.put("subtotal", subtotal);
                carritoData.put("igv", igv);
                carritoData.put("costoEnvio", COSTO_ENVIO);
                carritoData.put("total", total);
            } else {
                carritoData.put("subtotal", 0.0);
                carritoData.put("igv", 0.0);
                carritoData.put("costoEnvio", 0.0);
                carritoData.put("total", 0.0);
            }
        } catch (Exception e) {
            // En caso de error, devolver carrito vacío
            carritoData.put("items", new ArrayList<>());
            carritoData.put("estaVacio", true);
            carritoData.put("subtotal", 0.0);
            carritoData.put("igv", 0.0);
            carritoData.put("costoEnvio", 0.0);
            carritoData.put("total", 0.0);
        }

        model.addAttribute("carrito", carritoData);
        model.addAttribute("usuario", usuario);

        return "carrito";
    }
}