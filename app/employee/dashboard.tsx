import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Link } from 'react-router';

// Define types
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
  maxPaid: number;
  maxSick: number;
  maxCasual: number;
  maxMiscellaneous: number;
};

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

type TeamMember = {
  id: string;
  name: string;
};

// Sample team members - in a real app, this would come from localStorage or an API
const teamMembers: TeamMember[] = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Smith' },
  { id: '3', name: 'Mike Johnson' },
  { id: '4', name: 'Sarah Williams' },
  { id: '5', name: 'Alex Brown' },
];

const Dashboard: React.FC = () => {
  const { userId } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);
  const [teamLeaves, setTeamLeaves] = useState<LeaveApplication[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    // Fetch user data
    const fetchUserData = () => {
      const storedUsers = localStorage.getItem('leave-app-users');
      if (storedUsers) {
        const users: User[] = JSON.parse(storedUsers);
        const currentUser = users.find(u => u.id === userId);
        if (currentUser) {
          setUser(currentUser);
        }
      }
    };

    // Fetch leave balance
    const fetchLeaveBalance = () => {
      const storedBalances = localStorage.getItem('leave-app-balances');
      if (storedBalances) {
        const balances: LeaveBalance[] = JSON.parse(storedBalances);
        const userBalance = balances.find(b => b.userId === userId);
        if (userBalance) {
          setLeaveBalance(userBalance);
        }
      }
    };

    // Fetch leave applications
    const fetchLeaveApplications = () => {
      const storedApplications = localStorage.getItem('leave-app-applications');
      if (storedApplications) {
        const applications: LeaveApplication[] = JSON.parse(storedApplications);
        const userApplications = applications.filter(a => a.userId === userId);
        setLeaveApplications(userApplications);

        // Get team leaves (in a real app, this would be filtered by team)
        const otherApplications = applications.filter(a => a.userId !== userId && a.status === 'approved');
        setTeamLeaves(otherApplications);
      } else {
        // Initialize with empty array if none exist
        localStorage.setItem('leave-app-applications', JSON.stringify([]));
      }
    };

    // Generate notifications based on leave applications
    const generateNotifications = () => {
      const notes: string[] = [];

      if (leaveApplications.filter(a => a.status === 'pending').length > 0) {
        notes.push("You have pending leave applications awaiting approval.");
      }

      if (leaveBalance && leaveBalance.paid <= 2) {
        notes.push("You have only a few paid leaves remaining. Plan your leaves wisely.");
      }

      // Add more notifications based on business rules
      setNotifications(notes);
    };

    fetchUserData();
    fetchLeaveBalance();
    fetchLeaveApplications();

    // This should be called after the state updates, but for simplicity, we're calling it directly
    // In a real app, use another useEffect with dependencies on leaveApplications and leaveBalance
    setTimeout(() => {
      generateNotifications();
    }, 500);
  }, [userId]);

  // Get upcoming leaves (next 30 days)
  const getUpcomingLeaves = () => {
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);

    return leaveApplications.filter(leave => {
      const startDate = new Date(leave.startDate);
      return (
        leave.status === 'approved' &&
        startDate >= today &&
        startDate <= thirtyDaysLater
      );
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  };

  // Get recent leave applications (last 5)
  const getRecentApplications = () => {
    return [...leaveApplications]
      .sort((a, b) => new Date(b.appliedOn).getTime() - new Date(a.appliedOn).getTime())
      .slice(0, 5);
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
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

  // For demo purposes, create some dates for the calendar
  const getDaysInCurrentMonth = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, month, i + 1);
      return {
        date: date,
        day: i + 1,
        isToday: i + 1 === today.getDate(),
        hasLeave: leaveApplications.some(leave => {
          const leaveStart = new Date(leave.startDate);
          const leaveEnd = new Date(leave.endDate);
          return (
            leave.status === 'approved' &&
            date >= leaveStart &&
            date <= leaveEnd
          );
        }),
        leaveType: leaveApplications.find(leave => {
          const leaveStart = new Date(leave.startDate);
          const leaveEnd = new Date(leave.endDate);
          return (
            leave.status === 'approved' &&
            date >= leaveStart &&
            date <= leaveEnd
          );
        })?.type || ''
      };
    });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Dashboard</h2>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Notifications</h3>
          <div className="bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500 p-4 rounded">
            <ul className="list-disc pl-5 space-y-1">
              {notifications.map((note, index) => (
                <li key={index} className="text-sm text-blue-700 dark:text-blue-300">{note}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/user/${userId}/apply-leave`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-900 focus:outline-none focus:border-blue-900 focus:ring ring-blue-300 disabled:opacity-25 transition ease-in-out duration-150"
          >
            Apply for Leave
          </Link>
          <Link
            to={`/user/${userId}/apply-leave?emergency=true`}
            className="inline-flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-red-700 active:bg-red-900 focus:outline-none focus:border-red-900 focus:ring ring-red-300 disabled:opacity-25 transition ease-in-out duration-150"
          >
            Emergency Leave
          </Link>
          <Link
            to={`/user/${userId}/my-leaves`}
            className="inline-flex items-center px-4 py-2 bg-gray-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 focus:outline-none focus:border-gray-900 focus:ring ring-gray-300 disabled:opacity-25 transition ease-in-out duration-150"
          >
            View My Leaves
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Leave Usage Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Leave Usage Overview</h3>
          <div className="h-48 flex items-center justify-center">
            {leaveBalance ? (
              <div className="grid grid-cols-4 gap-2 w-full">
                {/* Simple visual representation of leave usage */}
                <LeaveUsageBar
                  type="Paid"
                  used={leaveBalance.maxPaid - leaveBalance.paid}
                  total={leaveBalance.maxPaid}
                  color="blue"
                />
                <LeaveUsageBar
                  type="Sick"
                  used={leaveBalance.maxSick - leaveBalance.sick}
                  total={leaveBalance.maxSick}
                  color="purple"
                />
                <LeaveUsageBar
                  type="Casual"
                  used={leaveBalance.maxCasual - leaveBalance.casual}
                  total={leaveBalance.maxCasual}
                  color="indigo"
                />
                <LeaveUsageBar
                  type="Misc"
                  used={leaveBalance.maxMiscellaneous - leaveBalance.miscellaneous}
                  total={leaveBalance.maxMiscellaneous}
                  color="gray"
                />
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Loading leave data...</p>
            )}
          </div>
        </div>

        {/* Upcoming Leaves */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Upcoming Leaves</h3>
          <div className="h-48 overflow-y-auto">
            {getUpcomingLeaves().length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {getUpcomingLeaves().map((leave) => (
                  <li key={leave.id} className="py-2">
                    <div className="flex items-center">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                        </p>
                        <div className="flex items-center space-x-1 mt-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getLeaveTypeBadgeClass(leave.type)}`}
                          >
                            {leave.type.charAt(0).toUpperCase() + leave.type.slice(1)}
                          </span>
                          {leave.isEmergency && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                              Emergency
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-6">No upcoming leaves</p>
            )}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Applications</h3>
          <div className="h-48 overflow-y-auto">
            {getRecentApplications().length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {getRecentApplications().map((application) => (
                  <li key={application.id} className="py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {formatDate(application.startDate)} - {formatDate(application.endDate)}
                        </p>
                        <div className="flex items-center space-x-1 mt-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getLeaveTypeBadgeClass(application.type)}`}
                          >
                            {application.type.charAt(0).toUpperCase() + application.type.slice(1)}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeClass(application.status)}`}
                          >
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      {application.status === 'rejected' && (
                        <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                          Reapply
                        </button>
                      )}
                      {application.status === 'pending' && (
                        <button className="text-xs text-red-600 dark:text-red-400 hover:underline">
                          Cancel
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-6">No recent applications</p>
            )}
          </div>
        </div>

        {/* Team Calendar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Team Calendar</h3>

          {/* Monthly Calendar - Show this first so it's visible without scrolling */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">This Month</h4>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <div key={index} className="text-center font-medium text-gray-700 dark:text-gray-300">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid - More compact to fit without scrolling */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInCurrentMonth().map((day) => {
                // Determine text color based on background to ensure visibility
                const getTextColor = () => {
                  if (day.hasLeave) {
                    return 'text-white';
                  }
                  return 'text-gray-800 dark:text-gray-200';
                };

                return (
                  <div
                    key={day.day}
                    className={`p-1 text-center rounded-md flex items-center justify-center ${day.isToday
                        ? 'ring-2 ring-blue-500 dark:ring-blue-400 font-bold'
                        : ''
                      } ${day.hasLeave
                        ? day.leaveType === 'paid'
                          ? 'bg-blue-500 dark:bg-blue-600'
                          : day.leaveType === 'sick'
                            ? 'bg-purple-500 dark:bg-purple-600'
                            : day.leaveType === 'casual'
                              ? 'bg-indigo-500 dark:bg-indigo-600'
                              : 'bg-gray-500 dark:bg-gray-600'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      } ${getTextColor()}`}
                  >
                    <span className="text-sm font-medium">{day.day}</span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-sm bg-blue-500 dark:bg-blue-600 mr-1"></div>
                <span className="text-gray-600 dark:text-gray-400">Paid</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-sm bg-purple-500 dark:bg-purple-600 mr-1"></div>
                <span className="text-gray-600 dark:text-gray-400">Sick</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-sm bg-indigo-500 dark:bg-indigo-600 mr-1"></div>
                <span className="text-gray-600 dark:text-gray-400">Casual</span>
              </div>
            </div>
          </div>

          {/* Team Availability - Move to bottom since it's secondary information */}
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Team Availability</h4>
            <div className="grid grid-cols-5 gap-2">
              {teamMembers.map((member) => (
                <div key={member.id} className="text-center">
                  <div className="font-medium text-gray-800 dark:text-gray-200 text-xs mb-1">
                    {member.name.split(' ')[0]}
                  </div>
                  <div
                    className={`h-4 rounded-md ${teamLeaves.some(leave => leave.userId === member.id)
                        ? 'bg-red-400 dark:bg-red-600'
                        : 'bg-green-400 dark:bg-green-600'
                      }`}
                  >
                    <span className="text-xs font-medium text-white">
                      {teamLeaves.some(leave => leave.userId === member.id) ? 'Away' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Leave Policy Reminders */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Leave Policy Reminders</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <li>Only 1 casual leave per week is allowed</li>
          <li>Maximum 5 paid leaves can be taken per month</li>
          <li>Miscellaneous leaves cannot be taken back-to-back for more than one day</li>
          <li>Emergency leaves are auto-approved but must be documented later</li>
        </ul>
      </div>

      {/* Leave Strategy Suggestions */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Leave Strategy Suggestions</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
          {leaveBalance && leaveBalance.paid > 8 && (
            <li>You have {leaveBalance.paid} paid leaves remaining. Consider planning a vacation!</li>
          )}
          {leaveBalance && leaveBalance.sick > 10 && (
            <li>You have many sick leaves available. Remember these cannot be carried over to next year.</li>
          )}
          {leaveBalance && leaveBalance.casual < 3 && (
            <li>You're running low on casual leaves. Use them wisely for the rest of the year.</li>
          )}
          <li>Combine weekends with your leaves for longer breaks.</li>
        </ul>
      </div>
    </div>
  );
};

// Helper component for leave usage bars
const LeaveUsageBar: React.FC<{
  type: string;
  used: number;
  total: number;
  color: string;
}> = ({ type, used, total, color }) => {
  const percentage = (used / total) * 100;
  const getColorClass = () => {
    switch (color) {
      case 'blue':
        return 'bg-blue-500 dark:bg-blue-600';
      case 'purple':
        return 'bg-purple-500 dark:bg-purple-600';
      case 'indigo':
        return 'bg-indigo-500 dark:bg-indigo-600';
      default:
        return 'bg-gray-500 dark:bg-gray-600';
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{type}</div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-16 flex flex-col justify-end overflow-hidden">
        <div
          className={`${getColorClass()} rounded-t-sm`}
          style={{ height: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
        {used}/{total}
      </div>
    </div>
  );
};

export default Dashboard;
