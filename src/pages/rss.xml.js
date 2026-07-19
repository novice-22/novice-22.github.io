import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE } from "../consts";
import { postSlug } from "../utils";

export async function GET(context) {
  const posts = (await getCollection("posts", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.summary,
      categories: [post.data.category, ...post.data.tags],
      link: `/posts/${postSlug(post)}/`,
    })),
  });
}
