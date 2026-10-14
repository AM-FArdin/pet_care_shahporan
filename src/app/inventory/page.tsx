"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Package, AlertTriangle, X, Loader2, Pencil, Trash2, Check, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import type { InventoryItem } from "@/lib/db/schema";

const CATEGORIES = ["Vaccine", "Medicine", "Equipment", "Supplies", "Other"];
const UNITS = ["units", "doses", "tablets", "ml", "mg", "kg", "boxes", "vials"];

const categoryColors: Record<string, string> = {
  Vaccine: "bg-teal-100 text-teal-700",
  Medicine: "bg-blue-100 text-blue-700",
  Equipment: "bg-purple-100 text-purple-700",
  Supplies: "bg-amber-100 text-amber-700",
  Other: "bg-gray-100 text-gray-700",
};

const emptyForm = {
  name: "", category: "Medicine", description: "", quantity: "0", unit: "units",
  minimumStock: "5", costPrice: "", sellingPrice: "", supplier: "",
  expiryDate: "", batchNumber: "", location: "",
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [initLoading, setInitLoading] = useState(false);
  const [initSuccess, setInitSuccess] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [quickEditId, setQuickEditId] = useState<number | null>(null);
  const [quickEditQty, setQuickEditQty] = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory");
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
        setDbError(null);
      } else {
        setItems([]);
        setDbError(data.error || "Unable to connect to the database.");
      }
    } catch {
      setItems([]);
      setDbError("Network or server error while connecting to the database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleInitDb = async () => {
    setInitLoading(true);
    setInitSuccess(null);
    try {
      const res = await fetch("/api/init-db");
      const data = await res.json();
      if (data.success) {
        setInitSuccess("Database tables & initial inventory initialized successfully!");
        setDbError(null);
        fetchItems();
      } else {
        setDbError(data.error || "Failed to initialize database.");
      }
    } catch {
      setDbError("Failed to trigger database initialization.");
    } finally {
      setInitLoading(false);
    }
  };

  const safeItems = Array.isArray(items) ? items : [];

  const filtered = safeItems.filter((item) => {
    const matchQ = query === "" || item.name.toLowerCase().includes(query.toLowerCase()) || item.category.toLowerCase().includes(query.toLowerCase());
    const matchCat = categoryFilter === "All" || item.category === categoryFilter;
    return matchQ && matchCat;
  });

  const lowStock = safeItems.filter((i) => i.minimumStock !== null && i.quantity <= i.minimumStock);
  const expiringSoon = safeItems.filter((i) => {
    if (!i.expiryDate) return false;
    const diff = (new Date(i.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff <= 30 && diff >= 0;
  });

  const openAdd = () => { setEditingItem(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setForm({
      name: item.name, category: item.category, description: item.description || "",
      quantity: String(item.quantity), unit: item.unit,
      minimumStock: String(item.minimumStock ?? 5), costPrice: item.costPrice || "",
      sellingPrice: item.sellingPrice || "", supplier: item.supplier || "",
      expiryDate: item.expiryDate || "", batchNumber: item.batchNumber || "", location: item.location || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        quantity: parseInt(form.quantity) || 0,
        minimumStock: parseInt(form.minimumStock) || 5,
        costPrice: form.costPrice || null,
        sellingPrice: form.sellingPrice || null,
        expiryDate: form.expiryDate || null,
      };
      const url = editingItem ? `/api/inventory/${editingItem.id}` : "/api/inventory";
      const method = editingItem ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) {
        setShowForm(false);
        fetchItems();
      } else {
        alert(data.error || "Failed to save inventory item.");
      }
    } catch {
      alert("Error saving item. Please check database connection.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this item from inventory?")) return;
    await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    fetchItems();
  };

  const handleQuickUpdateQty = async (id: number) => {
    const newQty = parseInt(quickEditQty);
    if (isNaN(newQty) || newQty < 0) return;
    await fetch(`/api/inventory/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: newQty }),
    });
    setQuickEditId(null);
    fetchItems();
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;

  const isExpired = (d: string | null) => d ? new Date(d) < new Date() : false;
  const isExpiringSoon = (d: string | null) => {
    if (!d) return false;
    const diff = (new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff <= 30 && diff >= 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2f5e]">Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track medicines, vaccines, and supplies</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[#1a7f7f] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm">
          <Plus size={16} /> Add Item
        </button>
      </div>

      {/* Database Connection Alert */}
      {dbError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-sm">
              <h3 className="font-semibold text-amber-900">Database Connection Notice</h3>
              <p className="mt-1 text-amber-700 text-xs sm:text-sm">{dbError}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={handleInitDb}
                  disabled={initLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a7f7f] text-white rounded-lg text-xs font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                  {initLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  Auto-Initialize Database Tables
                </button>
                <button
                  onClick={fetchItems}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-amber-300 text-amber-900 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {initSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800 flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{initSuccess}</span>
        </div>
      )}

      {/* Alert badges */}
      {(lowStock.length > 0 || expiringSoon.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {lowStock.length > 0 && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-sm">
              <AlertTriangle size={15} />
              <span><strong>{lowStock.length}</strong> item{lowStock.length !== 1 ? "s" : ""} low on stock</span>
            </div>
          )}
          {expiringSoon.length > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-lg text-sm">
              <AlertTriangle size={15} />
              <span><strong>{expiringSoon.length}</strong> item{expiringSoon.length !== 1 ? "s" : ""} expiring within 30 days</span>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Items", value: safeItems.length, color: "text-[#1a2f5e]" },
          { label: "Low Stock", value: lowStock.length, color: "text-red-500" },
          { label: "Expiring Soon", value: expiringSoon.length, color: "text-amber-500" },
          { label: "Categories", value: CATEGORIES.filter(c => safeItems.some(i => i.category === c)).length, color: "text-teal-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search inventory..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white shadow-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {["All", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                categoryFilter === cat ? "bg-[#1a7f7f] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-teal-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-teal-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14">
            <Package size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm font-medium">No items found</p>
            {dbError && (
              <p className="text-gray-400 text-xs mt-1">Set up your database to view inventory items.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Item</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden sm:table-cell">Category</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Stock</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden md:table-cell">Expiry</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Price</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((item) => {
                  const isLow = item.minimumStock !== null && item.quantity <= item.minimumStock;
                  const expired = isExpired(item.expiryDate);
                  const expiringSoon = isExpiringSoon(item.expiryDate);
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${isLow ? "bg-red-50/30" : ""}`}>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-800">{item.name}</p>
                        {item.supplier && <p className="text-xs text-gray-400">{item.supplier}</p>}
                        {item.location && <p className="text-xs text-gray-400">📍 {item.location}</p>}
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[item.category] || categoryColors.Other}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {quickEditId === item.id ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              value={quickEditQty}
                              onChange={(e) => setQuickEditQty(e.target.value)}
                              className="w-16 border border-teal-400 rounded px-2 py-1 text-xs text-center focus:outline-none"
                              autoFocus
                              onKeyDown={(e) => e.key === "Enter" && handleQuickUpdateQty(item.id)}
                            />
                            <button onClick={() => handleQuickUpdateQty(item.id)} className="text-teal-500 hover:text-teal-700"><Check size={14} /></button>
                            <button onClick={() => setQuickEditId(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setQuickEditId(item.id); setQuickEditQty(String(item.quantity)); }}
                            className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-lg transition-colors ${isLow ? "text-red-600 bg-red-100 hover:bg-red-200" : "text-gray-800 hover:bg-gray-100"}`}
                          >
                            {isLow && <AlertTriangle size={11} />}
                            {item.quantity} {item.unit}
                          </button>
                        )}
                        {item.minimumStock !== null && (
                          <p className="text-xs text-gray-400 mt-0.5">min: {item.minimumStock}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        {item.expiryDate ? (
                          <span className={`text-xs font-medium ${expired ? "text-red-600" : expiringSoon ? "text-amber-600" : "text-gray-600"}`}>
                            {expired ? "⚠️ Expired" : expiringSoon ? "⚠️ " : ""}{formatDate(item.expiryDate)}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.sellingPrice ? (
                          <span className="text-xs font-semibold text-gray-700">৳{item.sellingPrice}</span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(item)} className="text-gray-400 hover:text-teal-600 transition-colors p-1 rounded hover:bg-teal-50">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in my-4">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold text-[#1a2f5e]">{editingItem ? "Edit Item" : "Add Inventory Item"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Item Name *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Rabies Vaccine" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white">
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Quantity *</label>
                  <input required type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Min. Stock Alert</label>
                  <input type="number" min="0" value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cost Price (৳)</label>
                  <input type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} placeholder="optional" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Selling Price (৳)</label>
                  <input type="number" step="0.01" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} placeholder="optional" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Batch Number</label>
                  <input value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} placeholder="optional" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Supplier</label>
                  <input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="optional" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Storage Location</label>
                  <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Fridge, Shelf A" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="optional" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-[#1a7f7f] text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />} {editingItem ? "Update" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
