package com.example.licoreriaApp.util;

import com.example.licoreriaApp.model.EstadoCompra;
import java.util.*;

/**
 * Validador de transiciones de estado de compra
 * Implementa las reglas de negocio para el flujo de estados
 */
public class EstadoCompraValidator {

    // Mapa de transiciones permitidas: estadoActual -> lista de estados permitidos
    private static final Map<EstadoCompra, Set<EstadoCompra>> TRANSICIONES_PERMITIDAS = new HashMap<>();

    static {
        // PENDIENTE puede ir a CONFIRMADA o RECHAZADA
        TRANSICIONES_PERMITIDAS.put(EstadoCompra.PENDIENTE, 
            new HashSet<>(Arrays.asList(EstadoCompra.CONFIRMADA, EstadoCompra.RECHAZADA)));

        // CONFIRMADA puede ir a DESPACHADO o RECHAZADA
        TRANSICIONES_PERMITIDAS.put(EstadoCompra.CONFIRMADA, 
            new HashSet<>(Arrays.asList(EstadoCompra.DESPACHADO, EstadoCompra.RECHAZADA)));

        // DESPACHADO solo puede ir a ENVIADA
        TRANSICIONES_PERMITIDAS.put(EstadoCompra.DESPACHADO, 
            new HashSet<>(Collections.singletonList(EstadoCompra.ENVIADA)));

        // ENVIADA solo puede ir a ENTREGADA
        TRANSICIONES_PERMITIDAS.put(EstadoCompra.ENVIADA, 
            new HashSet<>(Collections.singletonList(EstadoCompra.ENTREGADA)));

        // ENTREGADA es estado final (no puede cambiar)
        TRANSICIONES_PERMITIDAS.put(EstadoCompra.ENTREGADA, new HashSet<>());

        // RECHAZADA es estado final (no puede cambiar)
        TRANSICIONES_PERMITIDAS.put(EstadoCompra.RECHAZADA, new HashSet<>());
    }

    /**
     * Valida si una transición de estado es permitida
     */
    public static boolean esTransicionPermitida(EstadoCompra estadoActual, EstadoCompra nuevoEstado) {
        if (estadoActual == nuevoEstado) {
            return true; // No hay cambio, es válido
        }

        Set<EstadoCompra> estadosPermitidos = TRANSICIONES_PERMITIDAS.get(estadoActual);
        return estadosPermitidos != null && estadosPermitidos.contains(nuevoEstado);
    }

    /**
     * Obtiene los estados permitidos desde el estado actual
     */
    public static Set<EstadoCompra> obtenerEstadosPermitidos(EstadoCompra estadoActual) {
        return TRANSICIONES_PERMITIDAS.getOrDefault(estadoActual, new HashSet<>());
    }

    /**
     * Valida si el estado es final
     */
    public static boolean esEstadoFinal(EstadoCompra estado) {
        return estado == EstadoCompra.ENTREGADA || estado == EstadoCompra.RECHAZADA;
    }

    /**
     * Valida si se puede rechazar desde un estado específico
     */
    public static boolean seCanSoloRechazar(EstadoCompra estado) {
        return estado == EstadoCompra.PENDIENTE || estado == EstadoCompra.CONFIRMADA;
    }

    /**
     * Lanza excepción si la transición no es válida
     */
    public static void validarOLanzarError(EstadoCompra estadoActual, EstadoCompra nuevoEstado, String motivoRechazo) {
        // Validar que la transición sea permitida
        if (!esTransicionPermitida(estadoActual, nuevoEstado)) {
            throw new IllegalStateException(
                String.format(
                    "❌ Transición inválida: No se puede cambiar de %s a %s. " +
                    "Estados permitidos: %s",
                    estadoActual,
                    nuevoEstado,
                    obtenerEstadosPermitidos(estadoActual)
                )
            );
        }

        // Validar que el motivo de rechazo sea obligatorio si se rechaza
        if (nuevoEstado == EstadoCompra.RECHAZADA && (motivoRechazo == null || motivoRechazo.trim().isEmpty())) {
            throw new IllegalArgumentException("El motivo de rechazo es obligatorio");
        }

        System.out.println("✅ Transición validada: " + estadoActual + " → " + nuevoEstado);
    }
}
