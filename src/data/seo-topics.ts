export type SeoTopic = {
  slug: string;
  keyword: string;
  title: string;
  description: string;
  intro: string;
  points: string[];
};

const t = (slug: string, keyword: string, intro: string, points: string[]): SeoTopic => ({
  slug,
  keyword,
  title: `${keyword.replace(/\b\w/g, (c) => c.toUpperCase())} — Free | CHAT STATION`,
  description: `${intro.slice(0, 140)}`,
  intro,
  points,
});

export const SEO_TOPICS: SeoTopic[] = [
  t("random-video-chat", "random video chat", "Start a free random video chat with a real person in seconds. CHAT STATION pairs you one-to-one, right in your browser.", ["One tap to start, no app download", "Skip to a new person anytime", "Text chat and GIFs during the call"]),
  t("omegle-alternative-india", "omegle alternative india", "Omegle has shut down. CHAT STATION is a fresh Omegle alternative built for India, with fast matching on Indian mobile networks.", ["Works smoothly on 4G and 5G", "Google sign-in keeps out bots", "Report and block built in"]),
  t("ometv-alternative", "ometv alternative", "Looking for an OmeTV alternative without coins or paywalls? CHAT STATION keeps the classic split-screen video chat and makes it free.", ["Same familiar split-screen layout", "Country and gender filters", "No coins needed to talk"]),
  t("chathub-alternative", "chathub alternative", "CHAT STATION is a simple ChatHub alternative: open the site, sign in with Google and get matched with a stranger instantly.", ["No setup or plugins", "Clean mobile-first design", "Like button to show appreciation"]),
  t("talk-to-strangers", "talk to strangers", "Want to talk to strangers online? Meet new people from India and around the world on live one-to-one video calls.", ["Random matches every time", "Real people, verified by Google login", "Leave a call with one tap"]),
  t("talk-to-strangers-india", "talk to strangers india", "Talk to strangers from India on a free video chat made for Indian users, with Hindi and English speakers online.", ["Filter to match people from India", "Low data usage", "Safe reporting system"]),
  t("video-chat-in-hindi", "video chat in hindi", "Find people to video chat in Hindi. CHAT STATION connects Hindi speakers across India for friendly live conversations.", ["Desi friends from every state", "Type in Hindi or Hinglish", "Free forever basic chat"]),
  t("random-video-call-app", "random video call app", "No need to install a random video call app. CHAT STATION works in Chrome, Safari and any modern mobile browser.", ["Saves phone storage", "Add to home screen like an app", "Instant camera switching"]),
  t("free-video-call-with-strangers", "free video call with strangers", "Make a free video call with strangers, without coins, credits or hidden charges for basic matching.", ["Unlimited skips", "Free gender and country filters", "No credit card needed"]),
  t("stranger-video-chat-no-coins", "stranger video chat no coins", "Most stranger cam apps ask for coins. On CHAT STATION, live stranger video chat is free to use.", ["No coin purchases to start", "Fair matching for everyone", "Simple, honest experience"]),
  t("anonymous-video-chat", "anonymous video chat", "Enjoy anonymous video chat: strangers only see your chosen display name, never your email or phone number.", ["Your email stays private", "Pick any display name", "Block anyone instantly"]),
  t("safe-stranger-chat", "safe stranger chat", "CHAT STATION is designed for safe stranger chat with 18+ rules, reports, blocks and account bans.", ["18+ only community", "Report abusive users in one tap", "Banned accounts cannot return easily"]),
  t("video-chat-without-app", "video chat without app", "Video chat without an app — just open chatstation.in and start talking to new people right away.", ["Runs fully in the browser", "Works on Android and iPhone", "No updates to download"]),
  t("one-click-video-chat", "one click video chat", "One click video chat: press Start Live Video Call, sign in with Google, and you are matched automatically.", ["Auto-search after sign in", "Camera turns on for you", "Skip with one button"]),
  t("meet-new-friends-online", "meet new friends online", "Meet new friends online through live video. Make real connections faster than text-only apps.", ["Face-to-face conversations", "Like people you enjoy talking to", "Friends from many countries"]),
  t("chat-with-girls-online", "chat with girls online", "Want to chat with girls online respectfully? Use the gender filter to prefer matches with women who are online.", ["Free gender preference filter", "Respect rules strictly enforced", "Matches depend on who is online"]),
  t("chat-with-boys-online", "chat with boys online", "Chat with boys online on live video. Set your preference to male and meet new people for friendly talks.", ["Gender preference in Filters", "Skip anytime", "Report anyone who breaks rules"]),
  t("international-video-chat", "international video chat", "International video chat with people from USA, UK, Europe, Asia and more — practice languages and learn cultures.", ["Country selection filter", "Text chat alongside video", "Meet the world from home"]),
  t("usa-video-chat", "usa video chat", "Connect with people from the USA on live random video chat and talk to Americans in real time.", ["Pick USA in country filter", "Practice English speaking", "Free to start"]),
  t("english-speaking-practice-video-call", "english speaking practice video call", "Improve spoken English with real video calls. Talk with strangers worldwide and build confidence daily.", ["Real conversations, not bots", "Meet native speakers", "Skip until you find a good partner"]),
  t("cam-chat-online", "cam chat online", "Free cam chat online with strangers. Turn on your webcam or phone camera and start meeting people instantly.", ["Front and back camera switch", "Mic and camera controls", "Clean full-screen view"]),
  t("random-chat-for-mobile", "random chat for mobile", "Random chat for mobile built mobile-first: big buttons, smooth video and an easy chat overlay.", ["Designed for small screens", "Works on slow networks", "Battery friendly"]),
  t("live-video-chat-free", "live video chat free", "Live video chat free with strangers — fast matching, HD video between peers and no hidden fees.", ["Peer-to-peer video", "Free core features", "Instant start"]),
  t("emerald-chat-alternative", "emerald chat alternative", "A simple Emerald Chat alternative focused on video: sign in, get matched and talk face-to-face.", ["Video-first experience", "Interest-free random pairing", "Strong moderation"]),
  t("chatroulette-alternative", "chatroulette alternative", "CHAT STATION is a modern Chatroulette alternative with cleaner design and stronger safety tools.", ["Google sign-in reduces spam", "Reports and bans", "Modern fast interface"]),
  t("monkey-app-alternative", "monkey app alternative", "Monkey app alternative on the web — meet new people on quick video calls without installing anything.", ["No download required", "Quick skips", "Meet people your age (18+)"]),
  t("video-chat-with-gif", "video chat with gif", "Send GIFs and emojis while you video chat. Break the ice with fun reactions during live calls.", ["GIF search inside chat", "Emoji picker", "Animated Like reactions"]),
  t("stranger-chat-india-free", "stranger chat india free", "Stranger chat India free — meet people from Delhi, Mumbai, Bihar, UP, Bengal and every corner of the country.", ["Made in India", "Free basic chat", "Fast Indian servers for matching"]),
  t("bored-talk-to-someone", "bored talk to someone", "Bored? Talk to someone new right now. A random video call is the quickest way to beat boredom.", ["Someone new every tap", "Short or long chats", "Available 24/7"]),
  t("lonely-talk-to-someone-online", "lonely talk to someone online", "Feeling lonely? Talk to someone online on a friendly face-to-face video call with kind strangers.", ["Real human conversations", "Kindness rules enforced", "Leave anytime you want"]),
];

export const getSeoTopic = (slug: string) => SEO_TOPICS.find((s) => s.slug === slug);
