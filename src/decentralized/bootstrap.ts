import { createRxNostr, createRxForwardReq } from 'rx-nostr';
import { NostrEventSchema } from '../nostr-types';

export async function bootstrapNostrRegistry() {
  const rxNostr = createRxNostr();
  rxNostr.setDefaultRelays(["wss://relay.damus.io"]);
  const req = createRxForwardReq();
  rxNostr.use(req).subscribe((packet: { event: { content: string } }) => {
    const parsed = NostrEventSchema.parse(JSON.parse(packet.event.content));
    console.log("Live registry updated:", parsed);
    // hot-reload IOL here
  });
  req.emit([{ kinds: [30078], "#d": ["nostr-registry-of-kinds"] }]);
}
