import React, { useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import Column from './Column';

function Board({ initialData, onDragEndCallback }) {
  // Set the board state from the prop
  const [boardData, setBoardData] = useState(initialData);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    // 1. Check if dropped outside a valid area
    if (!destination) return;

    // 2. Check if dropped in the same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // 3. Find the source and destination columns
    const startColumn = boardData.columns[source.droppableId];
    const endColumn = boardData.columns[destination.droppableId];

    // 4. Handle reordering within the same column
    if (startColumn === endColumn) {
      const newTaskIds = Array.from(startColumn.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = { ...startColumn, taskIds: newTaskIds };

      const newState = {
        ...boardData,
        columns: {
          ...boardData.columns,
          [newColumn.id]: newColumn,
        },
      };
      setBoardData(newState); // Optimistic UI update
      
      onDragEndCallback(result, newState);
      return;
    }

    // 5. Handle moving between columns
    const startTaskIds = Array.from(startColumn.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStartColumn = {
      ...startColumn,
      taskIds: startTaskIds,
    };

    const endTaskIds = Array.from(endColumn.taskIds);
    endTaskIds.splice(destination.index, 0, draggableId);
    const newEndColumn = {
      ...endColumn,
      taskIds: endTaskIds,
    };

    const newState = {
      ...boardData,
      columns: {
        ...boardData.columns,
        [newStartColumn.id]: newStartColumn,
        [newEndColumn.id]: newEndColumn,
      },
    };
    setBoardData(newState); // Optimistic UI update

    onDragEndCallback(result, newState);
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
