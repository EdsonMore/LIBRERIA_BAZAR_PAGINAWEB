// src/main/java/com/example/licoreriaApp/controller/HomeController.java
package com.example.licoreriaApp.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import com.example.licoreriaApp.service.ProductoService;

@Controller
public class HomeController {

    @Autowired
    private ProductoService productoService;

    /**
     * Maneja la petición GET para la página principal
     * Carga productos destacados (mejor reseñados o aleatorios si no hay reseñas)
     */
    @GetMapping("/")
    public String home(Model model) {
        // Cargar 8 productos destacados
        model.addAttribute("productos", productoService.obtenerProductosDestacados(8));
        return "home";
    }
}
