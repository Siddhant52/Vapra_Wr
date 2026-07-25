import { NextResponse } from "next/server";
import { processDueReminders, scheduleWinBackReminders } from "@/actions/reminders";

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await processDueReminders();
  const winBack = await scheduleWinBackReminders();

  return NextResponse.json({ ...results, winBackCreated: winBack.created });
}