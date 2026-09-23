import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://kyuhyuk.kr/",
    title: "KyuHyuk Blog",
    description: "Explore KyuHyuk Blog by developer KyuHyuk Lee. A cozy space sharing everything from software development logs to everyday hobbies like cooking and growing plants.",
    author: "KyuHyuk Lee",
    profile: "https://avatars.githubusercontent.com/u/6347277",
    ogImage: "default-og.png",
    lang: "en",
    timezone: "Asia/Seoul",
    dir: "ltr",
  },
  posts: {
    perPage: 8,
    perIndex: 8,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: false,
    editPost: {
      enabled: false,
    },
    search: "pagefind",
  },
  socials: [
    { name: "github", url: "https://github.com/leekyuhyuk" },
    { name: "linkedin", url: "https://linkedin.com/in/leekyuhyuk" },
    { name: "mail", url: "mailto:lee@kyuhy.uk" },
  ],
  shareLinks: [
    { name: "whatsapp", url: "https://wa.me/?text=" },
    { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
    { name: "x", url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "pinterest", url: "https://pinterest.com/pin/create/button/?url=" },
    { name: "mail", url: "mailto:?subject=See%20this%20post&body=" },
  ],
});