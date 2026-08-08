import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ManageMechanics } from "@/app/(main)/admin/components/manage-mechanics";
import { ServiceRequestsManager } from "@/app/(main)/admin/components/service-requests-manager";
import { AttendanceManager } from "@/app/(main)/admin/components/attendance-manager";
import { SMSBroadcast } from "@/app/(main)/admin/components/whatsapp-broadcast";
import { db } from "@/lib/prisma";
import { listAttendanceRecords } from "@/lib/attendance-store";
import { getWhatsAppAudienceStats } from "@/actions/whatsapp-offers";

export const metadata = {
  title: "Admin Dashboard - Vapra Workshop",
  description: "Garage management dashboard",
};

export default async function AdminPage() {
  const attendanceDate = new Date();
  attendanceDate.setHours(0, 0, 0, 0);

  let mechanics = [];
  let serviceRequests = [];
  let attendanceRecords = [];
  let attendanceEnabled = false;
  let totalRevenueAgg = { _sum: { amount: null } };
  let whatsAppAudienceStats = {
    totalCustomers: 0,
    reachableCustomers: 0,
    optedOutCustomers: 0,
  };

  try {
    const [mechanicsResult, serviceRequestsResult] = await Promise.all([
      db.user.findMany({
        where: { role: "MECHANIC" },
        select: {
          id: true,
          name: true,
          specialty: true,
          experience: true,
          verificationStatus: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      db.bookingRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    ]);

    mechanics = mechanicsResult;
    serviceRequests = serviceRequestsResult;

    attendanceEnabled = !!db.mechanicAttendance;
    attendanceRecords = attendanceEnabled
      ? await db.mechanicAttendance.findMany({
          where: { date: attendanceDate },
          select: {
            id: true,
            mechanicId: true,
            status: true,
            date: true,
            note: true,
            markedById: true,
            createdAt: true,
            updatedAt: true,
          },
        })
      : listAttendanceRecords({ startDate: attendanceDate, endDate: attendanceDate });

    totalRevenueAgg = await db.payment.aggregate({
      _sum: { amount: true },
      where: { status: "PAID" },
    });

    whatsAppAudienceStats = await getWhatsAppAudienceStats();
  } catch (error) {
    console.error("Failed to load admin dashboard data:", error);
  }

  const attendanceMap = new Map(
    attendanceRecords.map((record) => [record.mechanicId, record.status])
  );

  const mechanicsWithAttendance = mechanics.map((mechanic) => ({
    ...mechanic,
    attendanceStatus: attendanceMap.get(mechanic.id) || null,
  }));

  const dashboardStats = {
    totalMechanics: mechanics.length,
    activeJobs: serviceRequests.filter((item) => item.status === "PENDING").length,
    totalRevenue: totalRevenueAgg._sum.amount || 0,
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      inactive: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    };
    return variants[status] || "bg-slate-500/20 text-slate-300 border-slate-500/30";
  };

  const getExperienceLabel = (years) => {
    if (years >= 10) return "Veteran";
    if (years >= 5) return "Senior";
    return "Junior";
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        <div className="flex flex-wrap items-center gap-2 border border-white/10 rounded-2xl bg-white/5 p-3 md:p-4">
          <a href="#dashboard" className="rounded-lg bg-emerald-500/20 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold text-emerald-200 hover:bg-emerald-500/30">
            Dashboard
          </a>
          <a href="/admin/manage" className="rounded-lg bg-blue-500/20 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold text-blue-200 hover:bg-blue-500/30">
            Manage
          </a>
        </div>

        <section id="dashboard">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
            <div className="p-4 md:p-8 rounded-2xl md:rounded-3xl bg-blue-500/10 border-2 border-blue-500/30 hover:border-blue-400 transition-all backdrop-blur-sm">
              <div className="text-blue-300 mb-1 md:mb-3 text-sm md:text-lg font-semibold">Mechanics</div>
              <div className="text-3xl md:text-4xl font-black text-white">{dashboardStats.totalMechanics}</div>
              <div className="text-blue-200 mt-1 md:mt-2 text-xs md:text-sm font-medium">Active</div>
            </div>
            <div className="p-4 md:p-8 rounded-2xl md:rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 hover:border-emerald-400 transition-all backdrop-blur-sm">
              <div className="text-emerald-300 mb-1 md:mb-3 text-sm md:text-lg font-semibold">Active Jobs</div>
              <div className="text-3xl md:text-4xl font-black text-white">{dashboardStats.activeJobs}</div>
              <div className="text-emerald-200 mt-1 md:mt-2 text-xs md:text-sm font-medium">In progress</div>
            </div>
            <div className="p-4 md:p-8 rounded-2xl md:rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 hover:border-amber-400 transition-all backdrop-blur-sm">
              <div className="text-amber-300 mb-1 md:mb-3 text-sm md:text-lg font-semibold">Revenue</div>
              <div className="text-2xl md:text-4xl font-black text-white">₹{dashboardStats.totalRevenue.toLocaleString()}</div>
              <div className="text-amber-200 mt-1 md:mt-2 text-xs md:text-sm font-medium">Lifetime</div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-2xl rounded-2xl md:rounded-3xl border border-white/10 p-4 md:p-8 shadow-2xl">
            <Tabs defaultValue="mechanics" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6 md:mb-8 h-auto bg-white/5 rounded-xl md:rounded-2xl p-1.5 md:p-2 border border-white/20 gap-1">
                <TabsTrigger value="mechanics" className="rounded-lg md:rounded-xl data-[state=active]:bg-blue-500 data-[state=active]:shadow-lg h-10 md:h-16 text-xs md:text-sm">
                  Mechanics ({mechanics.length})
                </TabsTrigger>
                <TabsTrigger value="attendance" className="rounded-lg md:rounded-xl data-[state=active]:bg-violet-500 data-[state=active]:shadow-lg h-10 md:h-16 text-xs md:text-sm">
                  Attendance
                </TabsTrigger>
                <TabsTrigger value="requests" className="rounded-lg md:rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:shadow-lg h-10 md:h-16 text-xs md:text-sm">
                  Requests
                </TabsTrigger>
                <TabsTrigger value="sms" className="rounded-lg md:rounded-xl data-[state=active]:bg-green-500 data-[state=active]:shadow-lg h-10 md:h-16 text-xs md:text-sm">
                  SMS
                </TabsTrigger>
              </TabsList>

              <TabsContent value="mechanics" className="mt-0">
                <div className="md:hidden space-y-3">
                  {mechanics.map((m) => (
                    <div key={m.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${m.verificationStatus === 'VERIFIED' ? 'bg-emerald-400' : 'bg-orange-400'}`}></div>
                          <span className="font-semibold text-white text-sm">{m.name}</span>
                        </div>
                        <Badge className={getStatusBadge(m.verificationStatus?.toLowerCase?.() || 'inactive')}>
                          {m.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge className={`text-xs ${m.experience >= 10 ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : m.experience >= 5 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                          {getExperienceLabel(m.experience)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="text-left py-4 px-6 font-bold text-white">Name</th>
                        <th className="text-left py-4 px-6 font-bold text-white w-24">Level</th>
                        <th className="text-left py-4 px-6 font-bold text-white">Bookings</th>
                        <th className="text-left py-4 px-6 font-bold text-white w-28">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mechanics.map((m) => (
                        <tr key={m.id} className="border-b border-white/5 hover:bg-white/10 transition-colors">
                          <td className="py-4 px-6 font-semibold text-white flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${m.verificationStatus === 'VERIFIED' ? 'bg-emerald-400' : 'bg-orange-400'}`}></div>
                            {m.name}
                          </td>
                          <td className="py-4 px-6">
                            <Badge className={`px-3 py-1 text-xs font-bold ${m.experience >= 10 ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : m.experience >= 5 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                              {getExperienceLabel(m.experience)}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-blue-300 font-mono">{m.bookings || 0}</td>
                          <td className="py-4 px-6">
                            <Badge className={getStatusBadge(m.verificationStatus?.toLowerCase?.() || 'inactive')}>
                              {m.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="attendance" className="mt-0">
                <AttendanceManager
                  mechanics={mechanicsWithAttendance}
                  attendanceEnabled={attendanceEnabled}
                  attendanceRecords={attendanceRecords}
                />
              </TabsContent>

              <TabsContent value="requests" className="mt-0">
                <ServiceRequestsManager requests={serviceRequests} />
              </TabsContent>

              <TabsContent value="sms" className="mt-0">
                <SMSBroadcast audienceStats={whatsAppAudienceStats} />
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </div>
    </div>
  );
}