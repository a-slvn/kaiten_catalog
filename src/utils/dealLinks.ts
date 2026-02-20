import { Deal } from '../types';

export const DEALS_STORAGE_KEY = 'crm_deals_data';
export const DEAL_VALUES_PREFIX = 'crm_deal_values_';

type DealValueMap = Record<string, unknown>;
type DealFieldsByDealId = Record<string, DealValueMap>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const uniqueDealsById = (deals: Deal[]): Deal[] =>
  Array.from(new Map(deals.map((deal) => [deal.id, deal])).values());

const referencesAnyEntry = (value: unknown, entryIdSet: Set<string>): boolean => {
  if (Array.isArray(value)) {
    return value.some((item) => typeof item === 'string' && entryIdSet.has(item));
  }

  return typeof value === 'string' && entryIdSet.has(value);
};

export const readDealsFromStorage = (fallbackDeals: Deal[] = []): Deal[] => {
  try {
    const stored = localStorage.getItem(DEALS_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Deal[]) : fallbackDeals;
  } catch (error) {
    console.error('Failed to load deals from localStorage:', error);
    return fallbackDeals;
  }
};

export const writeDealsToStorage = (deals: Deal[]): void => {
  try {
    localStorage.setItem(DEALS_STORAGE_KEY, JSON.stringify(deals));
  } catch (error) {
    console.error('Failed to save deals to localStorage:', error);
  }
};

const readDealFieldsFromStorage = (): DealFieldsByDealId => {
  const dealFields: DealFieldsByDealId = {};

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key || !key.startsWith(DEAL_VALUES_PREFIX)) {
      continue;
    }

    const dealId = key.slice(DEAL_VALUES_PREFIX.length);
    const rawValues = localStorage.getItem(key);
    if (!rawValues) {
      continue;
    }

    try {
      const parsed = JSON.parse(rawValues);
      dealFields[dealId] = isRecord(parsed) ? parsed : {};
    } catch (error) {
      console.error(`Failed to parse deal values for ${dealId}:`, error);
      dealFields[dealId] = {};
    }
  }

  return dealFields;
};

export const getDealsForEntryIds = (deals: Deal[], entryIds: string[]): Deal[] => {
  if (deals.length === 0 || entryIds.length === 0) {
    return [];
  }

  const entryIdSet = new Set(entryIds);
  const dealFields = readDealFieldsFromStorage();

  const matchedDeals = deals.filter((deal) => {
    const values = dealFields[deal.id];
    if (!values) {
      return false;
    }

    return Object.values(values).some((value) => referencesAnyEntry(value, entryIdSet));
  });

  return uniqueDealsById(matchedDeals);
};
