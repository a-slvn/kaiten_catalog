import { useState, forwardRef, useImperativeHandle } from 'react';
import { Box } from '@mui/material';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Column, Deal } from '../types';
import { KanbanColumn } from './KanbanColumn';
import { DealCard } from './DealCard';

interface KanbanBoardProps {
  initialColumns: Column[];
}

export interface KanbanBoardHandle {
  clearAllData: () => void;
}

export const KanbanBoard = forwardRef<KanbanBoardHandle, KanbanBoardProps>(({
  initialColumns,
}, ref) => {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

  // Expose admin functions via ref
  useImperativeHandle(ref, () => ({
    clearAllData: () => {
      setColumns(cols => cols.map(col => ({
        ...col,
        deals: [],
      })));
    },
  }));

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const deal = columns
      .flatMap(col => col.deals)
      .find(d => d.id === active.id);

    if (deal) {
      setActiveDeal(deal);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeColumn = columns.find(col =>
      col.deals.some(deal => deal.id === activeId)
    );
    const overColumn = columns.find(col =>
      col.id === overId || col.deals.some(deal => deal.id === overId)
    );

    if (!activeColumn || !overColumn) return;

    if (activeColumn.id === overColumn.id) {
      // Reorder within the same column
      setColumns(cols =>
        cols.map(col => {
          if (col.id === activeColumn.id) {
            const oldIndex = col.deals.findIndex(d => d.id === activeId);
            const newIndex = col.deals.findIndex(d => d.id === overId);

            return {
              ...col,
              deals: arrayMove(col.deals, oldIndex, newIndex),
            };
          }
          return col;
        })
      );
    } else {
      // Move to different column
      setColumns(cols => {
        const newCols = cols.map(col => ({ ...col, deals: [...col.deals] }));

        const activeColIndex = newCols.findIndex(col => col.id === activeColumn.id);
        const overColIndex = newCols.findIndex(col => col.id === overColumn.id);

        const activeDeal = newCols[activeColIndex].deals.find(d => d.id === activeId);

        if (activeDeal) {
          // Remove from active column
          newCols[activeColIndex].deals = newCols[activeColIndex].deals.filter(
            d => d.id !== activeId
          );

          // Add to over column
          const overDealIndex = newCols[overColIndex].deals.findIndex(
            d => d.id === overId
          );

          const updatedDeal = { ...activeDeal, columnId: overColumn.id };

          if (overDealIndex >= 0) {
            newCols[overColIndex].deals.splice(overDealIndex, 0, updatedDeal);
          } else {
            newCols[overColIndex].deals.push(updatedDeal);
          }
        }

        return newCols;
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveDeal(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find if over is a column
    const overColumn = columns.find(col => col.id === overId);

    if (overColumn) {
      // Dropped on a column
      setColumns(cols => {
        const newCols = cols.map(col => ({ ...col, deals: [...col.deals] }));

        const activeColumn = newCols.find(col =>
          col.deals.some(deal => deal.id === activeId)
        );

        if (activeColumn && activeColumn.id !== overColumn.id) {
          const activeDeal = activeColumn.deals.find(d => d.id === activeId);

          if (activeDeal) {
            // Remove from active column
            activeColumn.deals = activeColumn.deals.filter(
              d => d.id !== activeId
            );

            // Add to over column
            const overColIndex = newCols.findIndex(col => col.id === overColumn.id);
            const updatedDeal = { ...activeDeal, columnId: overColumn.id };
            newCols[overColIndex].deals.push(updatedDeal);
          }
        }

        return newCols;
      });
    }
  };

  return (
    <>
      <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          p: 3,
          overflowX: 'auto',
          height: 'calc(100vh - 100px)',
          backgroundColor: '#fff',
        }}
      >
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
          />
        ))}
      </Box>

      <DragOverlay>
        {activeDeal ? (
          <DealCard deal={activeDeal} />
        ) : null}
      </DragOverlay>
    </DndContext>
    </>
  );
});
