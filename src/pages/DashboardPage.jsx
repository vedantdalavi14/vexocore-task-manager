import React, { useState, useEffect, useMemo } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2, Pencil, Calendar, Clock } from 'lucide-react';

// --- Countdown Timer Component ---
function Countdown({ dueDate }) {
  const calculateTimeLeft = () => {
    const difference = +new Date(dueDate) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    // Clear timeout if the component is unmounted
    return () => clearTimeout(timer);
  });

  const isOverdue = +new Date(dueDate) < +new Date();

  if (isOverdue) {
    return <span className="text-xs font-bold text-red-500 flex items-center gap-1"><Clock size={12} /> Overdue</span>;
  }

  const timerComponents = [];
  if (timeLeft.days > 0) timerComponents.push(<span>{timeLeft.days}d</span>);
  if (timeLeft.hours > 0) timerComponents.push(<span>{timeLeft.hours}h</span>);
  timerComponents.push(<span>{timeLeft.minutes}m</span>);
  timerComponents.push(<span>{timeLeft.seconds}s</span>);

  return (
    <span className="text-xs text-cyan-400 font-mono flex items-center gap-1">
      {timerComponents.map((component, index) => <React.Fragment key={index}>{component} </React.Fragment>)} left
    </span>
  );
}


export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  const [editingDueDate, setEditingDueDate] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed'

  const getNowString = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };
  const nowString = getNowString();

  // Fetch tasks from Firestore in real-time
  useEffect(() => {
    if (currentUser) {
      const q = query(collection(db, "tasks"), where("userId", "==", currentUser.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const tasksData = [];
        querySnapshot.forEach((doc) => {
          tasksData.push({ ...doc.data(), id: doc.id });
        });
        tasksData.sort((a, b) => {
          if (a.status === b.status) return b.createdAt?.seconds - a.createdAt?.seconds;
          return a.status === 'pending' ? -1 : 1;
        });
        setTasks(tasksData);
        setLoading(false);
      });
      return unsubscribe;
    }
  }, [currentUser]);
  
  // Memoized filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filter === 'pending') return task.status === 'pending';
      if (filter === 'completed') return task.status === 'completed';
      return true; // for 'all'
    });
  }, [tasks, filter]);


  // Add a new task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (newTask.trim() === "") return;
    try {
      await addDoc(collection(db, "tasks"), {
        text: newTask.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
        userId: currentUser.uid,
        dueDate: dueDate,
      });
      setNewTask('');
      setDueDate('');
    } catch (error) {
      console.error("Error adding task: ", error);
    }
  };

  // Toggle task status
  const handleToggleStatus = async (task) => {
    const taskRef = doc(db, "tasks", task.id);
    await updateDoc(taskRef, { status: task.status === 'pending' ? 'completed' : 'pending' });
  };

  // Delete a task
  const handleDeleteTask = async (taskId) => {
    const taskRef = doc(db, "tasks", taskId);
    await deleteDoc(taskRef);
  };

  // --- Edit Task Functions ---
  const handleStartEdit = (task) => {
    setEditingTaskId(task.id);
    setEditingTaskText(task.text);
    setEditingDueDate(task.dueDate || '');
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingTaskText('');
    setEditingDueDate('');
  };

  const handleUpdateTask = async (taskId) => {
    if (editingTaskText.trim() === "") return;
    const taskRef = doc(db, "tasks", taskId);
    try {
      await updateDoc(taskRef, { 
        text: editingTaskText.trim(),
        dueDate: editingDueDate,
      });
      handleCancelEdit();
    } catch (error)
    {
      console.error("Error updating task: ", error);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Task Manager</h1>
          <p className="text-gray-400">Welcome, {currentUser?.email}</p>
        </div>
        <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
          Logout
        </button>
      </header>

      <main className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task..."
            className="flex-grow bg-gray-700 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="datetime-local"
            value={dueDate}
            min={nowString}
            onChange={(e) => setDueDate(e.target.value)}
            className="bg-gray-700 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded-md flex items-center justify-center">
            <Plus size={24} />
          </button>
        </form>

        {/* --- Filter Tabs --- */}
        <div className="flex justify-center gap-4 mb-6 border-b border-gray-700 pb-3">
          <button onClick={() => setFilter('all')} className={`font-medium px-3 py-1 rounded-md ${filter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>All</button>
          <button onClick={() => setFilter('pending')} className={`font-medium px-3 py-1 rounded-md ${filter === 'pending' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>Pending</button>
          <button onClick={() => setFilter('completed')} className={`font-medium px-3 py-1 rounded-md ${filter === 'completed' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>Completed</button>
        </div>

        <div>
          {loading ? ( <p className="text-center text-gray-400">Loading tasks...</p> ) : 
           filteredTasks.length > 0 ? (
            <ul className="space-y-3">
              {filteredTasks.map(task => (
                <li key={task.id} className="bg-gray-700 p-3 rounded-md min-h-[58px]">
                  {editingTaskId === task.id ? (
                    <div className="flex flex-col gap-2">
                       <input
                        type="text"
                        value={editingTaskText}
                        onChange={(e) => setEditingTaskText(e.target.value)}
                        className="w-full bg-gray-600 text-white rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex items-center justify-between gap-3">
                        <input
                            type="datetime-local"
                            value={editingDueDate}
                            min={nowString}
                            onChange={(e) => setEditingDueDate(e.target.value)}
                            className="bg-gray-600 text-white rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-3">
                           <button onClick={() => handleUpdateTask(task.id)} className="text-green-400 hover:text-green-300 font-semibold">Save</button>
                           <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-300">Cancel</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <label className="relative inline-flex items-center cursor-pointer">
                           <input type="checkbox" checked={task.status === 'completed'} onChange={() => handleToggleStatus(task)} className="sr-only peer" />
                           <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                         </label>
                        <div className="flex flex-col">
                           <div className="flex items-center gap-2">
                             <span className={`text-white ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>{task.text}</span>
                              {task.status === 'pending' ? (
                                <span className="text-xs font-semibold bg-yellow-500 text-yellow-900 px-2 py-0.5 rounded-full">Pending</span>
                              ) : (
                                <span className="text-xs font-semibold bg-green-500 text-green-900 px-2 py-0.5 rounded-full">Completed</span>
                              )}
                           </div>
                           {task.dueDate && (
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                              <Calendar size={12}/>
                              <span>{new Date(task.dueDate).toLocaleString()}</span>
                              {task.status === 'pending' && <Countdown dueDate={task.dueDate} />}
                            </div>
                           )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleStartEdit(task)} className="text-gray-400 hover:text-yellow-500"><Pencil size={18} /></button>
                        <button onClick={() => handleDeleteTask(task.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : ( 
            <p className="text-center text-gray-500 pt-4">
              {filter === 'all' && 'You have no tasks. Add one to get started!'}
              {filter === 'pending' && 'No pending tasks. Great job!'}
              {filter === 'completed' && 'No tasks completed yet.'}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

