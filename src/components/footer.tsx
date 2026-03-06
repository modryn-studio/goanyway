import Link from 'next/link';
import { site } from '@/config/site';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 py-8 px-6">
      <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/40">
        <div>
          &copy; {new Date().getFullYear()}{' '}
          <a
            href="https://modrynstudio.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/70 transition-colors"
          >
            Modryn Studio
          </a>
        </div>
        <div className="flex gap-6">
          <a
            href={site.social.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/70 transition-colors"
          >
            X
          </a>
          <a
            href={site.social.github}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/70 transition-colors"
          >
            GitHub
          </a>
          <Link href="/privacy" className="hover:text-white/70 transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-white/70 transition-colors">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
