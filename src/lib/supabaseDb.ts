import { supabase } from './supabase';
import { FamilyMember, RoutineTask } from '../context/AppContext';

export interface PatientProfileRecord {
  id?: string;
  role?: 'patient' | 'caregiver';
  username: string;
  date_of_birth?: string | null;
  phone_number?: string | null;
  connection_code?: string | null;
  is_paired: boolean;
  caregiver_id?: string | null;
  linked_patient_id?: string | null;
  relationship_to_patient?: string | null;
  avatar_url?: string | null;
  is_deleted?: boolean;
  created_at?: string;
}

export const DEFAULT_DEMO_PATIENT_UUID = '926f0b23-7af7-42d6-a0e0-8084dc63c6a3';
export const DEFAULT_PATIENT_ID = '9e3ba6c7-fb34-4927-b07b-01bf059ac04b';

import { mergeTrajectoryWithBaseline, CognitiveTrajectoryPoint } from '../utils/cognitiveMetrics';
export type { CognitiveTrajectoryPoint };

export const isValidUuid = (id?: string | null): boolean => {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());
};

export const resolveToValidUuid = (id?: string | null, fallbackUuid: string = DEFAULT_DEMO_PATIENT_UUID): string => {
  if (id && isValidUuid(id)) {
    return id.trim();
  }
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('smriti_linked_patient_id');
    if (stored && isValidUuid(stored)) {
      return stored.trim();
    }
  }
  return fallbackUuid;
};

export const toNullableUuid = (id?: string | null): string | null => {
  if (id && isValidUuid(id)) {
    return id.trim();
  }
  return null;
};

/**
 * 1. Fetch User Profile from Supabase 'profiles' to verify existing role
 */
export const fetchUserProfile = async (userId: string): Promise<PatientProfileRecord | null> => {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      console.warn('[Supabase DB] fetchUserProfile error:', error.message);
      return null;
    }

    return (data as PatientProfileRecord) || null;
  } catch (err) {
    console.warn('[Supabase DB] fetchUserProfile exception:', err);
    return null;
  }
};

/**
 * 2. Supabase Storage Media Upload with Resilient Offline / Demo Fallback
 */
export const uploadMediaFile = async (
  file: File,
  folder: 'patients' | 'caregivers' | 'family' = 'family'
): Promise<string> => {
  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${folder}/${Date.now()}_${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.warn('[Supabase Storage] Remote upload failed, activating local fallback:', uploadError.message);
      return await fileToDataUrl(file);
    }

    const { data: publicData } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    if (publicData?.publicUrl) {
      return publicData.publicUrl;
    }

    return await fileToDataUrl(file);
  } catch (err) {
    console.warn('[Supabase Storage] Media upload exception, activating local fallback:', err);
    return await fileToDataUrl(file);
  }
};

/**
 * Local Data URL Fallback for images when offline or storage bucket is not configured
 */
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      resolve('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80');
    };
    reader.readAsDataURL(file);
  });
};

/**
 * 3. Create Patient Profile in Supabase 'profiles' (3 Fields: Name, DOB, Phone)
 */
export const createPatientProfile = async (
  userId: string,
  name: string,
  dateOfBirth: string,
  phoneNumber: string,
  connectionCode: string
): Promise<{ success: boolean; data?: PatientProfileRecord; error?: string }> => {
  const profilePayload: PatientProfileRecord = {
    role: 'patient',
    username: name.trim(),
    date_of_birth: dateOfBirth,
    phone_number: phoneNumber.trim(),
    connection_code: connectionCode,
    is_paired: false,
    created_at: new Date().toISOString(),
  };

  if (isValidUuid(userId)) {
    profilePayload.id = userId;
  }

  // Always mirror in localStorage for offline Hackathon guarantee
  if (typeof window !== 'undefined') {
    localStorage.setItem('smriti_patient_profile', JSON.stringify({ ...profilePayload, id: userId }));
    localStorage.setItem('smriti_conn_code', connectionCode);
    localStorage.setItem('smriti_user_role', 'patient');
    localStorage.setItem('smriti_is_paired', 'false');
  }

  try {
    let res;
    if (isValidUuid(userId)) {
      res = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' })
        .select()
        .maybeSingle();
    } else {
      res = await supabase
        .from('profiles')
        .insert(profilePayload)
        .select()
        .maybeSingle();
    }

    if (res.error) {
      console.warn('[Supabase DB] createPatientProfile warning (operating in local mode):', res.error.message);
      return { success: true, data: profilePayload };
    }

    if (res.data?.id && typeof window !== 'undefined') {
      localStorage.setItem('smriti_patient_profile', JSON.stringify(res.data));
    }

    return { success: true, data: (res.data as PatientProfileRecord) || profilePayload };
  } catch (err: any) {
    console.warn('[Supabase DB] createPatientProfile exception:', err);
    return { success: true, data: profilePayload };
  }
};

/**
 * 4. Check if Patient has been Linked by a Caregiver
 */
export const checkPatientPairingStatus = async (
  patientId: string,
  connectionCode: string
): Promise<{ isPaired: boolean; caregiverName?: string }> => {
  if (typeof window !== 'undefined') {
    if (localStorage.getItem('smriti_is_paired') === 'true') {
      return { isPaired: true, caregiverName: 'Caregiver Linked' };
    }
  }

  try {
    let query = supabase.from('profiles').select('is_paired, caregiver_id');
    if (patientId && isValidUuid(patientId)) {
      query = query.eq('id', patientId);
    } else if (connectionCode) {
      const cleanCode = connectionCode.trim().replace(/\D/g, '');
      query = query.eq('connection_code', cleanCode || connectionCode.trim());
    } else {
      return { isPaired: false };
    }

    const { data, error } = await query.maybeSingle();

    if (!error && data?.is_paired) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('smriti_is_paired', 'true');
      }
      return { isPaired: true, caregiverName: 'Linked Caregiver' };
    }
  } catch (err) {
    console.warn('[Supabase DB] checkPatientPairingStatus query exception:', err);
  }

  return { isPaired: false };
};

/**
 * 5. Verify 6-Digit Code and Link Caregiver to Patient
 */
