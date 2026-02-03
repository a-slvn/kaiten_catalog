import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  ViewKanban,
  ViewList,
  TableChart,
  CalendarMonth,
  ShowChart,
  VideoCall,
  Search,
  Notifications,
  Mail,
  HelpOutline,
  FilterList,
  Settings,
  DeleteForever,
} from '@mui/icons-material';
import { Sidebar } from './Sidebar';
import { GlobalSearchDialog } from './GlobalSearchDialog';
import { DealModal } from './DealModal';
import ReferenceEntryDetailDialog from './ReferenceEntryDetailDialog';
import { useDealsContext } from '../context/DealsContext';

interface TopBarProps {
  onClearAllData: () => void;
  activeItem: string;
  onNavigate: (itemId: string) => void;
}

export const TopBar = ({ onClearAllData, activeItem, onNavigate }: TopBarProps) => {
  const [adminMenuAnchor, setAdminMenuAnchor] = useState<null | HTMLElement>(null);
  const adminMenuOpen = Boolean(adminMenuAnchor);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const { deals } = useDealsContext();

  const handleAdminMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAdminMenuAnchor(event.currentTarget);
  };

  const handleAdminMenuClose = () => {
    setAdminMenuAnchor(null);
  };

  const handleClearAllData = () => {
    if (window.confirm('Вы уверены, что хотите удалить все компании и контакты? Это действие нельзя отменить.')) {
      onClearAllData();
    }
    handleAdminMenuClose();
  };

  const handleOpenSearchDialog = () => {
    setSearchDialogOpen(true);
  };

  const handleCloseSearchDialog = () => {
    setSearchDialogOpen(false);
  };

  const handleOpenDeal = (dealId: string) => {
    setSelectedDealId(dealId);
  };

  const handleCloseDeal = () => {
    setSelectedDealId(null);
  };

  const handleOpenReferenceEntry = (entryId: string) => {
    setSelectedEntryId(entryId);
  };

  const handleCloseReferenceEntry = () => {
    setSelectedEntryId(null);
  };

  const selectedDeal = deals.find((d) => d.id === selectedDealId) || null;
  return (
    <AppBar
      position="static"
      elevation={1}
      sx={{
        backgroundColor: '#fff',
        color: '#424242',
      }}
    >
      <Toolbar sx={{ gap: 2 }}>
        <IconButton edge="start" color="inherit" sx={{ mr: 1 }} onClick={() => setSidebarOpen(true)}>
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            mr: 3,
          }}
        >
          CRM
        </Typography>

        <Button
          variant="contained"
          startIcon={<Dashboard />}
          sx={{
            backgroundColor: '#7B1FA2',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#6A1B9A',
            },
          }}
        >
          ДОСКИ
        </Button>

        <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
          <IconButton size="small" sx={{ color: '#7B1FA2' }}>
            <ViewKanban />
          </IconButton>
          <IconButton size="small">
            <ViewList />
          </IconButton>
          <IconButton size="small">
            <TableChart />
          </IconButton>
          <IconButton size="small">
            <CalendarMonth />
          </IconButton>
          <IconButton size="small">
            <ShowChart />
          </IconButton>
          <IconButton size="small">
            <VideoCall />
          </IconButton>
        </Box>

        <Button
          variant="outlined"
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderColor: '#7B1FA2',
            color: '#7B1FA2',
            ml: 2,
            '&:hover': {
              borderColor: '#6A1B9A',
              backgroundColor: 'rgba(123, 31, 162, 0.04)',
            },
          }}
        >
          ДОБАВИТЬ
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        <Button
          variant="text"
          startIcon={<FilterList />}
          sx={{
            textTransform: 'none',
            color: '#424242',
          }}
        >
          ФИЛЬТРЫ
        </Button>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <IconButton size="small" onClick={handleOpenSearchDialog}>
            <Search />
          </IconButton>
          <IconButton size="small">
            <Notifications />
          </IconButton>
          <IconButton size="small">
            <Mail />
          </IconButton>
          <IconButton size="small">
            <HelpOutline />
          </IconButton>
          <IconButton
            size="small"
            onClick={handleAdminMenuOpen}
            sx={{
              color: adminMenuOpen ? '#7B1FA2' : 'inherit',
            }}
          >
            <Settings />
          </IconButton>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              backgroundColor: '#7B1FA2',
              ml: 1,
            }}
          >
            У
          </Avatar>
        </Box>

        {/* Admin Menu */}
        <Menu
          anchorEl={adminMenuAnchor}
          open={adminMenuOpen}
          onClose={handleAdminMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              minWidth: 250,
              mt: 1,
            },
          }}
        >
          <MenuItem disabled>
            <Typography variant="subtitle2" color="text.secondary">
              Администрирование
            </Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleClearAllData}>
            <ListItemIcon>
              <DeleteForever color="error" />
            </ListItemIcon>
            <ListItemText
              primary="Удалить все компании и контакты"
              secondary="Очистить все данные CRM"
            />
          </MenuItem>
        </Menu>
      </Toolbar>

      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeItem={activeItem}
        onNavigate={onNavigate}
      />

      {/* Global Search Dialog */}
      <GlobalSearchDialog
        open={searchDialogOpen}
        onClose={handleCloseSearchDialog}
        onOpenDeal={handleOpenDeal}
        onOpenReferenceEntry={handleOpenReferenceEntry}
      />

      {/* Deal Modal */}
      <DealModal
        open={Boolean(selectedDealId)}
        onClose={handleCloseDeal}
        deal={selectedDeal}
      />

      {/* Reference Entry Detail Dialog */}
      {selectedEntryId && (
        <ReferenceEntryDetailDialog
          open={Boolean(selectedEntryId)}
          onClose={handleCloseReferenceEntry}
          entryId={selectedEntryId}
        />
      )}
    </AppBar>
  );
};
