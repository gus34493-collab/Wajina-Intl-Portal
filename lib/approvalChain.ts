export type RequisitionStage =
  | "INITIATOR"
  | "HEAD_TEACHER"
  | "ACCOUNTANT"
  | "HR"
  | "DIRECTOR"
  | "FULFILLED";

const stageApprovers: Record<RequisitionStage, string[]> = {
  INITIATOR: [],
  HEAD_TEACHER: ["HEAD_TEACHER", "PRINCIPAL"],
  ACCOUNTANT: ["ACCOUNTS_OFFICER", "BURSAR"],
  HR: ["HR"],
  DIRECTOR: ["DIRECTOR"],
  FULFILLED: [],
};

export function nextStage(stage: string | null | undefined): RequisitionStage | null {
  switch (stage?.toUpperCase?.()) {
    case "INITIATOR":
      return "HEAD_TEACHER";
    case "HEAD_TEACHER":
      return "ACCOUNTANT";
    case "ACCOUNTANT":
      return "HR";
    case "HR":
      return "DIRECTOR";
    case "DIRECTOR":
      return "FULFILLED";
    default:
      return null;
  }
}

export function rolesForStage(stage: string | null | undefined): string[] {
  const normalizedStage = stage?.toUpperCase?.() as RequisitionStage | undefined;
  return stageApprovers[normalizedStage ?? "INITIATOR"] ?? [];
}
