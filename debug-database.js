// Script para diagnosticar la estructura real de la base de datos
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vmkfwxsashpozvqmxerc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZta2Z3eHNhc2hwb3p2cW14ZXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjA3MDc5OTksImV4cCI6MjAzNjI4Mzk5OX0.72YVEkM9js7_wKqmxerc-supabase-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugDatabase() {
  console.log('=== DIAGNÓSTICO DE BASE DE DATOS ===')
  
  try {
    // Intentar obtener 1 registro de cada tabla para ver la estructura
    console.log('\n1. ESTRUCTURA DE TENANTS:')
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('*')
      .limit(1)
    
    if (tenantsError) {
      console.error('Error en tenants:', tenantsError)
    } else if (tenants && tenants.length > 0) {
      console.log('Campos disponibles en tenants:', Object.keys(tenants[0]))
      console.log('Ejemplo de registro:', tenants[0])
    } else {
      console.log('No hay registros en tenants')
    }

    console.log('\n2. ESTRUCTURA DE UNITS:')
    const { data: units, error: unitsError } = await supabase
      .from('units')
      .select('*')
      .limit(1)
    
    if (unitsError) {
      console.error('Error en units:', unitsError)
    } else if (units && units.length > 0) {
      console.log('Campos disponibles en units:', Object.keys(units[0]))
      console.log('Ejemplo de registro:', units[0])
    } else {
      console.log('No hay registros en units')
    }

    console.log('\n3. ESTRUCTURA DE PROPERTIES:')
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('*')
      .limit(1)
    
    if (propertiesError) {
      console.error('Error en properties:', propertiesError)
    } else if (properties && properties.length > 0) {
      console.log('Campos disponibles en properties:', Object.keys(properties[0]))
      console.log('Ejemplo de registro:', properties[0])
    } else {
      console.log('No hay registros en properties')
    }

    console.log('\n4. ESTRUCTURA DE MAINTENANCE_REQUESTS:')
    const { data: maintenance, error: maintenanceError } = await supabase
      .from('maintenance_requests')
      .select('*')
      .limit(1)
    
    if (maintenanceError) {
      console.error('Error en maintenance_requests:', maintenanceError)
    } else if (maintenance && maintenance.length > 0) {
      console.log('Campos disponibles en maintenance_requests:', Object.keys(maintenance[0]))
      console.log('Ejemplo de registro:', maintenance[0])
    } else {
      console.log('No hay registros en maintenance_requests')
    }

  } catch (error) {
    console.error('Error general:', error)
  }
}

debugDatabase()