import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { SPECIALTIES } from "@/lib/specialities";

export default async function ServicesPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader
          title="Find Our Services"
          description="Browse by service type or request a mechanic for your specific need."
          backLink="/"
          backLabel="Back to Home"
        />

        <div className="flex flex-wrap justify-center gap-5">
          {SPECIALTIES.map((specialty) => (
            <Link
              key={specialty.name}
              href={`/services/${specialty.name}`}
              className="w-full sm:w-[calc(50%-0.625rem)] md:w-[calc(33.333%-0.85rem)] lg:w-[calc(25%-0.95rem)]"
            >
              <Card className="group h-full border-emerald-900/20 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-600/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-900/40 to-emerald-700/20 flex items-center justify-center mb-4 group-hover:from-emerald-700/50 group-hover:to-emerald-500/30 transition-colors">
                    <div className="text-emerald-400 group-hover:text-emerald-300 transition-colors">
                      {specialty.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold text-white">{specialty.name}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
