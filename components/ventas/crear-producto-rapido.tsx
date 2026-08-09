"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface CrearProductoRapidoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  codigoInicial: string
  onProductoCreado: (producto: { id: number; nombre: string; precio: number }) => void
}

export function CrearProductoRapido({
  open,
  onOpenChange,
  codigoInicial,
  onProductoCreado,
}: CrearProductoRapidoProps) {
  const [nombre, setNombre] = useState("")
  const [precio, setPrecio] = useState("")
  const [stock, setStock] = useState("0")
  const [codigo, setCodigo] = useState(codigoInicial)
  const [categorias, setCategorias] = useState<any[]>([])
  const [categoriaId, setCategoriaId] = useState<string>("")
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setCodigo(codigoInicial)
      setNombre("")
      setPrecio("")
      setStock("0")
      setCategoriaId("")
      setError(null)
    }
  }, [open, codigoInicial])

  useEffect(() => {
    if (!open) return
    const cargar = async () => {
      try {
        const res = await fetch("/api/categorias/activas")
        const data = await res.json()
        setCategorias(Array.isArray(data) ? data : data.categorias || [])
      } catch (err) {
        console.error("Error cargando categorías:", err)
      }
    }
    void cargar()
  }, [open])

  const handleCrear = async () => {
    setError(null)
    if (!nombre.trim()) {
      setError("El nombre es obligatorio")
      return
    }
    const precioNum = parseFloat(precio)
    if (isNaN(precioNum) || precioNum <= 0) {
      setError("Ingresa un precio válido")
      return
    }
    if (!codigo.trim()) {
      setError("El código de barras es obligatorio")
      return
    }
    if (codigo.trim().length > 60) {
      setError("El código de barras no puede superar los 60 caracteres")
      return
    }

    try {
      setCargando(true)
      const res = await fetch("/api/ventas/producto-rapido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          precio: precioNum,
          stock: parseInt(stock || "0", 10),
          codigo_barras: codigo.trim(),
          categoria_id: categoriaId ? parseInt(categoriaId, 10) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Error al crear el producto")
        return
      }
      onProductoCreado({
        id: data.id,
        nombre: nombre.trim(),
        precio: precioNum,
      })
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || "Error al crear el producto")
    } finally {
      setCargando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Producto no encontrado</DialogTitle>
          <DialogDescription>
            El código <span className="font-semibold">{codigo || "---"}</span> no está registrado. Crea el producto para
            agregarlo a la venta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="cb-crear-codigo">Código de barras</Label>
            <Input id="cb-crear-codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="cb-crear-nombre">Nombre *</Label>
            <Input id="cb-crear-nombre" placeholder="Ej: Pisco Acholado Premium 750ml" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cb-crear-precio">Precio (S/.) *</Label>
              <Input id="cb-crear-precio" type="number" min="0" step="0.01" placeholder="0.00" value={precio} onChange={(e) => setPrecio(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="cb-crear-stock">Stock</Label>
              <Input id="cb-crear-stock" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Categoría (opcional)</Label>
            <Select value={categoriaId} onValueChange={setCategoriaId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categorias.length === 0 && (
                  <div className="p-2 text-sm text-gray-500">Sin categorías</div>
                )}
                {categorias.map((c: any) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleCrear} disabled={cargando}>
            {cargando ? "Creando..." : "Crear y agregar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}