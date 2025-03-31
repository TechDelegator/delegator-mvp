import React, { useState, useEffect } from "react";

const FeedbackButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("bug"); // 'bug' or 'suggestion'
  const [category, setCategory] = useState("ui");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(true);

  // Add effect to handle initial animations and tooltips
  useEffect(() => {
    // Check if this is first visit to the app
    const hasSeenFeedbackPrompt = localStorage.getItem("hasSeenFeedbackPrompt");

    if (!hasSeenFeedbackPrompt) {
      // Show tooltip after 10 seconds
      const tooltipTimer = setTimeout(() => {
        setShowTooltip(true);
      }, 10000);

      // Hide tooltip after 8 seconds once shown
      const hideTooltipTimer = setTimeout(() => {
        setShowTooltip(false);
        localStorage.setItem("hasSeenFeedbackPrompt", "true");
      }, 18000);

      return () => {
        clearTimeout(tooltipTimer);
        clearTimeout(hideTooltipTimer);
      };
    } else {
      // Disable pulse animation after several sessions
      const hasUsedAppMultipleTimes = localStorage.getItem("appSessionCount");
      if (hasUsedAppMultipleTimes && parseInt(hasUsedAppMultipleTimes) > 3) {
        setPulseAnimation(false);
      }

      // Update session count
      const currentCount = parseInt(
        localStorage.getItem("appSessionCount") || "0"
      );
      localStorage.setItem("appSessionCount", (currentCount + 1).toString());
    }
  }, []);

  const openModal = () => {
    setIsOpen(true);
    setShowTooltip(false);
    localStorage.setItem("hasSeenFeedbackPrompt", "true");
  };

  const closeModal = () => {
    if (!isSubmitting) {
      setIsOpen(false);
      if (isSubmitted) {
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setFeedbackType("bug");
    setCategory("ui");
    setTitle("");
    setDescription("");
    setSteps("");
    setEmail("");
    setIsSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Replace with your Worker URL
      const response = await fetch(
        "https://feedback-worker.delegatoraxel.workers.dev",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: feedbackType,
            category,
            title,
            description,
            steps: feedbackType === "bug" ? steps : null,
            email,
            timestamp: new Date().toISOString(),
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setIsSubmitted(true);
        // Reset form after successful submission
        setTimeout(() => {
          setIsOpen(false);
          resetForm();
        }, 2000);
      } else {
        console.error("Error submitting feedback:", result.error);
        alert("Failed to submit feedback. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Categories based on feedback type
  const getCategories = () => {
    if (feedbackType === "bug") {
      return [
        { value: "ui", label: "UI Issue" },
        { value: "functionality", label: "Functionality Issue" },
        { value: "performance", label: "Performance Issue" },
        { value: "other", label: "Other" },
      ];
    } else {
      return [
        { value: "ui", label: "UI Improvement" },
        { value: "functionality", label: "New Feature" },
        { value: "workflow", label: "Workflow Improvement" },
        { value: "other", label: "Other" },
      ];
    }
  };

  return (
    <>
      {/* Floating Button with improved design */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
        {/* Tooltip */}
        {showTooltip && (
          <div className="mb-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-sm max-w-xs">
            <div className="flex items-start">
              <span className="text-yellow-500 mr-2">✨</span>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Help us improve Delegator!
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-xs mt-1">
                  Share your thoughts or report issues - it only takes a minute!
                </p>
              </div>
            </div>
            <div className="absolute bottom-0 right-6 transform translate-y-1/2 rotate-45 w-2 h-2 bg-white dark:bg-gray-800"></div>
          </div>
        )}

        <button
          onClick={openModal}
          className={`flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg hover:from-indigo-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${
            pulseAnimation ? "animate-pulse" : ""
          }`}
          aria-label="Give feedback"
        >
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="16" cy="12" r="1"></circle>
              <circle cx="8" cy="12" r="1"></circle>
            </svg>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
            </span>
          </div>
        </button>
      </div>

      {/* Modal Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          {/* Modal Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  {feedbackType === "bug" ? (
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
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-green-500 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  )}
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {feedbackType === "bug"
                      ? "Report a Bug"
                      : "Suggest an Improvement"}
                  </h3>
                </div>
                <button
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={closeModal}
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
                    {feedbackType === "bug"
                      ? "Bug Report Submitted!"
                      : "Suggestion Submitted!"}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Thank you for your feedback!{" "}
                    {feedbackType === "bug"
                      ? "We'll investigate this issue as soon as possible."
                      : "We appreciate your ideas to improve our application."}
                  </p>
                </div>
              ) : (
                // Feedback Form
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    {/* Feedback Type Toggle */}
                    <div className="flex border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
                      <button
                        type="button"
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${
                          feedbackType === "bug"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        }`}
                        onClick={() => setFeedbackType("bug")}
                      >
                        Report a Bug
                      </button>
                      <button
                        type="button"
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${
                          feedbackType === "suggestion"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        }`}
                        onClick={() => setFeedbackType("suggestion")}
                      >
                        Suggest Improvement
                      </button>
                    </div>

                    {/* Category */}
                    <div>
                      <label
                        htmlFor="category"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Category
                      </label>
                      <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      >
                        {getCategories().map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Title */}
                    <div>
                      <label
                        htmlFor="title"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder={
                          feedbackType === "bug"
                            ? "Summarize the bug"
                            : "Name your suggestion"
                        }
                        required
                      />
                    </div>

                    {/* Description */}
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
                        placeholder={
                          feedbackType === "bug"
                            ? "Please describe the issue in detail..."
                            : "Please describe your idea in detail..."
                        }
                        required
                      />
                    </div>

                    {/* Steps to Reproduce (Only for bugs) */}
                    {feedbackType === "bug" && (
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
                    )}

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
                        onClick={closeModal}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 mr-2"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                          feedbackType === "bug"
                            ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                            : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                        }`}
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
                        ) : feedbackType === "bug" ? (
                          "Submit Bug Report"
                        ) : (
                          "Submit Suggestion"
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
    </>
  );
};

export default FeedbackButton;
