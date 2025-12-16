// src/main/java/com/example/licoreriaApp/service/impl/CarritoServiceImpl.java
package com.example.licoreriaApp.service.impl;

import com.example.licoreriaApp.model.ItemCarrito;
import com.example.licoreriaApp.model.Producto;
import com.example.licoreriaApp.model.Usuario;
import com.example.licoreriaApp.repository.ItemCarritoRepository;
import com.example.licoreriaApp.repository.UsuarioRepository;
import com.example.licoreriaApp.service.CarritoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional
public class CarritoServiceImpl implements CarritoService {

    private static final double TASA_IGV = 0.18;
    private static final double COSTO_ENVIO = 15.00;

    @Autowired
    private ItemCarritoRepository itemCarritoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public void agregarItem(Long usuarioId, Producto producto, int cantidad) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // CAMBIO: Buscar TODOS los items existentes (puede haber duplicados)
        List<ItemCarrito> itemsExistentes = itemCarritoRepository
                .findAllByUsuarioIdAndProductoId(usuarioId, producto.getId());

        if (!itemsExistentes.isEmpty()) {
            // Si existen duplicados, eliminarlos todos y crear uno nuevo con la suma
            int cantidadTotal = itemsExistentes.stream()
                    .mapToInt(ItemCarrito::getCantidad)
                    .sum() + cantidad;

            // Eliminar todos los duplicados
            itemCarritoRepository.deleteAll(itemsExistentes);

            // Crear uno nuevo con la cantidad total
            ItemCarrito nuevoItem = new ItemCarrito(usuario, producto, cantidadTotal);
            itemCarritoRepository.save(nuevoItem);

        } else {
            // No existe, crear nuevo
            ItemCarrito nuevoItem = new ItemCarrito(usuario, producto, cantidad);
            itemCarritoRepository.save(nuevoItem);
        }
    }

    @Override
    public void actualizarCantidad(Long usuarioId, int productoId, int nuevaCantidad) {
        // Buscar todos los items (puede haber duplicados)
        List<ItemCarrito> items = itemCarritoRepository
                .findAllByUsuarioIdAndProductoId(usuarioId, productoId);

        if (items.isEmpty()) {
            throw new RuntimeException("Item no encontrado");
        }

        if (nuevaCantidad <= 0) {
            // Eliminar todos
            itemCarritoRepository.deleteAll(items);
        } else {
            // Eliminar duplicados y mantener solo uno actualizado
            ItemCarrito itemPrincipal = items.get(0);

            // Eliminar los demás
            if (items.size() > 1) {
                itemCarritoRepository.deleteAll(items.subList(1, items.size()));
            }

            // Actualizar el principal
            itemPrincipal.setCantidad(nuevaCantidad);
            itemPrincipal.actualizarSubtotal();
            itemCarritoRepository.save(itemPrincipal);
        }
    }

    @Override
    public void eliminarItem(Long usuarioId, int productoId) {
        List<ItemCarrito> items = itemCarritoRepository
                .findAllByUsuarioIdAndProductoId(usuarioId, productoId);

        if (items.isEmpty()) {
            throw new RuntimeException("Item no encontrado");
        }

        // Eliminar todos los duplicados
        itemCarritoRepository.deleteAll(items);
    }

    @Override
    public void limpiarCarrito(Long usuarioId) {
        itemCarritoRepository.deleteByUsuarioId(usuarioId);
    }

    @Override
    public List<ItemCarrito> obtenerItems(Long usuarioId) {
        return itemCarritoRepository.findByUsuarioId(usuarioId);
    }

    @Override
    public double calcularSubtotal(Long usuarioId) {
        return obtenerItems(usuarioId).stream()
                .mapToDouble(ItemCarrito::getSubtotal)
                .sum();
    }

    @Override
    public double calcularTotal(Long usuarioId) {
        double subtotal = calcularSubtotal(usuarioId);
        double igv = subtotal * TASA_IGV;
        return subtotal + igv + COSTO_ENVIO;
    }

    @Override
    public int getCantidadTotal(Long usuarioId) {
        return obtenerItems(usuarioId).stream()
                .mapToInt(ItemCarrito::getCantidad)
                .sum();
    }
}
