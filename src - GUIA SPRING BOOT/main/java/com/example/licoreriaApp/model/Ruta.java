package com.example.licoreriaApp.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rutas")
public class Ruta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ruta", nullable = false, length = 255)
    private String ruta; // Ejemplo: "/productos", "/superAdmin/usuarios"

    @Column(name = "metodo", nullable = false, length = 10)
    private String metodo; // GET, POST, PUT, DELETE, PATCH

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "requiere_autenticacion", nullable = false)
    private Boolean requiereAutenticacion = true;

    @Column(name = "es_publica", nullable = false)
    private Boolean esPublica = false; // true si es accesible sin autenticación

    @Column(name = "categoria", length = 50)
    private String categoria; // Ejemplo: "PRODUCTOS", "USUARIOS", "COMPRAS", "ADMIN", etc.

    @Column(name = "activa", nullable = false)
    private Boolean activa = true;

    // Relación Many-to-Many con Rol
    @ManyToMany(fetch = FetchType.LAZY) 
    @JoinTable(name = "ruta_rol", joinColumns = @JoinColumn(name = "ruta_id"), inverseJoinColumns = @JoinColumn(name = "rol_id"))
    private List<Rol> rolesPermitidos = new ArrayList<>();

    // Constructores
    public Ruta() {
    }

    public Ruta(String ruta, String metodo, String descripcion, Boolean esPublica, String categoria) {
        this.ruta = ruta;
        this.metodo = metodo;
        this.descripcion = descripcion;
        this.esPublica = esPublica;
        this.requiereAutenticacion = !esPublica;
        this.categoria = categoria;
        this.activa = true;
    }

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRuta() {
        return ruta;
    }

    public void setRuta(String ruta) {
        this.ruta = ruta;
    }

    public String getMetodo() {
        return metodo;
    }

    public void setMetodo(String metodo) {
        this.metodo = metodo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Boolean getRequiereAutenticacion() {
        return requiereAutenticacion;
    }

    public void setRequiereAutenticacion(Boolean requiereAutenticacion) {
        this.requiereAutenticacion = requiereAutenticacion;
    }

    public Boolean getEsPublica() {
        return esPublica;
    }

    public void setEsPublica(Boolean esPublica) {
        this.esPublica = esPublica;
        this.requiereAutenticacion = !esPublica;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public Boolean getActiva() {
        return activa;
    }

    public void setActiva(Boolean activa) {
        this.activa = activa;
    }

    public List<Rol> getRolesPermitidos() {
        return rolesPermitidos;
    }

    public void setRolesPermitidos(List<Rol> rolesPermitidos) {
        this.rolesPermitidos = rolesPermitidos;
    }

    public void agregarRol(Rol rol) {
        if (!this.rolesPermitidos.contains(rol)) {
            this.rolesPermitidos.add(rol);
        }
    }

    public void removerRol(Rol rol) {
        this.rolesPermitidos.remove(rol);
    }

    public boolean tieneRol(Rol rol) {
        return this.rolesPermitidos.contains(rol);
    }

    @Override
    public String toString() {
        return "Ruta{" +
                "id=" + id +
                ", ruta='" + ruta + '\'' +
                ", metodo='" + metodo + '\'' +
                ", categoria='" + categoria + '\'' +
                ", esPublica=" + esPublica +
                ", activa=" + activa +
                '}';
    }
}
