# TaskFlow - A Web-Based Task Management App

TaskFlow is a sleek and intuitive web application for managing your daily tasks. Built with React and Vite, it offers a fast, responsive experience in any modern web browser. The app is powered by Firebase for real-time data synchronization and user authentication, ensuring your tasks are always up-to-date and secure.

## ✨ Features

- **User Authentication**: Secure sign-up and login functionality using Firebase Authentication.
- **Task Management**: Create, edit, delete, and mark tasks as complete.
- **Due Dates & Countdowns**: Set due dates and times for your tasks and see a live countdown.
- **Filtering**: Filter tasks by 'All', 'Pending', and 'Completed' status.
- **Search**: Quickly find tasks with a real-time search bar.
- **Real-time Sync**: Tasks are synchronized in real-time across all your devices using Firestore.
- **Responsive UI**: A modern, dark-themed user interface that works on both desktop and mobile browsers.

## 📱 Mobile Version

A mobile version of this application is also available, built with React Native and Expo. You can find the repository [here](https://github.com/vedantdalavi14/vexocore-task-manager-mobile).

## 🛠️ Tech Stack

- **Framework**: React with Vite
- **Language**: JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Authentication & Firestore)
- **UI Components**: `lucide-react` for icons.
- **State Management**: React Hooks (`useState`, `useEffect`, `useMemo`) and Context API.

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/vedantdalavi14/vexocore-task-manager.git
    cd vexocore-task-manager
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project by copying the example file:
    ```bash
    cp .env.example .env
    ```
    Open the `.env` file and replace the placeholder values with your own Firebase project credentials.

4.  **Start the development server:**
    ```bash
    npm run dev
    ```

5.  **Run in your browser:**
    - Open your web browser and navigate to the local URL provided in the terminal (usually `http://localhost:5173`).

## 📁 Project Structure

```
vexocore-task-manager/
├── public/         # Static assets
├── src/
│   ├── assets/     # React and Vite logos
│   ├── components/ # Reusable UI components (e.g., AuthLayout)
│   ├── context/    # React Context for global state (AuthContext)
│   ├── pages/      # Main application pages (Login, Dashboard, etc.)
│   ├── firebase.js # Firebase configuration
│   ├── App.jsx     # Main app component with routing logic
│   ├── main.jsx    # App entry point
│   └── index.css   # Tailwind CSS setup
├── .env.example    # Example environment variables
├── index.html      # Main HTML file
├── package.json    # Project dependencies and scripts
└── vite.config.js  # Vite configuration
```

## 🤝 Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.
