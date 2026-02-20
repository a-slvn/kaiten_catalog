import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Deal } from '../types';
import { initialColumns } from '../data/mockData';
import { getDealsForEntryIds, readDealsFromStorage, writeDealsToStorage } from '../utils/dealLinks';

interface DealsContextType {
  deals: Deal[];
  getDealsForEntry: (entryId: string) => Deal[];
  getDealsForEntryWithLinked: (entryId: string, linkedEntryIds: string[]) => Deal[];
  updateDeals: (deals: Deal[]) => void;
}

const DealsContext = createContext<DealsContextType | undefined>(undefined);

export const useDealsContext = () => {
  const context = useContext(DealsContext);
  if (!context) {
    throw new Error('useDealsContext must be used within a DealsProvider');
  }
  return context;
};

interface DealsProviderProps {
  children: ReactNode;
}

const INITIAL_DEALS = initialColumns.flatMap((column) => column.deals);

export const DealsProvider = ({ children }: DealsProviderProps) => {
  // Инициализация сделок из localStorage или mock данных
  const [deals, setDeals] = useState<Deal[]>(() => readDealsFromStorage(INITIAL_DEALS));

  // Сохранение сделок в localStorage
  useEffect(() => {
    writeDealsToStorage(deals);
  }, [deals]);

  /**
   * Получить сделки, связанные с записью справочника
   */
  const getDealsForEntry = useCallback((entryId: string): Deal[] => {
    return getDealsForEntryIds(deals, [entryId]);
  }, [deals]);

  /**
   * Получить сделки, связанные с записью или её связанными записями (например, контактами компании)
   * Используется для показа сделок компании через её контакты
   */
  const getDealsForEntryWithLinked = useCallback((entryId: string, linkedEntryIds: string[]): Deal[] => {
    return getDealsForEntryIds(deals, [entryId, ...linkedEntryIds]);
  }, [deals]);

  /**
   * Обновить список сделок
   */
  const updateDeals = useCallback((newDeals: Deal[]) => {
    setDeals(newDeals);
  }, []);

  return (
    <DealsContext.Provider
      value={{
        deals,
        getDealsForEntry,
        getDealsForEntryWithLinked,
        updateDeals,
      }}
    >
      {children}
    </DealsContext.Provider>
  );
};
