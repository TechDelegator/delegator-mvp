import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Link } from "react-router";

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
  status: "pending" | "approved" | "rejected" | "recalled";
  reason: string;
  appliedOn: string;
  isEmergency: boolean;
  recalledOn?: string;
  recallReason?: string;
};

// New type for manager assignments
type ManagerAssignment = {
  managerId: string;
  employeeIds: string[];
};

const Dashboard: React.FC = () => {
  const { userId } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [leaveApplications, setLeaveApplications] = useState<
    LeaveApplication[]
  >([]);
  const [teamLeaves, setTeamLeaves] = useState<LeaveApplication[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [recallModalOpen, setRecallModalOpen] = useState<string | null>(null);
  const [recallReason, setRecallReason] = useState<string>("");
  const [assignedManager, setAssignedManager] = useState<User | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch user data
    const fetchUserData = () => {
      const storedUsers = localStorage.getItem("leave-app-users");
      if (storedUsers) {
        const users: User[] = JSON.parse(storedUsers);
        const currentUser = users.find((u) => u.id === userId);
        if (currentUser) {
          setUser(currentUser);
        }

        // Get manager assignments
        const storedAssignments = localStorage.getItem(
          "leave-app-manager-assignments"
        );
        if (storedAssignments && userId) {
          const assignments: ManagerAssignment[] =
            JSON.parse(storedAssignments);

          // Find which manager this employee is assigned to
          let foundManagerId: string | null = null;
          for (const assignment of assignments) {
            if (assignment.employeeIds.includes(userId)) {
              foundManagerId = assignment.managerId;
              break;
            }
          }

          // Get manager's details
          if (foundManagerId) {
            const manager = users.find((u) => u.id === foundManagerId);
            if (manager) {
              setAssignedManager(manager);
            }
          }
        }
      }
    };

    // Fetch leave balance
    const fetchLeaveBalance = () => {
      const storedBalances = localStorage.getItem("leave-app-balances");
      if (storedBalances) {
        const balances: LeaveBalance[] = JSON.parse(storedBalances);
        const userBalance = balances.find((b) => b.userId === userId);
        if (userBalance) {
          setLeaveBalance(userBalance);
        }
      }
    };

    // Fetch leave applications
    const fetchLeaveApplications = () => {
      const storedApplications = localStorage.getItem("leave-app-applications");
      if (storedApplications) {
        const applications: LeaveApplication[] = JSON.parse(storedApplications);
        const userApplications = applications.filter(
          (a) => a.userId === userId
        );
        setLeaveApplications(userApplications);

        // Get team leaves (in a real app, this would be filtered by team)
        const otherApplications = applications.filter(
          (a) => a.userId !== userId && a.status === "approved"
        );
        setTeamLeaves(otherApplications);
      } else {
        // Initialize with empty array if none exist
        localStorage.setItem("leave-app-applications", JSON.stringify([]));
      }
    };

    // Generate notifications based on leave applications
    const generateNotifications = () => {
      const notes: string[] = [];

      if (leaveApplications.filter((a) => a.status === "pending").length > 0) {
        notes.push("You have pending leave applications awaiting approval.");
      }

      if (leaveBalance && leaveBalance.paid <= 2) {
        notes.push(
          "You have only a few paid leaves remaining. Plan your leaves wisely."
        );
      }

      // Add notification about assigned manager
      if (assignedManager) {
        notes.push(
          `Your leave requests will be reviewed by ${assignedManager.name}.`
        );
      } else {
        notes.push(
          "You don't have a manager assigned yet. Contact admin for help."
        );
      }

      // Add notification for recently recalled leaves
      const recentlyRecalled = leaveApplications.filter(
        (a) =>
          a.status === "recalled" &&
          new Date(a.recalledOn || "").getTime() >
            Date.now() - 7 * 24 * 60 * 60 * 1000 // within last 7 days
      );

      if (recentlyRecalled.length > 0) {
        notes.push(
          `You have ${recentlyRecalled.length} recently recalled leave(s). Your leave balance has been updated.`
        );
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
  }, [userId]); // Removed assignedManager from dependencies

  // Get upcoming leaves (next 30 days)
  const getUpcomingLeaves = () => {
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);

    return leaveApplications
      .filter((leave) => {
        const startDate = new Date(leave.startDate);
        return (
          leave.status === "approved" &&
          startDate >= today &&
          startDate <= thirtyDaysLater
        );
      })
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
  };

  // Get recent leave applications (last 5)
  const getRecentApplications = () => {
    return [...leaveApplications]
      .sort(
        (a, b) =>
          new Date(b.appliedOn).getTime() - new Date(a.appliedOn).getTime()
      )
      .slice(0, 5);
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

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "recalled":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    }
  };

  // Get leave type badge class
  const getLeaveTypeBadgeClass = (type: string) => {
    switch (type) {
      case "paid":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "sick":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "casual":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  // Function to handle recall leave
  const recallLeave = (leaveId: string) => {
    // Get existing applications from localStorage
    const storedApplications = localStorage.getItem("leave-app-applications");
    const storedBalances = localStorage.getItem("leave-app-balances");

    if (storedApplications && storedBalances) {
      const applications: LeaveApplication[] = JSON.parse(storedApplications);
      const balances: LeaveBalance[] = JSON.parse(storedBalances);

      // Find the leave to recall
      const leaveToRecall = applications.find((leave) => leave.id === leaveId);

      if (leaveToRecall) {
        // Check if leave was approved (need to restore balance)
        const wasApproved = leaveToRecall.status === "approved";

        // Update the leave status to 'recalled'
        const updatedApplications = applications.map((leave) => {
          if (leave.id === leaveId) {
            return {
              ...leave,
              status: "recalled",
              recalledOn: new Date().toISOString(),
              recallReason: recallReason || "No reason provided",
            };
          }
          return leave;
        });

        // Update leave applications in localStorage
        localStorage.setItem(
          "leave-app-applications",
          JSON.stringify(updatedApplications)
        );

        // If the leave was approved, restore the leave balance
        if (wasApproved) {
          const startDate = new Date(leaveToRecall.startDate);
          const endDate = new Date(leaveToRecall.endDate);
          const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days

          // Find user's balance
          const userBalanceIndex = balances.findIndex(
            (b) => b.userId === userId
          );

          if (userBalanceIndex !== -1) {
            const updatedBalance = { ...balances[userBalanceIndex] };

            // Restore appropriate leave balance
            if (leaveToRecall.type === "paid") {
              updatedBalance.paid += diffDays;
            } else if (leaveToRecall.type === "sick") {
              updatedBalance.sick += diffDays;
            } else if (leaveToRecall.type === "casual") {
              updatedBalance.casual += diffDays;
            } else if (leaveToRecall.type === "miscellaneous") {
              updatedBalance.miscellaneous += diffDays;
            }

            // Ensure we don't exceed max balances
            updatedBalance.paid = Math.min(
              updatedBalance.paid,
              updatedBalance.maxPaid
            );
            updatedBalance.sick = Math.min(
              updatedBalance.sick,
              updatedBalance.maxSick
            );
            updatedBalance.casual = Math.min(
              updatedBalance.casual,
              updatedBalance.maxCasual
            );
            updatedBalance.miscellaneous = Math.min(
              updatedBalance.miscellaneous,
              updatedBalance.maxMiscellaneous
            );

            // Update balances in localStorage
            balances[userBalanceIndex] = updatedBalance;
            localStorage.setItem(
              "leave-app-balances",
              JSON.stringify(balances)
            );

            // Update state
            setLeaveBalance(updatedBalance);
          }
        }

        // Update leave applications state
        setLeaveApplications((prevLeaves) =>
          prevLeaves.map((leave) => {
            if (leave.id === leaveId) {
              return {
                ...leave,
                status: "recalled",
                recalledOn: new Date().toISOString(),
                recallReason: recallReason || "No reason provided",
              };
            }
            return leave;
          })
        );

        // Show success message
        alert(
          `Leave has been successfully recalled.${
            wasApproved ? " Your leave balance has been restored." : ""
          }`
        );
      }

      // Close modal and reset state
      setRecallModalOpen(null);
      setRecallReason("");
    }
  };

  // Check if a leave can be recalled (pending or approved only)
  const canRecallLeave = (leave: LeaveApplication) => {
    return leave.status === "pending" || leave.status === "approved";
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
        hasLeave: leaveApplications.some((leave) => {
          const leaveStart = new Date(leave.startDate);
          const leaveEnd = new Date(leave.endDate);
          return (
            leave.status === "approved" &&
            date >= leaveStart &&
            date <= leaveEnd
          );
        }),
        leaveType:
          leaveApplications.find((leave) => {
            const leaveStart = new Date(leave.startDate);
            const leaveEnd = new Date(leave.endDate);
            return (
              leave.status === "approved" &&
              date >= leaveStart &&
              date <= leaveEnd
            );
          })?.type || "",
      };
    });
  };

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Dashboard
      </h2>

      {/* Notifications - Mobile optimized */}
      {notifications.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notifications
          </h3>
          <div className="bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500 p-2 sm:p-4 rounded">
            <ul className="list-disc pl-4 space-y-1">
              {notifications.map((note, index) => (
                <li
                  key={index}
                  className="text-xs sm:text-sm text-blue-700 dark:text-blue-300"
                >
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Manager Information Card - New Section */}
      <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Manager
        </h3>
        {assignedManager ? (
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-lg">
              {assignedManager.name.charAt(0)}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {assignedManager.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {assignedManager.email}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You don't have a manager assigned yet. Please contact an admin.
          </p>
        )}
      </div>

      {/* Quick Actions - Mobile optimized */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/dashboard/employee/${userId}/apply-leave`}
            className="inline-flex items-center px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm bg-blue-600 border border-transparent rounded-md font-semibold text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-900 focus:outline-none"
          >
            Apply for Leave
          </Link>

          <Link
            to={`/dashboard/employee/${userId}/apply-leave?emergency=true`}
            className="inline-flex items-center px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm bg-red-600 border border-transparent rounded-md font-semibold text-white uppercase tracking-widest hover:bg-red-700 active:bg-red-900 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            Emergency Leave
          </Link>
          <Link
            to={`/dashboard/employee/${userId}/my-leaves`}
            className="inline-flex items-center px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm bg-gray-600 border border-transparent rounded-md font-semibold text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 focus:outline-none"
          >
            View My Leaves
          </Link>
        </div>
      </div>

      {/* Main dashboard sections - Mobile optimized grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Leave Usage Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Leave Usage
          </h3>
          <div className="h-36 sm:h-48 flex items-center justify-center">
            {leaveBalance ? (
              <div className="grid grid-cols-4 gap-1 sm:gap-2 w-full">
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
                  used={
                    leaveBalance.maxMiscellaneous - leaveBalance.miscellaneous
                  }
                  total={leaveBalance.maxMiscellaneous}
                  color="gray"
                />
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Loading leave data...
              </p>
            )}
          </div>
        </div>

        {/* Upcoming Leaves */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Upcoming Leaves
          </h3>
          <div className="h-36 sm:h-48 overflow-y-auto">
            {getUpcomingLeaves().length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {getUpcomingLeaves().map((leave) => (
                  <li key={leave.id} className="py-2">
                    <div className="flex items-center">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                          {formatDate(leave.startDate)} -{" "}
                          {formatDate(leave.endDate)}
                        </p>
                        <div className="flex items-center flex-wrap gap-1 mt-1">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getLeaveTypeBadgeClass(
                              leave.type
                            )}`}
                          >
                            {leave.type.charAt(0).toUpperCase() +
                              leave.type.slice(1)}
                          </span>
                          {leave.isEmergency && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
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
              <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">
                No upcoming leaves
              </p>
            )}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recent Applications
          </h3>
          <div className="h-36 sm:h-48 overflow-y-auto">
            {getRecentApplications().length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {getRecentApplications().map((application) => (
                  <li key={application.id} className="py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                          {formatDate(application.startDate)} -{" "}
                          {formatDate(application.endDate)}
                        </p>
                        <div className="flex items-center flex-wrap gap-1 mt-1">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getLeaveTypeBadgeClass(
                              application.type
                            )}`}
                          >
                            {application.type.charAt(0).toUpperCase() +
                              application.type.slice(1)}
                          </span>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getStatusBadgeClass(
                              application.status
                            )}`}
                          >
                            {application.status.charAt(0).toUpperCase() +
                              application.status.slice(1)}
                          </span>
                          {application.recalledOn && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Recalled: {formatDate(application.recalledOn)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-shrink-0">
                        {application.status === "rejected" && (
                          <button
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            onClick={() =>
                              navigate(
                                `/dashboard/employee/${userId}/apply-leave?reapply=${application.id}`
                              )
                            }
                          >
                            Reapply
                          </button>
                        )}

                        {canRecallLeave(application) && (
                          <button
                            className="text-xs text-red-600 dark:text-red-400 hover:underline ml-2"
                            onClick={() => setRecallModalOpen(application.id)}
                          >
                            Recall
                          </button>
                        )}

                        {application.status === "pending" && (
                          <button
                            className="text-xs text-red-600 dark:text-red-400 hover:underline ml-2"
                            onClick={() => {
                              if (
                                confirm(
                                  "Are you sure you want to cancel this leave application?"
                                )
                              ) {
                                // Logic to cancel the leave (you can implement this in a function similar to the one in the MyLeaves component)
                                // For now, just show an alert
                                alert(
                                  "This functionality will be implemented soon."
                                );
                              }
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">
                No recent applications
              </p>
            )}
          </div>
        </div>

        {/* Team Calendar - Mobile optimized */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Team Calendar
          </h3>

          {/* Monthly Calendar */}
          <div>
            <h4 className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1">
              This Month
            </h4>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                <div
                  key={index}
                  className="text-center text-xs font-medium text-gray-700 dark:text-gray-300"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid - More compact for mobile */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInCurrentMonth().map((day) => {
                const getTextColor = () => {
                  if (day.hasLeave) {
                    return "text-white";
                  }
                  return "text-gray-800 dark:text-gray-200";
                };

                return (
                  <div
                    key={day.day}
                    className={`p-1 text-center rounded-md flex items-center justify-center ${
                      day.isToday
                        ? "ring-1 ring-blue-500 dark:ring-blue-400 font-bold"
                        : ""
                    } ${
                      day.hasLeave
                        ? day.leaveType === "paid"
                          ? "bg-blue-500 dark:bg-blue-600"
                          : day.leaveType === "sick"
                          ? "bg-purple-500 dark:bg-purple-600"
                          : day.leaveType === "casual"
                          ? "bg-indigo-500 dark:bg-indigo-600"
                          : "bg-gray-500 dark:bg-gray-600"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    } ${getTextColor()}`}
                  >
                    <span className="text-xs font-medium">{day.day}</span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-sm bg-blue-500 dark:bg-blue-600 mr-1"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Paid
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-sm bg-purple-500 dark:bg-purple-600 mr-1"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Sick
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-sm bg-indigo-500 dark:bg-indigo-600 mr-1"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Casual
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Policy Reminders - Mobile optimized 
      <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow p-3 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Leave Policy Reminders
        </h3>
        <ul className="list-disc pl-4 space-y-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          <li>Only 1 casual leave per week is allowed</li>
          <li>Maximum 5 paid leaves can be taken per month</li>
          <li>
            Miscellaneous leaves cannot be taken back-to-back for more than one
            day
          </li>
          <li>
            Emergency leaves are auto-approved but must be documented later
          </li>
          <li>
            You can recall approved or pending leaves if your plans change
          </li>
          <li>
            Your leave requests will be reviewed by{" "}
            {assignedManager ? assignedManager.name : "your assigned manager"}
          </li>
        </ul>
      </div> */}

      {/* Leave Strategy Suggestions - Mobile optimized */}
      <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow p-3 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Leave Strategy Suggestions
        </h3>
        <ul className="list-disc pl-4 space-y-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          {leaveBalance && leaveBalance.paid > 8 && (
            <li>
              You have {leaveBalance.paid} paid leaves remaining. Consider
              planning a vacation!
            </li>
          )}
          {leaveBalance && leaveBalance.sick > 10 && (
            <li>
              You have many sick leaves available. Remember these cannot be
              carried over to next year.
            </li>
          )}
          {leaveBalance && leaveBalance.casual < 3 && (
            <li>
              You're running low on casual leaves. Use them wisely for the rest
              of the year.
            </li>
          )}
          <li>Combine weekends with your leaves for longer breaks.</li>
        </ul>
      </div>

      {/* Recall Leave Modal */}
      {recallModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Recall Leave Request
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to recall this leave request?
                {recallModalOpen &&
                  leaveApplications.find(
                    (leave) => leave.id === recallModalOpen
                  )?.status === "approved" &&
                  " Your leave balance will be restored."}
              </p>

              <div className="mb-4">
                <label
                  htmlFor="recallReason"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Reason for Recall (Optional)
                </label>
                <textarea
                  id="recallReason"
                  rows={3}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={recallReason}
                  onChange={(e) => setRecallReason(e.target.value)}
                  placeholder="Please provide a reason for recalling this leave..."
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={() => {
                    setRecallModalOpen(null);
                    setRecallReason("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  onClick={() => recallLeave(recallModalOpen)}
                >
                  Recall Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for leave usage bars - Mobile optimized
const LeaveUsageBar: React.FC<{
  type: string;
  used: number;
  total: number;
  color: string;
}> = ({ type, used, total, color }) => {
  const percentage = (used / total) * 100;
  const getColorClass = () => {
    switch (color) {
      case "blue":
        return "bg-blue-500 dark:bg-blue-600";
      case "purple":
        return "bg-purple-500 dark:bg-purple-600";
      case "indigo":
        return "bg-indigo-500 dark:bg-indigo-600";
      default:
        return "bg-gray-500 dark:bg-gray-600";
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
        {type}
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-12 sm:h-16 flex flex-col justify-end overflow-hidden">
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
