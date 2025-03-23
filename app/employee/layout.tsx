import React, { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useParams } from 'react-router';

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

const EmployeeDashboardLayout: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);

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
              {user && (
                <>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{user.role}</p>
                </>
              )}
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
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

export default EmployeeDashboardLayout;
