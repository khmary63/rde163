import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { blogPosts } from "@/data/mock";
import { formatDate } from "@/lib/format";

const BASE = "https://rde163.ru";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => {
    const post = blogPosts.find((p) => p.slug === params.slug);
    if (!post) return { meta: [{ title: "Статья не найдена" }] };
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      image: post.cover,
      datePublished: post.date,
      author: { "@type": "Organization", name: "Русский Дом Экспорта" },
      publisher: { "@type": "Organization", name: "Русский Дом Экспорта" },
      mainEntityOfPage: `${BASE}/blog/${post.slug}`,
    };
    const breadcrumbs = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Главная", item: BASE },
        { "@type": "ListItem", position: 2, name: "Блог", item: `${BASE}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: `${BASE}/blog/${post.slug}` },
      ],
    };
    return {
      meta: [
        { title: `${post.title} — Блог РДЭ` },
        { name: "description", content: post.excerpt },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.excerpt },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `${BASE}/blog/${post.slug}` },
        { property: "og:image", content: post.cover },
        { name: "twitter:image", content: post.cover },
      ],
      links: [{ rel: "canonical", href: `${BASE}/blog/${post.slug}` }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(jsonLd) },
        { type: "application/ld+json", children: JSON.stringify(breadcrumbs) },
      ],
    };
  },
  component: BlogPost,
});

function BlogPost() {
  const { slug } = Route.useParams();
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) throw notFound();
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 space-y-6">
      <Link to="/blog" className="text-sm text-brand hover:underline">← Все статьи</Link>
      <div className="text-xs font-mono text-brand uppercase tracking-wider">{post.category}</div>
      <h1 className="font-display text-4xl lg:text-5xl">{post.title}</h1>
      <div className="text-sm text-muted-foreground font-mono">{formatDate(post.date)} · {post.readTime} мин чтения</div>
      <div className="aspect-[16/9] rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${post.cover})` }} />
      <p className="text-lg text-muted-foreground leading-relaxed">{post.excerpt}</p>
      <p className="leading-relaxed">{post.body}</p>
    </article>
  );
}
