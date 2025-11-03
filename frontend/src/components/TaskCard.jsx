import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function isTaskExpired(task) {
  if (!task.expiry_date || task.status === 'DONE') {
    return false;
  }
  return new Date(task.expiry_date) < new Date();
}

function TaskCard({ task, id, isDragging, onTaskClick }) {
  
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

  const expired = isTaskExpired(task);

  return (
    // 3. Apply the ref, style, attributes, and listeners to the div
    <div
      className={`task-card ${expired ? 'expired' : ''}`}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onTaskClick(task)}
    >
      <h4 className="task-card-title">{task.title}</h4>
      
      {/* --- Show description if it exists --- */}
      {task.description && (
        <p className="task-card-desc">{task.description}</p>
      )}

      {/* --- Footer with Expiry and Assignees --- */}
      <div className="task-card-footer">
        {task.expiry_date && (
          <span className={`task-card-expiry ${expired ? 'is-expired' : ''}`}>
            {expired ? 'Expired' : `Due: ${new Date(task.expiry_date).toLocaleDateString()}`}
          </span>
        )}
        <div className="task-card-assignees">
          {task.assignees.map((name, index) => (
            <span key={index} className="mini-avatar" title={name}>
              {name.substring(0, 1).toUpperCase()}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TaskCard;
