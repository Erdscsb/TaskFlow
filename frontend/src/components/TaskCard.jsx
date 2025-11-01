import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function TaskCard({ task, id, isDragging }) {
  
  // 1. Call the useSortable hook
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: id });

  // 2. Create the style object for dnd-kit animations
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Add an opacity style if the card is being dragged
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    // 3. Apply the ref, style, attributes, and listeners to the div
    <div
      className="task-card"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <h4 className="task-card-title">{task.title}</h4>
      <p className="task-card-desc">{task.description}</p>
    </div>
  );
}

export default TaskCard;
