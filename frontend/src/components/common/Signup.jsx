import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupUser } from "../../services/auth";
import { Eye, EyeOff, User, Mail, Lock, UserPlus } from "lucide-react";
import { Navigate } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!acceptedTerms) {
      newErrors.terms = "Please accept the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log(formData);
      await signupUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      alert("Account created successfully!");

      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setAcceptedTerms(false);
      navigate("/");
    } catch (error) {
      if (error.response) {
        alert("Signup error:", error.response.data.detail); // <== this will log "Email already registered"
      } else {
        alert("Unexpected error:", error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === "password") {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans overflow-hidden">
      <div className="w-full max-w-md">
        {/* Signup Card */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-700">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Create Account
            </h2>
            <p className="text-gray-400 text-sm">Sign up to get started</p>
          </div>

          {/* Signup Form */}
          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-medium text-gray-300 mb-1"
              >
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 pl-10 bg-gray-700 border rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-500 ${
                    errors.name ? "border-red-500" : "border-gray-600"
                  }`}
                  placeholder="Enter your full name"
                />
                <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-red-400">{errors.name}</p>
              )}
            </div>

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
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 pl-10 bg-gray-700 border rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-500 ${
                    errors.email ? "border-red-500" : "border-gray-600"
                  }`}
                  placeholder="Enter your email"
                />
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-gray-300 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 pl-10 pr-10 bg-gray-700 border rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-500 ${
                    errors.password ? "border-red-500" : "border-gray-600"
                  }`}
                  placeholder="Create a strong password"
                />
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("password")}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-300 transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-medium text-gray-300 mb-1"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 pl-10 pr-10 bg-gray-700 border rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-500 ${
                    errors.confirmPassword
                      ? "border-red-500"
                      : "border-gray-600"
                  }`}
                  placeholder="Confirm your password"
                />
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirmPassword")}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-300 transition-colors duration-200"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className={`h-3.5 w-3.5 text-blue-600 bg-gray-700 border rounded focus:ring-blue-500 focus:ring-2 ${
                    errors.terms ? "border-red-500" : "border-gray-600"
                  }`}
                />
              </div>
              <div className="ml-2 text-xs">
                <label htmlFor="terms" className="text-gray-300">
                  I agree to the{" "}
                  <a
                    href="#"
                    className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                  >
                    Terms and Conditions
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                  >
                    Privacy Policy
                  </a>
                </label>
              </div>
            </div>
            {errors.terms && (
              <p className="text-xs text-red-400">{errors.terms}</p>
            )}

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:transform-none text-sm"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </div>

          {/* Sign In Link */}
          <p className="mt-4 text-center text-xs text-gray-400">
            Already have an account?{" "}
            <Link
              to="/"
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-3 text-center text-xs text-gray-500">
          © 2025 Your Company. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Signup;
