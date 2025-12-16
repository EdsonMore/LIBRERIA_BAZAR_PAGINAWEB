// src/main/java/com/example/licoreriaApp/model/Usuario.java
package com.example.licoreriaApp.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.*;

@Entity
@Table(name = "usuarios")
public class Usuario {

    // ==============================
    // 🔹 Atributos principales
    // ==============================
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String user;

    @Column(nullable = false)
    private String password;

    @Column(unique = true, nullable = false)
    private String correo;

    private String nombres;
    private String apellidoPaterno;
    private String apellidoMaterno;

    private String direccion1;
    private String direccion2;

    @Column(name = "numero_telefono")
    private String numero;

    private String genero;

    @Column(unique = true)
    private String dni;

    private LocalDate fechaNacimiento;
    private LocalDateTime fechaRegistro;

    @Enumerated(EnumType.STRING)
    private TipoDoc tipoDoc;

    @Column(name = "activo", nullable = false)
    private boolean activo = true;

    // ==============================
    // 🔹 Relaciones
    // ==============================
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "usuario_roles", joinColumns = @JoinColumn(name = "usuario_id"), inverseJoinColumns = @JoinColumn(name = "rol_id"))
    private List<Rol> roles = new ArrayList<>();

    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItemCarrito> carrito = new ArrayList<>();

    // ==============================
    // 🔹 Constructores
    // ==============================
    public Usuario() {
        this.fechaRegistro = LocalDateTime.now();
    }

    // ==============================
    // 🔹 Getters y Setters
    // ==============================
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUser() {
        return user;
    }

    public void setUser(String user) {
        this.user = user;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getNombres() {
        return nombres;
    }

    public void setNombres(String nombres) {
        this.nombres = nombres;
    }

    public String getApellidoPaterno() {
        return apellidoPaterno;
    }

    public void setApellidoPaterno(String apellidoPaterno) {
        this.apellidoPaterno = apellidoPaterno;
    }

    public String getApellidoMaterno() {
        return apellidoMaterno;
    }

    public void setApellidoMaterno(String apellidoMaterno) {
        this.apellidoMaterno = apellidoMaterno;
    }

    public String getDireccion1() {
        return direccion1;
    }

    public void setDireccion1(String direccion1) {
        this.direccion1 = direccion1;
    }

    public String getDireccion2() {
        return direccion2;
    }

    public void setDireccion2(String direccion2) {
        this.direccion2 = direccion2;
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public String getGenero() {
        return genero;
    }

    public void setGenero(String genero) {
        this.genero = genero;
    }

    public String getDni() {
        return dni;
    }

    public void setDni(String dni) {
        this.dni = dni;
    }

    public LocalDate getFechaNacimiento() {
        return fechaNacimiento;
    }

    public void setFechaNacimiento(LocalDate fechaNacimiento) {
        this.fechaNacimiento = fechaNacimiento;
    }

    public LocalDateTime getFechaRegistro() {
        return fechaRegistro;
    }

    public void setFechaRegistro(LocalDateTime fechaRegistro) {
        this.fechaRegistro = fechaRegistro;
    }

    public TipoDoc getTipoDoc() {
        return tipoDoc;
    }

    public void setTipoDoc(TipoDoc tipoDoc) {
        this.tipoDoc = tipoDoc;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }

    public List<Rol> getRoles() {
        return roles;
    }

    public void setRoles(List<Rol> roles) {
        this.roles = roles;
    }

    public List<ItemCarrito> getCarrito() {
        return carrito;
    }

    public void setCarrito(List<ItemCarrito> carrito) {
        this.carrito = carrito;
    }

    // ==============================
    // 🔹 Métodos utilitarios
    // ==============================
    public boolean tieneRol(String nombreRol) {
        return roles.stream().anyMatch(rol -> rol.getNombre().equals(nombreRol));
    }

    public boolean esSuperAdmin() {
        return tieneRol("ROLE_SUPER_ADMIN");
    }

    public boolean esAdmin() {
        return tieneRol("ROLE_ADMIN");
    }

    public boolean esEncargadoProductos() {
        return tieneRol("ROLE_ENCARGADO_PRODUCTOS");
    }

    public boolean esEncargadoVentas() {
        return tieneRol("ROLE_ENCARGADO_VENTAS");
    }

    public boolean esCliente() {
        return tieneRol("ROLE_CLIENTE");
    }
}