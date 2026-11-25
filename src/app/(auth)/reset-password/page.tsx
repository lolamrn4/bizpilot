import { getDict } from "@/i18n/server";
import { ResetForm } from "../AuthForms";

export default async function ResetPage() {
  const { d } = await getDict();
  return (
    <div className="card p-6 sm:p-8">
      <h1 className="h1 mb-6">{d.auth.resetTitle}</h1>
      <ResetForm />
    </div>
  );
}
