// Defines the three app routes:
//   /login  — public auth page
//   /       — dashboard, guarded by ProtectedRoute
//   *       — 404 fallback
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AuthPage      from '@/pages/AuthPage';
import DashboardPage from '@/pages/DashboardPage';
import NotFoundPage  from '@/pages/NotFoundPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const router = createBrowserRouter([
  { path: '/login', element: <AuthPage /> },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [{ index: true, element: <DashboardPage /> }],
  },
  { path: '*', element: <NotFoundPage /> },
]);

export default function Router() {
  return <RouterProvider router={router} />;
}
