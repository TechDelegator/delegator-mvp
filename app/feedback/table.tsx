import React, { useEffect, useState } from "react";

type FeedbackItem = {
  id: string;
  type: "bug" | "suggestion";
  category: string;
  title: string;
  description: string;
  steps: string | null;
  email: string;
  timestamp: string;
};

type FeedbackResponse = {
  success: boolean;
  data: FeedbackItem[] | FeedbackItem;
  count?: number;
};

const FeedbackPage: React.FC = () => {
  const [feedbackData, setFeedbackData] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "bug" | "suggestion">("all");
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchFeedback = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          "https://feedback-worker.delegatoraxel.workers.dev/api/feedback"
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data: FeedbackResponse = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setFeedbackData(data.data);
        } else {
          throw new Error("Failed to fetch feedback data");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error("Error fetching feedback:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  // Fetch detailed feedback
  const fetchFeedbackDetail = async (id: string) => {
    try {
      const response = await fetch(
        `https://feedback-worker.delegatoraxel.workers.dev/api/feedback?id=${id}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data: FeedbackResponse = await response.json();
      if (data.success && !Array.isArray(data.data)) {
        setSelectedFeedback(data.data as FeedbackItem);
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error("Error fetching feedback detail:", err);
    }
  };

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()} ${date.toLocaleString("default", {
      month: "short",
    })} ${date.getFullYear()}, ${date.getHours()}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;
  };

  // Get filtered feedback
  const getFilteredFeedback = () => {
    if (filter === "all") return feedbackData;
    return feedbackData.filter((item) => item.type === filter);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Feedback Management</h2>

        {/* Filter options */}
        <div className="mb-6 bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-3">
            Filter Feedback
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-md ${
                filter === "all"
                  ? "bg-gray-700 text-white"
                  : "bg-gray-900 text-gray-300 hover:bg-gray-700"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("bug")}
              className={`px-4 py-2 rounded-md ${
                filter === "bug"
                  ? "bg-red-900 text-white"
                  : "bg-red-900/40 text-red-300 hover:bg-red-800"
              }`}
            >
              Bugs
            </button>
            <button
              onClick={() => setFilter("suggestion")}
              className={`px-4 py-2 rounded-md ${
                filter === "suggestion"
                  ? "bg-green-900 text-white"
                  : "bg-green-900/40 text-green-300 hover:bg-green-800"
              }`}
            >
              Suggestions
            </button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-900/50 border border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-300">
                  Error loading feedback data
                </h3>
                <div className="mt-2 text-sm text-red-200">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && getFilteredFeedback().length === 0 && (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-gray-500 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-white mb-2">
              No Feedback Found
            </h3>
            <p className="text-gray-400 max-w-md mx-auto">
              {feedbackData.length === 0
                ? "No feedback has been submitted yet."
                : `No ${filter} feedback found. Try another filter.`}
            </p>
          </div>
        )}

        {/* Feedback list */}
        {!isLoading && !error && getFilteredFeedback().length > 0 && (
          <div className="mb-6">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 bg-gray-800 px-4 py-3 rounded-t-lg">
              <div className="col-span-3 text-xs font-medium text-gray-400 uppercase">
                Type & Category
              </div>
              <div className="col-span-5 text-xs font-medium text-gray-400 uppercase">
                Title & Description
              </div>
              <div className="col-span-2 text-xs font-medium text-gray-400 uppercase">
                Submitted
              </div>
              <div className="col-span-2 text-xs font-medium text-gray-400 uppercase">
                Contact
              </div>
            </div>

            {/* Feedback items */}
            {getFilteredFeedback().map((feedback) => (
              <div
                key={feedback.id}
                className="grid grid-cols-12 gap-4 px-4 py-4 bg-gray-800/50 hover:bg-gray-700 border-t border-gray-700 cursor-pointer"
                onClick={() => fetchFeedbackDetail(feedback.id)}
              >
                <div className="col-span-3">
                  <div className="flex flex-col space-y-2">
                    <div
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        feedback.type === "bug"
                          ? "bg-red-900 text-white"
                          : "bg-green-900 text-white"
                      }`}
                    >
                      {feedback.type === "bug" ? "Bug" : "Suggestion"}
                    </div>
                    <div className="px-3 py-1 rounded-md text-sm font-medium bg-blue-900 text-white">
                      {feedback.category.charAt(0).toUpperCase() +
                        feedback.category.slice(1)}
                    </div>
                  </div>
                </div>

                <div className="col-span-5">
                  <h4 className="font-medium text-white mb-1">
                    {feedback.title}
                  </h4>
                  <p className="text-gray-300 text-sm">
                    {feedback.description}
                  </p>
                  {feedback.steps && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-400 font-medium">
                        Steps to Reproduce:
                      </p>
                      <p className="text-xs text-gray-300">{feedback.steps}</p>
                    </div>
                  )}
                </div>

                <div className="col-span-2 text-sm text-gray-300">
                  {formatDate(feedback.timestamp)}
                </div>

                <div className="col-span-2 text-sm text-gray-300">
                  {feedback.email ? feedback.email : "Anonymous"}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Section */}
        {!isLoading && !error && feedbackData.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-4">
              Feedback Statistics
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-4xl font-bold text-white mb-1">
                  {feedbackData.length}
                </div>
                <div className="text-sm text-gray-400">Total Submissions</div>
              </div>
              <div className="bg-red-900/50 rounded-lg p-4 text-center">
                <div className="text-4xl font-bold text-red-300 mb-1">
                  {feedbackData.filter((item) => item.type === "bug").length}
                </div>
                <div className="text-sm text-red-400">Bugs</div>
              </div>
              <div className="bg-green-900/50 rounded-lg p-4 text-center">
                <div className="text-4xl font-bold text-green-300 mb-1">
                  {
                    feedbackData.filter((item) => item.type === "suggestion")
                      .length
                  }
                </div>
                <div className="text-sm text-green-400">Suggestions</div>
              </div>
              <div className="bg-blue-900/50 rounded-lg p-4 text-center">
                <div className="text-4xl font-bold text-blue-300 mb-1">
                  {feedbackData.filter((item) => item.category === "ui").length}
                </div>
                <div className="text-sm text-blue-400">UI Related</div>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Detail Modal */}
        {isModalOpen && selectedFeedback && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div
                      className={`px-3 py-1 rounded-md text-sm font-medium mr-2 ${
                        selectedFeedback.type === "bug"
                          ? "bg-red-900 text-white"
                          : "bg-green-900 text-white"
                      }`}
                    >
                      {selectedFeedback.type === "bug" ? "Bug" : "Suggestion"}
                    </div>
                    <div className="px-3 py-1 rounded-md text-sm font-medium bg-blue-900 text-white">
                      {selectedFeedback.category.charAt(0).toUpperCase() +
                        selectedFeedback.category.slice(1)}
                    </div>
                  </div>
                  <button
                    className="text-gray-400 hover:text-white"
                    onClick={() => setIsModalOpen(false)}
                  >
                    <svg
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

                <h3 className="text-xl font-bold text-white mb-3">
                  {selectedFeedback.title}
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-400">Submitted On</p>
                    <p className="text-md text-white">
                      {formatDate(selectedFeedback.timestamp)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Contact</p>
                    <p className="text-md text-white">
                      {selectedFeedback.email || "Anonymous"}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-1">Description</p>
                  <div className="bg-gray-700 p-3 rounded-md text-white">
                    {selectedFeedback.description}
                  </div>
                </div>

                {selectedFeedback.steps && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">
                      Steps to Reproduce
                    </p>
                    <div className="bg-gray-700 p-3 rounded-md text-white">
                      {selectedFeedback.steps}
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackPage;
