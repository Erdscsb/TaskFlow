import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import Board from '../components/Board.jsx';
import './ProjectBoardPage.css';

function ProjectBoardPage() {
  const { projectId } = useParams(); // Get the project ID from the URL
  const [project, setProject] = useState(null);
  const [boardData, setBoardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch and re-format project data
  const fetchProjectData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/projects/${projectId}`);
      const projectData = response.data;
      setProject(projectData);

      // --- Data Transformation ---
      
      const tasks = {};
      projectData.tasks.forEach(task => {
        tasks[task.id] = task;
      });

      const columns = {
        'TODO': { id: 'TODO', title: 'To Do', taskIds: [] },
        'IN_PROGRESS': { id: 'IN_PROGRESS', title: 'In Progress', taskIds: [] },
        'DONE': { id: 'DONE', title: 'Done', taskIds: [] },
      };

      // Populate the columns with task IDs
      projectData.tasks.forEach(task => {
        if (columns[task.status]) {
          columns[task.status].taskIds.push(task.id);
        }
      });

      // Ensure tasks within columns are sorted by their 'order'
      Object.keys(columns).forEach(columnId => {
        columns[columnId].taskIds.sort((a, b) => {
          const taskA = tasks[a];
          const taskB = tasks[b];
          return taskA.order - taskB.order;
        });
      });
      
      const formattedData = {
        tasks: tasks,
        columns: columns,
        columnOrder: ['TODO', 'IN_PROGRESS', 'DONE'],
      };
      
      setBoardData(formattedData);
      setError(null);
    } catch (err) {
      console.error("Error fetching project data:", err);
      setError("Failed to load project.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on mount or when projectId changes
  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  // This function will be passed to the Board to allow it
  // to save changes to the backend.
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    // TODO: Implement the optimistic UI update + API call
    // This logic is currently in Board.js (mock data).
    console.log('Drag ended!', result);
    
    // For now, just show an alert and refetch
    alert("Drag & Drop is not yet saved to the backend. Refetching data.");
    fetchProjectData();
  };

  if (isLoading) {
    return <div className="project-page-container">Loading project...</div>;
  }
  if (error) {
    return <div className="project-page-container error-message">{error}</div>;
  }
  if (!project || !boardData) {
    return <div className="project-page-container">Project not found.</div>;
  }

  return (
    <div className="project-page-container">
      <h1 className="project-title">{project.name}</h1>
      <p className="project-description">{project.description}</p>
      
      {/* Pass the formatted data and the handler to the Board */}
      <Board 
        initialData={boardData} 
        onDragEnd={handleDragEnd} 
      />
    </div>
  );
}

export default ProjectBoardPage;
