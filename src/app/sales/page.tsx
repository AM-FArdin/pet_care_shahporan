"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Receipt,
  Plus,
  Search,
  Printer,
  Trash2,
  Eye,
  X,
  TrendingUp,
  Calendar,
  AlertCircle,
  Percent,
  ShoppingBag,
  Loader2,
  DollarSign,
  User,
  CreditCard,
  Phone,
} from "lucide-react";
import type { Owner, InventoryItem } from "@/lib/db/schema";

interface SaleItemInput {
  itemType: "product" | "service";
  inventoryId?: number;
  name: string;
  unitPrice: number;
  quantity: number;
}

interface SaleRecord {
  id: number;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string | null;
  petName: string | null;
  subtotal: string;
  discountType: string;
  discountValue: string;
  discountAmount: string;
  totalAmount: string;
  paidAmount: string;
  changeAmount: string;
  paymentMethod: string;
  paymentStatus: string;
  doctorOrStaff: string | null;
  notes: string | null;
  createdAt: string;
}

interface SaleDetails extends SaleRecord {
  items?: Array<{
    id: number;
    name: string;
    unitPrice: string;
    quantity: number;
    totalPrice: string;
    itemType: string;
  }>;
}

const COMMON_SERVICES = [
  { name: "General Consultation Fee", price: 300 },
  { name: "Follow-up Consultation Fee", price: 150 },
  { name: "Vaccination Administration Fee", price: 100 },
  { name: "Deworming Administration Fee", price: 100 },
  { name: "Wound Dressing / Minor Care", price: 250 },
  { name: "Diagnostic Test Fee (Lab)", price: 500 },
  { name: "Surgery / Procedure Fee", price: 1500 },
];

const DOCTORS = ["Dr. Zahidul Islam Munna", "Dr. Ali Md. Mahedi Hasan Nadel"];

