import Link from "next/link";
import { Clock, MapPin, Truck } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { ContactButtons } from "@/components/admin/contact-buttons";
import { drivers, productIdsForSupplier, suppliers } from "@/lib/contacts-data";

export default function ContactsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminNav />
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Fournisseurs &amp; livreurs</h1>
        <p className="mt-2 text-muted-foreground">
          Tous vos contacts au même endroit, joignables en un geste.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Fournisseurs</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => {
            const count = productIdsForSupplier(s.id).length;
            return (
              <div key={s.id} className="flex flex-col rounded-lg border border-border border-t-[3px] border-t-[#92400e] bg-white p-4">
                <p className="font-semibold">{s.name}</p>
                <p className="text-sm text-muted-foreground">{s.speciality}</p>
                <div className="mt-3 flex-1 space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Contact :</span> {s.contactName}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Tél. :</span> {s.phone}
                  </p>
                  <p className="flex items-start gap-1.5 text-muted-foreground">
                    <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {s.deliveryDays} · délai {s.leadTimeDays} jour{s.leadTimeDays > 1 ? "s" : ""}
                  </p>
                  <p className="flex items-start gap-1.5 text-muted-foreground">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {s.address}
                  </p>
                  <Link
                    href={`/stock?fournisseur=${s.id}`}
                    className="inline-block pt-1 text-sm font-medium text-[#92400e] underline-offset-2 hover:underline"
                  >
                    {count} produit{count > 1 ? "s" : ""} fourni{count > 1 ? "s" : ""} →
                  </Link>
                </div>
                <div className="mt-4">
                  <ContactButtons phone={s.phone} whatsapp={s.whatsapp} email={s.email} subject="Marché Diaspora" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold">Livreurs</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {drivers.map((d) => (
            <div key={d.id} className="flex flex-col rounded-lg border border-border bg-white p-4">
              <p className="font-semibold">{d.name}</p>
              <p className="text-sm text-muted-foreground">{d.company}</p>
              <div className="mt-3 flex-1 space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Tél. :</span> {d.phone}
                </p>
                <p className="flex items-start gap-1.5 text-muted-foreground">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {d.zone}
                </p>
                <p className="flex items-start gap-1.5 text-muted-foreground">
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {d.days}
                </p>
                <p className="flex items-start gap-1.5 text-muted-foreground">
                  <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {d.vehicle}
                </p>
              </div>
              <div className="mt-4">
                <ContactButtons phone={d.phone} whatsapp={d.whatsapp} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-10 text-xs text-muted-foreground">
        Contacts fictifs pour la démonstration (numéros réservés à la fiction par l&apos;ARCEP).
      </p>
    </div>
  );
}
