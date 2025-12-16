// src/main/java/com/example/licoreriaApp/service/impl/CompraServiceImpl.java
package com.example.licoreriaApp.service.impl;

import com.example.licoreriaApp.model.*;
import com.example.licoreriaApp.repository.*;
import com.example.licoreriaApp.service.CompraService;
import com.example.licoreriaApp.service.CarritoService;
import com.example.licoreriaApp.service.ConfiguracionSistemaService;
import com.example.licoreriaApp.service.NotificacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.stream.Collectors;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;

@Service
@Transactional
public class CompraServiceImpl implements CompraService {

    // private static final double TASA_IGV = 0.18;
    // private static final double COSTO_ENVIO = 15.00;

    @Autowired
    private CompraRepository compraRepository;

    @Autowired
    private DetalleCompraRepository detalleCompraRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private CarritoService carritoService;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private ConfiguracionSistemaService configuracionService;

    @Autowired
    private NotificacionService notificacionService;

    @Override
    public Compra realizarCompra(Long usuarioId, String metodoPago, String direccionEntrega) {
        // Obtener usuario
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Obtener items del carrito
        List<ItemCarrito> itemsCarrito = carritoService.obtenerItems(usuarioId);
        if (itemsCarrito.isEmpty()) {
            throw new RuntimeException("El carrito está vacío");
        }

        // Obtener configuración
        ConfiguracionSistema config = configuracionService.obtenerConfiguracion();
        boolean igvActivo = config.isAplicarIGV();
        boolean envioActivo = config.isAplicarEnvio();
        double tasaIGV = igvActivo ? config.getPorcentajeIGV() / 100.0 : 0;
        double costoEnvio = envioActivo ? config.getCostoEnvio() : 0;

        // Crear la compra
        Compra compra = new Compra();
        compra.setUsuario(usuario);
        compra.setMetodoPago(metodoPago);
        compra.setDireccionEntrega(direccionEntrega);
        compra.setCostoEnvio(costoEnvio);

        // Calcular totales
        double subtotal = carritoService.calcularSubtotal(usuarioId);
        double igv = subtotal * tasaIGV;
        double total = subtotal + igv + costoEnvio;

        compra.setSubtotal(subtotal);
        compra.setIgv(igv);
        compra.setIgvActivo(igvActivo);  // Usar flag de configuración
        compra.setCostoEnvio(costoEnvio);
        compra.setEnvioActivo(envioActivo);  // Usar flag de configuración
        compra.setTotal(total);

        // Guardar compra primero
        compra = compraRepository.save(compra);

        // Crear detalles de compra desde items del carrito
        for (ItemCarrito item : itemsCarrito) {
            DetalleCompra detalle = new DetalleCompra(
                    compra,
                    item.getProducto(),
                    item.getCantidad()
            );
            detalleCompraRepository.save(detalle);
            compra.getDetalles().add(detalle);
        }

        // Limpiar el carrito
        carritoService.limpiarCarrito(usuarioId);

        return compra;
    }