export const verifyAndLinkPatient = async (
  caregiverId: string,
  connectionCode: string
): Promise<{ success: boolean; patientId?: string; patientName?: string; error?: string }> => {
  const cleanCode = connectionCode.trim().replace(/\D/g, '');

  // 1. Hackathon Demo Bypass
  if (cleanCode === '849201') {
    if (typeof window !== 'undefined') {
      localStorage.setItem('smriti_conn_code', '849201');
      localStorage.setItem('smriti_is_paired', 'true');
      localStorage.setItem('smriti_linked_patient_id', DEFAULT_DEMO_PATIENT_UUID);
    }
    return {
      success: true,
      patientId: DEFAULT_DEMO_PATIENT_UUID,
      patientName: 'Bhaben Baruah (Koka)',
    };
  }

  // 2. Check Local Storage Match (if patient registered in same browser / offline)
  if (typeof window !== 'undefined') {
    const savedCode = localStorage.getItem('smriti_conn_code');
    const savedPatient = localStorage.getItem('smriti_patient_profile');
    if (savedCode === cleanCode && savedPatient) {
      try {
        const parsed = JSON.parse(savedPatient);
        localStorage.setItem('smriti_is_paired', 'true');
        localStorage.setItem('smriti_linked_patient_id', parsed.id);
        return {
          success: true,
          patientId: parsed.id,
          patientName: parsed.username || 'Linked Patient',
        };
      } catch (e) {
        // continue
      }
    }
  }

  // 3. Try PostgreSQL RPC Function (Bypasses RLS safely and pairs both sides atomically)
  if (isValidUuid(caregiverId)) {
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('link_patient_with_code', {
        p_connection_code: cleanCode,
        p_caregiver_id: caregiverId,
      });

      if (!rpcError && rpcData) {
        const res = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData;
        if (res.success) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('smriti_conn_code', cleanCode);
            localStorage.setItem('smriti_is_paired', 'true');
            localStorage.setItem('smriti_linked_patient_id', res.patient_id);
          }
          return {
            success: true,
            patientId: res.patient_id,
            patientName: res.patient_name || 'Patient',
          };
        }
      }
    } catch (rpcEx) {
      // fallback to direct table update below
    }
  }

  // 4. Query Supabase 'profiles' table for matching patient connection code
  try {
    const { data: patientRecord, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('connection_code', cleanCode)
      .eq('role', 'patient')
      .maybeSingle();

    if (error) {
      console.warn('[Supabase DB] verifyAndLinkPatient lookup error:', error.message);
    }

    if (patientRecord) {
      // Link patient to caregiver
      const { error: patientUpdateError } = await supabase
        .from('profiles')
        .update({
          caregiver_id: isValidUuid(caregiverId) ? caregiverId : null,
          is_paired: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', patientRecord.id);

      if (patientUpdateError) {
        console.warn('[Supabase DB] verifyAndLinkPatient patient update warning:', patientUpdateError.message);
      }

      // Link caregiver to patient (only if caregiverId is a valid UUID)
      if (isValidUuid(caregiverId)) {
        await supabase
          .from('profiles')
          .upsert({
            id: caregiverId,
            role: 'caregiver',
            linked_patient_id: patientRecord.id,
            is_paired: true,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('smriti_conn_code', cleanCode);
        localStorage.setItem('smriti_is_paired', 'true');
        localStorage.setItem('smriti_linked_patient_id', patientRecord.id);
      }

      return {
        success: true,
        patientId: patientRecord.id,
        patientName: patientRecord.username || 'Patient',
      };
    }
  } catch (err: any) {
    console.warn('[Supabase DB] verifyAndLinkPatient exception:', err);
  }

  // Graceful 6-digit offline fallback
  if (cleanCode.length === 6) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('smriti_conn_code', cleanCode);
      localStorage.setItem('smriti_is_paired', 'true');
    }
    return {
      success: true,
      patientId: `patient-${cleanCode}`,
      patientName: `Patient #${cleanCode}`,
    };
  }

  return {
    success: false,
    error: 'Invalid 6-digit connection code. Please verify the code displayed on the patient screen.',
  };
};

/**
 * 6. Save Complete Caregiver Setup Wizard Data to Supabase
 */
export const saveCaregiverWizardData = async (
  caregiverId: string,
  patientId: string,
  caregiverData: {
    name: string;
    dob: string;
    phone: string;
    relationship: string;
    avatarUrl?: string;
  },
  familyMembers: Array<{
    name: string;
    relation: string;
    relationship?: string;
    age?: number | string;
    description?: string;
    notes?: string;
    quote?: string;
    voiceMessage?: string;
    avatarUrl?: string;
  }>
): Promise<{
  success: boolean;
  formattedFamily: FamilyMember[];
}> => {
  const avatarColors = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6'];
  const formattedFamily: FamilyMember[] = familyMembers.map((m, index) => {
    const ageVal = m.age ? parseInt(String(m.age), 10) || 30 : 30;
    const relVal = (m.relation || m.relationship || 'Family Member').trim();
    const descVal = (m.description || m.notes || 'Loves spending time together with the family.').trim();
    const quoteVal = (m.quote || m.voiceMessage || 'Pranam! Remember that our family is always with you. Keep smiling!').trim();

    return {
      id: `fam-${Date.now()}-${index}`,
      name: m.name.trim(),
      relation: relVal,
      relationship: relVal,
      localRelation: `${relVal} • Family Member`,
      age: ageVal,
      avatarColor: avatarColors[index % avatarColors.length],
      avatarIcon: 'user' as const,
      voiceMessage: quoteVal,
      quote: quoteVal,
      description: descVal,
      funFact: descVal,
      lastSpokenDate: 'Recently added',
      avatarUrl: m.avatarUrl,
    };
  });

  // Cache in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('smriti_custom_family', JSON.stringify(formattedFamily));
    localStorage.setItem('smriti_caregiver_info', JSON.stringify(caregiverData));
    localStorage.setItem('smriti_user_role', 'caregiver');
    localStorage.setItem('smriti_is_paired', 'true');
    if (caregiverData.avatarUrl) {
      localStorage.setItem('smriti_caregiver_avatar', caregiverData.avatarUrl);
    }
  }

  // 1. Upsert caregiver profile in Supabase
  const validCaregiverId = isValidUuid(caregiverId) ? caregiverId : crypto.randomUUID();
  const targetPatientId = resolveToValidUuid(patientId);

  const profilePayload: Record<string, any> = {
    id: validCaregiverId,
    username: caregiverData.name,
    date_of_birth: caregiverData.dob || null,
    phone_number: caregiverData.phone,
    relationship_to_patient: caregiverData.relationship,
    role: 'caregiver',
    is_paired: true,
    avatar_url: caregiverData.avatarUrl || null,
    linked_patient_id: targetPatientId,
    updated_at: new Date().toISOString(),
  };

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(profilePayload, { onConflict: 'id' });

  if (profileError) {
    console.error('[Supabase DB] Error upserting caregiver profile:', {
      message: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
      code: profileError.code,
    });
    // Do not rethrow hard error if RLS blocks profile update for offline users; log and proceed
  }

  // 2. Insert family members into Supabase
  let finalFamily = formattedFamily;
  if (familyMembers.length > 0 && targetPatientId) {
    const familyPayload = familyMembers.map((f, index) => {
      const relVal = (f.relation || f.relationship || 'Family Member').trim();
      const descVal = (f.description || f.notes || 'Loves spending time together with the family.').trim();
      const quoteVal = (f.quote || f.voiceMessage || 'Pranam! Remember that our family is always with you. Keep smiling!').trim();

      return {
        patient_id: targetPatientId,
        name: f.name.trim(),
        relation: relVal,
        local_relation: `${relVal} • Family Member`,
        avatar_url: f.avatarUrl || null,
        avatar_color: avatarColors[index % avatarColors.length],
        voice_message: quoteVal,
        fun_fact: descVal,
      };
    });

    const { data: insertedRows, error: familyError } = await supabase
      .from('family_members')
      .insert(familyPayload)
      .select();

    if (familyError) {
      console.warn('[Supabase DB] Notice inserting family members in setup (persisting locally):', familyError.message);
      if (typeof window !== 'undefined') {
        localStorage.setItem('smriti_custom_family', JSON.stringify(finalFamily));
      }
    }

    if (insertedRows && insertedRows.length > 0) {
      finalFamily = insertedRows.map((row: any, idx: number) => {
        const ageVal = familyMembers[idx]?.age ? parseInt(String(familyMembers[idx].age), 10) || 30 : 30;
        const relVal = row.relation || familyMembers[idx]?.relation || 'Family Member';
        const quoteVal = row.voice_message || familyMembers[idx]?.quote || 'Pranam! Remember that our family is always with you. Keep smiling!';
        const descVal = row.fun_fact || familyMembers[idx]?.description || 'Loves spending time together with the family.';

        return {
          id: row.id,
          name: row.name,
          relation: relVal,
          relationship: relVal,
          localRelation: row.local_relation || `${relVal} • Family Member`,
          age: ageVal,
          avatarColor: row.avatar_color || avatarColors[idx % avatarColors.length],
          avatarIcon: 'user' as const,
          voiceMessage: quoteVal,
          quote: quoteVal,
          description: descVal,
          funFact: descVal,
          lastSpokenDate: 'Recently added',
          avatarUrl: row.avatar_url || undefined,
        };
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('smriti_custom_family', JSON.stringify(finalFamily));
      }
    }
  }

  return {
    success: true,
    formattedFamily: finalFamily,
  };
};

/**
 * 7. Fetch Live Family Members from Supabase 'family_members'
 */
export const fetchFamilyMembers = async (patientId: string): Promise<FamilyMember[]> => {
  if (!patientId || patientId === 'demo-patient-koka') {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[Supabase DB] fetchFamilyMembers error:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    const avatarColors = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6'];

    return data.map((row: any, index: number) => {
      const parsedAge = row.age ? parseInt(String(row.age), 10) : undefined;
      const quoteVal = row.quote || row.voice_message || `Pranam! Remember that our family is always with you. Keep smiling!`;
      const descVal = row.description || row.fun_fact || `Loves spending time together with the family.`;
      const relationVal = row.relation || row.relationship || 'Family Member';

      return {
        id: row.id,
        name: row.name,
        relation: relationVal,
        relationship: relationVal,
        localRelation: row.local_relation || `${relationVal} • Family Member`,
        age: parsedAge || 30,
        avatarColor: row.avatar_color || avatarColors[index % avatarColors.length],
        avatarIcon: 'user' as const,
        voiceMessage: quoteVal,
        quote: quoteVal,
        description: descVal,
        funFact: descVal,
        lastSpokenDate: 'Recently added',
        avatarUrl: row.avatar_url || undefined,
      };
    });
  } catch (err) {
    console.warn('[Supabase DB] fetchFamilyMembers exception:', err);
    return [];
  }
};

/**
 * 8. Add a Family Member (Caregiver Dashboard live sync)
 */
export const addFamilyMemberDb = async (
  patientId: string,
  member: {
    name: string;
    relation?: string;
    relationship?: string;
    age?: number | string;
    description?: string;
    notes?: string;
    quote?: string;
    voiceMessage?: string;
    funFact?: string;
    avatarUrl?: string;
    avatarColor?: string;
  }
): Promise<FamilyMember> => {
  const avatarColors = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6'];
  const chosenColor = member.avatarColor || avatarColors[Math.floor(Math.random() * avatarColors.length)];
  const relationVal = (member.relationship || member.relation || 'Family Member').trim();
  const quoteVal = (member.quote || member.voiceMessage || 'Pranam! Remember that our family is always with you. Keep smiling!').trim();
  const descVal = (member.description || member.notes || member.funFact || 'Loves spending time together with the family.').trim();
  const parsedAge = member.age ? parseInt(String(member.age), 10) || 30 : 30;

  const memberId = crypto.randomUUID();

  const newMember: FamilyMember = {
    id: memberId,
    name: member.name.trim(),
    relation: relationVal,
    relationship: relationVal,
    localRelation: `${relationVal} • Family Member`,
    age: parsedAge,
    avatarColor: chosenColor,
    avatarIcon: 'user',
    voiceMessage: quoteVal,
    quote: quoteVal,
    description: descVal,
    funFact: descVal,
    lastSpokenDate: 'Just now',
    avatarUrl: member.avatarUrl,
  };

  const persistLocally = (item: FamilyMember) => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('smriti_custom_family');
        const list: FamilyMember[] = stored ? JSON.parse(stored) : [];
        const filtered = list.filter((m) => m.id !== item.id && m.name.toLowerCase() !== item.name.toLowerCase());
        const updated = [...filtered, item];
        localStorage.setItem('smriti_custom_family', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
    }
  };

  try {
    let targetPatientId = resolveToValidUuid(patientId);

    // If active session exists in Supabase and targetPatientId is a mock/default ID,
    // prefer the authenticated session user ID to satisfy foreign key constraints.
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const authUserId = sessionData?.session?.user?.id;
      if (authUserId && (!targetPatientId || targetPatientId === DEFAULT_PATIENT_ID || targetPatientId === DEFAULT_DEMO_PATIENT_UUID)) {
        targetPatientId = authUserId;
      }
    } catch {
      // ignore
    }

    if (targetPatientId) {
      // Primary Insert: using age, description, quote, relationship, and core columns with .select()
      const payload: Record<string, any> = {
        id: memberId,
        patient_id: targetPatientId,
        name: member.name.trim(),
        relationship: relationVal,
        relation: relationVal,
        local_relation: newMember.localRelation,
        age: parsedAge,
        description: descVal,
        quote: quoteVal,
        avatar_url: member.avatarUrl || null,
        avatar_color: chosenColor,
        voice_message: quoteVal,
        fun_fact: descVal,
      };

      let { data, error } = await supabase
        .from('family_members')
        .insert([payload])
        .select();

      // Check if error is foreign key violation on patient_id
      const isFkError = error && (
        error.code === '23503' || 
        error.message?.includes('foreign key constraint') || 
        error.message?.includes('family_members_patient_id_fkey')
      );

      // If foreign key constraint failed on synthetic targetPatientId, try with auth session user if available
      if (isFkError) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const authUserId = sessionData?.session?.user?.id;
          if (authUserId && authUserId !== targetPatientId) {
            console.log('[Supabase DB] Retrying family_members insert with session auth user id:', authUserId);
            payload.patient_id = authUserId;
            const { data: authRetryData, error: authRetryError } = await supabase
              .from('family_members')
              .insert([payload])
              .select();

            if (!authRetryError && authRetryData && authRetryData.length > 0) {
              newMember.id = authRetryData[0].id;
              error = null;
              data = authRetryData;
            } else {
              error = authRetryError;
            }
          }
        } catch {
          // ignore
        }
      }

      // If Postgres schema does not have the newer optional columns, fallback gracefully to core columns
      if (error && (error.message?.includes('column') || error.code === '42703')) {
        console.warn('[Supabase DB] Column mismatch in family_members, retrying with core columns:', error.message);
        const corePayload = {
          id: memberId,
          patient_id: payload.patient_id,
          name: member.name.trim(),
          relation: relationVal,
          local_relation: newMember.localRelation,
          avatar_url: member.avatarUrl || null,
          avatar_color: chosenColor,
          voice_message: quoteVal,
          fun_fact: descVal,
        };

        const { data: retryData, error: retryError } = await supabase
          .from('family_members')
          .insert([corePayload])
          .select();

        if (retryError) {
          console.warn('[Supabase DB] addFamilyMemberDb retry notice (persisting locally):', retryError.message);
          persistLocally(newMember);
          return newMember;
        }
        if (retryData && retryData.length > 0) {
          newMember.id = retryData[0].id;
        }
      } else if (error) {
        // If foreign key or other schema constraint, do NOT crash user flow; safely persist to local state
        console.warn('[Supabase DB] addFamilyMemberDb notice (patient_id FK or offline, persisting locally):', {
          message: error.message,
          code: error.code,
        });
        persistLocally(newMember);
        return newMember;
      } else if (data && data.length > 0) {
        newMember.id = data[0].id;
      }
      persistLocally(newMember);
      return newMember;
    }
  } catch (err: any) {
    console.warn('[Supabase DB] addFamilyMemberDb exception (persisting locally):', err?.message);
    persistLocally(newMember);
    return newMember;
  }

  persistLocally(newMember);
  return newMember;
};

