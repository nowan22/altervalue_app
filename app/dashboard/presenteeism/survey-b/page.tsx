import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { SurveyBWrapper } from './_components/survey-b-wrapper';

export default async function SurveyBPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  return <SurveyBWrapper />;
}
