import React from 'react';
import { Draggable } from 'react-beautiful-dnd';

function TaskCard({ task, index }) {
  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided) => (
        <div
          className="task-card"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <h4 className="task-card-title">{task.title}</h4>
          <p className="task-card-desc">{task.description}</p>
        </div>
      )}
    </Draggable>
  );
}

export default TaskCard;
