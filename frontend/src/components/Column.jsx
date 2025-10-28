import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import TaskCard from './TaskCard';

function Column({ column, tasks }) {
  return (
    <div className="column">
      <h3 className="column-title">{column.title}</h3>
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            className={`column-task-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default Column;
