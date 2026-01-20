export const SECTORS = [
  { value: 'tech_services', label: 'Tech / Services numériques' },
  { value: 'industrie', label: 'Industrie manufacturière' },
  { value: 'commerce', label: 'Commerce / Distribution' },
  { value: 'sante', label: 'Santé / Médico-social' },
  { value: 'btp', label: 'BTP / Construction' },
  { value: 'transport', label: 'Transport / Logistique' },
  { value: 'finance', label: 'Finance / Banque / Assurance' },
  { value: 'hotellerie', label: 'Hôtellerie / Restauration' },
  { value: 'education', label: 'Éducation / Formation' },
  { value: 'public', label: 'Secteur public' },
  { value: 'autre', label: 'Autre' },
] as const;

export const SECTOR_DEFAULTS: Record<string, {
  absenteeismRate: number;
  turnoverRate: number;
  avgSeniorityYears: number;
}> = {
  tech_services: { absenteeismRate: 3.5, turnoverRate: 18, avgSeniorityYears: 3.5 },
  industrie: { absenteeismRate: 5.5, turnoverRate: 8, avgSeniorityYears: 12 },
  commerce: { absenteeismRate: 6.0, turnoverRate: 25, avgSeniorityYears: 4 },
  sante: { absenteeismRate: 8.5, turnoverRate: 12, avgSeniorityYears: 8 },
  btp: { absenteeismRate: 6.5, turnoverRate: 15, avgSeniorityYears: 7 },
  transport: { absenteeismRate: 7.0, turnoverRate: 14, avgSeniorityYears: 9 },
  finance: { absenteeismRate: 4.0, turnoverRate: 12, avgSeniorityYears: 6 },
  hotellerie: { absenteeismRate: 7.5, turnoverRate: 35, avgSeniorityYears: 2.5 },
  education: { absenteeismRate: 5.0, turnoverRate: 10, avgSeniorityYears: 11 },
  public: { absenteeismRate: 5.5, turnoverRate: 5, avgSeniorityYears: 15 },
  autre: { absenteeismRate: 5.0, turnoverRate: 15, avgSeniorityYears: 6 },
};

export function getSectorLabel(value: string): string {
  const sector = SECTORS.find(s => s.value === value);
  return sector?.label ?? value;
}
