"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import AnimatedBackground from "./AnimatedBackground";
import { showFancyToast } from "../../hook/use_toast";
import { signinUser, signupUser } from "../../service/api";
import axios from "axios";

// Zod schemas
const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

const signUpSchema = z
  .object({
    firstname: z
      .string()
      .min(2, "First name must be at least 2 characters long"),
    lastname: z.string().min(2, "Last name must be at least 2 characters long"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and a number"
      ),
    confirmPassword: z.string(),
    photo: z.string().optional(), // base64 string of photo
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

interface AuthPageProps {
  mode: "signin" | "signup";
}

const AuthPage: React.FC<AuthPageProps> = ({ mode }) => {
  const router = useRouter();

  const [isSignUp, setIsSignUp] = useState(mode === "signup");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sign in form state
  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
  });

  // Sign up form state
  const [signUpData, setSignUpData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
    photo: "", // base64 string
  });

  // Convert uploaded file to base64 string

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      if (isSignUp) {
        const validatedData = signUpSchema.parse(signUpData);
        const response = await signupUser(validatedData);
        console.log("Backend is" + response);
        if (response) {
          localStorage.setItem("token", response.user.token);
          localStorage.setItem("userPic", response.photoURL);
          showFancyToast({
            title: "Sign Up Successful",
            description: "Welcome to CanvasFlow!",
            type: "success",
          });
          router.push("/canvas");
        } else {
          showFancyToast({
            title: "Sign Up Failed",
            description: response.message,
            type: "error",
          });
        }
      } else {
        const validatedData = signInSchema.parse(signInData);
        const response = await signinUser(validatedData);
        if (response.message === "User Logged In Successfully") {
          localStorage.setItem("token", response.token);
          localStorage.setItem("userPic", response.PhotoURL);
          showFancyToast({
            title: "Sign In Successful",
            description: "Welcome back to the canvas",
            type: "success",
          });
          router.push("/canvas");
        } else {
          showFancyToast({
            title: "Sign In Failed",
            description: response.message,
            type: "error",
          });
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      } else if (axios.isAxiosError(error)) {
        const backendMessage =
          error.response?.data?.message ||
          "Something went wrong. Please try again.";
        showFancyToast({
          title: "Error",
          description: backendMessage,
          type: "error",
        });
      } else {
        showFancyToast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          type: "error",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />

      <motion.button
        onClick={() => router.push("/")}
        className="absolute top-6 left-6 z-20 flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Home</span>
      </motion.button>

      <motion.div
        className="absolute top-6 right-6 z-20 flex items-center space-x-2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center space-x-1">
          <div className="w-8 h-8 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#a855f7"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </div>
          <span className="text-2xl -mt-1 font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            CanvasFlow
          </span>
        </div>
      </motion.div>

      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-4rem)] px-6 py-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/30">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h1>
              <p className="text-gray-600">
                {isSignUp
                  ? "Join thousands of creators on CanvasFlow"
                  : "Sign in to continue your creative journey"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {isSignUp ? (
                <>
                  {/* Email */}
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="Email Address"
                      autoComplete="email"
                      value={signUpData.email}
                      onChange={(e) =>
                        setSignUpData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className={`w-full pl-12 pr-12 py-4 bg-white/70 backdrop-blur-sm border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${
                        errors.email
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-200"
                      }`}
                    />
                    {errors.email && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center mt-2 text-red-500 text-sm"
                      >
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.email}
                      </motion.div>
                    )}
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      autoComplete="new-password"
                      value={signUpData.password}
                      onChange={(e) =>
                        setSignUpData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className={`w-full pl-12 pr-12 py-4 bg-white/70 backdrop-blur-sm border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${
                        errors.password
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-200"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                    {errors.password && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center mt-2 text-red-500 text-sm"
                      >
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.lastname}
                      </motion.div>
                    )}
                  </div>
                  {/* First Name */}
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="First Name"
                      autoComplete="given-name"
                      value={signUpData.firstname}
                      onChange={(e) =>
                        setSignUpData((prev) => ({
                          ...prev,
                          firstname: e.target.value,
                        }))
                      }
                      className={`w-full pl-12 pr-12 py-4 bg-white/70 backdrop-blur-sm border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${
                        errors.firstname
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-200"
                      }`}
                    />
                    {errors.firstname && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center mt-2 text-red-500 text-sm"
                      >
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.firstname}
                      </motion.div>
                    )}
                  </div>
                  {/* Last Name */}
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Last Name"
                      autoComplete="family-name"
                      value={signUpData.lastname}
                      onChange={(e) =>
                        setSignUpData((prev) => ({
                          ...prev,
                          lastname: e.target.value,
                        }))
                      }
                      className={`w-full pl-12 pr-12 py-4 bg-white/70 backdrop-blur-sm border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${
                        errors.lastname
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-200"
                      }`}
                    />
                    {errors.lastname && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center mt-2 text-red-500 text-sm"
                      >
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.lastname}
                      </motion.div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      autoComplete="new-password"
                      value={signUpData.confirmPassword}
                      onChange={(e) =>
                        setSignUpData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      className={`w-full pl-12 pr-12 py-4 bg-white/70 backdrop-blur-sm border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${
                        errors.confirmPassword
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-200"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                    {errors.confirmPassword && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center mt-2 text-red-500 text-sm"
                      >
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.confirmPassword}
                      </motion.div>
                    )}
                  </div>

                  {/* Photo Upload */}
                </>
              ) : (
                <>
                  {/* Sign In Email */}
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="Email Address"
                      autoComplete="email"
                      value={signInData.email}
                      onChange={(e) =>
                        setSignInData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className={`w-full pl-12 pr-12 py-4 bg-white/70 backdrop-blur-sm border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${
                        errors.email
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-200"
                      }`}
                    />
                    {errors.email && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center mt-2 text-red-500 text-sm"
                      >
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.email}
                      </motion.div>
                    )}
                  </div>

                  {/* Sign In Password */}
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={signInData.password}
                      onChange={(e) =>
                        setSignInData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className={`w-full pl-12 pr-12 py-4 bg-white/70 backdrop-blur-sm border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${
                        errors.password
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-200"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                    {errors.password && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center mt-2 text-red-500 text-sm"
                      >
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.password}
                      </motion.div>
                    )}
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-70"
              >
                {isLoading
                  ? isSignUp
                    ? "Signing up..."
                    : "Signing in..."
                  : isSignUp
                    ? "Sign Up"
                    : "Sign In"}
              </button>
              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setErrors({});
                  }}
                  className="flex items-center space-x-2 -mt-4 text-purple-600  transition-colors text-sm font-medium"
                >
                  {isSignUp ? (
                    <>
                      <span>
                        Already have an account?{" "}
                        <span className="cursor-pointer hover:underline hover:decoration-purple-600 hover:decoration-1  ">
                          Sign in
                        </span>
                      </span>
                    </>
                  ) : (
                    <span>
                      Don't have an account?{" "}
                      <span className="cursor-pointer hover:underline hover:decoration-purple-600 hover:decoration-1">
                        Sign up
                      </span>
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
