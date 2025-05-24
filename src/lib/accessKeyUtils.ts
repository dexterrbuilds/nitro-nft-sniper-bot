
// Access key utilities for validation and device fingerprinting

export interface AccessKey {
  id: string;
  key: string;
  deviceId: string | null;
  expiresAt: number;
  createdAt: number;
  isActive: boolean;
  keyType: 'basic' | 'premium' | 'unlimited';
  maxTransactions?: number;
  usedTransactions: number;
}

// Generate device fingerprint (simplified version for demo)
export const getDeviceFingerprint = async (): Promise<string> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
};

// Validate access key against stored keys
export const validateAccessKey = async (inputKey: string, deviceId: string): Promise<boolean> => {
  const storedKeys = getStoredAccessKeys();
  const key = storedKeys.find(k => k.key === inputKey && k.isActive);
  
  if (!key) {
    return false;
  }
  
  // Check if key is expired
  if (Date.now() > key.expiresAt) {
    return false;
  }
  
  // Check device binding
  if (key.deviceId && key.deviceId !== deviceId) {
    console.log('Device mismatch:', key.deviceId, 'vs', deviceId);
    return false;
  }
  
  // Bind to device if not already bound
  if (!key.deviceId) {
    key.deviceId = deviceId;
    updateStoredAccessKey(key);
  }
  
  return true;
};

// Get stored access keys (demo implementation using localStorage)
export const getStoredAccessKeys = (): AccessKey[] => {
  const keys = localStorage.getItem('nitro-access-keys');
  if (!keys) {
    // Initialize with demo keys for testing
    const defaultKeys: AccessKey[] = [
      {
        id: '1',
        key: 'NITRO-DEMO-2024',
        deviceId: null,
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: Date.now(),
        isActive: true,
        keyType: 'basic',
        maxTransactions: 100,
        usedTransactions: 0
      }
    ];
    localStorage.setItem('nitro-access-keys', JSON.stringify(defaultKeys));
    return defaultKeys;
  }
  return JSON.parse(keys);
};

// Update a specific access key
export const updateStoredAccessKey = (updatedKey: AccessKey): void => {
  const keys = getStoredAccessKeys();
  const index = keys.findIndex(k => k.id === updatedKey.id);
  if (index !== -1) {
    keys[index] = updatedKey;
    localStorage.setItem('nitro-access-keys', JSON.stringify(keys));
  }
};

// Generate new access key
export const generateAccessKey = (keyType: 'basic' | 'premium' | 'unlimited' = 'basic'): AccessKey => {
  const keyId = Math.random().toString(36).substr(2, 9).toUpperCase();
  const keyValue = `NITRO-${keyType.toUpperCase()}-${keyId}`;
  
  const expirationDays = keyType === 'basic' ? 30 : keyType === 'premium' ? 90 : 365;
  const maxTransactions = keyType === 'basic' ? 100 : keyType === 'premium' ? 500 : undefined;
  
  return {
    id: Date.now().toString(),
    key: keyValue,
    deviceId: null,
    expiresAt: Date.now() + (expirationDays * 24 * 60 * 60 * 1000),
    createdAt: Date.now(),
    isActive: true,
    keyType,
    maxTransactions,
    usedTransactions: 0
  };
};

// Save new access key
export const saveAccessKey = (key: AccessKey): void => {
  const keys = getStoredAccessKeys();
  keys.push(key);
  localStorage.setItem('nitro-access-keys', JSON.stringify(keys));
};

// Delete access key
export const deleteAccessKey = (keyId: string): void => {
  const keys = getStoredAccessKeys();
  const filteredKeys = keys.filter(k => k.id !== keyId);
  localStorage.setItem('nitro-access-keys', JSON.stringify(filteredKeys));
};

// Check if user has transaction quota
export const checkTransactionQuota = (userKey: string): boolean => {
  const keys = getStoredAccessKeys();
  const key = keys.find(k => k.key === userKey);
  
  if (!key || !key.isActive) return false;
  if (key.maxTransactions === undefined) return true; // Unlimited
  
  return key.usedTransactions < key.maxTransactions;
};

// Increment transaction usage
export const incrementTransactionUsage = (userKey: string): void => {
  const keys = getStoredAccessKeys();
  const key = keys.find(k => k.key === userKey);
  
  if (key) {
    key.usedTransactions += 1;
    updateStoredAccessKey(key);
  }
};
