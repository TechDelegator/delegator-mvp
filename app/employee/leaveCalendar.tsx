import React, { useEffect, useState } from "react";
import { useParams } from "react-router";

// Define types for leave data
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

type User = {
  id: string;
  name: string;
  role: "employee" | "admin" | "manager";
  email: string;
};

type CalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
  hasLeave: boolean;
  leaves: LeaveApplication[];
  isToday: boolean;
};

const LeaveCalendar: React.FC = () => {
  const { userId } = useParams();
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);

  // Bug report component state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [bugType, setBugType] = useState("ui");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    // Fetch leave applications and users
    const fetchData = () => {
      setIsLoading(true);
      const storedApplications = localStorage.getItem("leave-app-applications");
      const storedUsers = localStorage.getItem("leave-app-users");

      if (storedApplications) {
        const applications: LeaveApplication[] = JSON.parse(storedApplications);
        // Only show approved leaves
        const approvedLeaves = applications.filter(
          (leave) => leave.status === "approved"
        );
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

  useEffect(() => {
    setCalendarDays(getDaysInMonth());
  }, [currentMonth, leaves]);

  // Get days in month with leave info
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get days from previous month to fill the first week
    const prevMonthDays: CalendarDay[] = [];
    const prevMonth = new Date(year, month, 0);
    const prevMonthDaysCount = prevMonth.getDate();

    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthDaysCount - i);
      prevMonthDays.push({
        date,
        isCurrentMonth: false,
        hasLeave: false,
        leaves: [],
        isToday: date.toDateString() === today.toDateString(),
      });
    }

    // Get days from current month
    const currentMonthDays: CalendarDay[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);

      // Find leaves for this day
      const dayLeaves = leaves.filter((leave) => {
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);

        // Reset time portions for comparison
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        return date >= startDate && date <= endDate;
      });

      currentMonthDays.push({
        date,
        isCurrentMonth: true,
        hasLeave: dayLeaves.length > 0,
        leaves: dayLeaves,
        isToday: date.toDateString() === today.toDateString(),
      });
    }

    // Get days from next month to fill the last week
    const totalDaysDisplayed = prevMonthDays.length + currentMonthDays.length;
    const nextMonthDays: CalendarDay[] = [];
    const daysNeeded = 42 - totalDaysDisplayed; // 6 rows of 7 days

    for (let day = 1; day <= daysNeeded; day++) {
      const date = new Date(year, month + 1, day);
      nextMonthDays.push({
        date,
        isCurrentMonth: false,
        hasLeave: false,
        leaves: [],
        isToday: date.toDateString() === today.toDateString(),
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
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  // Get user name from ID
  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.name : "Unknown User";
  };

  // Get first name from full name
  const getFirstName = (fullName: string) => {
    return fullName.split(" ")[0];
  };

  // Get leave type badge class
  const getLeaveTypeBadgeClass = (type: string) => {
    switch (type) {
      case "paid":
        return "bg-blue-500 text-white dark:bg-blue-600";
      case "sick":
        return "bg-purple-500 text-white dark:bg-purple-600";
      case "casual":
        return "bg-indigo-500 text-white dark:bg-indigo-600";
      default:
        return "bg-gray-500 text-white dark:bg-gray-600";
    }
  };

  // Get type initial
  const getTypeInitial = (type: string) => {
    return type.charAt(0).toUpperCase();
  };

  // Get leave tooltip text
  const getLeaveTooltip = (leave: LeaveApplication) => {
    const name = getUserName(leave.userId);
    const leaveType = leave.type.charAt(0).toUpperCase() + leave.type.slice(1);
    return `${name} - ${leaveType} leave${
      leave.isEmergency ? " (Emergency)" : ""
    }`;
  };

  // Bug report functions
  const openReportModal = () => setIsReportModalOpen(true);
  const closeReportModal = () => {
    if (!isSubmitting) {
      setIsReportModalOpen(false);
      if (isSubmitted) {
        setBugType("ui");
        setDescription("");
        setSteps("");
        setIsSubmitted(false);
      }
    }
  };

  const handleSubmitBugReport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);

      // In a real app, you would send this data to your API
      console.log({
        bugType,
        description,
        steps,
        email,
        timestamp: new Date().toISOString(),
      });

      // Reset form after successful submission
      setTimeout(() => {
        setIsReportModalOpen(false);
        setBugType("ui");
        setDescription("");
        setSteps("");
        setIsSubmitted(false);
      }, 2000);
    }, 1000);
  };

  return (
    <div className="pb-4">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Leave Calendar
      </h2>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Month Navigation */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Previous month"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-600 dark:text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {formatDate(currentMonth)}
          </h3>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Next month"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-600 dark:text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
          ) : (
            <div>
              {/* Days of Week Header */}
              <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day, index) => (
                    <div
                      key={index}
                      className="py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      {day}
                    </div>
                  )
                )}
              </div>

              {/* Calendar Cells */}
              <div className="grid grid-cols-7 auto-rows-fr">
                {calendarDays.map((day, idx) => (
                  <div
                    key={idx}
                    className={`min-h-[100px] sm:min-h-[120px] border-b border-r border-gray-200 dark:border-gray-700 p-1 relative
                      ${
                        !day.isCurrentMonth
                          ? "bg-gray-50 dark:bg-gray-850"
                          : "bg-white dark:bg-gray-800"
                      }
                      ${
                        day.isToday
                          ? "ring-2 ring-inset ring-blue-500 dark:ring-blue-400"
                          : ""
                      }
                    `}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className={`text-sm font-medium rounded-full w-7 h-7 flex items-center justify-center
                          ${
                            day.isToday
                              ? "bg-blue-500 text-white"
                              : day.isCurrentMonth
                              ? "text-gray-900 dark:text-white"
                              : "text-gray-400 dark:text-gray-500"
                          }
                        `}
                      >
                        {day.date.getDate()}
                      </span>
                    </div>

                    {/* Leave Entries */}
                    {day.hasLeave && (
                      <div className="mt-1 space-y-1 max-h-[80px] overflow-y-auto">
                        {day.leaves.map((leave, leaveIdx) => (
                          <div
                            key={`${leave.id}-${leaveIdx}`}
                            className={`text-xs rounded px-2 py-1 ${getLeaveTypeBadgeClass(
                              leave.type
                            )}`}
                            title={getLeaveTooltip(leave)}
                          >
                            <div className="flex items-center">
                              <span className="font-medium truncate">
                                {getFirstName(getUserName(leave.userId))}
                              </span>
                              <span className="ml-1 bg-white bg-opacity-30 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                                {getTypeInitial(leave.type)}
                              </span>
                              {leave.isEmergency && (
                                <span className="ml-1" title="Emergency">
                                  🚨
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Legend
        </h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-sm bg-blue-500 dark:bg-blue-600 mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Paid Leave (P)
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-sm bg-purple-500 dark:bg-purple-600 mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Sick Leave (S)
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-sm bg-indigo-500 dark:bg-indigo-600 mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Casual Leave (C)
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-sm bg-gray-500 dark:bg-gray-600 mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Miscellaneous (M)
            </span>
          </div>
          <div className="flex items-center">
            <span className="text-sm mr-2">🚨</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Emergency Leave
            </span>
          </div>
        </div>
      </div>

      {/* Bug Report Button */}
      <button
        onClick={openReportModal}
        className="fixed bottom-4 right-4 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 sm:w-14 sm:h-14"
        aria-label="Report a bug"
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
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </button>

      {/* Bug Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-red-500 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Report a Bug
                  </h3>
                </div>
                <button
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={closeReportModal}
                  disabled={isSubmitting}
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

              {isSubmitted ? (
                // Success Message
                <div className="text-center py-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-green-500 mx-auto mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Bug Report Submitted!
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Thank you for helping us improve our application. We'll look
                    into this issue as soon as possible.
                  </p>
                </div>
              ) : (
                // Bug Report Form
                <form onSubmit={handleSubmitBugReport}>
                  <div className="space-y-4">
                    {/* Bug Type */}
                    <div>
                      <label
                        htmlFor="bugType"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Bug Type
                      </label>
                      <select
                        id="bugType"
                        value={bugType}
                        onChange={(e) => setBugType(e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      >
                        <option value="ui">UI Issue</option>
                        <option value="functionality">
                          Functionality Issue
                        </option>
                        <option value="performance">Performance Issue</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Bug Description */}
                    <div>
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Please describe the issue in detail..."
                        required
                      />
                    </div>

                    {/* Steps to Reproduce */}
                    <div>
                      <label
                        htmlFor="steps"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Steps to Reproduce
                      </label>
                      <textarea
                        id="steps"
                        value={steps}
                        onChange={(e) => setSteps(e.target.value)}
                        rows={3}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Please list the steps to reproduce this issue..."
                      />
                    </div>

                    {/* Email (Optional) */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Your Email (Optional)
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="In case we need to follow up with you"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={closeReportModal}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 mr-2"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center">
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Submitting...
                          </div>
                        ) : (
                          "Submit Bug Report"
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveCalendar;
