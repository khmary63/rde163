import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { blogPosts } from "@/data/mock";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/blog/$slug")({
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
