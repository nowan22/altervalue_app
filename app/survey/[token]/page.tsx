import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import SurveyForm from './_components/survey-form';

interface SurveyPageProps {
  params: Promise<{ token: string }>;
}

export default async function SurveyPage({ params }: SurveyPageProps) {
  const { token } = await params;

  // Find survey by token
  const survey = await prisma.survey.findFirst({
    where: {
      surveyToken: token,
    },
    include: {
      company: {
        select: {
          name: true,
        }
      }
    }
  });

  if (!survey) {
    notFound();
  }

  // Check if survey is active
  const isActive = survey.status === 'ACTIVE';
  const isExpired = survey.endDate ? new Date() > survey.endDate : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <SurveyForm 
        survey={{
          id: survey.id,
          token: survey.surveyToken,
          title: survey.title,
          description: survey.description,
          companyName: survey.company.name,
          isActive,
          isExpired,
          status: survey.status,
        }}
      />
    </div>
  );
}
