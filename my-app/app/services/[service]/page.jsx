@'
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SPECIALTIES } from "@/lib/specialities";

function findSpecialtyBySlug(slug) {
  return SPECIALTIES.find((s) => s.slug === slug);
}

export async function generateMetadata({ params }) {
  const { service } = await params;
  const specialty = findSpecialtyBySlug(service);
  const name = specialty?.name || "Service";

  return {
    title: `${name} | Vapra Workshop`,
    description: `Book ${name} at Vapra Workshop in Bikaner. Fast, transparent, and reliable auto repair service.`,
  };
}

export default async function ServiceDetailPage({ params }) {
  const { service } = await params;

  if (!service) {
    redirect("/services");
  }

  const specialty = findSpecialtyBySlug(service);
  const decodedService = specialty?.name || service.replace(/-/g, " ");
  const bookingUrl = `/booking-request?service=${encodeURIComponent(decodedService)}`;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader title={decodedService} backLink="/services" backLabel="All Services" />

        <Card className="border-emerald-900/20 hover:border-emerald-700/30 transition-colors">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-2 text-white">Book Service Now</CardTitle>
            <CardDescription>
              Submit your service request for {decodedService}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 py-8">
            <p className="text-center text-muted-foreground max-w-md">
              Our admin team will review your request and assign the best available mechanic for your {decodedService} service.
            </p>
            <Link href={bookingUrl}>
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 transition-all hover:shadow-lg hover:shadow-emerald-600/20">
                Request Booking
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-emerald-900/20">
          <CardHeader>
            <CardTitle className="text-white">What to Expect</CardTitle>
            <CardDescription>
              Our process is designed to make it easy for you to get the right help fast.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-white mb-2">Step 1: Request</h4>
              <p className="text-sm text-muted-foreground">
                Tell us your issue and preferred service date, then submit the request.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Step 2: Assignment</h4>
              <p className="text-sm text-muted-foreground">
                Our team assigns a qualified mechanic based on your service and availability.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Step 3: Confirmation</h4>
              <p className="text-sm text-muted-foreground">
                You will receive a confirmation with the scheduled date, time, and estimated cost.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Step 4: Service</h4>
              <p className="text-sm text-muted-foreground">
                The mechanic performs the service and follows up with any additional recommendations.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
'@ | Set-Content "app\services\[service]\page.jsx"