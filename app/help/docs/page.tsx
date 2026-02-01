import { Metadata } from 'next';
import { DocsContent } from './_components/docs-content';

export const metadata: Metadata = {
  title: 'Documentation | AlterValue',
  description: 'Documentation complète de la plateforme AlterValue',
};

export default function DocsPage() {
  return <DocsContent />;
}
