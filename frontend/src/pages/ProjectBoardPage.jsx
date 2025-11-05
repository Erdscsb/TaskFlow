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
import TaskModal from '../components/TaskModal.jsx'; 
import { useAuth } from '../context/AuthContext';
import MemberModal from '../components/MemberModal.jsx';
import './ProjectBoardPage.css';

// Define the column IDs
const columnIds = ['TODO', 'IN_PROGRESS', 'DONE'];

function ProjectBoardPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const [tasksByColumn, setTasksByColumn] = useState({
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
  });
  
  // This state holds the task that is currently being dragged
  const [activeTask, setActiveTask] = useState(null);

  const [selectedTask, setSelectedTask] = useState(null); // For the task modal
  const [newTaskExpiry, setNewTaskExpiry] = useState(''); // New task expiry date

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const { user } = useAuth(); // Get the current user

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

const handleTaskClick = (task) => {
    // Find the most up-to-date version of the task from our state
    const { task: fullTask } = findTask(task.id);
    setSelectedTask(fullTask);
  };

const handleUpdateTask = (updatedTask) => {
    // This function updates the state locally without a full refetch
    setTasksByColumn((prev) => {
      const newColumns = { ...prev };
      
      // Find and remove the old task from all columns
      for (const columnId of columnIds) {
        newColumns[columnId] = newColumns[columnId].filter(
          (t) => t.id !== updatedTask.id
        );
      }
      
      // Add the updated task to its new column
      if (newColumns[updatedTask.status]) {
         newColumns[updatedTask.status].push(updatedTask);
         // Re-sort that column
         newColumns[updatedTask.status].sort((a, b) => a.order - b.order);
      }
      
      return newColumns;
    });

    // Also update the task if it's the one in the modal
    setSelectedTask(updatedTask);
  };

// --- Handler to remove a task from state ---
  const handleDeleteTaskInBoard = (taskId) => {
    setTasksByColumn((prev) => {
      const newColumns = { ...prev };
      // Find and remove the task from whichever column it's in
      for (const columnId of columnIds) {
        newColumns[columnId] = newColumns[columnId].filter(
          (t) => t.id !== taskId
        );
      }
      return newColumns;
    });
  };

const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      alert('Task title cannot be empty');
      return;
    }

    try {
      // Use the backend endpoint to create a new task
      const response = await api.post(`/projects/${projectId}/tasks`, {
        title: newTaskTitle,
        expiry_date: newTaskExpiry || null,
      });

      const newTask = response.data;
      setTasksByColumn(prev => ({
        ...prev,
        [newTask.status]: [...prev[newTask.status], newTask].sort((a,b) => a.order - b.order)
      }));

      // Clear the input field
      setNewTaskTitle('');
      setNewTaskExpiry('');

    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create a new task.');
    }
  };

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
    const isOverAColumn = tasksByColumn[over.id];

    if (isOverAColumn) {
      // Dropped on an empty column
      newIndex = tasksByColumn[over.id].length;
    } else {
      // Dropped on a task, find its index
      newIndex = tasksByColumn[overColumnId].findIndex((t) => t.id === over.id);
      if (newIndex === -1) {
         newIndex = tasksByColumn[overColumnId].length;
      }
    }

    // 1. Update state immediately
    setTasksByColumn(prev => {
        const newColumns = { ...prev };
        
        // Remove from old column
        newColumns[originalColumnId] = prev[originalColumnId].filter(
          t => t.id !== active.id
        );
        
        // Create new task object for insertion
        const movedTask = { ...activeTask, status: overColumnId, order: newIndex };
        
        // Insert into new column at the correct position
        const newColumnTasks = [...prev[overColumnId]];
        newColumnTasks.splice(newIndex, 0, movedTask);
        
        newColumns[overColumnId] = newColumnTasks;
        
        return newColumns;
    });

    // Call the backend to move the task
    api.patch(`/tasks/${activeTask.id}/move`, {
        status: overColumnId,
        order: newIndex,
      })
      .then(response => {
        handleUpdateTask(response.data);
      })
      .catch((err) => {
        console.error('Failed to move task:', err);
        // On failure, refetch to revert any optimistic changes
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

  // --- FIND USER'S ROLE ---
  const currentUserRole = project.members.find(m => m.id === user.id)?.role;
  const isOwner = currentUserRole === 'owner';

  return (
    <div className="project-page-container">
      <header className="project-header">
        <div>
          <h1 className="project-title">{project.name}</h1>
          <p className="project-description">{project.description}</p>
        </div>
        
        {/* --- MANAGE MEMBERS BUTTON --- */}
        {isOwner && (
          <button 
            className="manage-members-btn" 
            onClick={() => setIsMemberModalOpen(true)}
          >
            Manage Members
          </button>
        )}
      </header>

      <form className="new-task-form" onSubmit={handleCreateTask}>
        <input
          type="text"
          placeholder="New Task Title"
          value={newTaskTitle}
          name="taskTitle"
          onChange={(e) => setNewTaskTitle(e.target.value)}
        />
        <input
          type="date"
          className="new-task-date"
          value={newTaskExpiry}
          onChange={(e) => setNewTaskExpiry(e.target.value)}
        />
        <button type="submit">Add Task</button>
      </form>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <Board
          columnIds={columnIds}
          tasksByColumn={tasksByColumn}
          onTaskClick={handleTaskClick}
        />
        
        {/* This renders the "floating" card that follows the pointer */}
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      {/* --- RENDER THE MODAL --- */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          projectMembers={project.members || []}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTaskInBoard}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {isOwner && isMemberModalOpen && (
        <MemberModal
          project={project}
          onClose={() => setIsMemberModalOpen(false)}
          onDataRefresh={fetchProjectData}
        />
      )}
    </div>
  );
}

export default ProjectBoardPage;
