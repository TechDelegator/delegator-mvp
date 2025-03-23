import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';

// Define types
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
  const [leaveType, setLeaveType] = useState<'paid' | 'sick' | 'casual' | 'miscellaneous'>('paid');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isEmergency, setIsEmergency] = useState<boolean>(false);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    // Check if emergency parameter is in URL
    const params = new URLSearchParams(location.search);
    if (params.get('emergency') === 'true') {
      setIsEmergency(true);

      // Set default dates for emergency leave (today)
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      setStartDate(formattedDate);
      setEndDate(formattedDate);
      setReason('Emergency leave - details to be provided later');
    }

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

    fetchLeaveBalance();
  }, [userId, location.search]);

  const validateLeaveApplication = (): string[] => {
    const errors: string[] = [];

    // Required fields
    if (!startDate) errors.push('Start date is required');
    if (!endDate) errors.push('End date is required');
    if (!reason) errors.push('Reason is required');

    // Date validation
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today && !isEmergency) {
      errors.push('Start date cannot be in the past');
    }

    if (end < start) {
      errors.push('End date cannot be before start date');
    }

    // Check if user has enough balance
    if (leaveBalance) {
      // Calculate number of days
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days

      if (leaveType === 'paid' && diffDays > leaveBalance.paid) {
        errors.push(`Not enough paid leave balance. You have ${leaveBalance.paid} days available.`);
      } else if (leaveType === 'sick' && diffDays > leaveBalance.sick) {
        errors.push(`Not enough sick leave balance. You have ${leaveBalance.sick} days available.`);
      } else if (leaveType === 'casual' && diffDays > leaveBalance.casual) {
        errors.push(`Not enough casual leave balance. You have ${leaveBalance.casual} days available.`);
      } else if (leaveType === 'miscellaneous' && diffDays > leaveBalance.miscellaneous) {
        errors.push(`Not enough miscellaneous leave balance. You have ${leaveBalance.miscellaneous} days available.`);
      }

      // Check policy rules
      if (leaveType === 'casual' && diffDays > 1) {
        errors.push('Only 1 casual leave per week is allowed');
      }

      if (leaveType === 'miscellaneous' && diffDays > 1) {
        errors.push('Miscellaneous leaves cannot be taken for more than one day at a time');
      }

      // Check for paid leave monthly limit (5 per month)
      if (leaveType === 'paid') {
        const startMonth = start.getMonth();
        const endMonth = end.getMonth();

        if (startMonth !== endMonth) {
          errors.push('Paid leaves cannot span across different months');
        } else {
          // Check if user has already used paid leaves this month
          const storedApplications = localStorage.getItem('leave-app-applications');
          if (storedApplications) {
            const applications: LeaveApplication[] = JSON.parse(storedApplications);
            const currentMonthPaidLeaves = applications.filter(a =>
              a.userId === userId &&
              a.type === 'paid' &&
              (a.status === 'approved' || a.status === 'pending') &&
              new Date(a.startDate).getMonth() === startMonth
            );

            // Calculate days already applied for
            let daysAlreadyApplied = 0;
            currentMonthPaidLeaves.forEach(leave => {
              const leaveStart = new Date(leave.startDate);
              const leaveEnd = new Date(leave.endDate);
              const leaveDiffTime = Math.abs(leaveEnd.getTime() - leaveStart.getTime());
              const leaveDiffDays = Math.ceil(leaveDiffTime / (1000 * 60 * 60 * 24)) + 1;
              daysAlreadyApplied += leaveDiffDays;
            });

            if (daysAlreadyApplied + diffDays > 5) {
              errors.push(`You can only take 5 paid leaves per month. You have already used or applied for ${daysAlreadyApplied} days this month.`);
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
      userId: userId || '',
      type: leaveType,
      startDate,
      endDate,
      status: isEmergency ? 'approved' : 'pending', // Emergency leaves are auto-approved
      reason,
      appliedOn: new Date().toISOString(),
      isEmergency
    };

    // Get existing applications from localStorage
    const storedApplications = localStorage.getItem('leave-app-applications');
    let applications: LeaveApplication[] = [];

    if (storedApplications) {
      applications = JSON.parse(storedApplications);
    }

    // Add new application
    applications.push(newLeaveApplication);

    // Save to localStorage
    localStorage.setItem('leave-app-applications', JSON.stringify(applications));

    // Update leave balance if emergency leave
    if (isEmergency) {
      if (leaveBalance) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        // Create updated balance
        const updatedBalance = { ...leaveBalance };

        // Deduct from appropriate balance
        if (leaveType === 'paid') {
          updatedBalance.paid = Math.max(0, updatedBalance.paid - diffDays);
        } else if (leaveType === 'sick') {
          updatedBalance.sick = Math.max(0, updatedBalance.sick - diffDays);
        } else if (leaveType === 'casual') {
          updatedBalance.casual = Math.max(0, updatedBalance.casual - diffDays);
        } else if (leaveType === 'miscellaneous') {
          updatedBalance.miscellaneous = Math.max(0, updatedBalance.miscellaneous - diffDays);
        }

        // Update in localStorage
        const storedBalances = localStorage.getItem('leave-app-balances');
        if (storedBalances) {
          const balances: LeaveBalance[] = JSON.parse(storedBalances);
          const updatedBalances = balances.map(b =>
            b.userId === userId ? updatedBalance : b
          );
          localStorage.setItem('leave-app-balances', JSON.stringify(updatedBalances));
        }
      }
    }

    // Navigate back to dashboard
    setTimeout(() => {
      navigate(`/dashboard/employee/${userId}`);
    }, 1000);
  };

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
        {isEmergency ? 'Apply for Emergency Leave' : 'Apply for Leave'}
      </h2>

      {/* Leave Balance Summary */}
      <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Leave Balance</h3>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Paid</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {leaveBalance?.paid || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Sick</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {leaveBalance?.sick || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Casual</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {leaveBalance?.casual || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Misc</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {leaveBalance?.miscellaneous || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {validationErrors.length > 0 && (
        <div className="mb-4 bg-red-50 dark:bg-red-900 rounded-lg p-3 border border-red-200 dark:border-red-700">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">Please fix the following issues:</h3>
          <ul className="list-disc pl-5 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="text-xs text-red-700 dark:text-red-400">
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
          <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Leave Type
          </label>
          <select
            id="leaveType"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as any)}
            disabled={isSubmitting}
          >
            <option value="paid">Paid Leave</option>
            <option value="sick">Sick Leave</option>
            <option value="casual">Casual Leave</option>
            <option value="miscellaneous">Miscellaneous Leave</option>
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {leaveType === 'paid' && 'Use for planned vacations or personal time off.'}
            {leaveType === 'sick' && 'Use when you are ill or need medical care.'}
            {leaveType === 'casual' && 'Use for short, unplanned absences. Limited to 1 day per week.'}
            {leaveType === 'miscellaneous' && 'Use for other purposes. Limited to 1 day at a time.'}
          </p>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isSubmitting || isEmergency}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isSubmitting || isEmergency}
              min={startDate || new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Reason */}
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Reason for Leave
          </label>
          <textarea
            id="reason"
            rows={3}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide a reason for your leave request..."
            disabled={isSubmitting}
          />
        </div>

        {/* Emergency Leave Toggle */}
        <div className="flex items-center">
          <input
            id="emergency"
            type="checkbox"
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            checked={isEmergency}
            onChange={(e) => setIsEmergency(e.target.checked)}
            disabled={isSubmitting || location.search.includes('emergency=true')}
          />
          <label htmlFor="emergency" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            This is an emergency leave
          </label>
        </div>

        {isEmergency && (
          <div className="p-2 bg-yellow-50 dark:bg-yellow-900 rounded border border-yellow-200 dark:border-yellow-700 text-xs text-yellow-800 dark:text-yellow-300">
            Emergency leaves are automatically approved. You must provide proper documentation later.
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-2">
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
            className={`px-4 py-2 ${isEmergency
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              } rounded-md focus:outline-none ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : isEmergency ? 'Submit Emergency Leave' : 'Submit Leave Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplyLeave;
