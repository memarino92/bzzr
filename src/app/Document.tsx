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
