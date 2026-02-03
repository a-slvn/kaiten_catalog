import { Box, Typography, Paper, Chip } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Column } from '../types';
import { DealCard } from './DealCard';

interface KanbanColumnProps {
  column: Column;
}

export const KanbanColumn = ({
  column,
}: KanbanColumnProps) => {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  const totalAmount = column.deals.reduce((sum, deal) => sum + deal.amount, 0);
  const dealCount = column.deals.length;

  const formatAmount = (amount: number) => {
    return `${(amount / 1000).toLocaleString('ru-RU', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    })} ₽`.replace(',', ' ');
  };

  return (
    <Paper
      elevation={0}
      sx={{
        minWidth: 280,
        maxWidth: 280,
        backgroundColor: '#f5f5f5',
        borderRadius: 2,
        p: 1.5,
        height: 'fit-content',
        maxHeight: 'calc(100vh - 180px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              fontSize: '0.875rem',
              color: '#424242',
            }}
          >
            {column.title}
          </Typography>
          <Chip
            label={dealCount}
            size="small"
            sx={{
              backgroundColor: '#9E9E9E',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.75rem',
              height: '20px',
              minWidth: '28px',
            }}
          />
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: '#7B1FA2',
            fontWeight: 600,
            fontSize: '0.8rem',
          }}
        >
          {formatAmount(totalAmount)}
        </Typography>
      </Box>

      <Box
        ref={setNodeRef}
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          minHeight: 100,
        }}
      >
        <SortableContext
          items={column.deals.map(deal => deal.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
            />
          ))}
        </SortableContext>
      </Box>
    </Paper>
  );
};
