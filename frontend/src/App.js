import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { AuthProvider } from './context/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import PrivateRoute from './components/common/PrivateRoute';
import RoleRoute from './components/common/RoleRoute';
import LoginScreen from './pages/LoginScreen';
import DashboardScreen from './pages/DashboardScreen';
import HouseholdListScreen from './pages/HouseholdListScreen';
import HouseholdDetailScreen from './pages/HouseholdDetailScreen';
import HouseholdEditScreen from './pages/HouseholdEditScreen';
import FeeListScreen from './pages/FeeListScreen';
import FeeEditScreen from './pages/FeeEditScreen';
import PaymentListScreen from './pages/PaymentListScreen';
import PaymentCreateScreen from './pages/PaymentCreateScreen';
import PaymentEditScreen from './pages/PaymentEditScreen';
import PaymentSearchScreen from './pages/PaymentSearchScreen';
import PaymentDetailScreen from './pages/PaymentDetailScreen';
import ResidentListScreen from './pages/ResidentListScreen';
import ResidentEditScreen from './pages/ResidentEditScreen';
import UserListScreen from './pages/UserListScreen';
import UserEditScreen from './pages/UserEditScreen';
import VehicleListScreen from './pages/VehicleListScreen';
import VehicleEditScreen from './pages/VehicleEditScreen';
import VehicleFeeScreen from './pages/VehicleFeeScreen';
import AreaBasedFeeScreen from './pages/AreaBasedFeeScreen';
import FacilityListScreen from './pages/FacilityListScreen';
import FacilityFormScreen from './pages/FacilityFormScreen';
import FacilityMaintenanceScreen from './pages/FacilityMaintenanceScreen';

import NotFoundScreen from './pages/NotFoundScreen';

function App() {
  // Define role groups for easier route management
  const adminOnly = ['admin'];
  const managerAdminRoles = ['admin', 'manager'];

  return (
    <Router>
      <AuthProvider>
        <Header />
        <main className="py-3">
          <Container>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LoginScreen />} />
              <Route path="/login" element={<LoginScreen />} />
              
              {/* Basic Protected Routes - Available to all authenticated administrative users */}
              <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<DashboardScreen />} />
                <Route path="/profile" element={<DashboardScreen />} />
                
                {/* Basic Management Routes */}
                <Route path="/households" element={<HouseholdListScreen />} />
                <Route path="/households/:id" element={<HouseholdDetailScreen />} />
                <Route path="/households/create" element={<HouseholdEditScreen />} />
                
                <Route path="/residents" element={<ResidentListScreen />} />
                <Route path="/residents/create" element={<ResidentEditScreen />} />
                
                <Route path="/fees" element={<FeeListScreen />} />
                
                <Route path="/payments" element={<PaymentListScreen />} />
                <Route path="/payments/create" element={<PaymentCreateScreen />} />
                <Route path="/payments/search" element={<PaymentSearchScreen />} />
                <Route path="/payments/:id" element={<PaymentDetailScreen />} />
                
                <Route path="/vehicles" element={<VehicleListScreen />} />
                <Route path="/vehicles/create" element={<VehicleEditScreen />} />
                <Route path="/vehicle-fees" element={<VehicleFeeScreen />} />
                <Route path="/area-fees" element={<AreaBasedFeeScreen />} />
                
                <Route path="/facilities" element={<FacilityListScreen />} />
                <Route path="/facilities/:id" element={<FacilityFormScreen />} />
              </Route>
              
              {/* Routes accessible only to managers and admins */}
              <Route element={<RoleRoute allowedRoles={managerAdminRoles} />}>
                <Route path="/households/:id/edit" element={<HouseholdEditScreen />} />
                <Route path="/residents/:id" element={<ResidentEditScreen />} />
                <Route path="/residents/:id/edit" element={<ResidentEditScreen />} />
                <Route path="/fees/create" element={<FeeEditScreen />} />
                <Route path="/fees/:id" element={<FeeEditScreen />} />
                <Route path="/payments/:id/edit" element={<PaymentEditScreen />} />
                <Route path="/vehicles/:id/edit" element={<VehicleEditScreen />} />
                <Route path="/facilities/new" element={<FacilityFormScreen />} />
                <Route path="/facilities/:id/maintenance" element={<FacilityMaintenanceScreen />} />
                <Route path="/admin/reports" element={<DashboardScreen />} />
              </Route>
              
              {/* Routes accessible only to admin */}
              <Route element={<RoleRoute allowedRoles={adminOnly} />}>
                <Route path="/users" element={<UserListScreen />} />
                <Route path="/users/create" element={<UserEditScreen />} />
                <Route path="/users/:id/edit" element={<UserEditScreen />} />
              </Route>
              
              <Route path="*" element={<NotFoundScreen />} />
            </Routes>
          </Container>
        </main>
        <Footer />
      </AuthProvider>
    </Router>
  );
}

export default App; 