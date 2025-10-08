
import { Layout } from "@/components/Layout";
import { SecureChatAssistant as ChatAssistant } from "@/components/assistant/SecureChatAssistant";

const Assistant = () => {
  return (
    <Layout>
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold tracking-tight">Asistente de Consultas</h1>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <ChatAssistant />
        </div>
      </section>
    </Layout>
  );
};

export default Assistant;
