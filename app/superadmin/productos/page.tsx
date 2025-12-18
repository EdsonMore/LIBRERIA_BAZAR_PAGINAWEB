"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  disponible: boolean;
  categoriaNombre: string;
  imagen: string;
}

export default function SuperAdminProductosPage() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroStock, setFiltroStock] = useState("todos");
  const [categorias, setCategorias] = useState<{ id: number; nombre: string }[]>([]);
  const [categoriaMap, setCategoriaMap] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    const init = async () => {
      await cargarCategorias()
      cargarProductos()
    }
    init()
  }, [])

  const cargarCategorias = async () => {
    try {
      const res = await fetch("/api/categorias/activas")
      if (res.ok) {
        const data = await res.json()
        const categoriasConId = data.map((c: any) => ({ id: c.id, nombre: c.nombre }))
        const mapeo = data.reduce((acc: any, c: any) => {
          acc[c.id] = c.nombre
          return acc
        }, {})
        
        console.log("Categorías con ID:", categoriasConId)
        setCategorias(categoriasConId)
        setCategoriaMap(mapeo)
      }
    } catch (error) {
      console.error("Error al cargar categorías:", error)
    }
  }

  const cargarProductos = async () => {
    try {
      const res = await fetch("/api/admin/productos");
      if (res.ok) {
        const data = await res.json();
        console.log("Primer producto:", data[0]);

        const productosNormalizados: Producto[] = data.map((p: any) => ({
          ...p,
          precio: Number(p.precio),
          categoriaNombre: categoriaMap[p.categoria_id] || "Sin categoría",
        }));

        setProductos(productosNormalizados);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDisponibilidad = async (id: number, disponible: boolean) => {
    try {
      const res = await fetch(
        "/api/admin/productos/" + String(id) + "/toggle",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ disponible: !disponible }),
        }
      );

      if (res.ok) {
        cargarProductos();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const productosFiltrados = productos.filter((p) => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(buscar.toLowerCase());
    const coincideCategoria = !filtroCategoria || p.categoria_id === parseInt(filtroCategoria);
    
    let coincideStock = true;
    if (filtroStock === "sin-stock") {
      coincideStock = p.stock === 0;
    } else if (filtroStock === "poco-stock") {
      coincideStock = p.stock > 0 && p.stock <= 5;
    } else if (filtroStock === "con-stock") {
      coincideStock = p.stock > 5;
    }
    
    return coincideBusqueda && coincideCategoria && coincideStock;
  });

  if (loading) {
    return <div className="p-4 md:p-8">Cargando productos...</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
        <h1 className="text-xl md:text-2xl font-bold">
          Gestión de Productos - SuperAdmin
        </h1>
        <button
          onClick={() => router.push("/superadmin/productos/crear")}
          className="w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm md:text-base"
        >
          Nuevo Producto
        </button>
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            className="flex-1 px-4 py-2 border rounded text-sm md:text-base"
          />
          
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="px-4 py-2 border rounded text-sm md:text-base"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((cat) => (
              <option key={`cat-${cat.id}`} value={cat.id.toString()}>
                {cat.nombre}
              </option>
            ))}
          </select>
          
          <select
            value={filtroStock}
            onChange={(e) => setFiltroStock(e.target.value)}
            className="px-4 py-2 border rounded text-sm md:text-base"
          >
            <option key="todos" value="todos">Stock: Todos</option>
            <option key="sin-stock" value="sin-stock">Sin stock (0)</option>
            <option key="poco-stock" value="poco-stock">Poco stock (1-5)</option>
            <option key="con-stock" value="con-stock">Con stock (&gt;5)</option>
          </select>
        </div>
        
        <p className="text-xs md:text-sm text-gray-600">
          Mostrando {productosFiltrados.length} de {productos.length} productos
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {productosFiltrados.map((producto) => (
          <div
            key={producto.id}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <img
              src={producto.imagen || "/placeholder.svg?height=200&width=400"}
              alt={producto.nombre}
              className="w-full h-48 object-cover"
            />
            <div className="p-3 md:p-4">
              <h3 className="font-bold text-sm md:text-lg mb-2">{producto.nombre}</h3>
              <p className="text-xs md:text-sm text-gray-500 mb-2">
                {producto.categoriaNombre}
              </p>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                <span className="text-lg md:text-xl font-bold text-blue-600">
                  S/ {producto.precio.toFixed(2)}
                </span>
                <span className="text-xs md:text-sm text-gray-600">
                  Stock: {producto.stock}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() =>
                    router.push(
                      "/superadmin/productos/editar/" + String(producto.id)
                    )
                  }
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs md:text-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() =>
                    toggleDisponibilidad(producto.id, producto.disponible)
                  }
                  className={`flex-1 px-3 py-2 rounded text-xs md:text-sm ${
                    producto.disponible
                      ? "bg-yellow-600 hover:bg-yellow-700"
                      : "bg-green-600 hover:bg-green-700"
                  } text-white`}
                >
                  {producto.disponible ? "Deshabilitar" : "Habilitar"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
