// Cliente Supabase RAW - usando fetch direto
// Bypassa completamente o client JS

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://rnpgtwughapxxvvckepd.supabase.co";
const SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Cliente RAW - URL:', SUPABASE_URL);
console.log('🔧 Cliente RAW - Service Key disponível:', !!SERVICE_KEY);

export const rawSupabaseQuery = async (table: string, options: {
  select?: string;
  eq?: Record<string, any>;
  limit?: number;
  single?: boolean;
}) => {
  if (!SERVICE_KEY) {
    throw new Error('Service key não encontrada');
  }

  let url = `${SUPABASE_URL}/rest/v1/${table}`;
  const params = new URLSearchParams();

  if (options.select) {
    params.append('select', options.select);
  }

  if (options.eq) {
    Object.entries(options.eq).forEach(([key, value]) => {
      params.append(key, `eq.${value}`);
    });
  }

  if (options.limit) {
    params.append('limit', options.limit.toString());
  }

  if (params.toString()) {
    url += '?' + params.toString();
  }

  // console.log('🌐 RAW Query URL:', url); // Log removido para performance

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'apikey': SERVICE_KEY,
      'authorization': `Bearer ${SERVICE_KEY}`,
      'content-type': 'application/json',
      'accept': 'application/json'
    }
  });

  // console.log('📊 RAW Response Status:', response.status); // Log removido para performance

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ RAW Error:', response.status, errorText);
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  // console.log('✅ RAW Success:', data); // Log removido para performance

  if (options.single && Array.isArray(data)) {
    if (data.length === 0) {
      throw new Error('No rows found');
    }
    return data[0];
  }

  return data;
};

export const rawSupabaseInsert = async (table: string, data: any) => {
  if (!SERVICE_KEY) {
    throw new Error('Service key não encontrada');
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  console.log('🌐 RAW Insert URL:', url);
  console.log('📝 RAW Insert Data:', data);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'authorization': `Bearer ${SERVICE_KEY}`,
      'content-type': 'application/json',
      'accept': 'application/json',
      'prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });

  console.log('📊 RAW Insert Status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ RAW Insert Error:', response.status, errorText);
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ RAW Insert Success:', result);
  return result;
};

export const rawSupabaseUpdate = async (table: string, data: any, where: Record<string, any>) => {
  if (!SERVICE_KEY) {
    throw new Error('Service key não encontrada');
  }

  let url = `${SUPABASE_URL}/rest/v1/${table}`;
  const params = new URLSearchParams();

  // Adicionar condições WHERE
  Object.entries(where).forEach(([key, value]) => {
    params.append(key, `eq.${value}`);
  });

  if (params.toString()) {
    url += '?' + params.toString();
  }

  console.log('🌐 RAW Update URL:', url);
  console.log('📝 RAW Update Data:', data);

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': SERVICE_KEY,
      'authorization': `Bearer ${SERVICE_KEY}`,
      'content-type': 'application/json',
      'accept': 'application/json',
      'prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });

  console.log('📊 RAW Update Status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ RAW Update Error:', response.status, errorText);
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ RAW Update Success:', result);
  return result;
};

export const rawSupabaseDelete = async (table: string, where: Record<string, any>) => {
  if (!SERVICE_KEY) {
    throw new Error('Service key não encontrada');
  }

  let url = `${SUPABASE_URL}/rest/v1/${table}`;
  const params = new URLSearchParams();

  // Adicionar condições WHERE
  Object.entries(where).forEach(([key, value]) => {
    params.append(key, `eq.${value}`);
  });

  if (params.toString()) {
    url += '?' + params.toString();
  }

  console.log('🌐 RAW Delete URL:', url);

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'apikey': SERVICE_KEY,
      'authorization': `Bearer ${SERVICE_KEY}`,
      'content-type': 'application/json',
      'accept': 'application/json'
    }
  });

  console.log('📊 RAW Delete Status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ RAW Delete Error:', response.status, errorText);
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  console.log('✅ RAW Delete Success');
  return true;
};
