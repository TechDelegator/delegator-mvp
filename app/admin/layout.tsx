import React, { useEffect, useState } from "react";
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";
import type { Route } from "../+types/root";
import FeedbackButton from "~/components/FeedbackButton";

// Define types for our data
type User = {
  id: string;
  name: string;
  role: "employee" | "admin" | "manager";
  email: string;
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin Dashboard" },
    { name: "description", content: "Admin Dashboard for leave management" },
  ];
}

const AdminDashboardLayout: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const location = useLocation();

  useEffect(() => {
    // Fetch user data from localStorage
    const fetchUserData = () => {
      const storedUsers = localStorage.getItem("leave-app-users");
      if (storedUsers) {
        const users: User[] = JSON.parse(storedUsers);
        const currentUser = users.find((u) => u.id === userId);
        if (currentUser) {
          setUser(currentUser);

          // Check if the user is admin, if not redirect to home
          if (currentUser.role !== "admin") {
            navigate("/");
          }
        } else {
          // User not found, redirect to home
          navigate("/");
        }
      } else {
        // No users in localStorage, redirect to home
        navigate("/");
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId, navigate]);

  const handleLogout = () => {
    // Navigate back to the user selection screen
    navigate("/");
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
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Delegator{" "}
              <span className="text-indigo-600 dark:text-indigo-400">
                Admin
              </span>
            </h1>

            <div className="flex items-center sm:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                {mobileMenuOpen ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center mt-2 sm:mt-0">
            <div className="text-left sm:text-right">
              {user && (
                <>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {user.role}
                  </p>
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
            <NavItem to={`/dashboard/admin/${userId}`} label="Dashboard" />
            {/* Additional admin navigation items can be added here if needed */}
          </nav>
        </aside>

        {/* Mobile Navigation */}
        <nav
          className={`md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 ${
            mobileMenuOpen ? "block" : "hidden"
          }`}
        >
          <div className="flex flex-col space-y-1">
            <MobileNavItem
              to={`/dashboard/admin/${userId}`}
              label="Dashboard"
            />
            {/* Additional admin navigation items can be added here if needed */}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4">
          <div>
            {/* Content Area - will be filled by child routes */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-6 border border-gray-200 dark:border-gray-700">
              {/* This is where child routes will render */}
              <Outlet />
            </div>
          </div>
        </main>
      </div>
      <FeedbackButton />
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

const MobileNavItem: React.FC<{ to: string; label: string }> = ({
  to,
  label,
}) => (
  <Link
    to={to}
    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
  >
    {label}
  </Link>
);

export default AdminDashboardLayout;
