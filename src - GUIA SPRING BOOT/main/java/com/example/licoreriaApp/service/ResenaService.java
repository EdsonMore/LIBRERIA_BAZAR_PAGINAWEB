// src/main/java/com/example/licoreriaApp/service/ResenaService.java
package com.example.licoreriaApp.service;

import com.example.licoreriaApp.model.Resena;
import com.example.licoreriaApp.model.Usuario;
import com.example.licoreriaApp.model.Producto;
import com.example.licoreriaApp.repository.ResenaRepository;
import com.example.licoreriaApp.repository.ProductoRepository;
import com.example.licoreriaApp.repository.UsuarioRepository;
import com.example.licoreriaApp.repository.CompraRepository;
import com.example.licoreriaApp.repository.DetalleCompraRepository;
import com.example.licoreriaApp.model.Compra;
import com.example.licoreriaApp.model.DetalleCompra;
import com.example.licoreriaApp.model.EstadoCompra;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

@Service
@Transactional
public class ResenaService {

    @Autowired
    private ResenaRepository resenaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private CompraRepository compraRepository;

    @Autowired
    private DetalleCompraRepository detalleCompraRepository;

    @Transactional(readOnly = true)
    public List<Resena> obtenerResenasPorUsuario(Long usuarioId) {
        try {
            System.out.println("Buscando reseñas para usuario ID: " + usuarioId);
            List<Resena> resenas = resenaRepository.findByUsuarioIdOrderByFechaDesc(usuarioId);

            if (resenas == null) {
                System.out.println("El repository devolvió null para usuario: " + usuarioId);
                return new ArrayList<>();
            }

            System.out.println("Reseñas encontradas: " + resenas.size());

            // Forzar carga de relaciones dentro de la transacción
            for (Resena resena : resenas) {
                if (resena.getProducto() != null) {
                    resena.getProducto().getNombre(); // Forzar carga
                }
                if (resena.getUsuario() != null) {
                    resena.getUsuario().getNombres(); // Forzar carga
                }
            }

            return resenas;

        } catch (Exception e) {
            System.err.println("❌ Error crítico al cargar reseñas: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @Transactional(readOnly = true)
    public List<Resena> obtenerResenasAprobadasPorProducto(Integer productoId) {
        try {
            return resenaRepository.findByProductoIdAndEstado(productoId, "APROBADA");
        } catch (Exception e) {
            System.err.println("Error al obtener reseñas aprobadas: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * ✅ NUEVO MÉTODO: Obtiene todas las reseñas con EAGER loading
     */
    @Transactional(readOnly = true)
    public List<Resena> obtenerTodasLasResenas() {
        try {
            List<Resena> resenas = resenaRepository.findAll();

            // Forzar carga de relaciones dentro de la transacción
            for (Resena resena : resenas) {
                if (resena.getProducto() != null) {
                    resena.getProducto().getNombre(); // Forzar carga
                }
                if (resena.getUsuario() != null) {
                    resena.getUsuario().getNombres(); // Forzar carga
                    resena.getUsuario().getApellidoPaterno(); // Forzar carga
                }
            }

            return resenas;
        } catch (Exception e) {
            System.err.println("Error al obtener todas las reseñas: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @Transactional
    public Resena crearResena(Long usuarioId, Integer productoId, Integer calificacion, String comentario) {
        try {
            System.out.println("Creando reseña - Usuario: " + usuarioId + ", Producto: " + productoId);

            // Validar usuario
            Usuario usuario = usuarioRepository.findById(usuarioId)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + usuarioId));

            // Validar producto
            Producto producto = productoRepository.findById(productoId)
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado con ID: " + productoId));

            // Verificar si ya existe reseña
            if (resenaRepository.existsByUsuarioAndProducto(usuarioId, productoId)) {
                throw new RuntimeException("Ya has reseñado este producto");
            }

            // Validar calificación
            if (calificacion < 1 || calificacion > 5) {
                throw new RuntimeException("La calificación debe estar entre 1 y 5");
            }

            // Crear y guardar reseña
            Resena nuevaResena = new Resena();
            nuevaResena.setUsuario(usuario);
            nuevaResena.setProducto(producto);
            nuevaResena.setCalificacion(calificacion);
            nuevaResena.setComentario(comentario);
            nuevaResena.setEstado("PENDIENTE");
            nuevaResena.setFecha(java.time.LocalDateTime.now());

            Resena resenaGuardada = resenaRepository.save(nuevaResena);
            System.out.println("Reseña creada exitosamente con ID: " + resenaGuardada.getId());

            return resenaGuardada;

        } catch (Exception e) {
            System.err.println("❌ Error al crear reseña: " + e.getMessage());
            throw new RuntimeException("Error al crear reseña: " + e.getMessage(), e);
        }
    }

    @Transactional
    public Resena guardarResena(Resena resena) {
        if (resena == null) {
            throw new IllegalArgumentException("La reseña no puede ser nula");
        }
        return resenaRepository.save(resena);
    }

    @Transactional(readOnly = true)
    public boolean usuarioYaResenoProducto(Long usuarioId, Integer productoId) {
        return resenaRepository.existsByUsuarioAndProducto(usuarioId, productoId);
    }

    @Transactional(readOnly = true)
    public Optional<Resena> obtenerPorId(Long id) {
        return resenaRepository.findById(id);
    }

    @Transactional
    public void eliminarResena(Long id) {
        if (!resenaRepository.existsById(id)) {
            throw new RuntimeException("Reseña no encontrada con ID: " + id);
        }
        resenaRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<Resena> obtenerResenasPendientes() {
        return resenaRepository.findByEstadoOrderByFechaDesc("PENDIENTE");
    }

    @Transactional
    public Resena aprobarResena(Long id) {
        Resena resena = resenaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reseña no encontrada con ID: " + id));
        resena.setEstado("APROBADA");
        Resena resenaGuardada = resenaRepository.save(resena);
        System.out.println("✅ Reseña aprobada: ID=" + id);
        return resenaGuardada;
    }

    @Transactional
    public Resena rechazarResena(Long id) {
        Resena resena = resenaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reseña no encontrada con ID: " + id));
        resena.setEstado("RECHAZADA");
        Resena resenaGuardada = resenaRepository.save(resena);
        System.out.println("❌ Reseña rechazada: ID=" + id);
        return resenaGuardada;
    }

    @Transactional
    public Resena cambiarEstado(Long id, String estado) {
        if (!"APROBADA".equals(estado) && !"RECHAZADA".equals(estado) && !"PENDIENTE".equals(estado)) {
            throw new IllegalArgumentException("Estado no válido: " + estado);
        }
        
        Resena resena = resenaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reseña no encontrada con ID: " + id));
        
        String estadoAnterior = resena.getEstado();
        resena.setEstado(estado);
        Resena resenaGuardada = resenaRepository.save(resena);
        
        System.out.println("🔄 Estado de reseña cambiado: ID=" + id + ", " + estadoAnterior + " → " + estado);
        return resenaGuardada;
    }

    /**
     * Verifica si un usuario puede reseñar un producto:
     * 1. El usuario debe haber comprado el producto
     * 2. La compra debe estar en estado ENTREGADA
     * 3. El usuario no debe haber reseñado el producto ya
     */
    @Transactional(readOnly = true)
    public boolean puedeResenaProducto(Long usuarioId, Integer productoId) {
        try {
            // Verificar si ya existe reseña
            if (resenaRepository.existsByUsuarioAndProducto(usuarioId, productoId)) {
                return false;
            }

            // Obtener todas las compras ENTREGADAS del usuario
            List<Compra> comprasEntregadas = compraRepository.findByEstado(EstadoCompra.ENTREGADA);
            
            // Filtrar solo las del usuario y que contengan el producto
            return comprasEntregadas.stream()
                    .filter(c -> c.getUsuario().getId().equals(usuarioId))
                    .flatMap(c -> c.getDetalles().stream())
                    .anyMatch(d -> d.getProducto().getId().equals(productoId));
                    
        } catch (Exception e) {
            System.err.println("Error al verificar si puede reseñar: " + e.getMessage());
            return false;
        }
    }

    /**
     * Obtiene las compras entregadas del usuario que no han sido reseñadas aún
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> obtenerComprasPendientesDeResena(Long usuarioId) {
        System.out.println("📌 obtenerComprasPendientesDeResena inicio");
        List<Map<String, Object>> resultado = new ArrayList<>();
        
        if (usuarioId == null) {
            System.out.println("⚠️ usuarioId null");
            return resultado;
        }
        
        try {
            System.out.println("🔍 Buscando compras para usuario: " + usuarioId);
            
            // Usar findByUsuarioIdOrderByFechaCompraDesc en lugar de la query personalizada
            List<Compra> todasLasCompras = compraRepository.findByUsuarioIdOrderByFechaCompraDesc(usuarioId);
            System.out.println("📊 Total compras del usuario: " + (todasLasCompras != null ? todasLasCompras.size() : 0));
            
            if (todasLasCompras == null || todasLasCompras.isEmpty()) {
                System.out.println("✅ Sin compras");
                return resultado;
            }
            
            // Filtrar solo ENTREGADAS y procesar
            for (Compra compra : todasLasCompras) {
                System.out.println("  - Compra #" + compra.getId() + " estado: " + (compra.getEstado() != null ? compra.getEstado().toString() : "NULL"));
                
                // Solo procesar ENTREGADAS
                if (compra.getEstado() == null || !compra.getEstado().equals(EstadoCompra.ENTREGADA)) {
                    System.out.println("    ⏭️ No es ENTREGADA");
                    continue;
                }
                
                System.out.println("    ✅ Es ENTREGADA, procesando detalles...");
                
                List<Map<String, Object>> detalles = new ArrayList<>();
                List<DetalleCompra> listaDetalles = compra.getDetalles();
                
                if (listaDetalles != null && !listaDetalles.isEmpty()) {
                    System.out.println("      Total detalles: " + listaDetalles.size());
                    
                    for (DetalleCompra detalle : listaDetalles) {
                        if (detalle.getProducto() == null || detalle.getProducto().getId() == null) {
                            System.out.println("      ⏭️ Detalle sin producto");
                            continue;
                        }
                        
                        Integer productoId = detalle.getProducto().getId();
                        boolean tieneResena = resenaRepository.existsByUsuarioAndProducto(usuarioId, productoId);
                        
                        if (!tieneResena) {
                            System.out.println("        ➕ Producto " + productoId + " sin reseña");
                            
                            Map<String, Object> d = new HashMap<>();
                            d.put("id", detalle.getId());
                            d.put("productoId", productoId);
                            d.put("productoNombre", detalle.getProducto().getNombre());
                            d.put("productoImagen", detalle.getProducto().getImagen());
                            d.put("cantidad", detalle.getCantidad());
                            d.put("precioUnitario", detalle.getPrecioUnitario());
                            d.put("puedeResena", true);
                            detalles.add(d);
                        }
                    }
                }
                
                // Agregar compra si tiene detalles sin reseña
                if (!detalles.isEmpty()) {
                    System.out.println("    📦 Agregando compra con " + detalles.size() + " detalles");
                    Map<String, Object> c = new HashMap<>();
                    c.put("id", compra.getId());
                    c.put("fechaCompra", compra.getFechaCompra());
                    c.put("total", compra.getTotal());
                    c.put("estado", "ENTREGADA");
                    c.put("detalles", detalles);
                    resultado.add(c);
                }
            }
            
            System.out.println("✅ Retornando " + resultado.size() + " compras");
            return resultado;
            
        } catch (Exception e) {
            System.err.println("❌ ERROR: " + e.getClass().getName());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
}