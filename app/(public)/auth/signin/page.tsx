import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/authOptions";
import { SigninForm } from "@/components/forms/SigninForm";

export default async function SigninPage({
    searchParams,
}: {
    searchParams: { error?: string };
}) {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) redirect("/");

    const callbackError = searchParams.error || null;

    return (
        <main className="flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                <SigninForm callbackError={callbackError} />
            </div>
        </main>
    );
}
