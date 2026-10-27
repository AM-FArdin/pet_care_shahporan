"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, FileText, Home, LogOut, Menu, Package, Receipt, ShieldCheck, Users, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/sales", label: "Sales & Billing", icon: Receipt },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/prescriptions", label: "E-Prescription", icon: FileText },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const isLoginPage = pathname === "/login";

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to log out of the admin portal?")) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  if (isLoginPage) {
    return <nav className="bg-white shadow-sm border-b border-gray-200 h-16" />;
  }

  return (
    <aside className={`fixed left-0 top-0 z-50 h-screen border-r border-gray-200 bg-white shadow-xl transition-[width] duration-200 ${expanded ? "w-64" : "w-[4.5rem]"}`}>
      <div className="flex h-full flex-col p-3">
        <div className={`flex items-center ${expanded ? "justify-between" : "justify-center"} border-b border-gray-100 pb-3`}>
          {expanded && <Link href="/" className="flex items-center gap-2 min-w-0">
            <Image src="/logo.jpg" alt="Shahporan Pet & Vet Care" width={38} height={38} className="rounded-full object-cover" priority />
            <span className="min-w-0"><span className="block truncate text-sm font-bold text-[#1a2f5e]">Shahporan</span><span className="block text-[11px] font-semibold text-[#1a7f7f]">Pet &amp; Vet Care</span></span>
          </Link>}
          <button onClick={() => setExpanded(!expanded)} className="rounded-lg p-2 text-gray-500 hover:bg-teal-50 hover:text-teal-700" aria-label={expanded ? "Collapse menu" : "Expand menu"}>
            {expanded ? <X size={19} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="mt-4 flex-1 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return <Link key={href} href={href} title={!expanded ? label : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${expanded ? "" : "justify-center"} ${active ? "bg-[#1a7f7f] text-white" : "text-gray-600 hover:bg-teal-50 hover:text-[#1a7f7f]"}`}>
              <Icon size={18} /><span className={expanded ? "" : "sr-only"}>{label}</span>
            </Link>;
          })}
        </nav>
        <div className={`border-t border-gray-100 pt-3 ${expanded ? "space-y-3" : "flex flex-col items-center gap-3"}`}>
          <div className={`flex items-center gap-2 text-xs font-semibold text-gray-600 ${expanded ? "" : "justify-center"}`} title="Admin">
            <ShieldCheck size={16} className="text-emerald-600" /><span className={expanded ? "" : "sr-only"}>Admin</span>
          </div>
          <button onClick={handleLogout} disabled={loggingOut} title="Sign out" className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 ${expanded ? "w-full" : "justify-center"}`}>
            <LogOut size={15} /><span className={expanded ? "" : "sr-only"}>{loggingOut ? "Signing out..." : "Sign Out"}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
