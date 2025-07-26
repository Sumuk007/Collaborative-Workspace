import React, { useState } from "react";
import { forgotPassword } from "../../services/auth";
import { Mail, ArrowLeft, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
  
const ForgotPassword = () => {
  const navigate = useNavigate(); 
  
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setEmail(e.target.value);

    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  const handleForgotPassword = () =>{
    navigate('/forgot-password')
  }

  const validateForm = () => {
    if (!email) {
      setError("Email is required");
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await forgotPassword(email);
      setIsEmailSent(true);
    } catch (error) {
      console.error("Forgot password error:", error);
      const errorMessage =
        error.response?.data?.detail || "Something went wrong.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSignin = () => {
    // Reset form state
    setEmail("");
    setError("");
    setIsEmailSent(false);
    console.log("Navigate back to signin");
    navigate('/')
  };

  const handleResendEmail = () => {
    setIsEmailSent(false);
    handleSubmit();
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans overflow-hidden">
      <div className="w-full max-w-md">
        {/* Forgot Password Card */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-700">
          {!isEmailSent ? (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Forgot Password?
                </h2>
                <p className="text-gray-400 text-sm">
                  Enter your email to reset your password
                </p>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-medium text-gray-300 mb-1"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={handleChange}
                      className={`w-full px-3 py-2.5 pl-10 bg-gray-700 border rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-500 ${
                        error ? "border-red-500" : "border-gray-600"
                      }`}
                      placeholder="Enter your email address"
                    />
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  </div>
                  {error && (
                    <p className="mt-1 text-xs text-red-400">{error}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:transform-none text-sm"
                >
                  {isLoading ? "Sending Email..." : "Send Reset Email"}
                </button>
              </div>

              {/* Back to Sign In */}
              <button onClick={handleBackToSignin} className="w-full mt-3 flex items-center justify-center text-gray-400 hover:text-gray-300 transition-colors duration-200 text-sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </button>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center mb-6">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Check Your Email
                </h2>
                <p className="text-gray-400 text-sm">
                  We've sent a password reset link to
                </p>
                <p className="text-blue-400 text-sm font-medium mt-1">
                  {email}
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <p className="text-gray-300 text-xs leading-relaxed">
                  Click the link in your email to reset your password. If you
                  don't see the email, check your spam folder.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:transform-none text-sm"
                >
                  {isLoading ? "Resending..." : "Resend Email"}
                </button>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="w-full flex items-center justify-center text-gray-400 hover:text-gray-300 transition-colors duration-200 text-sm"
                >
                    Forgot password?
                </button>
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

export default ForgotPassword;
