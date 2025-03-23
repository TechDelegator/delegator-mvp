import React from 'react';
import { Link, Outlet, useNavigate, useParams } from 'react-router';

const EmployeeDashboardLayout: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  // This would normally fetch the user from localStorage or an API
  // For now, just display the userId in the header

  const handleLogout = () => {
    // Navigate back to the user selection screen
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Leave Management</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Employee ID: {userId}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden md:block">
          <nav className="p-4 space-y-1">
            <NavItem to={`/user/${userId}/dashboard`} label="Dashboard" />
            <NavItem to={`/user/${userId}/apply-leave`} label="Apply for Leave" />
            <NavItem to={`/user/${userId}/my-leaves`} label="My Leaves" />
            <NavItem to={`/user/${userId}/calendar`} label="Leave Calendar" />
            <NavItem to={`/user/${userId}/profile`} label="Profile" />
          </nav>
        </aside>

        {/* Mobile Navigation */}
        <nav className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2">
          <div className="flex space-x-2 overflow-x-auto">
            <MobileNavItem to={`/user/${userId}/dashboard`} label="Dashboard" />
            <MobileNavItem to={`/user/${userId}/apply-leave`} label="Apply" />
            <MobileNavItem to={`/user/${userId}/my-leaves`} label="My Leaves" />
            <MobileNavItem to={`/user/${userId}/calendar`} label="Calendar" />
            <MobileNavItem to={`/user/${userId}/profile`} label="Profile" />
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            {/* Leave Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <SummaryCard title="Paid Leaves" value="8/12" />
              <SummaryCard title="Sick Leaves" value="10/12" />
              <SummaryCard title="Casual Leaves" value="11/12" />
              <SummaryCard title="Miscellaneous" value="12/12" />
            </div>

            {/* Content Area - will be filled by child routes */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Dashboard</h2>

              {/* Placeholder content */}
              <div className="border border-gray-200 dark:border-gray-700 border-dashed rounded-lg p-6 flex items-center justify-center h-64">
                <p className="text-gray-500 dark:text-gray-400">Dashboard content will appear here</p>
              </div>

              {/* This is where child routes will render */}
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Helper Components
const NavItem: React.FC<{ to: string; label: string }> = ({ to, label }) => (
  <Link
    to={to}
    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
  >
    {label}
  </Link>
);

const MobileNavItem: React.FC<{ to: string; label: string }> = ({ to, label }) => (
  <Link
    to={to}
    className="px-3 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded whitespace-nowrap"
  >
    {label}
  </Link>
);

const SummaryCard: React.FC<{ title: string; value: string }> = ({ title, value }) => (
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Available</p>
  </div>
);

export default EmployeeDashboardLayout
