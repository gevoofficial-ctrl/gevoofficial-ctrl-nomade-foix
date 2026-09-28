const http = require("http");
const fs = require("fs");
const path = require("path");
const next = require("next");
const { parse } = require("url");

const port = Number(process.env.PORT) || 3000;
const hostname = process.env.HOSTNAME || "0.0.0.0";
const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    http
      .createServer((req, res) => {
        const parsedUrl = parse(req.url, true);

        if (parsedUrl.pathname === "/nomade.css") {
          const cssPath = path.join(process.cwd(), "public", "nomade.css");

          try {
            const css = fs.readFileSync(cssPath);
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/css; charset=utf-8");
            res.setHeader("Cache-Control", "no-cache, max-age=0, must-revalidate");
            res.end(css);
          } catch (error) {
            console.error("Failed to serve /nomade.css:", error);
            res.statusCode = 500;
            res.end("CSS file unavailable");
          }
          return;
        }

        handle(req, res, parsedUrl);
      })
      .listen(port, hostname, () => {
        console.log(`> Next.js server ready on ${hostname}:${port}`);
      });
  })
  .catch((error) => {
    console.error("Failed to start Next.js:", error);
    process.exit(1);
  });
