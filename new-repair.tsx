import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { LucideUser, LucideSmartphone, LucideAlertTriangle, LucideCheckCircle, LucideSave, LucideSearch, LucideLoader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const Route = createFileRoute('/new-repair')({
  component: NewRepairPage,
})

function NewRepairPage() {
  const [formData, setFormData] = useState({
    customer: { name: '', phone: '', email: '', address: '' },
    device: { device_type: 'Smartphone', brand: '', model: '', serial_number: '', condition_notes: '', reported_issue: '', accessories_left: [] as string[] },
    order: { urgency: 'Normal' as 'Normal' | 'Rush', estimated_completion_at: '', deposit_amount: '0', deposit_method: 'Cash' },
  })
  
  const createRepair = useMutation(api.intake.createRepair)
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchPhone, setSearchPhone] = useState('')

  // Use the search query to find existing customers
  const customers = useQuery(api.intake.searchCustomers, { query: searchPhone })

  const updateFormData = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev as any)[section],
        [field]: value
      }
    }))
  }

  const handleSelectCustomer = (c: any) => {
    setFormData(prev => ({
      ...prev,
      customer: {
        name: c.name,
        phone: c.phone,
        email: c.email || '',
        address: c.address || '',
      }
    }))
    setSearchPhone('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await createRepair({
        customer: formData.customer,
        device: formData.device,
        order: {
          ...formData.order,
          deposit_amount: Math.round(parseFloat(formData.order.deposit_amount) * 100),
          estimated_completion_at: formData.order.estimated_completion_at ? new Date(formData.order.estimated_completion_at).getTime() : undefined,
        }
      })
      navigate({ to: '/' })
    } catch (err) {
      console.error(err)
      alert('Error creating repair order')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">New Repair Order</h1>
          <p className="text-gray-400">Complete the form below to intake a new device.</p>
        </div>
        <div className="flex gap-3">
          <button 
            type="button"
            onClick={() => navigate({ to: '/' })}
            className="px-6 py-2.5 rounded-lg border border-gray-700 text-gray-400 font-bold hover:bg-gray-800 transition-all"
          >
            Cancel
          </button>
          <button 
            form="repair-form"
            type="submit"
            disabled={isSubmitting}
            className="btn-primary px-8 py-2.5 flex items-center gap-2"
          >
            {isSubmitting ? <LucideLoader2 className="animate-spin" size={20} /> : <LucideSave size={20} />}
            Save & Print Order
          </button>
        </div>
      </div>

      <form id="repair-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Customer & Device */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Customer Section */}
          <section className="card space-y-6">
            <div className="flex items-center justify-between border-b border-gray-700/50 pb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <LucideUser className="text-primary" size={24} /> Customer Details
              </h3>
              <div className="relative w-64">
                <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  placeholder="Lookup by phone..."
                  className="input w-full pl-10 h-9 text-xs"
                />
                <AnimatePresence>
                  {searchPhone.length > 2 && customers && customers.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-11 left-0 w-full bg-background-paper border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                      {customers.map(c => (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => handleSelectCustomer(c)}
                          className="w-full text-left p-3 hover:bg-primary/10 border-b border-gray-700 last:border-0 transition-colors group"
                        >
                          <p className="font-bold group-hover:text-primary transition-colors">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.phone}</p>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400">Phone Number *</label>
                <input
                  value={formData.customer.phone}
                  onChange={(e) => updateFormData('customer', 'phone', e.target.value)}
                  placeholder="(555) 000-0000"
                  className="input w-full"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400">Full Name *</label>
                <input
                  value={formData.customer.name}
                  onChange={(e) => updateFormData('customer', 'name', e.target.value)}
                  placeholder="John Doe"
                  className="input w-full"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400">Email Address</label>
                <input
                  type="email"
                  value={formData.customer.email}
                  onChange={(e) => updateFormData('customer', 'email', e.target.value)}
                  placeholder="john@example.com"
                  className="input w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400">Home Address</label>
                <input
                  value={formData.customer.address}
                  onChange={(e) => updateFormData('customer', 'address', e.target.value)}
                  placeholder="123 Main St, City, State"
                  className="input w-full"
                />
              </div>
            </div>
          </section>

          {/* Device Section */}
          <section className="card space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2 border-b border-gray-700/50 pb-4">
              <LucideSmartphone className="text-secondary" size={24} /> Device Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Type</label>
                <select
                  value={formData.device.device_type}
                  onChange={(e) => updateFormData('device', 'device_type', e.target.value)}
                  className="input w-full h-11"
                >
                  {['Smartphone', 'Tablet', 'Laptop', 'Desktop', 'Gaming Console', 'Smartwatch', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Brand *</label>
                <input
                  value={formData.device.brand}
                  onChange={(e) => updateFormData('device', 'brand', e.target.value)}
                  placeholder="Apple"
                  className="input w-full"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Model *</label>
                <input
                  value={formData.device.model}
                  onChange={(e) => updateFormData('device', 'model', e.target.value)}
                  placeholder="iPhone 15 Pro"
                  className="input w-full"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Serial / IMEI</label>
                <input
                  value={formData.device.serial_number}
                  onChange={(e) => updateFormData('device', 'serial_number', e.target.value)}
                  placeholder="SN: 123456789"
                  className="input w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Accessories Left with Device</label>
              <div className="flex flex-wrap gap-2">
                {['Charger', 'Case', 'Battery', 'Stylus', 'SIM Card', 'SD Card', 'Original Box'].map(acc => (
                  <button
                    key={acc}
                    type="button"
                    onClick={() => {
                      const current = formData.device.accessories_left
                      if (current.includes(acc)) {
                        updateFormData('device', 'accessories_left', current.filter(i => i !== acc))
                      } else {
                        updateFormData('device', 'accessories_left', [...current, acc])
                      }
                    }}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-bold border transition-all",
                      formData.device.accessories_left.includes(acc) 
                        ? "bg-secondary/20 border-secondary text-secondary shadow-[0_0_10px_rgba(14,165,233,0.2)]" 
                        : "border-gray-700 text-gray-500 hover:border-gray-500"
                    )}
                  >
                    {acc}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Physical Condition Notes</label>
              <textarea
                value={formData.device.condition_notes}
                onChange={(e) => updateFormData('device', 'condition_notes', e.target.value)}
                placeholder="List any existing scratches, dents, or damage..."
                className="input w-full min-h-[80px]"
              />
            </div>
          </section>
        </div>

        {/* Right Column: Issue & Billing */}
        <div className="space-y-8">
          
          {/* Repair Request */}
          <section className="card space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2 border-b border-gray-700/50 pb-4">
              <LucideAlertTriangle className="text-error" size={24} /> Repair Request
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Reported Issue *</label>
              <textarea
                value={formData.device.reported_issue}
                onChange={(e) => updateFormData('device', 'reported_issue', e.target.value)}
                placeholder="Describe the problem in detail..."
                className="input w-full min-h-[120px]"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Urgency Level</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-background-default border border-gray-700 rounded-xl">
                {['Normal', 'Rush'].map(u => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => updateFormData('order', 'urgency', u)}
                    className={cn(
                      "py-2 rounded-lg text-sm font-bold transition-all",
                      formData.order.urgency === u 
                        ? "bg-primary text-white shadow-md shadow-primary/20" 
                        : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Estimated Completion Date</label>
              <input
                type="date"
                value={formData.order.estimated_completion_at}
                onChange={(e) => updateFormData('order', 'estimated_completion_at', e.target.value)}
                className="input w-full h-11"
              />
            </div>
          </section>

          {/* Intake Billing */}
          <section className="card bg-success/5 border-success/20 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2 border-b border-success/20 pb-4 text-success">
              <LucideCheckCircle size={24} /> Financials
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Intake Deposit ($)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.order.deposit_amount}
                    onChange={(e) => updateFormData('order', 'deposit_amount', e.target.value)}
                    className="input w-full pl-8 h-12 text-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Deposit Method</label>
                <select
                  value={formData.order.deposit_method}
                  onChange={(e) => updateFormData('order', 'deposit_method', e.target.value)}
                  className="input w-full h-11"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="Zelle">Zelle / Venmo</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="pt-4 mt-4 border-t border-success/20">
                <p className="text-xs text-gray-400 italic leading-relaxed">
                  Note: A standard diagnostic fee may apply if repair is declined.
                </p>
              </div>
            </div>
          </section>
        </div>
      </form>
    </div>
  )
}
