import type { DocumentProps } from "rwsdk/router";
import stylesheet from "./styles.css?url";

export function Document({ children, rw }: DocumentProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Your trivia night. One room code. A buzzer for everyone."
        />
        <meta name="theme-color" content="#18181b" />
        <title>bzzr — First in. Game on.</title>
        <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any" />
        <link
          rel="apple-touch-icon"
          href="/apple-touch-icon.png"
          sizes="180x180"
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="bzzr" />
        <meta property="og:title" content="bzzr — First in. Game on." />
        <meta
          property="og:description"
          content="Your people. One room code. A buzzer for everyone. No accounts. Just quick reflexes."
        />
        <meta property="og:image" content="https://bzzr.app/social-card.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta
          property="og:image:alt"
          content="bzzr. First in. Game on. A lime green buzzer for your next trivia night."
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="bzzr — First in. Game on." />
        <meta
          name="twitter:description"
          content="Your people. One room code. A buzzer for everyone."
        />
        <meta name="twitter:image" content="https://bzzr.app/social-card.png" />
        <meta
          name="twitter:image:alt"
          content="bzzr. First in. Game on. A lime green buzzer for your next trivia night."
        />
        <link rel="stylesheet" href={stylesheet} />
        <link rel="modulepreload" href="/src/client.tsx" />
      </head>
      <body className="min-h-dvh bg-zinc-50 font-sans text-zinc-950 antialiased dark:bg-zinc-950 dark:text-white">
        <div id="root">{children}</div>
        <script nonce={rw.nonce}>import("/src/client.tsx")</script>
      </body>
    </html>
  );
}
