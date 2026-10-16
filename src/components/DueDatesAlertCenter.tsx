"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  Calendar,
  Phone,
  MessageSquare,
  Search,
  Syringe,
  Stethoscope,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

export interface DueDateAlertItem {
  id: string;
  sourceType: "vaccination" | "medical_record";
  sourceId: number;
  title: string;
  dueDate: string;
  daysDiff: number;
  urgency: "overdue" | "due_today" | "due_soon" | "upcoming" | "later";
  petId: number;
  petName: string;
  species: string;
  breed: string | null;
  ownerId: number;
  ownerName: string;
  ownerPhone: string;
  doctorOrStaff: string | null;
  notes: string | null;
  whatsappUrl: string;
  telUrl: string;
  smsUrl: string;
}

interface AlertCounts {
  total: number;
  overdue: number;
  dueToday: number;
  dueSoon: number;
  upcoming: number;
  vaccines: number;
  followUps: number;
}

type AlertTab = "all" | "overdue" | "due_today" | "due_soon" | "vaccines" | "followups";

export default function DueDatesAlertCenter() {
  const [alerts, setAlerts] = useState<DueDateAlertItem[]>([]);
  const [counts, setCounts] = useState<AlertCounts>({
    total: 0,
    overdue: 0,
    dueToday: 0,
    dueSoon: 0,
    upcoming: 0,
    vaccines: 0,
    followUps: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<AlertTab>("all");

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/alerts/due-dates");
      const data = await res.json();
      if (res.ok && data.alerts) {
        setAlerts(data.alerts);
        setCounts(data.counts);
      }
    } catch (e) {
      console.error("Failed to fetch due date alerts:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void fetchAlerts(), 0);
    return () => window.clearTimeout(timeout);
  }, [fetchAlerts]);

  // Filtering
  const filteredAlerts = alerts.filter((item) => {
    // Tab filter
    if (activeTab === "overdue" && item.urgency !== "overdue") return false;
    if (activeTab === "due_today" && item.urgency !== "due_today") return false;
    if (activeTab === "due_soon" && item.urgency !== "due_soon") return false;
    if (activeTab === "vaccines" && item.sourceType !== "vaccination") return false;
    if (activeTab === "followups" && item.sourceType !== "medical_record") return false;

    // Search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.petName.toLowerCase().includes(q) ||
      item.ownerName.toLowerCase().includes(q) ||
      item.ownerPhone.includes(q) ||
      item.title.toLowerCase().includes(q) ||
      item.species.toLowerCase().includes(q)
    );
  });

  const formatDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split("-").map(Number);
      return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getUrgencyBadge = (urgency: DueDateAlertItem["urgency"], daysDiff: number) => {
    switch (urgency) {
      case "overdue":
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-200 animate-pulse">
            <AlertTriangle size={12} className="text-red-600" />
            {Math.abs(daysDiff)} {Math.abs(daysDiff) === 1 ? "day" : "days"} OVERDUE
          </span>
        );
      case "due_today":
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
            <Clock size={12} className="text-amber-700" />
            DUE TODAY
          </span>
        );
      case "due_soon":
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
            <Calendar size={12} className="text-blue-600" />
            In {daysDiff} {daysDiff === 1 ? "day" : "days"}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full">
            <Calendar size={11} className="text-gray-500" />
            Upcoming
          </span>
        );
    }
  };

  const getCaseFileHref = (item: DueDateAlertItem) => {
    const tab = item.sourceType === "vaccination" ? "vax" : "records";
    return `/customers/${item.ownerId}?petId=${item.petId}&tab=${tab}&sourceType=${item.sourceType}&sourceId=${item.sourceId}`;
  };

  return (
    <div
      id="due-reminders"
      className="scroll-mt-24 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
    >
      {/* Top Header */}
      <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-teal-50/50 via-white to-amber-50/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-teal-600 text-white rounded-xl shadow-md">
              <Bell size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#1a2f5e]">
                  Pet Follow-Up &amp; Due Date Reminders
                </h2>
                {counts.overdue > 0 && (
                  <span className="bg-red-500 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                    {counts.overdue} Urgent
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Proactive notifications for scheduled vaccination boosters &amp; clinical re-checks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAlerts}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
              title="Refresh alerts"
            >
              <RefreshCw size={13} className={loading ? "animate-spin text-teal-600" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* Quick Filter Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
          <button
            onClick={() => setActiveTab("all")}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeTab === "all"
                ? "bg-white border-[#1a7f7f] shadow-sm ring-2 ring-teal-500/20"
                : "bg-white/70 border-gray-200 hover:bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">All Reminders</span>
              <span className="text-base font-bold text-gray-800">{counts.total}</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("overdue")}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeTab === "overdue"
                ? "bg-red-50/80 border-red-500 shadow-sm ring-2 ring-red-400/20"
                : "bg-white/70 border-gray-200 hover:bg-red-50/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-red-700">🔴 Overdue</span>
              <span className="text-base font-extrabold text-red-600">{counts.overdue}</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("due_today")}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeTab === "due_today"
                ? "bg-amber-50/80 border-amber-500 shadow-sm ring-2 ring-amber-400/20"
                : "bg-white/70 border-gray-200 hover:bg-amber-50/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-800">⚡ Due Today</span>
              <span className="text-base font-extrabold text-amber-700">{counts.dueToday}</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("due_soon")}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeTab === "due_soon"
                ? "bg-blue-50/80 border-blue-500 shadow-sm ring-2 ring-blue-400/20"
                : "bg-white/70 border-gray-200 hover:bg-blue-50/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-700">📅 Next 7 Days</span>
              <span className="text-base font-extrabold text-blue-600">{counts.dueSoon}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {([
            { id: "all", label: "All" },
            { id: "overdue", label: `Overdue (${counts.overdue})` },
            { id: "due_today", label: `Today (${counts.dueToday})` },
            { id: "due_soon", label: `Next 7 Days (${counts.dueSoon})` },
            { id: "vaccines", label: `💉 Vaccines (${counts.vaccines})` },
            { id: "followups", label: `🩺 Follow-ups (${counts.followUps})` },
          ] satisfies { id: AlertTab; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-[#1a7f7f] text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-teal-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search pet, owner, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Reminder List */}
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border border-gray-200 rounded-xl animate-pulse bg-gray-50">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="text-center py-10 px-4">
            <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-semibold text-gray-800">All caught up!</p>
            <p className="text-xs text-gray-500 mt-0.5">
              No due date alerts found matching your selected criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {filteredAlerts.map((item) => {
              const isOverdue = item.urgency === "overdue";
              const isToday = item.urgency === "due_today";

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4 sm:p-5 transition-all hover:shadow-md ${
                    isOverdue
                      ? "border-red-300 bg-red-50/20"
                      : isToday
                      ? "border-amber-300 bg-amber-50/20"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Patient & Reminder Details */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {getUrgencyBadge(item.urgency, item.daysDiff)}
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            item.sourceType === "vaccination"
                              ? "bg-teal-100 text-teal-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {item.sourceType === "vaccination" ? (
                            <>
                              <Syringe size={11} /> Vaccine Booster
                            </>
                          ) : (
                            <>
                              <Stethoscope size={11} /> Clinical Follow-up
                            </>
                          )}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          Scheduled: <strong className="text-gray-800">{formatDate(item.dueDate)}</strong>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-baseline gap-2">
                        <h3 className="text-base font-bold text-gray-900">{item.petName}</h3>
                        <span className="text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md font-medium">
                          {item.species} {item.breed ? `• ${item.breed}` : ""}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-600">
                          Owner: <strong className="text-gray-800">{item.ownerName}</strong>
                        </span>
                      </div>

                      <p className="text-xs text-gray-700 font-medium">
                        {item.title}
                      </p>

                      {item.notes && (
                        <p className="text-[11px] text-gray-500 italic bg-gray-50 p-2 rounded-lg border border-gray-100">
                          Notes: {item.notes}
                        </p>
                      )}

                      {item.doctorOrStaff && (
                        <p className="text-[11px] text-gray-400">
                          Attended by: <span className="text-gray-600">{item.doctorOrStaff}</span>
                        </p>
                      )}
                    </div>

                    {/* Right: Interactive One-Click Actions */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                      {/* WhatsApp Button */}
                      <a
                        href={item.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.02]"
                        title="Send pre-filled WhatsApp reminder"
                      >
                        <MessageSquare size={14} className="fill-white" />
                        <span>WhatsApp Alert</span>
                      </a>

                      {/* Direct Phone Call */}
                      <a
                        href={item.telUrl}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 rounded-xl text-xs font-semibold transition-colors"
                        title="Call owner directly"
                      >
                        <Phone size={13} />
                        <span>Call</span>
                      </a>

                      {/* SMS */}
                      <a
                        href={item.smsUrl}
                        className="hidden sm:inline-flex items-center justify-center gap-1.5 px-2.5 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-medium transition-colors"
                        title="Send SMS"
                      >
                        SMS
                      </a>

                      {/* View Case File */}
                      <Link
                        href={getCaseFileHref(item)}
                        className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-xl text-xs font-medium shadow-sm transition-colors"
                        title={`Open ${item.petName}'s ${item.sourceType === "vaccination" ? "vaccinations" : "clinical records"}`}
                      >
                        <span>Open Reminder</span>
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
