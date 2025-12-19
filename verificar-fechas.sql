-- Script para verificar exactamente qué datos hay en la BD
-- Ejecuta esto directamente en tu gestor de BD (pgAdmin, DBeaver, etc.)

-- 1. VER TODAS LAS FECHAS CON VENTAS (con zona horaria Lima)
SELECT 
  DATE(v.fecha_hora AT TIME ZONE 'America/Lima') as fecha,
  COUNT(*) as total_ventas,
  SUM(v.total) as total_ingreso,
  INITCAP(TRIM(COALESCE(u.nombres, v.propietario_nombre))) as propietario_nombre
FROM public.ventas v
LEFT JOIN public.usuarios u ON v.propietario_id = u.id
WHERE v.estado_pago = 'PAGADO'
GROUP BY DATE(v.fecha_hora AT TIME ZONE 'America/Lima'), INITCAP(TRIM(COALESCE(u.nombres, v.propietario_nombre)))
ORDER BY fecha DESC, propietario_nombre ASC;

-- 2. DETALLES POR FECHA (para verificar si realmente hay datos del 16/12)
SELECT 
  v.id,
  v.fecha_hora,
  DATE(v.fecha_hora AT TIME ZONE 'America/Lima') as fecha_lima,
  INITCAP(TRIM(COALESCE(u.nombres, v.propietario_nombre))) as propietario,
  v.total,
  v.estado_pago
FROM public.ventas v
LEFT JOIN public.usuarios u ON v.propietario_id = u.id
WHERE v.estado_pago = 'PAGADO'
  AND DATE(v.fecha_hora AT TIME ZONE 'America/Lima') >= '2025-12-16'
  AND DATE(v.fecha_hora AT TIME ZONE 'America/Lima') <= '2025-12-20'
ORDER BY v.fecha_hora DESC;

-- 3. VERIFICAR LOS DATOS DEL 16/12 ESPECÍFICAMENTE
SELECT 
  'DATOS DEL 16/12/2025' as info,
  COUNT(*) as total_ventas,
  SUM(v.total) as total_ingreso,
  INITCAP(TRIM(COALESCE(u.nombres, v.propietario_nombre))) as propietario
FROM public.ventas v
LEFT JOIN public.usuarios u ON v.propietario_id = u.id
WHERE v.estado_pago = 'PAGADO'
  AND DATE(v.fecha_hora AT TIME ZONE 'America/Lima') = '2025-12-16'
GROUP BY INITCAP(TRIM(COALESCE(u.nombres, v.propietario_nombre)));
