import { Link } from 'react-router-dom'

export default function PageWrapper({ title, breadcrumbs = [], isLoading = false, error = null, children }) {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {breadcrumbs.length > 0 && (
        <nav className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.label}>
              {index > 0 && <span className="mx-1">/</span>}
              {crumb.to ? (
                <Link to={crumb.to} className="hover:text-primary-600">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-700 dark:text-gray-300">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {title && <h1 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">{title}</h1>}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error.message || 'Something went wrong while loading this page.'}
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      ) : (
        children
      )}
    </div>
  )
}
