import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'
import { useState } from 'react'
import { useMutation } from 'convex/react'
import { LucideShieldCheck, LucideUsers, LucideSettings, LucideHistory, LucideSave, LucideCheckCircle, LucideXCircle, LucideAlertCircle, LucideEdit, LucideUserPlus } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const Route = createFileRoute('/admin')({
  component: AdminPage,
})

function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'audit'>('users')
  const { data: userData } = useSuspenseQuery(convexQuery(api.users.currentUserData, {}))

  if (userData?.role !== 'admin') {
    return (
      <div className="card max-w-md mx-auto py-20 text-center">
        <LucideShieldCheck size={64} className="mx-auto text-error mb-4" />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-gray-400 mt-2">You need administrator privileges to view this page.</p>
      </div>
    )
  }

  const tabs = [
    { id: 'users', label: 'Users & Permissions', icon: <LucideUsers size={20} /> },
    { id: 'settings', label: 'Shop Settings', icon: <LucideSettings size={20} /> },
    { id: 'audit', label: 'Audit Log', icon: <LucideHistory size={20} /> },
  ] as const

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Control Panel</h1>
          <p className="text-gray-400 font-medium">Manage users, shop information, and monitor system activity.</p>
        </div>
        
        <div className="flex p-1 bg-background-paper border border-gray-700/50 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                activeTab === tab.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-400 hover:text-white"
              )}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'users' && <UsersTab onAdd={() => setIsAddingUser(true)} />}
        {activeTab === 'settings' && <SettingsTab />}
        {activeTab === 'audit' && <AuditTab />}
      </div>

      <AnimatePresence>
        {isAddingUser && (
          <AddUserModal onClose={() => setIsAddingUser(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

function UsersTab({ onAdd }: { onAdd: () => void }) {
  const { data: users } = useSuspenseQuery(convexQuery(api.techs.listTechnicians, {}))

  return (
    <div className="card p-0 overflow-hidden">
      <div className="p-6 border-b border-gray-700/50 flex justify-between items-center bg-background-default/50">
        <h3 className="text-xl font-bold">Manage Personnel</h3>
        <button
          onClick={onAdd}
          className="btn-primary flex items-center gap-2 py-2 px-4"
        >
          <LucideUserPlus size={18} /> Add User
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-background-default/80 text-gray-500 text-xs font-bold uppercase tracking-widest border-b border-gray-700/50">
              <th className="py-4 px-6">User</th>
              <th className="py-4 px-6">Role</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6">Member Since</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-white/5 transition-colors group">
                <td className="py-4 px-6 flex items-center gap-4">
                  <div className="h-10 w-10 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold">
                    {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold">{user.full_name || 'Anonymous User'}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold border capitalize",
                    user.role === 'admin' ? "bg-primary/10 border-primary/50 text-primary" : "bg-secondary/10 border-secondary/50 text-secondary"
                  )}>
                    {user.role}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className={cn(
                    "flex items-center gap-1.5 text-sm font-semibold",
                    user.is_active ? "text-success" : "text-error"
                  )}>
                    {user.is_active ? <LucideCheckCircle size={14} /> : <LucideXCircle size={14} />}
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-4 px-6 text-sm text-gray-400">
                  {new Date(user._creationTime).toLocaleDateString()}
                </td>
                <td className="py-4 px-6 text-right">
                  <button className="p-2 hover:bg-gray-700/50 rounded-lg text-gray-400 transition-colors opacity-0 group-hover:opacity-100">
                    <LucideEdit size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SettingsTab() {
  const { data: settings } = useSuspenseQuery(convexQuery(api.settings.getSettings, {}))
  const updateSettings = useMutation(api.settings.updateSettings)
  const [formData, setFormData] = useState({
    shop_name: settings.shop_name || '',
    shop_phone: settings.shop_phone || '',
    shop_address: settings.shop_address || '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setStatus('idle')
    try {
      await updateSettings(formData)
      setStatus('success')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err) {
      console.error(err)
      setStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="card max-w-2xl mx-auto">
      <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
        <LucideSettings className="text-primary" size={24} /> General Shop Configuration
      </h3>
      
      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-400">Official Shop Name</label>
          <input
            value={formData.shop_name}
            onChange={(e) => setFormData(prev => ({ ...prev, shop_name: e.target.value }))}
            className="input w-full bg-background-default"
            required
            placeholder="Tech-N-Gamer Electronics"
          />
          <p className="text-xs text-gray-500">Used in PDF headers and ticket receipts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-400">Support Phone Number</label>
            <input
              value={formData.shop_phone}
              onChange={(e) => setFormData(prev => ({ ...prev, shop_phone: e.target.value }))}
              className="input w-full bg-background-default"
              required
              placeholder="(555) 000-0000"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-400">Shop Address</label>
          <textarea
            value={formData.shop_address}
            onChange={(e) => setFormData(prev => ({ ...prev, shop_address: e.target.value }))}
            className="input w-full bg-background-default min-h-[100px]"
            required
            placeholder="123 Tech Lane, Silicon Valley, CA 94025"
          />
        </div>

        <div className="pt-6 border-t border-gray-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status === 'success' && <p className="text-success text-sm flex items-center gap-1"><LucideCheckCircle size={14} /> Changes saved successfully!</p>}
            {status === 'error' && <p className="text-error text-sm flex items-center gap-1"><LucideAlertCircle size={14} /> Failed to save settings.</p>}
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary flex items-center gap-2"
          >
            {isSaving ? <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <><LucideSave size={18} /> Save Settings</>}
          </button>
        </div>
      </form>
    </div>
  )
}

function AuditTab() {
  return (
    <div className="card flex flex-col items-center justify-center py-20 text-center opacity-50">
      <LucideHistory size={64} className="mb-4 text-gray-500" />
      <h3 className="text-xl font-bold">System Audit Logs</h3>
      <p className="text-gray-400 max-w-md mx-auto mt-2">Historical tracking for all database operations is logged here for compliance and accountability. This feature is rolling out soon.</p>
    </div>
  )
}

function AddUserModal({ onClose }: { onClose: () => void }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // In a real production app, we'd have a mutation to create a user with a specific role.
    // For this demo, we'll suggest using the sign-up flow.
    setTimeout(() => {
      setError('Technician accounts should be created via the sign-up flow on the login page for security. New accounts default to the Technician role.')
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-background-paper w-full max-w-md p-8 rounded-2xl shadow-2xl border border-gray-700"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2"><LucideUserPlus className="text-primary" /> Add New Staff</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><LucideXCircle /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-sm text-gray-300">
            <p className="font-bold text-primary mb-1">Notice</p>
            New users should sign up directly on the login page. The first user becomes Admin; all subsequent users are created as Technicians.
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
            <input className="input w-full" placeholder="tech@techngamer.com" disabled />
          </div>

          {error && <p className="text-error text-xs italic">{error}</p>}

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 font-bold text-gray-400">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading ? 'Processing...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
