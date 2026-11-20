import { getLang } from "@/lib/i18n/server";
import { getCurrentBusiness } from "@/lib/panel/current-business";
import { NotificationsManager } from "./notifications-manager";

export default async function NotificationsPage() {
  await getCurrentBusiness(); // il layout garantisce la sessione; qui solo guard
  const lang = await getLang();
  return <NotificationsManager lang={lang} />;
}
