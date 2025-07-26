import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { resetPassword } from "../../services/auth";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await resetPassword({ token, newPassword: password });
      setSuccess("Your password has been reset. You can now sign in.");
    } catch (err) {
      const message = err.response?.data?.detail || "Something went wrong.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans overflow-hidden">
        <div className="w-full max-w-md">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-700">
            <p className="text-red-400 text-center text-sm">Invalid or missing token</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans overflow-hidden">
      <div className="w-full max-w-md">
        {/* Reset Password Card */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-700">
          {!success ? (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v-2L4.257 9.257a6 6 0 017.743-7.743L15 7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Reset Your Password
                </h2>
                <p className="text-gray-400 text-sm">
                  Enter your new password below
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              {/* Form */}
              <div className="space-y-4">
                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-medium text-gray-300 mb-1"
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    placeholder="Enter your new password"
                    className={`w-full px-3 py-2.5 bg-gray-700 border rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-500 ${
                      error ? "border-red-500" : "border-gray-600"
                    }`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs font-medium text-gray-300 mb-1"
                  >
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    placeholder="Confirm your new password"
                    className={`w-full px-3 py-2.5 bg-gray-700 border rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-500 ${
                      error ? "border-red-500" : "border-gray-600"
                    }`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:transform-none text-sm"
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </button>
              </div>

              {/* Back to Sign In */}
              <div className="w-full mt-3 flex items-center justify-center text-gray-400 hover:text-gray-300 transition-colors duration-200 text-sm cursor-pointer">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Sign In
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center mb-6">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Password Reset Successfully
                </h2>
                <p className="text-gray-400 text-sm">
                  Your password has been reset successfully
                </p>
              </div>

              {/* Success Message */}
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <p className="text-gray-300 text-xs leading-relaxed">
                  {success}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="mt-3 text-center text-xs text-gray-500">
          © 2025 Your Company. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;