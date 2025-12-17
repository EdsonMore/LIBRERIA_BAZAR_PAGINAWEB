import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo JPEG, PNG o WebP.' },
        { status: 400 }
      );
    }

    // Crear nombre único
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}-${random}-${file.name}`;

    // Ruta de guardado
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'productos');

    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (e) {
      // Directorio ya existe
    }

    const filepath = join(uploadsDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const url = `/uploads/productos/${filename}`;

    return NextResponse.json({
      success: true,
      url,
      filename,
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
