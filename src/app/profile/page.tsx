import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { ProfileClient } from "@/components/profile/ProfileClient";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get user data from database to check if they have a password
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  // Check if user has a password (email/password login)
  const hasPassword = !!user?.password;

  return (
    <MainLayout>
      <ProfileClient
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          hasPassword,
        }}
      />
    </MainLayout>
  );
}
