import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

import api from '../services/api';
import Board from '../components/Board.jsx';
import TaskCard from '../components/TaskCard.jsx'; 
import './ProjectBoardPage.css';

// Define the column IDs
const columnIds = ['TODO', 'IN_PROGRESS', 'DONE'];

function ProjectBoardPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [tasksByColumn, setTasksByColumn] = useState({
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
  });
  
  // This state holds the task that is currently being dragged
  const [activeTask, setActiveTask] = useState(null);

  // Helper function to find a task by its ID across all columns
  const findTask = (taskId) => {
    for (const columnId of columnIds) {
      const task = tasksByColumn[columnId].find((t) => t.id === taskId);
      if (task) {
        return { task, columnId };
      }
    }
    return null;
  };

  const fetchProjectData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/projects/${projectId}`);
      const projectData = response.data;
      setProject(projectData);

      const newTasksByColumn = {
        TODO: [],
        IN_PROGRESS: [],
        DONE: [],
      };

      projectData.tasks.forEach((task) => {
        if (newTasksByColumn[task.status]) {
          newTasksByColumn[task.status].push(task);
        }
      });

      Object.keys(newTasksByColumn).forEach((columnId) => {
        newTasksByColumn[columnId].sort((a, b) => a.order - b.order);
      });

      setTasksByColumn(newTasksByColumn);
      setError(null);
    } catch (err) {
      console.error('Error fetching project data:', err);
      setError('Failed to load project.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on mount or when projectId changes
  useEffect(() => {
    fetchProjectData();
  }, [projectId]);


  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px drag required to start
      },
    })
  );

  // --- dnd-kit HANDLERS ---

  function onDragStart(event) {
    const { active } = event;
    const { task } = findTask(active.id) || {};
    setActiveTask(task);
  }

  function onDragEnd(event) {
    setActiveTask(null); // Clear the active task overlay
    
    const { active, over } = event;

    // If dropped nowhere, or on itself, do nothing
    if (!over || active.id === over.id) {
      return;
    }

    const { task: activeTask, columnId: originalColumnId } = findTask(active.id);
    
    // 'over' can be a column (droppable) or a task (sortable)
    // 1. Check if 'over' is a column
    const overColumnId = columnIds.includes(over.id)
      ? over.id
      : findTask(over.id)?.columnId;

    if (!overColumnId || !activeTask) {
      return;
    }

    // --- LOGIC FOR STATE UPDATE AND API CALL ---
    
    // Find new index
    let newIndex;
    if (tasksByColumn[over.id]) {
      // Dropped on an empty column
      newIndex = tasksByColumn[over.id].length;
    } else {
      // Dropped on a task, find its index
      newIndex = tasksByColumn[overColumnId].findIndex((t) => t.id === over.id);
    }

    // Call the backend to move the task
    // We send the task ID, the new status (column ID), and its new order (index)
    // This matches the backend API: PATCH /api/tasks/<id>/move
    api.patch(`/tasks/${activeTask.id}/move`, {
        status: overColumnId,
        order: newIndex,
      })
      .then(() => {
        // Success! Refetch data from server to ensure sync
        fetchProjectData();
      })
      .catch((err) => {
        console.error('Failed to move task:', err);
        // On failure, refetch to revert any optimistic changes (if we had them)
        // and show the error.
        setError('Failed to update task position. Reverting.');
        fetchProjectData(); // Re-sync with the server's state
      });
  }

  // --- RENDER ---
  if (isLoading) {
    return <div className="project-page-container">Loading project...</div>;
  }
  if (error) {
    return <div className="project-page-container error-message">{error}</div>;
  }
  if (!project) {
    return <div className="project-page-container">Project not found.</div>;
  }

  return (
    <div className="project-page-container">
      <h1 className="project-title">{project.name}</h1>
      <p className="project-description">{project.description}</p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <Board
          columnIds={columnIds}
          tasksByColumn={tasksByColumn}
        />
        
        {/* This renders the "floating" card that follows the pointer */}
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default ProjectBoardPage;
