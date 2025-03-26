import React, { useEffect, useState } from "react";
import { useParams } from "react-router";

// Define types
type User = {
  id: string;
  name: string;
  role: "employee" | "admin" | "manager";
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
  type: "paid" | "sick" | "casual" | "miscellaneous";
  startDate: string;
  endDate: string;
  status: "pending" | "approved" | "rejected";
  reason: string;
  appliedOn: string;
  isEmergency: boolean;
};

const Profile: React.FC = () => {
  const { userId } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [leaveApplications, setLeaveApplications] = useState<
    LeaveApplication[]
  >([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [leaveStats, setLeaveStats] = useState({
    totalRequested: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    emergency: 0,
  });

  useEffect(() => {
    const fetchUserData = () => {
      setIsLoading(true);

      // Fetch user
      const storedUsers = localStorage.getItem("leave-app-users");
      if (storedUsers) {
        const users: User[] = JSON.parse(storedUsers);
        const currentUser = users.find((u) => u.id === userId);
        if (currentUser) {
          setUser(currentUser);
          setEditName(currentUser.name);
          setEditEmail(currentUser.email);
        }
      }

      // Fetch leave balance
      const storedBalances = localStorage.getItem("leave-app-balances");
      if (storedBalances) {
        const balances: LeaveBalance[] = JSON.parse(storedBalances);
        const userBalance = balances.find((b) => b.userId === userId);
        if (userBalance) {
          setLeaveBalance(userBalance);
        }
      }

      // Fetch leave applications
      const storedApplications = localStorage.getItem("leave-app-applications");
      if (storedApplications) {
        const applications: LeaveApplication[] = JSON.parse(storedApplications);
        const userApplications = applications.filter(
          (a) => a.userId === userId
        );
        setLeaveApplications(userApplications);

        // Calculate leave statistics
        const stats = {
          totalRequested: userApplications.length,
          approved: userApplications.filter((a) => a.status === "approved")
            .length,
          rejected: userApplications.filter((a) => a.status === "rejected")
            .length,
          pending: userApplications.filter((a) => a.status === "pending")
            .length,
          emergency: userApplications.filter((a) => a.isEmergency).length,
        };
        setLeaveStats(stats);
      }

      setIsLoading(false);
    };

    fetchUserData();
  }, [userId]);

  const handleSaveProfile = () => {
    if (!user) return;

    // Update user data in localStorage
    const storedUsers = localStorage.getItem("leave-app-users");
    if (storedUsers) {
      const users: User[] = JSON.parse(storedUsers);
      const updatedUsers = users.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            name: editName,
            email: editEmail,
          };
        }
        return u;
      });

      localStorage.setItem("leave-app-users", JSON.stringify(updatedUsers));

      // Update local state
      setUser({
        ...user,
        name: editName,
        email: editEmail,
      });

      setIsEditing(false);
    }
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
    return diffDays;
  };

  const calculateTotalDaysByType = () => {
    const approvedLeaves = leaveApplications.filter(
      (leave) => leave.status === "approved"
    );

    const byType = {
      paid: 0,
      sick: 0,
      casual: 0,
      miscellaneous: 0,
    };

    approvedLeaves.forEach((leave) => {
      const days = calculateDuration(leave.startDate, leave.endDate);
      byType[leave.type] += days;
    });

    return byType;
  };

  const leaveDaysByType = calculateTotalDaysByType();

  // Get leave utilization percentage
  const getUtilizationPercentage = (used: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((used / total) * 100);
  };

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
        My Profile
      </h2>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
              <h3 className="text-md font-medium text-gray-900 dark:text-white">
                Personal Information
              </h3>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-2 sm:mt-0 text-sm text-blue-600 dark:text-blue-500 hover:underline"
                >
                  Edit
                </button>
              ) : (
                <div className="mt-2 sm:mt-0 flex space-x-2">
                  <button
                    onClick={handleSaveProfile}
                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(user?.name || "");
                      setEditEmail(user?.email || "");
                    }}
                    className="text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {!isEditing ? (
              <div className="space-y-3">
                <div className="flex">
                  <div className="w-24 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Name:
                  </div>
                  <div className="flex-1 text-sm text-gray-900 dark:text-white">
                    {user?.name}
                  </div>
                </div>
                <div className="flex">
                  <div className="w-24 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Email:
                  </div>
                  <div className="flex-1 text-sm text-gray-900 dark:text-white">
                    {user?.email}
                  </div>
                </div>
                <div className="flex">
                  <div className="w-24 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Role:
                  </div>
                  <div className="flex-1 text-sm text-gray-900 dark:text-white capitalize">
                    {user?.role}
                  </div>
                </div>
                <div className="flex">
                  <div className="w-24 text-sm font-medium text-gray-500 dark:text-gray-400">
                    ID:
                  </div>
                  <div className="flex-1 text-sm text-gray-900 dark:text-white">
                    {user?.id}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    value={user?.role || ""}
                    disabled
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Role cannot be changed
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Leave Balance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
              Leave Balance
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Paid Leave */}
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                  Paid Leave
                </h4>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    Remaining
                  </span>
                  <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                    {leaveBalance?.paid || 0}/{leaveBalance?.maxPaid || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{
                      width: `${
                        ((leaveBalance?.paid || 0) /
                          (leaveBalance?.maxPaid || 1)) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                  Used: {leaveDaysByType.paid} days
                </div>
              </div>

              {/* Sick Leave */}
              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3">
                <h4 className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-2">
                  Sick Leave
                </h4>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-purple-600 dark:text-purple-400">
                    Remaining
                  </span>
                  <span className="text-sm font-semibold text-purple-800 dark:text-purple-300">
                    {leaveBalance?.sick || 0}/{leaveBalance?.maxSick || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-purple-600 h-1.5 rounded-full"
                    style={{
                      width: `${
                        ((leaveBalance?.sick || 0) /
                          (leaveBalance?.maxSick || 1)) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                  Used: {leaveDaysByType.sick} days
                </div>
              </div>

              {/* Casual Leave */}
              <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-3">
                <h4 className="text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-2">
                  Casual Leave
                </h4>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-indigo-600 dark:text-indigo-400">
                    Remaining
                  </span>
                  <span className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">
                    {leaveBalance?.casual || 0}/{leaveBalance?.maxCasual || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-indigo-600 h-1.5 rounded-full"
                    style={{
                      width: `${
                        ((leaveBalance?.casual || 0) /
                          (leaveBalance?.maxCasual || 1)) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400">
                  Used: {leaveDaysByType.casual} days
                </div>
              </div>

              {/* Miscellaneous Leave */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">
                  Miscellaneous
                </h4>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Remaining
                  </span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-300">
                    {leaveBalance?.miscellaneous || 0}/
                    {leaveBalance?.maxMiscellaneous || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-gray-600 h-1.5 rounded-full"
                    style={{
                      width: `${
                        ((leaveBalance?.miscellaneous || 0) /
                          (leaveBalance?.maxMiscellaneous || 1)) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  Used: {leaveDaysByType.miscellaneous} days
                </div>
              </div>
            </div>
          </div>

          {/* Leave Statistics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
              Leave Statistics
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {leaveStats.totalRequested}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Total Requests
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {leaveStats.approved}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  Approved
                </div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {leaveStats.pending}
                </div>
                <div className="text-xs text-yellow-600 dark:text-yellow-400">
                  Pending
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {leaveStats.rejected}
                </div>
                <div className="text-xs text-red-600 dark:text-red-400">
                  Rejected
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {leaveStats.emergency}
                </div>
                <div className="text-xs text-amber-600 dark:text-amber-400">
                  Emergency
                </div>
              </div>
            </div>

            {/* Leave Usage Chart */}
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Leave Utilization
            </h4>

            <div className="space-y-3">
              {/* Paid Leave Usage */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Paid Leave
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {getUtilizationPercentage(
                      (leaveBalance?.maxPaid || 0) - (leaveBalance?.paid || 0),
                      leaveBalance?.maxPaid || 0
                    )}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${getUtilizationPercentage(
                        (leaveBalance?.maxPaid || 0) -
                          (leaveBalance?.paid || 0),
                        leaveBalance?.maxPaid || 0
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Sick Leave Usage */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Sick Leave
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {getUtilizationPercentage(
                      (leaveBalance?.maxSick || 0) - (leaveBalance?.sick || 0),
                      leaveBalance?.maxSick || 0
                    )}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{
                      width: `${getUtilizationPercentage(
                        (leaveBalance?.maxSick || 0) -
                          (leaveBalance?.sick || 0),
                        leaveBalance?.maxSick || 0
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Casual Leave Usage */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Casual Leave
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {getUtilizationPercentage(
                      (leaveBalance?.maxCasual || 0) -
                        (leaveBalance?.casual || 0),
                      leaveBalance?.maxCasual || 0
                    )}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{
                      width: `${getUtilizationPercentage(
                        (leaveBalance?.maxCasual || 0) -
                          (leaveBalance?.casual || 0),
                        leaveBalance?.maxCasual || 0
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Miscellaneous Leave Usage */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Miscellaneous
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {getUtilizationPercentage(
                      (leaveBalance?.maxMiscellaneous || 0) -
                        (leaveBalance?.miscellaneous || 0),
                      leaveBalance?.maxMiscellaneous || 0
                    )}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gray-600 h-2 rounded-full"
                    style={{
                      width: `${getUtilizationPercentage(
                        (leaveBalance?.maxMiscellaneous || 0) -
                          (leaveBalance?.miscellaneous || 0),
                        leaveBalance?.maxMiscellaneous || 0
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
              Account Settings
            </h3>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notification Preferences
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      id="emailNotif"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      defaultChecked
                    />
                    <label
                      htmlFor="emailNotif"
                      className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                    >
                      Email notifications for leave status updates
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="reminderNotif"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      defaultChecked
                    />
                    <label
                      htmlFor="reminderNotif"
                      className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                    >
                      Reminders for upcoming leaves
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="teamNotif"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      defaultChecked
                    />
                    <label
                      htmlFor="teamNotif"
                      className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                    >
                      Notifications for team members' leaves
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </h4>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700">
                    Light
                  </button>
                  <button className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white">
                    Dark
                  </button>
                  <button className="px-3 py-1 text-xs bg-gray-100 border border-gray-300 rounded text-gray-700">
                    System
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Note: Theme functionality is not implemented in this prototype
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </h4>
                <button className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300">
                  Change Password
                </button>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Note: Password functionality is not implemented in this
                  prototype
                </p>
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
              Feedback
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              We value your feedback to improve our leave management system.
            </p>

            <textarea
              rows={3}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Share your thoughts, suggestions, or report bugs..."
            ></textarea>

            <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Submit Feedback
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
