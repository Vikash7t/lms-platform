import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../../../config/env.validation';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {
    const clientId =
      configService.get('GOOGLE_CLIENT_ID', { infer: true }) ||
      'unconfigured_google_client_id';
    const clientSecret =
      configService.get('GOOGLE_CLIENT_SECRET', { infer: true }) ||
      'unconfigured_google_client_secret';
    const callbackURL =
      configService.get('GOOGLE_CALLBACK_URL', { infer: true }) ||
      'http://localhost:8000/api/auth/google/callback';

    super({
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL: callbackURL,
      scope: ['email', 'profile'],
    });

    if (!configService.get('GOOGLE_CLIENT_ID', { infer: true })) {
      this.logger.warn(
        'Google OAuth: GOOGLE_CLIENT_ID is not configured. Google sign-in will not authenticate.',
      );
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const email = profile.emails?.[0]?.value;
    const emailVerified = profile.emails?.[0]?.verified ?? false;

    const userProfile = {
      id: profile.id,
      email,
      firstName: profile.name?.givenName || '',
      lastName: profile.name?.familyName || '',
      avatarUrl: profile.photos?.[0]?.value,
      emailVerified,
    };

    done(null, userProfile);
  }
}
