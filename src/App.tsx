import { useRef, useState, useEffect } from 'react';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import { TopBar } from './components/TopBar';
import { KanbanBoard, KanbanBoardHandle } from './components/KanbanBoard';
import { CustomFieldsPage } from './components/CustomFieldsPage';
import { CatalogsPage } from './components/CatalogsPage';
import { CatalogDetailPage } from './components/CatalogDetailPage';
import { DealModal } from './components/DealModal';
import { CustomFieldsProvider } from './context/CustomFieldsContext';
import { ReferenceEntriesProvider } from './context/ReferenceEntriesContext';
import { CatalogsProvider } from './context/CatalogsContext';
import { DealsProvider, useDealsContext } from './context/DealsContext';
import { initialColumns } from './data/mockData';
import { theme } from './theme/theme';

const parseHashDealId = (): string | null => {
  const match = window.location.hash.match(/^#deal=(.+)$/);
  return match ? match[1] : null;
};

function AppContent() {
  const kanbanRef = useRef<KanbanBoardHandle>(null);
  const [activeItem, setActiveItem] = useState<string>('custom-fields');
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);
  const [selectedCatalogEntryId, setSelectedCatalogEntryId] = useState<string | null>(null);
  const [hashDealId, setHashDealId] = useState<string | null>(parseHashDealId);
  const { deals } = useDealsContext();

  useEffect(() => {
    const handler = () => setHashDealId(parseHashDealId());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const handleClearAllData = () => {
    kanbanRef.current?.clearAllData();
  };

  const handleNavigate = (itemId: string, catalogId?: string) => {
    setActiveItem(itemId);
    if (catalogId) {
      setSelectedCatalogId(catalogId);
    }
  };

  const handleOpenCatalog = (catalogId: string, entryId?: string) => {
    setSelectedCatalogId(catalogId);
    setSelectedCatalogEntryId(entryId || null);
    setActiveItem('catalog-detail');
  };

  const handleBackToCatalogs = () => {
    setSelectedCatalogId(null);
    setSelectedCatalogEntryId(null);
    setActiveItem('catalogs');
  };

  const renderContent = () => {
    switch (activeItem) {
      case 'custom-fields':
        return <CustomFieldsPage />;
      case 'catalogs':
        return <CatalogsPage onOpenCatalog={handleOpenCatalog} />;
      case 'catalog-detail':
        return selectedCatalogId ? (
          <CatalogDetailPage
            catalogId={selectedCatalogId}
            onBack={handleBackToCatalogs}
            onOpenCatalog={handleOpenCatalog}
            entryIdToOpen={selectedCatalogEntryId}
            onEntryOpened={() => setSelectedCatalogEntryId(null)}
          />
        ) : (
          <CatalogsPage onOpenCatalog={handleOpenCatalog} />
        );
      default:
        return (
          <KanbanBoard
            ref={kanbanRef}
            initialColumns={initialColumns}
          />
        );
    }
  };

  return (
    <>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: '#fff' }}>
        <TopBar
          onClearAllData={handleClearAllData}
          activeItem={activeItem}
          onNavigate={handleNavigate}
        />
        {renderContent()}
      </Box>
      {hashDealId && (
        <DealModal
          deal={deals.find((d) => d.id === hashDealId) ?? null}
          open={true}
          onClose={() => {
            window.location.hash = '';
            setHashDealId(null);
          }}
          onOpenDeal={(id) => {
            window.location.hash = `deal=${id}`;
          }}
        />
      )}
    </>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CustomFieldsProvider>
        <ReferenceEntriesProvider>
          <CatalogsProvider>
            <DealsProvider>
              <AppContent />
            </DealsProvider>
          </CatalogsProvider>
        </ReferenceEntriesProvider>
      </CustomFieldsProvider>
    </ThemeProvider>
  );
}

export default App;
