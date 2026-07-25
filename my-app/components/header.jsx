"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";

export default function Header({ authSlot }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/pricing", label: "Pricing" },
    { href: "/services", label: "Services" },
    { href: "/contact-support", label: "Support" },
  ];

  return (
    <header className="fixed top-0 w-full border-b bg-background/80 backdrop-blur-md z-50 supports-backdrop-filter:bg-background/60">
      <nav className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
          <Image
            src="/logo-single2.png"
            alt="Vapra Workshop logo"
            width={160}
            height={48}
            priority
            className="h-8 w-auto md:h-10"
            style={{ width: "auto", height: "auto", maxHeight: "2.5rem" }}
          />
          <span className="text-sm md:text-lg font-semibold tracking-wide bg-linear-to-r from-emerald-400 via-orange-400 to-emerald-400 bg-clip-text text-transparent shadow-sm">
            Vapra Workshop
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative px-3 py-2 rounded-md text-sm font-medium text-foreground hover:text-emerald-400 transition-colors after:absolute after:bottom-0.5 after:left-3 after:right-3 after:h-0.5 after:origin-left after:scale-x-0 after:bg-emerald-400 after:transition-transform after:duration-300 hover:after:scale-x-100"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 lg:hidden">
          {authSlot}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="ml-2"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </Button>
        </div>

        {/* Desktop Auth */}
        <div className="hidden lg:block">
          {authSlot}
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/40 transition"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}

    </header>
  );
}