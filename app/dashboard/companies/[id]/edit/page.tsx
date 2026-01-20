import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import CompanyForm from "../../_components/company-form";

export default async function EditCompanyPage({
  params,
}: {
  params: { id: string };
}) {
  const company = await prisma.company.findUnique({
    where: { id: params.id },
  });

  if (!company) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <CompanyForm
        company={JSON.parse(JSON.stringify(company ?? {}))}
        isEdit
      />
    </div>
  );
}
