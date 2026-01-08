import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/authOptions";
import { SignupForm } from "@/components/forms/SignupForm";

export default async function SignupPage() {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) redirect("/");

    return (
        <main className="flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                <SignupForm />
            </div>
        </main>
    );
}
