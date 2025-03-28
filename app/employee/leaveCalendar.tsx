import React, { useEffect, useState } from "react";
import { useParams } from "react-router";

// Define types for leave data
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
  const [leaveBalance, setLeaveBalance] = useState<any>(null);

  // Date range selection states
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Date | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Leave application modal state
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<
    "paid" | "sick" | "casual" | "miscellaneous"
  >("paid");
  const [isEmergency, setIsEmergency] = useState(false);
  const [leaveReason, setLeaveReason] = useState("");
  const [isLeaveSubmitting, setIsLeaveSubmitting] = useState(false);
  const [leaveErrors, setLeaveErrors] = useState<string[]>([]);

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
      const storedBalances = localStorage.getItem("leave-app-balances");

      if (storedApplications) {
        const applications: LeaveApplication[] = JSON.parse(storedApplications);
        // Only show approved leaves - filter out recalled ones too
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

      if (storedBalances && userId) {
        const balances = JSON.parse(storedBalances);
        const userBalance = balances.find((b: any) => b.userId === userId);
        if (userBalance) {
          setLeaveBalance(userBalance);
        }
      }

      setIsLoading(false);
    };

    fetchData();
  }, [userId]);

  useEffect(() => {
    setCalendarDays(getDaysInMonth());
  }, [currentMonth, leaves]);

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

  // Function to handle day selection
  const handleDayClick = (day: CalendarDay) => {
    if (!isSelecting) {
      // Start selection
      setSelectionStart(day.date);
      setSelectionEnd(null);
      setIsSelecting(true);
    } else {
      // Complete selection
      const startDate = selectionStart as Date;

      // Ensure end date is after start date
      if (day.date >= startDate) {
        setSelectionEnd(day.date);
      } else {
        // If clicked date is before start date, swap them
        setSelectionEnd(startDate);
        setSelectionStart(day.date);
      }

      setIsSelecting(false);
    }
  };

  // Function to check if a day is in the selected range
  const isDayInSelectedRange = (day: Date) => {
    if (!selectionStart) return false;

    if (!selectionEnd) {
      // If only start is selected, highlight just that day
      return day.toDateString() === selectionStart.toDateString();
    }

    // Check if day is between start and end (inclusive)
    return day >= selectionStart && day <= selectionEnd;
  };

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

      // Find leaves for this day - excluding recalled leaves
      const dayLeaves = leaves.filter((leave) => {
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);

        // Reset time portions for comparison
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        return (
          date >= startDate && date <= endDate && leave.status === "approved"
        );
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

  // Handle leave application submission
  const handleLeaveSubmit = () => {
    if (!selectionStart || !selectionEnd || !userId) return;

    // Validation
    const errors: string[] = [];

    // Required fields
    if (!leaveReason.trim()) {
      errors.push("Please provide a reason for your leave request");
    }

    // Check for personal conflicts
    if (conflicts.personal.length > 0 && !isEmergency) {
      errors.push(
        `You already have leave(s) during this period. Please select different dates.`
      );
    }

    // Check leave balance
    if (leaveBalance) {
      const leaveDuration =
        Math.floor(
          (selectionEnd.getTime() - selectionStart.getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1;

      // Skip balance check for emergency leaves (they're usually processed differently)
      if (!isEmergency) {
        if (leaveType === "paid" && leaveDuration > leaveBalance.paid) {
          errors.push(
            `You don't have enough paid leave balance. Available: ${leaveBalance.paid} days`
          );
        } else if (leaveType === "sick" && leaveDuration > leaveBalance.sick) {
          errors.push(
            `You don't have enough sick leave balance. Available: ${leaveBalance.sick} days`
          );
        } else if (
          leaveType === "casual" &&
          leaveDuration > leaveBalance.casual
        ) {
          errors.push(
            `You don't have enough casual leave balance. Available: ${leaveBalance.casual} days`
          );
        } else if (
          leaveType === "miscellaneous" &&
          leaveDuration > leaveBalance.miscellaneous
        ) {
          errors.push(
            `You don't have enough miscellaneous leave balance. Available: ${leaveBalance.miscellaneous} days`
          );
        }
      }

      // Special handling for casual leave (max 1 day per week)
      if (leaveType === "casual" && leaveDuration > 1 && !isEmergency) {
        errors.push("Casual leaves cannot exceed 1 day at a time");
      }

      // Special handling for miscellaneous leave (max 1 day at a time)
      if (leaveType === "miscellaneous" && leaveDuration > 1 && !isEmergency) {
        errors.push("Miscellaneous leaves cannot exceed 1 day at a time");
      }
    }

    // If there are validation errors, show them and stop the submission
    if (errors.length > 0) {
      setLeaveErrors(errors);
      return;
    }

    // Start submission
    setLeaveErrors([]);
    setIsLeaveSubmitting(true);

    // Create the leave application object
    const leaveApplication = {
      id: Math.random().toString(36).substring(2, 9), // Simple ID generation
      userId: userId,
      type: leaveType,
      startDate: selectionStart.toISOString().split("T")[0],
      endDate: selectionEnd.toISOString().split("T")[0],
      status: isEmergency ? ("approved" as const) : ("pending" as const), // Emergency leaves are auto-approved
      reason: leaveReason,
      appliedOn: new Date().toISOString(),
      isEmergency: isEmergency,
    };

    // Get existing applications from localStorage
    const storedApplications = localStorage.getItem("leave-app-applications");
    let applications = storedApplications ? JSON.parse(storedApplications) : [];

    // Add new application
    applications.push(leaveApplication);

    // Save to localStorage
    localStorage.setItem(
      "leave-app-applications",
      JSON.stringify(applications)
    );

    // If it's an emergency leave, update the leave balance as well (since it's auto-approved)
    if (isEmergency && leaveBalance) {
      const leaveDuration =
        Math.floor(
          (selectionEnd.getTime() - selectionStart.getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1;

      // Get current balances from localStorage
      const storedBalances = localStorage.getItem("leave-app-balances");
      if (storedBalances) {
        let balances = JSON.parse(storedBalances);

        // Find the user's balance
        const userBalanceIndex = balances.findIndex(
          (b: any) => b.userId === userId
        );

        if (userBalanceIndex !== -1) {
          // Create a copy of the user's balance
          const updatedBalance = { ...balances[userBalanceIndex] };

          // Deduct from appropriate balance
          if (leaveType === "paid") {
            updatedBalance.paid = Math.max(
              0,
              updatedBalance.paid - leaveDuration
            );
          } else if (leaveType === "sick") {
            updatedBalance.sick = Math.max(
              0,
              updatedBalance.sick - leaveDuration
            );
          } else if (leaveType === "casual") {
            updatedBalance.casual = Math.max(
              0,
              updatedBalance.casual - leaveDuration
            );
          } else if (leaveType === "miscellaneous") {
            updatedBalance.miscellaneous = Math.max(
              0,
              updatedBalance.miscellaneous - leaveDuration
            );
          }

          // Update the balances array
          balances[userBalanceIndex] = updatedBalance;

          // Save updated balances to localStorage
          localStorage.setItem("leave-app-balances", JSON.stringify(balances));
        }
      }
    }

    // Simulate an API call delay
    setTimeout(() => {
      setIsLeaveSubmitting(false);

      // Close the modal
      setIsLeaveModalOpen(false);

      // Reset form and selection
      setLeaveType("paid");
      setLeaveReason("");
      setIsEmergency(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      setIsSelecting(false);

      // Show success message
      alert(
        isEmergency
          ? "Your emergency leave has been approved. Take care!"
          : "Your leave request has been submitted successfully. You'll be notified when it's processed."
      );

      // Refresh the calendar to show the new approved emergency leave (if applicable)
      if (isEmergency) {
        window.location.reload();
      }
    }, 1000);
  };

  // State for leave conflicts
  const [conflicts, setConflicts] = useState<{
    personal: { date: string; type: string; status: string }[];
    team: { date: string; userName: string; type: string }[];
  }>({
    personal: [],
    team: [],
  });

  // Function to check for conflicts when dates are selected
  useEffect(() => {
    if (selectionStart && selectionEnd && userId) {
      checkForConflicts();
    }
  }, [selectionStart, selectionEnd, userId]);

  // Check for leave conflicts
  const checkForConflicts = () => {
    if (!selectionStart || !selectionEnd || !userId) return;

    const startDate = new Date(selectionStart);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(selectionEnd);
    endDate.setHours(0, 0, 0, 0);

    // Get all applications from localStorage
    const storedApplications = localStorage.getItem("leave-app-applications");

    if (!storedApplications) {
      setConflicts({ personal: [], team: [] });
      return;
    }

    const applications: LeaveApplication[] = JSON.parse(storedApplications);

    // Find personal conflicts (user's own existing leaves)
    const personalConflicts: { date: string; type: string; status: string }[] =
      [];

    // Find team conflicts (other people's approved leaves)
    const teamConflicts: { date: string; userName: string; type: string }[] =
      [];

    // Check each day in the selected range
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split("T")[0];

      // Check personal conflicts
      applications.forEach((leave) => {
        if (
          leave.userId === userId &&
          (leave.status === "approved" || leave.status === "pending") // Don't check recalled or rejected leaves
        ) {
          const leaveStart = new Date(leave.startDate);
          const leaveEnd = new Date(leave.endDate);

          if (currentDate >= leaveStart && currentDate <= leaveEnd) {
            // This day conflicts with an existing leave
            personalConflicts.push({
              date: dateString,
              type: leave.type,
              status: leave.status,
            });
          }
        }
      });

      // Check team conflicts
      applications.forEach((leave) => {
        if (leave.userId !== userId && leave.status === "approved") {
          const leaveStart = new Date(leave.startDate);
          const leaveEnd = new Date(leave.endDate);

          if (currentDate >= leaveStart && currentDate <= leaveEnd) {
            // This day conflicts with a team member's approved leave
            const userName = getUserName(leave.userId);
            teamConflicts.push({
              date: dateString,
              userName,
              type: leave.type,
            });
          }
        }
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Update conflicts state
    setConflicts({
      personal: personalConflicts,
      team: teamConflicts,
    });
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

        {/* Selection Info */}
        {(selectionStart || selectionEnd) && (
          <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 border-b border-indigo-100 dark:border-indigo-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                  {selectionStart && selectionEnd
                    ? `Selected: ${selectionStart.toLocaleDateString()} - ${selectionEnd.toLocaleDateString()}`
                    : selectionStart
                    ? `Start: ${selectionStart.toLocaleDateString()} (Select end date)`
                    : ""}
                </span>
              </div>
              {selectionStart && selectionEnd && (
                <button
                  onClick={() => setIsLeaveModalOpen(true)}
                  className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                >
                  Apply for Leave
                </button>
              )}
              {(selectionStart || selectionEnd) && (
                <button
                  onClick={() => {
                    setSelectionStart(null);
                    setSelectionEnd(null);
                    setIsSelecting(false);
                  }}
                  className="ml-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

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
                      ${
                        isDayInSelectedRange(day.date)
                          ? "bg-blue-50 dark:bg-blue-900/20"
                          : ""
                      }
                      cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700
                    `}
                    onClick={() => handleDayClick(day)}
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
                          ${
                            day.date.toDateString() ===
                            selectionStart?.toDateString()
                              ? "bg-indigo-500 text-white"
                              : ""
                          }
                          ${
                            day.date.toDateString() ===
                            selectionEnd?.toDateString()
                              ? "bg-indigo-500 text-white"
                              : ""
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
                                {getUserName(leave.userId)}
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

      {/* Info about Recalled Leaves */}
      <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Leave Status Information
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          This calendar displays only approved leaves. Pending, rejected, and
          recalled leaves are not shown.
        </p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-green-500 dark:bg-green-600 mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Approved - Visible on calendar
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-yellow-500 dark:bg-yellow-600 mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Pending - Not shown
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-orange-500 dark:bg-orange-600 mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Recalled - Not shown
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

      {/* Leave Application Modal */}
      {isLeaveModalOpen && selectionStart && selectionEnd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-indigo-500 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Apply for Leave
                  </h3>
                </div>
                <button
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={() => setIsLeaveModalOpen(false)}
                  disabled={isLeaveSubmitting}
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

              {/* Leave Application Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLeaveSubmit();
                }}
              >
                <div className="space-y-4">
                  {/* Selected Date Range */}
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                    <h4 className="text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-2">
                      Selected Dates
                    </h4>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {selectionStart.toLocaleDateString()} -{" "}
                          {selectionEnd.toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {Math.floor(
                            (selectionEnd.getTime() -
                              selectionStart.getTime()) /
                              (1000 * 60 * 60 * 24)
                          ) + 1}{" "}
                          day(s)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Error Messages */}
                  {leaveErrors.length > 0 && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
                      <h4 className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                        Please fix the following issues:
                      </h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {leaveErrors.map((error, index) => (
                          <li
                            key={index}
                            className="text-xs text-red-600 dark:text-red-400"
                          >
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Leave Type */}
                  <div>
                    <label
                      htmlFor="leaveType"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Leave Type
                    </label>
                    <select
                      id="leaveType"
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value as any)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    >
                      <option value="paid">Paid Leave</option>
                      <option value="sick">Sick Leave</option>
                      <option value="casual">Casual Leave</option>
                      <option value="miscellaneous">Miscellaneous Leave</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {leaveType === "paid"
                        ? "Use for planned vacations or personal time off."
                        : leaveType === "sick"
                        ? "Use when you are ill or need medical care."
                        : leaveType === "casual"
                        ? "Use for short, unplanned absences. Limited to 1 day per week."
                        : "Use for other purposes. Limited to 1 day at a time."}
                    </p>
                    {leaveBalance && (
                      <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                        Available balance: {leaveBalance[leaveType]} days
                      </p>
                    )}
                  </div>

                  {/* Leave Reason */}
                  <div>
                    <label
                      htmlFor="leaveReason"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Reason for Leave <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="leaveReason"
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      rows={3}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Please provide a reason for your leave request..."
                      required
                    />
                    {leaveType === "sick" && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        For sick leaves longer than 3 days, please mention that
                        you'll provide a medical certificate.
                      </p>
                    )}
                  </div>

                  {/* Conflict Information */}
                  {(conflicts.personal.length > 0 ||
                    conflicts.team.length > 0) && (
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800">
                      <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                        Leave Conflicts
                      </h4>

                      {conflicts.personal.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                            Your existing leaves:
                          </p>
                          <ul className="list-disc list-inside text-xs text-amber-700 dark:text-amber-400 mt-1">
                            {conflicts.personal
                              .slice(0, 3)
                              .map((conflict, index) => (
                                <li key={index}>
                                  {new Date(conflict.date).toLocaleDateString()}
                                  : {conflict.type} leave ({conflict.status})
                                </li>
                              ))}
                            {conflicts.personal.length > 3 && (
                              <li>
                                ...and {conflicts.personal.length - 3} more
                                dates
                              </li>
                            )}
                          </ul>
                          {!isEmergency && (
                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 font-medium">
                              You cannot apply for leave on dates where you
                              already have leave.
                            </p>
                          )}
                        </div>
                      )}

                      {conflicts.team.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                            Team members on leave:
                          </p>
                          <ul className="list-disc list-inside text-xs text-amber-700 dark:text-amber-400 mt-1">
                            {conflicts.team
                              .slice(0, 3)
                              .map((conflict, index) => (
                                <li key={index}>
                                  {new Date(conflict.date).toLocaleDateString()}
                                  : {conflict.userName} ({conflict.type} leave)
                                </li>
                              ))}
                            {conflicts.team.length > 3 && (
                              <li>
                                ...and {conflicts.team.length - 3} more dates
                              </li>
                            )}
                          </ul>
                          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                            Having team members on leave during the same period
                            may affect team capacity.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setIsLeaveModalOpen(false)}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 mr-2"
                      disabled={isLeaveSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      disabled={isLeaveSubmitting}
                    >
                      {isLeaveSubmitting ? (
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
                        "Submit Leave Request"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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
