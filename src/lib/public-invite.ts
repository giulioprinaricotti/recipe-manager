/**
 * Reusable open-invite token: a single env-configured string that lets anyone
 * who knows it create an account. Used by the /join landing page so a single
 * shareable URL replaces per-user admin-generated invitations.
 *
 * If PUBLIC_INVITE_TOKEN is unset, public signup is effectively disabled and
 * only admin-issued invitations work.
 */
export function getPublicInviteToken(): string | null {
  const token = process.env.PUBLIC_INVITE_TOKEN?.trim();
  return token && token.length >= 16 ? token : null;
}

export function isPublicInviteToken(candidate: string): boolean {
  const expected = getPublicInviteToken();
  if (!expected) return false;
  // Constant-time compare to avoid revealing the token via timing.
  if (candidate.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) {
    diff |= candidate.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
