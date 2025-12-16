// licoreriaApp/src/main/java/com/example/licoreriaApp/model/Permiso.java
package com.example.licoreriaApp.model;

import jakarta.persistence.*;

@Entity
@Table(name = "permisos")
public class Permiso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String codigo; // Ej: "PRODUCTO_CREAR", "USUARIO_EDITAR"

    private String nombre; // Ej: "Crear Productos"
    private String descripcion;
    private String categoria; // Ej: "PRODUCTOS", "USUARIOS", "VENTAS"

    // Constructores
    public Permiso() {
    }

    public Permiso(String codigo, String nombre, String descripcion, String categoria) {
        this.codigo = codigo;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.categoria = categoria;
    }

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    @Override
    public String toString() {
        return "Permiso{" + "id=" + id + ", codigo='" + codigo + '\'' + ", nombre='" + nombre + '\'' + '}';
    }
}