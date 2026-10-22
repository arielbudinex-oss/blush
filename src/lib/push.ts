import webpush from "web-push";
import { createAdminSupabase } from "@/lib/supabase/admin";

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

type SubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT ?? "mailto:arielbudi6@gmail.com";

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export function pushConfigured() {
  return Boolean(publicKey && privateKey);
}

async function deliver(rows: SubscriptionRow[], payload: PushPayload) {
  if (!pushConfigured() || rows.length === 0) return { sent: 0, removed: 0 };
  const admin = createAdminSupabase();
  const body = JSON.stringify(payload);
  let sent = 0;
  let removed = 0;

  await Promise.all(
    rows.map(async (row) => {
      try {
        await webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          body,
          { TTL: 60 * 60 * 24 },
        );
        sent += 1;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await admin.from("push_subscriptions").delete().eq("id", row.id);
          removed += 1;
        }
      }
    }),
  );

  return { sent, removed };
}

export async function pushToUsers(userIds: string[], payload: PushPayload) {
  if (!pushConfigured() || userIds.length === 0) return { sent: 0, removed: 0 };
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("user_id", userIds);
  return deliver((data ?? []) as SubscriptionRow[], payload);
}

export async function pushToAll(payload: PushPayload) {
  if (!pushConfigured()) return { sent: 0, removed: 0 };
  const admin = createAdminSupabase();
  const { data } = await admin.from("push_subscriptions").select("id, endpoint, p256dh, auth").limit(5000);
  return deliver((data ?? []) as SubscriptionRow[], payload);
}
