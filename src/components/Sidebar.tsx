import { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  InputBase,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
} from '@mui/material';
import {
  ChevronLeft,
  Search,
  Add,
  ExpandMore,
  ExpandLess,
  Folder,
  FolderOpen,
  Dashboard,
  Settings,
  AccessTime,
  SupportAgent,
  Style,
  ViewModule,
  Label,
  Payment,
  Business,
  People,
  AdminPanelSettings,
  TextFields,
  EventNote,
  FileDownload,
  CalendarMonth,
  FactCheck,
  EventAvailable,
  Block,
} from '@mui/icons-material';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  activeItem: string;
  onNavigate: (itemId: string) => void;
}

interface MenuSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: MenuItem[];
  defaultOpen?: boolean;
}

interface MenuItem {
  id: string;
  label: string;
  active?: boolean;
}

const menuSections: MenuSection[] = [
  {
    id: 'personal',
    title: 'Личное',
    icon: <Folder sx={{ color: '#9E9E9E' }} />,
    items: [
      { id: 'cards', label: 'Карточки' },
      { id: 'blockers', label: 'Блокеры' },
      { id: 'activities', label: 'Активности' },
      { id: 'time-tracking', label: 'Учёт времени' },
    ],
    defaultOpen: true,
  },
  {
    id: 'templates',
    title: 'Шаблоны пространств',
    icon: <Dashboard sx={{ color: '#9E9E9E' }} />,
    items: [],
  },
  {
    id: 'admin',
    title: 'Администрирование',
    icon: <Settings sx={{ color: '#00BFA5' }} />,
    items: [
      { id: 'admin-time', label: 'Учёт времени' },
      { id: 'support', label: 'Служба поддержки' },
      { id: 'card-types', label: 'Типы карточек' },
      { id: 'card-views', label: 'Виды карточек' },
      { id: 'labels', label: 'Метки' },
      { id: 'payment', label: 'Оплата' },
      { id: 'company-settings', label: 'Настройки компании' },
      { id: 'users', label: 'Пользователи' },
      { id: 'user-roles', label: 'Роли пользователей' },
      { id: 'custom-fields', label: 'Пользовательские поля', active: true },
      { id: 'catalogs', label: 'Каталоги' },
      { id: 'event-log', label: 'Журнал событий' },
      { id: 'export', label: 'Экспорт данных компании' },
      { id: 'calendars', label: 'Календари' },
      { id: 'audit-log', label: 'Журнал аудита' },
      { id: 'resource-planning', label: 'Ресурсное планирование' },
      { id: 'block-categories', label: 'Категории блокировки' },
    ],
    defaultOpen: true,
  },
];

const getAdminItemIcon = (id: string) => {
  const iconStyle = { color: '#9E9E9E', fontSize: 20 };
  const icons: Record<string, React.ReactNode> = {
    'admin-time': <AccessTime sx={iconStyle} />,
    'support': <SupportAgent sx={iconStyle} />,
    'card-types': <Style sx={iconStyle} />,
    'card-views': <ViewModule sx={iconStyle} />,
    'labels': <Label sx={iconStyle} />,
    'payment': <Payment sx={iconStyle} />,
    'company-settings': <Business sx={iconStyle} />,
    'users': <People sx={iconStyle} />,
    'user-roles': <AdminPanelSettings sx={iconStyle} />,
    'custom-fields': <TextFields sx={iconStyle} />,
    'catalogs': <FolderOpen sx={iconStyle} />,
    'event-log': <EventNote sx={iconStyle} />,
    'export': <FileDownload sx={iconStyle} />,
    'calendars': <CalendarMonth sx={iconStyle} />,
    'audit-log': <FactCheck sx={iconStyle} />,
    'resource-planning': <EventAvailable sx={iconStyle} />,
    'block-categories': <Block sx={iconStyle} />,
  };
  return icons[id] || null;
};

export const Sidebar = ({ open, onClose, activeItem, onNavigate }: SidebarProps) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    personal: true,
    admin: true,
  });

  const handleSectionToggle = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleItemClick = (itemId: string) => {
    onNavigate(itemId);
    onClose();
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 280,
          backgroundColor: '#FAFAFA',
          borderRight: '1px solid #E0E0E0',
        },
      }}
    >
      {/* Header with Logo */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Kaiten Logo */}
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #E91E63 0%, #9C27B0 50%, #3F51B5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: '#00BFA5',
              }}
            />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: '#212121',
              fontSize: '1.25rem',
            }}
          >
            Kaiten
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: '#757575' }}>
          <ChevronLeft />
        </IconButton>
      </Box>

      {/* Search Box */}
      <Box sx={{ px: 2, pb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#fff',
            borderRadius: 1,
            border: '1px solid #E0E0E0',
            px: 1.5,
            py: 0.5,
          }}
        >
          <Search sx={{ color: '#9E9E9E', fontSize: 20, mr: 1 }} />
          <InputBase
            placeholder="Найти.."
            sx={{
              flex: 1,
              fontSize: '0.875rem',
              '& input::placeholder': {
                color: '#9E9E9E',
                opacity: 1,
              },
            }}
          />
          <IconButton size="small" sx={{ color: '#757575', ml: 0.5 }}>
            <Add sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Menu Sections */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {menuSections.map((section, index) => (
          <Box key={section.id}>
            {index > 0 && section.id === 'templates' && (
              <Divider sx={{ my: 1 }} />
            )}
            {index > 0 && section.id === 'admin' && (
              <Divider sx={{ my: 1 }} />
            )}

            {/* Section Header */}
            <ListItemButton
              onClick={() => {
                if (section.items.length > 0) {
                  handleSectionToggle(section.id);
                }
              }}
              sx={{
                py: 1,
                px: 2,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {section.icon}
              </ListItemIcon>
              {section.items.length > 0 ? (
                expandedSections[section.id] ? (
                  <ExpandMore sx={{ color: '#757575', fontSize: 18, mr: 1 }} />
                ) : (
                  <ExpandLess sx={{ color: '#757575', fontSize: 18, mr: 1, transform: 'rotate(-90deg)' }} />
                )
              ) : null}
              <ListItemText
                primary={section.title}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#424242',
                }}
              />
            </ListItemButton>

            {/* Section Items */}
            {section.items.length > 0 && (
              <Collapse in={expandedSections[section.id]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {section.items.map((item) => (
                    <ListItemButton
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      sx={{
                        py: 0.75,
                        pl: section.id === 'admin' ? 4 : 6,
                        pr: 2,
                        backgroundColor: activeItem === item.id ? '#FFF9C4' : 'transparent',
                        '&:hover': {
                          backgroundColor: activeItem === item.id ? '#FFF9C4' : 'rgba(0, 0, 0, 0.04)',
                        },
                      }}
                    >
                      {section.id === 'admin' && (
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {getAdminItemIcon(item.id)}
                        </ListItemIcon>
                      )}
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          color: '#424242',
                        }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </Box>
        ))}
      </Box>
    </Drawer>
  );
};
