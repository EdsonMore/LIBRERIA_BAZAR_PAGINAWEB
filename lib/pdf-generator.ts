// lib/pdf-generator.ts
// Generador de cotizaciones en PDF profesionales

import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare global {
  namespace jsPDF {
    interface jsPDF {
      lastAutoTable?: {
        finalY: number;
      };
    }
  }
}

interface CotizacionItem {
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface CotizacionData {
  id: number;
  nombreCliente: string;
  emailCliente: string;
  telefonoCliente?: string;
  titulo: string;
  items: CotizacionItem[];
  total: number;
  fecha: Date;
  observaciones?: string;
}

/**
 * Genera un PDF profesional con la cotización
 */
export function generarPDFCotizacion(data: CotizacionData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 15;

  // Color principal de la marca
  const colorPrimario = [200, 216, 0]; // #C8D800 (Falabella lime)

  // ENCABEZADO
  doc.setFillColor(colorPrimario[0] as number, colorPrimario[1] as number, colorPrimario[2] as number);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Logo/Nombre de empresa
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('TIENDA BAZAR', 15, 20);

  // Subtítulo
  doc.setFontSize(10);
  doc.text('Cotización de Lista Escolar', 15, 28);

  // Número de cotización
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  const cotizacionText = `Cotización #${data.id || 'S/N'}`;
  const fechaText = `Fecha: ${new Date(data.fecha).toLocaleDateString('es-PE')}`;
  doc.text(cotizacionText || '', pageWidth - 40, 25);
  doc.text((fechaText || '') as string, pageWidth - 40, 32);

  yPosition = 50;

  // INFORMACIÓN DEL CLIENTE
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL CLIENTE', 15, yPosition);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  yPosition += 8;
  const nombreClienteText = `Nombre: ${data.nombreCliente || 'N/A'}`;
  const emailClienteText = `Email: ${data.emailCliente || 'N/A'}`;
  doc.text(nombreClienteText || '', 15, yPosition);
  yPosition += 6;
  doc.text(emailClienteText || '', 15, yPosition);
  if (data.telefonoCliente) {
    yPosition += 6;
    const telefonoText = `Teléfono: ${data.telefonoCliente}`;
    doc.text(telefonoText, 15, yPosition);
  }

  yPosition += 12;

  // TÍTULO DE LA LISTA
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const tituloText = `Lista: ${data.titulo || 'Sin título'}`;
  doc.text(tituloText || '', 15, yPosition);

  yPosition += 15;

  // TABLA DE PRODUCTOS
  const tableData = data.items.map((item) => [
    item.nombre_producto || 'N/A',
    (item.cantidad || 0).toString(),
    `S/. ${(Number(item.precio_unitario) || 0).toFixed(2)}`,
    `S/. ${(Number(item.subtotal) || 0).toFixed(2)}`,
  ]);

  // @ts-ignore - jspdf-autotable adds methods to jsPDF
  doc.autoTable({
    startY: yPosition,
    head: [['Producto', 'Cantidad', 'Precio Unit.', 'Subtotal']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: colorPrimario as [number, number, number],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center' as const,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [0, 0, 0],
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { halign: 'left' as const, cellWidth: 80 },
      1: { halign: 'center' as const },
      2: { halign: 'right' as const },
      3: { halign: 'right' as const },
    },
    margin: { left: 15, right: 15 },
  });

  // Obtener posición después de la tabla
  const finalY = (doc as any).lastAutoTable?.finalY || yPosition + 100;

  // TOTAL
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colorPrimario[0] as number, colorPrimario[1] as number, colorPrimario[2] as number);

  const totalX = pageWidth - 45;
  const totalText = `TOTAL: S/. ${(data.total || 0).toFixed(2)}`;
  doc.text(totalText || '', totalX, finalY + 15, {
    align: 'right',
  });

  // OBSERVACIONES
  if (data.observaciones) {
    yPosition = finalY + 25;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Observaciones:', 15, yPosition);

    doc.setFont('helvetica', 'normal');
    yPosition += 6;
    const obsLines = doc.splitTextToSize(data.observaciones || '', pageWidth - 30);
    doc.text(obsLines || [], 15, yPosition);
  }

  // FOOTER
  yPosition = pageHeight - 20;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Este documento fue generado automáticamente por Tienda Bazar', 15, yPosition);
  const footerText = 'Para comprar, ingresa a www.tiendabazar.com o contactanos a info@tiendabazar.com';
  doc.text((footerText || '') as string, 15, yPosition + 5);

  return doc;
}

/**
 * Genera una imagen (PNG) de la cotización
 */
export async function generarImagenCotizacion(data: CotizacionData): Promise<string> {
  const doc = generarPDFCotizacion(data);
  // Nota: Para convertir PDF a imagen necesitarías canvas o sharp
  // Por ahora retornamos una URL vacía
  return '';
}

/**
 * Guarda el PDF y retorna la URL
 */
export async function guardarPDFCotizacion(data: CotizacionData, carpetaDestino: string): Promise<string> {
  const doc = generarPDFCotizacion(data);
  const nombreArchivo = `cotizacion_${data.id || 'temp'}_${Date.now()}.pdf`;
  const ruta = `${carpetaDestino}/${nombreArchivo}`;

  // Guardar el PDF (implementación según tu backend)
  doc.save(ruta);

  return `/uploads/cotizaciones/${nombreArchivo}`;
}
