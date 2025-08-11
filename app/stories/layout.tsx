import { cookies } from 'next/headers';
import { auth } from '../auth';

export default async function StoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-foreground">Stories</h1>
              <nav className="hidden md:flex space-x-6">
                <a href="/stories" className="text-muted-foreground hover:text-foreground transition-colors">
                  Browse
                </a>
                <a href="/stories/my-stories" className="text-muted-foreground hover:text-foreground transition-colors">
                  My Stories
                </a>
                <a href="/stories/create" className="text-muted-foreground hover:text-foreground transition-colors">
                  Create
                </a>
              </nav>
            </div>
            {session?.user && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Welcome, {session.user.name || 'Author'}
                </span>
                <a href="/" className="text-sm text-primary hover:underline">
                  Back to Chat
                </a>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}