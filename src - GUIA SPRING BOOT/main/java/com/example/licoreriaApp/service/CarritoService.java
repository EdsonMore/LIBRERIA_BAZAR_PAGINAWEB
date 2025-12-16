// src/main/java/com/example/service/CarritoService.java
package com.example.licoreriaApp.service;

import java.util.List;

import com.example.licoreriaApp.model.ItemCarrito;
import com.example.licoreriaApp.model.Producto;

public interface CarritoService {

    void agregarItem(Long usuarioId, Producto producto, int cantidad);

    void actualizarCantidad(Long usuarioId, int productoId, int nuevaCantidad);

    void eliminarItem(Long usuarioId, int productoId);

    void limpiarCarrito(Long usuarioId);

    List<ItemCarrito> obtenerItems(Long usuarioId);

    double calcularSubtotal(Long usuarioId);

    double calcularTotal(Long usuarioId);

    int getCantidadTotal(Long usuarioId);
}
