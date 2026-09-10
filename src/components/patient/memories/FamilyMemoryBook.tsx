import React from 'react';
import { FamilyVault } from '../reminiscence/FamilyVault';

/**
 * FamilyMemoryBook component for the patient "Memories" view.
 * Renders live family members synced from Supabase database with voice playback.
 */
export const FamilyMemoryBook: React.FC = () => {
  return <FamilyVault />;
};

export default FamilyMemoryBook;
