export type DeclarationMode = 'LOCKED' | 'OPEN_ALL' | 'OPEN_DATE';

export interface DeclarationConfig {
  id: number;
  mode: DeclarationMode;
  specificDate: string | null;
  updatedBy?: string | null;
}
