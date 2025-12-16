// src/main/java/com/example/licoreriaApp/controller/ProductoController.java
package com.example.licoreriaApp.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.example.licoreriaApp.model.Categoria;
import com.example.licoreriaApp.model.Producto;
import com.example.licoreriaApp.service.CategoriaService;
import com.example.licoreriaApp.service.ProductoService;
import com.example.licoreriaApp.service.ConfiguracionSistemaService;

@Controller
public class ProductoController {

    @Autowired
    private ProductoService productoService;

    @Autowired
    private CategoriaService categoriaService;

    @Autowired
    private ConfiguracionSistemaService configuracionSistemaService;

    /**
     * Muestra la página con el listado completo de productos
     */
    @GetMapping("/productos")
    public String listarProductos(Model model) {
        model.addAttribute("productos", productoService.listarTodos());
        model.addAttribute("categorias", categoriaService.listarActivas());
        return "productos";
    }

    /**
     * Endpoint API: Obtiene todas las categorías activas en JSON
     * Usado por el filtro dinámico de la página de productos
     */
    @GetMapping("/api/categorias/activas")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> obtenerCategoriasActivas() {
        try {
            List<Categoria> categorias = categoriaService.listarActivas();
            List<Map<String, Object>> response = new ArrayList<>();

            for (Categoria cat : categorias) {
                Map<String, Object> catData = new HashMap<>();
                catData.put("id", cat.getId());
                catData.put("nombre", cat.getNombre());
                catData.put("activa", cat.isActiva());
                response.add(catData);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error al obtener categorías activas: " + e.getMessage());
            return ResponseEntity.status(500).body(new ArrayList<>());
        }
    }

    /**
     * Muestra los detalles de un producto específico y productos relacionados
     */
    @GetMapping("/producto/{id}")
    public String detalleProducto(@PathVariable int id, Model model) {
        Producto producto = productoService.obtenerPorId(id);

        if (producto == null) {
            model.addAttribute("producto", null);
            return "detalles-productos";
        }

        model.addAttribute("producto", producto);

        // Obtener productos relacionados de la misma categoría (máximo 4)
        if (producto.getCategoria() != null) {
            List<Producto> relacionados = productoService
                    .buscarPorCategoria(producto.getCategoria().getId())
                    .stream()
                    .filter(p -> p.getId() != id && p.isDisponible())
                    .limit(4)
                    .toList();

            model.addAttribute("productosRelacionados", relacionados);
        }

        return "detalles-productos";
    }

    /**
     * Busca productos por nombre según el término de búsqueda
     */
    @GetMapping("/productos/buscar")
    public String buscarProductos(@RequestParam String query, Model model) {
        model.addAttribute("productos", productoService.buscarPorNombre(query));
        model.addAttribute("categorias", categoriaService.listarActivas());
        model.addAttribute("query", query);
        return "productos";
    }

    /**
     * Endpoint PÚBLICO API: Obtiene la configuración del sistema (IGV y Envío)
     * Accesible desde cualquier página (sin autenticación)
     * Usado por carrito.js para aplicar configuración dinámica
     */
    @GetMapping("/api/configuracion-sistema")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> obtenerConfiguracionPublica() {
        try {
            Map<String, Object> response = new HashMap<>();
            
            var config = configuracionSistemaService.obtenerConfiguracion();
            
            response.put("aplicarIGV", config.isAplicarIGV());
            response.put("porcentajeIGV", config.getPorcentajeIGV());
            response.put("aplicarEnvio", config.isAplicarEnvio());
            response.put("costoEnvio", config.getCostoEnvio());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // Si hay error, retorna valores por defecto
            Map<String, Object> defaults = new HashMap<>();
            defaults.put("aplicarIGV", true);
            defaults.put("porcentajeIGV", 18.0);
            defaults.put("aplicarEnvio", true);
            defaults.put("costoEnvio", 15.0);
            return ResponseEntity.ok(defaults);
        }
    }
}