export default function SalesPage() {
  const [salesList, setSalesList] = useState<SaleRecord[]>([]);
  const [summary, setSummary] = useState({
    totalRevenue: "0.00",
    totalSalesCount: 0,
    totalDiscounts: "0.00",
    todayRevenue: "0.00",
    monthRevenue: "0.00",
  });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dbError, setDbError] = useState<string | null>(null);

  // Modal states
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [viewSale, setViewSale] = useState<SaleDetails | null>(null);
  const [savingSale, setSavingSale] = useState(false);

  // Available customers and inventory for the new sale form
  const [owners, setOwners] = useState<Owner[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  // New Sale Form State
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [petName, setPetName] = useState("");
  const [saleItemsList, setSaleItemsList] = useState<SaleItemInput[]>([]);
  const [discountType, setDiscountType] = useState<"none" | "percentage" | "fixed">("none");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [doctorOrStaff, setDoctorOrStaff] = useState(DOCTORS[0]);
  const [notes, setNotes] = useState("");

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sales?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (res.ok && data.sales) {
        setSalesList(data.sales);
        setSummary(data.summary);
        setDbError(null);
      } else {
        setDbError(data.error || "Unable to fetch sales.");
        setSalesList([]);
      }
    } catch {
      setDbError("Network or server error loading sales records.");
      setSalesList([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const loadAuxiliaryData = async () => {
    try {
      const [ownersRes, invRes] = await Promise.all([
        fetch("/api/owners"),
        fetch("/api/inventory"),
      ]);
      const ownersData = await ownersRes.json();
      const invData = await invRes.json();
      if (Array.isArray(ownersData)) setOwners(ownersData);
      if (Array.isArray(invData)) setInventoryItems(invData);
    } catch (err) {
      console.warn("Failed to load auxiliary data:", err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchSales(), 300);
    return () => clearTimeout(timer);
  }, [fetchSales]);

  const openNewSale = () => {
    loadAuxiliaryData();
    setSelectedOwnerId("");
    setCustomerName("");
    setCustomerPhone("");
    setPetName("");
    setSaleItemsList([
      { itemType: "service", name: "General Consultation Fee", unitPrice: 300, quantity: 1 },
    ]);
    setDiscountType("none");
    setDiscountValue(0);
    setPaymentMethod("Cash");
    setPaidAmount("");
    setDoctorOrStaff(DOCTORS[0]);
    setNotes("");
    setShowNewSaleModal(true);
  };

  const handleSelectCustomer = (ownerIdStr: string) => {
    setSelectedOwnerId(ownerIdStr);
    if (!ownerIdStr) return;
    const found = owners.find((o) => o.id === parseInt(ownerIdStr));
    if (found) {
      setCustomerName(found.name);
      setCustomerPhone(found.phone);
    }
  };

  const addInventoryProduct = (invIdStr: string) => {
    if (!invIdStr) return;
    const inv = inventoryItems.find((i) => i.id === parseInt(invIdStr));
    if (!inv) return;
    setSaleItemsList((prev) => [
      ...prev,
      {
        itemType: "product",
        inventoryId: inv.id,
        name: inv.name,
        unitPrice: Number(inv.sellingPrice) || 0,
        quantity: 1,
      },
    ]);
  };

  const addService = (serviceName: string) => {
    if (!serviceName) return;
    const s = COMMON_SERVICES.find((cs) => cs.name === serviceName);
    setSaleItemsList((prev) => [
      ...prev,
      {
        itemType: "service",
        name: s ? s.name : serviceName,
        unitPrice: s ? s.price : 0,
        quantity: 1,
      },
    ]);
  };

  const updateItem = (index: number, field: keyof SaleItemInput, value: string | number) => {
    setSaleItemsList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setSaleItemsList((prev) => prev.filter((_, i) => i !== index));
  };

  // Live calculations
  const subtotal = saleItemsList.reduce(
    (acc, it) => acc + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 1),
    0
  );

  let discountAmount = 0;
  if (discountType === "percentage") {
    discountAmount = (subtotal * (Number(discountValue) || 0)) / 100;
  } else if (discountType === "fixed") {
    discountAmount = Number(discountValue) || 0;
  }
  discountAmount = Math.min(discountAmount, subtotal);
  const totalAmount = Math.max(0, subtotal - discountAmount);

  const numPaid = paidAmount === "" ? totalAmount : Number(paidAmount) || 0;
  const changeAmount = Math.max(0, numPaid - totalAmount);

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert("Please enter customer name.");
      return;
    }
    if (saleItemsList.length === 0) {
      alert("Please add at least one item or service to the invoice.");
      return;
    }

    setSavingSale(true);
    try {
      const payload = {
        customerName,
        customerPhone,
        ownerId: selectedOwnerId ? parseInt(selectedOwnerId) : null,
        petName,
        items: saleItemsList,
        discountType,
        discountValue,
        discountAmount,
        totalAmount,
        paidAmount: numPaid,
        changeAmount,
        paymentMethod,
        paymentStatus: numPaid >= totalAmount ? "Paid" : "Due",
        doctorOrStaff,
        notes,
      };

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setShowNewSaleModal(false);
        fetchSales();
        // Immediately open print receipt view for this newly created sale!
        if (data.sale) {
          setViewSale({ ...data.sale, items: data.items });
        }
      } else {
        alert(data.error || "Failed to create invoice.");
      }
    } catch {
      alert("Error creating sale. Please check database connection.");
    } finally {
      setSavingSale(false);
    }
  };

  const handleViewReceipt = async (saleId: number) => {
    try {
      const res = await fetch(`/api/sales/${saleId}`);
      const data = await res.json();
      if (res.ok) {
        setViewSale({ ...data.sale, items: data.items });
      } else {
        alert("Failed to load invoice details.");
      }
    } catch {
      alert("Network error loading invoice.");
    }
  };

  const handleDeleteSale = async (saleId: number, invoiceNumber: string) => {
    if (!confirm(`Are you sure you want to delete invoice ${invoiceNumber}? Inventory quantities will be restored.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/sales/${saleId}`, { method: "DELETE" });
      if (res.ok) {
        fetchSales();
      } else {
        alert("Failed to delete invoice.");
      }
    } catch {
      alert("Error deleting invoice.");
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2f5e]">Sales & Revenue</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Clinic billing, invoice generation, discount calculation, and revenue reports
          </p>
        </div>
        <button
          onClick={openNewSale}
          className="flex items-center justify-center gap-2 bg-[#1a7f7f] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          New Sale / Bill
        </button>
      </div>

      {/* Database Error Banner */}
      {dbError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900">Database Connection Notice</p>
            <p className="mt-0.5 text-xs text-amber-700">{dbError}</p>
          </div>
        </div>
      )}

      {/* Revenue Performance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-[#1a2f5e] to-[#243d78] text-white p-4 sm:p-5 rounded-2xl shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-teal-200 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
            <DollarSign size={18} />
          </div>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight">৳{summary.totalRevenue}</p>
          <p className="text-xs text-teal-200 mt-1">All time earnings</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Today</span>
            <Calendar size={18} />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-800">৳{summary.todayRevenue}</p>
          <p className="text-xs text-gray-400 mt-1">Today&apos;s collections</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">This Month</span>
            <TrendingUp size={18} />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-800">৳{summary.monthRevenue}</p>
          <p className="text-xs text-gray-400 mt-1">Current month total</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-teal-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Invoices</span>
            <Receipt size={18} />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-800">{summary.totalSalesCount}</p>
          <p className="text-xs text-gray-400 mt-1">Total orders billed</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Discounts</span>
            <Percent size={18} />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-amber-600">৳{summary.totalDiscounts}</p>
          <p className="text-xs text-gray-400 mt-1">Total concession given</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by invoice #, customer name, phone, or pet name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white shadow-sm"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Sales History Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={30} className="animate-spin text-teal-600" />
          </div>
        ) : salesList.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 font-medium text-sm">No sales or invoices recorded yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Click &quot;New Sale / Bill&quot; to create your first invoice
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Invoice</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Customer & Pet</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden md:table-cell">Date</th>
                  <th className="text-right py-3.5 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Discount</th>
                  <th className="text-right py-3.5 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Total</th>
                  <th className="text-center py-3.5 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden sm:table-cell">Status</th>
                  <th className="text-center py-3.5 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {salesList.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-gray-800 text-xs font-mono">{sale.invoiceNumber}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{sale.paymentMethod}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-gray-800">{sale.customerName}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        {sale.customerPhone && <span>{sale.customerPhone}</span>}
                        {sale.petName && (
                          <span className="bg-teal-50 text-teal-700 px-1.5 py-0.2 rounded text-[11px] font-medium">
                            🐾 {sale.petName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500 hidden md:table-cell">
                      {formatDate(sale.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {Number(sale.discountAmount) > 0 ? (
                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          -৳{sale.discountAmount}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-gray-900">
                      ৳{sale.totalAmount}
                    </td>
                    <td className="py-3.5 px-4 text-center hidden sm:table-cell">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          sale.paymentStatus === "Paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {sale.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleViewReceipt(sale.id)}
                          title="View / Print Invoice"
                          className="p-1.5 text-gray-500 hover:text-[#1a7f7f] hover:bg-teal-50 rounded-lg transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteSale(sale.id, sale.invoiceNumber)}
                          title="Delete / Cancel Sale"
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ───── Modal: New Sale / Billing ───── */}
      {showNewSaleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-6 animate-fade-in overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-[#1a2f5e] to-[#1a7f7f] text-white">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5" />
                <h2 className="text-lg font-bold">New Sale & Invoice</h2>
              </div>
              <button
                onClick={() => setShowNewSaleModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSale} className="p-5 overflow-y-auto space-y-6 flex-1 text-sm">
              {/* Customer Information */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1a2f5e] mb-3 flex items-center gap-1.5">
                  <User size={14} /> Customer & Patient Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Select Registered Customer</label>
                    <select
                      value={selectedOwnerId}
                      onChange={(e) => handleSelectCustomer(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                    >
                      <option value="">-- Walk-in / Unregistered --</option>
                      {owners.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name} ({o.phone})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Customer Name *</label>
                    <input
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Rahim Ullah"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 01700000000"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Pet / Animal Name</label>
                    <input
                      value={petName}
                      onChange={(e) => setPetName(e.target.value)}
                      placeholder="e.g. Fluffy (Cat) or Deshi Cow #2"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Attending Doctor</label>
                    <select
                      value={doctorOrStaff}
                      onChange={(e) => setDoctorOrStaff(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                    >
                      {DOCTORS.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Items / Services Selector */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1a2f5e] flex items-center gap-1.5">
                    <ShoppingBag size={14} /> Billed Items & Services
                  </h3>
                  <div className="flex gap-2">
                    {/* Add from inventory */}
                    <select
                      onChange={(e) => {
                        addInventoryProduct(e.target.value);
                        e.target.value = "";
                      }}
                      className="text-xs border border-teal-300 bg-teal-50 text-teal-800 rounded-lg px-2.5 py-1.5 font-medium cursor-pointer"
                    >
                      <option value="">+ Add From Inventory...</option>
                      {inventoryItems.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.name} (Stock: {inv.quantity} {inv.unit} | ৳{inv.sellingPrice})
                        </option>
                      ))}
                    </select>

                    {/* Add service */}
                    <select
                      onChange={(e) => {
                        addService(e.target.value);
                        e.target.value = "";
                      }}
                      className="text-xs border border-blue-300 bg-blue-50 text-blue-800 rounded-lg px-2.5 py-1.5 font-medium cursor-pointer"
                    >
                      <option value="">+ Add Clinic Service...</option>
                      {COMMON_SERVICES.map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.name} (৳{s.price})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {saleItemsList.length === 0 ? (
                  <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-400 text-xs">
                    No items added yet. Click &quot;Add From Inventory&quot; or &quot;Add Clinic Service&quot; above.
                  </div>
                ) : (
                  <div className="space-y-2 border border-gray-200 rounded-xl p-3 bg-gray-50/50">
                    {saleItemsList.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-white p-3 rounded-lg border border-gray-200"
                      >
                        <div className="flex-1 w-full sm:w-auto">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateItem(idx, "name", e.target.value)}
                            className="w-full text-xs font-semibold text-gray-800 border-none focus:ring-0 p-0"
                            placeholder="Item or service name"
                          />
                          <span className="text-[10px] text-gray-400 capitalize">
                            Type: {item.itemType} {item.inventoryId ? "(Auto-deducts stock)" : ""}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400">Qty:</span>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(idx, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-14 border border-gray-300 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-teal-400"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400">Price ৳:</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                              className="w-20 border border-gray-300 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-teal-400"
                            />
                          </div>

                          <div className="w-20 text-right font-bold text-xs text-gray-800">
                            ৳{((Number(item.unitPrice) || 0) * (Number(item.quantity) || 1)).toFixed(2)}
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-red-400 hover:text-red-600 p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Discount Calculation Section */}
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-3 flex items-center gap-1.5">
                  <Percent size={14} /> Discount & Concession Calculation
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Discount Type</label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as "none" | "percentage" | "fixed")}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="none">No Discount</option>
                      <option value="percentage">Percentage (%) Concession</option>
                      <option value="fixed">Fixed Amount (৳ Concession)</option>
                    </select>
                  </div>

                  {discountType !== "none" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {discountType === "percentage" ? "Discount Percentage (%)" : "Discount Amount (৳)"}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        max={discountType === "percentage" ? 100 : subtotal}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-1 flex flex-col justify-center">
                    <span className="text-xs text-gray-500">Concession Applied:</span>
                    <span className="text-base font-bold text-amber-700">
                      -৳{discountAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bill Summary & Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1a2f5e] flex items-center gap-1.5">
                    <CreditCard size={14} /> Payment Details
                  </h3>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                    >
                      <option>Cash</option>
                      <option>bKash</option>
                      <option>Nagad</option>
                      <option>Debit / Credit Card</option>
                      <option>Bank Transfer</option>
                      <option>Due / Unpaid</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Amount Given (৳)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder={`৳${totalAmount.toFixed(2)}`}
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Change Return</label>
                      <div className="px-3 py-2 bg-gray-100 rounded-lg font-bold text-sm text-gray-800">
                        ৳{changeAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Notes / Instructions</label>
                    <input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Next follow-up in 7 days"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>
                </div>

                {/* Final Bill Summary Card */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex flex-col justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Invoice Calculation</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal:</span>
                      <span className="font-semibold">৳{subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-amber-600">
                        <span>Discount:</span>
                        <span className="font-semibold">-৳{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between text-base font-extrabold text-[#1a2f5e]">
                      <span>Grand Total:</span>
                      <span className="text-xl text-[#1a7f7f]">৳{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-5">
                    <button
                      type="button"
                      onClick={() => setShowNewSaleModal(false)}
                      className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingSale}
                      className="flex-1 py-2.5 bg-[#1a7f7f] text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow"
                    >
                      {savingSale ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                      Complete &amp; Print
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───── Printable Receipt / Invoice Modal ───── */}
      {viewSale && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4 animate-fade-in overflow-hidden">
            {/* Action Bar (Not printed) */}
            <div className="flex items-center justify-between p-4 bg-gray-100 border-b print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Invoice Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a7f7f] text-white rounded-lg text-xs font-semibold hover:bg-teal-700 transition-colors"
                >
                  <Printer size={14} /> Print Receipt
                </button>
                <button
                  onClick={() => setViewSale(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Receipt Paper */}
            <div id="printable-receipt" className="p-6 bg-white text-gray-800 space-y-4">
              {/* Header with Logo */}
              <div className="flex items-center gap-3 border-b pb-4">
                <Image src="/logo.jpg" alt="Logo" width={56} height={56} className="rounded-full object-cover" />
                <div>
                  <h2 className="text-lg font-bold text-[#1a2f5e]">Shahporan Pet &amp; Vet Care</h2>
                  <p className="text-[11px] text-gray-500">BIDC Point, near Inaya&apos;s Cafe, Shahporan, Sylhet</p>
                  <p className="text-[11px] text-gray-500">📞 01521765716 | Veterinary Healthcare</p>
                </div>
              </div>

              {/* Invoice Meta */}
              <div className="grid grid-cols-2 text-xs border-b pb-3 gap-2">
                <div>
                  <p className="text-gray-400 uppercase text-[10px] font-semibold">Invoice Number</p>
                  <p className="font-mono font-bold text-gray-800">{viewSale.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 uppercase text-[10px] font-semibold">Date &amp; Time</p>
                  <p className="text-gray-700">{formatDate(viewSale.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase text-[10px] font-semibold">Customer</p>
                  <p className="font-semibold text-gray-800">{viewSale.customerName}</p>
                  {viewSale.customerPhone && <p className="text-gray-500">{viewSale.customerPhone}</p>}
                </div>
                <div className="text-right">
                  <p className="text-gray-400 uppercase text-[10px] font-semibold">Patient / Pet</p>
                  <p className="font-semibold text-teal-700">{viewSale.petName ? `🐾 ${viewSale.petName}` : "—"}</p>
                  {viewSale.doctorOrStaff && <p className="text-[10px] text-gray-500">{viewSale.doctorOrStaff}</p>}
                </div>
              </div>

              {/* Items Table */}
              <div className="py-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-gray-500 text-[10px] uppercase font-semibold">
                      <th className="text-left py-1.5">Item / Service</th>
                      <th className="text-center py-1.5">Qty</th>
                      <th className="text-right py-1.5">Price</th>
                      <th className="text-right py-1.5">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {viewSale.items?.map((it, i) => (
                      <tr key={i}>
                        <td className="py-2 text-gray-800 font-medium">{it.name}</td>
                        <td className="py-2 text-center text-gray-600">{it.quantity}</td>
                        <td className="py-2 text-right text-gray-600">৳{it.unitPrice}</td>
                        <td className="py-2 text-right font-semibold text-gray-800">৳{it.totalPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="border-t pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>৳{viewSale.subtotal}</span>
                </div>
                {Number(viewSale.discountAmount) > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Discount / Concession:</span>
                    <span>-৳{viewSale.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-[#1a2f5e] border-t pt-1.5">
                  <span>Total Paid:</span>
                  <span className="text-teal-700 font-black">৳{viewSale.totalAmount}</span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-500 pt-1">
                  <span>Payment Method: {viewSale.paymentMethod}</span>
                  <span className="font-semibold text-emerald-700">{viewSale.paymentStatus}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t pt-3 text-center text-[10px] text-gray-400 space-y-0.5">
                <p>Healthy Animals, Happier Lives</p>
                <p>Thank you for choosing Shahporan Pet &amp; Vet Care!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
