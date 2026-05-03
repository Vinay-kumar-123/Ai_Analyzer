"use client";

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { ArrowRight, Play, FileAudio, Brain, Target, Users } from 'lucide-react';


export default function HomeSection() {
  const { user } = useAuth();
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Universal Content Analyzer
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Transform YouTube videos and audio files into actionable insights.
              Learn, execute, and build with AI-powered analysis.
            </p>

            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            )}
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <Play className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">YouTube Analysis</h3>
              <p className="text-gray-600">
                Extract insights from any YouTube video with AI-powered
                transcription and analysis.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <FileAudio className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Audio Processing</h3>
              <p className="text-gray-600">
                Upload audio/video files and get detailed transcripts and
                structured notes.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <Brain className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                AI-Powered Insights
              </h3>
              <p className="text-gray-600">
                Get TL;DR summaries, action steps, project ideas, and more
                tailored to your goals.
              </p>
            </div>
          </div>

          {/* Goal-Based Analysis */}
          <div className="bg-white p-8 rounded-lg shadow-md mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">
              Choose Your Path
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 border rounded-lg hover:shadow-md transition-shadow">
                <Users className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                <h3 className="text-xl font-semibold mb-2">Student</h3>
                <p className="text-gray-600">
                  Simple explanations, structured notes, and clear learning
                  paths.
                </p>
              </div>

              <div className="text-center p-6 border rounded-lg hover:shadow-md transition-shadow">
                <Target className="h-10 w-10 text-green-600 mx-auto mb-3" />
                <h3 className="text-xl font-semibold mb-2">Developer</h3>
                <p className="text-gray-600">
                  Technical details, code examples, and implementation guides.
                </p>
              </div>

              <div className="text-center p-6 border rounded-lg hover:shadow-md transition-shadow">
                <Brain className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                <h3 className="text-xl font-semibold mb-2">Job Seeker</h3>
                <p className="text-gray-600">
                  Interview prep, resume points, and career-focused insights.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-gray-600 mb-8">
              Join thousands of users who are learning smarter, not harder.
            </p>

            {!user && (
              <div className="space-x-4">
                <Link
                  href="/login"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Free Trial
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center px-6 py-3 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                >
                  View Pricing
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