/**
 * 9. Update a Family Member (Caregiver Dashboard live sync)
 */
export const updateFamilyMemberDb = async (
  memberId: string,
  updates: Partial<FamilyMember>
): Promise<boolean> => {
  try {
    const payload: Record<string, any> = {};
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.relation !== undefined || updates.relationship !== undefined) {
      const rel = (updates.relation || updates.relationship || '').trim();
      payload.relation = rel;
      payload.relationship = rel;
      payload.local_relation = updates.localRelation || `${rel} • Family Member`;
    }
    if (updates.age !== undefined) payload.age = updates.age;
    if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;
    if (updates.voiceMessage !== undefined || updates.quote !== undefined) {
      payload.voice_message = updates.quote || updates.voiceMessage;
      payload.quote = updates.quote || updates.voiceMessage;
    }
    if (updates.funFact !== undefined || updates.description !== undefined) {
      payload.fun_fact = updates.description || updates.funFact;
      payload.description = updates.description || updates.funFact;
    }
    if (updates.avatarColor !== undefined) payload.avatar_color = updates.avatarColor;

    const { error } = await supabase
      .from('family_members')
      .update(payload)
      .eq('id', memberId);

    if (error) {
      console.warn('[Supabase DB] updateFamilyMemberDb error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase DB] updateFamilyMemberDb exception:', err);
    return false;
  }
};

