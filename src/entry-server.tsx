// @refresh reload
import latinFontUrl from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url";
import { createHandler, StartServer } from "@solidjs/start/server";

import "dotenv/config";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
          <link
            rel="preload"
            href={latinFontUrl}
            as="font"
            type="font/woff"
            crossOrigin=""
          />
          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
