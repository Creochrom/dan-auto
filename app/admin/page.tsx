"use client";

import { AdminDashboard } from "@/components/enterprise/AdminDashboard";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/today");
  }, [router]);

  return <AdminDashboard />;
}
