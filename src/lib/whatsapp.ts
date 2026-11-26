/** Lien WhatsApp : vers le numéro s'il est au format international (+…), sinon le client choisit le contact. */
export function waLink(phone: string, text: string) {
  const digits = phone.trim().startsWith("+") ? phone.replace(/\D/g, "") : "";
  return `https://wa.me/${digits.length >= 8 ? digits : ""}?text=${encodeURIComponent(text)}`;
}
export const hasIntlPhone = (phone: string) => phone.trim().startsWith("+") && phone.replace(/\D/g, "").length >= 8;
