-- QUERY EXACTO que debería estar haciendo el API con fechas 2025-12-17 al 2025-12-20
SELECT 
  DATE(v.fecha_hora AT TIME ZONE 'America/Lima') as fecha,
  INITCAP(TRIM(COALESCE(u.nombres, v.propietario_nombre))) as propietario_nombre,
  COUNT(DISTINCT v.id) as ventas_del_dia,
  SUM(v.total) as ingreso_del_dia
FROM public.ventas v
LEFT JOIN public.usuarios u ON v.propietario_id = u.id
WHERE v.estado_pago = 'PAGADO'
  AND DATE(v.fecha_hora AT TIME ZONE 'America/Lima') >= '2025-12-17'::date
  AND DATE(v.fecha_hora AT TIME ZONE 'America/Lima') <= '2025-12-20'::date
GROUP BY DATE(v.fecha_hora AT TIME ZONE 'America/Lima'), INITCAP(TRIM(COALESCE(u.nombres, v.propietario_nombre)))
ORDER BY fecha DESC, propietario_nombre ASC;
