"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Calculator, Filter, Loader2, Pencil, Plus, RotateCcw, Search, Trash2, UserRound } from "lucide-react";

type Pet = { id: number; name: string; species: string; ownerName: string; weight: string | null };
type Medicine = { id: number; name: string; medicineClass: string | null; concentration: string | null; doseMgPerKg: string | null; doseUnit: DoseUnit };
type InventoryItem = { id: number; name: string; concentration: string | null; category: string };
type DoseUnit = "mg/kg" | "ml/kg";
type MedicineRow = { id: number; medicineName: string; concentration: string; doseMgPerKg: string; doseUnit: DoseUnit };

const inputClass = "mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500";
const MEDICINE_CLASSES = ["Antibiotic", "Antifungal", "Anti-inflammatory", "Analgesic", "Antiparasitic", "Antiprotozoal", "Antiviral", "Corticosteroid", "Vaccine", "Gastrointestinal", "Cardiovascular", "Sedative / Anesthetic", "Vitamin / Supplement", "Other"];
const newRow = (): MedicineRow => ({ id: Date.now() + Math.random(), medicineName: "", concentration: "", doseMgPerKg: "", doseUnit: "mg/kg" });

function calculateDose(row: MedicineRow, weight: string) {
  const doseRate = Number(row.doseMgPerKg);
  const doseMg = row.doseUnit === "mg/kg" && Number(weight) > 0 && doseRate > 0 ? Number(weight) * doseRate : 0;
  if (row.doseUnit === "ml/kg") {
    return { doseMg, volumeMl: Number(weight) > 0 && doseRate > 0 ? Number(weight) * doseRate : null };
  }
  const concentration = row.concentration.trim().replace(/,/g, ".");
  const strengthMatch = concentration.match(/(\d+(?:\.\d+)?)\s*(mg|mcg)\b/i);
  const liquidMatch = concentration.match(/(?:\/|per|in)\s*(\d+(?:\.\d+)?)?\s*(?:mL|ml|milliliters?)\b/i);
  const numericConcentration = concentration.match(/^\s*(\d+(?:\.\d+)?)\s*$/);
  if (!doseMg || (!strengthMatch && !numericConcentration)) return { doseMg, volumeMl: null as number | null };
  const strength = strengthMatch
    ? Number(strengthMatch[1]) * (strengthMatch[2].toLowerCase() === "mcg" ? 0.001 : 1)
    : Number(numericConcentration?.[1]);
  const denominatorMl = liquidMatch?.[1] ? Number(liquidMatch[1]) : 1;
  const strengthMgPerMl = strength / denominatorMl;
  return { doseMg, volumeMl: strengthMgPerMl > 0 ? doseMg / strengthMgPerMl : null };
}

