// app/api/cotizaciones/historial-superadmin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUsuarioFromSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Obtener usuario autenticado
    const usuarioSession = await getUsuarioFromSession(request as any);
    
    if (!usuarioSession?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const superadmin_id = usuarioSession.id;

    // Obtener todas las cotizaciones cotizadas por este superadmin
    const cotizaciones = await query(
      `SELECT 
        cl.id,
        cl.usuario_id,
        cl.titulo,
        cl.descripcion,
        cl.estado,
        cl.fecha_creacion,
        cl.fecha_actualizacion,
        u.nombres as cliente_nombre,
        u.correo as cliente_correo,
        (SELECT COUNT(*) FROM cotizacion_items WHERE cotizacion_id = cl.id) as cantidad_items,
        (SELECT COALESCE(SUM(subtotal), 0) FROM cotizacion_items WHERE cotizacion_id = cl.id) as total_temporal,
        cg.total as total_final,
        cg.pdf_url,
        cg.fecha_generacion
      FROM cotizacion_listas cl
      JOIN usuarios u ON cl.usuario_id = u.id
      LEFT JOIN cotizacion_generada cg ON cl.id = cg.cotizacion_id
      WHERE cl.superadmin_id = $1
      ORDER BY cl.fecha_actualizacion DESC`,
      [superadmin_id]
    );

    return NextResponse.json({
      success: true,
      cotizaciones,
      total: cotizaciones.length,
    });
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return NextResponse.json(
      { error: 'Error al obtener el historial' },
      { status: 500 }
    );
  }
}
