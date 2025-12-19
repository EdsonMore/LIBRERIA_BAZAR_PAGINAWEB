// Script para probar qué devuelve el API de metricas-diarias
// Ejecuta esto en la consola del navegador mientras estés en la página de reportes

const filtroInicio = document.querySelector('input[type="date"]').value; // 2025-12-17
const filtroFin = document.querySelectorAll('input[type="date"]')[1].value; // 2025-12-20

const params = new URLSearchParams();
params.append('fechaInicio', new Date(filtroInicio).toISOString());
params.append('fechaFin', new Date(filtroFin).toISOString());

console.log('Enviando parámetros:');
console.log('fechaInicio:', new Date(filtroInicio).toISOString());
console.log('fechaFin:', new Date(filtroFin).toISOString());

fetch(`/api/ventas/reportes/metricas-diarias?${params.toString()}`)
  .then(r => r.json())
  .then(data => {
    console.log('=== RESPUESTA DEL API ===');
    console.log('metricasPorPropietario:');
    data.metricasPorPropietario.forEach(m => {
      console.log(`${m.propietario_nombre} - ${m.fecha}: ${m.ventas_del_dia} ventas`);
    });
  });
