import { Card, CardContent, Typography, Chip, Avatar, Box } from '@mui/material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Deal } from '../types';
import { useState } from 'react';
import { DealModal } from './DealModal';

interface DealCardProps {
  deal: Deal;
}

export const DealCard = ({
  deal,
}: DealCardProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'В работе':
        return '#FFA726';
      case 'Выиграно':
        return '#66BB6A';
      case 'Потеряно':
        return '#EF5350';
      default:
        return '#9E9E9E';
    }
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ru-RU');
  };

  const handleCardClick = () => {
    // Only open modal if not dragging
    if (!isDragging) {
      setModalOpen(true);
    }
  };

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={handleCardClick}
        sx={{
          mb: 1.5,
          cursor: 'grab',
          '&:active': {
            cursor: 'grabbing',
          },
          '&:hover': {
            boxShadow: 3,
          },
          borderRadius: 2,
          backgroundColor: '#fff',
        }}
      >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 500,
            mb: 1,
            fontSize: '0.95rem',
          }}
        >
          {deal.title}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Chip
            label={deal.status}
            size="small"
            sx={{
              backgroundColor: getStatusColor(deal.status),
              color: '#fff',
              fontWeight: 500,
              fontSize: '0.75rem',
              height: '24px',
            }}
          />
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              color: '#424242',
            }}
          >
            {formatAmount(deal.amount)}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              backgroundColor: deal.avatarColor,
              fontSize: '0.875rem',
            }}
          >
            {deal.title.charAt(0)}
          </Avatar>
        </Box>
      </CardContent>
    </Card>

    <DealModal
      deal={deal}
      open={modalOpen}
      onClose={() => setModalOpen(false)}
    />
    </>
  );
};
