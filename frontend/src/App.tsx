import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CourseDetail from './pages/CourseDetail';
import CourseCreate from './pages/CourseCreate';
import CalendarPage from './pages/CalendarPage';

const DebugInfo = () => {
  const location = useLocation();
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, background: 'rgba(0,0,0,0.8)', color: 'lime', padding: '10px', zIndex: 9999 }}>
      <p>Mode: {import.meta.env.MODE}</p>
      <p>Basename Setting: {import.meta.env.MODE === 'production' ? '/rakutan' : '/'}</p>
      <p>Pathname: {location.pathname}</p>
      <p>Search: {location.search}</p>
    </div>
  );
};

function App() {
  const basename = import.meta.env.MODE === 'production' ? '/rakutan' : '/';
  return (
    <BrowserRouter basename={basename}>
      <DebugInfo />
      <Routes>
        {/* Wildcard to catch everything and show what's happening */}
        <Route path="*" element={
          <div style={{ color: 'white', padding: 20 }}>
            <h1>Routing Debug</h1>
            <p>No route matched!</p>
            <p>Try clicking: <a href="/rakutan/dashboard" style={{ color: 'cyan' }}>/rakutan/dashboard</a></p>
          </div>
        } />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/courses/new" element={<CourseCreate />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
