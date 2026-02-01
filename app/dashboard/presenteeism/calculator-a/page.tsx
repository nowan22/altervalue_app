import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { CalculatorAWrapper } from './_components/calculator-a-wrapper';

export default async function CalculatorAPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  return <CalculatorAWrapper />;
}
