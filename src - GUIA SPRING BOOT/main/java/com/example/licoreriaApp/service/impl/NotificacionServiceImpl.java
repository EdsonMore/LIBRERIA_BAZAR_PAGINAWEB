package com.example.licoreriaApp.service.impl;

import com.example.licoreriaApp.model.Compra;
import com.example.licoreriaApp.model.Notificacion;
import com.example.licoreriaApp.model.Usuario;
import com.example.licoreriaApp.repository.NotificacionRepository;
import com.example.licoreriaApp.service.NotificacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificacionServiceImpl implements NotificacionService {
    
    @Autowired
    private NotificacionRepository notificacionRepository;
    
    @Override
    public Notificacion crearNotificacion(Usuario usuario, Compra compra, String titulo, String mensaje, String tipo) {
        System.out.println("💿 [NotificacionService] Guardando nueva notificación en BD...");
        System.out.println("   Usuario: " + usuario.getCorreo() + ", Compra: " + compra.getId() + ", Tipo: " + tipo);
        
        Notificacion notificacion = new Notificacion();
        notificacion.setUsuario(usuario);
        notificacion.setCompra(compra);
        notificacion.setTitulo(titulo);
        notificacion.setMensaje(mensaje);
        notificacion.setTipo(tipo);
        notificacion.setLeida(false);
        
        Notificacion resultado = notificacionRepository.save(notificacion);
        System.out.println("✅ [NotificacionService] Notificación guardada en BD con ID: " + resultado.getId());
        return resultado;
    }
    
    @Override
    public List<Notificacion> obtenerNotificacionesDelUsuario(Usuario usuario) {
        return notificacionRepository.findByUsuarioOrderByFechaCreacionDesc(usuario);
    }
    
    @Override
    public List<Notificacion> obtenerNotificacionesNoLeidas(Usuario usuario) {
        return notificacionRepository.findByUsuarioAndLeidaOrderByFechaCreacionDesc(usuario, false);
    }
    
    @Override
    public long contarNotificacionesNoLeidas(Usuario usuario) {
        return notificacionRepository.countByUsuarioAndLeida(usuario, false);
    }
    
    @Override
    public void marcarComoLeida(Long notificacionId) {
        Notificacion notificacion = notificacionRepository.findById(notificacionId)
                .orElseThrow(() -> new RuntimeException("Notificación no encontrada"));
        notificacion.setLeida(true);
        notificacion.setFechaLectura(LocalDateTime.now());
        notificacionRepository.save(notificacion);
    }
    
    @Override
    public void marcarTodasComoLeidas(Usuario usuario) {
        List<Notificacion> notificacionesNoLeidas = obtenerNotificacionesNoLeidas(usuario);
        LocalDateTime ahora = LocalDateTime.now();
        for (Notificacion notificacion : notificacionesNoLeidas) {
            notificacion.setLeida(true);
            notificacion.setFechaLectura(ahora);
        }
        notificacionRepository.saveAll(notificacionesNoLeidas);
    }
    
    @Override
    public void eliminarNotificacion(Long notificacionId) {
        notificacionRepository.deleteById(notificacionId);
    }
    
    @Override
    public void notificarDespacho(Compra compra) {
        try {
            String titulo = "¡Tu pedido está listo para recoger!";
            String mensaje = "Tu compra #" + compra.getId() + " ha sido preparada y está lista para recoger en nuestra tienda. " +
                            "Dirección: Av. Principal 123, Distrito - Ciudad. Horario: Lunes a Domingo, 9:00 AM - 8:00 PM";
            System.out.println("📧 [NotificacionService] Creando notificación de despacho para usuario: " + compra.getUsuario().getCorreo());
            System.out.println("   Compra ID: " + compra.getId() + ", Título: " + titulo);
            
            Notificacion notificacionCreada = crearNotificacion(compra.getUsuario(), compra, titulo, mensaje, "ORDEN_LISTA");
            
            System.out.println("✅ [NotificacionService] Notificación creada exitosamente. ID: " + notificacionCreada.getId());
        } catch (Exception e) {
            System.err.println("❌ [NotificacionService] Error al crear notificación de despacho: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
