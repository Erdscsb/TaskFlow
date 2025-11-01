import React from 'react';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import Column from './Column';

// A helper map to get display titles from the column IDs
const columnTitles = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

function Board({ columnIds, tasksByColumn }) {
  
  return (
    <div className="board">
      {/* This context is for sorting the *columns* themselves.
        We pass the array of column IDs as `items`.
      */}
      <SortableContext
        items={columnIds}
        strategy={horizontalListSortingStrategy}
      >
        {columnIds.map((columnId) => {
          // Get the array of tasks for this specific column
          const tasks = tasksByColumn[columnId];

          // Create the 'column' object that the <Column> component expects
          const column = {
            id: columnId,
            title: columnTitles[columnId] || 'Column',
          };

          return <Column key={column.id} column={column} tasks={tasks} />;
        })}
      </SortableContext>
    </div>
  );
}

export default Board;
