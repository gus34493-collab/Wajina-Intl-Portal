export function canActOnStage(role: string, stage: string | null | undefined): boolean {
  if (!stage) return false;

  const normalizedRole = role?.toUpperCase?.() ?? "";
  switch (stage.toUpperCase()) {
    case "HEAD_TEACHER":
      return normalizedRole === "HEAD_TEACHER" || normalizedRole === "PRINCIPAL";
    case "ACCOUNTANT":
      return normalizedRole === "ACCOUNTS_OFFICER" || normalizedRole === "BURSAR";
    case "HR":
      return normalizedRole === "HR";
    case "DIRECTOR":
      return normalizedRole === "DIRECTOR";
    default:
      return false;
  }
}

export function scopeForRole(userId: string, role: string, campus?: string | null): Record<string, unknown> {
  const normalizedRole = role?.toUpperCase?.() ?? "";
  const campusScope = campus ? { campus: campus.toUpperCase() } : {};

  if (normalizedRole === "DIRECTOR" || normalizedRole === "ADMIN") {
    return {};
  }

  if (normalizedRole === "PARENT" || normalizedRole === "STUDENT") {
    return { initiatorId: userId };
  }

  if (
    [
      "HEAD_TEACHER",
      "ASST_HEAD_TEACHER",
      "PRINCIPAL",
      "VP_ADMIN",
      "VP_ACADEMICS",
      "HOD",
      "DEAN",
      "HR",
      "BURSAR",
      "ACCOUNTS_OFFICER",
    ].includes(normalizedRole)
  ) {
    return campusScope;
  }

  return { initiatorId: userId };
}

export function maskCurrencyIfNeeded(
  record: Record<string, unknown>,
  role: string
): Record<string, unknown> {
  const normalizedRole = role?.toUpperCase?.() ?? "";
  if (!["HEAD_TEACHER", "ASST_HEAD_TEACHER"].includes(normalizedRole)) {
    return record;
  }

  const masked = { ...record };
  if (Array.isArray(masked.items)) {
    masked.items = masked.items.map((item) => ({
      ...item,
      unitCost: null,
      totalCost: null,
    }));
  }

  masked.amountTotal = null;
  masked.amountInWords = null;
  return masked;
}
