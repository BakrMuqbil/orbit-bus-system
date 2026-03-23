import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false 
  }
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('🔴 خطأ في الاتصال بقاعدة البيانات:', err.stack);
  }
  console.log('🟢 تم الاتصال بقاعدة بيانات PostgreSQL بنجاح');
  release();
});

export default {
  query: (text, params) => pool.query(text, params),
};
