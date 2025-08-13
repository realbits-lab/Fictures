import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import Script from 'next/script';

import { auth } from '@/app/auth';
import { Chat } from '@/components/chat';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
// DataStreamHandler archived - part of legacy artifact system removal
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { convertToUIMessages } from '@/lib/utils';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { DataStreamProvider } from '@/components/data-stream-provider';

export const experimental_ppr = true;

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });

  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // If chat doesn't exist yet, create a new one (for suggested actions)
  if (!chat) {
    const cookieStore = await cookies();
    const modelIdFromCookie = cookieStore.get('chat-model');
    const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

    const chatContent = (
      <>
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          initialChatModel={modelIdFromCookie?.value || DEFAULT_CHAT_MODEL}
          initialVisibilityType="private"
          isReadonly={false}
          session={session}
          autoResume={false}
        />
        {/* DataStreamHandler removed - legacy artifact system archived */}
      </>
    );

    return (
      <>
        <Script
          src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
          strategy="beforeInteractive"
        />
        <DataStreamProvider>
          <SidebarProvider defaultOpen={!isCollapsed}>
            <AppSidebar user={session?.user} />
            <SidebarInset>{chatContent}</SidebarInset>
          </SidebarProvider>
        </DataStreamProvider>
      </>
    );
  }

  if (chat.visibility === 'private') {
    if (!session.user) {
      return notFound();
    }

    if (session.user.id !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  const uiMessages = convertToUIMessages(messagesFromDb);

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get('chat-model');
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  const chatContent = !chatModelFromCookie ? (
    <>
      <Chat
        id={chat.id}
        initialMessages={uiMessages}
        initialChatModel={DEFAULT_CHAT_MODEL}
        initialVisibilityType={chat.visibility}
        isReadonly={session?.user?.id !== chat.userId}
        session={session}
        autoResume={true}
      />
      {/* DataStreamHandler removed - legacy artifact system archived */}
    </>
  ) : (
    <>
      <Chat
        id={chat.id}
        initialMessages={uiMessages}
        initialChatModel={chatModelFromCookie.value}
        initialVisibilityType={chat.visibility}
        isReadonly={session?.user?.id !== chat.userId}
        session={session}
        autoResume={true}
      />
      {/* DataStreamHandler removed - legacy artifact system archived */}
    </>
  );

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <DataStreamProvider>
        <SidebarProvider defaultOpen={!isCollapsed}>
          <AppSidebar user={session?.user} />
          <SidebarInset>{chatContent}</SidebarInset>
        </SidebarProvider>
      </DataStreamProvider>
    </>
  );
}
