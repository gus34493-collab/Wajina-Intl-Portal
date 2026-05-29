import webPush from "web-push";
import prisma from "@/lib/prisma";

export type PushPayload = {
  title: string;
  body: string;
  href: string;
};

function getVapidDetails() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    return null;
  }

  return { publicKey, privateKey };
}

async function sendToSubscription(subscription: any, payload: PushPayload) {
  if (!subscription?.endpoint) {
    return;
  }

  try {
    const vapid = getVapidDetails();
    if (!vapid) {
      console.warn("[sendPushToUser] VAPID keys are not configured; skipping real push delivery.");
      return;
    }

    webPush.setVapidDetails("mailto:notifications@wajina.school", vapid.publicKey, vapid.privateKey);
    await webPush.sendNotification(subscription, JSON.stringify(payload));
  } catch (error) {
    console.error("[sendPushToUser] failed to send push notification", error);
  }
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pushSubscription: true },
  });

  if (!user?.pushSubscription) {
    return;
  }

  await sendToSubscription(user.pushSubscription, payload);
}

export async function sendPushToRole(role: string, payload: PushPayload, campus?: string) {
  const where: any = { role };
  if (campus) {
    where.campus = campus;
  }

  const users = await prisma.user.findMany({
    where,
    select: { pushSubscription: true },
  });

  await Promise.all(
    users.map((user) => sendToSubscription(user.pushSubscription, payload))
  );
}
