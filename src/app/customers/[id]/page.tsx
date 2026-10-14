"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Phone, Mail, MapPin, Plus, Syringe, ClipboardList, Calendar, Loader2, X, ChevronDown, ChevronUp, Pencil, Trash2, Weight } from "lucide-react";

interface Vaccination {
  id: number;
  petId: number;
  vaccineName: string;
  dateAdministered: string;
  dueDate: string | null;
  batchNumber: string | null;
  administeredBy: string | null;
  notes: string | null;
}

interface MedicalRecord {
  id: number;
  petId: number;
  visitDate: string;
  visitType: string;
  diagnosis: string | null;
  treatment: string | null;
  prescription: string | null;
  weight: string | null;
  temperature: string | null;
  nextVisitDate: string | null;
  attendingDoctor: string | null;
  notes: string | null;
}

interface Pet {
  id: number;
  name: string;
  species: string;
  breed: string | null;
  color: string | null;
  sex: string | null;
  dateOfBirth: string | null;
  weight: string | null;
  microchipId: string | null;
  notes: string | null;
  vaccinations: Vaccination[];
  medicalRecords: MedicalRecord[];
}

interface Owner {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  pets: Pet[];
}

const SPECIES = ["Dog", "Cat", "Bird", "Cow", "Goat", "Chicken", "Rabbit", "Other"];
const VACCINES = ["FVRCP", "Rabies", "DHPPL", "Deworming", "FPV", "FCV", "FHV-1", "Other"];
const VISIT_TYPES = ["General Consultation", "Vaccination", "Deworming", "Surgery", "Emergency", "Follow-up", "Lab Test", "Other"];
const DOCTORS = ["Dr. Zahidul Islam Munna", "Dr. Ali Md. Mahedi Hasan Nadel"];

