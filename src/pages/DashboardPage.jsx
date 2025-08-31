import React, { useState, useEffect, useMemo } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2, Pencil, Calendar, Clock, CheckSquare, AlertTriangle } from 'lucide-react';

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
    return () => clearTimeout(timer);
  });

  const isOverdue = +new Date(dueDate) < +new Date();

  if (isOverdue) {
    return <span className="text-xs font-bold text-red-400 flex items-center gap-1"><Clock size={12} /> Overdue</span>;
  }

  const timerComponents = [];
  if (timeLeft.days > 0) timerComponents.push(`${timeLeft.days}d`);
  if (timeLeft.hours > 0) timerComponents.push(`${timeLeft.hours}h`);
  timerComponents.push(`${timeLeft.minutes}m`);
  timerComponents.push(`${timeLeft.seconds}s`);

  return (
    <span className="text-xs text-cyan-400 font-mono flex items-center gap-1">
      <Clock size={12} /> {timerComponents.join(' ')} left
    </span>
  );
}

// --- Reusable Confirmation Modal ---
function ConfirmationModal({ icon: Icon, title, message, confirmText, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-6 w-full max-w-sm text-center">
                <Icon className="mx-auto w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-400 mb-6">{message}</p>
                <div className="flex justify-center gap-4">
                    <button onClick={onCancel} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">Cancel</button>
                    <button onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">{confirmText}</button>
                </div>
            </div>
        </div>
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
  const [filter, setFilter] = useState('all');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null); // State for delete confirmation

  const getNowString = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };
  const nowString = getNowString();

  useEffect(() => {
    if (currentUser) {
      const q = query(collection(db, "tasks"), where("userId", "==", currentUser.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const tasksData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        tasksData.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
        setTasks(tasksData);
        setLoading(false);
      });
      return unsubscribe;
    }
  }, [currentUser]);
  
  const filteredTasks = useMemo(() => {
    const sortedTasks = [...tasks].sort((a, b) => (a.status === 'pending' && b.status !== 'pending') ? -1 : (a.status !== 'pending' && b.status === 'pending') ? 1 : 0);
    if (filter === 'pending') return sortedTasks.filter(task => task.status === 'pending');
    if (filter === 'completed') return sortedTasks.filter(task => task.status === 'completed');
    return sortedTasks;
  }, [tasks, filter]);

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

  const handleToggleStatus = async (task) => {
    const taskRef = doc(db, "tasks", task.id);
    await updateDoc(taskRef, { status: task.status === 'pending' ? 'completed' : 'pending' });
  };

  // --- Delete Task with Confirmation ---
  const handleDeleteTask = (task) => {
    setTaskToDelete(task); // Set the task to be deleted, which shows the modal
  };

  const confirmDeleteTask = async () => {
    if (taskToDelete) {
      const taskRef = doc(db, "tasks", taskToDelete.id);
      await deleteDoc(taskRef);
      setTaskToDelete(null); // Close the modal after deletion
    }
  };

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
    await updateDoc(taskRef, { text: editingTaskText.trim(), dueDate: editingDueDate });
    handleCancelEdit();
  };
  
  const confirmLogout = () => {
    signOut(auth).catch(error => console.error("Failed to log out", error));
    setShowLogoutConfirm(false);
  };

  return (
    <>
      {showLogoutConfirm && <ConfirmationModal icon={AlertTriangle} title="Are you sure?" message="You will be logged out of your account." confirmText="Confirm Logout" onConfirm={confirmLogout} onCancel={() => setShowLogoutConfirm(false)} />}
      {taskToDelete && <ConfirmationModal icon={Trash2} title="Delete Task?" message={`This will permanently delete the task: "${taskToDelete.text}"`} confirmText="Delete Task" onConfirm={confirmDeleteTask} onCancel={() => setTaskToDelete(null)} />}
      
      <div className="w-full max-w-3xl mx-auto p-4 md:p-6">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
              <CheckSquare className="w-8 h-8 text-blue-500" />
              <h1 className="text-3xl font-bold text-white tracking-tighter">TaskFlow</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm hidden sm:block">{currentUser?.email}</span>
            <button onClick={() => setShowLogoutConfirm(true)} className="bg-gray-700 hover:bg-red-600 hover:text-white text-gray-300 font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200">
              Logout
            </button>
          </div>
        </header>

        <main className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-6 rounded-xl shadow-2xl">
          <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="What's your next task?"
              className="flex-grow bg-gray-700/50 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="datetime-local"
              value={dueDate}
              min={nowString}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-gray-700/50 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-lg flex items-center justify-center transition-colors duration-200">
              <Plus size={20} /> <span className="sm:hidden ml-2">Add Task</span>
            </button>
          </form>

          <div className="flex justify-center gap-2 mb-6 bg-gray-900/40 p-1.5 rounded-lg">
            <button onClick={() => setFilter('all')} className={`flex-1 font-medium text-sm px-3 py-1.5 rounded-md transition-colors duration-200 ${filter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'}`}>All Tasks</button>
            <button onClick={() => setFilter('pending')} className={`flex-1 font-medium text-sm px-3 py-1.5 rounded-md transition-colors duration-200 ${filter === 'pending' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'}`}>Pending</button>
            <button onClick={() => setFilter('completed')} className={`flex-1 font-medium text-sm px-3 py-1.5 rounded-md transition-colors duration-200 ${filter === 'completed' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'}`}>Completed</button>
          </div>

          <div className="min-h-[200px]">
            {loading ? ( <p className="text-center text-gray-400 pt-10">Loading your tasks...</p> ) : 
            filteredTasks.length > 0 ? (
              <ul className="space-y-3">
                {filteredTasks.map(task => (
                  <li key={task.id} className="bg-gray-700/50 p-3 rounded-lg border border-transparent hover:border-gray-600 transition-colors duration-200">
                    {editingTaskId === task.id ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          value={editingTaskText}
                          onChange={(e) => setEditingTaskText(e.target.value)}
                          className="w-full bg-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex items-center justify-between gap-3">
                          <input
                              type="datetime-local"
                              value={editingDueDate}
                              min={nowString}
                              onChange={(e) => setEditingDueDate(e.target.value)}
                              className="bg-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                          <div className="flex flex-col">
                            <span className={`text-white ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>{task.text}</span>
                            {task.dueDate && (
                              <div className="flex items-center gap-3 text-xs text-gray-400 mt-1.5">
                                <div className="flex items-center gap-1.5"><Calendar size={12}/> <span>{new Date(task.dueDate).toLocaleString()}</span></div>
                                {task.status === 'pending' && <Countdown dueDate={task.dueDate} />}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${task.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>
                              {task.status}
                          </span>
                          <button onClick={() => handleStartEdit(task)} className="text-gray-400 hover:text-yellow-400 p-1.5 rounded-md hover:bg-gray-600/50"><Pencil size={16} /></button>
                          <button onClick={() => handleDeleteTask(task)} className="text-gray-400 hover:text-red-400 p-1.5 rounded-md hover:bg-gray-600/50"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : ( 
              <p className="text-center text-gray-500 pt-10">
                {filter === 'all' && "You're all caught up!"}
                {filter === 'pending' && 'No pending tasks. Great job!'}
                {filter === 'completed' && 'No tasks completed yet.'}
              </p>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

