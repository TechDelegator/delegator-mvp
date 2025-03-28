import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

// Define types
type User = {
  id: string;
  name: string;
  role: "employee" | "admin" | "manager";
  email: string;
};

type LeaveApplication = {
  id: string;
  userId: string;
  type: "paid" | "sick" | "casual" | "miscellaneous";
  startDate: string;
  endDate: string;
  status: "pending" | "approved" | "rejected" | "recalled";
  reason: string;
  appliedOn: string;
  isEmergency: boolean;
  rejectionReason?: string;
  recalledOn?: string;
  recallReason?: string;
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

const ManagerDashboard: React.FC = () => {
  const { userId } = useParams();
  const [pendingLeaves, setPendingLeaves] = useState<LeaveApplication[]>([]);
  const [recentlyProcessed, setRecentlyProcessed] = useState<
    LeaveApplication[]
  >([]);
  const [recalledLeaves, setRecalledLeaves] = useState<LeaveApplication[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectModalOpen, setRejectModalOpen] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [filter, setFilter] = useState("all");

  const navigate = useNavigate();

  const handleLogout = () => {
    // Navigate back to the user selection screen
    navigate("/");
  };

  useEffect(() => {
    // Fetch pending leave applications and user data
    const fetchData = () => {
      setIsLoading(true);
      const storedApplications = localStorage.getItem("leave-app-applications");
      const storedUsers = localStorage.getItem("leave-app-users");

      if (storedApplications && storedUsers) {
        const applications: LeaveApplication[] = JSON.parse(storedApplications);
        const allUsers: User[] = JSON.parse(storedUsers);

        // Find current manager
        const manager = allUsers.find((u) => u.id === userId);
        if (manager) {
          setCurrentUser(manager);
        }

        // Get pending applications
        const pendingApplications = applications.filter(
          (app) => app.status === "pending"
        );

        // Sort by emergency first, then by application date
        pendingApplications.sort((a, b) => {
          if (a.isEmergency && !b.isEmergency) return -1;
          if (!a.isEmergency && b.isEmergency) return 1;
          return (
            new Date(b.appliedOn).getTime() - new Date(a.appliedOn).getTime()
          );
        });

        setPendingLeaves(pendingApplications);

        // Get recently processed leaves (last 10)
        const processedLeaves = applications
          .filter(
            (app) => app.status === "approved" || app.status === "rejected"
          )
          .sort(
            (a, b) =>
              new Date(b.appliedOn).getTime() - new Date(a.appliedOn).getTime()
          )
          .slice(0, 5);

        setRecentlyProcessed(processedLeaves);

        // Get recently recalled leaves (last 5)
        const recalled = applications
          .filter((app) => app.status === "recalled")
          .sort(
            (a, b) =>
              new Date(b.recalledOn || "").getTime() -
              new Date(a.recalledOn || "").getTime()
          )
          .slice(0, 5);

        setRecalledLeaves(recalled);

        setUsers(allUsers);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [userId]);

  // Get user name by ID
  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.name : "Unknown User";
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate leave duration in days
  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
    return diffDays;
  };

  // Get leave type color class
  const getLeaveTypeColorClass = (type: string) => {
    switch (type) {
      case "paid":
        return "bg-blue-500 text-white";
      case "sick":
        return "bg-purple-500 text-white";
      case "casual":
        return "bg-indigo-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  // Get status color class
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "recalled":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  // Approve leave request
  const approveLeave = (leaveId: string) => {
    // Get existing applications from localStorage
    const storedApplications = localStorage.getItem("leave-app-applications");
    const storedBalances = localStorage.getItem("leave-app-balances");

    if (storedApplications && storedBalances) {
      const applications: LeaveApplication[] = JSON.parse(storedApplications);
      const balances: LeaveBalance[] = JSON.parse(storedBalances);

      // Find the leave to approve
      const leaveToApprove = applications.find((leave) => leave.id === leaveId);

      if (leaveToApprove) {
        // Update the leave status to 'approved'
        const updatedApplications = applications.map((leave) => {
          if (leave.id === leaveId) {
            return { ...leave, status: "approved" as const };
          }
          return leave;
        });

        // Update the user's leave balance
        const leaveUserId = leaveToApprove.userId;
        const leaveDuration = calculateDuration(
          leaveToApprove.startDate,
          leaveToApprove.endDate
        );
        const leaveType = leaveToApprove.type;

        const updatedBalances = balances.map((balance) => {
          if (balance.userId === leaveUserId) {
            const newBalance = { ...balance };

            // Deduct the leave days from the appropriate balance
            if (leaveType === "paid") {
              newBalance.paid = Math.max(0, newBalance.paid - leaveDuration);
            } else if (leaveType === "sick") {
              newBalance.sick = Math.max(0, newBalance.sick - leaveDuration);
            } else if (leaveType === "casual") {
              newBalance.casual = Math.max(
                0,
                newBalance.casual - leaveDuration
              );
            } else if (leaveType === "miscellaneous") {
              newBalance.miscellaneous = Math.max(
                0,
                newBalance.miscellaneous - leaveDuration
              );
            }

            return newBalance;
          }
          return balance;
        });

        // Save updated data to localStorage
        localStorage.setItem(
          "leave-app-applications",
          JSON.stringify(updatedApplications)
        );
        localStorage.setItem(
          "leave-app-balances",
          JSON.stringify(updatedBalances)
        );

        // Update the UI
        const approvedLeave = applications.find(
          (leave) => leave.id === leaveId
        );
        if (approvedLeave) {
          setPendingLeaves((prevLeaves) =>
            prevLeaves.filter((leave) => leave.id !== leaveId)
          );
          setRecentlyProcessed((prev) =>
            [{ ...approvedLeave, status: "approved" as const }, ...prev].slice(
              0,
              5
            )
          );
        }
      }
    }
  };

  // Reject leave request
  const rejectLeave = (leaveId: string) => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    // Get existing applications from localStorage
    const storedApplications = localStorage.getItem("leave-app-applications");

    if (storedApplications) {
      const applications: LeaveApplication[] = JSON.parse(storedApplications);
      const leaveToReject = applications.find((leave) => leave.id === leaveId);

      // Update the leave status to 'rejected' and add rejection reason
      const updatedApplications = applications.map((leave) => {
        if (leave.id === leaveId) {
          return {
            ...leave,
            status: "rejected" as const,
            rejectionReason: rejectionReason,
          };
        }
        return leave;
      });

      // Save to localStorage
      localStorage.setItem(
        "leave-app-applications",
        JSON.stringify(updatedApplications)
      );

      // Update the UI
      if (leaveToReject) {
        setPendingLeaves((prevLeaves) =>
          prevLeaves.filter((leave) => leave.id !== leaveId)
        );
        setRecentlyProcessed((prev) =>
          [
            { ...leaveToReject, status: "rejected" as const, rejectionReason },
            ...prev,
          ].slice(0, 5)
        );
      }

      // Close the rejection modal
      setRejectModalOpen(null);
      setRejectionReason("");
    }
  };

  // Get filtered pending leaves
  const getFilteredLeaves = () => {
    if (filter === "all") return pendingLeaves;
    if (filter === "emergency")
      return pendingLeaves.filter((leave) => leave.isEmergency);
    return pendingLeaves.filter((leave) => leave.type === filter);
  };

  const filteredLeaves = getFilteredLeaves();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      {/* Header with user info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Delegator
          </h1>
          {currentUser && (
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back, {currentUser.name}
            </p>
          )}
        </div>

        <div className="mt-4 md:mt-0 flex items-center">
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium dark:bg-blue-900 dark:text-blue-200">
            {pendingLeaves.length} Pending Requests
          </div>
          {pendingLeaves.filter((l) => l.isEmergency).length > 0 && (
            <div className="ml-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium dark:bg-red-900 dark:text-red-200 animate-pulse">
              {pendingLeaves.filter((l) => l.isEmergency).length} Emergency
            </div>
          )}
          {recalledLeaves.length > 0 && (
            <div className="ml-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium dark:bg-orange-900 dark:text-orange-200">
              {recalledLeaves.length} Recalled
            </div>
          )}
          <button
            onClick={handleLogout}
            className="ml-4 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm mb-6">
        <div className="flex items-center justify-between flex-wrap">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 md:mb-0">
            Leave Requests
          </h3>

          <div className="flex space-x-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-gray-900 text-white dark:bg-gray-700"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("emergency")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === "emergency"
                  ? "bg-red-600 text-white"
                  : "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
              }`}
            >
              Emergency
            </button>
            <button
              onClick={() => setFilter("paid")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === "paid"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => setFilter("sick")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === "sick"
                  ? "bg-purple-600 text-white"
                  : "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
              }`}
            >
              Sick
            </button>
            <button
              onClick={() => setFilter("casual")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === "casual"
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
              }`}
            >
              Casual
            </button>
            <button
              onClick={() => setFilter("miscellaneous")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === "miscellaneous"
                  ? "bg-gray-600 text-white"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              Misc
            </button>
          </div>
        </div>
      </div>

      {/* Pending Leave Cards */}
      <div className="mb-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Pending Requests
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {filter === "all"
                ? "All leave requests have been processed. Check back later for new requests."
                : `No ${
                    filter === "emergency" ? "emergency" : filter
                  } leave requests are pending.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredLeaves.map((leave) => (
              <div
                key={leave.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Leave type indicator */}
                  <div
                    className={`${getLeaveTypeColorClass(
                      leave.type
                    )} w-full md:w-2 md:h-auto flex-shrink-0`}
                  ></div>

                  {/* Content */}
                  <div className="p-5 flex-grow grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Employee info */}
                    <div className="flex items-center md:col-span-1">
                      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg font-medium text-gray-700 dark:text-gray-300">
                        {getUserName(leave.userId).charAt(0)}
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {getUserName(leave.userId)}
                        </h4>
                        <div className="flex items-center mt-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLeaveTypeColorClass(
                              leave.type
                            )}`}
                          >
                            {leave.type.charAt(0).toUpperCase() +
                              leave.type.slice(1)}
                          </span>
                          {leave.isEmergency && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">
                              Emergency
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Applied on {formatDate(leave.appliedOn)}
                        </p>
                      </div>
                    </div>

                    {/* Period */}
                    <div className="md:col-span-1">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Period
                      </h5>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {formatDate(leave.startDate)} -{" "}
                        {formatDate(leave.endDate)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {calculateDuration(leave.startDate, leave.endDate)}{" "}
                        day(s)
                      </p>
                    </div>

                    {/* Reason */}
                    <div className="md:col-span-1">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Reason
                      </h5>
                      <p className="text-gray-900 dark:text-white">
                        {leave.reason}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="md:col-span-1 flex items-center justify-end">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => approveLeave(leave.id)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectModalOpen(leave.id)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recalled Leaves */}
      {recalledLeaves.length > 0 && (
        <div className="mt-8 mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Recently Recalled Leaves
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {recalledLeaves.map((leave) => (
              <div
                key={leave.id}
                className="border border-orange-200 dark:border-orange-800 rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300">
                      {getUserName(leave.userId).charAt(0)}
                    </div>
                    <div className="ml-4">
                      <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                        {getUserName(leave.userId)}
                      </h4>
                      <div className="flex items-center flex-wrap gap-2 mt-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLeaveTypeColorClass(
                            leave.type
                          )}`}
                        >
                          {leave.type.charAt(0).toUpperCase() +
                            leave.type.slice(1)}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                          Recalled
                        </span>
                        {leave.isEmergency && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                            Emergency
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 md:mt-0 ml-0 md:ml-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(leave.startDate)} -{" "}
                      {formatDate(leave.endDate)} (
                      {calculateDuration(leave.startDate, leave.endDate)}{" "}
                      day(s))
                    </p>
                    <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                      Recalled on: {formatDate(leave.recalledOn || "")}
                    </p>
                    {leave.recallReason && (
                      <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                        Reason: {leave.recallReason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently Processed Leaves */}
      {recentlyProcessed.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Recently Processed
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {recentlyProcessed.map((leave) => (
              <div
                key={leave.id}
                className={`border ${getStatusColorClass(
                  leave.status
                )} rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300">
                      {getUserName(leave.userId).charAt(0)}
                    </div>
                    <div className="ml-4">
                      <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                        {getUserName(leave.userId)}
                      </h4>
                      <div className="flex items-center flex-wrap gap-2 mt-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLeaveTypeColorClass(
                            leave.type
                          )}`}
                        >
                          {leave.type.charAt(0).toUpperCase() +
                            leave.type.slice(1)}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            leave.status === "approved"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                          }`}
                        >
                          {leave.status.charAt(0).toUpperCase() +
                            leave.status.slice(1)}
                        </span>
                        {leave.isEmergency && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                            Emergency
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 md:mt-0 ml-0 md:ml-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(leave.startDate)} -{" "}
                      {formatDate(leave.endDate)} (
                      {calculateDuration(leave.startDate, leave.endDate)}{" "}
                      day(s))
                    </p>
                    {leave.rejectionReason && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        Reason: {leave.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Reject Leave Request
                </h3>
                <button
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={() => {
                    setRejectModalOpen(null);
                    setRejectionReason("");
                  }}
                >
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
                </button>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Please provide a reason for rejecting this leave request. This
                will be shared with the employee.
              </p>

              <div className="mb-4">
                <label
                  htmlFor="rejectionReason"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Reason for Rejection
                </label>
                <textarea
                  id="rejectionReason"
                  rows={4}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => {
                    setRejectModalOpen(null);
                    setRejectionReason("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  onClick={() => rejectLeave(rejectModalOpen)}
                  disabled={!rejectionReason.trim()}
                >
                  Reject Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
