import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'
import { LucideClipboardList, LucideWrench, LucideCheckCircle2, LucideAlertCircle, LucideSearch, LucideEye, LucidePrinter, LucidePlus, LucideX, LucideClock, LucideUser, LucideSmartphone, LucideCreditCard, LucideHistory, LucideCheck, LucidePlusCircle, LucideMinusCircle, LucideAlertTriangle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useMutation, useAction } from 'convex/react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const Route = createFileRoute('/')({
  component: Dashboard,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      ticket: (search.ticket as string) || undefined,
    }
  },
})

function Dashboard() {
  const { data: stats } = useSuspenseQuery(convexQuery(api.repairs.getStats, {}))
  const { data: recentOrders } = useSuspenseQuery(convexQuery(api.repairs.listRecentOrders, { limit: 10 }))
  const [search, setSearch] = useState('')
  const { ticket: selectedTicketId } = useSearch({ from: '/' })
  const navigate = useNavigate()
  const generateWorkOrderAction = useAction(api.pdf.generateWorkOrder)
  const [isPrintingRow, setIsPrintingRow] = useState<string | null>(null)

  const handleRowClick = (id: string) => {
    navigate({ to: '/', search: { ticket: id } })
  }

  const closeDrawer = () => {
    navigate({ to: '/', search: { ticket: undefined } })
  }

  const statusColors: Record<string, string> = {
    intake: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    diagnosing: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    in_repair: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    waiting_parts: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    completed: 'bg-green-500/20 text-green-400 border-green-500/50',
    picked_up: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/50',
  }

  const statCards = [
    { label: 'Open', value: stats.open, icon: <LucideClipboardList size={24} />, color: 'text-blue-400' },
    { label: 'In Progress', value: stats.inProgress, icon: <LucideWrench size={24} />, color: 'text-orange-400' },
    { label: 'Completed Today', value: stats.completedToday, icon: <LucideCheckCircle2 size={24} />, color: 'text-green-400' },
    { label: 'Overdue', value: stats.overdue, icon: <LucideAlertCircle size={24} />, color: 'text-red-400' },
  ]

  const filteredOrders = recentOrders.filter(order => 
    order.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
    order.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    order.device_model?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 relative min-h-full">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div
            key={stat.label}
            className="card animate-in fade-in zoom-in duration-500 fill-mode-both"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className={`${stat.color} bg-white/5 p-3 rounded-lg`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Repairs Table */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="text-xl font-bold">Recent Repairs</h3>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 md:w-64">
              <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ticket, customer..."
                className="input w-full pl-10 h-10 text-sm"
              />
            </div>
            <button 
              onClick={() => navigate({ to: '/new-repair' })}
              className="btn-primary flex items-center gap-2 h-10 text-sm whitespace-nowrap"
            >
              <LucidePlus size={18} /> New Ticket
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-700/50 text-gray-400 text-sm font-medium">
                <th className="py-4 px-4">Ticket</th>
                <th className="py-4 px-4">Customer</th>
                <th className="py-4 px-4">Device</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Technician</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                <tr 
                  key={order._id} 
                  className={cn(
                    "hover:bg-white/5 transition-colors group cursor-pointer",
                    selectedTicketId === order._id ? "bg-primary/5" : ""
                  )}
                  onClick={() => handleRowClick(order._id)}
                >
                  <td className="py-4 px-4">
                    <span className="font-mono font-bold text-primary">{order.ticket_number}</span>
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-semibold">{order.customer_name}</p>
                    <p className="text-xs text-gray-500">{order.customer_phone}</p>
                  </td>
                  <td className="py-4 px-4">
                    <p>{order.device_brand} {order.device_model}</p>
                    <p className="text-xs text-gray-500 capitalize">{order.device_type}</p>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${statusColors[order.status] || ''}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-400">
                    {order.created_by_name}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        title="View Details" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(order._id);
                        }}
                        className="p-2 hover:bg-secondary/20 rounded-lg text-secondary transition-colors active:scale-90"
                      >
                        <LucideEye size={18} />
                      </button>
                      <button 
                        title="Print Work Order" 
                        disabled={isPrintingRow === order._id}
                        onClick={async (e) => {
                          e.stopPropagation();
                          setIsPrintingRow(order._id);
                          try {
                            const base64 = await generateWorkOrderAction({ repairOrderId: order._id });
                            const blob = await fetch(`data:application/pdf;base64,${base64}`).then(r => r.blob());
                            const url = URL.createObjectURL(blob);
                            window.open(url);
                          } catch (err) {
                            console.error(err);
                            alert('Failed to generate PDF');
                          } finally {
                            setIsPrintingRow(null);
                          }
                        }}
                        className="p-2 hover:bg-gray-700/50 rounded-lg text-gray-400 transition-colors active:scale-90 disabled:opacity-50"
                      >
                        {isPrintingRow === order._id ? <LucideClock className="animate-spin" size={18} /> : <LucidePrint size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    No repairs found. Create one to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Repair Details Drawer */}
      <AnimatePresence>
        {selectedTicketId && (
          <RepairDetailsDrawer id={selectedTicketId as any} onClose={closeDrawer} />
        )}
      </AnimatePresence>
    </div>
  )
}

