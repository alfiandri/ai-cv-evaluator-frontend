"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

/**
 * ✨ Evaluation Page (Glass Style with Progress Bar)
 * Next.js 14 + TypeScript + Tailwind CSS + Framer Motion
 *
 * Features:
 *  - Glassmorphism UI matching login page
 *  - Upload CV & Project Report files
 *  - Evaluate with Job Description & Study Case Brief
 *  - Polls backend for results (handles 404 gracefully)
 *  - Animated gradient progress bar while waiting
 */

interface UploadResponse {
  cv_file_id: string;
  project_file_id: string;
}

interface EvaluateResponse {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
}

interface ResultResponse {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  result?: {
    cv_match_rate: number;
    cv_feedback: string;
    project_score: number;
    project_feedback: string;
    overall_summary: string;
  };
  error?: string;
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (res.status === 404) throw new Error("404"); // handle as retryable
  const text = await res.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch {}
  if (!res.ok) throw new Error(data?.error || res.statusText || "Request failed");
  return data as T;
}

export default function EvaluationPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const [token, setToken] = useState<string>("");
  const [tenantId, setTenantId] = useState<string>("");

  const [cv, setCv] = useState<File | null>(null);
  const [project, setProject] = useState<File | null>(null);
  const [cvId, setCvId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");

  const [jobDesc, setJobDesc] = useState<string>("");
  const [brief, setBrief] = useState<string>("");
  const [status, setStatus] = useState<ResultResponse["status"] | "idle">("idle");
  const [result, setResult] = useState<ResultResponse["result"] | null>(null);
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const t = localStorage.getItem("authToken") || "";
    const tid = localStorage.getItem("tenantId") || "";
    if (!t || !tid) router.push("/");
    setToken(t);
    setTenantId(tid);
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("tenantId");
    router.push("/");
  }

  async function handleUpload() {
    if (!cv || !project) return setError("Select both CV and Project files");
    setError("");
    const form = new FormData();
    form.append("cv", cv);
    form.append("project_report", project);

    const res = await fetchJSON<UploadResponse>(`${apiBase}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
      },
      body: form,
    });

    setCvId(res.cv_file_id);
    setProjectId(res.project_file_id);
  }

  async function handleEvaluate() {
    setError("");
    setStatus("queued");
    setResult(null);
    setProgress(0);

    try {
      const res = await fetchJSON<EvaluateResponse>(`${apiBase}/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenantId,
        },
        body: JSON.stringify({
          cv_file_id: cvId,
          project_file_id: projectId,
          job_description: jobDesc,
          study_case_brief: brief,
        }),
      });

      pollResult(res.id);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function pollResult(id: string) {
    let progressValue = 0;
    const maxWait = 90000; // 90s timeout
    const startTime = Date.now();

    const interval = setInterval(async () => {
      try {
        const res = await fetchJSON<ResultResponse>(`${apiBase}/result/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
          },
        });

        setStatus(res.status);
        if (res.status === "completed") {
          setResult(res.result!);
          setProgress(100);
          clearInterval(interval);
        } else if (res.status === "failed") {
          setError(res.error || "Evaluation failed");
          clearInterval(interval);
        } else {
          // Gradually increase progress bar until 95%
          progressValue = Math.min(progressValue + Math.random() * 8, 95);
          setProgress(progressValue);
        }
      } catch (err: any) {
        if (err.message === "404") {
          // Graceful retry when result not ready yet
          progressValue = Math.min(progressValue + Math.random() * 5, 85);
          setProgress(progressValue);
        } else {
          setError(err.message);
          clearInterval(interval);
        }
      }

      if (Date.now() - startTime > maxWait) {
        setError("Evaluation timed out. Please try again later.");
        clearInterval(interval);
      }
    }, 2500);
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-500 to-sky-400">
      {/* Animated gradient background */}
      <div className="absolute w-[600px] h-[600px] bg-blue-300/20 rounded-full blur-3xl top-[-100px] left-[-100px] animate-pulse"></div>
      <div className="absolute w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-3xl bottom-[-100px] right-[-100px] animate-pulse"></div>

      {/* Logout Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleLogout}
        className="absolute top-6 right-6 text-sm font-semibold bg-white/20 backdrop-blur-lg border border-white/30 text-white px-4 py-1.5 rounded-xl hover:bg-white/30 transition"
      >
        Logout
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 w-full max-w-3xl backdrop-blur-xl bg-white/20 border border-white/30 shadow-2xl rounded-2xl p-8 text-white"
      >
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold drop-shadow-md">Evaluation Dashboard</h1>
          <p className="text-sm text-blue-100 mt-2">Upload, Evaluate, and Get Insights</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* File Upload Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-1">CV File</label>
              <input type="file" onChange={(e) => setCv(e.target.files?.[0] || null)} className="w-full text-sm bg-white/10 rounded-lg px-2 py-1 file:bg-sky-500 file:text-white file:rounded-lg file:border-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-1">Project Report</label>
              <input type="file" onChange={(e) => setProject(e.target.files?.[0] || null)} className="w-full text-sm bg-white/10 rounded-lg px-2 py-1 file:bg-sky-500 file:text-white file:rounded-lg file:border-none" />
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleUpload}
              disabled={!cv || !project}
              className="w-full py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500 rounded-xl shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-50"
            >
              Upload Files
            </motion.button>
          </div>

          {/* Evaluation Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-1">Job Description</label>
              <textarea rows={3} value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} className="w-full text-sm bg-white/20 border border-white/30 rounded-lg p-2 text-white placeholder-blue-100/60 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-1">Study Case Brief</label>
              <textarea rows={3} value={brief} onChange={(e) => setBrief(e.target.value)} className="w-full text-sm bg-white/20 border border-white/30 rounded-lg p-2 text-white placeholder-blue-100/60 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white/30" />
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleEvaluate}
              disabled={!cvId || !projectId || !jobDesc || !brief}
              className="w-full py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500 rounded-xl shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-50"
            >
              Start Evaluation
            </motion.button>
          </div>
        </div>

        {/* Status / Progress / Results */}
        <div className="mt-8">
          {status === "queued" && <p className="text-center text-blue-100 animate-pulse">Queued for evaluation...</p>}
          {status === "processing" && (
            <div className="mt-2">
              <p className="text-center text-blue-100 mb-2 animate-pulse">Processing your evaluation...</p>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 via-sky-400 to-indigo-400 animate-pulse transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          {status === "failed" && <p className="text-center text-red-200">{error}</p>}

          {status === "completed" && result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="bg-white/20 border border-white/30 p-4 rounded-xl">
                <h3 className="text-sm font-semibold text-blue-100">CV ↔ Job Match Rate</h3>
                <p className="text-3xl font-bold mt-1">{(result.cv_match_rate * 100).toFixed(0)}%</p>
                <p className="text-sm mt-2 text-blue-50 whitespace-pre-line">{result.cv_feedback}</p>
              </div>
              <div className="bg-white/20 border border-white/30 p-4 rounded-xl">
                <h3 className="text-sm font-semibold text-blue-100">Project Score</h3>
                <p className="text-3xl font-bold mt-1">{result.project_score.toFixed(1)} / 10</p>
                <p className="text-sm mt-2 text-blue-50 whitespace-pre-line">{result.project_feedback}</p>
              </div>
              <div className="md:col-span-2 bg-white/20 border border-white/30 p-4 rounded-xl">
                <h3 className="text-sm font-semibold text-blue-100">Overall Summary</h3>
                <p className="text-sm mt-2 text-blue-50 whitespace-pre-line">{result.overall_summary}</p>
              </div>
            </motion.div>
          )}
        </div>

        {error && status !== "failed" && (
          <p className="text-center text-red-200 mt-4">{error}</p>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8 text-xs text-blue-100/80"
        >
          <p>
            © {new Date().getFullYear()} Made with ❤️ by <span className="font-semibold">Alfiandri Putra Perdana, S.Kom., M.Kom.</span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}