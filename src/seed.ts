import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { AppModule } from './app.module';
import { User, UserRole } from './users/user.entity'; // check your path

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const name = process.env.SUPER_ADMIN_NAME || 'Owner';
    const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set');
    }
    if (password.length < 10) {
      throw new Error('SUPER_ADMIN_PASSWORD must be at least 10 characters');
    }

    const repo = app.get(DataSource).getRepository(User);
    const existing = await repo.findOne({ where: { email } });

    if (existing) {
      existing.role = UserRole.SUPER_ADMIN;
      existing.permissions = null;
      existing.is_active = true;
      await repo.save(existing);
      console.log(`${email} is now SUPER_ADMIN (password unchanged)`);
    } else {
      const password_hash = await bcrypt.hash(password, 10);
      await repo.save(
        repo.create({
          name,
          email,
          password_hash,
          role: UserRole.SUPER_ADMIN,
          permissions: null,
          is_active: true,
        }),
      );
      console.log(`Super admin ${email} created`);
    }
  } finally {
    await app.close();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });