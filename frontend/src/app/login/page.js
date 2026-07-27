"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";
import {
  Brain,
  Sparkles,
  Rocket,
  GraduationCap,
  CheckCircle2,
  Crown,
  Loader2,
  ShieldCheck,
  Zap,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { googleLogin, login, register } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showLegacyForm, setShowLegacyForm] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      toast.error("Google authentication failed. No token received.");
      return;
    }

    setLoading(true);
    try {
      const result = await googleLogin(credentialResponse.credential);
      if (result?.success) {
        toast.success(result.message || "Successfully signed in with Google!");
        router.push("/dashboard");
      } else {
        toast.error(result?.message || "Google sign in failed");
      }
    } catch (err) {
      toast.error("Authentication error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error("Google Sign-In failed or popup was closed.");
  };

  // Legacy local auth fallback handler (kept for rollback safety during migration)
  const handleLegacySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let result;
      if (isLogin) {
        result = await login({
          email: formData.email,
          password: formData.password,
        });
      } else {
        result = await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        });
      }

      if (result?.success) {
        toast.success(result.message);
        router.push("/dashboard");
      } else {
        toast.error(result?.message || "Authentication failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#2563eb,transparent_30%)] opacity-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,#7c3aed,transparent_30%)] opacity-20" />

      <div className="relative z-10 min-h-screen grid lg:grid-cols-2">
        {/* LEFT SIDE: Hero Showcase */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:flex flex-col justify-center px-16 py-20"
        >
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/20 backdrop-blur px-5 py-2 rounded-full w-fit mb-8">
            <Sparkles size={18} className="text-blue-400" />
            <span className="text-sm font-semibold text-blue-200">
              AI Learning OS v2.0
            </span>
          </div>

          <h1 className="text-6xl font-extrabold leading-tight tracking-tight">
            Learn Faster <br />
            With <span className="text-blue-400">AI Intelligence</span>
          </h1>

          <p className="text-xl text-gray-300 mt-8 leading-9 max-w-2xl">
            Transform educational YouTube videos into high-yield study suites with
            Grounded AI Tutoring, 5-Minute Exam Revision, Smart Notes, Flashcards,
            and Roadmaps.
          </p>

          <div className="mt-12 space-y-5">
            {[
              "1-Click Google OAuth 2.0 Authentication",
              "Grounded AI Tutor with 4-Level RAG context",
              "5-Minute Exam Revision (100% In-Memory)",
              "Shared Analysis deduplication with 0 duplicate AI costs",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="text-green-400 w-5 h-5 flex-shrink-0" />
                <span className="text-gray-200 font-medium">{item}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-5 mt-14">
            {[
              { title: "Students", icon: GraduationCap },
              { title: "Developers", icon: Rocket },
              { title: "Job Seekers", icon: Crown },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="bg-white/5 border border-white/10 backdrop-blur rounded-3xl p-6 hover:border-blue-500/40 transition-all"
                >
                  <Icon className="w-10 h-10 text-blue-400" />
                  <h3 className="font-bold text-lg mt-5">{item.title}</h3>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* RIGHT SIDE: SaaS Authentication Card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-center px-6 py-16"
        >
          <div className="w-full max-w-md bg-white/10 border border-white/10 backdrop-blur-2xl rounded-[40px] shadow-2xl p-8 sm:p-10 relative">
            {/* LOGO */}
            <div className="flex items-center justify-center mb-8">
              <div className="w-20 h-20 rounded-[28px] bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl">
                <Brain className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* TITLE */}
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Welcome to AI Learning OS
              </h2>
              <p className="text-gray-300 mt-3 text-sm sm:text-base leading-relaxed">
                Sign in to access your personalized study workspace and credits.
              </p>
            </div>

            {/* WELCOME CREDITS BADGE */}
            <div className="mb-8 flex items-center justify-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>10 Free Welcome Credits for New Users</span>
            </div>

            {/* MAIN GOOGLE OAUTH CONTAINER */}
            <div className="flex flex-col items-center justify-center space-y-4">
              {loading ? (
                <div className="w-full py-4 bg-blue-600/30 border border-blue-500/40 rounded-2xl flex items-center justify-center gap-3 text-blue-200 font-semibold">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying Google account...</span>
                </div>
              ) : (
                <div className="w-full flex justify-center google-btn-container scale-105 transform hover:scale-[1.07] transition-all">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap={false}
                    theme="filled_blue"
                    shape="pill"
                    size="large"
                    text="continue_with"
                    width="320"
                  />
                </div>
              )}
            </div>

            {/* SECURITY TRUST BADGE */}
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-gray-400">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              <span>Secured by Google Identity & Enterprise JWT Encryption</span>
            </div>

            {/* LEGACY AUTH TOGGLE (Rollback Safety) */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setShowLegacyForm(!showLegacyForm)}
                className="text-xs text-gray-400 hover:text-gray-200 underline transition-colors"
              >
                {showLegacyForm
                  ? "Hide legacy login option"
                  : "Need legacy password login?"}
              </button>
            </div>

            {/* LEGACY FORM (Conditional for backward compatibility) */}
            {showLegacyForm && (
              <form
                onSubmit={handleLegacySubmit}
                className="mt-6 pt-6 border-t border-white/10 space-y-4"
              >
                <p className="text-xs text-amber-300 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-center">
                  Legacy Login (Kept for rollback verification)
                </p>

                {!isLogin && (
                  <div>
                    <label className="text-xs text-gray-300">Full Name</label>
                    <div className="relative mt-1">
                      <User className="absolute left-3.5 top-3.5 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Enter full name"
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-gray-300">Email</label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3.5 top-3.5 text-gray-400 w-4 h-4" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="Enter email"
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-300">Password</label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3.5 top-3.5 text-gray-400 w-4 h-4" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder="Enter password"
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-800 hover:bg-gray-700 py-3 rounded-xl font-semibold text-sm transition-all"
                >
                  {isLogin ? "Sign In with Legacy Password" : "Create Legacy Account"}
                </button>

                <div className="text-center text-xs text-gray-400">
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-blue-400 hover:underline"
                  >
                    {isLogin ? "Need a legacy account?" : "Already registered?"}
                  </button>
                </div>
              </form>
            )}

            {/* HOME NAVIGATION */}
            <div className="mt-8 text-center">
              <Link
                href="/"
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}