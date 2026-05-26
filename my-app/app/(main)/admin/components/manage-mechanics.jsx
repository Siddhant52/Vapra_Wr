"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createMechanic, setMechanicVerification, removeMechanic } from "@/actions/admin";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

export function ManageMechanics({ mechanics = [] }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [aadhar, setAadhar] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [experience, setExperience] = useState(0);
  const [loading, setLoading] = useState(false);
  const [localMechanics, setLocalMechanics] = useState(mechanics);

  const { loading: statusLoading, fn: updateMechanicStatus } = useFetch(setMechanicVerification);
  const { loading: removeLoading, fn: deleteMechanic } = useFetch(removeMechanic);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }

    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      toast.error("Enter a valid 10-digit Indian phone number.");
      return;
    }

    if (aadhar && !/^\d{12}$/.test(aadhar)) {
      toast.error("Aadhaar number must be exactly 12 digits.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("phone", phone.trim());
      formData.append("aadhar", aadhar.trim());
      formData.append("specialty", specialty.trim());
      formData.append("experience", String(experience));

      const result = await createMechanic(formData);
      if (result?.mechanic) {
        setLocalMechanics((prev) => {
          const existingIndex = prev.findIndex((m) => m.id === result.mechanic.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = result.mechanic;
            return updated;
          }
          return [...prev, result.mechanic];
        });
      }

      toast.success("Mechanic created successfully.");
      setName("");
      setPhone("");
      setAadhar("");
      setSpecialty("");
      setExperience(0);
    } catch (error) {
      console.error("Failed to create mechanic", error);
      toast.error("Failed to create mechanic");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Mechanic Form */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6">
        <h2 className="text-lg md:text-2xl font-bold text-white mb-1">Add Mechanic</h2>
        <p className="text-xs md:text-sm text-slate-300 mb-4">
          Fill in the details to add a new mechanic.
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="name" className="text-xs md:text-sm">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="phone" className="text-xs md:text-sm">Phone <span className="text-slate-400">(optional)</span></Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              maxLength={10}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="aadhar" className="text-xs md:text-sm">Aadhaar Number <span className="text-slate-400">(optional)</span></Label>
            <Input
              id="aadhar"
              type="text"
              value={aadhar}
              onChange={(e) => setAadhar(e.target.value.replace(/\D/g, ""))}
              placeholder="123456789012"
              maxLength={12}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="specialty" className="text-xs md:text-sm">Specialty <span className="text-slate-400">(optional)</span></Label>
            <Input
              id="specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="Engine / AC / Bodywork"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="experience" className="text-xs md:text-sm">Experience (years)</Label>
            <Input
              id="experience"
              type="number"
              min={0}
              value={experience}
              onChange={(e) => setExperience(Number(e.target.value))}
              className="mt-1"
              required
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="bio" className="text-xs md:text-sm">Profile Notes</Label>
            <Textarea id="bio" placeholder="Optional notes" className="mt-1" />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? "Creating..." : "Create Mechanic"}
            </Button>
          </div>
        </form>
      </div>

      {/* Mechanic Verification */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6">
        <h3 className="text-base md:text-xl font-semibold text-white mb-4">Mechanic Verification</h3>
        {localMechanics.length === 0 ? (
          <p className="text-slate-300 text-sm">No mechanics available yet.</p>
        ) : (
          <div className="space-y-3">
            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {localMechanics.map((m) => (
                <div key={m.id} className="rounded-xl border border-white/10 bg-slate-950 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{m.name}</p>
                      <p className="text-xs text-slate-400">{m.specialty || "General"}</p>
                    </div>
                    <Badge
                      className={
                        m.verificationStatus === "VERIFIED"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs"
                          : m.verificationStatus === "REJECTED"
                          ? "bg-red-500/20 text-red-300 border-red-500/30 text-xs"
                          : "bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs"
                      }
                    >
                      {m.verificationStatus || "PENDING"}
                    </Badge>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {m.verificationStatus !== "VERIFIED" && (
                      <Button
                        size="sm"
                        className="text-xs h-7 px-2"
                        disabled={statusLoading}
                        onClick={async () => {
                          try {
                            const formData = new FormData();
                            formData.append("mechanicId", m.id);
                            formData.append("status", "VERIFIED");
                            await updateMechanicStatus(formData);
                            setLocalMechanics((prev) =>
                              prev.map((item) =>
                                item.id === m.id ? { ...item, verificationStatus: "VERIFIED" } : item
                              )
                            );
                            toast.success("Mechanic approved");
                          } catch {
                            toast.error("Could not approve mechanic");
                          }
                        }}
                      >
                        Approve
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="text-xs h-7 px-2"
                      disabled={removeLoading}
                      onClick={async () => {
                        try {
                          const formData = new FormData();
                          formData.append("mechanicId", m.id);
                          await deleteMechanic(formData);
                          setLocalMechanics((prev) => prev.filter((item) => item.id !== m.id));
                          toast.success("Mechanic removed");
                        } catch {
                          toast.error("Could not remove mechanic");
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-white/10 bg-slate-950 p-3">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-2 pr-4 text-white">Name</th>
                    <th className="py-2 pr-4 text-white">Specialty</th>
                    <th className="py-2 pr-4 text-white">Status</th>
                    <th className="py-2 pr-4 text-white">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {localMechanics.map((m) => (
                    <tr key={m.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-2 text-white">{m.name}</td>
                      <td className="py-2 text-slate-300">{m.specialty || "General"}</td>
                      <td className="py-2">
                        <Badge
                          className={
                            m.verificationStatus === "VERIFIED"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : m.verificationStatus === "REJECTED"
                              ? "bg-red-500/20 text-red-300 border-red-500/30"
                              : "bg-orange-500/20 text-orange-300 border-orange-500/30"
                          }
                        >
                          {m.verificationStatus || "PENDING"}
                        </Badge>
                      </td>
                      <td className="py-2 flex gap-2">
                        {m.verificationStatus !== "VERIFIED" ? (
                          <Button
                            size="sm"
                            disabled={statusLoading}
                            onClick={async () => {
                              try {
                                const formData = new FormData();
                                formData.append("mechanicId", m.id);
                                formData.append("status", "VERIFIED");
                                await updateMechanicStatus(formData);
                                setLocalMechanics((prev) =>
                                  prev.map((item) =>
                                    item.id === m.id ? { ...item, verificationStatus: "VERIFIED" } : item
                                  )
                                );
                                toast.success("Mechanic approved successfully");
                              } catch {
                                toast.error("Could not approve mechanic");
                              }
                            }}
                          >
                            Approve
                          </Button>
                        ) : (
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Approved</Badge>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={removeLoading}
                          onClick={async () => {
                            try {
                              const formData = new FormData();
                              formData.append("mechanicId", m.id);
                              await deleteMechanic(formData);
                              setLocalMechanics((prev) => prev.filter((item) => item.id !== m.id));
                              toast.success("Mechanic removed successfully");
                            } catch {
                              toast.error("Could not remove mechanic");
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}