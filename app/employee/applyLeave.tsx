import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router";

// Define types
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

const ApplyLeave: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [leaveType, setLeaveType] = useState<
    "paid" | "sick" | "casual" | "miscellaneous"
  >("paid");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [isEmergency, setIsEmergency] = useState<boolean>(false);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sample public holidays (in a real app, this would come from an API or database)
  const publicHolidays = [
    { date: "2025-01-01", name: "New Year's Day" },
    { date: "2025-01-20", name: "Martin Luther King Jr. Day" },
    { date: "2025-02-17", name: "Presidents' Day" },
    { date: "2025-05-26", name: "Memorial Day" },
    { date: "2025-07-04", name: "Independence Day" },
    { date: "2025-09-01", name: "Labor Day" },
    { date: "2025-10-13", name: "Columbus Day" },
    { date: "2025-11-11", name: "Veterans Day" },
    { date: "2025-11-27", name: "Thanksgiving Day" },
    { date: "2025-12-25", name: "Christmas Day" },
  ];

  // State for holiday warnings
  const [holidayWarnings, setHolidayWarnings] = useState<
    { date: string; name: string }[]
  >([]);
  // State to track emergency leave usage
  const [emergencyLeaveCount, setEmergencyLeaveCount] = useState<{
    last30Days: number;
    lastYear: number;
    mostRecent: string | null;
  }>({
    last30Days: 0,
    lastYear: 0,
    mostRecent: null,
  });

  useEffect(() => {
    // Set default dates (today) for regular leaves too
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];

    if (startDate === "") {
      setStartDate(formattedDate);
    }

    if (endDate === "") {
      setEndDate(formattedDate);
    }

    // Check if emergency parameter is in URL
    const params = new URLSearchParams(location.search);
    const isEmergencyLeave = params.get("emergency") === "true";

    if (isEmergencyLeave) {
      setIsEmergency(true);
      setLeaveType("sick");
      setReason("Emergency leave - details to be provided later");

      // Get current hour to determine leave date handling
      const currentHour = today.getHours();

      if (currentHour >= 18) {
        // After 6 PM
        // Set leave for tomorrow
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const tomorrowFormatted = tomorrow.toISOString().split("T")[0];
        setStartDate(tomorrowFormatted);
        setEndDate(tomorrowFormatted);

        // Show notification to user
        setTimeout(() => {
          alert(
            "Since it's after 6 PM, your emergency leave has been automatically scheduled for tomorrow."
          );
        }, 500);
      } else if (currentHour >= 12 && currentHour < 18) {
        // Between 12:01 PM and 6 PM
        // Prompt user to choose
        setTimeout(() => {
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);
          const tomorrowFormatted = tomorrow.toISOString().split("T")[0];

          const chooseDay = window.confirm(
            "Do you want to apply emergency leave for tomorrow instead of today?\n\n" +
              "Click 'OK' for tomorrow, or 'Cancel' for today."
          );

          if (chooseDay) {
            setStartDate(tomorrowFormatted);
            setEndDate(tomorrowFormatted);
          } else {
            setStartDate(formattedDate);
            setEndDate(formattedDate);
          }
        }, 500);
      } else {
        // Before 12 PM
        // Set for today (default behavior)
        setStartDate(formattedDate);
        setEndDate(formattedDate);
      }
    }

    // Rest of your existing code...
  }, [userId, location.search]);

  // Check for public holidays whenever date range changes
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const holidays: { date: string; name: string }[] = [];

      // Iterate through each day in the range
      const currentDate = new Date(start);
      while (currentDate <= end) {
        const dateString = currentDate.toISOString().split("T")[0];

        // Check if this date is a public holiday
        const holiday = publicHolidays.find((h) => h.date === dateString);
        if (holiday) {
          holidays.push({ date: dateString, name: holiday.name });
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setHolidayWarnings(holidays);
    } else {
      setHolidayWarnings([]);
    }
  }, [startDate, endDate]);

  // Check for past emergency leave usage
  useEffect(() => {
    const checkEmergencyLeaveUsage = () => {
      const storedApplications = localStorage.getItem("leave-app-applications");
      if (storedApplications) {
        const applications: LeaveApplication[] = JSON.parse(storedApplications);
        const userApplications = applications.filter(
          (a) => a.userId === userId
        );

        // Check for emergency leaves in the past 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const last30DaysEmergencyLeaves = userApplications.filter(
          (leave) =>
            leave.isEmergency && new Date(leave.appliedOn) >= thirtyDaysAgo
        );

        // Check for emergency leaves in the past year
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const lastYearEmergencyLeaves = userApplications.filter(
          (leave) =>
            leave.isEmergency && new Date(leave.appliedOn) >= oneYearAgo
        );

        // Find most recent emergency leave
        let mostRecent: string | null = null;
        if (lastYearEmergencyLeaves.length > 0) {
          const sortedLeaves = [...lastYearEmergencyLeaves].sort(
            (a, b) =>
              new Date(b.appliedOn).getTime() - new Date(a.appliedOn).getTime()
          );

          if (sortedLeaves.length > 0) {
            mostRecent = sortedLeaves[0].startDate;
          }
        }

        setEmergencyLeaveCount({
          last30Days: last30DaysEmergencyLeaves.length,
          lastYear: lastYearEmergencyLeaves.length,
          mostRecent,
        });
      }
    };

    checkEmergencyLeaveUsage();

    const params = new URLSearchParams(location.search);
    const reapplyLeaveId = params.get("reapply");

    if (reapplyLeaveId) {
      // Get existing applications from localStorage
      const storedApplications = localStorage.getItem("leave-app-applications");

      if (storedApplications) {
        const applications: LeaveApplication[] = JSON.parse(storedApplications);
        const leaveToReapply = applications.find(
          (leave) => leave.id === reapplyLeaveId && leave.userId === userId
        );

        if (leaveToReapply) {
          // Pre-fill form with data from rejected leave
          setLeaveType(leaveToReapply.type);
          setStartDate(leaveToReapply.startDate);
          setEndDate(leaveToReapply.endDate);

          // Add a note about reapplying
          const reasonPrefix = "Reapplying for previously rejected leave. ";
          if (!leaveToReapply.reason.startsWith(reasonPrefix)) {
            setReason(reasonPrefix + leaveToReapply.reason);
          } else {
            setReason(leaveToReapply.reason);
          }
        }
      }
    }
  }, [userId, location.search]);

  const validateLeaveApplication = (): string[] => {
    const errors: string[] = [];

    // Required fields
    if (!startDate) errors.push("Start date is required");
    if (!endDate) errors.push("End date is required");
    if (!reason) errors.push("Reason is required");

    if (leaveType === "sick" && !isEmergency && reason.length < 10) {
      errors.push(
        "Please provide more details about your illness for sick leave requests"
      );
    }

    // Date validation
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today && !isEmergency) {
      errors.push("Start date cannot be in the past");
    }

    if (end < start) {
      errors.push("End date cannot be before start date");
    }

    // Emergency leave restrictions
    if (isEmergency) {
      const storedApplications = localStorage.getItem("leave-app-applications");
      if (storedApplications) {
        const applications: LeaveApplication[] = JSON.parse(storedApplications);

        // Check for emergency leaves in the past 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentEmergencyLeaves = applications.filter(
          (leave) =>
            leave.userId === userId &&
            leave.isEmergency &&
            new Date(leave.appliedOn) >= thirtyDaysAgo
        );

        // Limit to 3 emergency leaves per month
        if (recentEmergencyLeaves.length >= 3) {
          errors.push(
            "You have already used the maximum allowed emergency leaves (3) in the past 30 days"
          );
        }

        // Check for emergency leave taken in the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const veryRecentEmergencyLeaves = applications.filter(
          (leave) =>
            leave.userId === userId &&
            leave.isEmergency &&
            new Date(leave.appliedOn) >= sevenDaysAgo
        );

        // Add a warning if there was a recent emergency leave
        if (veryRecentEmergencyLeaves.length > 0) {
          errors.push(
            "You have already taken an emergency leave in the past 7 days. Frequent emergency leaves require HR review."
          );
        }

        // Check if an emergency leave was taken yesterday to prevent consecutive usage
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const yesterdayEmergencyLeaves = applications.filter(
          (leave) =>
            leave.userId === userId &&
            leave.isEmergency &&
            new Date(leave.startDate).toDateString() ===
              yesterday.toDateString()
        );

        if (yesterdayEmergencyLeaves.length > 0) {
          errors.push(
            "You cannot take emergency leaves on consecutive days. Please apply for a regular sick leave instead."
          );
        }
      }
    }

    // Calculate number of days
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days

    // Check for overlapping leaves (except emergency leaves)
    if (!isEmergency) {
      const storedApplications = localStorage.getItem("leave-app-applications");
      if (storedApplications) {
        const applications: LeaveApplication[] = JSON.parse(storedApplications);
        const userApplications = applications.filter(
          (a) =>
            a.userId === userId &&
            (a.status === "approved" || a.status === "pending")
        );

        // Check for overlapping leaves
        const hasOverlap = userApplications.some((leave) => {
          const leaveStart = new Date(leave.startDate);
          const leaveEnd = new Date(leave.endDate);

          // Check if date ranges overlap
          return (
            (start <= leaveEnd && start >= leaveStart) || // Start date falls within existing leave
            (end <= leaveEnd && end >= leaveStart) || // End date falls within existing leave
            (start <= leaveStart && end >= leaveEnd) // New leave contains existing leave
          );
        });

        if (hasOverlap) {
          errors.push(
            "You already have approved or pending leave during this period"
          );
        }

        // Check for team capacity (simplified version - in a real app, you'd have team data)
        // This is a basic implementation that checks if more than 50% of users are on leave on any given day
        const allUsers = JSON.parse(
          localStorage.getItem("leave-app-users") || "[]"
        );
        const totalUsers = allUsers.length;
        const maxAbsent = Math.floor(totalUsers * 0.5); // 50% max capacity

        // Get all approved leaves for the date range
        const allApprovedLeaves = applications.filter(
          (a) => a.status === "approved"
        );

        // Simple check for each day in the requested leave period
        let currentDate = new Date(start);
        while (currentDate <= end) {
          const dateString = currentDate.toISOString().split("T")[0];

          // Count how many users are on leave on this date
          let usersOnLeave = 0;
          allApprovedLeaves.forEach((leave) => {
            const leaveStart = new Date(leave.startDate);
            const leaveEnd = new Date(leave.endDate);

            if (currentDate >= leaveStart && currentDate <= leaveEnd) {
              usersOnLeave++;
            }
          });

          // Add 1 for the current leave request
          usersOnLeave++;

          if (usersOnLeave > maxAbsent && !isEmergency) {
            errors.push(
              `Too many team members are on leave on ${dateString}. Please choose different dates.`
            );
            break;
          }

          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }

    // Check if user has enough balance
    if (leaveBalance) {
      // Skip balance check for sick leave emergency cases
      if (!(isEmergency && leaveType === "sick")) {
        if (leaveType === "paid" && diffDays > leaveBalance.paid) {
          errors.push(
            `Not enough paid leave balance. You have ${leaveBalance.paid} days available.`
          );
        } else if (leaveType === "sick" && diffDays > leaveBalance.sick) {
          errors.push(
            `Not enough sick leave balance. You have ${leaveBalance.sick} days available.`
          );
        } else if (leaveType === "casual" && diffDays > leaveBalance.casual) {
          errors.push(
            `Not enough casual leave balance. You have ${leaveBalance.casual} days available.`
          );
        } else if (
          leaveType === "miscellaneous" &&
          diffDays > leaveBalance.miscellaneous
        ) {
          errors.push(
            `Not enough miscellaneous leave balance. You have ${leaveBalance.miscellaneous} days available.`
          );
        }
      }

      // Special handling for extended sick leaves
      if (
        leaveType === "sick" &&
        diffDays > 3 &&
        !reason.toLowerCase().includes("medical certificate")
      ) {
        errors.push(
          "Sick leaves longer than 3 days require a medical certificate (please mention this in your reason)"
        );
      }

      // Skip policy checks for emergency leaves
      if (!isEmergency) {
        // Check policy rules
        if (leaveType === "casual" && diffDays > 1) {
          errors.push("Only 1 casual leave per week is allowed");
        }

        if (leaveType === "miscellaneous" && diffDays > 1) {
          errors.push(
            "Miscellaneous leaves cannot be taken for more than one day at a time"
          );
        }

        // Check for back-to-back casual leaves
        if (leaveType === "casual") {
          const storedApplications = localStorage.getItem(
            "leave-app-applications"
          );
          if (storedApplications) {
            const applications: LeaveApplication[] =
              JSON.parse(storedApplications);
            const userCasualLeaves = applications.filter(
              (a) =>
                a.userId === userId &&
                a.type === "casual" &&
                (a.status === "approved" || a.status === "pending")
            );

            // Check if any casual leave ends just before this one starts or starts just after this one ends
            const hasAdjacentLeave = userCasualLeaves.some((leave) => {
              const leaveStart = new Date(leave.startDate);
              const leaveEnd = new Date(leave.endDate);

              // Check if leaves are adjacent (1 day apart)
              const oneDayBefore = new Date(start);
              oneDayBefore.setDate(start.getDate() - 1);

              const oneDayAfter = new Date(end);
              oneDayAfter.setDate(end.getDate() + 1);

              return (
                leaveEnd.toDateString() === oneDayBefore.toDateString() ||
                leaveStart.toDateString() === oneDayAfter.toDateString()
              );
            });

            if (hasAdjacentLeave) {
              errors.push(
                "Casual leaves cannot be taken on consecutive days, even across separate requests"
              );
            }
          }
        }

        // Check for paid leave monthly limit (5 per month)
        if (leaveType === "paid") {
          const startMonth = start.getMonth();
          const endMonth = end.getMonth();

          if (startMonth !== endMonth) {
            errors.push("Paid leaves cannot span across different months");
          } else {
            // Check if user has already used paid leaves this month
            const storedApplications = localStorage.getItem(
              "leave-app-applications"
            );
            if (storedApplications) {
              const applications: LeaveApplication[] =
                JSON.parse(storedApplications);
              const currentMonthPaidLeaves = applications.filter(
                (a) =>
                  a.userId === userId &&
                  a.type === "paid" &&
                  (a.status === "approved" || a.status === "pending") &&
                  new Date(a.startDate).getMonth() === startMonth
              );

              // Calculate days already applied for
              let daysAlreadyApplied = 0;
              currentMonthPaidLeaves.forEach((leave) => {
                const leaveStart = new Date(leave.startDate);
                const leaveEnd = new Date(leave.endDate);
                const leaveDiffTime = Math.abs(
                  leaveEnd.getTime() - leaveStart.getTime()
                );
                const leaveDiffDays =
                  Math.ceil(leaveDiffTime / (1000 * 60 * 60 * 24)) + 1;
                daysAlreadyApplied += leaveDiffDays;
              });

              if (daysAlreadyApplied + diffDays > 5) {
                errors.push(
                  `You can only take 5 paid leaves per month. You have already used or applied for ${daysAlreadyApplied} days this month.`
                );
              }
            }
          }
        }
      }
    }

    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const errors = validateLeaveApplication();
    setValidationErrors(errors);

    if (errors.length > 0) {
      return;
    }

    setIsSubmitting(true);

    // Create new leave application
    const newLeaveApplication: LeaveApplication = {
      id: Math.random().toString(36).substring(2, 9), // Simple ID generation
      userId: userId || "",
      type: leaveType,
      startDate,
      endDate,
      status: isEmergency ? "approved" : "pending", // Emergency leaves are auto-approved
      reason,
      appliedOn: new Date().toISOString(),
      isEmergency,
    };

    // Get existing applications from localStorage
    const storedApplications = localStorage.getItem("leave-app-applications");
    let applications: LeaveApplication[] = [];

    if (storedApplications) {
      applications = JSON.parse(storedApplications);
    }

    // Add new application
    applications.push(newLeaveApplication);

    // Save to localStorage
    localStorage.setItem(
      "leave-app-applications",
      JSON.stringify(applications)
    );

    // Update leave balance if emergency leave (since it's auto-approved)
    if (isEmergency) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      // Get current balances from localStorage
      const storedBalances = localStorage.getItem("leave-app-balances");
      if (storedBalances) {
        let balances: LeaveBalance[] = JSON.parse(storedBalances);

        // Find the user's balance
        const userBalanceIndex = balances.findIndex((b) => b.userId === userId);

        if (userBalanceIndex !== -1) {
          // Create a copy of the user's balance
          const updatedBalance = { ...balances[userBalanceIndex] };

          // Deduct from appropriate balance
          if (leaveType === "paid") {
            updatedBalance.paid = Math.max(0, updatedBalance.paid - diffDays);
          } else if (leaveType === "sick") {
            updatedBalance.sick = Math.max(0, updatedBalance.sick - diffDays);
          } else if (leaveType === "casual") {
            updatedBalance.casual = Math.max(
              0,
              updatedBalance.casual - diffDays
            );
          } else if (leaveType === "miscellaneous") {
            updatedBalance.miscellaneous = Math.max(
              0,
              updatedBalance.miscellaneous - diffDays
            );
          }

          // Update the balances array
          balances[userBalanceIndex] = updatedBalance;

          // Save updated balances to localStorage
          localStorage.setItem("leave-app-balances", JSON.stringify(balances));
        }
      }
    }

    // Show success message
    alert(
      isEmergency
        ? "Your emergency leave has been automatically approved."
        : "Your leave application has been submitted for approval."
    );

    // Navigate back to dashboard
    setTimeout(() => {
      navigate(`/dashboard/employee/${userId}`, {
        state: { refreshBalance: true, timestamp: Date.now() },
      });
    }, 1000);
  };

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
        {isEmergency ? "Emergency Leave Application" : "Apply for Leave"}
      </h2>

      {isEmergency && (
        <div className="mb-4 bg-red-50 dark:bg-red-900 rounded-lg p-3 border border-red-200 dark:border-red-700">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-red-500 dark:text-red-400 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
              Emergency Leave
            </h3>
          </div>
          <p className="mt-2 text-sm text-red-700 dark:text-red-400">
            This leave will be automatically approved for today. You can provide
            additional details later if needed.
          </p>

          {/* Emergency Leave Usage Tracking */}
          <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-700">
            <h4 className="text-xs font-medium text-red-800 dark:text-red-300">
              Your Emergency Leave Usage:
            </h4>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-sm font-bold text-red-800 dark:text-red-300">
                  {emergencyLeaveCount.last30Days}/3
                </p>
                <p className="text-xs text-red-700 dark:text-red-400">
                  Last 30 days
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-red-800 dark:text-red-300">
                  {emergencyLeaveCount.lastYear}
                </p>
                <p className="text-xs text-red-700 dark:text-red-400">
                  Past year
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-red-800 dark:text-red-300">
                  {emergencyLeaveCount.mostRecent
                    ? new Date(
                        emergencyLeaveCount.mostRecent
                      ).toLocaleDateString()
                    : "None"}
                </p>
                <p className="text-xs text-red-700 dark:text-red-400">
                  Last emergency
                </p>
              </div>
            </div>

            {emergencyLeaveCount.last30Days >= 2 && (
              <div className="mt-2 text-xs text-red-700 dark:text-red-400 font-medium">
                Warning: You are approaching your limit of 3 emergency leaves
                per 30 days.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Messages */}
      {validationErrors.length > 0 && (
        <div className="mb-4 bg-red-50 dark:bg-red-900 rounded-lg p-3 border border-red-200 dark:border-red-700">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
            Please fix the following issues:
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            {validationErrors.map((error, index) => (
              <li
                key={index}
                className="text-xs text-red-700 dark:text-red-400"
              >
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Leave Application Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
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
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as any)}
            disabled={isSubmitting || isEmergency}
          >
            <option value="paid">Paid Leave</option>
            <option value="sick">Sick Leave</option>
            <option value="casual">Casual Leave</option>
            <option value="miscellaneous">Miscellaneous Leave</option>
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {isEmergency
              ? "Emergency leaves are automatically processed as sick leaves."
              : leaveType === "paid"
              ? "Use for planned vacations or personal time off."
              : leaveType === "sick"
              ? "Use when you are ill or need medical care."
              : leaveType === "casual"
              ? "Use for short, unplanned absences. Limited to 1 day per week."
              : "Use for other purposes. Limited to 1 day at a time."}
          </p>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              className={`w-full p-2 border rounded-md ${
                isEmergency
                  ? "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                  : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              } text-gray-900 dark:text-white`}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isSubmitting || isEmergency}
              min={
                !isEmergency
                  ? new Date().toISOString().split("T")[0]
                  : undefined
              }
            />
            {isEmergency && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Emergency leaves are for today only
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              className={`w-full p-2 border rounded-md ${
                isEmergency
                  ? "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                  : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              } text-gray-900 dark:text-white`}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isSubmitting || isEmergency}
              min={startDate || new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>

        {/* Holiday Warnings */}
        {holidayWarnings.length > 0 && (
          <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900 rounded border border-amber-200 dark:border-amber-700">
            <div className="flex items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-amber-500 dark:text-amber-400 mr-2 mt-0.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Your leave request includes the following{" "}
                  {holidayWarnings.length > 1 ? "holidays" : "holiday"}:
                </p>
                <ul className="mt-1 list-disc pl-5 text-xs text-amber-700 dark:text-amber-400">
                  {holidayWarnings.map((holiday, index) => (
                    <li key={index}>
                      {holiday.name} -{" "}
                      {new Date(holiday.date).toLocaleDateString(undefined, {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </li>
                  ))}
                </ul>
                {leaveType !== "sick" && !isEmergency && (
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                    Consider excluding these dates as they are already
                    non-working days.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Overlap check helper */}
        {startDate && endDate && leaveType !== "sick" && !isEmergency && (
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              onClick={() => {
                // Check for conflicts
                const storedApplications = localStorage.getItem(
                  "leave-app-applications"
                );
                if (storedApplications) {
                  const applications = JSON.parse(storedApplications);

                  // Get the current user's pending/approved leaves
                  const userLeaves = applications.filter(
                    (a) =>
                      a.userId === userId &&
                      (a.status === "approved" || a.status === "pending")
                  );

                  // Get other team members' approved leaves
                  const teamLeaves = applications.filter(
                    (a) => a.userId !== userId && a.status === "approved"
                  );

                  // Convert date strings to Date objects and set time to 00:00:00
                  const startDateObj = new Date(startDate);
                  startDateObj.setHours(0, 0, 0, 0);

                  const endDateObj = new Date(endDate);
                  endDateObj.setHours(0, 0, 0, 0);

                  // Function to check if date ranges overlap
                  const datesOverlap = (start1, end1, start2, end2) => {
                    return start1 <= end2 && end1 >= start2;
                  };

                  // Check for personal conflicts
                  const personalConflicts = userLeaves.filter((leave) => {
                    const leaveStart = new Date(leave.startDate);
                    leaveStart.setHours(0, 0, 0, 0);

                    const leaveEnd = new Date(leave.endDate);
                    leaveEnd.setHours(0, 0, 0, 0);

                    return datesOverlap(
                      startDateObj,
                      endDateObj,
                      leaveStart,
                      leaveEnd
                    );
                  });

                  // Check for team conflicts (other people on leave)
                  const teamConflicts = teamLeaves.filter((leave) => {
                    const leaveStart = new Date(leave.startDate);
                    leaveStart.setHours(0, 0, 0, 0);

                    const leaveEnd = new Date(leave.endDate);
                    leaveEnd.setHours(0, 0, 0, 0);

                    return datesOverlap(
                      startDateObj,
                      endDateObj,
                      leaveStart,
                      leaveEnd
                    );
                  });

                  // Generate conflict message
                  if (personalConflicts.length > 0) {
                    const conflictDates = personalConflicts
                      .map(
                        (leave) =>
                          `${new Date(
                            leave.startDate
                          ).toLocaleDateString()} to ${new Date(
                            leave.endDate
                          ).toLocaleDateString()} (${leave.type} leave, ${
                            leave.status
                          })`
                      )
                      .join("\n- ");

                    alert(
                      `You already have ${personalConflicts.length} leave request(s) that overlap with these dates:\n- ${conflictDates}`
                    );
                  } else if (teamConflicts.length > 0) {
                    // Show just a count of team members on leave during this period
                    alert(
                      `${teamConflicts.length} team member(s) will be on leave during this period. You can still apply, but be aware that team capacity may be affected.`
                    );
                  } else {
                    alert(
                      "No conflicts found with your existing leave requests for these dates."
                    );
                  }
                } else {
                  alert("No existing leave applications found.");
                }
              }}
            >
              Check for conflicts
            </button>
          </div>
        )}

        {/* Reason */}
        <div>
          <label
            htmlFor="reason"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Reason for Leave
            {leaveType === "sick" && !isEmergency && (
              <span className="text-red-500 dark:text-red-400 ml-1">*</span>
            )}
          </label>
          <textarea
            id="reason"
            rows={3}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              leaveType === "sick" && !isEmergency
                ? "Please provide details about your illness. For leaves longer than 3 days, mention that you'll provide a medical certificate."
                : isEmergency
                ? "Emergency leave - details to be provided later"
                : "Please provide a reason for your leave request..."
            }
            disabled={isSubmitting}
          />

          {isEmergency && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              You can update the details of your emergency leave later.
            </p>
          )}

          {leaveType === "sick" && !isEmergency && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900 rounded border border-blue-200 dark:border-blue-700">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Sick Leave Documentation Requirements:</strong>
              </p>
              <ul className="list-disc pl-5 mt-1 text-xs text-blue-600 dark:text-blue-400">
                <li>1-3 days: Self-declaration is sufficient</li>
                <li>More than 3 days: Medical certificate required</li>
                <li>
                  Hospital admission: Submit discharge summary when available
                </li>
              </ul>
            </div>
          )}

          {/* Special info for long-term sick leaves */}
          {leaveType === "sick" &&
            startDate &&
            endDate &&
            (new Date(endDate).getTime() - new Date(startDate).getTime()) /
              (1000 * 60 * 60 * 24) >=
              7 && (
              <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900 rounded border border-purple-200 dark:border-purple-700">
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  <strong>Extended Sick Leave Information:</strong>
                </p>
                <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                  For sick leaves longer than 7 days, our HR team may contact
                  you to discuss additional support options or documentation
                  requirements.
                </p>
              </div>
            )}
        </div>

        {/* Emergency Leave Toggle */}
        {!location.search.includes("emergency=true") && (
          <div className="flex items-center">
            <input
              id="emergency"
              type="checkbox"
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              checked={isEmergency}
              onChange={(e) => {
                setIsEmergency(e.target.checked);
                if (e.target.checked) {
                  // Set today's date for emergency leave
                  const today = new Date();
                  const formattedDate = today.toISOString().split("T")[0];
                  setStartDate(formattedDate);
                  setEndDate(formattedDate);
                  setLeaveType("sick");
                  if (!reason) {
                    setReason("Emergency leave - details to be provided later");
                  }
                }
              }}
              disabled={isSubmitting}
            />
            <label
              htmlFor="emergency"
              className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
            >
              This is an emergency leave
            </label>
          </div>
        )}

        {isEmergency && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900 rounded border border-yellow-200 dark:border-yellow-700">
            <div className="flex">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  Important information about emergency leaves:
                </p>
                <ul className="mt-1 text-xs text-yellow-700 dark:text-yellow-400 list-disc pl-5 space-y-1">
                  <li>Emergency leaves are automatically approved</li>
                  <li>They are deducted from your sick leave balance</li>
                  <li>
                    You must provide proper documentation upon your return
                  </li>
                  <li>All managers will be notified of your emergency leave</li>
                  <li>
                    <strong>Limited to 3 emergency leaves per 30 days</strong>
                  </li>
                  <li>
                    <strong>Cannot be taken on consecutive days</strong>
                  </li>
                  <li>Frequent emergency leaves trigger automatic HR review</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Medical Certificate Upload Placeholder - in a real app, this would be a file upload component */}
        {leaveType === "sick" &&
          startDate &&
          endDate &&
          (new Date(endDate).getTime() - new Date(startDate).getTime()) /
            (1000 * 60 * 60 * 24) >=
            3 && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Medical Certificate
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                For sick leaves longer than 3 days, please upload your medical
                certificate if available, or submit it later.
              </p>

              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="medicalCertificate"
                  className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      className="w-8 h-8 mb-1 text-gray-500 dark:text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      ></path>
                    </svg>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PDF, JPG or PNG (MAX. 5MB)
                    </p>
                  </div>
                  <input
                    id="medicalCertificate"
                    type="file"
                    className="hidden"
                    disabled
                  />
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Note: This is a prototype. File upload functionality is not
                implemented.
              </p>
            </div>
          )}

        {/* Special Case Checkbox for Sick Leaves */}
        {leaveType === "sick" && !isEmergency && (
          <div className="mt-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="medicalEmergency"
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  onChange={(e) => {
                    if (e.target.checked) {
                      // Show medical emergency info
                      alert(
                        "For medical emergencies, your leave request will be prioritized and may be approved even if you exceed your sick leave balance."
                      );
                    }
                  }}
                />
              </div>
              <div className="ml-3 text-sm">
                <label
                  htmlFor="medicalEmergency"
                  className="font-medium text-gray-700 dark:text-gray-300"
                >
                  This is a medical emergency
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Mark this option for serious medical situations requiring
                  immediate attention.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-2 mt-4">
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            onClick={() => navigate(`/dashboard/employee/${userId}`)}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-4 py-2 ${
              isEmergency
                ? "bg-red-600 hover:bg-red-700 text-white"
                : leaveType === "sick"
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            } rounded-md focus:outline-none ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Submitting..."
              : isEmergency
              ? "Submit Emergency Leave"
              : `Submit ${
                  leaveType.charAt(0).toUpperCase() + leaveType.slice(1)
                } Leave`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplyLeave;
