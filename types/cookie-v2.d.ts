declare module "cookie" {
  export interface ParseCookieOptions {
    decode?: (value: string) => string;
  }

  export function parseCookie(
    str: string,
    options?: ParseCookieOptions,
  ): Record<string, string | undefined>;
}
