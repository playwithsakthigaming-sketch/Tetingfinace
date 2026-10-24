/**
 * Sri Sennamal Finance — 24 Automated Financial & Security Tests Runner
 * Executes and verifies all 24 required business rules, idempotency,
 * and security constraints.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  RotateCw,
  Filter,
  Check,
} from 'lucide-react';
import { runAllAutomatedTests, TestResult } from '../services/automatedTests';

export const AutomatedTestsView: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const executeTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runAllAutomatedTests();
      setResults(res);
      setIsRunning(false);
    }, 400);
  };

  useEffect(() => {
    executeTests();
  }, []);

  const totalPassed = results.filter((r) => r.status === 'passed').length;
  const totalFailed = results.filter((r) => r.status === 'failed').length;

  const categories = ['all', 'Rule', 'Payment', 'SP', 'Refund', 'Security', 'Passbook', 'Persistence', 'Receipt'];

  const filteredResults = results.filter((r) => {
    if (filterCategory === 'all') return true;
    return r.category === filterCategory;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl neon-card">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white font-display">
              Automated Business & Security Verification Suite
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            24 exhaustive automated test suites covering Wednesday ₹150 late penalties, SP loan principal cessation, passbook isolation, and RLS security.
          </p>
        </div>

        <button
          onClick={executeTests}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 font-bold text-xs text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all whitespace-nowrap self-start sm:self-auto"
        >
          <Play className="w-3.5 h-3.5 fill-black" />
          {isRunning ? 'Executing Tests...' : 'Re-Run All 24 Tests'}
        </button>
      </div>

      {/* Aggregate Scoreboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Test Cases</span>
            <span className="text-2xl font-bold text-white font-tabular">{results.length} / 24</span>
          </div>
          <ShieldCheck className="w-8 h-8 text-cyan-400/50" />
        </div>

        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-semibold">Passed Checks</span>
            <span className="text-2xl font-bold text-emerald-300 font-tabular">{totalPassed} Passed</span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-400/50" />
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Failed Checks</span>
            <span className={`text-2xl font-bold font-tabular ${totalFailed > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {totalFailed} Failed
            </span>
          </div>
          <XCircle className={`w-8 h-8 ${totalFailed > 0 ? 'text-rose-400/50' : 'text-slate-700'}`} />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              filterCategory === cat
                ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-semibold'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            {cat === 'all' ? 'All (24 Tests)' : cat}
          </button>
        ))}
      </div>

      {/* Test Results Table */}
      <div className="rounded-2xl neon-card p-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Test Scenario</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Verification Assertion</th>
                <th className="py-2.5 px-3 text-right">Time</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-tabular">
              {filteredResults.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-mono text-cyan-400 font-bold">
                    {String(t.id).padStart(2, '0')}
                  </td>
                  <td className="py-3 px-3 font-semibold text-white">
                    {t.name}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      {t.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300 text-[11px]">
                    {t.message}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-500 font-mono text-[10px]">
                    {t.executionTimeMs}ms
                  </td>
                  <td className="py-3 px-3 text-center">
                    {t.status === 'passed' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                        <Check className="w-3 h-3" /> PASS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/60 text-rose-400 border border-rose-500/30">
                        FAIL
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
