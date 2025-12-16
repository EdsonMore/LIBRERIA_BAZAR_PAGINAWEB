// src/main/java/com/example/service/CompraService.java
package com.example.licoreriaApp.service;

import com.example.licoreriaApp.model.Compra;
import com.example.licoreriaApp.model.EstadoCompra;
import java.util.List;
import java.util.Map;

public interface CompraService {

    Compra realizarCompra(Long usuarioId, String metodoPago, String direccionEntrega);

    /**
     * Realiza una compra directa con datos del cliente y items específicos
     * (útil para compras anónimas o sin usuario autenticado)
     */
    Compra realizarCompraDirecta(
            String nombres, 
            String apellido, 
            String correo, 
            String telefono, 
            String direccion, 
            String metodoPago,
            List<Map<String, Object>> items);

    Compra obtenerCompraPorId(Long compraId);

    List<Compra> obtenerComprasPorUsuario(Long usuarioId);

    Compra actualizarEstado(Long compraId, EstadoCompra nuevoEstado);

    Compra actualizarEstadoConValidacion(Long compraId, EstadoCompra nuevoEstado, String motivoRechazo);

    Compra rechazarCompra(Long compraId, String motivo);

    Compra asignarNumeroSeguimiento(Long compraId, String numeroSeguimiento);

    List<Compra> obtenerComprasPorEstado(EstadoCompra estado);

    List<Compra> obtenerTodasLasCompras();

    Map<String, Object> obtenerMetricasVentas();
}
