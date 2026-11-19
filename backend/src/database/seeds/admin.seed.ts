import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { UsersService } from '../../modules/users/users.service';
import { PasswordService } from '../../modules/auth/password.service';
import { UserRole } from '../../modules/users/entities/user.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const passwordService = app.get(PasswordService);

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@lmsplatform.com';
  const adminPassword =
    process.env.ADMIN_INITIAL_PASSWORD || 'Admin@Password123!';

  console.log(`[Seed] Provisioning administrator: ${adminEmail}`);

  const existingUser = await usersService.findByEmail(adminEmail, true);

  if (existingUser) {
    console.log(`[Seed] User ${adminEmail} already exists. Updating to ADMIN role...`);
    const currentRoles = existingUser.roles || [UserRole.LEARNER];
    const updatedRoles = Array.from(
      new Set([...currentRoles, UserRole.ADMIN, UserRole.LEARNER]),
    );
    existingUser.roles = updatedRoles;
    existingUser.isEmailVerified = true;
    existingUser.passwordHash = await passwordService.hashPassword(adminPassword);
    await usersService.save(existingUser);
    console.log(`[Seed] Administrator account updated successfully.`);
  } else {
    const passwordHash = await passwordService.hashPassword(adminPassword);
    await usersService.create({
      email: adminEmail,
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      roles: [UserRole.LEARNER, UserRole.ADMIN],
      isEmailVerified: true,
    });
    console.log(`[Seed] Initial administrator account created successfully.`);
  }

  await app.close();
}

bootstrap()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[Seed Error]:', err);
    process.exit(1);
  });
