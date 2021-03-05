import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID:
        '300412213960-s1c4bst77a3i9d31mk8e2s37is65q3h0.apps.googleusercontent.com',
      clientSecret: 'zs2ytD8U5Q0WvTwL3QVQXwFt',
      callbackURL: 'http://localhost:3000/user/auth/callback',
      scope: ['email', 'profile', 'https://www.googleapis.com/auth/youtube'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const user = {
      googleId: profile.id,
      username: profile.displayName,
      email: profile.emails.length !== 0 ? profile.emails[0].value : '',
      thumbnailImg: profile.photos.length !== 0 ? profile.photos[0].value : '',
      accessToken,
    };
    done(null, user);
  }
}
