"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FilePlus2, PackagePlus, FileText, LogOut, Users2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

const navItems = [
  { name: "Create Invoice", href: "/create-bill", icon: FilePlus2 },
  { name: "All Invoices", href: "/", icon: FileText },
  { name: "Add Items", href: "/add-items", icon: PackagePlus },
  { name: "Suppliers List", href: "/customer", icon: Users2 }
];

function normalize(p?: string | null) {
  if (!p) return "/";
  // remove query string and trailing slash (but keep single "/")
  const withoutQuery = p.split("?")[0];
  return withoutQuery.replace(/\/+$/, "") || "/";
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const current = normalize(pathname);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    const ok = confirm("Are you sure you want to log out?");
    if (!ok) { setLoggingOut(false); return };
    localStorage.removeItem("zestpos_token");
    router.push("/login");
    toast.success("Logged out successfully.");
    setLoggingOut(false);
  };

  return (
    <aside className="w-64 h-screen bg-white shadow-md flex flex-col">
      <div className="p-6">
        {/* Logo / title */}
        <h1 className="text-2xl font-bold text-[#800080] text-center">SCPTrading</h1>
      </div>

      <nav className="flex-1 space-y-2 px-4">
        {navItems.map(({ name, href, icon: Icon }) => {
          const linkPath = normalize(href);

          // active when exact match OR when current is a subpath of linkPath
          const isActive =
            current === linkPath || (linkPath !== "/dashboard" && current.startsWith(linkPath + "/"));

          return (
            <Link
              key={name}
              href={href}
              className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition ${isActive ? "bg-purple-100 text-[#800080]" : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              <Icon className="h-5 w-5" />
              {name}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-gray-100">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className={`w-full cursor-pointer flex items-center gap-3 px-3 py-2 text-sm rounded-md transition ${loggingOut
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "text-gray-700 hover:bg-gray-100"
            }`}
          aria-disabled={loggingOut}
          title="Logout"
        >
          <LogOut className={`h-5 w-5 ${loggingOut ? "text-gray-300" : "text-gray-700"}`} />
          <span>{loggingOut ? "Logging out..." : "Logout"}</span>
        </button>
      </div>
    </aside>
  );
}
