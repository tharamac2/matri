import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Matches from './pages/Matches';
import Interest from './pages/Interest';
import Message from './pages/Message';
import Notification from './pages/Notification';
import Search from './pages/Search';
import Accepted from './pages/Accepted';
import Settings from './pages/Settings';
import Shortlisted from './pages/Shortlisted';
import Compare from './pages/Compare';
import SuccessStories from './pages/SuccessStories';
import ProfileViews from './pages/ProfileViews';
import ForgotPassword from './pages/ForgotPassword';
import AdminAppContainer from './admin/AdminAppContainer';
import RequireAuth from './components/RequireAuth';
import UserLayout from './components/UserLayout';
import './index.css';

function Protected({ children }) {
  return (
    <RequireAuth>
      <UserLayout>{children}</UserLayout>
    </RequireAuth>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/home" element={<Protected><Home /></Protected>} />
        <Route path="/matches" element={<Protected><Matches /></Protected>} />
        <Route path="/interest" element={<Protected><Interest /></Protected>} />
        <Route path="/message" element={<Protected><Message /></Protected>} />
        <Route path="/search" element={<Protected><Search /></Protected>} />
        <Route path="/accepted" element={<Protected><Accepted /></Protected>} />
        <Route path="/settings" element={<Protected><Settings /></Protected>} />
        <Route path="/notification" element={<Protected><Notification /></Protected>} />
        <Route path="/shortlisted" element={<Protected><Shortlisted /></Protected>} />
        <Route path="/compare" element={<Protected><Compare /></Protected>} />
        <Route path="/success-stories" element={<Protected><SuccessStories /></Protected>} />
        <Route path="/profile-views" element={<Protected><ProfileViews /></Protected>} />
        <Route path="/admin/*" element={<AdminAppContainer />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
