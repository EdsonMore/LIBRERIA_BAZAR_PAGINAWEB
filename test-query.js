const pg = require('pg');

const client = new pg.Client({
  connectionString: 'postgresql://postgres:1234@localhost:5432/licoreriaapp'
});

client.connect().then(async () => {
  const res = await client.query(`
    SELECT u.id, u."user", u.password, u.correo, u.nombres, u.apellido_paterno, u.apellido_materno,
           u.direccion1, u.direccion2, u.numero, u.genero, u.dni, u.fecha_nacimiento, 
           u.fecha_registro, u.tipo_doc, u.activo,
           STRING_AGG(r.id::text, ',') as roleIds, 
           STRING_AGG(r.nombre, ',') as roleNombres
    FROM usuarios u
    LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
    LEFT JOIN roles r ON ur.rol_id = r.id
    WHERE u.id = 5 AND u.activo = true
    GROUP BY u.id, u."user", u.password, u.correo, u.nombres, u.apellido_paterno, u.apellido_materno,
             u.direccion1, u.direccion2, u.numero, u.genero, u.dni, u.fecha_nacimiento, 
             u.fecha_registro, u.tipo_doc, u.activo
  `);
  
  console.log('=== RESULTADO QUERY GETSUARIO ===');
  if (res.rows.length > 0) {
    console.log(JSON.stringify(res.rows[0], null, 2));
  } else {
    console.log('NO HAY RESULTADOS');
  }
  
  client.end();
}).catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
