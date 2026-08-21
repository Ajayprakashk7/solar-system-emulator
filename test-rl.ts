import { RateLimiter } from './lib/rate-limiter.ts';
const rl = new RateLimiter(2, 60000);
console.log(rl.check('ip1'));
console.log(rl.check('ip1'));
console.log(rl.check('ip1'));
console.log(rl.check('ip2'));
