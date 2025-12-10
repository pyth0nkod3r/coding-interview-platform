import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { InterviewRoom } from './pages/InterviewRoom';
import { Landing } from './pages/Landing';
import { Demo } from './pages/Demo';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthService } from './services/auth.service';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!AuthService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Root layout that provides error boundary
const RootLayout = () => <Outlet />;

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <Landing />,
      },
      {
        path: 'demo',
        element: <Demo />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'signup',
        element: <Signup />,
      },
      {
        path: 'signup/interviewer',
        element: <Signup />,
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'interview/:id',
        element: (
          <ProtectedRoute>
            <InterviewRoom />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