export default function PrescriptionsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [weightMode, setWeightMode] = useState<"profile" | "manual">("profile");
  const [petId, setPetId] = useState("");
  const [manualWeight, setManualWeight] = useState("");
  const [rows, setRows] = useState<MedicineRow[]>([newRow()]);
  const [query, setQuery] = useState<Record<number, string>>({});
  const [searchOpen, setSearchOpen] = useState<Record<number, boolean>>({});
  const [directoryForm, setDirectoryForm] = useState({ id: 0, inventoryId: "", name: "", medicineClass: "", concentration: "", doseMgPerKg: "", doseUnit: "mg/kg" as DoseUnit });
  const [directoryFormOpen, setDirectoryFormOpen] = useState(false);
  const [directorySaving, setDirectorySaving] = useState(false);
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [directoryClassFilter, setDirectoryClassFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [petsRes, medicinesRes, inventoryRes] = await Promise.all([
        fetch("/api/pets", { cache: "no-store" }),
        fetch("/api/prescription-medicines"),
        fetch("/api/inventory", { cache: "no-store" }),
      ]);
      const [petData, catalog, stock] = await Promise.all([petsRes.json(), medicinesRes.json(), inventoryRes.json()]);
      if (!petsRes.ok) throw new Error(petData.error || "Failed to load pet profiles.");
      if (!medicinesRes.ok) throw new Error(catalog.error || "Failed to load medicine directory.");
      if (!inventoryRes.ok) throw new Error(stock.error || "Failed to load inventory.");
      if (Array.isArray(petData)) setPets(petData);
      if (Array.isArray(catalog)) setMedicines(catalog);
      if (Array.isArray(stock)) setInventory(stock.filter((item: InventoryItem) => ["medicine", "vaccine"].includes(item.category.trim().toLowerCase())));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to load dosage calculator data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const selectedPet = pets.find((pet) => String(pet.id) === petId);
  const weight = weightMode === "manual" ? manualWeight : selectedPet?.weight || "";
  const directoryClasses = Array.from(new Set(medicines.map((medicine) => medicine.medicineClass || "Unclassified"))).sort();
  const filteredDirectoryMedicines = directoryClassFilter === "all"
    ? medicines
    : medicines.filter((medicine) => (medicine.medicineClass || "Unclassified") === directoryClassFilter);
  const updateRow = (id: number, patch: Partial<MedicineRow>) => setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row));
  const matching = (row: MedicineRow) => medicines.filter((medicine) => medicine.name.toLowerCase().includes((query[row.id] || "").toLowerCase())).slice(0, 6);
  const chooseMedicine = (row: MedicineRow, medicine: Medicine) => {
    updateRow(row.id, { medicineName: medicine.name, concentration: medicine.concentration || "", doseMgPerKg: medicine.doseMgPerKg || "", doseUnit: medicine.doseUnit || "mg/kg" });
    setQuery((current) => ({ ...current, [row.id]: medicine.name }));
    setSearchOpen((current) => ({ ...current, [row.id]: false }));
  };

  const saveDirectoryMedicine = async (event: React.FormEvent) => {
    event.preventDefault();
    setDirectorySaving(true);
    try {
      const response = await fetch(directoryForm.id ? `/api/prescription-medicines?id=${directoryForm.id}` : "/api/prescription-medicines", {
        method: directoryForm.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(directoryForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save medicine.");
      setDirectoryForm({ id: 0, inventoryId: "", name: "", medicineClass: "", concentration: "", doseMgPerKg: "", doseUnit: "mg/kg" });
      setDirectoryFormOpen(false);
      await load();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save medicine.");
    } finally {
      setDirectorySaving(false);
    }
  };

  const removeDirectoryMedicine = async (medicine: Medicine) => {
    if (!confirm(`Remove ${medicine.name} from the medicine directory? Inventory will not be changed.`)) return;
    const response = await fetch(`/api/prescription-medicines?id=${medicine.id}`, { method: "DELETE" });
    if (!response.ok) { const data = await response.json(); alert(data.error || "Failed to remove medicine."); return; }
    setMedicines((current) => current.filter((item) => item.id !== medicine.id));
  };

  return <div className="space-y-5">
    <header>
      <h1 className="text-2xl font-bold text-[#1a2f5e]">Dosage calculator</h1>
      <p className="mt-1 text-sm text-gray-500">Calculate the total dose for one or more medicines. No prescription is saved or printed.</p>
    </header>

    <section className="space-y-5 rounded-xl border bg-white p-5">
      <div className="flex items-center gap-2"><Calculator size={20} className="text-teal-700" /><h2 className="font-semibold text-gray-900">Patient weight</h2></div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setWeightMode("profile")} className={`rounded-lg px-3 py-2 text-sm ${weightMode === "profile" ? "bg-teal-700 text-white" : "border text-gray-700"}`}><UserRound className="mr-1 inline" size={15} />Use pet profile</button>
        <button type="button" onClick={() => setWeightMode("manual")} className={`rounded-lg px-3 py-2 text-sm ${weightMode === "manual" ? "bg-teal-700 text-white" : "border text-gray-700"}`}>Enter weight manually</button>
      </div>
      {weightMode === "profile" ? <label className="block max-w-xl text-xs font-medium">Pet profile
        <select value={petId} onChange={(event) => setPetId(event.target.value)} className={inputClass}>
          <option value="">Select a pet</option>
          {pets.map((pet) => <option key={pet.id} value={pet.id}>{pet.name} — {pet.ownerName}{pet.weight ? ` (${pet.weight} kg)` : " (weight missing)"}</option>)}
        </select>
      </label> : <label className="block max-w-xs text-xs font-medium">Weight (kg)
        <input type="number" min="0.001" step="0.01" value={manualWeight} onChange={(event) => setManualWeight(event.target.value)} placeholder="e.g. 12.5" className={inputClass} />
      </label>}
      {weightMode === "profile" && selectedPet && !selectedPet.weight && <p className="text-sm text-amber-700">This pet has no saved weight. Enter the weight manually to calculate.</p>}
      {loading && <p className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="animate-spin" size={15} />Loading profiles and medicine directory...</p>}
    </section>

    <section className="space-y-4 rounded-xl border bg-white p-5">
      <div className="flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-start"><div><h2 className="font-semibold">Medicines to calculate</h2><p className="text-xs text-gray-500">Add as many medicines as needed. Dose is calculated as weight × dose rate.</p></div><button type="button" onClick={() => setRows((current) => [...current, newRow()])} className="inline-flex items-center gap-1 rounded-lg border border-teal-200 px-3 py-2 text-sm text-teal-700"><Plus size={15} />Add medicine</button></div>
      <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle size={18} className="mt-0.5 shrink-0" /><span>For mg/kg, use concentrations such as <b>50 mg/mL</b>, <b>100 mg/tablet</b>, or <b>250 mcg/mL</b>. Select ml/kg when the dose rate is already a volume per kilogram; concentration is not needed.</span></div>
      <div className="space-y-3">
        {rows.map((row, index) => {
          const calculation = calculateDose(row, weight);
          return <div key={row.id} className="rounded-lg border border-gray-200 p-4">
            <div className="mb-3 flex items-center justify-between"><span className="text-sm font-semibold">Medicine {index + 1}</span>{rows.length > 1 && <button type="button" onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))} className="text-red-600" aria-label="Remove medicine"><Trash2 size={16} /></button>}</div>
            <div className={`grid gap-3 ${row.doseUnit === "mg/kg" ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
              <div className="relative"><label className="text-xs font-medium">Medicine</label><div className="relative"><Search size={14} className="absolute left-2.5 top-3.5 text-gray-400" /><input value={query[row.id] ?? row.medicineName} onChange={(event) => { setQuery({ ...query, [row.id]: event.target.value }); setSearchOpen({ ...searchOpen, [row.id]: true }); updateRow(row.id, { medicineName: event.target.value }); }} placeholder="Search medicine directory" className={`${inputClass} pl-8`} /></div>{searchOpen[row.id] && (query[row.id] || "").length > 0 && matching(row).length > 0 && <div className="absolute z-10 mt-1 w-full rounded border bg-white shadow">{matching(row).map((medicine) => <button type="button" key={medicine.id} onClick={() => chooseMedicine(row, medicine)} className="block w-full px-3 py-2 text-left text-sm hover:bg-teal-50">{medicine.name} <span className="text-xs text-gray-500">{medicine.concentration || "no concentration"}</span></button>)}</div>}</div>
              {row.doseUnit === "mg/kg" && <label className="text-xs font-medium">Concentration<input value={row.concentration} onChange={(event) => updateRow(row.id, { concentration: event.target.value })} placeholder="50 mg/mL" className={inputClass} /></label>}
              <label className="text-xs font-medium">Dose rate
                <div className="mt-1 flex">
                  <input type="number" min="0.001" step="0.001" value={row.doseMgPerKg} onChange={(event) => updateRow(row.id, { doseMgPerKg: event.target.value })} placeholder="e.g. 10" className={`${inputClass} mt-0 rounded-r-none`} />
                  <select value={row.doseUnit} onChange={(event) => updateRow(row.id, { doseUnit: event.target.value as DoseUnit })} className="rounded-r-lg border border-l-0 border-gray-300 bg-gray-50 px-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500">
                    <option value="mg/kg">mg/kg</option>
                    <option value="ml/kg">ml/kg</option>
                  </select>
                </div>
              </label>
            </div>
            <div className={`mt-3 grid gap-3 ${row.doseUnit === "mg/kg" ? "sm:grid-cols-2" : ""}`}>{row.doseUnit === "mg/kg" && <div className="rounded-lg bg-teal-50 p-3"><span className="text-xs text-teal-800">Total dose</span><strong className="mt-1 block text-lg text-teal-950">{calculation.doseMg ? `${calculation.doseMg.toFixed(3)} mg` : "—"}</strong></div>}<div className="rounded-lg bg-blue-50 p-3"><span className="text-xs text-blue-800">Total volume</span><strong className="mt-1 block text-lg text-blue-950">{calculation.volumeMl !== null ? `${calculation.volumeMl.toFixed(3)} mL` : "—"}</strong><span className="mt-1 block text-xs text-blue-800">{row.doseUnit === "ml/kg" ? "Calculated as weight × dose rate" : `Based on ${row.concentration || "selected concentration"}`}</span></div></div>
          </div>;
        })}
      </div>
    </section>

    <div className="flex justify-end">
      <button type="button" onClick={() => setDirectoryOpen((current) => !current)} className="rounded-lg border border-teal-200 px-3 py-2 text-sm font-medium text-teal-700">
        {directoryOpen ? "Hide medicine directory" : "Show medicine directory"}
      </button>
    </div>
    {directoryOpen && <section className="space-y-4 rounded-xl border bg-white p-5">
      <div className="flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-start"><div><h2 className="font-semibold">Medicine directory</h2><p className="text-xs text-gray-500">Manage reusable medicines and dose rates. Inventory is not changed here.</p></div><button type="button" onClick={() => { setDirectoryForm({ id: 0, inventoryId: "", name: "", medicineClass: "", concentration: "", doseMgPerKg: "", doseUnit: "mg/kg" }); setDirectoryFormOpen(true); }} className="inline-flex items-center gap-1 rounded-lg bg-[#1a7f7f] px-3 py-2 text-sm text-white"><Plus size={15} />Add medicine</button></div>
      <div className="rounded-xl border-2 border-teal-200 bg-teal-50 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-teal-700 p-2 text-white"><Filter size={17} /></span>
            <div><p className="font-semibold text-teal-950">Filter by medicine class</p><p className="text-xs text-teal-800">{filteredDirectoryMedicines.length} of {medicines.length} medicines shown</p></div>
          </div>
          {directoryClassFilter !== "all" && <button type="button" onClick={() => setDirectoryClassFilter("all")} className="inline-flex items-center gap-1 rounded-lg border border-teal-300 bg-white px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-100"><RotateCcw size={14} />Show all</button>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => setDirectoryClassFilter("all")} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${directoryClassFilter === "all" ? "border-teal-700 bg-teal-700 text-white" : "border-teal-200 bg-white text-teal-800 hover:border-teal-500 hover:bg-teal-100"}`}>All classes <span className="ml-1 opacity-75">({medicines.length})</span></button>
          {directoryClasses.map((medicineClass) => {
            const count = medicines.filter((medicine) => (medicine.medicineClass || "Unclassified") === medicineClass).length;
            return <button type="button" key={medicineClass} onClick={() => setDirectoryClassFilter(medicineClass)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${directoryClassFilter === medicineClass ? "border-teal-700 bg-teal-700 text-white" : "border-teal-200 bg-white text-teal-800 hover:border-teal-500 hover:bg-teal-100"}`}>{medicineClass} <span className="ml-1 opacity-75">({count})</span></button>;
          })}
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-2">{filteredDirectoryMedicines.map((medicine) => <div key={medicine.id} className="flex items-center justify-between rounded-lg border p-3 text-sm"><span><b>{medicine.name}</b><small className="ml-2 text-gray-500"><span className="font-medium text-teal-700">{medicine.medicineClass || "Unclassified"}</span> · {medicine.concentration || "No concentration"} · {medicine.doseMgPerKg ? `${medicine.doseMgPerKg} ${medicine.doseUnit || "mg/kg"}` : "dose rate missing"}</small></span><span className="flex gap-2"><button type="button" onClick={() => { setDirectoryForm({ id: medicine.id, inventoryId: "", name: medicine.name, medicineClass: medicine.medicineClass || "", concentration: medicine.concentration || "", doseMgPerKg: medicine.doseMgPerKg || "", doseUnit: medicine.doseUnit || "mg/kg" }); setDirectoryFormOpen(true); }} className="text-teal-700" aria-label={`Edit ${medicine.name}`}><Pencil size={15} /></button><button type="button" onClick={() => void removeDirectoryMedicine(medicine)} className="text-red-600" aria-label={`Remove ${medicine.name}`}><Trash2 size={15} /></button></span></div>)}</div>
      {filteredDirectoryMedicines.length === 0 && <p className="rounded-lg border border-dashed p-4 text-sm text-gray-500">No medicines found in this class.</p>}
      {directoryFormOpen && <form onSubmit={saveDirectoryMedicine} className="grid gap-3 rounded-lg border border-teal-100 bg-teal-50 p-4 md:grid-cols-4"><label className="text-xs font-medium">Use inventory item<select value={directoryForm.inventoryId} onChange={(event) => { const selected = inventory.find((item) => String(item.id) === event.target.value); setDirectoryForm({ ...directoryForm, inventoryId: event.target.value, name: selected?.name || directoryForm.name, concentration: selected?.concentration || directoryForm.concentration }); }} className={inputClass}><option value="">Manual entry</option>{inventory.map((item) => <option key={item.id} value={item.id}>{item.name}{item.concentration ? ` — ${item.concentration}` : ""}</option>)}</select></label><label className="text-xs font-medium">Medicine name<input required={!directoryForm.inventoryId} value={directoryForm.name} onChange={(event) => setDirectoryForm({ ...directoryForm, inventoryId: "", name: event.target.value })} className={inputClass} /></label><label className="text-xs font-medium">Medicine class<select value={MEDICINE_CLASSES.includes(directoryForm.medicineClass) ? directoryForm.medicineClass : directoryForm.medicineClass ? "custom" : ""} onChange={(event) => setDirectoryForm({ ...directoryForm, medicineClass: event.target.value === "custom" ? "" : event.target.value })} className={inputClass}><option value="">Select a class</option>{MEDICINE_CLASSES.map((medicineClass) => <option key={medicineClass} value={medicineClass}>{medicineClass}</option>)}<option value="custom">Custom class...</option></select>{(!MEDICINE_CLASSES.includes(directoryForm.medicineClass) || directoryForm.medicineClass === "") && <input required value={MEDICINE_CLASSES.includes(directoryForm.medicineClass) ? "" : directoryForm.medicineClass} onChange={(event) => setDirectoryForm({ ...directoryForm, medicineClass: event.target.value })} placeholder="Enter custom class" className={inputClass} />}</label>{directoryForm.doseUnit === "mg/kg" && <label className="text-xs font-medium">Concentration<input value={directoryForm.concentration} onChange={(event) => setDirectoryForm({ ...directoryForm, concentration: event.target.value })} placeholder="50 mg/mL" className={inputClass} /></label>}<label className="text-xs font-medium">Dose rate<div className="mt-1 flex"><input required type="number" min="0.001" step="0.001" value={directoryForm.doseMgPerKg} onChange={(event) => setDirectoryForm({ ...directoryForm, doseMgPerKg: event.target.value })} className={`${inputClass} mt-0 rounded-r-none`} /><select value={directoryForm.doseUnit} onChange={(event) => setDirectoryForm({ ...directoryForm, doseUnit: event.target.value as DoseUnit, concentration: event.target.value === "ml/kg" ? "" : directoryForm.concentration })} className="rounded-r-lg border border-l-0 border-gray-300 bg-gray-50 px-2 text-sm"><option value="mg/kg">mg/kg</option><option value="ml/kg">ml/kg</option></select></div></label><div className="flex gap-2 md:col-span-4"><button type="submit" disabled={directorySaving} className="rounded-lg bg-[#1a7f7f] px-3 py-2 text-sm text-white">{directorySaving ? "Saving..." : directoryForm.id ? "Save changes" : "Add medicine"}</button><button type="button" onClick={() => setDirectoryFormOpen(false)} className="rounded-lg border px-3 py-2 text-sm">Cancel</button></div></form>}
    </section>}
  </div>;
}
