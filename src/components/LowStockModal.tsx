"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  X,
  Package,
  Plus,
  Download,
  Loader2,
  CheckCircle2,
  Search,
  ExternalLink,
  RefreshCw,
  Building2,
  Phone,
} from "lucide-react";
import type { InventoryItem } from "@/lib/db/schema";
import * as XLSX from "xlsx";

interface LowStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStockUpdated?: () => void;
}

export default function LowStockModal({ isOpen, onClose, onStockUpdated }: LowStockModalProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [recentlyUpdated, setRecentlyUpdated] = useState<Record<number, string>>({});
  const [filterType, setFilterType] = useState<"all" | "out_of_stock" | "critical">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLowStockItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory");
      const data = await res.json();
      if (Array.isArray(data)) {
        const lowItems = data.filter(
          (item: InventoryItem) => item.minimumStock !== null && item.quantity <= item.minimumStock
        );
        // Sort out of stock first, then ascending quantity
        lowItems.sort((a, b) => a.quantity - b.quantity);
        setItems(lowItems);
      }
    } catch (e) {
      console.error("Failed to fetch low stock items:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchLowStockItems();
    }
  }, [isOpen, fetchLowStockItems]);

  if (!isOpen) return null;

  const handleQuickAdd = async (item: InventoryItem, addQty: number) => {
    const newQty = item.quantity + addQty;
    setUpdatingId(item.id);

    try {
      const res = await fetch(`/api/inventory/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });

      if (res.ok) {
        // Update local item
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i))
        );
        setRecentlyUpdated((prev) => ({
          ...prev,
          [item.id]: `+${addQty} added (New: ${newQty} ${item.unit})`,
        }));
        setTimeout(() => {
          setRecentlyUpdated((prev) => {
            const next = { ...prev };
            delete next[item.id];
            return next;
          });
        }, 3500);

        if (onStockUpdated) onStockUpdated();
      } else {
        alert("Failed to update stock quantity.");
      }
    } catch {
      alert("Error updating stock.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportRestockOrder = () => {
    const orderData = items.map((item) => {
      const min = item.minimumStock ?? 5;
      const suggestedOrder = Math.max(min * 2 - item.quantity, 10);
      const estCost = item.costPrice ? (suggestedOrder * Number(item.costPrice)).toFixed(2) : "N/A";

      return {
        "Item Name": item.name,
        Category: item.category,
        "Current Stock": item.quantity,
        Unit: item.unit,
        "Min Threshold": min,
        "Suggested Restock Qty": suggestedOrder,
        "Unit Cost (৳)": item.costPrice ?? "0.00",
        "Est. Restock Total (৳)": estCost,
        Supplier: item.supplier ?? "General Vendor",
        "Batch/Location": [item.batchNumber, item.location].filter(Boolean).join(" / ") || "N/A",
      };
    });

    const ws = XLSX.utils.json_to_sheet(orderData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Restock Order Sheet");
    XLSX.writeFile(wb, `shahporan_restock_order_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const outOfStockCount = items.filter((i) => i.quantity <= 0).length;
  const criticalCount = items.filter(
    (i) => i.quantity > 0 && i.quantity <= Math.max(1, Math.floor((i.minimumStock ?? 5) / 2))
  ).length;

  const filteredItems = items.filter((item) => {
    if (filterType === "out_of_stock" && item.quantity > 0) return false;
    if (
      filterType === "critical" &&
      (item.quantity <= 0 || item.quantity > Math.max(1, Math.floor((item.minimumStock ?? 5) / 2)))
    ) {
      return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.supplier && item.supplier.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col animate-fade-in overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-amber-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600 text-white rounded-xl shadow-md animate-pulse">
              <AlertTriangle size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Interactive Restock Command Center
                </h2>
                <span className="bg-red-600 text-white text-xs font-extrabold px-2 py-0.5 rounded-full">
                  {items.length} Low
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Restock medicines, vaccines &amp; supplies with 1-click quick adjustments.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportRestockOrder}
              disabled={items.length === 0}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-50"
              title="Download Excel Purchase Order"
            >
              <Download size={13} />
              Export Order Sheet (.xlsx)
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === "all"
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              All Low ({items.length})
            </button>
            <button
              onClick={() => setFilterType("out_of_stock")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === "out_of_stock"
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-white border border-red-200 text-red-700 hover:bg-red-50"
              }`}
            >
              🔴 Out of Stock ({outOfStockCount})
            </button>
            <button
              onClick={() => setFilterType("critical")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === "critical"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-white border border-amber-200 text-amber-700 hover:bg-amber-50"
              }`}
            >
              🟠 Critical ({criticalCount})
            </button>
          </div>

          <div className="relative min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search product or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Item Rows */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-gray-100">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 size={32} className="animate-spin mx-auto text-teal-600 mb-2" />
              <p className="text-xs text-gray-500">Checking inventory levels...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center">
              <CheckCircle2 size={44} className="mx-auto text-emerald-500 mb-2" />
              <h3 className="text-base font-bold text-gray-800">Inventory Well Stocked!</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                No items currently match this low stock criteria. All medicines and supplies are at healthy levels.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const isZero = item.quantity <= 0;
                const isCritical =
                  !isZero &&
                  item.quantity <= Math.max(1, Math.floor((item.minimumStock ?? 5) / 2));
                const min = item.minimumStock ?? 5;
                const recentMsg = recentlyUpdated[item.id];
                const isUpdating = updatingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isZero
                        ? "border-red-300 bg-red-50/30"
                        : isCritical
                        ? "border-amber-300 bg-amber-50/20"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Product details */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-base text-gray-900">{item.name}</span>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                            {item.category}
                          </span>
                          {isZero ? (
                            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                              OUT OF STOCK (0)
                            </span>
                          ) : isCritical ? (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                              CRITICALLY LOW
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                              LOW STOCK
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span>
                            Current Stock:{" "}
                            <strong className={isZero ? "text-red-600 font-extrabold text-sm" : "text-gray-900 font-bold"}>
                              {item.quantity} {item.unit}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            Min Alert Threshold: <strong>{min} {item.unit}</strong>
                          </span>
                          {item.supplier && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-gray-600">
                                <Building2 size={12} /> {item.supplier}
                              </span>
                            </>
                          )}
                          {item.costPrice && (
                            <>
                              <span>•</span>
                              <span>Unit Cost: ৳{Number(item.costPrice).toFixed(2)}</span>
                            </>
                          )}
                        </div>

                        {recentMsg && (
                          <div className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-flex items-center gap-1 animate-fade-in">
                            <CheckCircle2 size={13} />
                            {recentMsg}
                          </div>
                        )}
                      </div>

                      {/* Interactive 1-click Quick Restock buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-gray-500 mr-1 hidden sm:inline">
                          Quick Add:
                        </span>

                        {[5, 10, 25, 50].map((qty) => (
                          <button
                            key={qty}
                            disabled={isUpdating}
                            onClick={() => handleQuickAdd(item, qty)}
                            className="inline-flex items-center gap-0.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                            title={`Add +${qty} ${item.unit} to stock immediately`}
                          >
                            <Plus size={12} />
                            {qty}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            💡 Clicking +5, +10, etc. immediately updates inventory database and clears alerts.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors shadow"
          >
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
}
