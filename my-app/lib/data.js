import {
  Calendar,
  MessageCircle,
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
    icon: <MessageCircle className="h-6 w-6 text-emerald-400" />,
    title: "WhatsApp Updates",
    description:
      "Get instant WhatsApp messages when your booking is created, reviewed, assigned to a mechanic, and completed.",
  },
  {
    icon: <CreditCard className="h-6 w-6 text-emerald-400" />,
    title: "Simple Online Payments",
    description:
      "Pay securely online for your chosen service plan—no repeated paperwork, just a clear one-time payment.",
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
      "The service plans make pricing simple. I know exactly what I'm paying for before I book, no surprises.",
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
      "All services",
      "Filter",
      "General checkup",
      "Washing",
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
      "All services",
      "Filter",
      "General checkup",
      "Washing",
      "Tire & brake",
      "Body checkup",
      "Wiring",
      "Radiator",
      "Deep cleaning",
      "Suspension checkup",
      "Others",
    ],
  },
];