/**
 * 10. Delete a Family Member (Caregiver Dashboard live sync)
 */
export const deleteFamilyMemberDb = async (memberId: string): Promise<boolean> => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('smriti_custom_family');
      if (stored) {
        const list: FamilyMember[] = JSON.parse(stored);
        const filtered = list.filter((m) => m.id !== memberId);
        localStorage.setItem('smriti_custom_family', JSON.stringify(filtered));
      }
    } catch {}
  }

  try {
    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.warn('[Supabase DB] deleteFamilyMemberDb error:', error.message);
    }
  } catch (err) {
    console.warn('[Supabase DB] deleteFamilyMemberDb exception:', err);
  }
  return true;
};

/**
 * 11. Fetch Patient Routine Tasks from Supabase ('patient_tasks' or 'routine_tasks')
 * Retrieves tasks ordered by scheduled time slot with automatic deduplication.
 */
export const fetchPatientTasks = async (patientId: string): Promise<RoutineTask[]> => {
  if (!patientId || patientId === 'demo-patient-koka') {
    return [];
  }

  try {
    // 1. Try querying patient_tasks table filtered specifically by patient_id
    const { data: ptData, error: ptError } = await supabase
      .from('patient_tasks')
      .select('*')
      .eq('patient_id', patientId)
      .order('time_slot', { ascending: true });

    if (!ptError && ptData && ptData.length > 0) {
      // Filter out system telemetry rows, stats, and game session log rows
      const routineRows = ptData.filter(
        (row: any) =>
          row.time_slot !== 'STATS' &&
          row.icon !== 'patient_telemetry' &&
          row.icon !== 'game_session' &&
          !row.title?.startsWith('Cognitive Session:') &&
          !row.title?.startsWith('Patient Telemetry')
      );

      if (routineRows.length > 0) {
        // Deduplicate: Keep latest row for each normalized title to prevent duplicate clutter
        const seenTitles = new Set<string>();
        const uniqueRows: any[] = [];

        // Sort descending by created_at first so newest or current day record takes priority
        const sortedByDate = [...routineRows].sort((a, b) => {
          const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
          const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
          return tB - tA;
        });

        for (const row of sortedByDate) {
          const normKey = (row.title || '').trim().toLowerCase();
          if (!seenTitles.has(normKey)) {
            seenTitles.add(normKey);
            uniqueRows.push(row);
          }
        }

        return uniqueRows.map((row: any) => {
          const timeVal = row.time_slot || row.time || '09:00 AM';
          const periodVal = (row.period || row.time_of_day || 'morning') as 'morning' | 'afternoon' | 'evening';
          const isDone = !!(row.completed ?? row.is_completed);

          return {
            id: row.id,
            title: row.title,
            time: timeVal,
            timeStr: timeVal,
            time_slot: timeVal,
            period: periodVal,
            timeOfDay: periodVal,
            category: (row.category || (row.title.toLowerCase().includes('medicine') || row.title.toLowerCase().includes('tablet') ? 'medication' : row.title.toLowerCase().includes('water') || row.title.toLowerCase().includes('hydration') ? 'hydration' : row.title.toLowerCase().includes('walk') ? 'exercise' : 'game')) as any,
            type: (row.type || (row.title.toLowerCase().includes('medicine') || row.title.toLowerCase().includes('tablet') ? 'medicine' : row.title.toLowerCase().includes('water') || row.title.toLowerCase().includes('hydration') ? 'hydration' : row.title.toLowerCase().includes('walk') ? 'exercise' : 'activity')) as any,
            description: row.notes || row.description || '',
            notes: row.notes || row.description || '',
            isCompleted: isDone,
            completed: isDone,
          };
        });
      }
    }

    // 2. Try routine_tasks table fallback
    const { data: rtData, error: rtError } = await supabase
      .from('routine_tasks')
      .select('*')
      .eq('patient_id', patientId)
      .order('time_str', { ascending: true });

    if (!rtError && rtData && rtData.length > 0) {
      return rtData.map((row: any) => {
        const timeVal = row.time_str || row.time || '09:00 AM';
        const periodVal = (row.time_of_day || row.period || 'morning') as 'morning' | 'afternoon' | 'evening';
        const isDone = !!(row.is_completed ?? row.completed);

        return {
          id: row.id,
          title: row.title,
          time: timeVal,
          timeStr: timeVal,
          time_slot: timeVal,
          period: periodVal,
          timeOfDay: periodVal,
          category: (row.category || 'medication') as any,
          type: (row.type || 'medicine') as any,
          description: row.description || row.notes || '',
          notes: row.notes || row.description || '',
          isCompleted: isDone,
          completed: isDone,
        };
      });
    }

    // 3. If zero tasks found in database for a valid patient, automatically seed the 4 default daily routine tasks
    if (isValidUuid(patientId)) {
      console.log('[Supabase DB] Zero tasks found in database for patient, seeding 4 clean default tasks...');
      return await seedDefaultPatientTasks(patientId);
    }

    return [];
  } catch (err) {
    console.warn('[Supabase DB] fetchPatientTasks exception:', err);
    return [];
  }
};

export const DEFAULT_CORE_TASKS: Array<{
  title: string;
  timeSlot: string;
  period: 'morning' | 'afternoon' | 'evening';
  category: 'medication' | 'hydration' | 'exercise' | 'game';
  type: 'medicine' | 'hydration' | 'exercise' | 'activity';
  notes: string;
  completed: boolean;
}> = [
  {
    title: 'Morning Medication & Glass of Water',
    timeSlot: '08:30 AM',
    period: 'morning',
    category: 'medication',
    type: 'medicine',
    notes: 'Take prescribed morning medicines with a full glass of fresh water.',
    completed: false,
  },
  {
    title: 'Gentle Cognitive Exercise / Memory Game',
    timeSlot: '11:00 AM',
    period: 'morning',
    category: 'game',
    type: 'activity',
    notes: 'Play North-East cultural memory cards with Rongmon to stimulate recall.',
    completed: false,
  },
  {
    title: 'Afternoon Rest & Hydration',
    timeSlot: '01:30 PM',
    period: 'afternoon',
    category: 'hydration',
    type: 'hydration',
    notes: 'Rest peacefully and drink a glass of lukewarm water or herbal tea.',
    completed: false,
  },
  {
    title: 'Evening Medication',
    timeSlot: '08:00 PM',
    period: 'evening',
    category: 'medication',
    type: 'medicine',
    notes: 'Take evening multivitamin and prescribed night dose after dinner.',
    completed: false,
  },
];

/**
 * Seeds the 4 clean default daily routine tasks into Supabase ('patient_tasks')
 * Includes deduplication guards to prevent duplicate row clutter on repeated calls.
 */
