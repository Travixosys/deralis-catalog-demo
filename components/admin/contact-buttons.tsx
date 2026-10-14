import { Mail, MessageCircle, Phone } from "lucide-react";
import { mailtoHref, telHref, whatsappHref } from "@/lib/contacts-data";

const linkClass =
  "inline-flex items-center gap-1.5 rounded-md border border-[#e8d5b7] bg-white px-2.5 py-1.5 text-xs font-medium text-[#78350f] transition-colors hover:bg-[#fdf0e0]";

export function ContactButtons({
  phone,
  whatsapp,
  email,
  message,
  subject,
}: {
  phone: string;
  whatsapp: string;
  email?: string;
  /** Pre-filled WhatsApp / email body. */
  message?: string;
  subject?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <a href={telHref(phone)} className={linkClass}>
        <Phone className="h-3.5 w-3.5" />
        Appeler
      </a>
      <a
        href={whatsappHref(whatsapp, message)}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        <MessageCircle className="h-3.5 w-3.5" />
        WhatsApp
      </a>
      {email && (
        <a href={mailtoHref(email, subject, message)} className={linkClass}>
          <Mail className="h-3.5 w-3.5" />
          Email
        </a>
      )}
    </div>
  );
}
