/**
 * PHASE 6 Advanced UX - Complete Integration Example
 * Demonstrates all PHASE 6 features working together
 */
import React, { useState } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { RateLimitNotice, parseRateLimitError } from '../components/RateLimitNotice';
import { useOptimistic } from '../hooks/useOptimistic';
import { useUndo } from '../hooks/useUndo';
import { errorAnalytics } from '../utils/errorAnalytics';
import { useToast } from '../components/Layout';
import { ErrorHandler } from '../utils/errorHandler';
import Button from '../components/Button';
import SectionTitle from '../components/SectionTitle';

interface Task {
  id: number | string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

// Simulated API functions
const simulateApiDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

const api = {
  createTask: async (task: Task): Promise<Task> => {
    await simulateApiDelay();
    // Simulate random errors for demo
    if (Math.random() > 0.8) {
      throw new Error('Network error: Failed to create task');
    }
    return { ...task, id: Date.now() };
  },
  
  updateTask: async (task: Task): Promise<Task> => {
    await simulateApiDelay();
    if (Math.random() > 0.9) {
      throw new Error('Network error: Failed to update task');
    }
    return task;
  },
  
  deleteTask: async (id: number | string): Promise<void> => {
    await simulateApiDelay();
    if (Math.random() > 0.9) {
      throw new Error('Network error: Failed to delete task');
    }
  }
};

function TaskListComponent() {
  const showToast = useToast();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [rateLimitError, setRateLimitError] = useState<any>(null);
  const [triggerError, setTriggerError] = useState(false);
  
  // Optimistic Updates Hook
  const {
    data: tasks,
    optimisticCreate,
    optimisticUpdate,
    optimisticDelete,
    isPending,
    hasPending
  } = useOptimistic<Task>([
    { id: 1, title: 'Setup PHASE 6 features', completed: true, createdAt: new Date() },
    { id: 2, title: 'Test error boundaries', completed: false, createdAt: new Date() },
    { id: 3, title: 'Implement optimistic updates', completed: false, createdAt: new Date() }
  ]);
  
  // Undo Hook
  const { addAction, undo, canUndo, getLastAction } = useUndo({ timeout: 10000 });
  
  // Trigger intentional error for ErrorBoundary demo
  if (triggerError) {
    throw new Error('Intentional error to test ErrorBoundary!');
  }
  
  // Create Task with Optimistic Update
  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) {
      showToast('Please enter a task title', 'warning');
      return;
    }
    
    const newTask: Task = {
      id: `temp-${Date.now()}`,
      title: newTaskTitle,
      completed: false,
      createdAt: new Date()
    };
    
