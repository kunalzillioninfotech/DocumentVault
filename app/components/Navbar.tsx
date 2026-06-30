import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import UserMenu from "./UserMenu";

export default async function Navbar() {
  const user = await getCurrentUser();

  return (
    <nav className="bg-blue-700 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-2">
        <Link href="/" className="text-2xl font-bold tracking-tight hover:text-blue-200 transition-colors shrink-0">
          DocumentVault
        </Link>

        {user && (
          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/"
              className="text-sm font-medium hover:text-blue-200 transition-colors"
            >
              <span className="sm:hidden">Docs</span>
              <span className="hidden sm:inline">Documents</span>
            </Link>
            <Link
              href="/add-document"
              className="bg-white text-blue-700 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors whitespace-nowrap"
            >
              <span className="sm:hidden">+ Add</span>
              <span className="hidden sm:inline">+ Add Document</span>
            </Link>
            <UserMenu name={user.name} email={user.email} />
          </div>
        )}
      </div>
    </nav>
  );
}