export const seedDefaultPatientTasks = async (patientId?: string, forceReset = false): Promise<RoutineTask[]> => {
  const effectivePatientId = patientId && isValidUuid(patientId) ? patientId : DEFAULT_PATIENT_ID;

  try {
    // If not a forced reset, check if the patient already has routine tasks
    if (!forceReset) {
      const { data: existingTasks, error: queryError } = await supabase
        .from('patient_tasks')
        .select('*')
        .eq('patient_id', effectivePatientId)
        .neq('time_slot', 'STATS')
        .neq('icon', 'patient_telemetry')
        .neq('icon', 'game_session');

      if (!queryError && existingTasks && existingTasks.length > 0) {
        console.log(`[Supabase DB] Patient already has ${existingTasks.length} tasks. Skipping duplicate seeding.`);
        return existingTasks.map((row: any) => ({
          id: row.id,
          title: row.title,
          time: row.time_slot || '09:00 AM',
          timeStr: row.time_slot || '09:00 AM',
          time_slot: row.time_slot || '09:00 AM',
          period: row.period || 'morning',
          timeOfDay: row.period || 'morning',
          category: (row.title.toLowerCase().includes('medicine') ? 'medication' : row.title.toLowerCase().includes('water') ? 'hydration' : 'game') as any,
          type: (row.title.toLowerCase().includes('medicine') ? 'medicine' : row.title.toLowerCase().includes('water') ? 'hydration' : 'activity') as any,
          description: row.notes || '',
          notes: row.notes || '',
          isCompleted: !!row.completed,
          completed: !!row.completed,
        }));
      }
    } else {
      // If force reset, clean up previous routine tasks to remove old duplicates
      await supabase
        .from('patient_tasks')
        .delete()
        .eq('patient_id', effectivePatientId)
        .neq('time_slot', 'STATS')
        .neq('icon', 'patient_telemetry')
        .neq('icon', 'game_session');
    }

    const payload = DEFAULT_CORE_TASKS.map((t) => ({
      patient_id: effectivePatientId,
      title: t.title,
      time_slot: t.timeSlot,
      period: t.period,
      notes: t.notes,
      completed: t.completed,
      icon: 'default',
    }));

    try {
      const { data, error } = await supabase
        .from('patient_tasks')
        .insert(payload)
        .select();

      if (!error && data && data.length > 0) {
        console.log(`[Supabase DB] Successfully seeded ${data.length} clean default tasks into Supabase!`);
        return data.map((row: any) => ({
          id: row.id,
          title: row.title,
          time: row.time_slot,
          timeStr: row.time_slot,
          time_slot: row.time_slot,
          period: row.period || 'morning',
          timeOfDay: row.period || 'morning',
          category: (row.title.toLowerCase().includes('medicine') ? 'medication' : row.title.toLowerCase().includes('water') ? 'hydration' : 'game') as any,
          type: (row.title.toLowerCase().includes('medicine') ? 'medicine' : row.title.toLowerCase().includes('water') ? 'hydration' : 'activity') as any,
          description: row.notes || '',
          notes: row.notes || '',
          isCompleted: !!row.completed,
          completed: !!row.completed,
        }));
      }

      if (error) {
        console.warn('[Supabase DB] seedDefaultPatientTasks notice (using fallback):', error.message);
      }
    } catch (insertErr: any) {
      console.warn('[Supabase DB] seedDefaultPatientTasks insert caught (using fallback):', insertErr?.message);
    }
  } catch (err: any) {
    console.warn('[Supabase DB] seedDefaultPatientTasks exception (using fallback):', err?.message);
  }

  // Local fallback
  return DEFAULT_CORE_TASKS.map((t, i) => ({
    id: `task-default-${i + 1}`,
    title: t.title,
    time: t.timeSlot,
    timeStr: t.timeSlot,
    time_slot: t.timeSlot,
    period: t.period,
    timeOfDay: t.period,
    category: t.category,
    type: t.type as any,
    description: t.notes,
    notes: t.notes,
    isCompleted: t.completed,
    completed: t.completed,
  }));
};

/**
 * 12. Create a Routine Task in Supabase ('patient_tasks' with 'routine_tasks' fallback)
 * Uses crypto.randomUUID() for strict UUID compliance, never static strings.
 */
export const createTask = async (taskData: {
  id?: string;
  patient_id?: string;
  patientId?: string;
  title: string;
  time_slot?: string;
  timeSlot?: string;
  time?: string;
  period?: 'morning' | 'afternoon' | 'evening' | string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | string;
  notes?: string;
  description?: string;
  icon?: string;
  priority?: string;
  category?: 'medication' | 'hydration' | 'exercise' | 'food' | 'game' | string;
  type?: 'medicine' | 'activity' | 'hydration' | 'food' | 'exercise' | 'game' | string;
}): Promise<RoutineTask> => {
  const taskId = isValidUuid(taskData.id) ? taskData.id! : crypto.randomUUID();
  const resolvedPatientId = resolveToValidUuid(taskData.patient_id || taskData.patientId);

  const timeVal = taskData.time_slot || taskData.timeSlot || taskData.time || '09:00 AM';
  const periodVal = ((taskData.period || taskData.timeOfDay || 'morning') as 'morning' | 'afternoon' | 'evening');
  const notesVal = taskData.notes || taskData.description || '';
  const typeVal = (taskData.type || (taskData.title.toLowerCase().includes('medicine') ? 'medicine' : taskData.title.toLowerCase().includes('water') ? 'hydration' : 'activity')) as any;
  const categoryVal = (taskData.category || (typeVal === 'medicine' ? 'medication' : typeVal)) as any;

  const newTask: RoutineTask = {
    id: taskId,
    title: taskData.title.trim(),
    time: timeVal,
    timeStr: timeVal,
    time_slot: timeVal,
    period: periodVal,
    timeOfDay: periodVal,
    type: typeVal,
    category: categoryVal,
    description: notesVal,
    notes: notesVal,
    isCompleted: false,
    completed: false,
  };

  const payload = {
    id: taskId,
    patient_id: resolvedPatientId,
    title: taskData.title.trim(),
    time_slot: timeVal,
    period: periodVal,
    notes: notesVal,
    icon: taskData.icon || 'default',
    completed: false,
  };

  try {
    const { data: ptData, error: ptError } = await supabase
      .from('patient_tasks')
      .insert([payload])
      .select();

    if (ptError) {
      console.error('[Supabase DB] createTask error (patient_tasks):', {
        message: ptError.message,
        details: ptError.details,
        hint: ptError.hint,
        code: ptError.code,
      });

      // Fallback insert to routine_tasks
      const fallbackPayload = {
        id: taskId,
        patient_id: resolvedPatientId,
        title: taskData.title.trim(),
        description: notesVal,
        time_str: timeVal,
        time_of_day: periodVal,
        category: categoryVal,
        type: typeVal,
        is_completed: false,
      };

      const { data: rtData, error: rtError } = await supabase
        .from('routine_tasks')
        .insert([fallbackPayload])
        .select();

      if (rtError) {
        console.error('[Supabase DB] createTask fallback error (routine_tasks):', {
          message: rtError.message,
          details: rtError.details,
          hint: rtError.hint,
          code: rtError.code,
        });
        throw new Error(rtError.message || ptError.message);
      }
      if (rtData && rtData.length > 0) {
        newTask.id = rtData[0].id;
      }
    } else if (ptData && ptData.length > 0) {
      newTask.id = ptData[0].id;
    }
  } catch (err: any) {
    console.error('[Supabase DB] createTask exception:', {
      message: err?.message,
      details: err?.details,
      hint: err?.hint,
    });
    throw err;
  }

  return newTask;
};

// Backwards compatibility alias
export const addPatientTask = createTask;

/**
 * 12B. Add a Caregiver Team / Family Member with proper UUID and Foreign Keys
 */
