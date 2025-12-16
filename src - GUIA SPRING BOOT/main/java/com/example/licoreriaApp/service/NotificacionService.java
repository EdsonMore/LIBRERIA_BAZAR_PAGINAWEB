package com.example.licoreriaApp.service;

import com.example.licoreriaApp.model.Compra;
import com.example.licoreriaApp.model.Notificacion;
import com.example.licoreriaApp.model.Usuario;

import java.util.List;

public interface NotificacionService {
    Notificacion crearNotificacion(Usuario usuario, Compra compra, String titulo, String mensaje, String tipo);
    
    List<Notificacion> obtenerNotificacionesDelUsuario(Usuario usuario);
    
    List<Notificacion> obtenerNotificacionesNoLeidas(Usuario usuario);
    
    long contarNotificacionesNoLeidas(Usuario usuario);
    
    void marcarComoLeida(Long notificacionId);
    
    void marcarTodasComoLeidas(Usuario usuario);
    
    void eliminarNotificacion(Long notificacionId);
    
    void notificarDespacho(Compra compra);
}
