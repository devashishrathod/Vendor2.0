export default function DashboardFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="px-6 py-4">

        {/* ── Company name ── */}
        <p className="text-[11px] font-bold tracking-wide text-gray-800 uppercase">
          Trydood Retail Private Limited
        </p>

        {/* ── Divider ── */}
        <div className="border-t border-gray-200 my-3" />

        {/* ── Bottom row: copyright + links ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-[11px] text-gray-500">
            Copyright &copy; {year} Trydood. All rights reserved.
          </p>

          <div className="flex items-center gap-3 text-[11px] text-gray-500">
            <a href="/terms" className="hover:text-gray-800 transition-colors">
              Terms of Service
            </a>
            <span className="w-px h-3 bg-gray-300" />
            <a href="/privacy" className="hover:text-gray-800 transition-colors">
              Privacy Policy
            </a>
            <span className="w-px h-3 bg-gray-300" />
            <a href="/contact" className="hover:text-gray-800 transition-colors">
              Contact Us
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}