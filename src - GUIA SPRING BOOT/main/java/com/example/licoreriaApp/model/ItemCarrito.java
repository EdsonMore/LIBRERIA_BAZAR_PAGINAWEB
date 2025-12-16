// src/main/java/com/example/licoreriaApp/model/ItemCarrito.java
package com.example.licoreriaApp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "items_carrito")
public class ItemCarrito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    private int cantidad;
    private double subtotal;

    // Constructores y getters/setters
    public ItemCarrito() {
    }

    public ItemCarrito(Usuario usuario, Producto producto, int cantidad) {
        this.usuario = usuario;
        this.producto = producto;
        this.cantidad = cantidad;
        this.subtotal = producto.getPrecio() * cantidad;
    }

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
        // Recalcular subtotal si es necesario
        if (this.producto != null && usuario != null) {
            this.subtotal = this.producto.getPrecio() * this.cantidad;
        }
    }

    // Getters y Setters
    public Producto getProducto() {
        return producto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
        // Recalcular subtotal cuando cambie el producto
        if (producto != null) {
            this.subtotal = producto.getPrecio() * this.cantidad;
        }
    }

    public int getCantidad() {
        return cantidad;
    }

    public void setCantidad(int cantidad) {
        this.cantidad = cantidad;
        // Recalcular subtotal cuando cambie la cantidad
        if (this.producto != null) {
            this.subtotal = this.producto.getPrecio() * cantidad;
        }
    }

    public double getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(double subtotal) {
        this.subtotal = subtotal;
    }

    // Método para actualizar el subtotal
    public void actualizarSubtotal() {
        if (this.producto != null) {
            this.subtotal = this.producto.getPrecio() * this.cantidad;
        }
    }

    @Override
    public String toString() {
        return "ItemCarrito{"
                + "producto=" + producto
                + ", cantidad=" + cantidad
                + ", subtotal=" + subtotal
                + '}';
    }
}
