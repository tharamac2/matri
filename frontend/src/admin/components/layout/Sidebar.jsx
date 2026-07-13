import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Crown,
  CreditCard,
  BarChart2,
  Bell,
  Sparkles,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

const NAV_ITEMS = [
  { to: '/admin/',                  label: 'Dashboard',           icon: LayoutDashboard, end: true },
  { to: '/admin/members',           label: 'Members',             icon: Users },
  { to: '/admin/verification',      label: 'Profile Verification', icon: ShieldCheck },
  { to: '/admin/membership',        label: 'Premium Membership',  icon: Crown },
  { to: '/admin/payments',          label: 'Payments',            icon: CreditCard },
  { to: '/admin/reports',           label: 'Reports',             icon: BarChart2 },
  { to: '/admin/notifications',     label: 'Notifications',       icon: Bell },
  { to: '/admin/success-stories',   label: 'Success Stories',     icon: Sparkles },
]

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    setIsOpen(false)
    logout()
    navigate('/admin/login')
  }

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? 'border-l-[3px] border-brand-700 bg-brand-50 pl-[9px] text-brand-700'
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
    }`

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="px-4 py-6">
        <h1 className="text-xl font-bold text-brand-700 leading-tight">Tharamac Matrimony</h1>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Super Admin</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 pb-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={navLinkClass} onClick={() => setIsOpen(false)}>
            <Icon size={18} strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-100 px-3 py-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
        >
          <LogOut size={18} strokeWidth={1.8} />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-4 z-30 rounded-md border border-gray-200 bg-white p-2 shadow-sm md:hidden"
        aria-label="Open navigation"
      >
        <Menu size={20} className="text-gray-600" />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-shrink-0 flex-col border-r border-gray-100 bg-white">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-20 bg-black/30 md:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-30 w-56 flex flex-col border-r border-gray-100 bg-white md:hidden">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-3 top-3 rounded-md p-1.5 text-gray-400 hover:text-gray-600"
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
