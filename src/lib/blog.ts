import { post1 } from "./posts/post1";
import { post2 } from "./posts/post2";
import { post3 } from "./posts/post3";
import { post4 } from "./posts/post4";
import { post5 } from "./posts/post5";
import { post6 } from "./posts/post6";
import { post7 } from "./posts/post7";
import { post8 } from "./posts/post8";
import { post9 } from "./posts/post9";
import { post10 } from "./posts/post10";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  category: string;
  readTime: number;
  content: string;
  keywords: string[];
};

export const blogPosts: BlogPost[] = [
  post1,
  post2,
  post3,
  post4,
  post5,
  post6,
  post7,
  post8,
  post9,
  post10,
];

export function getAllPosts(): BlogPost[] {
  return blogPosts;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getPostsByCategory(category: string): BlogPost[] {
  return blogPosts.filter((post) => post.category === category);
}
