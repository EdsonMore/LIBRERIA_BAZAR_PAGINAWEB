// src/main/java/com/example/licoreriaApp/service/impl/ProductoServiceImpl.java
package com.example.licoreriaApp.service.impl;

import java.util.List;
import java.util.Optional;
import java.util.Collections;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.licoreriaApp.model.Producto;
import com.example.licoreriaApp.model.Resena;
import com.example.licoreriaApp.repository.ProductoRepository;
import com.example.licoreriaApp.repository.ResenaRepository;
import com.example.licoreriaApp.service.ProductoService;

@Service
@Transactional
public class ProductoServiceImpl implements ProductoService {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private ResenaRepository resenaRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Producto> listarTodos() {
        return productoRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Producto obtenerPorId(int id) {
        Optional<Producto> producto = productoRepository.findById(id);
        return producto.orElse(null);
    }

    @Override
    public Producto guardar(Producto producto) {
        // Validar que el producto tenga los datos mínimos requeridos
        if (producto.getNombre() == null || producto.getNombre().trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre del producto es obligatorio");
        }

        if (producto.getPrecio() < 0) {
            throw new IllegalArgumentException("El precio no puede ser negativo");
        }

        if (producto.getStock() < 0) {
            throw new IllegalArgumentException("El stock no puede ser negativo");
        }

        // ✅ LÓGICA INTELIGENTE DE DISPONIBILIDAD:
        // - Si el stock es 0, siempre forzar como no disponible (agotado)
        // - Si el stock > 0, respetar la disponibilidad manual
        if (producto.getStock() == 0) {
            producto.setDisponible(false);
        }
        // Si stock > 0, mantener el valor actual de disponible (true o false)

        return productoRepository.save(producto);
    }

    @Override
    public void eliminar(int id) {
        // Verificar si el producto existe antes de eliminar
        if (!productoRepository.existsById(id)) {
            throw new IllegalArgumentException("Producto no encontrado con ID: " + id);
        }

        // Podrías agregar validaciones adicionales aquí, como:
        // - Verificar si el producto tiene compras asociadas
        // - Verificar si tiene reseñas

        productoRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Producto> buscarPorCategoria(int categoriaId) {
        return productoRepository.findByCategoria_Id(categoriaId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Producto> buscarPorNombre(String nombre) {
        if (nombre == null || nombre.trim().isEmpty()) {
            return listarTodos();
        }
        return productoRepository.findByNombreContainingIgnoreCase(nombre.trim());
    }

    @Override
    @Transactional(readOnly = true)
    public long contarTotal() {
        return productoRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public long contarDisponibles() {
        return productoRepository.countByDisponibleTrue();
    }

    @Override
    @Transactional(readOnly = true)
    public double calcularValorStockTotal() {
        List<Producto> productos = productoRepository.findAll();
        return productos.stream()
                .mapToDouble(p -> p.getPrecio() * p.getStock())
                .sum();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Producto> obtenerProductosPaginados(Pageable pageable) {
        return productoRepository.findAll(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Producto> buscarPorNombrePaginado(String nombre, Pageable pageable) {
        if (nombre == null || nombre.trim().isEmpty()) {
            return productoRepository.findAll(pageable);
        }
        return productoRepository.findByNombreContainingIgnoreCase(nombre.trim(), pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Producto> buscarPorCategoriaYDisponibilidad(Integer categoriaId, Boolean disponible) {
        if (categoriaId != null && disponible != null) {
            return productoRepository.findByCategoria_IdAndDisponible(categoriaId, disponible);
        } else if (categoriaId != null) {
            return productoRepository.findByCategoria_Id(categoriaId);
        } else if (disponible != null) {
            return productoRepository.findByDisponible(disponible);
        } else {
            return productoRepository.findAll();
        }
    }

    @Override
    public void actualizarStock(int productoId, int cantidad) {
        Producto producto = obtenerPorId(productoId);
        if (producto == null) {
            throw new IllegalArgumentException("Producto no encontrado con ID: " + productoId);
        }

        int nuevoStock = producto.getStock() + cantidad;
        if (nuevoStock < 0) {
            throw new IllegalArgumentException("Stock insuficiente para el producto: " + producto.getNombre());
        }

        producto.setStock(nuevoStock);
        producto.setDisponible(nuevoStock > 0);
        productoRepository.save(producto);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean verificarStockSuficiente(int productoId, int cantidad) {
        Producto producto = obtenerPorId(productoId);
        if (producto == null) {
            return false;
        }
        return producto.getStock() >= cantidad;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Producto> obtenerProductosDestacados(int limite) {
        try {
            // Obtener todos los productos disponibles
            List<Producto> productosDisponibles = productoRepository.findByDisponible(true);
            
            if (productosDisponibles.isEmpty()) {
                // Si no hay productos disponibles, devolver lista vacía
                return Collections.emptyList();
            }

            // Intentar obtener productos mejor reseñados
            List<Resena> resenas = resenaRepository.findByEstadoOrderByFechaDesc("APROBADO");
            
            if (!resenas.isEmpty()) {
                // Agrupar reseñas por producto y calcular promedio de calificación
                List<Producto> productosConResenas = productosDisponibles.stream()
                    .filter(p -> resenas.stream()
                        .anyMatch(r -> r.getProducto().getId().equals(p.getId())))
                    .sorted((p1, p2) -> {
                        // Calcular promedio de calificaciones
                        double promedio1 = resenas.stream()
                            .filter(r -> r.getProducto().getId().equals(p1.getId()))
                            .mapToDouble(Resena::getCalificacion)
                            .average()
                            .orElse(0);
                        
                        double promedio2 = resenas.stream()
                            .filter(r -> r.getProducto().getId().equals(p2.getId()))
                            .mapToDouble(Resena::getCalificacion)
                            .average()
                            .orElse(0);
                        
                        // Ordenar descendente (mejor puntuación primero)
                        return Double.compare(promedio2, promedio1);
                    })
                    .limit(limite)
                    .collect(Collectors.toList());
                
                // Si tenemos suficientes productos con reseñas, devolverlos
                if (productosConResenas.size() >= limite) {
                    return productosConResenas;
                }
                
                // Si no hay suficientes productos con reseñas, completar con aleatorios
                List<Producto> productosAleatorios = productosDisponibles.stream()
                    .filter(p -> !productosConResenas.contains(p))
                    .collect(Collectors.toList());
                
                Collections.shuffle(productosAleatorios);
                
                int faltantes = limite - productosConResenas.size();
                productosConResenas.addAll(
                    productosAleatorios.stream()
                        .limit(faltantes)
                        .collect(Collectors.toList())
                );
                
                return productosConResenas;
            }
            
            // Si no hay reseñas, devolver productos aleatorios
            Collections.shuffle(productosDisponibles);
            return productosDisponibles.stream()
                .limit(limite)
                .collect(Collectors.toList());
                
        } catch (Exception e) {
            // En caso de error, devolver productos aleatorios como fallback
            List<Producto> productos = productoRepository.findByDisponible(true);
            Collections.shuffle(productos);
            return productos.stream()
                .limit(limite)
                .collect(Collectors.toList());
        }
    }
}