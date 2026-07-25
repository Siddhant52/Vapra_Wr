import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { creditBenefits, features, testimonials, servicePlans } from "@/lib/data";
import { ArrowRight, Check, Wrench } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/actions/onboarding";
import TrackAppointmentButton from "@/components/track-appointment-button";
import SliderBanner from "@/components/slider-banner";

const HERO_IMAGES = [
  "vapra1.jpeg",
  "vapra2.jpeg",
  "vapra3.jpeg",
  "vapra4.jpeg",
  "vapra5jpeg.jpeg",
  "vapra6.jpeg",
  "vapra7.jpeg",
  "vapra8.jpeg",
  "vapra9.jpeg",
  "vapra10.jpeg",
  "vapra11.jpeg",
  "vapra12.jpeg",
];

export default async function Home() {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";
  const isCustomer = user?.role === "CUSTOMER";

  const primaryLabel = isAdmin ? "Dashboard" : "Book Service";
  const primaryHref = isAdmin ? "/admin" : "/onboarding";

  const secondaryLabel = isAdmin ? "Manage" : "Appointments";
  const secondaryHref = isAdmin ? "/admin/manage" : "/booking-status";

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 lg:py-32 pt-24 md:pt-28 lg:pt-32">
        <div className="container mx-auto px-3 md:px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center">
            <div className="space-y-4 md:space-y-6 lg:space-y-8">
              <Badge
                variant="outline"
                className="bg-orange-900/30 border-orange-700/30 px-3 md:px-4 py-1.5 md:py-2 text-orange-400 text-xs md:text-sm font-medium w-fit"
              >
                Trusted Auto Care in Bikaner
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Book Your Car Service <br className="hidden sm:block" />{" "}
                <span className="gradient-title">at Vapra Workshop, Online</span>
              </h1>
              <p className="text-muted-foreground text-base md:text-lg lg:text-xl max-w-md">
                Schedule appointments, track repairs, and pay easily — all for
                your vehicle, serviced by our trusted team right here in
                Bikaner, Rajasthan.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2 md:pt-4">
                {isAdmin ? (
                  <Button
                    asChild
                    size="lg"
                    className="bg-orange-700 text-white hover:bg-orange-800 h-10 md:h-11 text-sm md:text-base"
                  >
                    <Link href={primaryHref}>
                      {primaryLabel} <ArrowRight className="ml-2 h-3 md:h-4 w-3 md:w-4" />
                    </Link>
                  </Button>
                ) : (
                  <TrackAppointmentButton href={primaryHref} source="home-hero-primary">
                    {primaryLabel} <ArrowRight className="ml-2 h-3 md:h-4 w-3 md:w-4" />
                  </TrackAppointmentButton>
                )}

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="bg-orange-700/30 hover:bg-muted/80 h-10 md:h-11 text-sm md:text-base"
                >
                  <Link href={secondaryHref}>{secondaryLabel}</Link>
                </Button>
              </div>
            </div>
            <SliderBanner
              images={HERO_IMAGES}
              interval={4200}
              alt="Vapra workshop"
            />
          </div>
        </div>
      </section>


      <section className="py-12 md:py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-3 md:px-4">
          <div className="text-center mb-8 md:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 md:mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground text-sm md:text-base lg:text-lg max-w-2xl mx-auto px-2">
              Getting your vehicle serviced with us takes just a few clicks.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {features.map((feature, index) => {
              return (
                <Card
                  key={index}
                  className="border-orange-900/20 hover:border-orange-800/40 transition-all duration-300 flex flex-col h-full"
                >
                  <CardHeader className="pb-2 sm:pb-3">
                    <div className="bg-orange-900/20 p-2 md:p-3 rounded-lg w-fit mb-3 md:mb-4">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-base md:text-lg font-semibold text-white">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-3 md:px-4">
          <div className="text-center mb-8 md:mb-12 lg:mb-16">
            <Badge
              className="bg-orange-900/30 border-orange-700/30 px-3 md:px-4 py-1.5 md:py-1 text-orange-400 text-xs md:text-sm font-medium mb-3 md:mb-4 w-fit mx-auto"
            >
              Affordable Repair and Maintenance
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 md:mb-4">
              Service Plans
            </h2>
            <p className="text-muted-foreground text-sm md:text-base lg:text-lg max-w-2xl mx-auto px-2">
              Choose the perfect service plan that fits your vehicle's needs.
            </p>
            <p className="text-muted-foreground text-xs md:text-sm max-w-2xl mx-auto px-2 mt-2">
              Each plan below is a one-time payment for that service — no
              credits needed. Prefer to pay as you go instead? Sign in and use
              our credit system for individual bookings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {servicePlans.map((plan) => (
              <Card
                key={plan.name}
                className={`flex flex-col h-full border transition-all ${
                  plan.popular
                    ? "border-emerald-600/60 shadow-lg shadow-emerald-600/20 lg:scale-105"
                    : "border-emerald-900/20 hover:border-emerald-900/40"
                }`}
              >
                {plan.popular && (
                  <Badge className="self-start bg-emerald-700 text-white px-2 md:px-3 py-1 mb-3 text-xs md:text-sm">
                    Most Popular
                  </Badge>
                )}

                <CardHeader className="pb-2 md:pb-3">
                  <CardTitle className="text-base md:text-lg text-white">{plan.name}</CardTitle>
                  <CardDescription className="text-xs md:text-sm text-gray-300">{plan.description}</CardDescription>
                  <div className="mt-3 md:mt-4">
                    <p className="text-2xl md:text-3xl font-bold text-emerald-300">{plan.price}</p>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col justify-between space-y-4 md:space-y-6 flex-grow">
                  <ul className="space-y-1.5 md:space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-xs md:text-sm text-gray-300">
                        <Check className="mt-0.5 h-3 md:h-4 w-3 md:w-4 text-emerald-400 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    size="sm"
                    className="bg-emerald-700 text-white hover:bg-emerald-800 h-9 md:h-10 text-xs md:text-sm"
                  >
                    <Link href="/pricing">Choose This Plan</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8 md:mt-10 bg-muted/20 border-orange-900/30">
            <CardHeader>
              <CardTitle className="text-base md:text-lg font-semibold text-white flex items-center">
                <Wrench className="h-4 md:h-5 w-4 md:w-5 mr-2 text-orange-400" />
                How Our Credit System Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 md:space-y-3">
                {creditBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <div className="mr-2 md:mr-3 mt-0.5 md:mt-1 bg-orange-900/20 p-1 rounded-full flex-shrink-0">
                      <Check className="h-3 md:h-4 w-3 md:w-4 text-orange-400" />
                    </div>
                    <p
                      className="text-xs md:text-sm text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: benefit }}
                    ></p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-12 md:py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-3 md:px-4">
          <div className="text-center mb-8 md:mb-12 lg:mb-16">
            <Badge
              variant="outline"
              className="bg-orange-900/30 border-orange-700/30 px-3 md:px-4 py-1.5 md:py-1 text-orange-400 text-xs md:text-sm font-medium mb-3 md:mb-4 w-fit mx-auto"
            >
              Success Stories
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 md:mb-4">
              What Our Users Say
            </h2>
            <p className="text-muted-foreground text-sm md:text-base lg:text-lg max-w-2xl mx-auto px-2">
              Hear from people who use our platform
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => {
              return (
                <Card
                  key={index}
                  className="border-orange-900/20 hover:border-orange-800/40 transition-all duration-300 flex flex-col h-full"
                >
                  <CardContent className="pt-4 md:pt-6 flex flex-col justify-between h-full">
                    <div className="flex items-center mb-3 md:mb-4">
                      <div
                        className="w-10 md:w-12 h-10 md:h-12 rounded-full bg-orange-900/20 flex items-center justify-center mr-2 md:mr-4 flex-shrink-0"
                      >
                        <span className="text-orange-400 font-bold text-xs md:text-sm">
                          {testimonial.initials}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm md:text-base text-white">
                          {testimonial.name}
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs md:text-sm text-muted-foreground">
                      &quot;{testimonial.quote}&quot;
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-3 md:px-4">
          <Card className="bg-gradient-to-r from-orange-900/30 to-orange-950/20 border-orange-800/20">
            <CardContent className="p-6 md:p-8 lg:p-12 relative overflow-hidden">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 md:mb-4 lg:mb-6">
                  Ready to take control of your vehicle's health?
                </h2>
                <p className="text-sm md:text-base lg:text-lg text-muted-foreground mb-4 md:mb-6 lg:mb-8">
                  Join thousands of users who have simplified their car maintenance
                  journey with our platform. Get started today and experience
                  repair and maintenance the way it should be.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                  <Button
                    size="lg"
                    className="bg-orange-700 text-white hover:bg-orange-800 h-10 md:h-11 text-sm md:text-base"
                    asChild
                  >
                    <Link href="/sign-up">Sign-up Now</Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-orange-700/30 hover:bg-muted/80 h-10 md:h-11 text-sm md:text-base"
                    asChild
                  >
                    <Link href="/pricing">View Pricing</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
