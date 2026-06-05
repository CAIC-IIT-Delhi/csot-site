import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

/** Legacy URL — redirects to /tracks/:slug/week/1/submit */
export default async function LegacyWeek1SubmitPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/tracks/${slug}/week/1/submit`);
}
