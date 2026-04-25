import ChatWindow from "@/components/ChatWindow";

export default function Home() {
  return (
    <div className="h-full flex items-center justify-center p-4 bg-[var(--background)]">
      <div className="w-full max-w-lg h-[calc(100vh-2rem)] max-h-[780px]">
        <ChatWindow />
      </div>
    </div>
  );
}
