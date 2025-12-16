// src/main/java/com/example/licoreriaApp/service/ProductoService.java
package com.example.licoreriaApp.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.licoreriaApp.model.Producto;

public interface ProductoService {

    List<Producto> listarTodos();

    Producto obtenerPorId(int id);

    Producto guardar(Producto producto);

    void eliminar(int id);

    List<Producto> buscarPorCategoria(int categoriaId);

    List<Producto> buscarPorNombre(String nombre);

    // Métodos adicionales para el dashboard
    long contarTotal();

    long contarDisponibles();

    double calcularValorStockTotal();

    // Nuevos métodos para paginación y filtros
    Page<Producto> obtenerProductosPaginados(Pageable pageable);

    Page<Producto> buscarPorNombrePaginado(String nombre, Pageable pageable);

    List<Producto> buscarPorCategoriaYDisponibilidad(Integer categoriaId, Boolean disponible);

    // Métodos para gestión de stock
    void actualizarStock(int productoId, int cantidad);

    boolean verificarStockSuficiente(int productoId, int cantidad);

    // Método para obtener productos destacados
    List<Producto> obtenerProductosDestacados(int limite);
}