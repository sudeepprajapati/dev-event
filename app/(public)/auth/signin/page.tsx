import { SigninForm } from "@/components/forms/SigninForm";

export default function SigninPage({
    searchParams,
}: {
    searchParams: { error?: string };
}) {
    const callbackError = searchParams.error || null;

    return (
        <main className="flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                <SigninForm callbackError={callbackError} />
            </div>
        </main>
    );
}
