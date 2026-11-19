import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let passwordService: PasswordService;

  beforeEach(() => {
    passwordService = new PasswordService();
  });

  it('should hash a password with salt', async () => {
    const rawPassword = 'SecurePassword123!';
    const hash = await passwordService.hashPassword(rawPassword);

    expect(hash).toBeDefined();
    expect(hash).not.toEqual(rawPassword);
    expect(hash.startsWith('$2')).toBe(true);
  });

  it('should verify matching password correctly', async () => {
    const rawPassword = 'SecurePassword123!';
    const hash = await passwordService.hashPassword(rawPassword);

    const isValid = await passwordService.comparePassword(rawPassword, hash);
    expect(isValid).toBe(true);
  });

  it('should reject non-matching password', async () => {
    const rawPassword = 'SecurePassword123!';
    const hash = await passwordService.hashPassword(rawPassword);

    const isValid = await passwordService.comparePassword(
      'WrongPassword456!',
      hash,
    );
    expect(isValid).toBe(false);
  });
});
