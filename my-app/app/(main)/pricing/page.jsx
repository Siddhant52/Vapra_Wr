"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const router = useRouter();

  const packages = [
    {
      id: "basic",
      name: "Basic Service",
      priceLabel: "Starting at ₹999",
      priceAmount: 99900,
      description: "Single service repair",
      popular: false,
      features: [
        "One vehicle service",
        "Basic diagnostics",
        "Labor included",
        "30-day warranty",
        "Standard turnaround time",
      ],
    },
    {
      id: "standard",
      name: "Complete Maintenance",
      priceLabel: "Starting at ₹1,999",
      priceAmount: 199900,
      description: "Most popular for regular maintenance",
      popular: true,
      features: [
        "Multiple services",
        "Full diagnostics",
        "Parts & labor included",
        "90-day warranty",
        "Priority scheduling",
        "Free inspection",
      ],
    },
    {
      id: "premium",
      name: "Premium Package",
      priceLabel: "Starting at ₹4,999",
      priceAmount: 499900,
      description: "Fleet or specialized services",
      popular: false,
      features: [
        "Unlimited services",
        "Advanced diagnostics",
        "All parts included",
        "6-month warranty",
        "24-hour turnaround",
        "Dedicated technician",
      ],
    },
  ];

  const handleBooking = () => {
    router.push("/onboarding");
  };

  const handleCheckout = async (pkg) => {
    setLoadingPlan(pkg.id);
    setStatusMessage("");

    try {
      const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
      if (!publicKey) {
        throw new Error("Razorpay public key is missing. Add NEXT_PUBLIC_RAZORPAY_KEY_ID to your environment.");
      }

      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: pkg.priceAmount,
          currency: "INR",
          receipt: `receipt_${pkg.id}_${Date.now()}`,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.message || "Unable to start checkout. Please try again.";

        if (response.status === 401 || /authentication/i.test(message)) {
          throw new Error(
            "Razorpay authentication failed. Update the Razorpay API credentials in the server environment before trying again."
          );
        }

        throw new Error(message);
      }

      const data = await response.json();
      const options = {
        key: publicKey,
        amount: data.amount,
        currency: data.currency,
        order_id: data.order_id,
        name: "Vapra Workshop",
        description: pkg.name,
        handler: async function (response) {
          try {
            const verifyResponse = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyResponse.json().catch(() => null);

            if (!verifyResponse.ok || !verifyData?.success) {
              throw new Error(verifyData?.message || "Payment verification failed.");
            }

            window.location.href = "/checkout/success";
          } catch (error) {
            console.error(error);
            setStatusMessage(error.message || "Payment verification failed.");
          }
        },
        modal: {
          ondismiss: function () {
            setStatusMessage("Payment cancelled. No charges were made.");
          },
        },
        prefill: {
          name: "",
          email: "",
        },
        theme: {
          color: "#10b981",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        setStatusMessage(response.error?.description || "Payment failed. Please try again.");
      });
      rzp.open();
    } catch (error) {
      console.error(error);
      setStatusMessage(error.message || "Something went wrong while starting checkout.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16 space-y-8 md:space-y-12">
      <PageHeader 
        title="Our Service Pricing"
        description="Transparent pricing for quality automotive services at Vapra Workshop"
      />
      <div className="text-xs sm:text-sm text-emerald-300 mb-4 md:mb-6 max-w-2xl">
        Secure Razorpay Standard Checkout is available for customers who sign in before purchase.
      </div>

      {statusMessage ? (
        <div className="rounded-lg border border-emerald-600/30 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">
          {statusMessage}
        </div>
      ) : null}

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 items-stretch">
        {packages.map((pkg, idx) => (
          <Card
            key={idx}
            className={`relative flex h-full flex-col border transition-all ${
              pkg.popular
                ? "border-emerald-600/60 shadow-lg shadow-emerald-600/20 lg:scale-105"
                : "border-emerald-900/20 hover:border-emerald-900/40"
            }`}
          >
            {pkg.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm">
                  Most Popular
                </Badge>
              </div>
            )}

            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl text-white">{pkg.name}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">{pkg.description}</CardDescription>
              <div className="mt-3 sm:mt-4">
                <p className="text-2xl sm:text-3xl font-bold text-emerald-400">{pkg.priceLabel}</p>
              </div>
            </CardHeader>

            <CardContent className="flex h-full flex-col justify-between space-y-4 sm:space-y-6">
              <ul className="space-y-2 sm:space-y-3">
                {pkg.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 sm:gap-3">
                    <Check className="mt-0.5 sm:mt-1 h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-2 sm:space-y-3">
                <Button
                  onClick={() => handleCheckout(pkg)}
                  className={`w-full text-sm sm:text-base h-9 sm:h-10 ${
                    pkg.popular
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-emerald-600/80 hover:bg-emerald-600"
                  }`}
                  disabled={loadingPlan === pkg.id}
                >
                  {loadingPlan === pkg.id ? "Starting checkout..." : "Pay with Razorpay"}
                </Button>
                <Button
                  onClick={handleBooking}
                  variant="outline"
                  className="w-full text-sm sm:text-base h-9 sm:h-10"
                >
                  Browse Services
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Section */}
      <Card className="border-emerald-900/20">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl">Why Choose Vapra Workshop?</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Industry-leading service quality and customer satisfaction</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h4 className="font-semibold text-sm sm:text-base text-white mb-2">Expert Technicians</h4>
              <p className="text-xs sm:text-sm text-gray-400">
                Our certified mechanics have years of experience servicing all vehicle types and brands.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm sm:text-base text-white mb-2">Quality Guarantee</h4>
              <p className="text-xs sm:text-sm text-gray-400">
                All services backed by our satisfaction guarantee and warranty coverage.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm sm:text-base text-white mb-2">Transparent Pricing</h4>
              <p className="text-xs sm:text-sm text-gray-400">
                No hidden fees. Get upfront quotes before any work begins.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm sm:text-base text-white mb-2">Fast Turnaround</h4>
              <p className="text-xs sm:text-sm text-gray-400">
                Quick service without compromising on quality. Most jobs completed same day.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <div className="bg-emerald-900/20 border border-emerald-600/20 rounded-lg p-6 sm:p-8 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Ready to Book Your Service?</h2>
        <p className="text-xs sm:text-base text-gray-400 mb-4 sm:mb-6">
          Browse our services by category and schedule your appointment today
        </p>
        <Button
          size="lg"
          onClick={handleBooking}
          className="bg-emerald-600 hover:bg-emerald-700 h-9 sm:h-11 text-sm sm:text-base"
        >
          Browse All Services
        </Button>
      </div>
    </div>
  );
}
