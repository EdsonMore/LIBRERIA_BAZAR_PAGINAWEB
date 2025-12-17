import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    if (!user || !user.roles?.some((r: any) => ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"].includes(r.nombre))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    // Validar tamaño: máximo 5MB para imágenes
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Archivo demasiado grande. Máximo 5MB.' },
        { status: 400 }
      );
    }

    // Validar tipo: solo imágenes
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo JPEG, PNG, WebP o GIF.' },
        { status: 400 }
      );
    }

    // Convertir a base64 (es la mejor opción para Vercel serverless)
    // Ya no intentamos escribir archivos en el filesystem
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Validar que no sea demasiado grande cuando codificado
    if (dataUrl.length > 1000000) {
      return NextResponse.json(
        { error: 'Imagen codificada demasiado grande. Intenta con una imagen más pequeña.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      url: dataUrl,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    return NextResponse.json(
      { error: 'Error al subir imagen' },
      { status: 500 }
    );
  }
}
