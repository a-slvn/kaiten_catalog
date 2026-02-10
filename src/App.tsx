import { useRef, useState } from 'react';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import { TopBar } from './components/TopBar';
import { KanbanBoard, KanbanBoardHandle } from './components/KanbanBoard';
import { CustomFieldsPage } from './components/CustomFieldsPage';
import { CatalogsPage } from './components/CatalogsPage';
import { CatalogDetailPage } from './components/CatalogDetailPage';
import { CustomFieldsProvider } from './context/CustomFieldsContext';
import { ReferenceEntriesProvider } from './context/ReferenceEntriesContext';
import { CatalogsProvider } from './context/CatalogsContext';
import { DealsProvider } from './context/DealsContext';
import { initialColumns } from './data/mockData';
import { theme } from './theme/theme';

function App() {
  const kanbanRef = useRef<KanbanBoardHandle>(null);
  const [activeItem, setActiveItem] = useState<string>('custom-fields');
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);
  const [selectedCatalogEntryId, setSelectedCatalogEntryId] = useState<string | null>(null);

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
    <ThemeProvider theme={theme}>
      <CustomFieldsProvider>
        <ReferenceEntriesProvider>
          <CatalogsProvider>
            <DealsProvider>
              <CssBaseline />
              <Box sx={{ minHeight: '100vh', backgroundColor: '#fff' }}>
                <TopBar
                  onClearAllData={handleClearAllData}
                  activeItem={activeItem}
                  onNavigate={handleNavigate}
                />
                {renderContent()}
              </Box>
            </DealsProvider>
          </CatalogsProvider>
        </ReferenceEntriesProvider>
      </CustomFieldsProvider>
    </ThemeProvider>
  );
}

export default App;
