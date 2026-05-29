const CHAIN = [
  "HEAD_TEACHER",
  "ACCOUNTANT",
  "HR",
  "DIRECTOR",
  "FULFILLED",
] as const;

const STAGE_ROLES: Record<string, string[]> = {
  HEAD_TEACHER: ["HEAD_TEACHER", "ASST_HEAD_TEACHER"],
  ACCOUNTANT: ["ACCOUNTS_OFFICER", "BURSAR"],
  HR: ["HR"],
  DIRECTOR: ["DIRECTOR"],
};

export function nextStage(currentStage: string): string | null {
  const idx = CHAIN.indexOf(currentStage as (typeof CHAIN)[number]);
  if (idx === -1 || idx === CHAIN.length - 1) return null;
  return CHAIN[idx + 1];
}

export function rolesForStage(stage: string): string[] {
  return STAGE_ROLES[stage] ?? [];
}
