import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2, Pencil, Calendar } from 'lucide-react';

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  const [editingDueDate, setEditingDueDate] = useState('');

  const todayString = new Date().toISOString().split("T")[0];

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
            type="date"
            value={dueDate}
            min={todayString}
            onChange={(e) => setDueDate(e.target.value)}
            className="bg-gray-700 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded-md flex items-center justify-center">
            <Plus size={24} />
          </button>
        </form>

        <div>
          {loading ? ( <p className="text-center text-gray-400">Loading tasks...</p> ) : 
           tasks.length > 0 ? (
            <ul className="space-y-3">
              {tasks.map(task => (
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
                            type="date"
                            value={editingDueDate}
                            min={todayString}
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
                           <span className={`text-white ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>{task.text}</span>
                           {task.dueDate && (
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                              <Calendar size={12}/>
                              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
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
          ) : ( <p className="text-center text-gray-500">You have no tasks. Add one to get started!</p> )}
        </div>
      </main>
    </div>
  );
}