function RepairDetailsDrawer({ id, onClose }: { id: any, onClose: () => void }) {
  const { data: repair } = useSuspenseQuery(convexQuery(api.repairs.getRepairDetails, { id }))
  const updateStatus = useMutation(api.repairs.updateRepairStatus)
  const generateWorkOrder = useAction(api.pdf.generateWorkOrder)
  const [isPrinting, setIsPrinting] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)

  const statusOptions = [
    { value: 'intake', label: 'Intake', color: 'bg-blue-500' },
    { value: 'diagnosing', label: 'Diagnosing', color: 'bg-purple-500' },
    { value: 'in_repair', label: 'In Repair', color: 'bg-orange-500' },
    { value: 'waiting_parts', label: 'Waiting Parts', color: 'bg-yellow-500' },
    { value: 'completed', label: 'Completed', color: 'bg-green-500' },
    { value: 'picked_up', label: 'Picked Up', color: 'bg-gray-500' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
  ]

  const handlePrintWorkOrder = async () => {
    setIsPrinting(true)
    try {
      const base64 = await generateWorkOrder({ repairOrderId: id })
      const blob = await fetch(`data:application/pdf;base64,${base64}`).then(r => r.blob())
      const url = URL.createObjectURL(blob)
      window.open(url)
    } catch (err) {
      console.error(err)
      alert('Failed to generate PDF')
    } finally {
      setIsPrinting(false)
    }
  }

  if (!repair) return null

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      ></div>
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-screen w-full max-w-2xl bg-background-paper border-l border-gray-700 shadow-2xl z-50 overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-background-paper/80 backdrop-blur-md border-b border-gray-700/50 p-6 flex items-center justify-between z-10">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Repair Ticket</span>
            <h2 className="text-2xl font-bold text-primary flex items-center gap-3">
              {repair.ticket_number}
              <span className="h-2 w-2 bg-primary rounded-full animate-pulse"></span>
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrintWorkOrder}
              disabled={isPrinting}
              className="p-2 hover:bg-gray-700/50 rounded-xl text-gray-400 transition-all active:scale-95"
            >
              {isPrinting ? <LucideClock className="animate-spin" size={24} /> : <LucidePrint size={24} />}
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-700/50 rounded-xl text-gray-400 transition-all active:scale-95"
            >
              <LucideX size={24} />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-10 pb-32">
          {/* Status Selection */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2">
              <LucideHistory size={16} /> Current Status
            </h4>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateStatus({ id, status: opt.value })}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-bold border transition-all",
                    repair.status === opt.value 
                      ? `${opt.color} border-transparent text-white shadow-lg` 
                      : "border-gray-700 text-gray-500 hover:border-gray-500"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Customer Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2">
                <LucideUser size={16} /> Customer
              </h4>
              <div className="bg-background-default/50 p-5 rounded-2xl border border-gray-700/30">
                <p className="font-bold text-lg">{repair.customer.name}</p>
                <p className="text-primary font-medium">{repair.customer.phone}</p>
                <p className="text-sm text-gray-400">{repair.customer.email || 'No email provided'}</p>
                <p className="text-sm text-gray-400 mt-2 italic">{repair.customer.address}</p>
              </div>
            </div>

            {/* Device Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2">
                <LucideSmartphone size={16} /> Device
              </h4>
              <div className="bg-background-default/50 p-5 rounded-2xl border border-gray-700/30">
                <p className="font-bold text-lg">{repair.device.brand} {repair.device.model}</p>
                <p className="text-secondary font-medium">{repair.device.device_type}</p>
                <p className="text-xs text-gray-500 mt-1">SN: {repair.device.serial_number || 'N/A'}</p>
                <div className="mt-4 pt-4 border-t border-gray-700/30">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Accessories</p>
                  <p className="text-sm">{repair.device.accessories_left.join(', ') || 'None'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Issue & Diagnosis */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2">
              <LucideAlertCircle size={16} /> Repair Request
            </h4>
            <div className="bg-background-default/50 p-5 rounded-2xl border border-gray-700/30">
              <p className="text-xs text-gray-500 uppercase font-bold mb-2 text-error">Reported Problem</p>
              <p className="text-gray-200 mb-4">{repair.device.reported_issue}</p>
              
              <p className="text-xs text-gray-500 uppercase font-bold mb-2">Condition Notes</p>
              <p className="text-gray-400 text-sm italic">{repair.device.condition_notes || 'No physical damage reported.'}</p>
            </div>
          </div>

          {/* Financials / Deposit */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2">
              <LucideCreditCard size={16} /> Billing & Deposit
            </h4>
            <div className="bg-background-default/50 p-5 rounded-2xl border border-gray-700/30 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Deposit Paid</p>
                <p className="text-2xl font-bold text-success">${(repair.details?.deposit_amount / 100).toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Method</p>
                <p className="font-bold">{repair.details?.deposit_method || 'Cash'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 w-full bg-background-paper p-6 border-t border-gray-700 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] flex items-center justify-center">
          <button 
            onClick={() => setShowCompleteModal(true)}
            className="btn-primary w-full max-w-sm flex items-center justify-center gap-3 py-4 text-lg"
          >
            <LucideCheckCircle2 size={24} /> Complete & Bill Repair
          </button>
        </div>
      </motion.aside>

      <AnimatePresence>
        {showCompleteModal && (
          <CompletionModal 
            repair={repair} 
            onClose={() => setShowCompleteModal(false)} 
            onSuccess={() => {
              setShowCompleteModal(false)
              onClose()
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}

function CompletionModal({ repair, onClose, onSuccess }: { repair: any, onClose: () => void, onSuccess: () => void }) {
  const completeRepair = useMutation(api.repairs.completeRepair)
  const [formData, setFormData] = useState({
    diagnosis: '',
    work_performed: '',
    parts: [] as { name: string, qty: number, unit_cost: number }[],
    labor_hours: 1,
    labor_rate: 60,
    warranty_days: 30,
    technician_notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addPart = () => setFormData(prev => ({ ...prev, parts: [...prev.parts, { name: '', qty: 1, unit_cost: 0 }] }))
  const removePart = (i: number) => setFormData(prev => ({ ...prev, parts: prev.parts.filter((_, idx) => idx !== i) }))
  const updatePart = (i: number, f: string, v: any) => setFormData(prev => {
    const next = [...prev.parts]
    next[i] = { ...next[i], [f]: v }
    return { ...prev, parts: next }
  })

  const partsSubtotal = formData.parts.reduce((acc, p) => acc + (p.qty * p.unit_cost), 0)
  const laborSubtotal = formData.labor_hours * formData.labor_rate
  const total = partsSubtotal + laborSubtotal
  const deposit = repair.details?.deposit_amount / 100
  const balance = total - deposit

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await completeRepair({
        id: repair._id,
        diagnosis: formData.diagnosis,
        work_performed: formData.work_performed,
        parts_used: formData.parts.map(p => ({ ...p, unit_cost: Math.round(p.unit_cost * 100) })),
        labor_hours: formData.labor_hours,
        parts_cost: Math.round(partsSubtotal * 100),
        labor_cost: Math.round(laborSubtotal * 100),
        total_cost: Math.round(total * 100),
        warranty_days: formData.warranty_days,
        technician_notes: formData.technician_notes
      })
      onSuccess()
    } catch (err) {
      console.error(err)
      alert('Failed to complete repair')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-background-paper w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden border border-gray-700 flex flex-col"
      >
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-2xl font-bold flex items-center gap-3">
            <LucideCheckCircle2 className="text-success" size={28} /> Finalize Repair Order
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-700/50 rounded-xl transition-colors"><LucideX size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          {/* Work Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 uppercase">Final Diagnosis</label>
              <textarea 
                value={formData.diagnosis}
                onChange={e => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                className="input w-full min-h-[100px]" 
                placeholder="What was actually wrong with the device?"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 uppercase">Work Performed</label>
              <textarea 
                value={formData.work_performed}
                onChange={e => setFormData(prev => ({ ...prev, work_performed: e.target.value }))}
                className="input w-full min-h-[100px]" 
                placeholder="What steps did you take to fix it?"
              />
            </div>
          </div>

          {/* Parts Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-400 uppercase">Parts Used</label>
              <button onClick={addPart} className="text-secondary text-sm font-bold flex items-center gap-1 hover:underline">
                <LucidePlusCircle size={16} /> Add Part
              </button>
            </div>
            <div className="space-y-3">
              {formData.parts.map((part, i) => (
                <div key={i} className="flex gap-4 items-end animate-in slide-in-from-left-2 duration-300">
                  <div className="flex-1 space-y-1">
                    <input 
                      value={part.name}
                      onChange={e => updatePart(i, 'name', e.target.value)}
                      className="input w-full text-sm" 
                      placeholder="Part Name (e.g. iPhone 13 Screen)" 
                    />
                  </div>
                  <div className="w-20 space-y-1">
                    <input 
                      type="number"
                      value={part.qty}
                      onChange={e => updatePart(i, 'qty', parseInt(e.target.value))}
                      className="input w-full text-sm text-center" 
                      placeholder="Qty" 
                    />
                  </div>
                  <div className="w-32 space-y-1">
                    <input 
                      type="number"
                      value={part.unit_cost}
                      onChange={e => updatePart(i, 'unit_cost', parseFloat(e.target.value))}
                      className="input w-full text-sm" 
                      placeholder="Cost $" 
                    />
                  </div>
                  <button onClick={() => removePart(i)} className="p-2.5 text-error hover:bg-error/10 rounded-lg transition-colors">
                    <LucideMinusCircle size={20} />
                  </button>
                </div>
              ))}
              {formData.parts.length === 0 && <p className="text-sm text-gray-500 italic">No parts added to this repair.</p>}
            </div>
          </div>

          {/* Labor & Warranty */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 uppercase">Labor Hours</label>
              <input 
                type="number"
                value={formData.labor_hours}
                onChange={e => setFormData(prev => ({ ...prev, labor_hours: parseFloat(e.target.value) }))}
                className="input w-full" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 uppercase">Hourly Rate ($)</label>
              <input 
                type="number"
                value={formData.labor_rate}
                onChange={e => setFormData(prev => ({ ...prev, labor_rate: parseFloat(e.target.value) }))}
                className="input w-full" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 uppercase">Warranty (Days)</label>
              <select 
                value={formData.warranty_days}
                onChange={e => setFormData(prev => ({ ...prev, warranty_days: parseInt(e.target.value) }))}
                className="input w-full"
              >
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
                <option value={365}>1 Year</option>
                <option value={0}>No Warranty</option>
              </select>
            </div>
          </div>

          {/* Financial Summary Alert */}
          <div className={cn(
            "p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-6",
            balance <= 0 ? "bg-success/10 border-success/30" : "bg-warning/10 border-warning/30"
          )}>
            <div className="flex items-start gap-4">
              <div className={cn("p-3 rounded-xl", balance <= 0 ? "bg-success/20 text-success" : "bg-warning/20 text-warning")}>
                {balance <= 0 ? <LucideCheck size={28} /> : <LucideAlertTriangle size={28} />}
              </div>
              <div>
                <h4 className="font-bold text-lg">Financial Summary</h4>
                <p className="text-sm opacity-70">
                  Total: ${total.toFixed(2)} | Deposit: ${deposit.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase font-bold opacity-60 mb-1">Balance Due</p>
              <p className={cn("text-4xl font-black", balance <= 0 ? "text-success" : "text-primary")}>
                ${Math.abs(balance).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-background-default/50 border-t border-gray-700 flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-3 font-bold text-gray-400 hover:text-white transition-colors">Cancel</button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-primary px-10 py-3 text-lg flex items-center gap-2"
          >
            {isSubmitting ? <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <><LucideCheckCircle2 size={20} /> Finalize & Complete</>}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
