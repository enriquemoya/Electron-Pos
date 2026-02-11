import type { AuthRepository, AuthTokens, EmailService } from "../ports";
import { renderMagicLinkEmail, renderWelcomeEmail, resolveLocaleEnum, resolveLocaleString } from "../../email";

export type AuthUseCases = {
  requestMagicLink: (email: string, locale: string) => Promise<void>;
  verifyMagicLink: (token: string) => Promise<AuthTokens | null>;
  refreshTokens: (refreshToken: string) => Promise<AuthTokens | null>;
  revokeRefreshToken: (refreshToken: string) => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<AuthTokens | null>;
};

export function createAuthUseCases(deps: {
  authRepository: AuthRepository;
  emailService: EmailService;
}): AuthUseCases {
  return {
    async requestMagicLink(email: string, locale: string) {
      const result = await deps.authRepository.requestMagicLink(email);
      const localeEnum = resolveLocaleEnum(locale);
      const resolvedLocale = resolveLocaleString(result.emailLocale ?? localeEnum);
      const link = deps.authRepository.buildMagicLink(result.emailLocale ?? localeEnum, result.token);
      void (async () => {
        const mail = await renderMagicLinkEmail({ locale: resolvedLocale, link });
        await deps.emailService.sendMagicLinkEmail({
          to: email,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
          meta: {
            userId: result.userId,
            template: "MagicLinkEmail",
            locale: resolvedLocale
          }
        });
      })();
    },
    async verifyMagicLink(token: string) {
      const result = await deps.authRepository.verifyMagicLink(token);
      if (!result) {
        return null;
      }
      const userEmail = result.user.email;
      if (result.wasUnverified && userEmail) {
        const resolvedLocale = resolveLocaleString(result.user.emailLocale);
        void (async () => {
          const mail = await renderWelcomeEmail({
            locale: resolvedLocale,
            firstName: result.user.firstName
          });
          await deps.emailService.sendEmail({
            to: userEmail,
            subject: mail.subject,
            html: mail.html,
            text: mail.text,
            meta: {
              userId: result.user.id,
              template: "WelcomeEmail",
              locale: resolvedLocale
            }
          });
        })();
      }
      return result.tokens;
    },
    refreshTokens(refreshToken: string) {
      return deps.authRepository.refreshTokens(refreshToken);
    },
    revokeRefreshToken(refreshToken: string) {
      return deps.authRepository.revokeRefreshToken(refreshToken);
    },
    loginWithPassword(email: string, password: string) {
      return deps.authRepository.loginWithPassword(email, password);
    }
  };
}
