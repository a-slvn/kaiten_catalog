import { useState, useEffect, useCallback } from 'react';
import { Deal } from '../types';
import { getDealsForEntryIds, readDealsFromStorage, writeDealsToStorage } from '../utils/dealLinks';

/**
 * Хук для работы со сделками
 * Предоставляет методы для получения сделок, связанных с записями справочников
 */
export const useDeals = () => {
  const [deals, setDeals] = useState<Deal[]>(() => readDealsFromStorage());

  // Сохранение сделок в localStorage
  useEffect(() => {
    writeDealsToStorage(deals);
  }, [deals]);

  /**
   * Получить сделки, связанные с записью справочника
   * @param entryId - ID записи справочника
   * @returns Массив связанных сделок
   */
  const getDealsForEntry = useCallback((entryId: string): Deal[] => {
    return getDealsForEntryIds(deals, [entryId]);
  }, [deals]);

  /**
   * Обновить список сделок (например, из другого источника)
   * @param newDeals - Новый массив сделок
   */
  const updateDeals = useCallback((newDeals: Deal[]) => {
    setDeals(newDeals);
  }, []);

  return {
    deals,
    getDealsForEntry,
    updateDeals,
  };
};
