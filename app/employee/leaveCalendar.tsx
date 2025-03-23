import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';

// Define types for leave data
type LeaveApplication = {
  id: string;
  userId: string;
  type: 'paid' | 'sick' | 'casual' | 'miscellaneous';
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  appliedOn: string;
  isEmergency: boolean;
};

type User = {
  id: string;
  name: string;
  role: 'employee' | 'admin' | 'manager';
  email: string;
};

const LeaveCalendar: React.FC = () => {
  const { userId } = useParams();
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch leave applications and users
    const fetchData = () => {
      setIsLoading(true);
      const storedApplications = localStorage.getItem('leave-app-applications');
      const storedUsers = localStorage.getItem('leave-app-users');

      if (storedApplications) {
        const applications: LeaveApplication[] = JSON.parse(storedApplications);
        // Only show approved leaves
        const approvedLeaves = applications.filter(leave => leave.status === 'approved');
        setLeaves(approvedLeaves);
      } else {
        setLeaves([]);
      }

      if (storedUsers) {
        const usersData: User[] = JSON.parse(storedUsers);
        setUsers(usersData);
      } else {
        setUsers([]);
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

  // Get days in month with leave info
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    // Get days from previous month to fill the first week
    const prevMonthDays = [];
    const prevMonth = new Date(year, month, 0);
    const prevMonthDaysCount = prevMonth.getDate();

    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      prevMonthDays.push({
        date: new Date(year, month - 1, prevMonthDaysCount - i),
        isCurrentMonth: false,
        hasLeave: false,
        leaves: []
      });
    }

    // Get days from current month
    const currentMonthDays = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);

      // Find leaves for this day
      const dayLeaves = leaves.filter(leave => {
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);

        // Reset time portions for comparison
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);

        return date >= startDate && date <= endDate;
      });

      currentMonthDays.push({
        date,
        isCurrentMonth: true,
        hasLeave: dayLeaves.length > 0,
        leaves: dayLeaves
      });
    }

    // Get days from next month to fill the last week
    const totalDaysDisplayed = prevMonthDays.length + currentMonthDays.length;
    const nextMonthDays = [];
    const daysNeeded = 42 - totalDaysDisplayed; // 6 rows of 7 days

    for (let day = 1; day <= daysNeeded; day++) {
      nextMonthDays.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
        hasLeave: false,
        leaves: []
      });
    }

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };

  // Change month
  const changeMonth = (amount: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + amount);
    setCurrentMonth(newMonth);
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Get user name from ID
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  // Get leave type badge class
  const getLeaveTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'paid':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'sick':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'casual':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">Leave Calendar</h2>

      {/* Month Navigation */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => changeMonth(-1)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <h3 className="text-md font-medium text-gray-900 dark:text-white">{formatDate(currentMonth)}</h3>
        <button
          onClick={() => changeMonth(1)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <div
              key={index}
              className="p-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : (
          <div className="grid grid-cols-7 grid-rows-6">
            {getDaysInMonth().map((day, idx) => (
              <div
                key={idx}
                className={`min-h-24 border-b border-r border-gray-200 dark:border-gray-700 p-1 ${!day.isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600' : ''
                  } ${day.hasLeave ? 'relative' : ''
                  }`}
              >
                <div className="flex justify-between">
                  <span className={`text-xs ${new Date().toDateString() === day.date.toDateString()
                      ? 'bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center'
                      : ''
                    }`}>
                    {day.date.getDate()}
                  </span>
                </div>

                {/* Leave Indicators */}
                {day.hasLeave && (
                  <div className="mt-1 space-y-1 max-h-20 overflow-y-auto">
                    {day.leaves.map((leave, leaveIdx) => (
                      <div
                        key={`${leave.id}-${leaveIdx}`}
                        className={`text-xs rounded px-1 py-0.5 truncate ${getLeaveTypeBadgeClass(leave.type)}`}
                        title={`${getUserName(leave.userId)} - ${leave.type} leave`}
                      >
                        <span className="font-medium">{getUserName(leave.userId).split(' ')[0]}</span>
                        <span className="ml-1 opacity-75">{leave.type.substring(0, 1).toUpperCase()}</span>
                        {leave.isEmergency && <span className="ml-1">🚨</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-sm bg-blue-100 dark:bg-blue-900 mr-1"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Paid Leave</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-sm bg-purple-100 dark:bg-purple-900 mr-1"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Sick Leave</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-sm bg-indigo-100 dark:bg-indigo-900 mr-1"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Casual Leave</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-700 mr-1"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Miscellaneous</span>
          </div>
          <div className="flex items-center">
            <span className="text-xs mr-1">🚨</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">Emergency Leave</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveCalendar;
