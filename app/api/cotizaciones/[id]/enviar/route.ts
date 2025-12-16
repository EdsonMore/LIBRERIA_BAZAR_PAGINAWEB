// app/api/cotizaciones/[id]/enviar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cotizacion_id = searchParams.get('id');
    const { metodo_envio, correo_destino } = await request.json();

    if (!cotizacion_id || !metodo_envio) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      );
    }

    // Validar que la cotización exista y esté cotizada
    const cotizacion = await query(
      `SELECT cg.pdf_url, u.correo, u.numero
      FROM cotizacion_listas cl
      JOIN cotizacion_generada cg ON cl.id = cg.cotizacion_id
      JOIN usuario u ON cl.usuario_id = u.id
      WHERE cl.id = $1 AND cl.estado = 'COTIZADO'`,
      [cotizacion_id]
    );

    if (cotizacion.length === 0) {
      return NextResponse.json(
        { error: 'Cotización no encontrada o no está lista' },
        { status: 404 }
      );
    }

    const { pdf_url, correo, numero } = cotizacion[0];

    // Registrar envío
    await query(
      `INSERT INTO cotizacion_envios (cotizacion_id, metodo_envio, enviado_a, estado_envio)
      VALUES ($1, $2, $3, 'COMPLETADO')`,
      [
        cotizacion_id,
        metodo_envio,
        metodo_envio === 'EMAIL' ? correo_destino || correo : numero,
      ]
    );

    // Actualizar estado a ENVIADO
    await query(
      `UPDATE cotizacion_listas 
      SET estado = 'ENVIADO', fecha_actualizacion = NOW()
      WHERE id = $1`,
      [cotizacion_id]
    );

    let mensaje = '';

    switch (metodo_envio) {
      case 'EMAIL':
        mensaje = `Cotización enviada a ${correo_destino || correo}`;
        // Aquí iría integración con servicio de email (SendGrid, Resend, etc.)
        break;
      case 'WHATSAPP':
        mensaje = `Comparte este enlace por WhatsApp: ${process.env.NEXT_PUBLIC_APP_URL}/cotizaciones/ver/${cotizacion_id}`;
        break;
      case 'DESCARGA':
        mensaje = `PDF disponible para descargar: ${pdf_url}`;
        break;
    }

    return NextResponse.json({
      success: true,
      mensaje,
      pdfUrl: pdf_url,
    });
  } catch (error) {
    console.error('Error enviando cotización:', error);
    return NextResponse.json(
      { error: 'Error al enviar la cotización' },
      { status: 500 }
    );
  }
}
