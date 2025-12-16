// app/api/cotizaciones/[id]/agregar-items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUsuarioFromSession } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cotizacion_id } = await params;
    
    // Obtener usuario autenticado
    const usuarioSession = await getUsuarioFromSession(request as any);
    const superadmin_id = usuarioSession?.id;

    const items = await request.json();

    if (!cotizacion_id || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const insertedItems = [];

    for (const item of items) {
      const { nombre_producto, cantidad, precio_unitario, producto_id, encontrado_en_bd } = item;

      const subtotal = (cantidad || 1) * (precio_unitario || 0);

      const result = await query(
        `INSERT INTO cotizacion_items 
        (cotizacion_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal, encontrado_en_bd)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, nombre_producto, cantidad, precio_unitario, subtotal`,
        [
          cotizacion_id,
          producto_id || null,
          nombre_producto || 'Sin nombre',
          cantidad || 1,
          precio_unitario || 0,
          subtotal,
          encontrado_en_bd || false,
        ]
      );

      if (result.length > 0) {
        insertedItems.push(result[0]);
      }
    }

    // Actualizar estado de cotización a EN_COTIZACION y guardar superadmin_id
    await query('UPDATE cotizacion_listas SET estado = $1, superadmin_id = $2, fecha_actualizacion = NOW() WHERE id = $3', [
      'EN_COTIZACION',
      superadmin_id || null,
      cotizacion_id,
    ]);

    return NextResponse.json({ success: true, items: insertedItems }, { status: 201 });
  } catch (error: any) {
    console.error('Error al agregar items:', error);
    return NextResponse.json({ error: error.message || 'Error al agregar items' }, { status: 500 });
  }
}

// GET - Obtener items de una cotización
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cotizacion_id } = await params;

    if (!cotizacion_id) {
      return NextResponse.json(
        { error: 'ID de cotización requerido' },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT 
        id,
        nombre_producto,
        cantidad,
        precio_unitario,
        subtotal,
        encontrado_en_bd,
        producto_id
      FROM cotizacion_items
      WHERE cotizacion_id = $1
      ORDER BY id ASC`,
      [cotizacion_id]
    );

    const total = result.reduce((sum: number, item: any) => sum + parseFloat(item.subtotal), 0);

    return NextResponse.json({
      success: true,
      items: result,
      total: parseFloat(total.toFixed(2)),
    });
  } catch (error) {
    console.error('Error obteniendo items:', error);
    return NextResponse.json(
      { error: 'Error al obtener los items' },
      { status: 500 }
    );
  }
}
