import { rxNostr } from 'rx-nostr';
import { NostrEventSchema } from '../nostr-types';

export async function bootstrapNostrRegistry() {
  const sub = rxNostr.use({ relays: ["wss://relay.damus.io"] });
  sub.subscribe({ kinds: [30078], "#d": ["nostr-registry-of-kinds"] })
    .subscribe(event => {
      const parsed = NostrEventSchema.parse(JSON.parse(event.content));
      console.log("Live registry updated:", parsed);
      // hot-reload IOL here
    });
}
