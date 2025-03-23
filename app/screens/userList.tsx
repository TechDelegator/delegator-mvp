import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

// User type definition
type User = {
  id: string;
  name: string;
  role: 'employee' | 'admin' | 'manager';
  email: string;
};

// Sample initial users
const initialUsers: User[] = [
  { id: '1', name: 'John Doe', role: 'employee', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', role: 'admin', email: 'jane@example.com' },
  { id: '3', name: 'Mike Johnson', role: 'manager', email: 'mike@example.com' },
  { id: '4', name: 'Sarah Williams', role: 'employee', email: 'sarah@example.com' },
  { id: '5', name: 'Alex Brown', role: 'employee', email: 'alex@example.com' },
];

export const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if users exist in localStorage
    const storedUsers = localStorage.getItem('leave-app-users');

    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      // Initialize with sample users if none exist
      localStorage.setItem('leave-app-users', JSON.stringify(initialUsers));
      setUsers(initialUsers);
    }
  }, []);

  const handleUserClick = (userId: string) => {
    // console.log("userId:", userId)
    // Just navigate to a placeholder route for now
    // In the future, this will navigate to the user's dashboard
    navigate(`/dashboard/employee/${userId}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Leave Management System</h1>
          <p className="text-gray-600 dark:text-gray-400">Select a user to continue</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {users.map((user) => (
            <div
              key={user.id}
              onClick={() => handleUserClick(user.id)}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-gray-700 dark:text-gray-200 text-lg font-semibold">
                    {user.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{user.name}</h3>
                  <div className="flex flex-col mt-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{user.email}</span>
                    <span className="text-xs mt-1 inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded capitalize">
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
