import shell from "./wiki-shell.html?raw";

const body = shell.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? "";
const clientMarkup = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");

export default function Home() {
  return <div id="grand-line-root" dangerouslySetInnerHTML={{ __html: clientMarkup }} />;
}
