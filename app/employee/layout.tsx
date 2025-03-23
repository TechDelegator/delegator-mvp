import React, { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useParams } from 'react-router';
import type { Route } from '../+types/root';

// Define types for our data
type User = {
  id: string;
  name: string;
  role: 'employee' | 'admin' | 'manager';
  email: string;
};

type LeaveBalance = {
  userId: string;
  paid: number;
  sick: number;
  casual: number;
  miscellaneous: number;
  // Maximum values for each type
  maxPaid: number;
  maxSick: number;
  maxCasual: number;
  maxMiscellaneous: number;
};

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Employee Dashboard" },
    { name: "description", content: "Employee Dashboard overview" },
  ];
}

const EmployeeDashboardLayout: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Fetch user data from localStorage
    const fetchUserData = () => {
      const storedUsers = localStorage.getItem('leave-app-users');
      if (storedUsers) {
        const users: User[] = JSON.parse(storedUsers);
        const currentUser = users.find(u => u.id === userId);
        if (currentUser) {
          setUser(currentUser);
        } else {
          // User not found, redirect to home
          navigate('/');
        }
      } else {
        // No users in localStorage, redirect to home
        navigate('/');
      }
    };

    // Fetch leave balance from localStorage or initialize if not exists
    const fetchLeaveBalance = () => {
      const storedBalances = localStorage.getItem('leave-app-balances');

      if (storedBalances) {
        const balances: LeaveBalance[] = JSON.parse(storedBalances);
        let userBalance = balances.find(b => b.userId === userId);

        if (userBalance) {
          setLeaveBalance(userBalance);
        } else {
          // Initialize new balance for user
          const newBalance: LeaveBalance = {
            userId: userId || '',
            paid: 12,
            sick: 12,
            casual: 12,
            miscellaneous: 12,
            maxPaid: 12,
            maxSick: 12,
            maxCasual: 12,
            maxMiscellaneous: 12
          };

          // Save to localStorage
          const updatedBalances = [...balances, newBalance];
          localStorage.setItem('leave-app-balances', JSON.stringify(updatedBalances));
          setLeaveBalance(newBalance);
        }
      } else {
        // No balances in localStorage, create new entry
        const newBalance: LeaveBalance = {
          userId: userId || '',
          paid: 12,
          sick: 12,
          casual: 12,
          miscellaneous: 12,
          maxPaid: 12,
          maxSick: 12,
          maxCasual: 12,
          maxMiscellaneous: 12
        };

        localStorage.setItem('leave-app-balances', JSON.stringify([newBalance]));
        setLeaveBalance(newBalance);
      }
    };

    if (userId) {
      fetchUserData();
      fetchLeaveBalance();
    }
  }, [userId, navigate]);

  const handleLogout = () => {
    // Navigate back to the user selection screen
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Header - Improved for mobile */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div className="flex justify-between items-center">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Leave Management</h1>

            <div className="flex items-center sm:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                {mobileMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center mt-2 sm:mt-0">
            <div className="text-left sm:text-right">
              {user && (
                <>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{user.role}</p>
                </>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="ml-4 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        {/* Sidebar for desktop */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden md:block">
          <nav className="p-4 space-y-1">
            <NavItem to={`/dashboard/employee/${userId}`} label="Dashboard" />
            <NavItem to={`/dashboard/employee/${userId}/apply-leave`} label="Apply for Leave" />
            <NavItem to={`/dashboard/employee/${userId}/my-leaves`} label="My Leaves" />
            <NavItem to={`/dashboard/employee/${userId}/calendar`} label="Leave Calendar" />
            <NavItem to={`/dashboard/employee/${userId}/profile`} label="Profile" />
          </nav>
        </aside>

        {/* Mobile Navigation - Improved */}
        <nav className={`md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 ${mobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="flex flex-col space-y-1">
            <MobileNavItem to={`/dashboard/employee/${userId}`} label="Dashboard" />
            <MobileNavItem to={`/dashboard/employee/${userId}/apply-leave`} label="Apply for Leave" />
            <MobileNavItem to={`/dashboard/employee/${userId}/my-leaves`} label="My Leaves" />
            <MobileNavItem to={`/dashboard/employee/${userId}/calendar`} label="Leave Calendar" />
            <MobileNavItem to={`/dashboard/employee/${userId}/profile`} label="Profile" />
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4">
          <div>
            {/* Leave Summary Cards - Improved for mobile */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <SummaryCard
                title="Paid Leaves"
                value={leaveBalance ? `${leaveBalance.paid}/${leaveBalance.maxPaid}` : "Loading..."}
              />
              <SummaryCard
                title="Sick Leaves"
                value={leaveBalance ? `${leaveBalance.sick}/${leaveBalance.maxSick}` : "Loading..."}
              />
              <SummaryCard
                title="Casual Leaves"
                value={leaveBalance ? `${leaveBalance.casual}/${leaveBalance.maxCasual}` : "Loading..."}
              />
              <SummaryCard
                title="Miscellaneous"
                value={leaveBalance ? `${leaveBalance.miscellaneous}/${leaveBalance.maxMiscellaneous}` : "Loading..."}
              />
            </div>

            {/* Content Area - will be filled by child routes */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-6 border border-gray-200 dark:border-gray-700">
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
    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
  >
    {label}
  </Link>
);

const MobileTabItem: React.FC<{ to: string; label: string }> = ({ to, label }) => (
  <Link
    to={to}
    className="inline-block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
  >
    {label}
  </Link>
);

const SummaryCard: React.FC<{ title: string; value: string }> = ({ title, value }) => (
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-sm">
    <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Available</p>
  </div>
);

export default EmployeeDashboardLayout;
