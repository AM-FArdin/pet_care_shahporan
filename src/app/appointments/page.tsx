"use client";
import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Check, Plus, UserPlus } from "lucide-react";

type Pet = { id: number; name: string; ownerName: string; ownerId: number };
type Appointment = { id: number; scheduledAt: string; ownerName: string; petName: string; reason: string | null; status: string };
const initialForm = { ownerId: "", petId: "", scheduledAt: "", reason: "", notes: "" };
const initialNewPatient = { ownerName: "", phone: "", petName: "", species: "Dog", breed: "", weightKg: "" };

export default function AppointmentsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [newPatient, setNewPatient] = useState(initialNewPatient);
  const [newPatientMode, setNewPatientMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [ownersRes, appointmentsRes] = await Promise.all([fetch("/api/owners"), fetch(`/api/appointments?includeCompleted=${showHistory}`)]);
    const owners = await ownersRes.json(), rows = await appointmentsRes.json();
    if (Array.isArray(owners)) setPets(owners.flatMap((owner) => (owner.pets || []).map((pet: Pet) => ({ ...pet, ownerId: owner.id, ownerName: owner.name }))));
    if (Array.isArray(rows)) setAppointments(rows);
  }, [showHistory]);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  const createProfile = async () => {
    const res = await fetch("/api/owners/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newPatient) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create profile.");
    setNewPatientMode(false);
    setNewPatient(initialNewPatient);
    await load();
    return { petId: data.pet.id as number, ownerId: data.owner.id as number };
  };
  const selectedPets = form.ownerId ? pets.filter((pet) => String(pet.ownerId) === form.ownerId) : pets;
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const created = newPatientMode ? await createProfile() : null;
      const petId = created?.petId ?? Number(form.petId);
      const ownerId = created?.ownerId ?? Number(form.ownerId);
      const res = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, ownerId, petId }) });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Failed to save appointment."); }
      setForm(initialForm); await load();
    } catch (error) { alert(error instanceof Error ? error.message : "Failed to save appointment."); } finally { setSaving(false); }
  };
  const updateStatus = async (id: number, status: string) => { await fetch(`/api/appointments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); await load(); };

  return <div className="space-y-5">
    <div><h1 className="text-2xl font-bold text-[#1a2f5e]">Appointments</h1><p className="text-sm text-gray-500 mt-1">Follow active visits; completed appointments are removed from the active list.</p></div>
    <form onSubmit={save} className="bg-white border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between"><h2 className="font-semibold text-gray-800">Schedule appointment</h2><button type="button" onClick={() => setNewPatientMode(!newPatientMode)} className="inline-flex items-center gap-1.5 text-sm text-teal-700 border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-50"><UserPlus size={15}/>{newPatientMode ? "Use existing profile" : "Unregistered patient / pet"}</button></div>
      {newPatientMode ? <div className="grid md:grid-cols-3 gap-3">
        {([["ownerName","Customer name"],["phone","Phone"],["petName","Pet name"],["breed","Breed"],["weightKg","Weight (kg)"]] as const).map(([key,label]) => <label key={key} className="text-xs font-medium text-gray-700">{label}<input required={key !== "breed" && key !== "weightKg"} type={key === "weightKg" ? "number" : "text"} value={newPatient[key]} onChange={(e) => setNewPatient({ ...newPatient, [key]: e.target.value })} className="mt-1 w-full border rounded-lg p-2 text-sm"/></label>)}
        <label className="text-xs font-medium text-gray-700">Species<select value={newPatient.species} onChange={(e) => setNewPatient({ ...newPatient, species: e.target.value })} className="mt-1 w-full border rounded-lg p-2 text-sm"><option>Dog</option><option>Cat</option><option>Bird</option><option>Rabbit</option><option>Other</option></select></label>
      </div> : <div className="grid md:grid-cols-2 gap-3">
        <label className="text-xs font-medium text-gray-700">Customer<select required value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value, petId: "" })} className="mt-1 w-full border rounded-lg p-2 text-sm"><option value="">Select</option>{Array.from(new Map(pets.map((pet) => [pet.ownerId, pet.ownerName])).entries()).map(([id,name]) => <option key={id} value={id}>{name}</option>)}</select></label>
        <label className="text-xs font-medium text-gray-700">Pet<select required value={form.petId} onChange={(e) => setForm({ ...form, petId: e.target.value })} className="mt-1 w-full border rounded-lg p-2 text-sm"><option value="">Select</option>{selectedPets.map((pet) => <option key={pet.id} value={pet.id}>{pet.name}</option>)}</select></label>
      </div>}
      <div className="grid md:grid-cols-3 gap-3">
        <label className="text-xs font-medium text-gray-700">Date & time<input required type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className="mt-1 w-full border rounded-lg p-2 text-sm"/></label>
        <label className="text-xs font-medium text-gray-700">Reason<input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="mt-1 w-full border rounded-lg p-2 text-sm"/></label>
        <button disabled={saving} className="self-end inline-flex justify-center items-center gap-2 bg-[#1a7f7f] text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-60"><Plus size={16}/>Add appointment</button>
      </div>
    </form>
    <div className="flex items-center justify-between"><h2 className="font-semibold text-gray-800">{showHistory ? "Appointment history" : "Active appointments"}</h2><button onClick={() => setShowHistory(!showHistory)} className="text-sm text-teal-700 hover:underline">{showHistory ? "Show active only" : "Show completed history"}</button></div>
    <div className="space-y-3">{appointments.length === 0 && <div className="bg-white border border-dashed rounded-xl p-10 text-center text-gray-400"><CalendarDays className="mx-auto mb-2" size={28}/>No appointments to display.</div>}{appointments.map((item) => <div key={item.id} className="bg-white border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-gray-800">{item.petName} · {item.ownerName}</p><p className="text-sm text-gray-500">{new Date(item.scheduledAt).toLocaleString()} {item.reason ? `· ${item.reason}` : ""}</p></div>{item.status !== "completed" && <button onClick={() => updateStatus(item.id, "completed")} className="inline-flex items-center gap-1 text-sm text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-50"><Check size={15}/>Mark completed</button>}</div>)}</div>
  </div>;
}
