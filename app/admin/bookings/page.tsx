import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import AdminBookingsClient from "./AdminBookingsClient";

export default async function AdminBookingsPage({
    searchParams,
}: {
    searchParams: { event?: string };
}) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        redirect("/auth/signin");
    }

    if (session.user.email !== process.env.ADMIN_EMAIL) {
        redirect("/");
    }

    const eventFilter = searchParams.event || "";
    return <AdminBookingsClient eventFilter={eventFilter} />;
}
