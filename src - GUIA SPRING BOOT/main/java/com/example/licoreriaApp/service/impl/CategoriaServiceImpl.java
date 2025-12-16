// src/main/java/com/example/licoreriaApp/service/impl/CategoriaServiceImpl.java
package com.example.licoreriaApp.service.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.licoreriaApp.model.Categoria;
import com.example.licoreriaApp.repository.CategoriaRepository;
import com.example.licoreriaApp.service.CategoriaService;

@Service
public class CategoriaServiceImpl implements CategoriaService {

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Override
    public List<Categoria> listarTodas() {
        return categoriaRepository.findAll();
    }

    @Override
    public Categoria obtenerPorId(int id) {
        return categoriaRepository.findById(id).orElse(null);
    }

    @Override
    public Categoria guardar(Categoria categoria) {
        return categoriaRepository.save(categoria);
    }

    @Override
    public void eliminar(int id) {
        categoriaRepository.deleteById(id);
    }

    @Override
    public List<Categoria> listarActivas() {
        return categoriaRepository.findByActiva(true);
    }

    @Override
    public int contarProductosPorCategoria(int categoriaId) {
        return categoriaRepository.contarProductosPorCategoria(categoriaId);
    }
}
