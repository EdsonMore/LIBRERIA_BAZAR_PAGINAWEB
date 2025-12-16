// app/api/cotizaciones/[id]/generar-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generarPDFCotizacion } from '@/lib/pdf-generator';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getUsuarioFromSession } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cotizacion_id } = await params;
    const { observaciones } = await request.json();
    
    // Obtener usuario autenticado
    const usuarioSession = await getUsuarioFromSession(request as any);
    const superadmin_id = usuarioSession?.id;

    if (!cotizacion_id) {
      return NextResponse.json(
        { error: 'ID de cotización requerido' },
        { status: 400 }
      );
    }

    // Obtener datos de la cotización
    const cotizacion = await query(
      `SELECT cl.id, cl.titulo, u.nombres, u.correo, u.numero
      FROM cotizacion_listas cl
      JOIN usuarios u ON cl.usuario_id = u.id
      WHERE cl.id = $1`,
      [cotizacion_id]
    );

    if (cotizacion.length === 0) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      );
    }

    const { id, titulo, nombres, correo, numero } = cotizacion[0];

    // Obtener items de la cotización
    const items = await query(
      `SELECT nombre_producto, cantidad, precio_unitario, subtotal
      FROM cotizacion_items
      WHERE cotizacion_id = $1`,
      [cotizacion_id]
    );

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'La cotización no tiene items' },
        { status: 400 }
      );
    }

    const total = items.reduce(
      (sum: number, item: any) => sum + parseFloat(item.subtotal),
      0
    );

    // Generar PDF
    const pdfDoc = generarPDFCotizacion({
      id: parseInt(id),
      nombreCliente: nombres,
      emailCliente: correo,
      telefonoCliente: numero,
      titulo,
      items: items.map((item: any) => ({
        nombre_producto: item.nombre_producto,
        cantidad: Number(item.cantidad),
        precio_unitario: Number(item.precio_unitario),
        subtotal: Number(item.subtotal),
      })),
      total,
      fecha: new Date(),
      observaciones,
    });

    // Guardar archivo
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'cotizaciones');
    
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (e) {
      // Directorio ya existe
    }

    const fileName = `cotizacion_${id}_${Date.now()}.pdf`;
    const filePath = join(uploadsDir, fileName);
    
    const pdfBuffer = Buffer.from(pdfDoc.output('arraybuffer'));
    await writeFile(filePath, pdfBuffer);

    const pdfUrl = `/uploads/cotizaciones/${fileName}`;

    // Guardar en BD
    await query(
      `INSERT INTO cotizacion_generada (cotizacion_id, pdf_url, total, observaciones, superadmin_id)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (cotizacion_id) 
      DO UPDATE SET pdf_url = $2, total = $3, observaciones = $4, superadmin_id = $5, fecha_generacion = NOW()`,
      [cotizacion_id, pdfUrl, total, observaciones || null, superadmin_id || null]
    );

    // Actualizar estado
    await query(
      `UPDATE cotizacion_listas 
      SET estado = 'COTIZADO', fecha_actualizacion = NOW()
      WHERE id = $1`,
      [cotizacion_id]
    );

    return NextResponse.json({
      success: true,
      pdfUrl,
      total,
      message: 'PDF generado exitosamente',
    });
  } catch (error) {
    console.error('Error generando PDF:', error);
    return NextResponse.json(
      { error: 'Error al generar el PDF' },
      { status: 500 }
    );
  }
}
