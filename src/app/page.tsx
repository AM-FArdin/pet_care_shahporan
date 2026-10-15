import Image from "next/image";
import Link from "next/link";
import { Users, Package, Phone, MapPin, Clock, Stethoscope, Syringe, Pill, HeartPulse, Scissors, Receipt } from "lucide-react";

const services = [
  { icon: Stethoscope, title: "General Consultation & Health Checkup", color: "text-teal-600" },
  { icon: Syringe, title: "Vaccination (Pets & Livestock)", color: "text-blue-600" },
  { icon: Pill, title: "Deworming (Pets & Livestock)", color: "text-green-600" },
  { icon: HeartPulse, title: "Internal Medicine & Treatment", color: "text-red-500" },
  { icon: Scissors, title: "Surgery (Spay/Neuter & Routine)", color: "text-purple-600" },
  { icon: Package, title: "Diagnostic Services (Lab & On-site)", color: "text-amber-600" },
];

const doctors = [
  {
    name: "Dr. Zahidul Islam Munna",
    qualifications: "DVM (SAU), CT (India)",
    specialization: "MS Fellow in Medicine",
    role: "Veterinary Consultant",
  },
  {
    name: "Dr. Ali Md. Mahedi Hasan Nadel",
    qualifications: "DVM (SAU), CT (India)",
    specialization: "MS Fellow in Epidemiology & Public Health",
    role: "Veterinary Consultant",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1a2f5e] to-[#1a7f7f] rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 text-white shadow-lg">
        <div className="flex-1 space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            Healthy Animals,<br />
            <span className="text-amber-400">Happier Lives</span>
          </h1>
          <p className="text-teal-100 text-base max-w-md">
            Comprehensive veterinary care for pets, livestock & poultry. Your animal&apos;s health is our priority.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/customers"
              className="flex items-center gap-2 bg-white text-[#1a2f5e] px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-teal-50 transition-colors shadow"
            >
              <Users size={16} />
              Customer Records
            </Link>
            <Link
              href="/inventory"
              className="flex items-center gap-2 bg-amber-400 text-[#1a2f5e] px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-amber-300 transition-colors shadow"
            >
              <Package size={16} />
              Inventory
            </Link>
            <Link
              href="/sales"
              className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-emerald-600 transition-colors shadow"
            >
              <Receipt size={16} />
              Sales &amp; Billing
            </Link>
          </div>
        </div>
        <div className="flex-shrink-0">
          <Image
            src="/logo.jpg"
            alt="Shahporan Pet & Vet Care"
            width={180}
            height={180}
            className="rounded-2xl shadow-xl object-cover"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Manage Customers", desc: "Search by name or phone", href: "/customers", icon: Users, color: "bg-blue-50 text-blue-700" },
          { label: "Inventory Check", desc: "Track medicines & vaccines", href: "/inventory", icon: Package, color: "bg-teal-50 text-teal-700" },
          { label: "Billing & Revenue", desc: "New bill & revenue reports", href: "/sales", icon: Receipt, color: "bg-emerald-50 text-emerald-700" },
          { label: "Emergency Line", desc: "01521765716", href: "tel:01521765716", icon: Phone, color: "bg-amber-50 text-amber-700" },
        ].map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all hover:border-teal-300"
          >
            <div className={`inline-flex p-2.5 rounded-lg ${card.color} mb-3`}>
              <card.icon size={20} />
            </div>
            <h3 className="font-semibold text-gray-800 text-sm">{card.label}</h3>
            <p className="text-gray-500 text-xs mt-0.5">{card.desc}</p>
          </Link>
        ))}
      </div>

      {/* Services */}
      <div>
        <h2 className="text-xl font-bold text-[#1a2f5e] mb-5">Our Services</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(({ icon: Icon, title, color }) => (
            <div key={title} className="bg-white rounded-xl p-4 border border-gray-200 flex items-start gap-3 hover:shadow-sm transition-shadow">
              <div className={`mt-0.5 ${color}`}>
                <Icon size={20} />
              </div>
              <p className="text-sm font-medium text-gray-700">{title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Doctors */}
      <div>
        <h2 className="text-xl font-bold text-[#1a2f5e] mb-5">Our Veterinary Team</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {doctors.map((doc) => (
            <div key={doc.name} className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a2f5e] to-[#1a7f7f] flex items-center justify-center text-white font-bold text-sm">
                  {doc.name.split(" ").slice(-1)[0][0]}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">{doc.name}</h3>
                  <p className="text-xs text-teal-600">{doc.role}</p>
                </div>
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <p><span className="font-medium">Qualifications:</span> {doc.qualifications}</p>
                <p><span className="font-medium">Specialization:</span> {doc.specialization}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-[#1a2f5e] rounded-xl p-6 text-white">
        <h2 className="text-lg font-bold mb-4">Contact & Location</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <Phone size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-teal-200 text-xs mb-0.5">Phone</p>
              <p>01521765716</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-teal-200 text-xs mb-0.5">Address</p>
              <p>BIDC Point, near Inaya&apos;s Cafe, Shahporan, Sylhet</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-teal-200 text-xs mb-0.5">Emergency</p>
              <p>24/7 when needed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
