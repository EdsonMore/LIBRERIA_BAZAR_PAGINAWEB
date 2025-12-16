// app/api/cotizaciones/crear/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { usuario_id, titulo, descripcion, archivo_url, tipo_archivo, texto_extraido } =
      await request.json();

    // Validar usuario autenticado
    if (!usuario_id) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // Insertar nueva cotización
    const result = await query(
      `INSERT INTO cotizacion_listas 
      (usuario_id, titulo, descripcion, archivo_url, tipo_archivo, texto_extraido, estado)
      VALUES ($1, $2, $3, $4, $5, $6, 'PENDIENTE')
      RETURNING id, usuario_id, titulo, estado, fecha_creacion`,
      [usuario_id, titulo || '', descripcion || '', archivo_url || '', tipo_archivo || '', texto_extraido || '']
    );

    return NextResponse.json({
      success: true,
      cotizacion: result[0] || {},
      message: 'Solicitud de cotización enviada. El SuperAdmin la cotizará pronto.',
    });
  } catch (error) {
    console.error('Error creando cotización:', error);
    return NextResponse.json(
      { error: 'Error al crear la solicitud de cotización' },
      { status: 500 }
    );
  }
}
