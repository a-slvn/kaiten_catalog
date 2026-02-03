import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Deal } from '../types';
import { initialColumns } from '../data/mockData';

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

const DEALS_STORAGE_KEY = 'crm_deals_data';
const DEAL_VALUES_PREFIX = 'crm_deal_values_';

export const DealsProvider = ({ children }: DealsProviderProps) => {
  // Инициализация сделок из localStorage или mock данных
  const [deals, setDeals] = useState<Deal[]>(() => {
    try {
      const stored = localStorage.getItem(DEALS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      // Если данных нет, используем моковые данные
      return initialColumns.flatMap(col => col.deals);
    } catch (error) {
      console.error('Failed to load deals from localStorage:', error);
      return initialColumns.flatMap(col => col.deals);
    }
  });

  // Сохранение сделок в localStorage
  useEffect(() => {
    try {
      localStorage.setItem(DEALS_STORAGE_KEY, JSON.stringify(deals));
    } catch (error) {
      console.error('Failed to save deals to localStorage:', error);
    }
  }, [deals]);

  /**
   * Получить сделки, связанные с записью справочника
   */
  const getDealsForEntry = useCallback((entryId: string): Deal[] => {
    // Получаем все значения полей сделок из localStorage
    const dealFields: Record<string, Record<string, string | string[]>> = {};

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(DEAL_VALUES_PREFIX)) {
        const dealId = key.replace(DEAL_VALUES_PREFIX, '');
        try {
          const values = JSON.parse(localStorage.getItem(key) || '{}');
          dealFields[dealId] = values;
        } catch (error) {
          console.error(`Failed to parse deal values for ${dealId}:`, error);
        }
      }
    });

    // Фильтруем сделки, которые ссылаются на нашу запись
    return deals.filter((deal) => {
      const values = dealFields[deal.id];
      if (!values) return false;

      // Проверяем, есть ли в значениях ссылка на нашу запись
      return Object.values(values).some((value) => {
        if (Array.isArray(value)) {
          return value.includes(entryId);
        }
        return value === entryId;
      });
    });
  }, [deals]);

  /**
   * Получить сделки, связанные с записью или её связанными записями (например, контактами компании)
   * Используется для показа сделок компании через её контакты
   */
  const getDealsForEntryWithLinked = useCallback((entryId: string, linkedEntryIds: string[]): Deal[] => {
    // Получаем все значения полей сделок из localStorage
    const dealFields: Record<string, Record<string, string | string[]>> = {};

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(DEAL_VALUES_PREFIX)) {
        const dealId = key.replace(DEAL_VALUES_PREFIX, '');
        try {
          const values = JSON.parse(localStorage.getItem(key) || '{}');
          dealFields[dealId] = values;
        } catch (error) {
          console.error(`Failed to parse deal values for ${dealId}:`, error);
        }
      }
    });

    // Собираем все ID для поиска: основная запись + связанные
    const allEntryIds = [entryId, ...linkedEntryIds];

    // Фильтруем сделки, которые ссылаются на любую из записей
    const matchedDeals = deals.filter((deal) => {
      const values = dealFields[deal.id];
      if (!values) return false;

      // Проверяем, есть ли в значениях ссылка на любую из наших записей
      return Object.values(values).some((value) => {
        if (Array.isArray(value)) {
          return allEntryIds.some((id) => value.includes(id));
        }
        return allEntryIds.includes(value);
      });
    });

    // Убираем дубликаты (сделка может ссылаться на компанию и контакт одновременно)
    const uniqueDeals = Array.from(new Map(matchedDeals.map((deal) => [deal.id, deal])).values());

    return uniqueDeals;
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
