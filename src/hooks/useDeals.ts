import { useState, useEffect } from 'react';
import { Deal } from '../types';

const DEALS_STORAGE_KEY = 'crm_deals_data';

/**
 * Хук для работы со сделками
 * Предоставляет методы для получения сделок, связанных с записями справочников
 */
export const useDeals = () => {
  const [deals, setDeals] = useState<Deal[]>([]);

  // Загрузка сделок из localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DEALS_STORAGE_KEY);
      if (stored) {
        setDeals(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load deals from localStorage:', error);
    }
  }, []);

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
   * @param entryId - ID записи справочника
   * @returns Массив связанных сделок
   */
  const getDealsForEntry = (entryId: string): Deal[] => {
    // Получаем все значения полей сделок из localStorage
    const dealFields: Record<string, Record<string, string | string[]>> = {};

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('crm_deal_values_')) {
        const dealId = key.replace('crm_deal_values_', '');
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
  };

  /**
   * Обновить список сделок (например, из другого источника)
   * @param newDeals - Новый массив сделок
   */
  const updateDeals = (newDeals: Deal[]) => {
    setDeals(newDeals);
  };

  return {
    deals,
    getDealsForEntry,
    updateDeals,
  };
};
