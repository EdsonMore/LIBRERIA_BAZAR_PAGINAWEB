import { jsPDF } from "jspdf"

interface BoletaData {
  numeroBoleta: string
  compraId: number
  fechaGeneracion: string
  fechaCompra: string
  cliente: {
    nombres: string
    apellidoPaterno: string
    correo: string
    telefono: string
  }
  entrega: {
    direccion: string
    numeroSeguimiento: string
  }
  metodoPago: string
  detalles: Array<{
    nombre: string
    cantidad: number
    precioUnitario: number
    subtotal: number
  }>
  resumen: {
    subtotal: number
    igv: number
    igvActivo: boolean
    costoEnvio: number
    envioActivo: boolean
    total: number
  }
}

export function generarPDFBoleta(boleta: BoletaData): Uint8Array {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  let yPosition = 20

  // Encabezado
  doc.setFontSize(24)
  doc.text("BOLETA", 105, yPosition, { align: "center" })
  yPosition += 10

  doc.setFontSize(12)
  doc.text(boleta.numeroBoleta, 105, yPosition, { align: "center" })
  yPosition += 10

  // Línea separadora
  doc.setDrawColor(0)
  doc.line(15, yPosition, 195, yPosition)
  yPosition += 10

  // Información de compra
  doc.setFontSize(11)
  doc.text("Información de Compra", 15, yPosition)
  yPosition += 7

  doc.setFontSize(10)
  doc.text(`Compra #: ${boleta.compraId}`, 15, yPosition)
  yPosition += 5
  doc.text(`Fecha de Compra: ${new Date(boleta.fechaCompra).toLocaleDateString("es-PE")}`, 15, yPosition)
  yPosition += 5
  doc.text(`Fecha de Generación: ${new Date(boleta.fechaGeneracion).toLocaleDateString("es-PE")}`, 15, yPosition)
  yPosition += 10

  // Información del cliente
  doc.setFontSize(11)
  doc.text("Información del Cliente", 15, yPosition)
  yPosition += 7

  doc.setFontSize(10)
  doc.text(`Nombres: ${boleta.cliente.nombres} ${boleta.cliente.apellidoPaterno}`, 15, yPosition)
  yPosition += 5
  doc.text(`Correo: ${boleta.cliente.correo}`, 15, yPosition)
  yPosition += 5
  doc.text(`Teléfono: ${boleta.cliente.telefono || "N/A"}`, 15, yPosition)
  yPosition += 10

  // Información de entrega
  doc.setFontSize(11)
  doc.text("Información de Entrega", 15, yPosition)
  yPosition += 7

  doc.setFontSize(10)
  doc.text(`Dirección: ${boleta.entrega.direccion}`, 15, yPosition)
  yPosition += 5
  doc.text(`N° Seguimiento: ${boleta.entrega.numeroSeguimiento}`, 15, yPosition)
  yPosition += 5
  doc.text(`Método de Pago: ${boleta.metodoPago}`, 15, yPosition)
  yPosition += 10

  // Línea separadora
  doc.line(15, yPosition, 195, yPosition)
  yPosition += 10

  // Tabla de detalles
  doc.setFontSize(11)
  doc.text("Detalle de Compra", 15, yPosition)
  yPosition += 8

  // Encabezados de tabla
  doc.setFontSize(9)
  doc.setFillColor(200, 200, 200)
  doc.rect(15, yPosition - 5, 180, 6, "F")

  doc.text("Producto", 20, yPosition)
  doc.text("Cant.", 130, yPosition)
  doc.text("P.U.", 150, yPosition)
  doc.text("Subtotal", 170, yPosition)
  yPosition += 8

  // Filas de tabla
  boleta.detalles.forEach((detalle) => {
    const nombreTruncado =
      detalle.nombre.length > 50 ? detalle.nombre.substring(0, 50) + "..." : detalle.nombre

    doc.setFontSize(9)
    doc.text(nombreTruncado, 20, yPosition)
    doc.text(detalle.cantidad.toString(), 130, yPosition)
    doc.text(`S/ ${detalle.precioUnitario.toFixed(2)}`, 150, yPosition)
    doc.text(`S/ ${detalle.subtotal.toFixed(2)}`, 170, yPosition)
    yPosition += 6
  })

  // Línea separadora
  doc.line(15, yPosition, 195, yPosition)
  yPosition += 10

  // Resumen de totales
  doc.setFontSize(10)
  doc.text(`Subtotal: S/ ${boleta.resumen.subtotal.toFixed(2)}`, 150, yPosition)
  yPosition += 6

  if (boleta.resumen.igvActivo) {
    doc.text(`IGV (18%): S/ ${boleta.resumen.igv.toFixed(2)}`, 150, yPosition)
    yPosition += 6
  }

  if (boleta.resumen.envioActivo) {
    doc.text(`Envío: S/ ${boleta.resumen.costoEnvio.toFixed(2)}`, 150, yPosition)
    yPosition += 6
  }

  yPosition += 3
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text(`TOTAL: S/ ${boleta.resumen.total.toFixed(2)}`, 150, yPosition)

  yPosition += 15

  // Pie de página
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text("Gracias por tu compra.", 105, yPosition, { align: "center" })
  yPosition += 4
  doc.text("Esta boleta es un comprobante de la transacción.", 105, yPosition, { align: "center" })

  // Obtener PDF como bytes
  const pdfBytes = doc.output("arraybuffer")
  return new Uint8Array(pdfBytes)
}
