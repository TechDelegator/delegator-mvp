import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";

// Define types
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

const MyLeaves: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [filteredLeaves, setFilteredLeaves] = useState<LeaveApplication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [detailView, setDetailView] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  // Recall state
  const [recallConfirm, setRecallConfirm] = useState<string | null>(null);
  const [recallReason, setRecallReason] = useState<string>("");

  useEffect(() => {
    // Fetch leave applications
    const fetchLeaveApplications = () => {
      setIsLoading(true);
      const storedApplications = localStorage.getItem("leave-app-applications");

      if (storedApplications) {
        const applications: LeaveApplication[] = JSON.parse(storedApplications);
        const userApplications = applications.filter(
          (a) => a.userId === userId
        );

        // Sort by applied date (newest first)
        userApplications.sort(
          (a, b) =>
            new Date(b.appliedOn).getTime() - new Date(a.appliedOn).getTime()
        );

        setLeaves(userApplications);

        // Extract available years for filtering
        const years = userApplications.map((leave) =>
          new Date(leave.startDate).getFullYear().toString()
        );
        const uniqueYears = Array.from(new Set(years)).sort((a, b) =>
          b.localeCompare(a)
        ); // Newest first
        setAvailableYears(uniqueYears);

        // Apply initial filters
        applyFilters(userApplications, "all", "all", "all");
      } else {
        setLeaves([]);
        setFilteredLeaves([]);
      }

      setIsLoading(false);
    };

    fetchLeaveApplications();
  }, [userId]);

  // Apply filters
  const applyFilters = (
    leaveList: LeaveApplication[],
    status: string,
    type: string,
    year: string
  ) => {
    let filtered = [...leaveList];

    // Filter by status
    if (status !== "all") {
      filtered = filtered.filter((leave) => leave.status === status);
    }

    // Filter by leave type
    if (type !== "all") {
      filtered = filtered.filter((leave) => leave.type === type);
    }

    // Filter by year
    if (year !== "all") {
      filtered = filtered.filter(
        (leave) => new Date(leave.startDate).getFullYear().toString() === year
      );
    }

    setFilteredLeaves(filtered);
  };

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === "status") {
      setStatusFilter(value);
      applyFilters(leaves, value, typeFilter, yearFilter);
    } else if (filterType === "type") {
      setTypeFilter(value);
      applyFilters(leaves, statusFilter, value, yearFilter);
    } else if (filterType === "year") {
      setYearFilter(value);
      applyFilters(leaves, statusFilter, typeFilter, value);
    }
  };

  // Format date
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

  // Cancel a leave application
  const cancelLeave = (leaveId: string) => {
    // Get existing applications from localStorage
    const storedApplications = localStorage.getItem("leave-app-applications");

    if (storedApplications) {
      const applications: LeaveApplication[] = JSON.parse(storedApplications);

      // Find the leave to cancel
      const updatedApplications = applications.map((leave) => {
        if (leave.id === leaveId && leave.userId === userId) {
          // Mark as canceled (we're considering canceled as a type of "rejected" for simplicity)
          return {
            ...leave,
            status: "rejected",
            rejectionReason: cancelReason || "Canceled by employee",
          };
        }
        return leave;
      });

      // Save to localStorage
      localStorage.setItem(
        "leave-app-applications",
        JSON.stringify(updatedApplications)
      );

      // Update state
      const updatedLeaves = leaves.map((leave) => {
        if (leave.id === leaveId) {
          return {
            ...leave,
            status: "rejected" as const,
            rejectionReason: cancelReason || "Canceled by employee",
          };
        }
        return leave;
      });

      setLeaves(updatedLeaves);
      applyFilters(updatedLeaves, statusFilter, typeFilter, yearFilter);
      setCancelConfirm(null);
      setCancelReason("");

      // Show success message
      alert("Leave application has been canceled successfully.");
    }
  };

  // Recall a leave application
  const recallLeave = (leaveId: string) => {
    // Get existing applications from localStorage
    const storedApplications = localStorage.getItem("leave-app-applications");
    const storedBalances = localStorage.getItem("leave-app-balances");

    if (storedApplications && storedBalances) {
      const applications: LeaveApplication[] = JSON.parse(storedApplications);
      const balances = JSON.parse(storedBalances);

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

        // Update applications in localStorage
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
            (b: any) => b.userId === userId
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
          }
        }

        // Update state
        const updatedLeaves = leaves.map((leave) => {
          if (leave.id === leaveId) {
            return {
              ...leave,
              status: "recalled" as const,
              recalledOn: new Date().toISOString(),
              recallReason: recallReason || "No reason provided",
            };
          }
          return leave;
        });

        setLeaves(updatedLeaves);
        applyFilters(updatedLeaves, statusFilter, typeFilter, yearFilter);
        setRecallConfirm(null);
        setRecallReason("");

        // Show success message
        alert(
          `Leave has been successfully recalled.${
            wasApproved ? " Your leave balance has been restored." : ""
          }`
        );
      }
    }
  };

  // Reapply for a rejected leave
  const reapplyForLeave = (leaveId: string) => {
    // Find the rejected leave
    const rejectedLeave = leaves.find((leave) => leave.id === leaveId);

    if (rejectedLeave) {
      // Navigate to apply leave page with pre-filled data
      navigate(`/dashboard/employee/${userId}/apply-leave?reapply=${leaveId}`);
    }
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

  // Whether a leave can be canceled
  const canCancelLeave = (leave: LeaveApplication) => {
    return leave.status === "pending";
  };

  // Whether a leave can be recalled
  const canRecallLeave = (leave: LeaveApplication) => {
    return leave.status === "pending" || leave.status === "approved";
  };

  // Whether a leave can be reapplied
  const canReapplyForLeave = (leave: LeaveApplication) => {
    return leave.status === "rejected";
  };

  // Check if a leave is in the future
  const isLeaveInFuture = (startDate: string) => {
    const leaveStartDate = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return leaveStartDate >= today;
  };

  return (
    <div className="pb-4">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
        My Leaves
      </h2>

      {/* Filters */}
      <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Filter Leaves
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Status Filter */}
          <div>
            <label
              htmlFor="statusFilter"
              className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Status
            </label>
            <select
              id="statusFilter"
              className="w-full p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={statusFilter}
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected/Canceled</option>
              <option value="recalled">Recalled</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label
              htmlFor="typeFilter"
              className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Leave Type
            </label>
            <select
              id="typeFilter"
              className="w-full p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={typeFilter}
              onChange={(e) => handleFilterChange("type", e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="paid">Paid</option>
              <option value="sick">Sick</option>
              <option value="casual">Casual</option>
              <option value="miscellaneous">Miscellaneous</option>
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label
              htmlFor="yearFilter"
              className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Year
            </label>
            <select
              id="yearFilter"
              className="w-full p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={yearFilter}
              onChange={(e) => handleFilterChange("year", e.target.value)}
            >
              <option value="all">All Years</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leave Applications List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      ) : filteredLeaves.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            No Leaves Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {leaves.length === 0
              ? "You haven't applied for any leaves yet."
              : "No leaves match your current filters."}
          </p>
          <button
            onClick={() =>
              navigate(`/dashboard/employee/${userId}/apply-leave`)
            }
            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-900 focus:outline-none"
          >
            Apply for Leave
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Type & Status
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Period
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Details
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLeaves.map((leave) => (
                  <tr
                    key={leave.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getLeaveTypeBadgeClass(
                            leave.type
                          )}`}
                        >
                          {leave.type.charAt(0).toUpperCase() +
                            leave.type.slice(1)}
                          {leave.isEmergency && (
                            <span className="ml-1 bg-red-500 rounded-full w-2 h-2"></span>
                          )}
                        </span>
                        <span
                          className={`mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeClass(
                            leave.status
                          )}`}
                        >
                          {leave.status.charAt(0).toUpperCase() +
                            leave.status.slice(1)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Applied: {formatDate(leave.appliedOn)}
                        </span>
                        {leave.recalledOn && (
                          <span className="text-xs text-orange-500 dark:text-orange-400 mt-1">
                            Recalled: {formatDate(leave.recalledOn)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(leave.startDate)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          to {formatDate(leave.endDate)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {calculateDuration(leave.startDate, leave.endDate)}{" "}
                          day(s)
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900 dark:text-white truncate max-w-xs">
                          {leave.reason.length > 50
                            ? `${leave.reason.substring(0, 50)}...`
                            : leave.reason}
                        </span>
                        {leave.rejectionReason && (
                          <span className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Reason: {leave.rejectionReason}
                          </span>
                        )}
                        {leave.recallReason && (
                          <span className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                            Recall reason: {leave.recallReason}
                          </span>
                        )}
                        <button
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline text-left mt-1"
                          onClick={() => setDetailView(leave.id)}
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col space-y-1 items-end">
                        {canCancelLeave(leave) &&
                          isLeaveInFuture(leave.startDate) && (
                            <button
                              className="text-xs text-red-600 dark:text-red-400 hover:underline"
                              onClick={() => setCancelConfirm(leave.id)}
                            >
                              Cancel
                            </button>
                          )}
                        {canRecallLeave(leave) && (
                          <button
                            className="text-xs text-orange-600 dark:text-orange-400 hover:underline"
                            onClick={() => setRecallConfirm(leave.id)}
                          >
                            Recall
                          </button>
                        )}
                        {canReapplyForLeave(leave) && (
                          <button
                            className="text-xs text-green-600 dark:text-green-400 hover:underline"
                            onClick={() => reapplyForLeave(leave.id)}
                          >
                            Reapply
                          </button>
                        )}
                        {leave.status === "approved" &&
                          isLeaveInFuture(leave.startDate) && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Approved
                            </span>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail View Modal */}
      {detailView && leaves.find((leave) => leave.id === detailView) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Leave Details
                </h3>
                <button
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={() => setDetailView(null)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              {(() => {
                const leave = leaves.find((leave) => leave.id === detailView)!;
                return (
                  <div className="mt-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLeaveTypeBadgeClass(
                            leave.type
                          )}`}
                        >
                          {leave.type.charAt(0).toUpperCase() +
                            leave.type.slice(1)}{" "}
                          Leave
                        </span>
                        {leave.isEmergency && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                            Emergency
                          </span>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                          leave.status
                        )}`}
                      >
                        {leave.status.charAt(0).toUpperCase() +
                          leave.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Start Date
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(leave.startDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          End Date
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(leave.endDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Duration
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {calculateDuration(leave.startDate, leave.endDate)}{" "}
                          day(s)
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Applied On
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(leave.appliedOn)}
                        </p>
                      </div>
                    </div>

                    {leave.recalledOn && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Recalled On
                        </p>
                        <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                          {formatDate(leave.recalledOn)}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Reason
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded">
                        {leave.reason}
                      </p>
                    </div>

                    {leave.rejectionReason && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Rejection/Cancellation Reason
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 p-3 rounded">
                          {leave.rejectionReason}
                        </p>
                      </div>
                    )}

                    {leave.recallReason && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Recall Reason
                        </p>
                        <p className="text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 p-3 rounded">
                          {leave.recallReason}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2 pt-2">
                      {canCancelLeave(leave) &&
                        isLeaveInFuture(leave.startDate) && (
                          <button
                            className="inline-flex items-center px-3 py-1.5 bg-red-600 border border-transparent rounded-md text-xs text-white hover:bg-red-700"
                            onClick={() => {
                              setDetailView(null);
                              setCancelConfirm(leave.id);
                            }}
                          >
                            Cancel Leave
                          </button>
                        )}
                      {canRecallLeave(leave) && (
                        <button
                          className="inline-flex items-center px-3 py-1.5 bg-orange-600 border border-transparent rounded-md text-xs text-white hover:bg-orange-700"
                          onClick={() => {
                            setDetailView(null);
                            setRecallConfirm(leave.id);
                          }}
                        >
                          Recall Leave
                        </button>
                      )}
                      {canReapplyForLeave(leave) && (
                        <button
                          className="inline-flex items-center px-3 py-1.5 bg-green-600 border border-transparent rounded-md text-xs text-white hover:bg-green-700"
                          onClick={() => {
                            setDetailView(null);
                            reapplyForLeave(leave.id);
                          }}
                        >
                          Reapply
                        </button>
                      )}
                      <button
                        className="inline-flex items-center px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-md text-xs text-gray-900 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                        onClick={() => setDetailView(null)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Cancel Leave Application
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to cancel this leave application? This
                action cannot be undone.
              </p>

              <div className="mb-4">
                <label
                  htmlFor="cancelReason"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Reason for Cancellation (Optional)
                </label>
                <textarea
                  id="cancelReason"
                  rows={3}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason for canceling this leave..."
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={() => {
                    setCancelConfirm(null);
                    setCancelReason("");
                  }}
                >
                  No, Keep It
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  onClick={() => cancelLeave(cancelConfirm)}
                >
                  Yes, Cancel Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recall Confirmation Modal */}
      {recallConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Recall Leave Request
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to recall this leave request?
                {recallConfirm &&
                  leaves.find((leave) => leave.id === recallConfirm)?.status ===
                    "approved" &&
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
                    setRecallConfirm(null);
                    setRecallReason("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                  onClick={() => recallLeave(recallConfirm)}
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

export default MyLeaves;
