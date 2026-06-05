import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

/** Legacy URL — redirects to /tracks/:slug/admin */
export default async function LegacyLeaderboardEditPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/tracks/${slug}/admin`);
}