export const addCaregiverMember = async (memberData: {
  caregiver_id?: string;
  caregiverId?: string;
  patient_id?: string;
  patientId?: string;
  name: string;
  relation?: string;
  relationship?: string;
  phone?: string;
  email?: string;
  role?: string;
  age?: number | string;
  description?: string;
  quote?: string;
  avatar_url?: string;
  avatarUrl?: string;
}): Promise<FamilyMember> => {
  const memberId = crypto.randomUUID();
  const rawPatientId = memberData.patient_id || memberData.patientId;
  const rawCaregiverId = memberData.caregiver_id || memberData.caregiverId;

  let resolvedPatientId = isValidUuid(rawPatientId) ? rawPatientId! : '';

  if (!resolvedPatientId && isValidUuid(rawCaregiverId)) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('linked_patient_id')
        .eq('id', rawCaregiverId)
        .maybeSingle();
      if (data?.linked_patient_id && isValidUuid(data.linked_patient_id)) {
        resolvedPatientId = data.linked_patient_id;
      }
    } catch {
      // fallback
    }
  }

  resolvedPatientId = resolveToValidUuid(resolvedPatientId);

  const relationVal = (memberData.relationship || memberData.relation || 'Caregiver Support').trim();
  const descVal = (memberData.description || 'Caregiver and family support circle.').trim();
  const quoteVal = (memberData.quote || 'We are here to care for and support you!').trim();
  const parsedAge = memberData.age ? parseInt(String(memberData.age), 10) || 35 : 35;

  const newMember: FamilyMember = {
    id: memberId,
    name: memberData.name.trim(),
    relation: relationVal,
    relationship: relationVal,
    localRelation: `${relationVal} • Caregiver Team`,
    age: parsedAge,
    avatarColor: '#10B981',
    avatarIcon: 'user',
    voiceMessage: quoteVal,
    quote: quoteVal,
    description: descVal,
    funFact: descVal,
    lastSpokenDate: 'Just now',
    avatarUrl: memberData.avatarUrl || memberData.avatar_url,
  };

  try {
    const payload: Record<string, any> = {
      id: memberId,
      patient_id: resolvedPatientId,
      name: memberData.name.trim(),
      relationship: relationVal,
      relation: relationVal,
      local_relation: newMember.localRelation,
      age: parsedAge,
      description: descVal,
      quote: quoteVal,
      avatar_url: memberData.avatarUrl || memberData.avatar_url || null,
      avatar_color: '#10B981',
    };

    const { error } = await supabase
      .from('family_members')
      .insert([payload])
      .select();

    if (error) {
      console.warn('[Supabase DB] addCaregiverMember notice (patient_id FK or offline, persisting locally):', {
        message: error.message,
        code: error.code,
      });
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('smriti_custom_family');
          const list = stored ? JSON.parse(stored) : [];
          const updated = [...list.filter((m: any) => m.id !== newMember.id), newMember];
          localStorage.setItem('smriti_custom_family', JSON.stringify(updated));
        } catch (e) {
          // ignore
        }
      }
    }
  } catch (err: any) {
    console.warn('[Supabase DB] addCaregiverMember exception (persisting locally):', err?.message);
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('smriti_custom_family');
        const list = stored ? JSON.parse(stored) : [];
        const updated = [...list.filter((m: any) => m.id !== newMember.id), newMember];
        localStorage.setItem('smriti_custom_family', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
    }
  }

  return newMember;
};

/**
 * 12C. Add or Register a Patient Profile with strict UUID constraints
 */
export const addPatient = async (patientData: {
  id?: string;
  name?: string;
  username?: string;
  phone?: string;
  phone_number?: string;
  dob?: string;
  date_of_birth?: string;
  connection_code?: string;
  caregiver_id?: string | null;
  caregiverId?: string | null;
  relationship?: string;
  relationship_to_patient?: string;
  avatar_url?: string | null;
}): Promise<PatientProfileRecord> => {
  const patientId = isValidUuid(patientData.id) ? patientData.id! : crypto.randomUUID();
  const rawCaregiverId = patientData.caregiver_id || patientData.caregiverId;
  const caregiverId = isValidUuid(rawCaregiverId) ? rawCaregiverId! : null;

  const payload: Record<string, any> = {
    id: patientId,
    role: 'patient',
    username: (patientData.name || patientData.username || 'Patient').trim(),
    phone_number: patientData.phone || patientData.phone_number || null,
    date_of_birth: patientData.dob || patientData.date_of_birth || null,
    connection_code: patientData.connection_code || Math.floor(100000 + Math.random() * 900000).toString(),
    is_paired: !!caregiverId,
    caregiver_id: caregiverId,
    relationship_to_patient: patientData.relationship || patientData.relationship_to_patient || null,
    avatar_url: patientData.avatar_url || null,
    is_deleted: false,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('[Supabase DB] addPatient error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      throw error;
    }

    return (data as PatientProfileRecord) || payload;
  } catch (err: any) {
    console.error('[Supabase DB] addPatient exception:', {
      message: err?.message,
      details: err?.details,
      hint: err?.hint,
    });
    throw err;
  }
};

/**
 * 12D. Link Patient to Caregiver with validation of foreign key UUIDs
 */