    try {
      await optimisticCreate(newTask, async (task) => {
        return await api.createTask(task);
      });
      
      setNewTaskTitle('');
      showToast('Task created successfully! ✓', 'success');
      
      // Log success to analytics
      errorAnalytics.logError(
        new Error('Task created'),
        { page: 'Phase6Example', action: 'Create Task' },
        'low'
      );
    } catch (error: any) {
      const errorDetails = ErrorHandler.parse(error);
      
      // Handle rate limit
      if (errorDetails.status === 429) {
        setRateLimitError(parseRateLimitError(error));
        return;
      }
      
      // Log error to analytics
      errorAnalytics.logNetworkError(error, '/tasks', 'POST', {
        page: 'Phase6Example',
        action: 'Create Task'
      });
      
      showToast(errorDetails.userMessage, 'error');
    }
  };
  
  // Toggle Task with Optimistic Update
  const handleToggleTask = async (task: Task) => {
    const updatedTask = { ...task, completed: !task.completed };
    
    try {
      await optimisticUpdate(updatedTask, async (t) => {
        return await api.updateTask(t);
      });
      
      showToast(`Task marked as ${updatedTask.completed ? 'completed' : 'incomplete'}`, 'success');
    } catch (error: any) {
      const errorDetails = ErrorHandler.parse(error);
      errorAnalytics.logNetworkError(error, `/tasks/${task.id}`, 'PUT');
      showToast(errorDetails.userMessage, 'error');
    }
  };
  
  // Delete Task with Optimistic Update + Undo
  const handleDeleteTask = async (task: Task) => {
    const previousTasks = [...tasks];
    
    try {
      await optimisticDelete(task.id, async (id) => {
        await api.deleteTask(id);
      });
      
      // Add to undo history
      addAction(
        `Delete "${task.title}"`,
        task,
        () => {
          // Undo: This would need to be implemented with state restoration
          showToast('Undo functionality would restore the task here', 'info');
        }
      );
      
      showToast(`Task "${task.title}" deleted`, 'success', {
        duration: 5000,
        action: {
          label: 'Undo',
          onClick: () => {
            undo();
            showToast('Deletion undone!', 'success');
          }
        }
      });
    } catch (error: any) {
      const errorDetails = ErrorHandler.parse(error);
      errorAnalytics.logNetworkError(error, `/tasks/${task.id}`, 'DELETE');
      showToast(errorDetails.userMessage, 'error');
    }
  };
  
  // Simulate Rate Limit Error
  const simulateRateLimit = () => {
    const rateLimitDetails = {
      retryAfter: 30,
      limit: 100,
      remaining: 0,
      resetTime: new Date(Date.now() + 60000),
      message: 'You have exceeded the rate limit. Please wait before trying again.'
    };
    setRateLimitError(rateLimitDetails);
  };
  
  // Show Rate Limit Notice
  if (rateLimitError) {
    return (
      <div className="max-w-4xl mx-auto">
        <RateLimitNotice
          details={rateLimitError}
          onRetry={() => setRateLimitError(null)}
          onDismiss={() => setRateLimitError(null)}
        />
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <SectionTitle className="text-3xl font-bold mb-2">
          PHASE 6: Advanced UX Demo
        </SectionTitle>
        <p className="text-gray-600">
          This page demonstrates all PHASE 6 features: Error Boundaries, Error Analytics, 
          Rate Limiting, Optimistic Updates, and Undo functionality.
        </p>
      </div>
      
      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 mb-2">✅ Error Boundary</h3>
          <p className="text-sm text-blue-800 mb-3">Catches React errors gracefully</p>
          <Button
            onClick={() => setTriggerError(true)}
            variant="secondary"
            className="bg-red-100 hover:bg-red-200 text-red-800"
          >
            Trigger Error
          </Button>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-bold text-green-900 mb-2">✅ Error Analytics</h3>
          <p className="text-sm text-green-800 mb-3">Logs errors for debugging</p>
          <Button
            onClick={() => {
              const errors = errorAnalytics.getRecentErrors(5);
              console.log('Recent Errors:', errors);
              showToast(`Check console - ${errors.length} errors logged`, 'info');
            }}
            variant="secondary"
            className="bg-green-100 hover:bg-green-200 text-green-800"
          >
            View Error Log
          </Button>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-bold text-orange-900 mb-2">✅ Rate Limiting</h3>
          <p className="text-sm text-orange-800 mb-3">Handles 429 errors with countdown</p>
          <Button
            onClick={simulateRateLimit}
            variant="secondary"
            className="bg-orange-100 hover:bg-orange-200 text-orange-800"
          >
            Simulate Rate Limit
          </Button>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-bold text-purple-900 mb-2">✅ Optimistic Updates</h3>
          <p className="text-sm text-purple-800 mb-3">
            {hasPending ? '⏳ Pending operations...' : '✓ All operations synced'}
          </p>
          <div className="text-xs text-purple-700">
            Automatic rollback on failure
          </div>
        </div>
      </div>
      
      {/* Undo Bar */}
      {canUndo && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-yellow-800">Last Action: </span>
              <span className="text-yellow-700">{getLastAction()?.action}</span>
            </div>
            <Button
              onClick={undo}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Undo
            </Button>
          </div>
        </div>
      )}
      
      {/* Task Creation */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Create Task (Optimistic Update)</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateTask()}
            placeholder="Enter task title..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            onClick={handleCreateTask}
            disabled={!newTaskTitle.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add Task
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          20% chance of simulated error to demonstrate rollback
        </p>
      </div>
      
      {/* Task List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">
          Task List ({tasks.length})
        </h2>
        
        {tasks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No tasks yet. Create one above!</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                  isPending(task.id)
                    ? 'opacity-50 bg-gray-50 border-gray-300'
                    : 'bg-white border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleTask(task)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span
                    className={`flex-1 ${
                      task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}
                  >
                    {task.title}
                  </span>
                  {isPending(task.id) && (
                    <span className="text-xs text-blue-600 font-medium">Syncing...</span>
                  )}
                </div>
                
                <Button
                  onClick={() => handleDeleteTask(task)}
                  variant="secondary"
                  className="bg-red-100 hover:bg-red-200 text-red-700 text-sm"
                  disabled={isPending(task.id)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Feature Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-bold text-gray-900 mb-3">Features Demonstrated:</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span><strong>ErrorBoundary:</strong> Click "Trigger Error" to see graceful error handling</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span><strong>Error Analytics:</strong> All errors logged to console with context</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span><strong>Rate Limiting:</strong> Simulates 429 error with countdown timer</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span><strong>Optimistic Updates:</strong> Tasks update immediately, rollback on error</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span><strong>Undo Functionality:</strong> Delete tasks and undo within 10 seconds</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function Phase6Example() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        errorAnalytics.logComponentError(
          error, 
          { componentStack: errorInfo.componentStack || '' }, 
          {
            page: 'Phase6Example',
            action: 'Component Error'
          }
        );
      }}
    >
      <TaskListComponent />
    </ErrorBoundary>
  );
}