export default function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPets, setExpandedPets] = useState<Set<number>>(new Set());
  const [activePetTab, setActivePetTab] = useState<Record<number, "info" | "vax" | "records">>({});

  // Modals
  const [showAddPet, setShowAddPet] = useState(false);
  const [showAddVax, setShowAddVax] = useState<number | null>(null);
  const [showAddRecord, setShowAddRecord] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Forms
  const [petForm, setPetForm] = useState({ name: "", species: "Dog", breed: "", color: "", sex: "Male", dateOfBirth: "", weight: "", notes: "" });
  const [vaxForm, setVaxForm] = useState({ vaccineName: "", dateAdministered: "", dueDate: "", batchNumber: "", administeredBy: "", notes: "" });
  const [recordForm, setRecordForm] = useState({
    visitDate: new Date().toISOString().split("T")[0],
    visitType: "General Consultation",
    diagnosis: "", treatment: "", prescription: "",
    weight: "", temperature: "", nextVisitDate: "",
    attendingDoctor: DOCTORS[0], notes: ""
  });

  const fetchOwner = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/owners/${id}`);
      const data = await res.json();
      setOwner(data);
      if (data.pets?.length > 0) {
        setExpandedPets(new Set([data.pets[0].id]));
        setActivePetTab({ [data.pets[0].id]: "info" });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOwner(); }, [id]);

  const togglePet = (petId: number) => {
    setExpandedPets(prev => {
      const next = new Set(prev);
      next.has(petId) ? next.delete(petId) : next.add(petId);
      return next;
    });
    setActivePetTab(prev => ({ ...prev, [petId]: prev[petId] || "info" }));
  };

  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...petForm, ownerId: parseInt(id) }),
      });
      if (res.ok) { setShowAddPet(false); setPetForm({ name: "", species: "Dog", breed: "", color: "", sex: "Male", dateOfBirth: "", weight: "", notes: "" }); fetchOwner(); }
    } finally { setSaving(false); }
  };

  const handleAddVax = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/vaccinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...vaxForm, petId: showAddVax }),
      });
      if (res.ok) { setShowAddVax(null); setVaxForm({ vaccineName: "", dateAdministered: "", dueDate: "", batchNumber: "", administeredBy: "", notes: "" }); fetchOwner(); }
    } finally { setSaving(false); }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...recordForm, petId: showAddRecord }),
      });
      if (res.ok) { setShowAddRecord(null); setRecordForm({ visitDate: new Date().toISOString().split("T")[0], visitType: "General Consultation", diagnosis: "", treatment: "", prescription: "", weight: "", temperature: "", nextVisitDate: "", attendingDoctor: DOCTORS[0], notes: "" }); fetchOwner(); }
    } finally { setSaving(false); }
  };

  const deleteVax = async (vaxId: number) => {
    if (!confirm("Delete this vaccination record?")) return;
    await fetch(`/api/vaccinations/${vaxId}`, { method: "DELETE" });
    fetchOwner();
  };

  const deleteRecord = async (recId: number) => {
    if (!confirm("Delete this medical record?")) return;
    await fetch(`/api/medical-records/${recId}`, { method: "DELETE" });
    fetchOwner();
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const petSpeciesEmoji: Record<string, string> = {
    Dog: "🐕", Cat: "🐈", Bird: "🐦", Cow: "🐄", Goat: "🐐", Chicken: "🐓", Rabbit: "🐇", Other: "🐾",
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-64">
      <Loader2 size={32} className="animate-spin text-teal-500" />
    </div>
  );

  if (!owner) return (
    <div className="text-center py-20 text-gray-500">Customer not found. <button onClick={() => router.push("/customers")} className="text-teal-600 underline">Go back</button></div>
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back button */}
      <button onClick={() => router.push("/customers")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a7f7f] transition-colors">
        <ArrowLeft size={16} /> Back to Customers
      </button>

      {/* Owner Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#1a2f5e] to-[#1a7f7f] p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
              {owner.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{owner.name}</h1>
              <p className="text-teal-200 text-sm">{owner.pets.length} pet{owner.pets.length !== 1 ? "s" : ""} registered</p>
            </div>
          </div>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <Phone size={14} className="text-teal-500 flex-shrink-0" />
            <span>{owner.phone}</span>
          </div>
          {owner.email && (
            <div className="flex items-center gap-2 text-gray-700">
              <Mail size={14} className="text-teal-500 flex-shrink-0" />
              <span className="truncate">{owner.email}</span>
            </div>
          )}
          {owner.address && (
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin size={14} className="text-teal-500 flex-shrink-0" />
              <span className="line-clamp-1">{owner.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Pets Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-[#1a2f5e]">Pets</h2>
          <button
            onClick={() => setShowAddPet(true)}
            className="flex items-center gap-1.5 text-sm bg-[#1a7f7f] text-white px-3.5 py-2 rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus size={14} /> Add Pet
          </button>
        </div>

        {owner.pets.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 py-12 text-center">
            <p className="text-3xl mb-2">🐾</p>
            <p className="text-gray-500 text-sm font-medium">No pets registered yet</p>
            <p className="text-gray-400 text-xs mt-1">Click &quot;Add Pet&quot; to register a new pet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {owner.pets.map((pet) => {
              const isOpen = expandedPets.has(pet.id);
              const tab = activePetTab[pet.id] || "info";
              const emoji = petSpeciesEmoji[pet.species] || "🐾";
              return (
                <div key={pet.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  {/* Pet header */}
                  <button
                    onClick={() => togglePet(pet.id)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{emoji}</span>
                      <div className="text-left">
                        <p className="font-semibold text-gray-800">{pet.name}</p>
                        <p className="text-xs text-gray-500">{pet.species}{pet.breed ? ` · ${pet.breed}` : ""} · {pet.sex || "Unknown sex"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-2 text-xs">
                        <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{pet.vaccinations.length} vaccines</span>
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{pet.medicalRecords.length} visits</span>
                      </div>
                      {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                    </div>
                  </button>

                  {/* Pet content */}
                  {isOpen && (
                    <div className="border-t border-gray-100 animate-fade-in">
                      {/* Tabs */}
                      <div className="flex border-b border-gray-100">
                        {(["info", "vax", "records"] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setActivePetTab(prev => ({ ...prev, [pet.id]: t }))}
                            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                              tab === t ? "border-b-2 border-teal-500 text-teal-700 bg-teal-50" : "text-gray-500 hover:text-gray-700"
                            }`}
                          >
                            {t === "info" ? "Pet Info" : t === "vax" ? `Vaccinations (${pet.vaccinations.length})` : `Medical Records (${pet.medicalRecords.length})`}
                          </button>
                        ))}
                      </div>

                      <div className="p-5">
                        {/* Info Tab */}
                        {tab === "info" && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                            {[
                              { label: "Species", value: pet.species },
                              { label: "Breed", value: pet.breed || "—" },
                              { label: "Color", value: pet.color || "—" },
                              { label: "Sex", value: pet.sex || "—" },
                              { label: "Date of Birth", value: formatDate(pet.dateOfBirth) },
                              { label: "Weight", value: pet.weight ? `${pet.weight} kg` : "—" },
                              { label: "Microchip ID", value: pet.microchipId || "—" },
                            ].map(({ label, value }) => (
                              <div key={label}>
                                <p className="text-xs text-gray-400 font-medium">{label}</p>
                                <p className="text-gray-800 mt-0.5">{value}</p>
                              </div>
                            ))}
                            {pet.notes && (
                              <div className="col-span-2 sm:col-span-3">
                                <p className="text-xs text-gray-400 font-medium">Notes</p>
                                <p className="text-gray-800 mt-0.5 text-sm">{pet.notes}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Vaccination Tab */}
                        {tab === "vax" && (
                          <div className="space-y-3">
                            <button
                              onClick={() => setShowAddVax(pet.id)}
                              className="flex items-center gap-1.5 text-xs text-teal-700 font-medium border border-teal-300 px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-colors"
                            >
                              <Plus size={12} /> Add Vaccination
                            </button>
                            {pet.vaccinations.length === 0 ? (
                              <p className="text-center text-gray-400 text-sm py-6">No vaccinations recorded yet</p>
                            ) : (
                              pet.vaccinations.map((vax) => (
                                <div key={vax.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Syringe size={14} className="text-teal-500" />
                                      <p className="font-semibold text-gray-800 text-sm">{vax.vaccineName}</p>
                                    </div>
                                    <button onClick={() => deleteVax(vax.id)} className="text-red-400 hover:text-red-600 p-1">
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                    <div><span className="font-medium">Given:</span> {formatDate(vax.dateAdministered)}</div>
                                    {vax.dueDate && <div><span className="font-medium">Due:</span> <span className={new Date(vax.dueDate) < new Date() ? "text-red-500 font-medium" : "text-green-600 font-medium"}>{formatDate(vax.dueDate)}</span></div>}
                                    {vax.administeredBy && <div><span className="font-medium">By:</span> {vax.administeredBy}</div>}
                                    {vax.batchNumber && <div><span className="font-medium">Batch:</span> {vax.batchNumber}</div>}
                                  </div>
                                  {vax.notes && <p className="text-xs text-gray-500 mt-2">{vax.notes}</p>}
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {/* Medical Records Tab */}
                        {tab === "records" && (
                          <div className="space-y-3">
                            <button
                              onClick={() => setShowAddRecord(pet.id)}
                              className="flex items-center gap-1.5 text-xs text-blue-700 font-medium border border-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              <Plus size={12} /> Add Visit Record
                            </button>
                            {pet.medicalRecords.length === 0 ? (
                              <p className="text-center text-gray-400 text-sm py-6">No medical records yet</p>
                            ) : (
                              pet.medicalRecords.slice().reverse().map((record) => (
                                <div key={record.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <ClipboardList size={14} className="text-blue-500" />
                                        <p className="font-semibold text-gray-800 text-sm">{record.visitType}</p>
                                        <span className="text-xs text-gray-400">{formatDate(record.visitDate)}</span>
                                      </div>
                                    </div>
                                    <button onClick={() => deleteRecord(record.id)} className="text-red-400 hover:text-red-600 p-1">
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                  <div className="space-y-1.5 text-xs text-gray-600">
                                    {record.diagnosis && <div><span className="font-medium">Diagnosis:</span> {record.diagnosis}</div>}
                                    {record.treatment && <div><span className="font-medium">Treatment:</span> {record.treatment}</div>}
                                    {record.prescription && <div><span className="font-medium">Prescription:</span> {record.prescription}</div>}
                                    <div className="flex gap-4">
                                      {record.weight && <div><Weight size={11} className="inline mr-1 text-gray-400" />{record.weight} kg</div>}
                                      {record.temperature && <div>🌡️ {record.temperature}°C</div>}
                                    </div>
                                    {record.attendingDoctor && <div><span className="font-medium">Doctor:</span> {record.attendingDoctor}</div>}
                                    {record.nextVisitDate && (
                                      <div className="flex items-center gap-1 text-amber-600">
                                        <Calendar size={11} />
                                        <span>Next visit: {formatDate(record.nextVisitDate)}</span>
                                      </div>
                                    )}
                                    {record.notes && <p className="text-gray-500 italic">{record.notes}</p>}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ───── Add Pet Modal ───── */}
      {showAddPet && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in my-4">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold text-[#1a2f5e]">Add New Pet</h2>
              <button onClick={() => setShowAddPet(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddPet} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Pet Name *</label>
                  <input required value={petForm.name} onChange={(e) => setPetForm({ ...petForm, name: e.target.value })} placeholder="e.g. Buddy" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Species *</label>
                  <select value={petForm.species} onChange={(e) => setPetForm({ ...petForm, species: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white">
                    {SPECIES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sex</label>
                  <select value={petForm.sex} onChange={(e) => setPetForm({ ...petForm, sex: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white">
                    <option>Male</option><option>Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Breed</label>
                  <input value={petForm.breed} onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })} placeholder="optional" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                  <input value={petForm.color} onChange={(e) => setPetForm({ ...petForm, color: e.target.value })} placeholder="optional" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input type="date" value={petForm.dateOfBirth} onChange={(e) => setPetForm({ ...petForm, dateOfBirth: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input type="number" step="0.01" value={petForm.weight} onChange={(e) => setPetForm({ ...petForm, weight: e.target.value })} placeholder="optional" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={petForm.notes} onChange={(e) => setPetForm({ ...petForm, notes: e.target.value })} rows={2} placeholder="Any special notes..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddPet(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-[#1a7f7f] text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />} Save Pet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───── Add Vaccination Modal ───── */}
      {showAddVax !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in my-4">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-[#1a2f5e]">Add Vaccination</h2>
              <button onClick={() => setShowAddVax(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddVax} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Vaccine Name *</label>
                <select value={vaxForm.vaccineName} onChange={(e) => setVaxForm({ ...vaxForm, vaccineName: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white">
                  <option value="">Select vaccine...</option>
                  {VACCINES.map(v => <option key={v}>{v}</option>)}
                </select>
                {vaxForm.vaccineName === "Other" && (
                  <input className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="Enter vaccine name" onChange={(e) => setVaxForm({ ...vaxForm, vaccineName: e.target.value })} />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date Administered *</label>
                  <input required type="date" value={vaxForm.dateAdministered} onChange={(e) => setVaxForm({ ...vaxForm, dateAdministered: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Due Date (Next)</label>
                  <input type="date" value={vaxForm.dueDate} onChange={(e) => setVaxForm({ ...vaxForm, dueDate: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Administered By</label>
                  <select value={vaxForm.administeredBy} onChange={(e) => setVaxForm({ ...vaxForm, administeredBy: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white">
                    <option value="">Select doctor</option>
                    {DOCTORS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Batch Number</label>
                  <input value={vaxForm.batchNumber} onChange={(e) => setVaxForm({ ...vaxForm, batchNumber: e.target.value })} placeholder="optional" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={vaxForm.notes} onChange={(e) => setVaxForm({ ...vaxForm, notes: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddVax(null)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving || !vaxForm.vaccineName || !vaxForm.dateAdministered} className="flex-1 bg-[#1a7f7f] text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───── Add Medical Record Modal ───── */}
      {showAddRecord !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in my-4">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold text-[#1a2f5e]">Add Visit Record</h2>
              <button onClick={() => setShowAddRecord(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddRecord} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Visit Date *</label>
                  <input required type="date" value={recordForm.visitDate} onChange={(e) => setRecordForm({ ...recordForm, visitDate: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Visit Type *</label>
                  <select value={recordForm.visitType} onChange={(e) => setRecordForm({ ...recordForm, visitType: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white">
                    {VISIT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Attending Doctor</label>
                <select value={recordForm.attendingDoctor} onChange={(e) => setRecordForm({ ...recordForm, attendingDoctor: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white">
                  {DOCTORS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Diagnosis</label>
                <textarea value={recordForm.diagnosis} onChange={(e) => setRecordForm({ ...recordForm, diagnosis: e.target.value })} rows={2} placeholder="Clinical findings..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Treatment</label>
                <textarea value={recordForm.treatment} onChange={(e) => setRecordForm({ ...recordForm, treatment: e.target.value })} rows={2} placeholder="Treatment given..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Prescription</label>
                <textarea value={recordForm.prescription} onChange={(e) => setRecordForm({ ...recordForm, prescription: e.target.value })} rows={2} placeholder="Medications prescribed..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input type="number" step="0.01" value={recordForm.weight} onChange={(e) => setRecordForm({ ...recordForm, weight: e.target.value })} placeholder="optional" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Temp (°C)</label>
                  <input type="number" step="0.1" value={recordForm.temperature} onChange={(e) => setRecordForm({ ...recordForm, temperature: e.target.value })} placeholder="optional" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Next Visit</label>
                  <input type="date" value={recordForm.nextVisitDate} onChange={(e) => setRecordForm({ ...recordForm, nextVisitDate: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={recordForm.notes} onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddRecord(null)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-[#1a2f5e] text-white py-2 rounded-lg text-sm font-medium hover:bg-navy-900 disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />} Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
