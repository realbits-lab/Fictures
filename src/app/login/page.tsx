import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { auth } from '@/lib/auth';

export default async function LoginPage() {
  const session = await auth();
  
  if (session) {
    redirect('/');
  }

  return <LoginForm />;
}