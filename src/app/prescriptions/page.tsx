"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Plus, UserPlus } from "lucide-react";

type Pet = { id: number; name: string; species: string; ownerName: string; ownerId: number; weight: string | null };
type Prescription = { id: number; petName: string; ownerName: string; medicineName: string; calculatedDoseMg: string; frequency: string; clinicianVerified: boolean };
const emptyPatient = { ownerName: "", phone: "", petName: "", species: "Dog", breed: "", weightKg: "" };

export default function PrescriptionsPage() {
  const [pets, setPets] = useState<Pet[]>([]), [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [saving, setSaving] = useState(false), [newPatientMode, setNewPatientMode] = useState(false), [newPatient, setNewPatient] = useState(emptyPatient);
  const [form, setForm] = useState({ petId: "", medicineName: "", concentration: "", weightKg: "", doseMgPerKg: "", frequency: "", duration: "", instructions: "", sourceName: "", sourceReference: "", clinicianVerified: false });
  const update = (key: string, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const load = async () => { const [ownersRes, prescriptionsRes] = await Promise.all([fetch("/api/owners"), fetch("/api/prescriptions")]); const owners = await ownersRes.json(), saved = await prescriptionsRes.json(); if (Array.isArray(owners)) setPets(owners.flatMap((owner) => (owner.pets || []).map((pet: Pet) => ({ ...pet, ownerId: owner.id, ownerName: owner.name })))); if (Array.isArray(saved)) setPrescriptions(saved); };
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, []);
  const selectedPet = pets.find((pet) => String(pet.id) === form.petId);
  const profileWeight = selectedPet?.weight || "";
  const effectiveWeight = newPatientMode ? newPatient.weightKg : profileWeight;
  const calculated = Number(effectiveWeight) > 0 && Number(form.doseMgPerKg) > 0 ? Number(effectiveWeight) * Number(form.doseMgPerKg) : 0;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      let petId = Number(form.petId);
      if (newPatientMode) {
        const profileResponse = await fetch("/api/owners/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newPatient) });
        const profile = await profileResponse.json();
        if (!profileResponse.ok) throw new Error(profile.error || "Failed to create profile.");
        petId = profile.pet.id;
      }
      const response = await fetch("/api/prescriptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, petId, weightKg: effectiveWeight }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save prescription.");
      setForm({ petId: "", medicineName: "", concentration: "", weightKg: "", doseMgPerKg: "", frequency: "", duration: "", instructions: "", sourceName: "", sourceReference: "", clinicianVerified: false }); setNewPatient(emptyPatient); setNewPatientMode(false); await load();
    } catch (error) { alert(error instanceof Error ? error.message : "Failed to save prescription."); } finally { setSaving(false); }
  };
  return <div className="space-y-5">
    <div><h1 className="text-2xl font-bold text-[#1a2f5e]">E-Prescription</h1><p className="text-sm text-gray-500 mt-1">Record clinician-verified medicine instructions with transparent weight-based calculations.</p></div>
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 flex gap-3"><AlertTriangle className="shrink-0 mt-0.5" size={18}/><span><strong>Clinical safety:</strong> this tool calculates weight × a dose you enter from your authorized veterinary source. It does not replace clinician review.</span></div>
    <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between"><h2 className="font-semibold text-gray-800">Prescription details</h2><button type="button" onClick={() => setNewPatientMode(!newPatientMode)} className="inline-flex items-center gap-1.5 text-sm text-teal-700 border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-50"><UserPlus size={15}/>{newPatientMode ? "Use existing profile" : "Unregistered patient / pet"}</button></div>
      {newPatientMode ? <div className="grid md:grid-cols-3 gap-3">{([["ownerName","Customer name"],["phone","Phone"],["petName","Pet name"],["breed","Breed"],["weightKg","Weight (kg)"]] as const).map(([key,label]) => <label key={key} className="text-xs font-medium text-gray-700">{label}<input required={key !== "breed"} type={key === "weightKg" ? "number" : "text"} value={newPatient[key]} onChange={(e) => setNewPatient({ ...newPatient, [key]: e.target.value })} className="mt-1 w-full border rounded-lg p-2 text-sm"/></label>)}<label className="text-xs font-medium text-gray-700">Species<select value={newPatient.species} onChange={(e) => setNewPatient({ ...newPatient, species: e.target.value })} className="mt-1 w-full border rounded-lg p-2 text-sm"><option>Dog</option><option>Cat</option><option>Bird</option><option>Rabbit</option><option>Other</option></select></label></div> : <label className="text-xs font-medium text-gray-700">Pet<select required value={form.petId} onChange={(e) => update("petId", e.target.value)} className="mt-1 w-full border rounded-lg p-2 text-sm"><option value="">Select pet</option>{pets.map((pet) => <option key={pet.id} value={pet.id}>{pet.name} — {pet.ownerName}</option>)}</select></label>}
      <div className="grid md:grid-cols-3 gap-4">
        <label className="text-xs font-medium text-gray-700">Medicine name<input required value={form.medicineName} onChange={(e) => update("medicineName", e.target.value)} className="mt-1 w-full border rounded-lg p-2 text-sm"/></label>
        <label className="text-xs font-medium text-gray-700">Product concentration<input value={form.concentration} onChange={(e) => update("concentration", e.target.value)} placeholder="e.g. 50 mg/mL" className="mt-1 w-full border rounded-lg p-2 text-sm"/></label>
        {!newPatientMode && <label className="text-xs font-medium text-gray-700">Pet weight from profile (kg)<input required readOnly type="number" value={profileWeight} placeholder="No weight saved in profile" className="mt-1 w-full border rounded-lg p-2 text-sm bg-gray-50"/></label>}
        <label className="text-xs font-medium text-gray-700">Verified dose (mg/kg)<input required type="number" min="0.001" step="0.001" value={form.doseMgPerKg} onChange={(e) => update("doseMgPerKg", e.target.value)} className="mt-1 w-full border rounded-lg p-2 text-sm"/></label>
        <div className="rounded-lg bg-teal-50 p-3 text-sm text-teal-900"><span className="text-xs font-medium">Calculated dose</span><strong className="block text-lg">{calculated ? calculated.toFixed(3) : "—"} mg</strong></div>
        <label className="text-xs font-medium text-gray-700">Frequency<input required value={form.frequency} onChange={(e) => update("frequency", e.target.value)} className="mt-1 w-full border rounded-lg p-2 text-sm"/></label>
        <label className="text-xs font-medium text-gray-700">Duration<input value={form.duration} onChange={(e) => update("duration", e.target.value)} className="mt-1 w-full border rounded-lg p-2 text-sm"/></label>
        <label className="text-xs font-medium text-gray-700">Authorized source name<input required value={form.sourceName} onChange={(e) => update("sourceName", e.target.value)} className="mt-1 w-full border rounded-lg p-2 text-sm"/></label>
      </div>
      <div className="grid md:grid-cols-2 gap-4"><label className="text-xs font-medium text-gray-700">Source reference<input value={form.sourceReference} onChange={(e) => update("sourceReference", e.target.value)} className="mt-1 w-full border rounded-lg p-2 text-sm"/></label><label className="text-xs font-medium text-gray-700">Instructions<textarea value={form.instructions} onChange={(e) => update("instructions", e.target.value)} className="mt-1 w-full border rounded-lg p-2 text-sm" rows={2}/></label></div>
      <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.clinicianVerified} onChange={(e) => update("clinicianVerified", e.target.checked)} required/> I have verified the source, dose, concentration, route, and patient-specific safety.</label>
      <button disabled={saving} className="inline-flex items-center gap-2 bg-[#1a7f7f] text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"><Plus size={16}/>{saving ? <Loader2 className="animate-spin" size={16}/> : "Save prescription"}</button>
    </form>
    <div className="space-y-3">{prescriptions.map((item) => <div key={item.id} className="bg-white border rounded-xl p-4 flex justify-between gap-4"><div><p className="font-semibold text-gray-800">{item.medicineName} — {item.petName}</p><p className="text-sm text-gray-500">{item.ownerName} · {item.calculatedDoseMg} mg · {item.frequency}</p></div>{item.clinicianVerified && <span className="text-xs text-emerald-700 flex items-center gap-1"><CheckCircle2 size={14}/> Verified</span>}</div>)}</div>
  </div>;
}
