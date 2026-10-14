import { readdir, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

// Run after Vite/Sentry finish, including builds without upload credentials.
const clientOutput = fileURLToPath(new URL("../dist/client/", import.meta.url));
async function clean(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await clean(path);
    else if (entry.isFile() && entry.name.endsWith(".map")) await unlink(path);
  }
}
await clean(clientOutput);
