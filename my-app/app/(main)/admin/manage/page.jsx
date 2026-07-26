import Link from "next/link";
import { ManageMechanics } from "@/app/(main)/admin/components/manage-mechanics";
import { ServiceRequestsManager } from "@/app/(main)/admin/components/service-requests-manager";
import { db } from "@/lib/prisma";

export const metadata = {
  title: "Admin Manage - Vapra Workshop",
  description: "Admin management panel for mechanics and requests",
};

export default async function AdminManagePage() {
  const [mechanics, serviceRequests] = await Promise.all([
    db.user.findMany({
      where: { role: "MECHANIC" },
      select: {
        id: true,
        name: true,
        experience: true,
        specialty: true,
        verificationStatus: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.bookingRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">

        {/* Nav */}
        <div className="flex flex-wrap items-center gap-2 border border-white/10 rounded-2xl bg-white/5 p-3 md:p-4">
          <Link
            href="/admin"
            className="rounded-lg bg-emerald-500/20 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold text-emerald-200 hover:bg-emerald-500/30"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/manage"
            className="rounded-lg bg-blue-500/20 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold text-blue-200 hover:bg-blue-500/30"
          >
            Manage
          </Link>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl rounded-2xl md:rounded-3xl border border-white/10 p-4 md:p-8 shadow-2xl">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 md:mb-4">Admin Management</h1>
          <p className="text-sm text-slate-300 mb-4 md:mb-6">
            Create mechanics, assign slots, and triage customer requests.
          </p>

          {/* Mechanics + Requests Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold text-white mb-2">Mechanic Pool</h2>
              <p className="text-sm text-slate-300 mb-4">Create mechanics and allocate slots from here.</p>
              <ManageMechanics mechanics={mechanics} />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold text-white mb-2">Service Requests</h2>
              <p className="text-sm text-slate-300 mb-4">Review open requests and update statuses.</p>
              <ServiceRequestsManager requests={serviceRequests} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}