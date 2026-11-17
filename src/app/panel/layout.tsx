import { and, count, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { getUser } from "@/lib/auth";
import { getWorkerForUser } from "@/lib/workers";
import { PanelTabs } from "./PanelTabs";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  const worker = user ? await getWorkerForUser(user.id) : null;
  let unseen = 0;
  if (worker) {
    [{ n: unseen }] = await db.select({ n: count() }).from(schema.quoteRecipients)
      .where(and(eq(schema.quoteRecipients.workerId, worker.id), isNull(schema.quoteRecipients.seenAt)));
  }
  return (
    <>
      {worker && <div className="wrap" style={{ paddingTop: 16 }}><PanelTabs badge={unseen} /></div>}
      {children}
    </>
  );
}
