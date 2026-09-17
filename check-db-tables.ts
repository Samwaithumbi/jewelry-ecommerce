import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config();

const sql = neon(process.env.DATABASE_URL || '');

async function checkTables() {
  try {
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('Tables in database:');
    tables.forEach((table: any) => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Check specifically for payments table
    const paymentsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'payments'
      )
    `;
    
    console.log(`\nPayments table exists: ${paymentsExists[0].exists}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTables();
