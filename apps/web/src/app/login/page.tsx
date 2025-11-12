import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { auth } from "@/lib/auth";

export default async function LoginPage() {
    const session = await auth();

    // If already logged in, redirect to novels page
    if (session) {
        redirect("/novels");
    }

    return <LoginForm />;
}
