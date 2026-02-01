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
  // All roles see: their created companies + assigned missions + demo companies
  
  // Get assigned mission IDs for current user
  const assignments = await prisma.missionAssignment.findMany({
    where: { userId: currentUser.id },
    select: { companyId: true },
  });
  const assignedCompanyIds = assignments.map(a => a.companyId);
  
  // Build query conditions based on role
  const whereConditions: any[] = [];
  
  if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'EXPERT') {
    // Super-Admin and Expert see their created companies + demo companies + assigned missions
    whereConditions.push({ userId: currentUser.id });
    whereConditions.push({ isDemo: true });
  }
  
  // All roles see their assigned missions
  if (assignedCompanyIds.length > 0) {
    whereConditions.push({ id: { in: assignedCompanyIds } });
  }
  
  // For Pilote/Observateur without assignments, show nothing
  if (whereConditions.length === 0) {
    whereConditions.push({ id: '__none__' }); // Will match nothing
  }
  
  const companies = await prisma.company.findMany({
    where: {
      OR: whereConditions,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <DashboardLayoutClient companies={companies}>
      {children}
    </DashboardLayoutClient>
  );
}
