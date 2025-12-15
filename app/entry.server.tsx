import { PassThrough } from "node:stream";
import type { EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { renderToPipeableStream } from "react-dom/server";

const ABORT_DELAY = 5000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = new ReadableStream({
            start(controller) {
              body.on("data", (chunk: Buffer) => {
                controller.enqueue(chunk);
              });
              body.on("end", () => {
                controller.close();
              });
            },
          });

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