    @Override
    public Compra realizarCompraDirecta(
            String nombres, 
            String apellido, 
            String correo, 
            String telefono, 
            String direccion, 
            String metodoPago,
            List<Map<String, Object>> items) {
        
        // Validar que hay items
        if (items == null || items.isEmpty()) {
            throw new RuntimeException("El carrito está vacío");
        }

        // Obtener configuración
        ConfiguracionSistema config = configuracionService.obtenerConfiguracion();
        boolean igvActivo = config.isAplicarIGV();
        boolean envioActivo = config.isAplicarEnvio();
        double tasaIGV = igvActivo ? config.getPorcentajeIGV() / 100.0 : 0;
        double costoEnvio = envioActivo ? config.getCostoEnvio() : 0;

        // Buscar o crear usuario temporal con el correo
        Usuario usuario = usuarioRepository.findByCorreo(correo).orElse(null);
        if (usuario == null) {
            // Crear usuario temporal/invitado
            usuario = new Usuario();
            usuario.setUser("guest_" + System.currentTimeMillis()); // Username temporal único
            usuario.setNombres(nombres);
            usuario.setApellidoPaterno(apellido);
            usuario.setCorreo(correo);
            usuario.setNumero(telefono);
            usuario.setDireccion1(direccion);
            usuario.setPassword("GUEST_" + System.currentTimeMillis()); // Password temporal
            usuario = usuarioRepository.save(usuario);
        }

        // Crear la compra
        Compra compra = new Compra();
        compra.setUsuario(usuario);
        compra.setMetodoPago(metodoPago);
        compra.setDireccionEntrega(direccion);
        compra.setCostoEnvio(costoEnvio);

        // Calcular totales desde los items recibidos
        double subtotal = 0.0;
        for (Map<String, Object> item : items) {
            Integer productoId = (Integer) item.get("id");
            Integer cantidad = (Integer) item.get("cantidad");
            
            if (productoId != null && cantidad != null && cantidad > 0) {
                Producto producto = productoRepository.findById(productoId)
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + productoId));
                subtotal += producto.getPrecio() * cantidad;
            }
        }

        double igv = subtotal * tasaIGV;
        double total = subtotal + igv + costoEnvio;

        compra.setSubtotal(subtotal);
        compra.setIgv(igv);
        compra.setIgvActivo(igvActivo);  // Usar flag de configuración
        compra.setCostoEnvio(costoEnvio);
        compra.setEnvioActivo(envioActivo);  // Usar flag de configuración
        compra.setTotal(total);

        // Guardar compra primero
        compra = compraRepository.save(compra);

        // Crear detalles de compra desde items recibidos
        for (Map<String, Object> item : items) {
            Integer productoId = (Integer) item.get("id");
            Integer cantidad = (Integer) item.get("cantidad");
            
            if (productoId != null && cantidad != null && cantidad > 0) {
                Producto producto = productoRepository.findById(productoId)
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + productoId));
                
                DetalleCompra detalle = new DetalleCompra(
                    compra,
                    producto,
                    cantidad
                );
                detalleCompraRepository.save(detalle);
                compra.getDetalles().add(detalle);
            }
        }

        return compra;
    }

    @Override
    public Compra obtenerCompraPorId(Long compraId) {
        Compra compra = compraRepository.findById(compraId)
                .orElseThrow(() -> new RuntimeException("Compra no encontrada"));

        // Inicializar detalles y productos para evitar LazyInitializationException
        if (compra.getDetalles() != null) {
            compra.getDetalles().forEach(d -> {
                if (d.getProducto() != null) {
                    // Acceso a propiedades para forzar la carga
                    d.getProducto().getId();
                    d.getProducto().getNombre();
                }
            });
        }

        return compra;
    }

    @Override
    public List<Compra> obtenerComprasPorUsuario(Long usuarioId) {
        List<Compra> compras = compraRepository.findByUsuarioIdOrderByFechaCompraDesc(usuarioId);

        // Inicializar detalles y productos para cada compra (evita problemas al renderizar en la vista)
        if (compras != null) {
            compras.forEach(c -> {
                if (c.getDetalles() != null) {
                    c.getDetalles().forEach(d -> {
                        if (d.getProducto() != null) {
                            d.getProducto().getId();
                            d.getProducto().getNombre();
                        }
                    });
                }
            });
        }

        return compras;
    }

    @Override
    public Compra actualizarEstado(Long compraId, EstadoCompra nuevoEstado) {
        System.out.println("\n========================================");
        System.out.println("🔄 [CompraService.actualizarEstado] INICIO");
        System.out.println("   Compra ID: " + compraId);
        System.out.println("   Nuevo Estado: " + nuevoEstado);
        System.out.println("========================================");
        
        Compra compra = obtenerCompraPorId(compraId);
        EstadoCompra estadoAnterior = compra.getEstado();
        
        System.out.println("📊 Estado anterior: " + estadoAnterior);
        System.out.println("📊 Nuevo estado: " + nuevoEstado);
        
        // Si el estado cambia a CONFIRMADA, descontar el stock
        if (nuevoEstado == EstadoCompra.CONFIRMADA && estadoAnterior != EstadoCompra.CONFIRMADA) {
            System.out.println("📦 Descontando stock...");
            descontarStockDeCompra(compra);
        }
        
        // Si el estado cambia de CONFIRMADA a otro (ej: cancelación), restaurar el stock
        if (estadoAnterior == EstadoCompra.CONFIRMADA && nuevoEstado != EstadoCompra.CONFIRMADA) {
            System.out.println("📦 Restaurando stock...");
            restaurarStockDeCompra(compra);
        }
        
        compra.setEstado(nuevoEstado);
        System.out.println("💾 Asignado nuevo estado en objeto compra: " + compra.getEstado());
        
        System.out.println("💾 GUARDANDO en BD...");
        Compra compraActualizada = compraRepository.save(compra);
        System.out.println("✅ GUARDADO EXITOSO en BD");
        System.out.println("✅ Estado en BD después de guardar: " + compraActualizada.getEstado());
        
        // Si el estado cambia a DESPACHADO, crear notificación
        if (nuevoEstado == EstadoCompra.DESPACHADO && estadoAnterior != EstadoCompra.DESPACHADO) {
            System.out.println("🔔 Estado cambió a DESPACHADO, creando notificación...");
            notificacionService.notificarDespacho(compraActualizada);
            System.out.println("✉️ Notificación creada");
        }
        
        System.out.println("========================================");
        System.out.println("✅ [CompraService.actualizarEstado] FIN");
        System.out.println("========================================\n");
        
        return compraActualizada;
    }

    @Override
    public Compra actualizarEstadoConValidacion(Long compraId, EstadoCompra nuevoEstado, String motivoRechazo) {
        System.out.println("\n========================================");
        System.out.println("🔒 [CompraService.actualizarEstadoConValidacion] INICIO");
        System.out.println("   Compra ID: " + compraId);
        System.out.println("   Nuevo Estado: " + nuevoEstado);
        System.out.println("========================================");
        
        Compra compra = obtenerCompraPorId(compraId);
        EstadoCompra estadoAnterior = compra.getEstado();
        
        // ✅ VALIDAR LA TRANSICIÓN DE ESTADO
        com.example.licoreriaApp.util.EstadoCompraValidator.validarOLanzarError(estadoAnterior, nuevoEstado, motivoRechazo);
        
        // Guardar motivo si es rechazo
        if (nuevoEstado == EstadoCompra.RECHAZADA) {
            System.out.println("❌ Compra rechazada. Motivo: " + motivoRechazo);
            compra.setMotivoRechazo(motivoRechazo);
        }
        
        // Restaurar stock si se rechaza desde CONFIRMADA
        if (nuevoEstado == EstadoCompra.RECHAZADA && estadoAnterior == EstadoCompra.CONFIRMADA) {
            System.out.println("📦 Restaurando stock por rechazo...");
            restaurarStockDeCompra(compra);
        }
        
        // Si el estado cambia a CONFIRMADA, descontar el stock
        if (nuevoEstado == EstadoCompra.CONFIRMADA && estadoAnterior != EstadoCompra.CONFIRMADA) {
            System.out.println("📦 Descontando stock...");
            descontarStockDeCompra(compra);
        }
        
        compra.setEstado(nuevoEstado);
        System.out.println("💾 GUARDANDO en BD con validación...");
        Compra compraActualizada = compraRepository.save(compra);
        System.out.println("✅ GUARDADO EXITOSO. Nuevo estado: " + compraActualizada.getEstado());
        
        // Si el estado cambia a DESPACHADO, crear notificación
        if (nuevoEstado == EstadoCompra.DESPACHADO && estadoAnterior != EstadoCompra.DESPACHADO) {
            System.out.println("🔔 Creando notificación de despacho...");
            notificacionService.notificarDespacho(compraActualizada);
        }
        
        System.out.println("========================================");
        System.out.println("✅ [CompraService.actualizarEstadoConValidacion] FIN");
        System.out.println("========================================\n");
        
        return compraActualizada;
    }

    @Override
    public Compra rechazarCompra(Long compraId, String motivo) {
        System.out.println("\n========================================");
        System.out.println("❌ [CompraService.rechazarCompra] INICIO");
        System.out.println("   Compra ID: " + compraId);
        System.out.println("   Motivo: " + motivo);
        System.out.println("========================================");
        
        Compra compra = obtenerCompraPorId(compraId);
        EstadoCompra estadoActual = compra.getEstado();
        
        // Validar que solo se puede rechazar desde PENDIENTE o CONFIRMADA
        if (!com.example.licoreriaApp.util.EstadoCompraValidator.seCanSoloRechazar(estadoActual)) {
            throw new IllegalStateException(
                "No se puede rechazar una compra en estado " + estadoActual + 
                ". Solo se pueden rechazar compras en estado PENDIENTE o CONFIRMADA."
            );
        }
        
        // Validar motivo obligatorio
        if (motivo == null || motivo.trim().isEmpty()) {
            throw new IllegalArgumentException("El motivo de rechazo es obligatorio");
        }
        
        // Restaurar stock si estaba confirmada
        if (estadoActual == EstadoCompra.CONFIRMADA) {
            System.out.println("📦 Restaurando stock...");
            restaurarStockDeCompra(compra);
        }
        
        compra.setEstado(EstadoCompra.RECHAZADA);
        compra.setMotivoRechazo(motivo);
        
        System.out.println("💾 GUARDANDO rechazo en BD...");
        Compra compraActualizada = compraRepository.save(compra);
        System.out.println("✅ Compra rechazada exitosamente");
        System.out.println("========================================\n");
        
        return compraActualizada;
    }
    private void descontarStockDeCompra(Compra compra) {
        if (compra.getDetalles() == null || compra.getDetalles().isEmpty()) {
            return;
        }
        
        for (DetalleCompra detalle : compra.getDetalles()) {
            Producto producto = detalle.getProducto();
            int cantidadComprada = detalle.getCantidad();
            int stockActual = producto.getStock();
            
            // Validar que hay suficiente stock
            if (stockActual < cantidadComprada) {
                throw new RuntimeException(
                    "Stock insuficiente para el producto: " + producto.getNombre() + 
                    ". Stock disponible: " + stockActual + ", requerido: " + cantidadComprada
                );
            }
            
            // Descontar stock
            int nuevoStock = stockActual - cantidadComprada;
            producto.setStock(nuevoStock);
            
            // Actualizar disponibilidad si el stock llega a 0
            if (nuevoStock == 0) {
                producto.setDisponible(false);
            }
            
            productoRepository.save(producto);
            
            System.out.println("✅ Stock actualizado - Producto: " + producto.getNombre() + 
                             " | Stock anterior: " + stockActual + 
                             " | Cantidad vendida: " + cantidadComprada + 
                             " | Stock nuevo: " + nuevoStock);
        }
    }
    
    /**
     * Restaura el stock de los productos cuando se cancela una compra confirmada
     */
    private void restaurarStockDeCompra(Compra compra) {
        if (compra.getDetalles() == null || compra.getDetalles().isEmpty()) {
            return;
        }
        
        for (DetalleCompra detalle : compra.getDetalles()) {
            Producto producto = detalle.getProducto();
            int cantidadComprada = detalle.getCantidad();
            int stockActual = producto.getStock();
            
            // Restaurar stock
            int nuevoStock = stockActual + cantidadComprada;
            producto.setStock(nuevoStock);
            
            // Marcar como disponible si tiene stock
            if (nuevoStock > 0) {
                producto.setDisponible(true);
            }
            
            productoRepository.save(producto);
            
            System.out.println("♻️ Stock restaurado - Producto: " + producto.getNombre() + 
                             " | Stock anterior: " + stockActual + 
                             " | Cantidad restaurada: " + cantidadComprada + 
                             " | Stock nuevo: " + nuevoStock);
        }
    }

    @Override
    public Compra asignarNumeroSeguimiento(Long compraId, String numeroSeguimiento) {
        Compra compra = obtenerCompraPorId(compraId);
        compra.setNumeroSeguimiento(numeroSeguimiento);
        return compraRepository.save(compra);
    }

    @Override
    public List<Compra> obtenerComprasPorEstado(EstadoCompra estado) {
        return compraRepository.findByEstado(estado);
    }

    @Override
    public List<Compra> obtenerTodasLasCompras() {
        return compraRepository.findAll();
    }

    @Override
    public Map<String, Object> obtenerMetricasVentas() {
        Map<String, Object> metricas = new HashMap<>();
        
        try {
            // Obtener todas las compras entregadas
            List<Compra> comprasCompletadas = compraRepository.findByEstado(EstadoCompra.ENTREGADA);
            
            if (comprasCompletadas == null) {
                comprasCompletadas = new ArrayList<>();
            }
            
            // 1. Total de ventas (suma de todos los totales)
            double totalVentas = comprasCompletadas.stream()
                    .mapToDouble(Compra::getTotal)
                    .sum();
            
            // 2. Ventas del día (comparar fechaCompra con hoy)
            LocalDateTime inicioHoy = LocalDateTime.of(LocalDate.now(), LocalTime.MIDNIGHT);
            LocalDateTime finHoy = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
            
            double ventasHoy = comprasCompletadas.stream()
                    .filter(c -> c.getFechaCompra() != null && 
                            c.getFechaCompra().isAfter(inicioHoy) && 
                            c.getFechaCompra().isBefore(finHoy))
                    .mapToDouble(Compra::getTotal)
                    .sum();
            
            // 3. Productos más vendidos (agrupar detalles por producto y contar cantidad)
            List<Map<String, Object>> productosMasVendidos = comprasCompletadas.stream()
                    .flatMap(c -> c.getDetalles().stream())
                    .collect(Collectors.groupingBy(
                            d -> d.getProducto().getNombre(),
                            Collectors.summingInt(DetalleCompra::getCantidad)
                    ))
                    .entrySet().stream()
                    .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                    .limit(5)
                    .map(e -> {
                        Map<String, Object> item = new HashMap<>();
                        item.put("nombre", e.getKey());
                        item.put("cantidad", e.getValue());
                        return item;
                    })
                    .collect(Collectors.toList());
            
            // 4. Top productos por ingresos (agrupar detalles por producto y sumar ingresos)
            List<Map<String, Object>> topProductosRevenue = comprasCompletadas.stream()
                    .flatMap(c -> c.getDetalles().stream())
                    .collect(Collectors.groupingBy(
                            d -> d.getProducto().getNombre(),
                            Collectors.summingDouble(d -> d.getPrecioUnitario() * d.getCantidad())
                    ))
                    .entrySet().stream()
                    .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
                    .limit(5)
                    .map(e -> {
                        Map<String, Object> item = new HashMap<>();
                        item.put("nombre", e.getKey());
                        item.put("ingresos", e.getValue());
                        return item;
                    })
                    .collect(Collectors.toList());
            
            // 5. Total de compras completadas
            int totalComprasCompletadas = comprasCompletadas.size();
            
            // Armar el resultado
            metricas.put("totalVentas", totalVentas);
            metricas.put("ventasHoy", ventasHoy);
            metricas.put("productosMasVendidos", productosMasVendidos);
            metricas.put("topProductosRevenue", topProductosRevenue);
            metricas.put("totalComprasCompletadas", totalComprasCompletadas);
            
        } catch (Exception e) {
            // Si hay error, devolver valores por defecto
            metricas.put("totalVentas", 0.0);
            metricas.put("ventasHoy", 0.0);
            metricas.put("productosMasVendidos", List.of());
            metricas.put("topProductosRevenue", List.of());
            metricas.put("totalComprasCompletadas", 0);
        }
        
        return metricas;
    }

}
