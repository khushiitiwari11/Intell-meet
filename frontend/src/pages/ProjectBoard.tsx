import { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { LayoutDashboard, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Task {
  _id: string;
  title: string;
  description: string;
  assignedToName: string;
  status: 'Todo' | 'In Progress' | 'Done';
}

const COLUMNS = [
  { id: 'Todo', title: 'To Do', icon: <AlertCircle size={18} className="text-red-500" /> },
  { id: 'In Progress', title: 'In Progress', icon: <Clock size={18} className="text-yellow-500" /> },
  { id: 'Done', title: 'Done', icon: <CheckCircle size={18} className="text-green-500" /> }
];

export default function ProjectBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    axios.get('https://intell-meet.onrender.com/api/tasks', { withCredentials: true })
      .then(res => setTasks(res.data))
      .catch(() => toast.error('Failed to load tasks'));
  }, []);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a column, or didn't move
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Optimistically update UI
    const newStatus = destination.droppableId as Task['status'];
    const updatedTasks = tasks.map(task => 
      task._id === draggableId ? { ...task, status: newStatus } : task
    );
    setTasks(updatedTasks);

    // Tell the database
    try {
      await axios.put(`https://intell-meet.onrender.com/api/tasks/${draggableId}/status`, 
        { status: newStatus }, 
        { withCredentials: true }
      );
      toast.success('Task updated!');
    } catch (error) {
      toast.error('Failed to update task on server');
      // Revert UI if server fails (optional but good practice)
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <LayoutDashboard className="text-blue-600" /> Team Workspace
          </h1>
          <p className="text-gray-500 mt-2">Drag and drop action items to update their status.</p>
        </div>

        {/* Drag Context Wrapper */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {COLUMNS.map(column => (
              <Droppable droppableId={column.id} key={column.id}>
                {(provided, snapshot) => (
                  <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef}
                    className={`bg-gray-100 rounded-xl p-4 border border-gray-200 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50 border-blue-200' : ''}`}
                  >
                    <h2 className="font-bold text-gray-700 flex items-center gap-2 mb-4 uppercase text-sm tracking-wider">
                      {column.icon} {column.title}
                    </h2>
                    
                    <div className="space-y-3 min-h-[200px]">
                      {tasks.filter(t => t.status === column.id).map((task, index) => (
                        <Draggable draggableId={task._id} index={index} key={task._id}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white p-4 rounded-lg border border-gray-200 shadow-sm ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500 rotate-2' : 'hover:shadow-md'} transition-all`}
                            >
                              <h3 className="font-semibold text-gray-800">{task.title}</h3>
                              <p className="text-xs text-gray-500 mt-1 truncate">{task.description}</p>
                              <div className="mt-3 text-xs">
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                                  {task.assignedToName}
                                </span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}

          </div>
        </DragDropContext>
      </div>
    </div>
  );
}