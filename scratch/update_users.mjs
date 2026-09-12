import bcrypt from 'bcryptjs';
import { initDb, query } from './src/db/index.js';

async function updateCredentials() {
  await initDb();

  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('saifullah@123', salt);
  const studentPasswordHash = await bcrypt.hash('Student123!', salt);

  console.log('--- Updating / Seeding User Accounts in Database ---');

  // 1. Admin Account: admin@saifullah.ai / saifullah@123
  const existingAdmin = (await query('SELECT id, email FROM users WHERE email = $1', ['admin@saifullah.ai'])).rows[0];
  if (existingAdmin) {
    await query('UPDATE users SET password_hash = $1, name = $2, role = $3 WHERE id = $4', [
      adminPasswordHash,
      'Saifullah (Admin)',
      'admin',
      existingAdmin.id,
    ]);
    console.log('Updated existing admin@saifullah.ai account.');
  } else {
    // Check if there was an old admin like sarah.mitchell@university.edu
    const oldAdmin = (await query('SELECT id, email FROM users WHERE email = $1', ['sarah.mitchell@university.edu'])).rows[0];
    if (oldAdmin) {
      await query('UPDATE users SET email = $1, password_hash = $2, name = $3 WHERE id = $4', [
        'admin@saifullah.ai',
        adminPasswordHash,
        'Saifullah (Admin)',
        oldAdmin.id,
      ]);
      console.log('Migrated old admin to admin@saifullah.ai.');
    } else {
      await query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, 'admin')`,
        ['Saifullah (Admin)', 'admin@saifullah.ai', adminPasswordHash]
      );
      console.log('Inserted new admin@saifullah.ai.');
    }
  }

  // 2. Demo Student Account: name Saifullah, email saifullah@student.edu
  const existingStudent = (await query('SELECT id, email FROM users WHERE email = $1', ['saifullah@student.edu'])).rows[0];
  if (existingStudent) {
    await query('UPDATE users SET name = $1, password_hash = $2 WHERE id = $3', [
      'Saifullah',
      studentPasswordHash,
      existingStudent.id,
    ]);
    console.log('Updated existing saifullah@student.edu account.');
  } else {
    const oldStudent = (await query('SELECT id, email FROM users WHERE email = $1', ['alex@student.edu'])).rows[0];
    if (oldStudent) {
      await query('UPDATE users SET email = $1, name = $2, password_hash = $3 WHERE id = $4', [
        'saifullah@student.edu',
        'Saifullah',
        studentPasswordHash,
        oldStudent.id,
      ]);
      console.log('Updated alex@student.edu to saifullah@student.edu (Name: Saifullah).');
    } else {
      await query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, 'student')`,
        ['Saifullah', 'saifullah@student.edu', studentPasswordHash]
      );
      console.log('Inserted new saifullah@student.edu.');
    }
  }

  // Also verify users in table
  const allUsers = (await query('SELECT id, name, email, role FROM users')).rows;
  console.log('Active users in database:');
  console.table(allUsers);
}

updateCredentials().catch(console.error);
