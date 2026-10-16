"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Users,
  Package,
  Receipt,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  Bell,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import LowStockModal from "@/components/LowStockModal";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/sales", label: "Sales & Billing", icon: Receipt },
];

interface DueReminderPreview {
  id: string;
  sourceType: "vaccination" | "medical_record";
  sourceId: number;
  petId: number;
  petName: string;
  ownerId: number;
  title: string;
  urgency: "overdue" | "due_today" | "due_soon" | "upcoming" | "later";
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [alertCount, setAlertCount] = useState<number>(0);
  const [dueReminders, setDueReminders] = useState<DueReminderPreview[]>([]);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [showAlertMenu, setShowAlertMenu] = useState(false);
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);

  // If on login page, render simplified minimal header
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (isLoginPage) return;

    // Fetch alert badges count
    Promise.all([
      fetch("/api/alerts/due-dates")
        .then((r) => r.json())
        .then((d) => ({
          count: d.counts ? d.counts.overdue + d.counts.dueToday : 0,
          alerts: Array.isArray(d.alerts) ? d.alerts : [],
        }))
        .catch(() => ({ count: 0, alerts: [] })),
      fetch("/api/dashboard/stats")
        .then((r) => r.json())
        .then((d) => d.lowStockCount || 0)
        .catch(() => 0),
    ]).then(([dueData, lowCount]) => {
      setAlertCount(dueData.count);
      setDueReminders(dueData.alerts);
      setLowStockCount(lowCount);
    });
  }, [pathname, isLoginPage]);

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to log out of the admin portal?")) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
    } catch {
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  const totalUrgent = alertCount + lowStockCount;
  const urgentReminders = dueReminders
    .filter((reminder) => reminder.urgency === "overdue" || reminder.urgency === "due_today")
    .slice(0, 3);
  const getReminderHref = (reminder: DueReminderPreview) => {
    const tab = reminder.sourceType === "vaccination" ? "vax" : "records";
    return `/customers/${reminder.ownerId}?petId=${reminder.petId}&tab=${tab}&sourceType=${reminder.sourceType}&sourceId=${reminder.sourceId}`;
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={isLoginPage ? "/login" : "/"} className="flex items-center gap-3">
            <Image
              src="/logo.jpg"
              alt="Shahporan Pet & Vet Care"
              width={44}
              height={44}
              className="rounded-full object-cover shadow-sm"
              priority
            />
            <div>
              <p className="text-base font-bold text-[#1a2f5e] leading-tight">Shahporan</p>
              <p className="text-xs text-[#1a7f7f] font-semibold">Pet &amp; Vet Care</p>
            </div>
          </Link>

          {!isLoginPage && (
            <>
              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        active
                          ? "bg-[#1a7f7f] text-white shadow-sm"
                          : "text-gray-600 hover:bg-teal-50 hover:text-[#1a7f7f]"
                      }`}
                    >
                      <Icon size={16} />
                      {label}
                    </Link>
                  );
                })}
              </div>

              {/* Right: Alerts & Admin Controls */}
              <div className="hidden sm:flex items-center gap-3">
                {/* Notification Dropdown Trigger */}
                <div className="relative">
                  <button
                    onClick={() => setShowAlertMenu(!showAlertMenu)}
                    className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                    title="Clinic Reminders & Alerts"
                  >
                    <Bell size={19} />
                    {totalUrgent > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
                        {totalUrgent > 9 ? "9+" : totalUrgent}
                      </span>
                    )}
                  </button>

                  {/* Notification Popover */}
                  {showAlertMenu && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 animate-fade-in space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <span className="text-xs font-bold text-gray-900">Urgent Clinic Alerts</span>
                        <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">
                          Live Status
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <Link
                          href="/?focus=due-reminders#due-reminders"
                          onClick={() => setShowAlertMenu(false)}
                          className="flex items-center justify-between p-2 rounded-xl bg-teal-50/70 hover:bg-teal-100/70 transition-colors text-teal-900"
                        >
                          <div className="flex items-center gap-2">
                            <Bell size={14} className="text-teal-600" />
                            <span>Pet Due Date Alerts</span>
                          </div>
                          <span className="font-extrabold text-xs px-2 py-0.5 rounded-full bg-white text-teal-700 shadow-xs">
                            {alertCount}
                          </span>
                        </Link>

                        {urgentReminders.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <p className="px-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                              Open a reminder
                            </p>
                            {urgentReminders.map((reminder) => (
                              <Link
                                key={reminder.id}
                                href={getReminderHref(reminder)}
                                onClick={() => setShowAlertMenu(false)}
                                className="block rounded-xl border border-gray-100 p-2 hover:border-teal-200 hover:bg-teal-50/60 transition-colors"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="min-w-0 truncate text-xs font-semibold text-gray-800">
                                    {reminder.petName}
                                  </span>
                                  <span
                                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                                      reminder.urgency === "overdue"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-amber-100 text-amber-800"
                                    }`}
                                  >
                                    {reminder.urgency === "overdue" ? "OVERDUE" : "TODAY"}
                                  </span>
                                </div>
                                <p className="mt-0.5 truncate text-[10px] text-gray-500">{reminder.title}</p>
                              </Link>
                            ))}
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setShowAlertMenu(false);
                            setIsLowStockModalOpen(true);
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-xl bg-red-50/70 hover:bg-red-100/70 transition-colors text-red-900"
                        >
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={14} className="text-red-600" />
                            <span>Low Stock Items</span>
                          </div>
                          <span className="font-extrabold text-xs px-2 py-0.5 rounded-full bg-white text-red-700 shadow-xs">
                            {lowStockCount}
                          </span>
                        </button>
                      </div>

                      <button
                        onClick={() => setShowAlertMenu(false)}
                        className="w-full text-center text-[11px] text-gray-400 hover:text-gray-600 pt-1"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>

                {/* Admin Status Pill */}
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold border border-gray-200">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Admin</span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50 border border-transparent hover:border-red-200"
                  title="Sign out of Admin session"
                >
                  {loggingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                  <span>Sign Out</span>
                </button>
              </div>

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {!isLoginPage && menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-2 animate-fade-in shadow-lg">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                  active ? "bg-[#1a7f7f] text-white" : "text-gray-700 hover:bg-teal-50"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Admin Logged In</span>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Low Stock Quick Restock Modal triggered from Navbar */}
      <LowStockModal
        isOpen={isLowStockModalOpen}
        onClose={() => setIsLowStockModalOpen(false)}
        onStockUpdated={() => {
          fetch("/api/dashboard/stats")
            .then((r) => r.json())
            .then((d) => setLowStockCount(d.lowStockCount || 0))
            .catch(() => {});
        }}
      />
    </nav>
  );
}
