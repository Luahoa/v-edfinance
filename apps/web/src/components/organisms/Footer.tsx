import { Link } from '@/i18n/routing';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-zinc-50 py-12 dark:bg-zinc-900/50">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-blue-600">
              <div className="h-8 w-8 rounded-lg bg-blue-600" />
              <span>V-EdFinance</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
              Empowering financial literacy through personalized AI-powered learning experiences.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Platform</h3>
            <ul className="mt-4 space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
              <li><Link href="/courses" className="hover:text-blue-600 transition-colors">Courses</Link></li>
              <li><Link href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link></li>
              <li><Link href="/about" className="hover:text-blue-600 transition-colors">About Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Legal</h3>
            <ul className="mt-4 space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
              <li><Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            © {year} V-EdFinance (Lúa Hóa). All rights reserved.
          </p>
          <div className="flex gap-6">
            {/* Social links placeholder */}
          </div>
        </div>
      </div>
    </footer>
  );
}
