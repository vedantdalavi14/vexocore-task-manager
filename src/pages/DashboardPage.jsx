import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2 } from 'lucide-react';

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch tasks from Firestore in real-time
  useEffect(() => {
    if (currentUser) {
      const q = query(collection(db, "tasks"), where("userId", "==", currentUser.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const tasksData = [];
        querySnapshot.forEach((doc) => {
          tasksData.push({ ...doc.data(), id: doc.id });
        });
        // Sort tasks: pending first, then by creation time
        tasksData.sort((a, b) => {
          if (a.status === b.status) {
            return b.createdAt?.seconds - a.createdAt?.seconds;
          }
          return a.status === 'pending' ? -1 : 1;
        });
        setTasks(tasksData);
        setLoading(false);
      });
      return unsubscribe; // Cleanup listener on unmount
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
      });
      setNewTask('');
    } catch (error) {
      console.error("Error adding task: ", error);
    }
  };

  // Toggle task status
  const handleToggleStatus = async (task) => {
    const taskRef = doc(db, "tasks", task.id);
    await updateDoc(taskRef, {
      status: task.status === 'pending' ? 'completed' : 'pending'
    });
  };

  // Delete a task
  const handleDeleteTask = async (taskId) => {
    const taskRef = doc(db, "tasks", taskId);
    await deleteDoc(taskRef);
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
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Logout
        </button>
      </header>

      <main className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <form onSubmit={handleAddTask} className="flex gap-4 mb-6">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task..."
            className="flex-grow bg-gray-700 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded-md flex items-center justify-center">
            <Plus size={24} />
          </button>
        </form>

        <div>
          {loading ? (
            <p className="text-center text-gray-400">Loading tasks...</p>
          ) : tasks.length > 0 ? (
            <ul className="space-y-3">
              {tasks.map(task => (
                <li key={task.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-md">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      onChange={() => handleToggleStatus(task)}
                      className="h-5 w-5 rounded bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-600"
                    />
                    <span className={`text-white ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                      {task.text}
                    </span>
                  </div>
                  <button onClick={() => handleDeleteTask(task.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 size={18} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500">You have no tasks. Add one to get started!</p>
          )}
        </div>
      </main>
    </div>
  );
}

