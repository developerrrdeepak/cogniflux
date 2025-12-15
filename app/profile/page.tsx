
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "../firebase/config";

export const dynamic = 'force-dynamic';

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#030712]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#030712] text-gray-900 dark:text-white">
      <div className="glass-panel p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-white/10">
        <h2 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">Profile</h2>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">Manage your account</p>
        
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</p>
          <p className="font-medium">{user.email}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push("/")}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-all"
          >
            Go to Chat
          </button>
          <button
            onClick={handleLogout}
            className="w-full border border-red-500/20 hover:bg-red-500/10 text-red-600 dark:text-red-400 font-bold py-3 px-4 rounded-xl transition-all"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
