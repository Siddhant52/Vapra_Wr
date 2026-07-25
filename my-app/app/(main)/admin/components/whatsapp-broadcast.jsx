"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { sendWhatsAppOfferBroadcast } from "@/actions/whatsapp-offers";

const CHAR_LIMIT = 1000;

export function WhatsAppBroadcast({ audienceStats }) {
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
        formData.set("offerText", offerText.trim());
        const res = await sendWhatsAppOfferBroadcast(formData);
        setResult(res);
        setOfferText("");
      } catch (error) {
        setErrorMessage(error?.message || "Failed to send broadcast");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-xl font-bold text-white">WhatsApp Notifications</h3>
        <p className="text-sm text-slate-300 mt-1">
          New booking requests automatically send full details to your admin
          WhatsApp (configured via <code>ADMIN_WHATSAPP_NUMBERS</code> in{" "}
          <code>.env</code>). Customers automatically get WhatsApp updates
          when a booking is created, reviewed, assigned, completed, or
          cancelled.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">Send an Offer / Promotion</h3>
            <p className="text-sm text-slate-300 mt-1">
              Broadcast a WhatsApp message to every customer with a phone
              number on file.
            </p>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
            {audienceStats.reachableCustomers} of {audienceStats.totalCustomers} customers reachable
          </Badge>
        </div>

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

        <textarea
          value={offerText}
          onChange={(e) => setOfferText(e.target.value.slice(0, CHAR_LIMIT))}
          placeholder="e.g. Get 20% off on your next oil change this week only! Book now at Vapra Workshop."
          rows={4}
          className="w-full rounded-xl border border-white/20 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          disabled={isPending}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {offerText.length} / {CHAR_LIMIT}
          </span>
          <Button
            type="button"
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={isPending || !offerText.trim()}
            onClick={handleSend}
          >
            {isPending ? "Sending..." : `Send to ${audienceStats.reachableCustomers} customers`}
          </Button>
        </div>
      </div>
    </div>
  );
}
