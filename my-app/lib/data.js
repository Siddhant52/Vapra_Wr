import {
  Calendar,
  Video,
  CreditCard,
  User,
  FileText,
  ShieldCheck,
} from "lucide-react";

// JSON data for features
export const features = [
  {
    icon: <User className="h-6 w-6 text-emerald-400" />,
    title: "Create Your Profile",
    description:
      "Sign up and add your vehicle details so our team can keep track of its service history.",
  },
  {
    icon: <Calendar className="h-6 w-6 text-emerald-400" />,
    title: "Book Appointments",
    description:
      "Check available time slots and schedule your service appointment with our workshop in just a few clicks.",
  },
  {
    icon: <Video className="h-6 w-6 text-emerald-400" />,
    title: "Remote Consultations",
    description:
      "Talk to our mechanic over video for a quick diagnosis or estimate before you bring your vehicle in.",
  },
  {
    icon: <CreditCard className="h-6 w-6 text-emerald-400" />,
    title: "Credit-Based Payments",
    description:
      "Buy credit bundles once and use them to pay for services, parts, and consultations—no repeated checkouts.",
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-emerald-400" />,
    title: "Experienced, Trusted Team",
    description:
      "Our mechanics are experienced and background-verified, so you can trust the quality of every repair.",
  },
  {
    icon: <FileText className="h-6 w-6 text-emerald-400" />,
    title: "Service History",
    description:
      "Access past appointments, invoices, and service notes anytime in your dashboard.",
  },
];

// JSON data for testimonials
export const testimonials = [
  {
    initials: "RK",
    name: "Ravi K.",
    role: "Customer",
    quote:
      "Booking a mechanic through Vapra was effortless. My car was repaired quickly, and I could track the service details right in the app.",
  },
  {
    initials: "AM",
    name: "Anita M.",
    role: "Mechanic",
    quote:
      "The platform makes it easy to manage my schedule and connect with customers who need reliable service.",
  },
  {
    initials: "SV",
    name: "Sanjay V.",
    role: "Customer",
    quote:
      "I love the credit system. It keeps billing simple and lets me book services without fumbling through invoices.",
  },
];

// JSON data for service plans (same as pricing section)
export const servicePlans = [
  {
    name: "Essential",
    price: "₹599",
    description: "Everyday care for your vehicle",
    popular: false,
    features: [
      "All services",
      "Filter",
      "General checkup",
      "Washing",
    ],
  },
  {
    name: "Standard",
    price: "₹999",
    description: "Most popular for regular maintenance",
    popular: true,
    features: [
      "Everything in Essential (₹599)",
      "Tire & brake",
      "Body checkup",
      "Wiring",
    ],
  },
  {
    name: "Premium",
    price: "₹1,499",
    description: "Complete care, top to bottom",
    popular: false,
    features: [
      "Everything in Standard",
      "Radiator",
      "Deep cleaning",
      "Suspension checkup",
      "Others",
    ],
  },
];

// JSON data for credit system benefits
export const creditBenefits = [
  "Each service booking uses <strong class='text-emerald-400'>2 credits</strong> so you know what each appointment costs.",
  "Credits <strong class='text-emerald-400'>never expire</strong>—use them whenever your vehicle needs work.",
  "Monthly subscriptions give you <strong class='text-emerald-400'>fresh credits every month</strong> for regular maintenance.",
  "Use credits for inspections, repairs, and video consultations with mechanics.",
];
