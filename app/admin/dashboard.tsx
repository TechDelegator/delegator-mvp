import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

// Define types
type User = {
  id: string;
  name: string;
  role: "employee" | "admin" | "manager";
  email: string;
};

type ManagerAssignment = {
  managerId: string;
  employeeIds: string[];
};

const AdminDashboard: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  // State for users
  const [employees, setEmployees] = useState<User[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State for manager assignments
  const [managerAssignments, setManagerAssignments] = useState<
    ManagerAssignment[]
  >([]);
  const [selectedManager, setSelectedManager] = useState<string>("");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Handler for logout
  const handleLogout = () => {
    navigate("/");
  };

  // Fetch users and assignments
  useEffect(() => {
    const fetchData = () => {
      setIsLoading(true);
      const storedUsers = localStorage.getItem("leave-app-users");
      const storedAssignments = localStorage.getItem(
        "leave-app-manager-assignments"
      );

      if (storedUsers) {
        const allUsers: User[] = JSON.parse(storedUsers);

        // Set current admin
        const admin = allUsers.find((u) => u.id === userId);
        if (admin) {
          setCurrentAdmin(admin);
        } else {
          // Redirect if not an admin
          navigate("/");
          return;
        }

        // Filter employees and managers
        setEmployees(allUsers.filter((user) => user.role === "employee"));
        setManagers(allUsers.filter((user) => user.role === "manager"));
      }

      // Load manager assignments
      if (storedAssignments) {
        const assignments: ManagerAssignment[] = JSON.parse(storedAssignments);
        setManagerAssignments(assignments);
      } else {
        // Initialize empty assignments if none exist
        setManagerAssignments([]);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [userId, navigate]);

  // Handle manager selection
  const handleManagerChange = (managerId: string) => {
    setSelectedManager(managerId);

    // Find existing assignments for this manager
    const assignment = managerAssignments.find(
      (a) => a.managerId === managerId
    );
    if (assignment) {
      setSelectedEmployees(assignment.employeeIds);
    } else {
      setSelectedEmployees([]);
    }

    setHasChanges(false);
  };

  // Handle employee selection/deselection
  const handleEmployeeSelection = (employeeId: string) => {
    const updatedSelection = selectedEmployees.includes(employeeId)
      ? selectedEmployees.filter((id) => id !== employeeId)
      : [...selectedEmployees, employeeId];

    setSelectedEmployees(updatedSelection);
    setHasChanges(true);
    setSaveSuccess(false);
  };

  // Save assignments
  const saveAssignments = () => {
    if (!selectedManager) return;

    // Create updated assignments
    const updatedAssignments = [...managerAssignments];
    const existingIndex = updatedAssignments.findIndex(
      (a) => a.managerId === selectedManager
    );

    if (existingIndex >= 0) {
      // Update existing assignment
      updatedAssignments[existingIndex].employeeIds = selectedEmployees;
    } else {
      // Create new assignment
      updatedAssignments.push({
        managerId: selectedManager,
        employeeIds: selectedEmployees,
      });
    }

    // Save to localStorage
    localStorage.setItem(
      "leave-app-manager-assignments",
      JSON.stringify(updatedAssignments)
    );

    // Update state
    setManagerAssignments(updatedAssignments);
    setHasChanges(false);
    setSaveSuccess(true);

    // Reset success message after 3 seconds
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  // Get employee count for a manager
  const getEmployeeCount = (managerId: string) => {
    const assignment = managerAssignments.find(
      (a) => a.managerId === managerId
    );
    return assignment ? assignment.employeeIds.length : 0;
  };

  // Get manager name for an employee
  const getManagerForEmployee = (employeeId: string) => {
    for (const assignment of managerAssignments) {
      if (assignment.employeeIds.includes(employeeId)) {
        const manager = managers.find((m) => m.id === assignment.managerId);
        return manager ? manager.name : "None";
      }
    }
    return "None";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      {/* Header with user info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Delegator{" "}
            <span className="text-indigo-600 dark:text-indigo-400">Admin</span>
          </h1>
          {currentAdmin && (
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back, {currentAdmin.name}
            </p>
          )}
        </div>

        <div className="mt-4 md:mt-0 flex items-center">
          <button
            onClick={handleLogout}
            className="ml-4 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Logout
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Manager selection panel */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Managers
            </h2>

            {managers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No managers available
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {managers.map((manager) => (
                  <div
                    key={manager.id}
                    className={`p-4 rounded-lg cursor-pointer ${
                      selectedManager === manager.id
                        ? "bg-indigo-50 border-2 border-indigo-500 dark:bg-indigo-900/30 dark:border-indigo-400"
                        : "bg-gray-50 border border-gray-200 hover:border-indigo-300 dark:bg-gray-700 dark:border-gray-600 dark:hover:border-indigo-600"
                    }`}
                    onClick={() => handleManagerChange(manager.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-lg">
                          {manager.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <h3 className="text-md font-medium text-gray-900 dark:text-white">
                            {manager.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {manager.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 text-xs px-2 py-1 rounded-full">
                          {getEmployeeCount(manager.id)} employees
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Employee assignment panel */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedManager
                  ? `Assign Employees to ${
                      managers.find((m) => m.id === selectedManager)?.name ||
                      "Manager"
                    }`
                  : "Select a Manager"}
              </h2>

              {selectedManager && (
                <button
                  onClick={saveAssignments}
                  disabled={!hasChanges}
                  className={`px-4 py-2 rounded-lg text-white ${
                    hasChanges
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  Save Assignments
                </button>
              )}
            </div>

            {saveSuccess && (
              <div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-3 rounded-lg">
                <p className="text-green-800 dark:text-green-300 text-sm">
                  Assignments saved successfully!
                </p>
              </div>
            )}

            {!selectedManager ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">
                  Please select a manager from the left panel to assign
                  employees
                </p>
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  No employees available
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Select employees to assign to this manager:
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedEmployees(employees.map((e) => e.id));
                        setHasChanges(true);
                        setSaveSuccess(false);
                      }}
                      className="text-xs px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => {
                        setSelectedEmployees([]);
                        setHasChanges(true);
                        setSaveSuccess(false);
                      }}
                      className="text-xs px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="max-h-[500px] overflow-y-auto pr-2">
                  <div className="space-y-2">
                    {employees.map((employee) => (
                      <div
                        key={employee.id}
                        className={`p-4 rounded-lg border ${
                          selectedEmployees.includes(employee.id)
                            ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-700"
                            : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 font-semibold text-lg">
                              {employee.name.charAt(0)}
                            </div>
                            <div className="ml-4">
                              <h3 className="text-md font-medium text-gray-900 dark:text-white">
                                {employee.name}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {employee.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="mr-4 text-sm text-gray-500 dark:text-gray-400">
                              Current Manager:{" "}
                              <span className="font-medium">
                                {getManagerForEmployee(employee.id)}
                              </span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={selectedEmployees.includes(
                                  employee.id
                                )}
                                onChange={() =>
                                  handleEmployeeSelection(employee.id)
                                }
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
