<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep all signed-in account actions in `SiteHeader`'s account menu so destructive and subscription actions remain consistent across pages.
- Store rich chat content with an explicit message kind and media URL so text and GIF rendering remains safe and extensible.
- Google sign-in is origin-dependent in `src/routes/auth.tsx`: on `*.lovable.app` hosts use the Lovable OAuth broker (`lovable.auth.signInWithOAuth`); on other origins (self-hosted custom domains like chatstation.in) use direct `supabase.auth.signInWithOAuth` — the broker's `/~oauth/initiate` path only exists on Lovable-hosted URLs and 404s elsewhere.
