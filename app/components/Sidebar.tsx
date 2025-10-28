"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilePlus2, PackagePlus, FileText } from "lucide-react";

const navItems = [
  { name: "Create Bill", href: "/dashboard/create-bill", icon: FilePlus2 },
  { name: "Add Items", href: "/dashboard/add-items", icon: PackagePlus },
  { name: "All Bills", href: "/dashboard", icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-white shadow-md flex flex-col">
      <div className="p-6">
        {/* <img src="/zestposlogo.png" alt="ZestPOS" className="h-12 mx-auto mb-6" /> */}
       
        <h1 className="text-2xl font-bold text-purple-600 text-center">ZestPOS</h1>
      </div>
      <nav className="flex-1 space-y-2 px-4">
        {navItems.map(({ name, href, icon: Icon }) => (
          <Link
            key={name}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
              pathname === href
                ? "bg-purple-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Icon className="h-5 w-5" />
            {name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
