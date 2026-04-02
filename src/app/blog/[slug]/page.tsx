import { Metadata } from "next";
import Link from "next/link";
import { getPostBySlug, getAllPosts, getPostsByCategory } from "@/lib/blog";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const post = getPostBySlug(params.slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

export default function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  // Get related posts from the same category
  const relatedPosts = getPostsByCategory(post.category)
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);

  const publishDate = new Date(post.date);
  const formattedDate = publishDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article>
      {/* Article Header */}
      <div className="bg-primary-50 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-slate-600 mb-6">
            <Link href="/blog" className="hover:text-primary-600 transition-colors">
              Blog
            </Link>
            <span>/</span>
            <span>{post.category}</span>
          </nav>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            {post.title}
          </h1>

          {/* Article Meta */}
          <div className="flex flex-wrap items-center gap-4 text-slate-600">
            <div className="flex items-center gap-2">
              <span className="text-sm">{post.author}</span>
            </div>
            <span>|</span>
            <time dateTime={post.date} className="text-sm">
              {formattedDate}
            </time>
            <span>|</span>
            <span className="text-sm">{post.readTime} min read</span>
            <span>|</span>
            <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
              {post.category}
            </span>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Main Content - Prose Styling */}
        <div
          className="prose prose-slate max-w-none
            prose-h2:text-3xl prose-h2:font-bold prose-h2:text-slate-900 prose-h2:mt-8 prose-h2:mb-4
            prose-h3:text-2xl prose-h3:font-bold prose-h3:text-slate-800 prose-h3:mt-6 prose-h3:mb-3
            prose-p:text-lg prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-4
            prose-ul:list-disc prose-ul:ml-5 prose-ul:mb-4 prose-ul:text-slate-700
            prose-ol:list-decimal prose-ol:ml-5 prose-ol:mb-4 prose-ol:text-slate-700
            prose-li:mb-2 prose-li:text-slate-700
            prose-a:text-primary-600 prose-a:font-medium hover:prose-a:text-primary-700
            prose-strong:font-bold prose-strong:text-slate-900
            prose-em:italic prose-em:text-slate-700
            prose-blockquote:border-l-4 prose-blockquote:border-primary-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-700"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="bg-slate-50 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">
              Related Articles
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {relatedPosts.map((relatedPost) => (
                <div
                  key={relatedPost.slug}
                  className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="mb-3">
                    <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                      {relatedPost.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">
                    {relatedPost.title}
                  </h3>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                    {relatedPost.description}
                  </p>
                  <Link
                    href={`/blog/${relatedPost.slug}`}
                    className="inline-flex items-center text-primary-600 font-medium hover:text-primary-700 transition-colors"
                  >
                    Read More
                    <svg
                      className="w-4 h-4 ml-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-primary-600 text-white py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Find Your Pediatrician?
          </h2>
          <p className="text-lg text-primary-100 mb-8">
            Search our comprehensive directory of pediatricians and find the
            right healthcare provider for your child.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/search"
              className="inline-block px-8 py-3 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors"
            >
              Search Directory
            </Link>
            <Link
              href="/map"
              className="inline-block px-8 py-3 bg-primary-700 text-white font-medium rounded-lg hover:bg-primary-800 transition-colors border border-primary-700"
            >
              View on Map
            </Link>
          </div>
        </div>
      </section>

      {/* Back to Blog */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/blog"
          className="inline-flex items-center text-primary-600 font-medium hover:text-primary-700 transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Blog
        </Link>
      </div>

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.description,
            image: "https://findmypediatrician.com/og-image.png",
            datePublished: post.date,
            dateModified: post.date,
            author: {
              "@type": "Organization",
              name: post.author,
              url: "https://findmypediatrician.com",
            },
            publisher: {
              "@type": "Organization",
              name: "FindMyPediatrician",
              url: "https://findmypediatrician.com",
              logo: {
                "@type": "ImageObject",
                url: "https://findmypediatrician.com/logo.png",
              },
            },
          }),
        }}
      />
    </article>
  );
}
