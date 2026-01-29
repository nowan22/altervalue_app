import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { DashboardLayoutClient } from "./_components/dashboard-layout-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Get current user with role
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user?.email || '' },
    select: { id: true, role: true },
  });

  if (!currentUser) {
    redirect("/login");
  }

  // Fetch companies/missions based on user role
  let companies;
  
  if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'EXPERT') {
    // Super-Admin and Expert see all their created companies + demo companies
    companies = await prisma.company.findMany({
      where: {
        OR: [
          { userId: currentUser.id },
          { isDemo: true },
        ],
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  } else {
    // Pilote and Observateur only see their assigned missions
    const assignments = await prisma.missionAssignment.findMany({
      where: { userId: currentUser.id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        company: {
          name: 'asc',
        },
      },
    });
    companies = assignments.map(a => a.company);
  }

  return (
    <DashboardLayoutClient companies={companies}>
      {children}
    </DashboardLayoutClient>
  );
}
