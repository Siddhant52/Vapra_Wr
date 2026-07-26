"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImagePlus, X, Loader2, Send } from "lucide-react";
import {
  sendWhatsAppOfferBroadcast,
  uploadWhatsAppBroadcastImage,
} from "@/actions/whatsapp-offers";

const TITLE_LIMIT = 100;
const BODY_LIMIT = 900;

export function WhatsAppBroadcast({ audienceStats }) {
  const [title, setTitle] = useState("");
  const [offerText, setOfferText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef(null);

  const handlePickImage = () => fileInputRef.current?.click();

  const handleImageSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setErrorMessage("");
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.set("image", file);
      const res = await uploadWhatsAppBroadcastImage(formData);
      setImageUrl(res.url);
    } catch (error) {
      setErrorMessage(error?.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

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
        formData.set("imageUrl", imageUrl);
        const res = await sendWhatsAppOfferBroadcast(formData);
        setResult(res);
        setTitle("");
        setOfferText("");
        setImageUrl("");
      } catch (error) {
        setErrorMessage(error?.message || "Failed to send broadcast");
      }
    });
  };

  const hasContent = title.trim() || offerText.trim() || imageUrl;

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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Composer ───────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-xl font-bold text-white">New Broadcast Post</h3>
              <p className="text-sm text-slate-300 mt-1">
                Add a photo and caption, just like a social post — every
                customer with a phone number gets it on WhatsApp.
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

          {/* Image picker */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelected}
          />
          {imageUrl ? (
            <div className="relative mb-4 overflow-hidden rounded-xl border border-white/10">
              <img
                src={imageUrl}
                alt="Broadcast preview"
                className="w-full max-h-64 object-cover"
              />
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="absolute top-2 right-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-black/90"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handlePickImage}
              disabled={isUploading}
              className="mb-4 flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/20 bg-slate-900/40 py-8 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors disabled:opacity-60"
            >
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <ImagePlus className="h-6 w-6" />
              )}
              <span className="text-sm">
                {isUploading ? "Uploading..." : "Add a photo (optional)"}
              </span>
            </button>
          )}

          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, TITLE_LIMIT))}
            placeholder="Headline, e.g. Monsoon Service Offer"
            className="w-full rounded-xl border border-white/20 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white placeholder:text-slate-500 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-3"
            disabled={isPending}
          />

          {/* Caption / body */}
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
              disabled={isPending || isUploading || !offerText.trim()}
              onClick={handleSend}
            >
              {isPending ? (
                "Sending..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1.5" />
                  Post to {audienceStats.reachableCustomers} customers
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ── Live preview ───────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h4 className="text-sm font-semibold text-slate-300 mb-3">
            What customers will see
          </h4>
          <div className="rounded-2xl bg-[#0b141a] p-4 border border-white/10">
            <div className="max-w-xs mx-auto rounded-lg bg-[#202c33] p-2 shadow-lg">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full rounded-md mb-2 max-h-48 object-cover"
                />
              )}
              {!hasContent ? (
                <p className="text-sm text-slate-500 italic px-1 py-2">
                  Your post preview will appear here...
                </p>
              ) : (
                <div className="text-sm text-slate-100 px-1 space-y-2 whitespace-pre-wrap break-words">
                  {title.trim() && <p className="font-bold">{title.trim()}</p>}
                  <p>
                    Hi there! 🎉 {offerText.trim() || "..."}
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
