interface PushPayload {
  title: string;
  body: string;
  href: string;
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<void> {
  console.log(`[push] user=${userId}`, payload);
}

export async function sendPushToRole(
  role: string,
  payload: PushPayload,
  campus: string
): Promise<void> {
  console.log(`[push] role=${role} campus=${campus}`, payload);
}
