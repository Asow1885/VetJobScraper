import { db } from '../server/db';
import { users } from '../shared/schema';
import { hashPassword } from '../server/auth';
import { eq } from 'drizzle-orm';

async function createAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@guineajobs.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin123!ChangeMe';
    const username = 'admin';
    
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (existing) {
      console.log('❌ Admin user already exists with email:', email);
      process.exit(1);
    }
    
    const password_hash = await hashPassword(password);
    
    const [admin] = await db.insert(users).values({
      username,
      email,
      passwordHash: password_hash,
      role: 'admin',
      fullName: 'System Administrator',
      isActive: true,
      emailVerified: true,
    }).returning();
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
