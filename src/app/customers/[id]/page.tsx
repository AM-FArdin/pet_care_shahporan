"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, use, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Plus,
  Syringe,
  ClipboardList,
  Calendar,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Weight,
  AlertTriangle,
  Printer,
  FileText,
  Pill,
  Stethoscope,
  Eye,
  Activity,
} from "lucide-react";

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
const VACCINES = ["Rabies", "FVRCP", "DHPPL", "Deworming", "FPV", "FCV", "FHV-1", "Other"];
const VISIT_TYPES = [
  "General Consultation",
  "Vaccination",
  "Deworming",
  "Surgery",
  "Emergency",
  "Follow-up",
  "Lab Test",
  "Other",
];
const DOCTORS = ["Dr. Zahidul Islam Munna", "Dr. Ali Md. Mahedi Hasan Nadel"];

export default function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPets, setExpandedPets] = useState<Set<number>>(new Set());
  const [activePetTab, setActivePetTab] = useState<Record<number, "info" | "vax" | "records">>({});

  // Modals
  const [showAddPet, setShowAddPet] = useState(false);
  const [showAddVax, setShowAddVax] = useState<number | null>(null);
  const [showAddRecord, setShowAddRecord] = useState<number | null>(null);
  const [editingVax, setEditingVax] = useState<Vaccination | null>(null);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<{ record: MedicalRecord; pet: Pet } | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingEditVax, setSavingEditVax] = useState(false);
  const [savingEditRecord, setSavingEditRecord] = useState(false);

  // Edit owner modal
  const [showEditOwner, setShowEditOwner] = useState(false);
  const [ownerForm, setOwnerForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [savingOwner, setSavingOwner] = useState(false);

  // Edit pet modal
  const [editingPetId, setEditingPetId] = useState<number | null>(null);
  const [editPetForm, setEditPetForm] = useState({
    name: "",
    species: "Dog",
    breed: "",
    color: "",
    sex: "Male",
    dateOfBirth: "",
    weight: "",
    microchipId: "",
    notes: "",
  });
  const [savingEditPet, setSavingEditPet] = useState(false);

  // Forms
  const [petForm, setPetForm] = useState({
    name: "",
    species: "Dog",
    breed: "",
    color: "",
    sex: "Male",
    dateOfBirth: "",
    weight: "",
    microchipId: "",
    notes: "",
  });

  const [vaxForm, setVaxForm] = useState({
    vaccineName: "Rabies",
    customVaccineName: "",
    dateAdministered: new Date().toISOString().split("T")[0],
    dueDate: "",
    batchNumber: "",
    administeredBy: DOCTORS[0],
    notes: "",
  });

  const [recordForm, setRecordForm] = useState({
    visitDate: new Date().toISOString().split("T")[0],
    visitType: "General Consultation",
    diagnosis: "",
    treatment: "",
    prescription: "",
    weight: "",
    temperature: "",
    nextVisitDate: "",
    attendingDoctor: DOCTORS[0],
    notes: "",
  });
  const reminderSourceType = searchParams.get("sourceType");
  const reminderSourceId = Number(searchParams.get("sourceId"));

  const fetchOwner = useCallback(async (options?: {
    preserveTabs?: boolean;
    keepExpandedPetId?: number;
    selectTab?: "info" | "vax" | "records";
  }) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/owners/${id}`);
      const data = await res.json();
      if (res.ok && data && data.id) {
        setOwner({ ...data, pets: Array.isArray(data.pets) ? data.pets : [] });

        if (options?.keepExpandedPetId) {
          setExpandedPets((prev) => new Set([...prev, options.keepExpandedPetId!]));
          if (options.selectTab) {
            setActivePetTab((prev) => ({
              ...prev,
              [options.keepExpandedPetId!]: options.selectTab!,
            }));
          }
        } else if (!options?.preserveTabs && Array.isArray(data.pets) && data.pets.length > 0) {
          setExpandedPets((prev) => (prev.size === 0 ? new Set([data.pets[0].id]) : prev));
          setActivePetTab((prev) =>
            Object.keys(prev).length === 0 ? { [data.pets[0].id]: "info" } : prev
          );
        }
      } else {
        setOwner(null);
      }
    } catch {
      setOwner(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void fetchOwner(), 0);
    return () => window.clearTimeout(timeout);
  }, [fetchOwner]);

  useEffect(() => {
    if (!owner) return;

    const petId = Number(searchParams.get("petId"));
    if (!Number.isInteger(petId) || !owner.pets.some((pet) => pet.id === petId)) return;

    const sourceType = searchParams.get("sourceType");
    const requestedTab = searchParams.get("tab");
    const tab =
      requestedTab === "vax" || requestedTab === "records" || requestedTab === "info"
        ? requestedTab
        : sourceType === "vaccination"
        ? "vax"
        : sourceType === "medical_record"
        ? "records"
        : "info";

    const sourceId = Number(searchParams.get("sourceId"));
    const targetId =
      Number.isInteger(sourceId) &&
      (sourceType === "vaccination" || sourceType === "medical_record")
        ? `reminder-${sourceType}-${sourceId}`
        : `pet-profile-${petId}`;

    let scrollTimeout: number | undefined;
    const syncTimeout = window.setTimeout(() => {
      setExpandedPets((prev) => new Set([...prev, petId]));
      setActivePetTab((prev) => ({ ...prev, [petId]: tab }));
      scrollTimeout = window.setTimeout(() => {
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
          target.focus({ preventScroll: true });
        }
      }, 150);
    }, 0);

    return () => {
      window.clearTimeout(syncTimeout);
      if (scrollTimeout !== undefined) window.clearTimeout(scrollTimeout);
    };
  }, [owner, searchParams]);

  const togglePet = (petId: number) => {
    setExpandedPets((prev) => {
      const next = new Set(prev);
      if (next.has(petId)) {
        next.delete(petId);
      } else {
        next.add(petId);
      }
      return next;
    });
    setActivePetTab((prev) => ({ ...prev, [petId]: prev[petId] || "info" }));
  };

  // ───── Handler: Add Pet ─────
  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...petForm, ownerId: parseInt(id) }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddPet(false);
        setPetForm({
          name: "",
          species: "Dog",
          breed: "",
          color: "",
          sex: "Male",
          dateOfBirth: "",
          weight: "",
          microchipId: "",
          notes: "",
        });
        await fetchOwner({ keepExpandedPetId: data.id, selectTab: "info" });
      } else {
        alert(data.error || "Failed to add pet.");
      }
    } catch {
      alert("Error adding pet. Please check connection.");
    } finally {
      setSaving(false);
    }
  };

  // ───── Handler: Add Vaccination ─────
  const openAddVax = (petId: number) => {
    setVaxForm({
      vaccineName: "Rabies",
      customVaccineName: "",
      dateAdministered: new Date().toISOString().split("T")[0],
      dueDate: "",
      batchNumber: "",
      administeredBy: DOCTORS[0],
      notes: "",
    });
    setShowAddVax(petId);
  };

  const handleAddVax = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddVax) return;

    const finalVaccineName =
      vaxForm.vaccineName === "Other"
        ? vaxForm.customVaccineName.trim()
        : vaxForm.vaccineName.trim();

    if (!finalVaccineName) {
      alert("Please select or enter a vaccine name.");
      return;
    }
    if (!vaxForm.dateAdministered) {
      alert("Please specify the date administered.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/vaccinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petId: showAddVax,
          vaccineName: finalVaccineName,
          dateAdministered: vaxForm.dateAdministered,
          dueDate: vaxForm.dueDate || null,
          batchNumber: vaxForm.batchNumber || null,
          administeredBy: vaxForm.administeredBy || null,
          notes: vaxForm.notes || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const targetPetId = showAddVax;
        setShowAddVax(null);
        await fetchOwner({ keepExpandedPetId: targetPetId, selectTab: "vax" });
      } else {
        alert(data.error || "Failed to save vaccination.");
      }
    } catch {
      alert("Error adding vaccination. Please check database connection.");
    } finally {
      setSaving(false);
    }
  };

  const openEditVax = (vax: Vaccination) => {
    const isListedVaccine = VACCINES.includes(vax.vaccineName);
    setVaxForm({
      vaccineName: isListedVaccine ? vax.vaccineName : "Other",
      customVaccineName: isListedVaccine ? "" : vax.vaccineName,
      dateAdministered: vax.dateAdministered,
      dueDate: vax.dueDate || "",
      batchNumber: vax.batchNumber || "",
      administeredBy: vax.administeredBy || "",
      notes: vax.notes || "",
    });
    setEditingVax(vax);
  };

  const handleSaveEditVax = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVax) return;

    const vaccineName =
      vaxForm.vaccineName === "Other" ? vaxForm.customVaccineName.trim() : vaxForm.vaccineName.trim();
    if (!vaccineName || !vaxForm.dateAdministered) {
      alert("Please provide the vaccine name and date administered.");
      return;
    }

    setSavingEditVax(true);
    try {
      const res = await fetch(`/api/vaccinations/${editingVax.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vaccineName,
          dateAdministered: vaxForm.dateAdministered,
          dueDate: vaxForm.dueDate || null,
          batchNumber: vaxForm.batchNumber || null,
          administeredBy: vaxForm.administeredBy || null,
          notes: vaxForm.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to update vaccination.");
        return;
      }

      const targetPetId = editingVax.petId;
      setEditingVax(null);
      await fetchOwner({ keepExpandedPetId: targetPetId, selectTab: "vax" });
    } catch {
      alert("Error updating vaccination. Please check connection.");
    } finally {
      setSavingEditVax(false);
    }
  };

  // ───── Handler: Add Medical Record ─────
  const openAddRecord = (petId: number) => {
    setRecordForm({
      visitDate: new Date().toISOString().split("T")[0],
      visitType: "General Consultation",
      diagnosis: "",
      treatment: "",
      prescription: "",
      weight: "",
      temperature: "",
      nextVisitDate: "",
      attendingDoctor: DOCTORS[0],
      notes: "",
    });
    setShowAddRecord(petId);
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddRecord) return;

    if (!recordForm.visitDate) {
      alert("Please enter the visit date.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petId: showAddRecord,
          visitDate: recordForm.visitDate,
          visitType: recordForm.visitType,
          diagnosis: recordForm.diagnosis || null,
          treatment: recordForm.treatment || null,
          prescription: recordForm.prescription || null,
          weight: recordForm.weight || null,
          temperature: recordForm.temperature || null,
          nextVisitDate: recordForm.nextVisitDate || null,
          attendingDoctor: recordForm.attendingDoctor || null,
          notes: recordForm.notes || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const targetPetId = showAddRecord;
        setShowAddRecord(null);
        await fetchOwner({ keepExpandedPetId: targetPetId, selectTab: "records" });
      } else {
        alert(data.error || "Failed to save medical record.");
      }
    } catch {
      alert("Error adding medical record. Please check connection.");
    } finally {
      setSaving(false);
    }
  };

  const openEditRecord = (record: MedicalRecord) => {
    setRecordForm({
      visitDate: record.visitDate,
      visitType: record.visitType,
      diagnosis: record.diagnosis || "",
      treatment: record.treatment || "",
      prescription: record.prescription || "",
      weight: record.weight || "",
      temperature: record.temperature || "",
      nextVisitDate: record.nextVisitDate || "",
      attendingDoctor: record.attendingDoctor || "",
      notes: record.notes || "",
    });
    setEditingRecord(record);
  };

  const handleSaveEditRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord || !recordForm.visitDate || !recordForm.visitType) return;

    setSavingEditRecord(true);
    try {
      const res = await fetch(`/api/medical-records/${editingRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitDate: recordForm.visitDate,
          visitType: recordForm.visitType,
          diagnosis: recordForm.diagnosis || null,
          treatment: recordForm.treatment || null,
          prescription: recordForm.prescription || null,
          weight: recordForm.weight || null,
          temperature: recordForm.temperature || null,
          nextVisitDate: recordForm.nextVisitDate || null,
          attendingDoctor: recordForm.attendingDoctor || null,
          notes: recordForm.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to update clinical record.");
        return;
      }

      const targetPetId = editingRecord.petId;
      setEditingRecord(null);
      await fetchOwner({ keepExpandedPetId: targetPetId, selectTab: "records" });
    } catch {
      alert("Error updating clinical record. Please check connection.");
    } finally {
      setSavingEditRecord(false);
    }
  };

  const deleteVax = async (vaxId: number) => {
    if (!confirm("Are you sure you want to delete this vaccination record?")) return;
    const scrollY = window.scrollY;
    const res = await fetch(`/api/vaccinations/${vaxId}`, { method: "DELETE" });
    if (res.ok) {
      setOwner((current) => current ? {
        ...current,
        pets: current.pets.map((pet) => ({
          ...pet,
          vaccinations: pet.vaccinations?.filter((vax) => vax.id !== vaxId),
        })),
      } : current);
      requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: "auto" }));
    } else {
      alert("Failed to delete vaccination record.");
    }
  };

  const deleteRecord = async (recId: number) => {
    if (!confirm("Are you sure you want to delete this medical visit record?")) return;
    const scrollY = window.scrollY;
    const res = await fetch(`/api/medical-records/${recId}`, { method: "DELETE" });
    if (res.ok) {
      setOwner((current) => current ? {
        ...current,
        pets: current.pets.map((pet) => ({
          ...pet,
          medicalRecords: pet.medicalRecords?.filter((record) => record.id !== recId),
        })),
      } : current);
      requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: "auto" }));
    } else {
      alert("Failed to delete medical record.");
    }
  };

  const openEditOwner = () => {
    if (!owner) return;
    setOwnerForm({
      name: owner.name,
      phone: owner.phone,
      email: owner.email || "",
      address: owner.address || "",
    });
    setShowEditOwner(true);
  };

  const handleSaveOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingOwner(true);
    try {
      const res = await fetch(`/api/owners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ownerForm),
      });
      if (res.ok) {
        setShowEditOwner(false);
        fetchOwner({ preserveTabs: true });
      }
    } finally {
      setSavingOwner(false);
    }
  };

  const openEditPet = (pet: Pet) => {
    setEditingPetId(pet.id);
    setEditPetForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || "",
      color: pet.color || "",
      sex: pet.sex || "Male",
      dateOfBirth: pet.dateOfBirth || "",
      weight: pet.weight || "",
      microchipId: pet.microchipId || "",
      notes: pet.notes || "",
    });
  };

  const handleSaveEditPet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPetId) return;
    setSavingEditPet(true);
    try {
      const res = await fetch(`/api/pets/${editingPetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editPetForm,
          weight: editPetForm.weight || null,
          breed: editPetForm.breed || null,
          color: editPetForm.color || null,
          microchipId: editPetForm.microchipId || null,
          dateOfBirth: editPetForm.dateOfBirth || null,
          notes: editPetForm.notes || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditingPetId(null);
        await fetchOwner({ preserveTabs: true });
      } else {
        alert(data.error || "Failed to update pet.");
      }
    } catch {
      alert("Error updating pet. Please check connection.");
    } finally {
      setSavingEditPet(false);
    }
  };

  const softDeletePet = async (petId: number, petName: string) => {
    if (!confirm(`Mark ${petName} as inactive? They will not appear in the active list.`)) return;
    const scrollY = window.scrollY;
    const res = await fetch(`/api/pets/${petId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setOwner((current) => current ? { ...current, pets: current.pets.filter((pet) => pet.id !== petId) } : current);
      requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: "auto" }));
    } else {
      alert("Failed to delete pet.");
    }
  };

  const formatDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

  const petSpeciesEmoji: Record<string, string> = {
    Dog: "🐕",
    Cat: "🐈",
    Bird: "🐦",
    Cow: "🐄",
    Goat: "🐐",
    Chicken: "🐓",
    Rabbit: "🐇",
    Other: "🐾",
  };

  if (loading && !owner) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Loader2 size={32} className="animate-spin text-teal-500" />
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="text-center py-20 text-gray-500">
        Customer not found.{" "}
        <button onClick={() => router.push("/customers")} className="text-teal-600 underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.push("/customers")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a7f7f] transition-colors"
      >
        <ArrowLeft size={16} /> Back to Customers
      </button>

      {/* Customer Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#1a2f5e] to-[#1a7f7f] p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold border border-white/20">
                {owner.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">{owner.name}</h1>
                <p className="text-teal-100 text-sm mt-0.5">
                  {owner.pets.length} active patient{owner.pets.length !== 1 ? "s" : ""} registered
                </p>
              </div>
            </div>
            <button
              onClick={openEditOwner}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm transition-colors"
            >
              <Pencil size={13} /> Edit Profile
            </button>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm bg-white">
          <div className="flex items-center gap-2 text-gray-700">
            <Phone size={15} className="text-teal-600 flex-shrink-0" />
            <span className="font-semibold">{owner.phone}</span>
          </div>
          {owner.email && (
            <div className="flex items-center gap-2 text-gray-600">
              <Mail size={15} className="text-teal-600 flex-shrink-0" />
              <span className="truncate">{owner.email}</span>
            </div>
          )}
          {owner.address && (
            <div className="flex items-center gap-2 text-gray-600 sm:col-span-1">
              <MapPin size={15} className="text-teal-600 flex-shrink-0" />
              <span className="line-clamp-1">{owner.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Pets & Clinical Records Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#1a2f5e]">Pet Patients</h2>
            <p className="text-xs text-gray-500">Medical histories, vaccinations, and treatment records</p>
          </div>
          <button
            onClick={() => setShowAddPet(true)}
            className="flex items-center gap-1.5 text-sm bg-[#1a7f7f] text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors shadow-sm font-semibold"
          >
            <Plus size={15} /> Add Pet
          </button>
        </div>

        {owner.pets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-14 text-center">
            <p className="text-4xl mb-2">🐾</p>
            <p className="text-gray-700 text-sm font-semibold">No active pets registered yet</p>
            <p className="text-gray-400 text-xs mt-1">Click &quot;Add Pet&quot; to create a pet profile</p>
          </div>
        ) : (
          <div className="space-y-4">
            {owner.pets.map((pet) => {
              const isOpen = expandedPets.has(pet.id);
              const tab = activePetTab[pet.id] || "info";
              const emoji = petSpeciesEmoji[pet.species] || "🐾";

              return (
                <div
                  key={pet.id}
                  id={`pet-profile-${pet.id}`}
                  tabIndex={-1}
                  className="scroll-mt-24 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm transition-all"
                >
                  {/* Pet Header Bar */}
                  <div className="w-full flex items-center justify-between px-5 py-4 bg-gray-50/70 border-b border-gray-100">
                    <button
                      onClick={() => togglePet(pet.id)}
                      className="flex items-center gap-3.5 flex-1 text-left"
                    >
                      <span className="text-3xl p-1.5 bg-white rounded-xl shadow-2xs border border-gray-100">
                        {emoji}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 text-base">{pet.name}</p>
                          {pet.notes && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              ⚠️ Alert / Note
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {pet.species} {pet.breed ? `• ${pet.breed}` : ""} • {pet.sex || "Unknown sex"}{" "}
                          {pet.weight ? `• ${pet.weight} kg` : ""}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-2">
                      <div className="hidden sm:flex gap-2 text-xs">
                        <span className="bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-medium border border-teal-100">
                          💉 {pet.vaccinations.length} vaccines
                        </span>
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium border border-blue-100">
                          📋 {pet.medicalRecords.length} visits
                        </span>
                      </div>
                      <button
                        onClick={() => openEditPet(pet)}
                        className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
                        title="Edit pet"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => softDeletePet(pet.id, pet.name)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
                        title="Deactivate pet"
                      >
                        <Trash2 size={15} />
                      </button>
                      <button
                        onClick={() => togglePet(pet.id)}
                        className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-white rounded-lg transition-colors"
                      >
                        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Pet Content */}
                  {isOpen && (
                    <div className="animate-fade-in">
                      {/* Medical Alert / Chronic Conditions Banner */}
                      {pet.notes && (
                        <div className="m-4 mb-2 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="font-bold uppercase tracking-wider text-amber-950 text-[11px]">
                              Known Medical Complexities &amp; Special Care Notes:
                            </span>
                            <p className="mt-0.5 font-medium leading-relaxed">{pet.notes}</p>
                          </div>
                        </div>
                      )}

                      {/* Navigation Tabs */}
                      <div className="flex border-b border-gray-100 px-4 bg-gray-50/40">
                        {(["info", "vax", "records"] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() =>
                              setActivePetTab((prev) => ({ ...prev, [pet.id]: t }))
                            }
                            className={`py-3 px-4 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                              tab === t
                                ? "border-[#1a7f7f] text-[#1a7f7f] bg-white"
                                : "border-transparent text-gray-500 hover:text-gray-800"
                            }`}
                          >
                            {t === "info" && "General Info"}
                            {t === "vax" && `Vaccinations (${pet.vaccinations.length})`}
                            {t === "records" && `Clinical Case Records (${pet.medicalRecords.length})`}
                          </button>
                        ))}
                      </div>

                      <div className="p-5">
                        {/* ───── TAB 1: General Info ───── */}
                        {tab === "info" && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm bg-gray-50/60 p-4 rounded-xl border border-gray-100">
                              {[
                                { label: "Species", value: pet.species },
                                { label: "Breed", value: pet.breed || "—" },
                                { label: "Color / Markings", value: pet.color || "—" },
                                { label: "Sex", value: pet.sex || "—" },
                                { label: "Date of Birth", value: formatDate(pet.dateOfBirth) },
                                { label: "Weight", value: pet.weight ? `${pet.weight} kg` : "—" },
                                { label: "Microchip #", value: pet.microchipId || "—" },
                                {
                                  label: "Status",
                                  value: "Active Patient",
                                },
                              ].map(({ label, value }) => (
                                <div key={label}>
                                  <p className="text-[11px] text-gray-400 font-semibold uppercase">
                                    {label}
                                  </p>
                                  <p className="text-gray-900 font-medium mt-0.5">{value}</p>
                                </div>
                              ))}
                            </div>

                            {pet.medicalRecords.length > 0 && (
                              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-bold text-blue-900">Latest Clinical Visit: </span>
                                  <span className="text-gray-700">
                                    {formatDate(pet.medicalRecords[pet.medicalRecords.length - 1].visitDate)} •{" "}
                                    {pet.medicalRecords[pet.medicalRecords.length - 1].visitType}
                                    {pet.medicalRecords[pet.medicalRecords.length - 1].diagnosis
                                      ? ` — ${pet.medicalRecords[pet.medicalRecords.length - 1].diagnosis}`
                                      : ""}
                                  </span>
                                </div>
                                <button
                                  onClick={() =>
                                    setActivePetTab((prev) => ({ ...prev, [pet.id]: "records" }))
                                  }
                                  className="text-blue-700 font-bold underline hover:text-blue-900"
                                >
                                  View History
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ───── TAB 2: Vaccinations ───── */}
                        {tab === "vax" && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                Immunization &amp; Deworming Log
                              </p>
                              <button
                                onClick={() => openAddVax(pet.id)}
                                className="flex items-center gap-1.5 text-xs bg-[#1a7f7f] text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-teal-700 transition-colors shadow-xs"
                              >
                                <Plus size={13} /> Add Vaccination
                              </button>
                            </div>

                            {pet.vaccinations.length === 0 ? (
                              <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <Syringe size={28} className="mx-auto text-gray-300 mb-2" />
                                <p className="text-gray-600 text-sm font-semibold">No vaccination history recorded</p>
                                <p className="text-gray-400 text-xs mt-1">
                                  Click &quot;Add Vaccination&quot; to log rabies, FVRCP, or core boosters
                                </p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {pet.vaccinations.map((vax) => {
                                  const isDueOverdue =
                                    vax.dueDate && new Date(vax.dueDate) < new Date();

                                  return (
                                    <div
                                      key={vax.id}
                                      id={`reminder-vaccination-${vax.id}`}
                                      tabIndex={-1}
                                      className={`scroll-mt-24 border rounded-xl p-4 bg-white hover:border-teal-300 transition-all shadow-xs space-y-2.5 ${
                                        reminderSourceType === "vaccination" && reminderSourceId === vax.id
                                          ? "border-teal-500 ring-2 ring-teal-200"
                                          : "border-gray-200"
                                      }`}
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                          <div className="p-1.5 bg-teal-50 rounded-lg text-teal-700 border border-teal-100">
                                            <Syringe size={16} />
                                          </div>
                                          <div>
                                            <p className="font-bold text-gray-900 text-sm">
                                              {vax.vaccineName}
                                            </p>
                                            <p className="text-[11px] text-gray-500">
                                              Given on {formatDate(vax.dateAdministered)}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => openEditVax(vax)}
                                            className="p-1 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 transition-colors"
                                            title="Edit vaccination"
                                          >
                                            <Pencil size={14} />
                                          </button>
                                          <button
                                            onClick={() => deleteVax(vax.id)}
                                            className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                            title="Delete vaccination"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                        <div>
                                          <span className="text-[10px] text-gray-400 font-semibold uppercase block">
                                            Next Due Date
                                          </span>
                                          {vax.dueDate ? (
                                            <span
                                              className={`font-semibold ${
                                                isDueOverdue ? "text-red-600" : "text-emerald-700"
                                              }`}
                                            >
                                              {formatDate(vax.dueDate)} {isDueOverdue ? "(Overdue)" : ""}
                                            </span>
                                          ) : (
                                            <span className="text-gray-400">—</span>
                                          )}
                                        </div>
                                        <div>
                                          <span className="text-[10px] text-gray-400 font-semibold uppercase block">
                                            Batch Number
                                          </span>
                                          <span className="font-mono text-[11px]">
                                            {vax.batchNumber || "—"}
                                          </span>
                                        </div>
                                        <div className="col-span-2">
                                          <span className="text-[10px] text-gray-400 font-semibold uppercase block">
                                            Administering Vet
                                          </span>
                                          <span>{vax.administeredBy || "Dr. Zahidul Islam Munna"}</span>
                                        </div>
                                      </div>

                                      {vax.notes && (
                                        <p className="text-xs text-gray-500 italic bg-gray-50/50 p-2 rounded">
                                          {vax.notes}
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* ───── TAB 3: Medical & Treatment Records ───── */}
                        {tab === "records" && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                  Clinical Consultations &amp; Case History ({pet.medicalRecords.length} visits)
                                </p>
                                <p className="text-[11px] text-gray-400">
                                  Review past treatments, prescribed medicines, and complex clinical notes
                                </p>
                              </div>
                              <button
                                onClick={() => openAddRecord(pet.id)}
                                className="flex items-center gap-1.5 text-xs bg-blue-600 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
                              >
                                <Plus size={13} /> Add Visit Record
                              </button>
                            </div>

                            {pet.medicalRecords.length === 0 ? (
                              <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <Stethoscope size={28} className="mx-auto text-gray-300 mb-2" />
                                <p className="text-gray-600 text-sm font-semibold">No medical records or visits logged yet</p>
                                <p className="text-gray-400 text-xs mt-1">
                                  Click &quot;Add Visit Record&quot; to log diagnosis, procedures, and prescriptions
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-3.5">
                                {pet.medicalRecords
                                  .slice()
                                  .reverse()
                                  .map((record) => {
                                    const visitTypeColors: Record<string, string> = {
                                      "General Consultation": "bg-blue-50 text-blue-700 border-blue-200",
                                      Surgery: "bg-purple-50 text-purple-700 border-purple-200",
                                      Emergency: "bg-rose-50 text-rose-700 border-rose-200",
                                      Vaccination: "bg-emerald-50 text-emerald-700 border-emerald-200",
                                      Deworming: "bg-teal-50 text-teal-700 border-teal-200",
                                      "Follow-up": "bg-amber-50 text-amber-700 border-amber-200",
                                      "Lab Test": "bg-indigo-50 text-indigo-700 border-indigo-200",
                                    };
                                    const badgeColor =
                                      visitTypeColors[record.visitType] ||
                                      "bg-gray-100 text-gray-700 border-gray-200";

                                    return (
                                      <div
                                        key={record.id}
                                        id={`reminder-medical_record-${record.id}`}
                                        tabIndex={-1}
                                        className={`scroll-mt-24 border rounded-xl p-4 bg-white hover:border-blue-300 transition-all shadow-xs space-y-3 ${
                                          reminderSourceType === "medical_record" && reminderSourceId === record.id
                                            ? "border-blue-500 ring-2 ring-blue-200"
                                            : "border-gray-200"
                                        }`}
                                      >
                                        {/* Card Header */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span
                                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColor}`}
                                            >
                                              {record.visitType}
                                            </span>
                                            <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                                              <Calendar size={13} className="text-gray-400" />
                                              {formatDate(record.visitDate)}
                                            </span>
                                            {record.attendingDoctor && (
                                              <span className="text-xs text-gray-500 hidden sm:inline">
                                                • 👨‍⚕️ {record.attendingDoctor}
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                            <button
                                              onClick={() => setViewingRecord({ record, pet })}
                                              className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg font-semibold transition-colors"
                                              title="View Full Case Sheet"
                                            >
                                              <Eye size={13} /> View Case Details
                                            </button>
                                            <button
                                              onClick={() => openEditRecord(record)}
                                              className="p-1 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                              title="Edit clinical record"
                                            >
                                              <Pencil size={14} />
                                            </button>
                                            <button
                                              onClick={() => deleteRecord(record.id)}
                                              className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                              title="Delete Record"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                        </div>

                                        {/* Clinical Content Breakdown */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                          {/* Diagnosis */}
                                          {record.diagnosis && (
                                            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                              <p className="font-bold text-blue-900 flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wide">
                                                <Stethoscope size={13} className="text-blue-600" />
                                                Clinical Findings &amp; Diagnosis
                                              </p>
                                              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed font-medium">
                                                {record.diagnosis}
                                              </p>
                                            </div>
                                          )}

                                          {/* Treatment */}
                                          {record.treatment && (
                                            <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                                              <p className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wide">
                                                <Activity size={13} className="text-emerald-600" />
                                                Treatment &amp; Medical Interventions
                                              </p>
                                              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                                                {record.treatment}
                                              </p>
                                            </div>
                                          )}

                                          {/* Prescription */}
                                          {record.prescription && (
                                            <div className="bg-amber-50/40 p-3 rounded-lg border border-amber-100 md:col-span-2">
                                              <p className="font-bold text-amber-900 flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wide">
                                                <Pill size={13} className="text-amber-600" />
                                                Prescribed Medications &amp; Dosages (Rx)
                                              </p>
                                              <p className="text-gray-800 whitespace-pre-wrap font-mono text-[11px] bg-white/80 p-2.5 rounded-md border border-amber-100 leading-relaxed">
                                                {record.prescription}
                                              </p>
                                            </div>
                                          )}

                                          {/* Complications / Known Special Notes */}
                                          {record.notes && (
                                            <div className="bg-rose-50/50 p-3 rounded-lg border border-rose-100 md:col-span-2">
                                              <p className="font-bold text-rose-900 flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wide">
                                                <AlertTriangle size={13} className="text-rose-600" />
                                                Complications, Warnings &amp; Observations
                                              </p>
                                              <p className="text-rose-950 whitespace-pre-wrap font-medium">
                                                {record.notes}
                                              </p>
                                            </div>
                                          )}
                                        </div>

                                        {/* Vitals and Follow-up */}
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1 border-t border-gray-100">
                                          {record.weight && (
                                            <span className="flex items-center gap-1 font-semibold text-gray-700">
                                              <Weight size={13} className="text-gray-400" /> {record.weight} kg
                                            </span>
                                          )}
                                          {record.temperature && (
                                            <span className="flex items-center gap-1 font-semibold text-gray-700">
                                              🌡️ {record.temperature} °C
                                            </span>
                                          )}
                                          {record.nextVisitDate && (
                                            <span className="flex items-center gap-1 font-bold text-amber-700 ml-auto">
                                              <Calendar size={13} /> Follow-up: {formatDate(record.nextVisitDate)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
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

      {/* ───── Modal: Add Pet ───── */}
      {showAddPet && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in my-4">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold text-[#1a2f5e]">Add New Pet</h2>
              <button
                onClick={() => setShowAddPet(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddPet} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Pet Name *</label>
                  <input
                    required
                    value={petForm.name}
                    onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
                    placeholder="e.g. Buddy"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Species *</label>
                  <select
                    value={petForm.species}
                    onChange={(e) => setPetForm({ ...petForm, species: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                  >
                    {SPECIES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Sex</label>
                  <select
                    value={petForm.sex}
                    onChange={(e) => setPetForm({ ...petForm, sex: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                  >
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Breed</label>
                  <input
                    value={petForm.breed}
                    onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })}
                    placeholder="optional"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Color</label>
                  <input
                    value={petForm.color}
                    onChange={(e) => setPetForm({ ...petForm, color: e.target.value })}
                    placeholder="optional"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={petForm.dateOfBirth}
                    onChange={(e) => setPetForm({ ...petForm, dateOfBirth: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={petForm.weight}
                    onChange={(e) => setPetForm({ ...petForm, weight: e.target.value })}
                    placeholder="optional"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Microchip ID</label>
                  <input
                    value={petForm.microchipId}
                    onChange={(e) => setPetForm({ ...petForm, microchipId: e.target.value })}
                    placeholder="optional"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Known Medical Complexities / Notes
                  </label>
                  <textarea
                    value={petForm.notes}
                    onChange={(e) => setPetForm({ ...petForm, notes: e.target.value })}
                    rows={2}
                    placeholder="e.g. Allergic to penicillin, prone to ear infections..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPet(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#1a7f7f] text-white py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />} Save Pet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───── Modal: Add / Edit Vaccination ───── */}
      {(showAddVax !== null || editingVax !== null) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in my-4">
            <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-[#1a2f5e] to-teal-700 text-white rounded-t-2xl">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Syringe size={18} /> {editingVax ? "Edit Vaccination Record" : "Add Vaccination Record"}
              </h2>
              <button
                onClick={() => (editingVax ? setEditingVax(null) : setShowAddVax(null))}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={editingVax ? handleSaveEditVax : handleAddVax} className="p-5 space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Vaccine Name *</label>
                <select
                  value={vaxForm.vaccineName}
                  onChange={(e) => setVaxForm({ ...vaxForm, vaccineName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                >
                  {VACCINES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                {vaxForm.vaccineName === "Other" && (
                  <input
                    required
                    value={vaxForm.customVaccineName}
                    onChange={(e) => setVaxForm({ ...vaxForm, customVaccineName: e.target.value })}
                    className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                    placeholder="Enter custom vaccine name (e.g. Parvovirus)"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date Administered *</label>
                  <input
                    required
                    type="date"
                    value={vaxForm.dateAdministered}
                    onChange={(e) => setVaxForm({ ...vaxForm, dateAdministered: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Due Date (Next Booster) <span className="font-normal text-gray-400">— optional</span>
                  </label>
                  <input
                    type="date"
                    value={vaxForm.dueDate}
                    onChange={(e) => setVaxForm({ ...vaxForm, dueDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Administered By</label>
                  <select
                    value={vaxForm.administeredBy}
                    onChange={(e) => setVaxForm({ ...vaxForm, administeredBy: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                  >
                    {DOCTORS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Batch Number</label>
                  <input
                    value={vaxForm.batchNumber}
                    onChange={(e) => setVaxForm({ ...vaxForm, batchNumber: e.target.value })}
                    placeholder="e.g. VAX-2026-9"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notes / Reactions</label>
                <textarea
                  value={vaxForm.notes}
                  onChange={(e) => setVaxForm({ ...vaxForm, notes: e.target.value })}
                  placeholder="e.g. Administered sub-Q, no adverse reaction observed"
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => (editingVax ? setEditingVax(null) : setShowAddVax(null))}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    (editingVax ? savingEditVax : saving) ||
                    !vaxForm.dateAdministered ||
                    (vaxForm.vaccineName === "Other" && !vaxForm.customVaccineName.trim())
                  }
                  className="flex-1 bg-[#1a7f7f] text-white py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {(editingVax ? savingEditVax : saving) && <Loader2 size={14} className="animate-spin" />}
                  {editingVax ? "Save Vaccination" : "Save Vaccination"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───── Modal: Add / Edit Clinical Visit Record ───── */}
      {(showAddRecord !== null || editingRecord !== null) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in my-4">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-gradient-to-r from-[#1a2f5e] to-blue-800 text-white rounded-t-2xl">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ClipboardList size={18} /> {editingRecord ? "Edit Clinical Consultation" : "Record Clinical Consultation"}
              </h2>
              <button
                onClick={() => (editingRecord ? setEditingRecord(null) : setShowAddRecord(null))}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={editingRecord ? handleSaveEditRecord : handleAddRecord} className="p-5 space-y-3.5 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Visit Date *</label>
                  <input
                    required
                    type="date"
                    value={recordForm.visitDate}
                    onChange={(e) => setRecordForm({ ...recordForm, visitDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Visit Type *</label>
                  <select
                    value={recordForm.visitType}
                    onChange={(e) => setRecordForm({ ...recordForm, visitType: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  >
                    {VISIT_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Attending Doctor</label>
                <select
                  value={recordForm.attendingDoctor}
                  onChange={(e) =>
                    setRecordForm({ ...recordForm, attendingDoctor: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                >
                  {DOCTORS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Clinical Findings &amp; Diagnosis
                </label>
                <textarea
                  value={recordForm.diagnosis}
                  onChange={(e) => setRecordForm({ ...recordForm, diagnosis: e.target.value })}
                  rows={2}
                  placeholder="Primary complaint, symptoms, clinical findings..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Treatment Provided &amp; Procedures
                </label>
                <textarea
                  value={recordForm.treatment}
                  onChange={(e) => setRecordForm({ ...recordForm, treatment: e.target.value })}
                  rows={2}
                  placeholder="e.g. Wound cleaned and sutured, fluid therapy, IV injection..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Prescription &amp; Home Medications (Rx)
                </label>
                <textarea
                  value={recordForm.prescription}
                  onChange={(e) => setRecordForm({ ...recordForm, prescription: e.target.value })}
                  rows={2}
                  placeholder="e.g. Amoxicillin 250mg - 1 tab BID for 5 days..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={recordForm.weight}
                    onChange={(e) => setRecordForm({ ...recordForm, weight: e.target.value })}
                    placeholder="e.g. 4.2"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={recordForm.temperature}
                    onChange={(e) => setRecordForm({ ...recordForm, temperature: e.target.value })}
                    placeholder="e.g. 38.5"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Next Visit <span className="font-normal text-gray-400">— optional</span>
                  </label>
                  <input
                    type="date"
                    value={recordForm.nextVisitDate}
                    onChange={(e) =>
                      setRecordForm({ ...recordForm, nextVisitDate: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Complications, Warnings &amp; Observations
                </label>
                <textarea
                  value={recordForm.notes}
                  onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                  rows={2}
                  placeholder="e.g. Known drug allergy, post-operative monitoring required..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => (editingRecord ? setEditingRecord(null) : setShowAddRecord(null))}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={(editingRecord ? savingEditRecord : saving) || !recordForm.visitDate}
                  className="flex-1 bg-[#1a2f5e] text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-900 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {(editingRecord ? savingEditRecord : saving) && <Loader2 size={14} className="animate-spin" />}
                  {editingRecord ? "Save Case Record" : "Save Case Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───── Modal: Full Case Details & Clinical Dossier ───── */}
      {viewingRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl my-4 animate-fade-in overflow-hidden">
            {/* Action Bar (hidden when printing) */}
            <div className="flex items-center justify-between p-4 bg-gray-100 border-b print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <FileText size={16} className="text-[#1a7f7f]" /> Veterinary Case History Dossier
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a7f7f] text-white rounded-lg text-xs font-semibold hover:bg-teal-700 transition-colors"
                >
                  <Printer size={14} /> Print Case Sheet
                </button>
                <button
                  onClick={() => setViewingRecord(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Paper Case Sheet */}
            <div id="printable-case-sheet" className="p-6 bg-white text-gray-800 space-y-4 text-xs">
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <Image
                    src="/logo.jpg"
                    alt="Shahporan Vet"
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                  <div>
                    <h2 className="text-base font-bold text-[#1a2f5e]">Shahporan Pet &amp; Vet Care</h2>
                    <p className="text-[11px] text-gray-500">BIDC Point, near Inaya&apos;s Cafe, Shahporan, Sylhet</p>
                    <p className="text-[11px] text-gray-500">📞 01521765716 | Clinical Patient Record</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 bg-teal-100 text-teal-800 rounded font-bold text-xs uppercase">
                    {viewingRecord.record.visitType}
                  </span>
                  <p className="text-gray-500 text-[11px] mt-1">
                    {formatDate(viewingRecord.record.visitDate)}
                  </p>
                </div>
              </div>

              {/* Patient & Owner Info */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <div>
                  <span className="text-gray-400 font-bold uppercase text-[10px]">Patient</span>
                  <p className="font-bold text-gray-900 text-sm">
                    {viewingRecord.pet.name} ({viewingRecord.pet.species})
                  </p>
                  <p className="text-gray-500 text-[11px]">
                    Breed: {viewingRecord.pet.breed || "—"} • Sex: {viewingRecord.pet.sex || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400 font-bold uppercase text-[10px]">Registered Owner</span>
                  <p className="font-bold text-gray-900">{owner.name}</p>
                  <p className="text-gray-500 text-[11px]">📞 {owner.phone}</p>
                </div>
                {viewingRecord.pet.notes && (
                  <div className="col-span-2 bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-900 font-medium text-xs">
                    ⚠️ Known Complexities / Allergies: {viewingRecord.pet.notes}
                  </div>
                )}
              </div>

              {/* Physical Examination & Vitals */}
              {(viewingRecord.record.weight || viewingRecord.record.temperature) && (
                <div className="flex gap-6 p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs">
                  {viewingRecord.record.weight && (
                    <div>
                      <span className="font-semibold text-gray-600">Weight: </span>
                      <span className="font-bold text-blue-900">{viewingRecord.record.weight} kg</span>
                    </div>
                  )}
                  {viewingRecord.record.temperature && (
                    <div>
                      <span className="font-semibold text-gray-600">Body Temp: </span>
                      <span className="font-bold text-blue-900">{viewingRecord.record.temperature} °C</span>
                    </div>
                  )}
                </div>
              )}

              {/* Clinical Findings & Diagnosis */}
              {viewingRecord.record.diagnosis && (
                <div className="space-y-1">
                  <p className="font-bold text-[#1a2f5e] uppercase tracking-wide text-[11px]">
                    Diagnosis &amp; Clinical Findings
                  </p>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-900 whitespace-pre-wrap leading-relaxed font-medium">
                    {viewingRecord.record.diagnosis}
                  </div>
                </div>
              )}

              {/* Treatment */}
              {viewingRecord.record.treatment && (
                <div className="space-y-1">
                  <p className="font-bold text-teal-800 uppercase tracking-wide text-[11px]">
                    Treatment &amp; Medical Interventions Provided
                  </p>
                  <div className="p-3 bg-teal-50/40 rounded-lg border border-teal-100 text-gray-900 whitespace-pre-wrap leading-relaxed">
                    {viewingRecord.record.treatment}
                  </div>
                </div>
              )}

              {/* Prescription */}
              {viewingRecord.record.prescription && (
                <div className="space-y-1">
                  <p className="font-bold text-amber-900 uppercase tracking-wide text-[11px]">
                    Prescription &amp; Medication Regimen (Rx)
                  </p>
                  <div className="p-3 bg-amber-50/30 rounded-lg border border-amber-200 text-gray-900 whitespace-pre-wrap font-mono text-xs">
                    {viewingRecord.record.prescription}
                  </div>
                </div>
              )}

              {/* Complications & Special Warnings */}
              {viewingRecord.record.notes && (
                <div className="space-y-1">
                  <p className="font-bold text-rose-800 uppercase tracking-wide text-[11px]">
                    Special Warnings, Observations &amp; Complications
                  </p>
                  <div className="p-3 bg-rose-50/40 rounded-lg border border-rose-200 text-rose-950 whitespace-pre-wrap font-medium">
                    {viewingRecord.record.notes}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-end justify-between border-t pt-4">
                <div>
                  {viewingRecord.record.nextVisitDate && (
                    <p className="text-amber-700 font-bold">
                      📅 Follow-up Visit: {formatDate(viewingRecord.record.nextVisitDate)}
                    </p>
                  )}
                  <p className="text-gray-400 text-[10px] mt-1">Record #{viewingRecord.record.id}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {viewingRecord.record.attendingDoctor || "Attending Veterinarian"}
                  </p>
                  <p className="text-[10px] text-gray-500">Veterinary Practitioner</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───── Modal: Edit Owner ───── */}
      {showEditOwner && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-[#1a2f5e]">Edit Customer Profile</h2>
              <button
                onClick={() => setShowEditOwner(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveOwner} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                <input
                  required
                  value={ownerForm.name}
                  onChange={(e) => setOwnerForm({ ...ownerForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone *</label>
                <input
                  required
                  value={ownerForm.phone}
                  onChange={(e) => setOwnerForm({ ...ownerForm, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={ownerForm.email}
                  onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Address</label>
                <textarea
                  rows={2}
                  value={ownerForm.address}
                  onChange={(e) => setOwnerForm({ ...ownerForm, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowEditOwner(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingOwner}
                  className="flex-1 bg-[#1a7f7f] text-white py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {savingOwner && <Loader2 size={14} className="animate-spin" />} Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───── Modal: Edit Pet ───── */}
      {editingPetId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-[#1a2f5e]">Edit Pet Profile</h2>
              <button
                onClick={() => setEditingPetId(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEditPet} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Pet Name *</label>
                  <input
                    required
                    value={editPetForm.name}
                    onChange={(e) => setEditPetForm({ ...editPetForm, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Species *</label>
                  <select
                    value={editPetForm.species}
                    onChange={(e) =>
                      setEditPetForm({ ...editPetForm, species: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                  >
                    {SPECIES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Sex</label>
                  <select
                    value={editPetForm.sex}
                    onChange={(e) => setEditPetForm({ ...editPetForm, sex: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                  >
                    <option value="">Unknown</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Breed</label>
                  <input
                    value={editPetForm.breed}
                    onChange={(e) => setEditPetForm({ ...editPetForm, breed: e.target.value })}
                    placeholder="optional"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Color</label>
                  <input
                    value={editPetForm.color}
                    onChange={(e) => setEditPetForm({ ...editPetForm, color: e.target.value })}
                    placeholder="optional"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editPetForm.dateOfBirth}
                    onChange={(e) =>
                      setEditPetForm({ ...editPetForm, dateOfBirth: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editPetForm.weight}
                    onChange={(e) => setEditPetForm({ ...editPetForm, weight: e.target.value })}
                    placeholder="optional"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Microchip ID</label>
                  <input
                    value={editPetForm.microchipId}
                    onChange={(e) => setEditPetForm({ ...editPetForm, microchipId: e.target.value })}
                    placeholder="optional"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Known Medical Complexities / Notes
                  </label>
                  <textarea
                    rows={3}
                    value={editPetForm.notes}
                    onChange={(e) => setEditPetForm({ ...editPetForm, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingPetId(null)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEditPet}
                  className="flex-1 bg-[#1a7f7f] text-white py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {savingEditPet && <Loader2 size={14} className="animate-spin" />} Update Pet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
