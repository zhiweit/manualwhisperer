import { useParams } from "@solidjs/router";

type ChatDetailPageParams = {
  chatId: string;
};

export default function ChatDetailPage() {
  const params = useParams<ChatDetailPageParams>();
  return (
    <div class="absolute top-0 inset-x-0 flex items-center justify-center">
      {/* <h1>Debug {params.chatId}</h1> */}
    </div>
  );
}
