import type { Driver, Supplier } from "./types";

// Fictional demo contacts. Phone numbers use ARCEP ranges reserved for
// fiction (01 99 00 xx xx / 06 39 98 xx xx) so nobody real is reachable.

export const suppliers: Supplier[] = [
  {
    id: "sup-afro",
    name: "Grossiste produits africains",
    contactName: "Moussa Traoré",
    phone: "01 99 00 12 40",
    whatsapp: "33639981240",
    email: "commandes@grossiste-africain.example",
    address: "MIN de Rungis, Bât. D4, 94150 Rungis",
    deliveryDays: "Mardi et vendredi",
    leadTimeDays: 2,
    speciality: "Farines, riz, huiles et conserves d'Afrique de l'Ouest",
  },
  {
    id: "sup-antilles",
    name: "Importateur antillais",
    contactName: "Josiane Bellance",
    phone: "01 99 00 23 51",
    whatsapp: "33639982351",
    email: "pro@import-antilles.example",
    address: "12 rue des Docks, 93200 Saint-Denis",
    deliveryDays: "Jeudi",
    leadTimeDays: 4,
    speciality: "Produits des Caraïbes : coco, épices, boissons",
  },
  {
    id: "sup-epices",
    name: "Maison des Épices",
    contactName: "Karim Benali",
    phone: "01 99 00 34 62",
    whatsapp: "33639983462",
    email: "contact@maison-epices.example",
    address: "48 rue de la Chapelle, 75018 Paris",
    deliveryDays: "Lundi, mercredi, vendredi",
    leadTimeDays: 1,
    speciality: "Épices, assaisonnements, poissons séchés",
  },
  {
    id: "sup-boissons",
    name: "Distri-Boissons Île-de-France",
    contactName: "Sébastien Morel",
    phone: "01 99 00 45 73",
    whatsapp: "33639984573",
    email: "commandes@distri-boissons.example",
    address: "ZI des Bas-Pays, 95100 Argenteuil",
    deliveryDays: "Mercredi",
    leadTimeDays: 3,
    speciality: "Maltés, sodas, thés et boissons chaudes",
  },
  {
    id: "sup-cash",
    name: "Cash & Carry Bobigny",
    contactName: "Nadia Ferreira",
    phone: "01 99 00 56 84",
    whatsapp: "33639985684",
    email: "pro@cashcarry-bobigny.example",
    address: "3 avenue Henri Barbusse, 93000 Bobigny",
    deliveryDays: "Retrait sur place ou livraison samedi",
    leadTimeDays: 2,
    speciality: "Conserves, hygiène et produits ménagers",
  },
];

export const drivers: Driver[] = [
  {
    id: "drv-ibrahima",
    name: "Ibrahima Sow",
    company: "Grossiste produits africains",
    phone: "06 39 98 10 21",
    whatsapp: "33639981021",
    zone: "Rungis → Paris Nord",
    days: "Mardi et vendredi, 7h–10h",
    vehicle: "Camion 12 m³",
  },
  {
    id: "drv-lucas",
    name: "Lucas Henry",
    company: "Importateur antillais",
    phone: "06 39 98 20 32",
    whatsapp: "33639982032",
    zone: "Saint-Denis → Paris",
    days: "Jeudi matin",
    vehicle: "Utilitaire 6 m³",
  },
  {
    id: "drv-amina",
    name: "Amina Cissé",
    company: "Coursière indépendante",
    phone: "06 39 98 30 43",
    whatsapp: "33639983043",
    zone: "Paris intra-muros",
    days: "Du lundi au samedi",
    vehicle: "Vélo-cargo",
  },
  {
    id: "drv-paulo",
    name: "Paulo Mendes",
    company: "Distri-Boissons Île-de-France",
    phone: "06 39 98 40 54",
    whatsapp: "33639984054",
    zone: "Val-d'Oise → Paris",
    days: "Mercredi, 6h–9h",
    vehicle: "Porteur 20 m³",
  },
];

// Which supplier stocks which product.
const PRODUCT_SUPPLIER: Record<string, string> = {
  "grain-01": "sup-afro",
  "grain-02": "sup-afro",
  "grain-03": "sup-afro",
  "grain-04": "sup-afro",
  "grain-05": "sup-afro",
  "grain-06": "sup-afro",
  "oil-01": "sup-afro",
  "oil-02": "sup-antilles",
  "oil-03": "sup-afro",
  "oil-04": "sup-afro",
  "oil-05": "sup-cash",
  "spice-01": "sup-epices",
  "spice-02": "sup-epices",
  "spice-03": "sup-epices",
  "spice-04": "sup-epices",
  "spice-05": "sup-epices",
  "spice-06": "sup-antilles",
  "can-01": "sup-cash",
  "can-02": "sup-cash",
  "can-03": "sup-cash",
  "can-04": "sup-afro",
  "can-05": "sup-antilles",
  "can-06": "sup-cash",
  "bev-01": "sup-boissons",
  "bev-02": "sup-boissons",
  "bev-03": "sup-antilles",
  "bev-04": "sup-boissons",
  "bev-05": "sup-boissons",
  "house-01": "sup-cash",
  "house-02": "sup-cash",
  "house-03": "sup-cash",
  "house-04": "sup-cash",
};

/** Display-only packaging hints (no unit conversion is performed). */
export const PACKAGING: Record<string, string> = {
  "bev-02": "1 carton = 24 bouteilles",
  "bev-03": "1 carton = 24 bouteilles",
  "bev-01": "1 carton = 4 packs de 6",
  "oil-01": "1 carton = 12 bouteilles",
  "oil-05": "1 carton = 3 bidons",
  "can-01": "1 carton = 48 boîtes",
  "grain-01": "1 palette = 40 sacs",
};

export function getSupplierForProduct(productId: string): Supplier | undefined {
  const id = PRODUCT_SUPPLIER[productId];
  return suppliers.find((s) => s.id === id);
}

export function getSupplier(id: string | undefined): Supplier | undefined {
  return suppliers.find((s) => s.id === id);
}

export function getDriver(id: string | undefined): Driver | undefined {
  return drivers.find((d) => d.id === id);
}

export function productIdsForSupplier(supplierId: string): string[] {
  return Object.entries(PRODUCT_SUPPLIER)
    .filter(([, s]) => s === supplierId)
    .map(([p]) => p);
}

export function telHref(phone: string): string {
  return `tel:+33${phone.replace(/\s/g, "").replace(/^0/, "")}`;
}

export function whatsappHref(number: string, text?: string): string {
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function mailtoHref(email: string, subject?: string, body?: string): string {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const qs = params.toString().replace(/\+/g, "%20");
  return `mailto:${email}${qs ? `?${qs}` : ""}`;
}
