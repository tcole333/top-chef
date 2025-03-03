export interface Chef {
  id: string;
  name: string;
  draftedBy?: string;
  draftedByName?: string;
  draftedInRound?: number;
  draftedAtPosition?: number;
  // Add other chef properties as needed
} 