import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import TaskCard from './TaskCard';

function Column({ column, tasks }) {
  // 1. Make the column a droppable area
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  // 2. Create an array of task IDs for the SortableContext
  const taskIds = tasks.map((task) => task.id);

  return (
    <div
      ref={setNodeRef} // Attach the droppable ref to the main column element
      className="column"
    >
      <h3 className="column-title">{column.title}</h3>

      {/* This component makes all children sortable */}
      <SortableContext
        items={taskIds}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={`column-task-list ${isOver ? 'dragging-over' : ''}`}
        >
          {tasks.map((task) => (
            // The TaskCard component itself will be made draggable/sortable
            <TaskCard key={task.id} id={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default Column;
