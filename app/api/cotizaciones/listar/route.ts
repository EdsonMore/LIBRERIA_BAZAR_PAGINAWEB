// app/api/cotizaciones/listar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query as dbQuery } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usuario_id = searchParams.get('usuario_id');
    const estado = searchParams.get('estado');
    const rol = searchParams.get('rol'); // CLIENTE o SUPERADMIN

    let queryStr = `
      SELECT 
        cl.id,
        cl.usuario_id,
        cl.titulo,
        cl.descripcion,
        cl.archivo_url,
        cl.tipo_archivo,
        cl.estado,
        cl.fecha_creacion,
        cl.fecha_actualizacion,
        u.nombres,
        u.correo,
        (SELECT COUNT(*) FROM cotizacion_items WHERE cotizacion_id = cl.id) as cantidad_items,
        (SELECT COALESCE(SUM(subtotal), 0) FROM cotizacion_items WHERE cotizacion_id = cl.id) as total_temporal,
        cg.total as total_final,
        cg.pdf_url,
        cg.fecha_generacion
      FROM cotizacion_listas cl
      JOIN usuarios u ON cl.usuario_id = u.id
      LEFT JOIN cotizacion_generada cg ON cl.id = cg.cotizacion_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 0;

    // Filtros
    if (rol === 'CLIENTE' && usuario_id) {
      paramCount++;
      queryStr += ` AND cl.usuario_id = $${paramCount}`;
      params.push(usuario_id);
    }

    // Permitir múltiples estados separados por comas
    if (estado) {
      const estados = estado.split(',').map((e: string) => e.trim());
      if (estados.length > 0) {
        const placeholders = estados.map(() => {
          paramCount++;
          return `$${paramCount}`;
        }).join(',');
        queryStr += ` AND cl.estado IN (${placeholders})`;
        params.push(...estados);
      }
    }

    queryStr += ` ORDER BY cl.fecha_creacion DESC`;

    const result = await dbQuery(queryStr, params);

    return NextResponse.json({
      success: true,
      cotizaciones: result,
      total: result.length,
    });
  } catch (error) {
    console.error('Error listando cotizaciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener las cotizaciones' },
      { status: 500 }
    );
  }
}
