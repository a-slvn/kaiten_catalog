import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Catalog, CatalogEntry } from '../types';

interface CatalogsContextType {
  // Каталоги (схемы)
  catalogs: Catalog[];
  addCatalog: (catalog: Omit<Catalog, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateCatalog: (id: string, updates: Partial<Omit<Catalog, 'id' | 'createdAt'>>) => void;
  deleteCatalog: (id: string) => void;
  getCatalog: (id: string) => Catalog | undefined;

  // Записи каталогов
  entries: CatalogEntry[];
  addEntry: (entry: Omit<CatalogEntry, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateEntry: (id: string, updates: Partial<Omit<CatalogEntry, 'id' | 'createdAt'>>) => void;
  deleteEntry: (id: string) => void;
  getEntry: (id: string) => CatalogEntry | undefined;
  getEntriesByCatalog: (catalogId: string) => CatalogEntry[];
}

const CatalogsContext = createContext<CatalogsContextType | undefined>(undefined);

export const useCatalogs = () => {
  const context = useContext(CatalogsContext);
  if (!context) {
    throw new Error('useCatalogs must be used within a CatalogsProvider');
  }
  return context;
};

interface CatalogsProviderProps {
  children: ReactNode;
}

const CATALOGS_STORAGE_KEY = 'crm_catalogs';
const ENTRIES_STORAGE_KEY = 'crm_catalog_entries';

export const CatalogsProvider = ({ children }: CatalogsProviderProps) => {
  // Инициализация каталогов из localStorage
  const [catalogs, setCatalogs] = useState<Catalog[]>(() => {
    try {
      const stored = localStorage.getItem(CATALOGS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load catalogs from localStorage:', error);
      return [];
    }
  });

  // Инициализация записей из localStorage
  const [entries, setEntries] = useState<CatalogEntry[]>(() => {
    try {
      const stored = localStorage.getItem(ENTRIES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load catalog entries from localStorage:', error);
      return [];
    }
  });

  // Сохранение каталогов в localStorage при изменении
  useEffect(() => {
    try {
      localStorage.setItem(CATALOGS_STORAGE_KEY, JSON.stringify(catalogs));
    } catch (error) {
      console.error('Failed to save catalogs to localStorage:', error);
    }
  }, [catalogs]);

  // Сохранение записей в localStorage при изменении
  useEffect(() => {
    try {
      localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to save catalog entries to localStorage:', error);
    }
  }, [entries]);

  // ============================================
  // CRUD операции для каталогов
  // ============================================

  const addCatalog = useCallback((
    catalog: Omit<Catalog, 'id' | 'createdAt' | 'updatedAt'>
  ): string => {
    const now = new Date().toISOString();
    const newCatalog: Catalog = {
      ...catalog,
      id: `catalog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };

    setCatalogs((prev) => [...prev, newCatalog]);
    return newCatalog.id;
  }, []);

  const updateCatalog = useCallback((
    id: string,
    updates: Partial<Omit<Catalog, 'id' | 'createdAt'>>
  ) => {
    setCatalogs((prev) =>
      prev.map((catalog) =>
        catalog.id === id
          ? { ...catalog, ...updates, updatedAt: new Date().toISOString() }
          : catalog
      )
    );
  }, []);

  const deleteCatalog = useCallback((id: string) => {
    setCatalogs((prev) => prev.filter((catalog) => catalog.id !== id));
    // Также удаляем все записи этого каталога
    setEntries((prev) => prev.filter((entry) => entry.catalogId !== id));
  }, []);

  const getCatalog = useCallback((id: string): Catalog | undefined => {
    return catalogs.find((catalog) => catalog.id === id);
  }, [catalogs]);

  // ============================================
  // CRUD операции для записей каталогов
  // ============================================

  const addEntry = useCallback((
    entry: Omit<CatalogEntry, 'id' | 'createdAt' | 'updatedAt'>
  ): string => {
    const now = new Date().toISOString();
    const newEntry: CatalogEntry = {
      ...entry,
      id: `catentry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };

    setEntries((prev) => [...prev, newEntry]);
    return newEntry.id;
  }, []);

  const updateEntry = useCallback((
    id: string,
    updates: Partial<Omit<CatalogEntry, 'id' | 'createdAt'>>
  ) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? { ...entry, ...updates, updatedAt: new Date().toISOString() }
          : entry
      )
    );
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const getEntry = useCallback((id: string): CatalogEntry | undefined => {
    return entries.find((entry) => entry.id === id);
  }, [entries]);

  const getEntriesByCatalog = useCallback((catalogId: string): CatalogEntry[] => {
    return entries.filter((entry) => entry.catalogId === catalogId);
  }, [entries]);

  return (
    <CatalogsContext.Provider
      value={{
        catalogs,
        addCatalog,
        updateCatalog,
        deleteCatalog,
        getCatalog,
        entries,
        addEntry,
        updateEntry,
        deleteEntry,
        getEntry,
        getEntriesByCatalog,
      }}
    >
      {children}
    </CatalogsContext.Provider>
  );
};
