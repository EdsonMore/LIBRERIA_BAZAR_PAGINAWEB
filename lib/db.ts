import { Pool, QueryResult } from "pg"

// Configuración de la conexión a PostgreSQL
// Si existe DATABASE_URL (Vercel/Neon), úsalo. Si no, usa variables individuales (desarrollo local)
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false },
    }
  : {
      host: process.env.DATABASE_HOST || "localhost",
      port: parseInt(process.env.DATABASE_PORT || "5432"),
      user: process.env.DATABASE_USER || "postgres",
      password: process.env.DATABASE_PASSWORD || "",
      database: process.env.DATABASE_NAME || "licoreriaapp",
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }

const pool = new Pool(poolConfig)

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
    const result = await client.query(convertedSql, params)
    
    const rows = result.rows as T[]
    
    // Para INSERT, agregar insertId del primer resultado
    if (convertedSql.toUpperCase().includes('INSERT') && result.rows.length > 0) {
      (rows as any).insertId = result.rows[0].id
    }
    
    (rows as any).rowCount = result.rowCount || 0
    
    return rows
  } catch (error) {
    console.error("Error en query:", error)
    throw error
  } finally {
    client.release()
  }
}

export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const client = await pool.connect()
  try {
    const convertedSql = convertMysqlToPostgres(sql)
    const result = await client.query(convertedSql, params)
    return result.rows[0] as T || null
  } finally {
    client.release()
  }
}

export async function execute(sql: string, params?: any[]): Promise<number> {
  const client = await pool.connect()
  try {
    const convertedSql = convertMysqlToPostgres(sql)
    const result = await client.query(convertedSql, params)
    return result.rowCount || 0
  } finally {
    client.release()
  }
}

export default pool
