"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import Link from "next/link";

import { motion } from "framer-motion";

import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Brain,
  Sparkles,
  Rocket,
  GraduationCap,
  CheckCircle2,
  Crown,
  Loader2,
} from "lucide-react";

import toast from "react-hot-toast";

import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  // ======================================================
  // AUTH
  // ======================================================

  const {
    login,
    register,
  } = useAuth();

  const router =
    useRouter();

  // ======================================================
  // STATE
  // ======================================================

  const [isLogin, setIsLogin] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
      password: "",
      role: "student",
    });

  // ======================================================
  // HANDLE CHANGE
  // ======================================================

  const handleChange = (e) => {
    setFormData({
      ...formData,

      [e.target.name]:
        e.target.value,
    });
  };

  // ======================================================
  // SUBMIT
  // ======================================================

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      setLoading(true);

      let result;

      try {
        if (isLogin) {
          result =
            await login({
              email:
                formData.email,

              password:
                formData.password,
            });
        } else {
          result =
            await register({
              name: formData.name,

              email:
                formData.email,

              password:
                formData.password,

              role:
                formData.role,
            });
        }

        if (
          result.success
        ) {
          toast.success(
            result.message
          );

          router.push(
            "/dashboard"
          );
        } else {
          toast.error(
            result.message
          );
        }
      } catch {
        toast.error(
          "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    };

  // ======================================================
  // MAIN
  // ======================================================

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">

      {/* ======================================================
          BACKGROUND
      ====================================================== */}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#2563eb,transparent_30%)] opacity-20" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,#7c3aed,transparent_30%)] opacity-20" />

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <div className="relative z-10 min-h-screen grid lg:grid-cols-2">

        {/* ======================================================
            LEFT SIDE
        ====================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            x: -30,
          }}

          animate={{
            opacity: 1,
            x: 0,
          }}

          className="hidden lg:flex flex-col justify-center px-16 py-20"
        >
          {/* BADGE */}
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/20 backdrop-blur px-5 py-2 rounded-full w-fit mb-8">

            <Sparkles size={18} />

            AI Learning OS

          </div>

          {/* TITLE */}
          <h1 className="text-6xl font-extrabold leading-tight">

            Learn Faster
            <br />

            With

            <span className="text-blue-400">
              {" "}
              AI
            </span>

          </h1>

          {/* DESC */}
          <p className="text-xl text-gray-300 mt-8 leading-9 max-w-2xl">

            Transform YouTube videos
            into premium AI-generated
            notes, execution systems,
            projects and deep learning
            material.

          </p>

          {/* FEATURES */}
          <div className="mt-12 space-y-5">

            {[
              "AI-generated structured notes",
              "Roadmaps & execution plans",
              "Interview preparation",
              "Projects & implementation guides",
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3"
              >
                <CheckCircle2 className="text-green-400" />

                <span className="text-gray-200">
                  {item}
                </span>

              </div>
            ))}

          </div>

          {/* CARDS */}
          <div className="grid grid-cols-3 gap-5 mt-14">

            {[
              {
                title:
                  "Students",

                icon:
                  GraduationCap,
              },

              {
                title:
                  "Developers",

                icon: Rocket,
              },

              {
                title:
                  "Job Seekers",

                icon: Crown,
              },
            ].map(
              (
                item,
                i
              ) => {
                const Icon =
                  item.icon;

                return (
                  <div
                    key={i}
                    className="bg-white/5 border border-white/10 backdrop-blur rounded-3xl p-6"
                  >
                    <Icon className="w-10 h-10 text-blue-400" />

                    <h3 className="font-bold text-lg mt-5">
                      {
                        item.title
                      }
                    </h3>

                  </div>
                );
              }
            )}

          </div>

        </motion.div>

        {/* ======================================================
            RIGHT SIDE
        ====================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            x: 30,
          }}

          animate={{
            opacity: 1,
            x: 0,
          }}

          className="flex items-center justify-center px-6 py-16"
        >
          {/* FORM CARD */}
          <div className="w-full max-w-md bg-white/10 border border-white/10 backdrop-blur-2xl rounded-[40px] shadow-2xl p-8">

            {/* LOGO */}
            <div className="flex items-center justify-center mb-8">

              <div className="w-20 h-20 rounded-[28px] bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl">

                <Brain className="w-10 h-10 text-white" />

              </div>

            </div>

            {/* TITLE */}
            <div className="text-center mb-10">

              <h1 className="text-4xl font-extrabold">
                {isLogin
                  ? "Welcome Back"
                  : "Create Account"}
              </h1>

              <p className="text-gray-300 mt-4 leading-7">
                {isLogin
                  ? "Login to continue your AI learning journey."
                  : "Start your AI-powered learning experience today."}
              </p>

            </div>

            {/* FORM */}
            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-6"
            >
              {/* NAME */}
              {!isLogin && (
                <div>

                  <label className="text-sm text-gray-300">
                    Full Name
                  </label>

                  <div className="relative mt-2">

                    <User className="absolute left-4 top-4 text-gray-400 w-5 h-5" />

                    <input
                      type="text"

                      name="name"

                      required={
                        !isLogin
                      }

                      value={
                        formData.name
                      }

                      onChange={
                        handleChange
                      }

                      placeholder="Enter full name"

                      className="w-full bg-black/30 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                  </div>

                </div>
              )}

              {/* EMAIL */}
              <div>

                <label className="text-sm text-gray-300">
                  Email
                </label>

                <div className="relative mt-2">

                  <Mail className="absolute left-4 top-4 text-gray-400 w-5 h-5" />

                  <input
                    type="email"

                    name="email"

                    required

                    value={
                      formData.email
                    }

                    onChange={
                      handleChange
                    }

                    placeholder="Enter email"

                    className="w-full bg-black/30 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                </div>

              </div>

              {/* PASSWORD */}
              <div>

                <label className="text-sm text-gray-300">
                  Password
                </label>

                <div className="relative mt-2">

                  <Lock className="absolute left-4 top-4 text-gray-400 w-5 h-5" />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }

                    name="password"

                    required

                    value={
                      formData.password
                    }

                    onChange={
                      handleChange
                    }

                    placeholder="Enter password"

                    className="w-full bg-black/30 border border-white/10 rounded-2xl pl-12 pr-14 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <button
                    type="button"

                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }

                    className="absolute right-4 top-4"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                </div>

              </div>

              {/* ROLE */}
              {!isLogin && (
                <div>

                  <label className="text-sm text-gray-300">
                    Select Role
                  </label>

                  <select
                    name="role"

                    value={
                      formData.role
                    }

                    onChange={
                      handleChange
                    }

                    className="w-full mt-2 bg-black/30 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none"
                  >
                    <option
                      value="student"
                      className="text-black"
                    >
                      Student
                    </option>

                    <option
                      value="developer"
                      className="text-black"
                    >
                      Developer
                    </option>

                    <option
                      value="job_seeker"
                      className="text-black"
                    >
                      Job Seeker
                    </option>

                  </select>

                </div>
              )}

              {/* BUTTON */}
              <button
                type="submit"

                disabled={
                  loading
                }

                className="w-full bg-blue-600 hover:bg-blue-700 transition-all py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-2xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />

                    Please wait...
                  </>
                ) : (
                  <>
                    {isLogin
                      ? "Login"
                      : "Create Account"}
                  </>
                )}
              </button>

              {/* TOGGLE */}
              <div className="text-center text-sm text-gray-300">

                {isLogin ? (
                  <>
                    Don’t have an account?{" "}

                    <button
                      type="button"

                      onClick={() =>
                        setIsLogin(
                          false
                        )
                      }

                      className="text-blue-400 font-semibold"
                    >
                      Register
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}

                    <button
                      type="button"

                      onClick={() =>
                        setIsLogin(
                          true
                        )
                      }

                      className="text-blue-400 font-semibold"
                    >
                      Login
                    </button>
                  </>
                )}

              </div>

              {/* HOME */}
              <div className="text-center">

                <Link
                  href="/"

                  className="text-sm text-gray-400 hover:text-white"
                >
                  Back to Home
                </Link>

              </div>

            </form>

          </div>

        </motion.div>

      </div>

    </div>
  );
}