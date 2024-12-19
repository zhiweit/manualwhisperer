import { EventSourceMessage, getLines, getMessages } from "./parse";
export async function* streamEventSource(stream: ReadableStream<Uint8Array>) {
  const transformed = stream
    // .pipeThrough(new TextDecoderStream())
    .pipeThrough(new EventSourceDecoderStream());

  for await (const msg of transformed) {
    yield msg;
  }
}

class EventSourceDecoderStream
  extends TransformStream<Uint8Array, EventSourceMessage>
  implements GenericTransformStream
{
  constructor(
    callbacks: {
      onId?: (id: string) => void;
      onRetry?: (retry: number) => void;
    } = {}
  ) {
    super({
      transform(
        bytes: Uint8Array,
        controller: TransformStreamDefaultController<EventSourceMessage>
      ) {
        const decode = getLines(
          getMessages(
            (id) => callbacks.onId?.(id),
            (retry) => callbacks.onRetry?.(retry),
            (msg) => {
              controller.enqueue(msg);
            }
          )
        );
        decode(bytes);
      },
    });
  }
}
