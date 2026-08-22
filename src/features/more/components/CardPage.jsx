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
 */
const CardPage = ({ icon, iconBg, title, heading, description, to = "/" }) => {
  return (
    <Link
      to={to}
      className="group flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
    >
      <div>
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${iconBg}`}
          >
            {icon}
          </span>
          <h3 className="text-[15px] font-semibold text-gray-900">
            {heading}
          </h3>
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-800">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors duration-200 group-hover:bg-indigo-50 group-hover:text-indigo-600">
          <ArrowRight size={16} />
        </span>
      </div>
    </Link>
  );
};

export default CardPage;