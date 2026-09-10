import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateProject from './pages/CreateProject';
import MyProjects from './pages/MyProjects';
import MyInvestments from './pages/MyInvestments';
import Wallet from './pages/Wallet';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/create-project"
            element={<PrivateRoute role="fpo"><CreateProject /></PrivateRoute>}
          />
          <Route
            path="/my-projects"
            element={<PrivateRoute role="fpo"><MyProjects /></PrivateRoute>}
          />
          <Route
            path="/my-investments"
            element={<PrivateRoute role="investor"><MyInvestments /></PrivateRoute>}
          />
          <Route
            path="/admin"
            element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>}
          />
          <Route
            path="/wallet"
            element={<PrivateRoute><Wallet /></PrivateRoute>}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
