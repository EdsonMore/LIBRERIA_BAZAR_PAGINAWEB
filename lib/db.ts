import { Pool, QueryResult } from "pg"

// Configuración de la conexión a PostgreSQL
// Si existe DATABASE_URL (Vercel/Neon), úsalo. Si no, usa variables individuales (desarrollo local)
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      max: 5, // Reducido para evitar exhaust en Vercel
      min: 1,
      idleTimeoutMillis: 15000, // Reducido para limpiar conexiones inactivas
      connectionTimeoutMillis: 10000, // Aumentado para mejor manejo en Vercel
      statementTimeoutMillis: 30000, // Timeout de query aumentado
      ssl: { rejectUnauthorized: false }, // Para Neon/Railway siempre SSL
      application_name: 'licoreriaapp',
    }
  : {
      host: process.env.DATABASE_HOST || "localhost",
      port: parseInt(process.env.DATABASE_PORT || "5432"),
      user: process.env.DATABASE_USER || "postgres",
      password: process.env.DATABASE_PASSWORD || "",
      database: process.env.DATABASE_NAME || "licoreriaapp",
      max: 10,
      min: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }

const pool = new Pool(poolConfig)

// Manejo de errores del pool
pool.on('error', (error: Error) => {
  console.error('❌ Error no esperado en pool:', error)
})

pool.on('connect', () => {
  console.log('✅ Conexión al pool establecida')
})

pool.on('remove', () => {
  console.log('⚠️ Conexión removida del pool')
})

/**
 * Convierte placeholders de MySQL (?) a PostgreSQL ($1, $2, etc)
 * También convierte INSERT sin RETURNING a INSERT con RETURNING id (solo si no es una tabla de relación)
 */
function convertMysqlToPostgres(sql: string): string {
  let paramIndex = 1
  let converted = sql.replace(/\?/g, () => `$${paramIndex++}`)
  
  // Si es un INSERT y no tiene RETURNING, agregamos RETURNING id
  // PERO NO para tablas de relación como usuario_roles, ruta_roles, etc
  const isRelationshipTable = /INSERT INTO\s+(usuario_roles|ruta_roles|rol_permisos)/i.test(sql)
  
  if (converted.toUpperCase().includes('INSERT') && !converted.toUpperCase().includes('RETURNING') && !isRelationshipTable) {
    converted += ' RETURNING id'
  }
  
  return converted
}

export async function query<T = any>(sql: string, params?: any[]): Promise<(T[] & { insertId?: number | bigint; rowCount?: number })> {
  const client = await pool.connect()
  try {
    const convertedSql = convertMysqlToPostgres(sql)
    console.log("📍 Ejecutando:", convertedSql.substring(0, 100) + "...")
    
    // En lugar de transacciones explícitas, usar modo autocommit (por defecto en pg)
    // Las transacciones explícitas pueden fallar en serverless de Vercel
    const result = await client.query(convertedSql, params)
    
    const rows = result.rows as T[]
    
    // Para INSERT, agregar insertId del primer resultado
    if (convertedSql.toUpperCase().includes('INSERT') && result.rows.length > 0) {
      (rows as any).insertId = result.rows[0].id
    }
    
    (rows as any).rowCount = result.rowCount || 0
    
    return rows
  } catch (error) {
    console.error("❌ Error en query:", error)
    throw error
  } finally {
    try {
      client.release()
    } catch (releaseError) {
      console.error("⚠️ Error al liberar conexión:", releaseError)
    }
  }
}

export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const client = await pool.connect()
  try {
    const convertedSql = convertMysqlToPostgres(sql)
    const result = await client.query(convertedSql, params)
    return result.rows[0] as T || null
  } catch (error) {
    console.error("❌ Error en queryOne:", error)
    throw error
  } finally {
    try {
      client.release()
    } catch (releaseError) {
      console.error("⚠️ Error al liberar conexión:", releaseError)
    }
  }
}

export async function execute(sql: string, params?: any[]): Promise<number> {
  const client = await pool.connect()
  try {
    const convertedSql = convertMysqlToPostgres(sql)
    const result = await client.query(convertedSql, params)
    return result.rowCount || 0
  } catch (error) {
    console.error("❌ Error en execute:", error)
    throw error
  } finally {
    try {
      client.release()
    } catch (releaseError) {
      console.error("⚠️ Error al liberar conexión:", releaseError)
    }
  }
}

export default pool
