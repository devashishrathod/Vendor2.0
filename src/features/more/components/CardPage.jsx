import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/**
 * CardPage
 * A single settings card used across the "More Settings" grid.
 *
 * Props:
 * - icon: React node (icon component instance, e.g. <Users size={20} />)
 * - iconBg: tailwind gradient/bg classes for the icon tile
 * - title: small eyebrow label (e.g. "Manage Your Account")
 * - heading: bold card heading (e.g. "Account Information")
 * - description: supporting copy text
 * - to: route path this card should navigate to on click
 * - comingSoon: when true, renders a disabled, non-navigating card instead
 *   of a <Link> — for cards whose destination page doesn't exist/isn't
 *   registered in App.jsx yet, so they show as "Coming Soon" instead of
 *   silently 404-redirecting to "/" on click.
 */
const CardPage = ({ icon, iconBg, title, heading, description, to = "/", comingSoon = false }) => {
  const content = (
    <>
      <div>
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${iconBg} ${comingSoon ? "grayscale opacity-60" : ""}`}
          >
            {icon}
          </span>
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">
            {heading}
          </h3>
          {comingSoon && (
            <span className="ml-auto flex-shrink-0 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
              Coming Soon
            </span>
          )}
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-700 text-gray-400 transition-colors duration-200 group-hover:bg-emerald-50 group-hover:text-emerald-600 dark:group-hover:bg-emerald-500/10 dark:group-hover:text-emerald-400">
          <ArrowRight size={16} />
        </span>
      </div>
    </>
  );

  if (comingSoon) {
    return (
      <div
        aria-disabled="true"
        title="Coming soon"
        className="group flex cursor-not-allowed flex-col justify-between rounded-xl bg-white dark:bg-gray-800 p-5 opacity-70"
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      to={to}
      className="group flex flex-col justify-between rounded-xl bg-white dark:bg-gray-800 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
    >
      {content}
    </Link>
  );
};

export default CardPage;