// src/main/java/com/example/licoreriaApp/service/CategoriaService.java
package com.example.licoreriaApp.service;

import java.util.List;

import com.example.licoreriaApp.model.Categoria;

public interface CategoriaService {

    List<Categoria> listarTodas();

    Categoria obtenerPorId(int id);

    Categoria guardar(Categoria categoria);

    void eliminar(int id);

    List<Categoria> listarActivas();

    int contarProductosPorCategoria(int categoriaId);
}
