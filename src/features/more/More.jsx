import React from "react";
import {
  UserCog,
  Building2,
  Ticket,
  Rocket,
  Megaphone,
  BadgeIndianRupee,
  Star,
  Bell,
  MessageCircleQuestion,
  KeyRound,
  FileText,
  BookOpen,
} from "lucide-react";
import CardPage from "../more/components/CardPage";
import DashboardHeader from "../dashboard/components/DashboardHeader";

// All card data lives here — edit this array to add/remove/reorder cards.
const cards = [
  {
    icon: <UserCog size={20} />,
    iconBg: "bg-gradient-to-br from-orange-400 to-red-500",
    heading: "Account Information",
    title: "Manage Your Account",
    description:
      "Manage and update your account details for secure and smooth operations.",
    to: "/account-information",
  },
  {
    icon: <Building2 size={20} />,
    iconBg: "bg-gradient-to-br from-blue-400 to-indigo-500",
    heading: "Sub Outlets & Franchise",
    title: "Grow Your Visibility",
    description:
      "Additional branch locations under the same brand to expand reach and serve customers in multiple areas.",
    to: "/outlets",
  },
  {
    icon: <Ticket size={20} />,
    iconBg: "bg-gradient-to-br from-purple-500 to-fuchsia-500",
    heading: "Coupon Code",
    title: "Promo Code",
    description:
      "Enter your coupon code to get discounts and special offers on your purchase.",
    to: "/settings/coupon-code",
  },
  {
    icon: <Rocket size={20} />,
    iconBg: "bg-gradient-to-br from-orange-400 to-pink-500",
    heading: "Subscription Plan",
    title: "Upgrade",
    description:
      "Upgrade your current plan to access advanced features, increased limits, and exclusive benefits.",
    to: "/subscription-plan",
  },
  {
    icon: <Megaphone size={20} />,
    iconBg: "bg-gradient-to-br from-teal-400 to-emerald-500",
    heading: "Feature Campaign",
    title: "Campaign Budget",
    description:
      "A targeted promotional strategy to promote your products, or services and reach the right audience effectively.",
    to: "/settings/feature-campaign",
  },
  {
    icon: <BadgeIndianRupee size={20} />,
    iconBg: "bg-gradient-to-br from-yellow-400 to-amber-500",
    heading: "Sponsored Ads",
    title: "Ad Performance",
    description:
      "Boost your visibility by running paid ads that appear prominently to targeted users within the platform.",
    to: "/settings/sponsored-ads",
  },
  {
    icon: <Star size={20} />,
    iconBg: "bg-gradient-to-br from-pink-400 to-rose-500",
    heading: "Review",
    title: "Highlights",
    description:
      "Users can share their feedback, ratings, and experience to help others make better decisions.",
    to: "/settings/review",
  },
  {
    icon: <Bell size={20} />,
    iconBg: "bg-gradient-to-br from-yellow-400 to-orange-500",
    heading: "Notification",
    title: "New Update",
    description:
      "A new update is available. Please check your notification for complete details.",
    to: "/settings/notification",
  },
  {
    icon: <MessageCircleQuestion size={20} />,
    iconBg: "bg-gradient-to-br from-purple-500 to-indigo-500",
    heading: "Raise query",
    title: "Customer-friendly version",
    description:
      "If you are facing any issue or have any questions, use this option to raise your query.",
    to: "/settings/raise-query",
  },
  {
    icon: <KeyRound size={20} />,
    iconBg: "bg-gradient-to-br from-blue-400 to-cyan-500",
    heading: "Login Credentials",
    title: "For security purposes",
    description:
      "Enter your registered email or mobile number and password to access your account securely.",
    to: "/settings/login-credentials",
  },
  {
    icon: <FileText size={20} />,
    iconBg: "bg-gradient-to-br from-slate-500 to-gray-600",
    heading: "Terms & Conditions",
    title: "Rules & Terms",
    description:
      "Users must provide accurate information while using the platform.",
    to: "/settings/terms-and-conditions",
  },
  {
    icon: <BookOpen size={20} />,
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
    heading: "About Your Brand",
    title: "Clear & Simple",
    description: "Use easy words everyone understands.",
    to: "/settings/about-your-brand",
  },
];

const More = () => {
  return (
   <div>
    <DashboardHeader/>
     <div className="min-h-screen bg-gray-50 px-6 py-8 md:px-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold text-gray-900">More Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Customize Your Brand Page</p>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <CardPage
              key={card.to}
              icon={card.icon}
              iconBg={card.iconBg}
              heading={card.heading}
              title={card.title}
              description={card.description}
              to={card.to}
            />
          ))}
        </div>
      </div>
    </div>
   </div>
  );
};

export default More;