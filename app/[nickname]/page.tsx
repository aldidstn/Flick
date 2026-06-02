import { TipJarScreen } from "@/components/screens/tip-jar-screen";
import { NICKNAME_PATTERN, RESERVED_ROUTES } from "@/lib/constants";
import { notFound } from "next/navigation";

export default function PublicTipPage({ params }: { params: { nickname: string } }) {
  const nickname = params.nickname.toLowerCase();

  if (!NICKNAME_PATTERN.test(nickname) || RESERVED_ROUTES.has(nickname)) {
    notFound();
  }

  return <TipJarScreen nickname={nickname} />;
}
