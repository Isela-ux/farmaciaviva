import { ChatAssistant } from "@/components/ChatAssistant";

export const metadata = {
  title: "Asistente",
  description: "Consultas asistidas sobre plantas medicinales con RAG.",
};

export default function AsistentePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <ChatAssistant />
    </div>
  );
}
