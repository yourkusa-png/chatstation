import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SEO_TOPICS, getSeoTopic } from "@/data/seo-topics";

const BASE = "https://chatstation.in";

export const Route = createFileRoute("/topics/$slug")({
  loader: ({ params }) => {
    const topic = getSeoTopic(params.slug);
    if (!topic) throw notFound();
    return { topic };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Not found" }, { name: "robots", content: "noindex" }] };
    const { topic } = loaderData;
    const url = `${BASE}/topics/${params.slug}`;
    return {
      meta: [
        { title: topic.title },
        { name: "description", content: topic.description },
        { name: "keywords", content: `${topic.keyword}, chat station, random video chat` },
        { property: "og:title", content: topic.title },
        { property: "og:description", content: topic.description },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "CHAT STATION", item: `${BASE}/` },
              { "@type": "ListItem", position: 2, name: topic.keyword, item: url },
            ],
          }),
        },
      ],
    };
  },
  notFoundComponent: TopicNotFound,
  component: TopicPage,
});

function TopicNotFound() {
  return (
    <div className="p-10 text-center">
      <p>Page not found.</p>
      <Link to="/" className="text-primary underline">Go home</Link>
    </div>
  );
}

function TopicPage() {
  const { topic } = Route.useLoaderData();
  const related = SEO_TOPICS.filter((s) => s.slug !== topic.slug).slice(0, 8);
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-14">
        <h1 className="text-4xl font-bold capitalize leading-tight">{topic.keyword}</h1>
        <p className="mt-5 text-lg text-muted-foreground">{topic.intro}</p>
        <Button asChild className="glow-ring mt-8 h-16 w-full rounded-2xl text-lg font-bold sm:w-auto sm:px-10">
          <Link to="/">Start Live Video Call</Link>
        </Button>
        <h2 className="mt-12 text-2xl font-bold">Why CHAT STATION for {topic.keyword}</h2>
        <ul className="mt-4 grid gap-3">
          {topic.points.map((p) => (
            <li key={p} className="rounded-lg border border-border bg-card p-4">{p}</li>
          ))}
        </ul>
        <h2 className="mt-12 text-2xl font-bold">How it works</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted-foreground">
          <li>Tap “Start Live Video Call”.</li>
          <li>Sign in with Google in one tap.</li>
          <li>Your camera turns on and you are matched with a stranger. Tap Next to skip.</li>
        </ol>
        <p className="mt-6 text-sm text-muted-foreground">18+ only. Be respectful — abusive users are reported and banned.</p>
        <h2 className="mt-12 text-xl font-bold">Related</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {related.map((r) => (
            <Link key={r.slug} to="/topics/$slug" params={{ slug: r.slug }} className="rounded-full border border-border px-3 py-1 text-sm capitalize text-muted-foreground hover:text-foreground">
              {r.keyword}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
