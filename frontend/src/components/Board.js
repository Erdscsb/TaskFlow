import React, { useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import Column from './Column';

// --- MOCK DATA (to be replaced by API data) ---
const initialBoardData = {
  tasks: {
    'task-1': { id: 1, title: 'Task 1', description: 'Do the thing' },
    'task-2': { id: 2, title: 'Task 2', description: 'Do another thing' },
    'task-3': { id: 3, title: 'Task 3', description: 'Do the third thing' },
  },
  columns: {
    'TODO': {
      id: 'TODO',
      title: 'To Do',
      taskIds: ['task-1', 'task-2'],
    },
    'IN_PROGRESS': {
      id: 'IN_PROGRESS',
      title: 'In Progress',
      taskIds: ['task-3'],
    },
    'DONE': {
      id: 'DONE',
      title: 'Done',
      taskIds: [],
    },
  },
  columnOrder: ['TODO', 'IN_PROGRESS', 'DONE'],
};
// --- END MOCK DATA ---


function Board() {
  const [boardData, setBoardData] = useState(initialBoardData);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const startColumn = boardData.columns[source.droppableId];
    const endColumn = boardData.columns[destination.droppableId];

    if (startColumn === endColumn) {
      const newTaskIds = Array.from(startColumn.taskIds);
      newTaskIds.splice(source.index, 1); // Remove from old position
      newTaskIds.splice(destination.index, 0, draggableId); // Insert in new position

      const newColumn = {
        ...startColumn,
        taskIds: newTaskIds,
      };

      setBoardData({
        ...boardData,
        columns: {
          ...boardData.columns,
          [newColumn.id]: newColumn,
        },
      });
      // TODO: Send API call to backend to save new order
      return;
    }

    const startTaskIds = Array.from(startColumn.taskIds);
    startTaskIds.splice(source.index, 1); // Remove from source
    const newStartColumn = {
      ...startColumn,
      taskIds: startTaskIds,
    };

    const endTaskIds = Array.from(endColumn.taskIds);
    endTaskIds.splice(destination.index, 0, draggableId); // Insert in destination
    const newEndColumn = {
      ...endColumn,
      taskIds: endTaskIds,
    };

    setBoardData({
      ...boardData,
      columns: {
        ...boardData.columns,
        [newStartColumn.id]: newStartColumn,
        [newEndColumn.id]: newEndColumn,
      },
    });

    // TODO: Send API call to backend to save new status AND new order
    // (e.g., PATCH /api/tasks/<task-id>/move)
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="board">
        {boardData.columnOrder.map((columnId) => {
          const column = boardData.columns[columnId];
          const tasks = column.taskIds.map(
            (taskId) => boardData.tasks[taskId]
          );

          return <Column key={column.id} column={column} tasks={tasks} />;
        })}
      </div>
    </DragDropContext>
  );
}

export default Board;
