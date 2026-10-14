import TechList from "../../_components/TechList";

export default async function ArgomentoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <TechList slug={slug} />;
}