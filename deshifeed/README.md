# DeshiFeed

A lightning-fast, minimalist, text-only social platform built with Next.js
(App Router), Tailwind CSS, and Firebase (Auth + Firestore).

## Features

- **Auth & Profiles** — Email/password auth, bio, follower/following counts, follow/unfollow, username search.
- **Posting** — Text-only posts (500 char cap), automatic Google Drive link detection, OpenGraph link previews (via a server route so there's no CORS issue), automatic `#hashtag` grouping.
- **Privacy & Moderation** — Per-post visibility (`Public` / `Friends` / `Only Me`), enforced both client-side and in Firestore rules; a keyword-based text filter blocks sensitive/18+ content before it's posted and flags borderline content with a warning label.
- **Engagement** — Five emoji reactions (👍 ❤️ 😂 😢 🎉), threaded comments (reply one level deep, edit, delete).
- **Communities** — Create/join Groups (member-only posting) and public Pages (owner-only posting, anyone can follow).
- **Messaging** — Private, real-time, text-only 1-on-1 direct messages.
- **Gamification** — Points for creating posts (+10), commenting (+5), giving/receiving reactions, gaining a follower, and joining a group, plus a live leaderboard.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Firebase is already configured in `lib/firebase.js` with your project's
credentials (`deshifeed-655f9`). Nothing else to set up locally.

### Enable Firebase services

In the [Firebase console](https://console.firebase.google.com/project/deshifeed-655f9):

1. **Authentication** → Sign-in method → enable **Email/Password**.
2. **Firestore Database** → create a database (production mode).
3. Deploy the security rules and indexes in this repo:

```bash
npm install -g firebase-tools
firebase login
firebase use deshifeed-655f9
firebase deploy --only firestore:rules,firestore:indexes
```

The `firestore.rules` file in this project replaces the temporary
"open for 30 days" rules from the Firebase console default. It enforces:

- Users can only edit their own profile document (with narrow exceptions
  for the `followers` array and `points` fields, so Follow and the points
  engine can update *other* users' docs without giving away full write
  access).
- Posts are readable only if `Public`, owned by the reader, or the reader
  is in the post's snapshotted `friendIds` (mutual-follow list) for
  `Friends`-visibility posts.
- Comments, DMs, groups, and pages all check `request.auth` ownership or
  membership before allowing writes.

> **Note on moderation & points:** the text filter in `lib/moderation.js`
> and the points engine in `lib/points.js` run client-side for this
> starter project. For a production launch, move both behind Firebase
> Cloud Functions (e.g. a callable function or Firestore-triggered
> function) so a modified client can't bypass the filter or fabricate
> points.

## Project structure

```
deshifeed/
├── app/
│   ├── layout.js              # Theme + Auth providers, global nav
│   ├── page.js                # Main feed + post composer
│   ├── login/page.js          # Email/password sign-in
│   ├── register/page.js       # Sign-up (creates users/{uid} profile doc)
│   ├── profile/[id]/page.js   # Profile, bio edit, follow, message, posts
│   ├── search/page.js         # User search + #hashtag search
│   ├── leaderboard/page.js    # Points leaderboard
│   ├── groups/page.js         # Groups directory + create
│   ├── groups/[id]/page.js    # Group feed (member-only posting)
│   ├── pages/page.js          # Public Pages directory + create
│   ├── pages/[id]/page.js     # Page feed (owner-only posting)
│   ├── messages/page.js       # DM inbox
│   ├── messages/[chatId]/page.js # 1-on-1 chat thread
│   └── api/og/route.js        # Server-side OpenGraph scraper for link previews
├── components/
│   ├── Navbar.js, ThemeToggle.js
│   ├── CreatePost.js          # Composer with visibility selector + moderation
│   ├── PostCard.js            # Reactions, hashtags, edit/delete
│   ├── CommentSection.js      # Threaded comments
│   ├── LinkPreview.js         # Renders OG preview / Drive badge
│   ├── FollowButton.js
│   └── UserSearch.js
├── lib/
│   ├── firebase.js            # Firebase app/auth/firestore init
│   ├── AuthContext.js         # Current user + live profile doc
│   ├── ThemeContext.js        # Dark/light mode (persisted)
│   ├── moderation.js          # Sensitive/18+ text filter
│   ├── points.js              # Gamification point values + awardPoints()
│   └── utils.js                # hashtags, linkify, reactions, time formatting
├── firestore.rules
├── firestore.indexes.json
├── firebase.json
└── tailwind.config.js
```

## Design

Pure white (`#F9FAFB`) / deep gray (`#111827`) backgrounds with a single
blue accent (`#2563EB`), Inter typeface, and a `max-w-feed` (640px) reading
column — the same proportions as text-first products like Twitter's
compose column, tuned for a minimalist, distraction-free feed.
