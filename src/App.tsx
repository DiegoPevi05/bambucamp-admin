import {Suspense} from 'react';
import Providers from './components/Providers';
import  LoadingComponent from './components/ui/Loader';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import SignIn from './pages/signin';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardAdmin from './pages/home';


const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingComponent isLoading={true} />;
  }

  return (
    <Routes>


      <Route
        path="/"
        element={
          <ProtectedRoute
            isAllowed={!!user && user.role && user.role.includes('ADMIN,SUPERVISOR')}
          >
            <DashboardAdmin/>
          </ProtectedRoute>
        }
      />

      <Route path="/signin" element={<ProtectedRoute  redirectPath="/" isAllowed={user == null || user == undefined}><SignIn /></ProtectedRoute>} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Suspense fallback={<LoadingComponent isLoading={true} />}>
      <AuthProvider>
        <Providers>
          <Router>
            <AppRoutes />
          </Router>
        </Providers>
      </AuthProvider>
    </Suspense>
  );
};

export default App
