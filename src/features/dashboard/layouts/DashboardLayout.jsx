import { useState } from "react";
import { Outlet } from "react-router-dom";
import DashboardHeader from "@/features/dashboard/components/DashboardHeader";
import DashboardFooter from "@/features/dashboard/components/DashboardFooter";

export default function DashboardLayout() {
    const [activeTab, setActiveTab] = useState("Analysis Report");
    return (
        <div className="min-h-screen flex flex-col">
            <DashboardHeader activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="flex-1">
                <Outlet />
            </main>

            <DashboardFooter />
        </div>
    );
}