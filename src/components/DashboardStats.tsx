"use client";
import { useState, useEffect, useCallback } from "react";
import { Users, PawPrint, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import LowStockModal from "@/components/LowStockModal";

interface Stats {
  totalPatients: number;
  totalOwners: number;
  lowStockCount: number;
  todayRevenue: string;
  netRevenue: string;
  notConfigured?: boolean;
  error?: string;
}

export default function DashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);

  const fetchStats = useCallback(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-3/4 mb-3" />
            <div className="h-6 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats || stats.notConfigured) {
    return null; // Don't show if DB not configured
  }

  const cards = [
    {
      label: "Active Patients",
      value: stats.totalPatients.toString(),
      sub: `${stats.totalOwners} registered owners`,
      icon: PawPrint,
      color: "bg-teal-50 text-teal-700",
      border: "border-teal-200",
      clickable: false,
    },
    {
      label: "Today's Revenue",
      value: `৳${Number(stats.todayRevenue).toLocaleString()}`,
      sub: "Collected today",
      icon: TrendingUp,
      color: "bg-emerald-50 text-emerald-700",
      border: "border-emerald-200",
      clickable: false,
    },
    {
      label: "Net Revenue",
      value: `৳${Number(stats.netRevenue).toLocaleString()}`,
      sub: "Sales − Discounts − Expenses",
      icon: Users,
      color: Number(stats.netRevenue) >= 0 ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700",
      border: Number(stats.netRevenue) >= 0 ? "border-blue-200" : "border-red-200",
      clickable: false,
    },
    {
      label: "Low Stock Alerts",
      value: stats.lowStockCount.toString(),
      sub: stats.lowStockCount > 0 ? "Click to open Restock Center →" : "All stocked up ✓",
      icon: AlertTriangle,
      color: stats.lowStockCount > 0 ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-600",
      border: stats.lowStockCount > 0 ? "border-red-300 ring-2 ring-red-200 hover:border-red-500" : "border-gray-200",
      clickable: true,
      onClick: () => setIsLowStockModalOpen(true),
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const content = (
            <div
              key={card.label}
              onClick={card.clickable ? card.onClick : undefined}
              className={`bg-white rounded-xl p-5 border ${card.border} shadow-sm transition-all ${
                card.clickable
                  ? "cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.99] group"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`inline-flex p-2 rounded-lg ${card.color}`}>
                  <card.icon size={18} />
                </div>
                {card.clickable && stats.lowStockCount > 0 && (
                  <span className="text-[11px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1 group-hover:bg-red-600 group-hover:text-white transition-colors">
                    Restock
                    <ArrowRight size={10} />
                  </span>
                )}
              </div>
              <p className="text-xl font-bold text-gray-800">{card.value}</p>
              <p className="text-xs font-semibold text-gray-700 mt-0.5">{card.label}</p>
              <p className={`text-xs mt-0.5 ${card.clickable && stats.lowStockCount > 0 ? "text-red-600 font-medium" : "text-gray-400"}`}>
                {card.sub}
              </p>
            </div>
          );

          return content;
        })}
      </div>

      {/* Interactive Low Stock Modal */}
      <LowStockModal
        isOpen={isLowStockModalOpen}
        onClose={() => setIsLowStockModalOpen(false)}
        onStockUpdated={fetchStats}
      />
    </>
  );
}
