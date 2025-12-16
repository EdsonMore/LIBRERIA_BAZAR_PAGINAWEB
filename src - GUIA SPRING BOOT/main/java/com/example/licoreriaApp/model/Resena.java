// src/main/java/com/example/licoreriaApp/model/Resena.java
package com.example.licoreriaApp.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "resenas")
public class Resena {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(nullable = false)
    private Integer calificacion;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String comentario;

    @Column(nullable = false)
    private String estado = "PENDIENTE";

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    // Constructores
    public Resena() {
    }

    /**
     * Constructor para crear una nueva reseña La calificación se valida para
     * que esté entre 1 y 5
     */
    public Resena(Usuario usuario, Producto producto, Integer calificacion, String comentario) {
        this.usuario = usuario;
        this.producto = producto;
        this.calificacion = (calificacion >= 1 && calificacion <= 5) ? calificacion : 5;
        this.comentario = comentario;
        this.estado = "PENDIENTE";
        this.fecha = LocalDateTime.now();
    }

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Producto getProducto() {
        return producto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public Integer getCalificacion() {
        return calificacion;
    }

    /**
     * Establece la calificación validando que esté entre 1 y 5 Si está fuera de
     * rango, se establece en 5 por defecto
     */
    public void setCalificacion(Integer calificacion) {
        this.calificacion = (calificacion >= 1 && calificacion <= 5) ? calificacion : 5;
    }

    public String getComentario() {
        return comentario;
    }

    public void setComentario(String comentario) {
        this.comentario = comentario;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    // MÉTODOS AUXILIARES PARA EVITAR LAZY LOADING EXCEPTIONS
    /**
     * Obtiene el nombre del producto de forma segura Evita
     * LazyInitializationException cuando las entidades no están cargadas
     */
    public String getNombreProducto() {
        return producto != null ? producto.getNombre() : "Producto no disponible";
    }

    /**
     * Obtiene el nombre del usuario de forma segura Evita
     * LazyInitializationException cuando las entidades no están cargadas
     */
    public String getNombreUsuario() {
        return usuario != null ? usuario.getNombres() : "Usuario";
    }
}
