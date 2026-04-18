const { Pool } = require('pg');
const bcrypt = require('./node_modules/bcryptjs') || null; // may not exist
const crypto = require('crypto');

const pool = new Pool({ connectionString: process.env.PORTAL_DB_URL });
(async () => {
  const res = await pool.query('SELECT username, "hashedPassword" FROM "User" WHERE username = $1', ['guru-angga']);
  const hash = res.rows[0].hashedPassword;
  console.log('Hash:', hash);
  
  // bcryptjs is not installed in sync container, but we can check via a child process
  // Instead just verify the format
  const parts = hash.split('$');
  console.log('Algorithm:', parts[1]);
  console.log('Rounds:', parts[2]);
  console.log('Salt+Hash:', parts[3]);
  console.log('Valid bcrypt format:', parts.length === 4 && parts[1] === '2b' && parts[3].length === 53);
  
  await pool.end();
})();