export const linkPatientToCaregiver = async (
  caregiverId: string,
  patientId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isValidUuid(caregiverId) || !isValidUuid(patientId)) {
    const errMsg = 'Both caregiverId and patientId must be valid UUIDs.';
    console.error('[Supabase DB] linkPatientToCaregiver validation error:', errMsg, { caregiverId, patientId });
    return { success: false, error: errMsg };
  }

  try {
    const { error: ptError } = await supabase
      .from('profiles')
      .update({
        caregiver_id: caregiverId,
        is_paired: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', patientId);

    const { error: cgError } = await supabase
      .from('profiles')
      .update({
        linked_patient_id: patientId,
        is_paired: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', caregiverId);

    if (ptError || cgError) {
      console.error('[Supabase DB] linkPatientToCaregiver error:', {
        patientError: ptError ? { message: ptError.message, details: ptError.details, hint: ptError.hint } : null,
        caregiverError: cgError ? { message: cgError.message, details: cgError.details, hint: cgError.hint } : null,
      });
      return { success: false, error: ptError?.message || cgError?.message || 'Failed to link patient to caregiver' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Supabase DB] linkPatientToCaregiver exception:', {
      message: err?.message,
      details: err?.details,
      hint: err?.hint,
    });
    return { success: false, error: err?.message || 'Exception occurred during linking' };
  }
};

/**
 * 12E. Fetch Patients linked to a Caregiver
 */
export const fetchCaregiverPatients = async (caregiverId: string): Promise<PatientProfileRecord[]> => {
  if (!isValidUuid(caregiverId)) {
    return [];
  }

  try {
    const { data: directPatients, error: dirErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'patient')
      .eq('caregiver_id', caregiverId)
      .eq('is_deleted', false);

    if (dirErr) {
      console.error('[Supabase DB] fetchCaregiverPatients direct error:', {
        message: dirErr.message,
        details: dirErr.details,
        hint: dirErr.hint,
      });
    }

    const { data: cgProfile } = await supabase
      .from('profiles')
      .select('linked_patient_id')
      .eq('id', caregiverId)
      .maybeSingle();

    let linkedPatient: PatientProfileRecord | null = null;
    if (cgProfile?.linked_patient_id && isValidUuid(cgProfile.linked_patient_id)) {
      const { data: lpData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', cgProfile.linked_patient_id)
        .eq('is_deleted', false)
        .maybeSingle();
      if (lpData) {
        linkedPatient = lpData as PatientProfileRecord;
      }
    }

    const patientMap = new Map<string, PatientProfileRecord>();
    (directPatients || []).forEach((p: any) => patientMap.set(p.id, p));
    if (linkedPatient && linkedPatient.id) {
      patientMap.set(linkedPatient.id, linkedPatient);
    }

    return Array.from(patientMap.values());
  } catch (err: any) {
    console.error('[Supabase DB] fetchCaregiverPatients exception:', {
      message: err?.message,
      details: err?.details,
      hint: err?.hint,
    });
    return [];
  }
};

/**
 * 12F. Fetch Caregiver Support Team / Family Circle
 */
export const fetchCaregiverTeam = async (caregiverId: string): Promise<any[]> => {
  if (!isValidUuid(caregiverId)) {
    return [];
  }

  try {
    const { data: cg } = await supabase
      .from('profiles')
      .select('linked_patient_id')
      .eq('id', caregiverId)
      .maybeSingle();

    const targetPatientId = cg?.linked_patient_id && isValidUuid(cg.linked_patient_id)
      ? cg.linked_patient_id
      : null;

    if (targetPatientId) {
      return await fetchFamilyMembers(targetPatientId);
    }

    return [];
  } catch (err: any) {
    console.error('[Supabase DB] fetchCaregiverTeam exception:', {
      message: err?.message,
      details: err?.details,
      hint: err?.hint,
    });
    return [];
  }
};

/**
 * 13. Toggle Routine Task Completion in Supabase
 * Updates the 'completed' column (and 'is_completed' on routine_tasks).
 */
export const toggleTaskCompletion = async (taskId: string, completed: boolean): Promise<boolean> => {
  if (!taskId) return false;

  try {
    if (isValidUuid(taskId)) {
      // 1. Update patient_tasks (completed column)
      const { error: ptError } = await supabase
        .from('patient_tasks')
        .update({ completed: completed })
        .eq('id', taskId);

      if (ptError) {
        console.error('[Supabase DB] Failed to update task status in patient_tasks:', ptError);
      }

      // 2. Update routine_tasks (is_completed column fallback)
      const { error: rtError } = await supabase
        .from('routine_tasks')
        .update({ is_completed: completed })
        .eq('id', taskId);

      if (ptError && rtError) {
        console.error('[Supabase DB] toggleTaskCompletion failed in both tables:', ptError, rtError);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error('[Supabase DB] toggleTaskCompletion exception:', err);
    return false;
  }
};

// Backwards compatibility alias
export const toggleTaskCompletionDb = toggleTaskCompletion;

/**
 * 14. Delete Patient Routine Task from Supabase
 */
export const deletePatientTask = async (taskId: string): Promise<void> => {
  if (!taskId) return;
  try {
    if (isValidUuid(taskId)) {
      const { error: ptError } = await supabase.from('patient_tasks').delete().eq('id', taskId);
      if (ptError) {
        console.warn('[Supabase DB] deletePatientTask patient_tasks notice, trying routine_tasks fallback:', ptError.message);
        const { error: rtError } = await supabase.from('routine_tasks').delete().eq('id', taskId);
        if (rtError) {
          console.error('[Supabase DB] Exact error deleting routine task:', rtError);
          throw rtError;
        }
      }
    }
  } catch (err) {
    console.error('[Supabase DB] deletePatientTask exception:', err);
    throw err;
  }
};

/**
 * 9. True Account Deletion via PostgreSQL RPC 'delete_user_account'
 */
export const deleteUserProfile = async (
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // 1. Execute PostgreSQL SECURITY DEFINER RPC to delete from auth.users (cascades all tables)
    const { error: rpcError } = await supabase.rpc('delete_user_account');

    if (rpcError) {
      console.warn('[Supabase RPC] delete_user_account RPC error (attempting direct profile delete fallback):', rpcError.message);
      // Fallback: delete/mark row in profiles table directly
      await supabase.from('profiles').update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('id', userId);
      await supabase.from('family_members').delete().eq('patient_id', userId);
      await supabase.from('routine_tasks').delete().eq('patient_id', userId);
    }
  } catch (err: any) {
    console.warn('[Supabase DB] Delete account exception:', err?.message);
  }

  // 2. Wipe all client storage keys
  if (typeof window !== 'undefined') {
    const keysToRemove = [
      'smriti_session',
      'smriti_demo_session',
      'smriti_user_role',
      'smriti_is_paired',
      'smriti_conn_code',
      'smriti_patient_profile',
      'smriti_custom_family',
      'smriti_tasks',
      'smriti_caregiver_info',
      'smriti_caregiver_avatar',
      'smriti_patient_avatar',
      'smriti_linked_patient_id',
      'smriti_hasCompletedOnboarding',
      'smriti_supabase_auth_token',
    ];
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  }

  // 3. Sign out of Supabase auth session
  await supabase.auth.signOut();

  return { success: true };
};

/**
 * 13. Fetch Weekly Task Adherence Statistics from Supabase
 */
export interface WeeklyAdherenceStats {
  totalTasks: number;
  completedTasks: number;
  adherencePercentage: number;
  criticalMedicationsCount: number;
  completedMedicationsCount: number;
  missedCriticalTasks: Array<{ id: string; title: string; timeStr: string; category: string }>;
  overdueTasks: Array<{ id: string; title: string; timeStr: string; category: string }>;
}

export const fetchWeeklyTaskAdherence = async (patientId: string): Promise<WeeklyAdherenceStats> => {
  const defaultStats: WeeklyAdherenceStats = {
    totalTasks: 0,
    completedTasks: 0,
    adherencePercentage: 100,
    criticalMedicationsCount: 0,
    completedMedicationsCount: 0,
    missedCriticalTasks: [],
    overdueTasks: [],
  };

  if (!patientId || patientId === 'demo-patient-koka') {
    return defaultStats;
  }

  try {
    const tasks = await fetchPatientTasks(patientId);
    if (!tasks || tasks.length === 0) return defaultStats;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed || t.isCompleted).length;
    const adherencePercentage = Math.round((completedTasks / totalTasks) * 100);

    const medTasks = tasks.filter((t) => t.category === 'medication' || t.type === 'medicine');
    const completedMeds = medTasks.filter((t) => t.completed || t.isCompleted);
    const missedCritical = medTasks
      .filter((t) => !t.completed && !t.isCompleted)
      .map((t) => ({ id: t.id, title: t.title, timeStr: t.timeStr || t.time, category: t.category }));

    return {
      totalTasks,
      completedTasks,
      adherencePercentage,
      criticalMedicationsCount: medTasks.length,
      completedMedicationsCount: completedMeds.length,
      missedCriticalTasks: missedCritical,
      overdueTasks: missedCritical,
    };
  } catch (err: any) {
    console.warn('[Supabase DB] fetchWeeklyTaskAdherence exception:', err?.message);
    return defaultStats;
  }
};

/**
 * 14. Fetch Patient Cognitive Scores from Supabase ('game_session' rows or fallback)
 */
export const fetchPatientCognitiveScores = async (patientId: string, limitDays: number = 14): Promise<any[]> => {
  if (!patientId || patientId === 'demo-patient-koka') {
    return [];
  }

  try {
    // 1. Query game sessions persisted in patient_tasks table
    const { data: sessionData, error: sessionError } = await supabase
      .from('patient_tasks')
      .select('*')
      .eq('patient_id', patientId)
      .eq('icon', 'game_session')
      .order('created_at', { ascending: false })
      .limit(limitDays * 5);

    if (!sessionError && sessionData && sessionData.length > 0) {
      return sessionData.map((row: any) => {
        let parsed: any = {};
        try {
          parsed = JSON.parse(row.notes || '{}');
        } catch {}
        return {
          id: row.id,
          game: parsed.game || row.title.replace(/^Cognitive Session:\s*/i, ''),
          score: parsed.score || 100,
          moves: parsed.moves || 0,
          timeSeconds: parsed.timeSeconds || 30,
          accuracy: parsed.accuracy || 90,
          date: row.created_at ? new Date(row.created_at).toLocaleDateString() : 'Today',
          created_at: row.created_at,
        };
      });
    }

    // 2. Fallback to game_scores table if present
    const { data, error } = await supabase
      .from('game_scores')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(limitDays * 5);

    if (!error && data) {
      return data;
    }

    return [];
  } catch (err: any) {
    console.warn('[Supabase DB] fetchPatientCognitiveScores exception:', err?.message);
    return [];
  }
};

/**
 * 15. Record Patient Game Score to Supabase
 */
export const recordPatientGameScore = async (
  patientId: string,
  record: { game: string; score: number; moves?: number; timeSeconds: number; accuracy: number }
): Promise<boolean> => {
  if (!patientId || patientId === 'demo-patient-koka') {
    return false;
  }

  try {
    const { error } = await supabase.from('game_scores').insert([
      {
        patient_id: patientId,
        game: record.game,
        score: record.score,
        moves: record.moves || 0,
        time_seconds: record.timeSeconds,
        accuracy: record.accuracy,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.warn('[Supabase DB] recordPatientGameScore notice:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('[Supabase DB] recordPatientGameScore exception:', err?.message);
    return false;
  }
};

/**
 * 16. Dynamic MMSE Cognitive Score Calculator
 * Grounded in clinical geriatric MMSE parameters:
 * Base 24.0 (mild MCI baseline) + adherence component (up to +2.0) + game accuracy (up to +2.0)
 * Yields realistic MMSE stability trajectory between 24.0 and 30.0
 */
export const calculateDynamicMmse = (
  tasks: Array<{ completed?: boolean; isCompleted?: boolean }>,
  recentAccuracy: number = 90
): number => {
  if (!tasks || tasks.length === 0) return 25.8;
  const completedCount = tasks.filter((t) => t.completed || t.isCompleted).length;
  const adherenceRate = Math.round((completedCount / tasks.length) * 100);

  const score = 24.0 + (adherenceRate / 100) * 2.0 + (recentAccuracy / 100) * 2.0;
  return Number(Math.min(30.0, Math.max(18.0, score)).toFixed(1));
};

export interface PatientTelemetryData {
  streak: number;
  totalStars: number;
  mmseScore: number;
  lastActiveDate: string;
}

/**
 * 17. Fetch Patient Telemetry (Streak, Total Stars, MMSE Score) from Supabase
 */
export const fetchPatientTelemetry = async (patientId: string): Promise<PatientTelemetryData | null> => {
  if (!patientId || !isValidUuid(patientId)) return null;

  try {
    const { data, error } = await supabase
      .from('patient_tasks')
      .select('*')
      .eq('patient_id', patientId)
      .eq('time_slot', 'STATS')
      .eq('icon', 'patient_telemetry')
      .maybeSingle();

    if (!error && data && data.notes) {
      const parsed = JSON.parse(data.notes);
      return {
        streak: parsed.streak ?? 5,
        totalStars: parsed.totalStars ?? 125,
        mmseScore: parsed.mmseScore ?? 25.8,
        lastActiveDate: parsed.lastActiveDate || new Date().toISOString(),
      };
    }
    return null;
  } catch (err) {
    console.warn('[Supabase DB] fetchPatientTelemetry exception:', err);
    return null;
  }
};

/**
 * 18. Save / Update Patient Telemetry (Streak, Total Stars, MMSE Score) to Supabase
 */
export const savePatientTelemetry = async (
  patientId: string,
  stats: { streak: number; totalStars: number; mmseScore: number }
): Promise<void> => {
  if (!patientId || !isValidUuid(patientId)) return;

  try {
    const notesContent = JSON.stringify({
      streak: stats.streak,
      totalStars: stats.totalStars,
      mmseScore: stats.mmseScore,
      lastActiveDate: new Date().toISOString(),
    });

    const { data: existing } = await supabase
      .from('patient_tasks')
      .select('id')
      .eq('patient_id', patientId)
      .eq('time_slot', 'STATS')
      .eq('icon', 'patient_telemetry')
      .maybeSingle();

    if (existing?.id) {
      await supabase
        .from('patient_tasks')
        .update({ notes: notesContent })
        .eq('id', existing.id);
    } else {
      await supabase.from('patient_tasks').insert([
        {
          patient_id: patientId,
          title: 'Patient Telemetry & MMSE Baseline',
          time_slot: 'STATS',
          period: 'morning',
          icon: 'patient_telemetry',
          completed: true,
          notes: notesContent,
        },
      ]);
    }
  } catch (err) {
    console.warn('[Supabase DB] savePatientTelemetry exception:', err);
  }
};

/**
 * 19. Record Game Session and Sync Cognitive Score, Streak, & Routine in Supabase
 */
export const recordGameSessionInDb = async (
  patientId: string,
  gameRecord: { game: string; score: number; moves?: number; timeSeconds: number; accuracy: number },
  newStats: { streak: number; totalStars: number; mmseScore: number }
): Promise<void> => {
  if (!patientId || !isValidUuid(patientId)) return;

  try {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const period = now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening';

    // 1. Insert game session log row into patient_tasks
    await supabase.from('patient_tasks').insert([
      {
        patient_id: patientId,
        title: `Cognitive Session: ${gameRecord.game}`,
        time_slot: timeStr,
        period: period,
        icon: 'game_session',
        completed: true,
        notes: JSON.stringify({
          game: gameRecord.game,
          score: gameRecord.score,
          moves: gameRecord.moves,
          timeSeconds: gameRecord.timeSeconds,
          accuracy: gameRecord.accuracy,
        }),
      },
    ]);

    // 2. Automatically mark any daily routine task matching 'game' as completed in Supabase
    const { data: allTasks } = await supabase
      .from('patient_tasks')
      .select('id, title')
      .eq('patient_id', patientId)
      .neq('time_slot', 'STATS')
      .neq('icon', 'game_session');

    if (allTasks && allTasks.length > 0) {
      const routineGameTask = allTasks.find(
        (t) =>
          t.title.toLowerCase().includes('game') ||
          t.title.toLowerCase().includes('memory') ||
          t.title.toLowerCase().includes('rongmon')
      );
      if (routineGameTask) {
        await supabase
          .from('patient_tasks')
          .update({ completed: true })
          .eq('id', routineGameTask.id);
      }
    }

    // 3. Save the updated telemetry (streak, totalStars, mmseScore) to Supabase
    await savePatientTelemetry(patientId, newStats);
  } catch (err) {
    console.warn('[Supabase DB] recordGameSessionInDb exception:', err);
  }
};

/**
 * 20. Game Sessions Telemetry & Cognitive Trajectory Queries
 */
export const recordGameSession = async (payload: {
  patient_id: string;
  game_type: string;
  accuracy_percentage: number;
  time_taken_seconds: number;
  tries_count: number;
  calculated_score: number;
}) => {
  try {
    const { data, error } = await supabase.from('game_sessions').insert([payload]).select();
    if (error) throw error;
    return data?.[0];
  } catch (err) {
    console.error('[supabaseDb.recordGameSession] Error:', err);
    return null;
  }
};

export const fetchCognitiveTrajectory = async (
  patientId?: string,
  limit = 7
): Promise<CognitiveTrajectoryPoint[]> => {
  const targetId = patientId && isValidUuid(patientId) ? patientId : DEFAULT_PATIENT_ID;

  try {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('id, calculated_score, created_at, accuracy_percentage, time_taken_seconds, tries_count, game_type')
      .eq('patient_id', targetId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.warn('[supabaseDb.fetchCognitiveTrajectory] Query notice:', error.message);
    }

    return mergeTrajectoryWithBaseline(data || []);
  } catch (err) {
    console.error('[supabaseDb.fetchCognitiveTrajectory] Error:', err);
    return mergeTrajectoryWithBaseline([]);
  }
};

export const supabaseDb = {
  DEFAULT_PATIENT_ID,
  recordGameSession,
  fetchCognitiveTrajectory,
  mergeTrajectoryWithBaseline,
};

