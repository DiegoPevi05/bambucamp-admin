import {Suspense} from 'react';
import Providers from './components/Providers';
import  LoadingComponent from './components/ui/Loader';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import SignIn from './pages/signin';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardAdmin from './pages/home';
import DashboardAdminUsers from './pages/users';
import DashboardAdminGlapings from './pages/tents';
import DashboardAdminProducts from './pages/products';
import DashboardAdminExperiences from './pages/experiences';
import DashboardAdminDiscounts from './pages/discounts';
import DashboardAdminPromotions from './pages/promotions';
import DashboardAdminReserves from './pages/reserves';
import DashboardAdminReviews from './pages/reviews';
import DashboardAdminFaqs from './pages/faqs';


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
            isAllowed={!!user && user.role != undefined &&  (user.role == "ADMIN" || user.role =="SUPERVISOR") }
          >
            <DashboardAdmin/>
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute
            redirectPath="/"
            isAllowed={!!user && user.role != undefined && user.role == "ADMIN"}
          >
            <DashboardAdminUsers/>
          </ProtectedRoute>
        }
      />

      <Route
        path="/tents"
        element={
          <ProtectedRoute
            redirectPath="/"
            isAllowed={!!user && user.role != undefined && (user.role == "ADMIN" || user.role =="SUPERVISOR")}
          >
            <DashboardAdminGlapings/>
          </ProtectedRoute>
        }
      />

      <Route
        path="/products"
        element={
          <ProtectedRoute
            redirectPath="/"
            isAllowed={!!user && user.role != undefined && (user.role == "ADMIN" || user.role =="SUPERVISOR")}
          >
            <DashboardAdminProducts/>
          </ProtectedRoute>
        }
      />

      <Route
        path="/experiences"
        element={
          <ProtectedRoute
            redirectPath="/"
            isAllowed={!!user && user.role != undefined && (user.role == "ADMIN" || user.role =="SUPERVISOR")}
          >
            <DashboardAdminExperiences/>
          </ProtectedRoute>
        }
      />

      <Route
        path="/discounts"
        element={
          <ProtectedRoute
            redirectPath="/"
            isAllowed={!!user && user.role != undefined && (user.role == "ADMIN" || user.role =="SUPERVISOR")}
          >
            <DashboardAdminDiscounts/>
          </ProtectedRoute>
        }
      />

      <Route
        path="/promotions"
        element={
          <ProtectedRoute
            redirectPath="/"
            isAllowed={!!user && user.role != undefined && (user.role == "ADMIN" || user.role =="SUPERVISOR")}
          >
            <DashboardAdminPromotions/>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reserves"
        element={
          <ProtectedRoute
            redirectPath="/"
            isAllowed={!!user && user.role != undefined && (user.role == "ADMIN" || user.role =="SUPERVISOR")}
          >
            <DashboardAdminReserves/>
          </ProtectedRoute>
        }
      />

      <Route
        path="/questions"
        element={
          <ProtectedRoute
            redirectPath="/"
            isAllowed={!!user && user.role != undefined && (user.role == "ADMIN" || user.role =="SUPERVISOR")}
          >
            <DashboardAdminFaqs/>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reviews"
        element={
          <ProtectedRoute
            redirectPath="/"
            isAllowed={!!user && user.role != undefined && (user.role == "ADMIN" || user.role =="SUPERVISOR")}
          >
            <DashboardAdminReviews/>
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
          <Router basename="/">
            <AppRoutes />
          </Router>
        </Providers>
      </AuthProvider>
    </Suspense>
  );
};

export default App
