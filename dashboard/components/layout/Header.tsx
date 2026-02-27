'use client'

import { usePathname } from 'next/navigation'

const pageTitles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/gtm-hub': 'GTM Hub',
  '/admin/social-media': 'Social Media Agent',
  '/admin/settings': 'Settings',
}

export default function Header() {
  const pathname = usePathname()
  const pageTitle = pageTitles[pathname] || 'Dashboard'

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: pageTitle, href: pathname },
  ]

  return (
    <header className="h-16 bg-black border-b border-gray-800 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <nav className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.href} className="flex items-center gap-2">
              {index > 0 && (
                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              )}
              <span className={index === breadcrumbs.length - 1 ? 'text-white font-medium' : 'text-gray-400'}>
                {crumb.label}
              </span>
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
            <span className="text-sm font-medium text-white">R</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white">Razvan Toma</p>
            <p className="text-xs text-gray-400">razvan@razvantoma.com</p>
          </div>
        </div>
      </div>
    </header>
  )
}
