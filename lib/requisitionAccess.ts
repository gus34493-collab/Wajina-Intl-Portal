const CURRENCY_MASK_ROLES = new Set(["HEAD_TEACHER", "ASST_HEAD_TEACHER"]);

const STAGE_ROLES: Record<string, string[]> = {
  HEAD_TEACHER: ["HEAD_TEACHER", "ASST_HEAD_TEACHER"],
  ACCOUNTANT: ["ACCOUNTS_OFFICER", "BURSAR"],
  HR: ["HR"],
  DIRECTOR: ["DIRECTOR"],
};

export function canActOnStage(role: string, stage: string): boolean {
  return STAGE_ROLES[stage]?.includes(role) ?? false;
}

export function scopeForRole(
  userId: string,
  role: string,
  campus: string
): Record<string, unknown> {
  if (role === "DIRECTOR") return {};
  const campusRoles = new Set([
    "HEAD_TEACHER",
    "ASST_HEAD_TEACHER",
    "PRINCIPAL",
    "ACCOUNTS_OFFICER",
    "BURSAR",
    "HR",
  ]);
  if (campusRoles.has(role)) return { campus };
  return { initiatorId: userId };
}

export function maskCurrencyIfNeeded(
  record: Record<string, unknown>,
  userOrRole: string | { role: string }
): Record<string, unknown> {
  const role = typeof userOrRole === "string" ? userOrRole : userOrRole.role;
  if (!CURRENCY_MASK_ROLES.has(role)) return record;
  const masked = { ...record, amountTotal: null, amountInWords: null };
  if (Array.isArray(masked.items)) {
    masked.items = (masked.items as Record<string, unknown>[]).map((item) => ({
      ...item,
      unitCost: null,
      totalCost: null,
    }));
  }
  return masked;
}
