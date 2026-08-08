"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImagePlus, Loader2, Megaphone, Send, Users, X } from "lucide-react";
import {
  getBroadcastableCustomers,
  sendWhatsAppOfferBroadcast,
  uploadSmsBroadcastImage,
} from "@/actions/whatsapp-offers";

const TITLE_LIMIT = 100;
const BODY_LIMIT = 900;

export function SMSBroadcast({ audienceStats }) {
  const [title, setTitle] = useState("");
  const [offerText, setOfferText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [sendMode, setSendMode] = useState(null); // "selected" | "all" | null while sending
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [customers, setCustomers] = useState([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  useEffect(() => {
    let cancelled = false;
    getBroadcastableCustomers().then((list) => {
      if (!cancelled) {
        setCustomers(list);
        setIsLoadingCustomers(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleCustomer = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(customers.map((c) => c.id)));
  const selectNone = () => setSelectedIds(new Set());

  const handlePickImage = () => fileInputRef.current?.click();

  const handleImageSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setErrorMessage("");
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.set("image", file);
      const res = await uploadSmsBroadcastImage(formData);
      if (res?.error) {
        setErrorMessage(res.error);
      } else if (res?.url) {
        setImageUrl(res.url);
      }
    } catch (error) {
      setErrorMessage(error?.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = (mode) => {
    if (!offerText.trim()) {
      setErrorMessage("Please write a message before sending.");
      return;
    }
    if (mode === "selected" && selectedIds.size === 0) {
      setErrorMessage("Select at least one customer, or use \"Broadcast to All\" instead.");
      return;
    }

    setErrorMessage("");
    setResult(null);
    setSendMode(mode);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("title", title.trim());
        formData.set("offerText", offerText.trim());
        formData.set("imageUrl", imageUrl);
        formData.set("mode", mode);
        if (mode === "selected") {
          formData.set("customerIds", JSON.stringify(Array.from(selectedIds)));
        }
        const res = await sendWhatsAppOfferBroadcast(formData);
        if (res?.error) {
          setErrorMessage(res.error);
          return;
        }
        setResult(res);
        setTitle("");
        setOfferText("");
        setImageUrl("");
        selectNone();
      } catch (error) {
        setErrorMessage(error?.message || "Failed to send broadcast");
      } finally {
        setSendMode(null);
      }
    });
  };

  const hasContent = title.trim() || offerText.trim() || imageUrl;
  const selectedCount = selectedIds.size;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-xl font-bold text-white">SMS Notifications</h3>
        <p className="text-sm text-slate-300 mt-1">
          Booking updates and admin broadcasts now go out through SMS so your CRM flow stays consistent for customers and staff.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recipient picker */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 lg:col-span-1">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              <Users className="h-4 w-4 text-emerald-400" />
              Recipients
            </h3>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 whitespace-nowrap text-xs">
              {audienceStats.reachableCustomers} reachable
            </Badge>
          </div>

          {audienceStats.optedOutCustomers > 0 && (
            <p className="text-xs text-slate-400 mb-3">
              {audienceStats.optedOutCustomers} customer
              {audienceStats.optedOutCustomers === 1 ? "" : "s"} unsubscribed via &quot;STOP&quot;.
            </p>
          )}

          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-emerald-300 hover:text-emerald-200 underline underline-offset-2"
            >
              Select all
            </button>
            <span className="text-slate-600 text-xs">·</span>
            <button
              type="button"
              onClick={selectNone}
              className="text-xs text-slate-400 hover:text-slate-300 underline underline-offset-2"
            >
              Clear
            </button>
            <span className="ml-auto text-xs text-slate-400">{selectedCount} selected</span>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/40 divide-y divide-white/5">
            {isLoadingCustomers ? (
              <div className="flex items-center justify-center py-8 text-slate-500 text-sm gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading customers...
              </div>
            ) : customers.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8 px-3">
                No reachable customers yet.
              </p>
            ) : (
              customers.map((customer) => (
                <label
                  key={customer.id}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(customer.id)}
                    onChange={() => toggleCustomer(customer.id)}
                    className="h-4 w-4 shrink-0 rounded border-white/20 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{customer.name || "Unnamed customer"}</p>
                    <p className="text-xs text-slate-400 truncate">{customer.phone}</p>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Compose */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 lg:col-span-1">
          <h3 className="text-xl font-bold text-white mb-1">New SMS Broadcast</h3>
          <p className="text-sm text-slate-300 mb-4">
            Write your message, then choose who receives it.
          </p>

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
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelected}
          />

          {imageUrl ? (
            <div className="relative mb-4 overflow-hidden rounded-xl border border-white/10">
              <img src={imageUrl} alt="Broadcast preview" className="w-full max-h-64 object-cover" />
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
              {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
              <span className="text-sm">{isUploading ? "Uploading..." : "Add a photo (optional)"}</span>
            </button>
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
          <div className="mt-2 mb-4">
            <span className="text-xs text-slate-400">
              {offerText.length} / {BODY_LIMIT}
            </span>
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full border-emerald-600/40 text-emerald-300 hover:bg-emerald-950/40 hover:text-emerald-200"
              disabled={isPending || !offerText.trim() || selectedCount === 0}
              onClick={() => handleSend("selected")}
            >
              {isPending && sendMode === "selected" ? (
                "Sending..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1.5" />
                  Send to Selected ({selectedCount})
                </>
              )}
            </Button>
            <Button
              type="button"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={isPending || !offerText.trim() || audienceStats.reachableCustomers === 0}
              onClick={() => handleSend("all")}
            >
              {isPending && sendMode === "all" ? (
                "Sending..."
              ) : (
                <>
                  <Megaphone className="h-4 w-4 mr-1.5" />
                  Broadcast to All ({audienceStats.reachableCustomers})
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 lg:col-span-1">
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
                  {imageUrl && <img src={imageUrl} alt="Preview" className="w-full rounded-md mb-2 max-h-48 object-cover" />}
                  {title.trim() && <p className="font-bold">{title.trim()}</p>}
                  <p>
                    Hi there! {offerText.trim() || "..."}
                  </p>
                  {imageUrl && <p className="text-slate-400 text-xs break-all">Image: {imageUrl}</p>}
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
