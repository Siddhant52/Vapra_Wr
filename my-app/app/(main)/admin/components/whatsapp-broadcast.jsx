"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send } from "lucide-react";
import { sendWhatsAppOfferBroadcast } from "@/actions/whatsapp-offers";

const TITLE_LIMIT = 100;
const BODY_LIMIT = 900;

export function SMSBroadcast({ audienceStats }) {
  const [title, setTitle] = useState("");
  const [offerText, setOfferText] = useState("");
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSend = () => {
    if (!offerText.trim()) {
      setErrorMessage("Please write a message before sending.");
      return;
    }

    setErrorMessage("");
    setResult(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("title", title.trim());
        formData.set("offerText", offerText.trim());
        const res = await sendWhatsAppOfferBroadcast(formData);
        setResult(res);
        setTitle("");
        setOfferText("");
      } catch (error) {
        setErrorMessage(error?.message || "Failed to send broadcast");
      }
    });
  };

  const hasContent = title.trim() || offerText.trim();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-xl font-bold text-white">SMS Notifications</h3>
        <p className="text-sm text-slate-300 mt-1">
          Booking updates and admin broadcasts now go out through SMS so your CRM flow stays consistent for customers and staff.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-xl font-bold text-white">New SMS Broadcast</h3>
              <p className="text-sm text-slate-300 mt-1">
                Send a short offer or reminder to every customer with a phone number on file.
              </p>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 whitespace-nowrap">
              {audienceStats.reachableCustomers} of {audienceStats.totalCustomers} reachable
            </Badge>
          </div>

          {audienceStats.optedOutCustomers > 0 && (
            <p className="text-xs text-slate-400 mb-4">
              {audienceStats.optedOutCustomers} customer
              {audienceStats.optedOutCustomers === 1 ? "" : "s"} unsubscribed
              via &quot;STOP&quot; and won&apos;t receive broadcasts.
            </p>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-red-600/30 bg-red-950/30 p-3 text-sm text-red-200 mb-4">
              {errorMessage}
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-emerald-600/30 bg-emerald-950/30 p-3 text-sm text-emerald-200 mb-4">
              Broadcast sent: {result.sent} delivered, {result.failed} failed, out of {result.total} customers.
            </div>
          )}

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, TITLE_LIMIT))}
            placeholder="Headline, e.g. Monsoon Service Offer"
            className="w-full rounded-xl border border-white/20 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white placeholder:text-slate-500 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-3"
            disabled={isPending}
          />

          <textarea
            value={offerText}
            onChange={(e) => setOfferText(e.target.value.slice(0, BODY_LIMIT))}
            placeholder="e.g. Get 20% off on your next oil change this week only! Book now at Vapra Workshop."
            rows={4}
            className="w-full rounded-xl border border-white/20 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            disabled={isPending}
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {offerText.length} / {BODY_LIMIT}
            </span>
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={isPending || !offerText.trim()}
              onClick={handleSend}
            >
              {isPending ? (
                "Sending..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1.5" />
                  Send to {audienceStats.reachableCustomers} customers
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h4 className="text-sm font-semibold text-slate-300 mb-3">
            What customers will receive
          </h4>
          <div className="rounded-2xl bg-[#0b141a] p-4 border border-white/10">
            <div className="max-w-xs mx-auto rounded-lg bg-[#202c33] p-3 shadow-lg">
              {!hasContent ? (
                <p className="text-sm text-slate-500 italic px-1 py-2">
                  Your SMS preview will appear here...
                </p>
              ) : (
                <div className="text-sm text-slate-100 px-1 space-y-2 whitespace-pre-wrap wrap-break-word">
                  {title.trim() && <p className="font-bold">{title.trim()}</p>}
                  <p>
                    Hi there! {offerText.trim() || "..."}
                  </p>
                  <p>— Team Vapra Workshop</p>
                  <p className="text-slate-400 text-xs">
                    Reply &quot;STOP&quot; to unsubscribe from offers.
                  </p>
                </div>
              )}
              <p className="text-right text-[10px] text-slate-500 mt-1">now</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const WhatsAppBroadcast = SMSBroadcast;
