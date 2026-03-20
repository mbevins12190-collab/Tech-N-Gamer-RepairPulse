import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { LucideSearch, LucideSmartphone, LucideCheckCircle2, LucideClock, LucideAlertCircle, LucideShieldCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const Route = createFileRoute('/status')({
  component: CustomerPortal,
})

function CustomerPortal() {
  const [ticketNumber, setTicketNumber] = useState('')
  const [phoneLast4, setPhoneLast4] = useState('')
  const [searchParams, setSearchParams] = useState<{ ticket: string, phone: string } | null>(null)

  const repair = useQuery(api.repairs.getPublicRepairStatus, 
    searchParams ? { ticketNumber: searchParams.ticket, phoneLast4: searchParams.phone } : "skip"
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams({ ticket: ticketNumber.trim(), phone: phoneLast4.trim() })
  }

  const statusMap: Record<string, { label: string, color: string, icon: any, desc: string }> = {
    intake: { label: 'Received', color: 'text-blue-400', icon: <LucideClock />, desc: 'We have received your device and it is in queue for diagnosis.' },
    diagnosing: { label: 'Diagnosing', color: 'text-purple-400', icon: <LucideSearch />, desc: 'A technician is currently inspecting your device to identify the issue.' },
    in_repair: { label: 'In Repair', color: 'text-orange-400', icon: <LucideSmartphone />, desc: 'Diagnosis is complete and we are currently performing the repair.' },
    waiting_parts: { label: 'Waiting for Parts', color: 'text-yellow-400', icon: <LucideClock />, desc: 'Parts have been ordered and we are waiting for them to arrive.' },
    completed: { label: 'Ready for Pickup', color: 'text-green-400', icon: <LucideCheckCircle2 />, desc: 'Great news! Your repair is finished and ready to be picked up.' },
    picked_up: { label: 'Picked Up', color: 'text-gray-400', icon: <LucideShieldCheck />, desc: 'This device has been collected by the owner.' },
    cancelled: { label: 'Cancelled', color: 'text-red-400', icon: <LucideAlertCircle />, desc: 'This repair order has been cancelled.' },
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-primary mb-3">Customer Repair Portal</h1>
        <p className="text-gray-400">Enter your ticket details below to track your repair in real-time.</p>
      </div>

      {!searchParams || repair === null ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card max-w-md mx-auto"
        >
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 uppercase">Ticket Number</label>
              <input 
                value={ticketNumber}
                onChange={e => setTicketNumber(e.target.value)}
                placeholder="RO-2024-00001"
                className="input w-full h-12 text-lg font-mono uppercase"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 uppercase">Last 4 Digits of Phone</label>
              <input 
                value={phoneLast4}
                onChange={e => setPhoneLast4(e.target.value)}
                placeholder="1234"
                maxLength={4}
                className="input w-full h-12 text-lg"
                required
              />
            </div>
            {searchParams && repair === null && (
              <p className="text-error text-sm text-center">Ticket not found or phone number incorrect.</p>
            )}
            <button type="submit" className="btn-primary w-full py-4 text-lg">
              Track Repair
            </button>
          </form>
        </motion.div>
      ) : repair === undefined ? (
        <div className="flex justify-center py-20">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8"
        >
          {/* Status Hero */}
          <div className="card border-primary/20 bg-primary/5 text-center py-10">
            <div className={cn("inline-flex p-4 rounded-2xl bg-background-default border border-gray-700 mb-6", statusMap[repair.status]?.color)}>
              {statusMap[repair.status]?.icon && <div className="scale-150">{statusMap[repair.status].icon}</div>}
            </div>
            <h2 className="text-3xl font-bold mb-2">{statusMap[repair.status]?.label}</h2>
            <p className="text-gray-400 max-w-md mx-auto">{statusMap[repair.status]?.desc}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Device Details */}
            <div className="card space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2 border-b border-gray-700/50 pb-4">
                <LucideSmartphone className="text-secondary" /> Device Information
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Device</p>
                  <p className="text-lg font-bold">{repair.device_brand} {repair.device_model}</p>
                  <p className="text-sm text-gray-400">{repair.device_type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Ticket Number</p>
                  <p className="font-mono text-primary">{repair.ticket_number}</p>
                </div>
                {repair.estimated_completion_at && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Est. Completion</p>
                    <p className="font-bold text-secondary">{new Date(repair.estimated_completion_at).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Financials */}
            <div className="card space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2 border-b border-gray-700/50 pb-4">
                <LucideCheckCircle2 className="text-success" /> Payment Summary
              </h3>
              <div className="space-y-4">
                {repair.status === 'completed' && repair.work_performed && (
                  <div className="bg-background-default p-4 rounded-xl border border-gray-700/30">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Work Performed</p>
                    <p className="text-sm text-gray-300 italic">{repair.work_performed}</p>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-2">
                  <p className="text-gray-400 font-medium">Total Estimate</p>
                  <p className="font-bold">${((repair.total_cost || 0) / 100).toFixed(2)}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-400 font-medium">Deposit Paid</p>
                  <p className="text-success font-bold">-${((repair.deposit_amount || 0) / 100).toFixed(2)}</p>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-700/50">
                  <p className="text-lg font-bold">Balance Due</p>
                  <p className="text-2xl font-black text-primary">
                    ${(((repair.total_cost || 0) - (repair.deposit_amount || 0)) / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button 
              onClick={() => setSearchParams(null)}
              className="text-gray-500 hover:text-white transition-colors flex items-center gap-2 mx-auto"
            >
              <LucideSearch size={16} /> Track another repair
            </button>
          </div>
        </motion.div>
      )}

      <footer className="mt-20 text-center text-gray-600 text-sm">
        <p>&copy; {new Date().getFullYear()} Tech-N-Gamer Electronics Repair. All rights reserved.</p>
      </footer>
    </div>
  )
}
