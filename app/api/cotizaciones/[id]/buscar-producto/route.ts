// app/api/cotizaciones/[id]/buscar-producto/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { normalizarNombreProducto } from '@/lib/text-extraction';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nombre = searchParams.get('nombre');

    if (!nombre || nombre.length < 2) {
      return NextResponse.json(
        { error: 'Nombre de producto muy corto' },
        { status: 400 }
      );
    }

    const nombreNormalizado = normalizarNombreProducto(nombre);

    // Buscar en la BD usando ILIKE (case-insensitive)
    const result = await query(
      `SELECT 
        id,
        nombre,
        descripcion,
        precio,
        categoria_id
      FROM producto
      WHERE LOWER(nombre) LIKE LOWER($1)
        AND estado = true
      LIMIT 5`,
      ['%' + nombre + '%']
    );

    if (result.length > 0) {
      return NextResponse.json({
        encontrado: true,
        productos: result,
        mensaje: `Se encontraron ${result.length} producto(s)`,
      });
    }

    // Si no encuentra coincidencias exactas, retornar sugerencias
    return NextResponse.json({
      encontrado: false,
      productos: [],
      mensaje: 'No se encontraron productos con ese nombre en el catálogo',
      sugerencia: 'Puede ingresar manualmente el nombre y precio',
    });
  } catch (error) {
    console.error('Error buscando producto:', error);
    return NextResponse.json(
      { error: 'Error al buscar el producto' },
      { status: 500 }
    );
  }
}
