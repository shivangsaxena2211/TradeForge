/**
 * Mulberry32 seeded PRNG — deterministic for tests and reproducible demos.
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  }

  /** Standard normal via Box-Muller */
  nextGaussian(): number {
    let u = 0;
    let v = 0;

    while (u === 0) {
      u = this.next();
    }

    while (v === 0) {
      v = this.next();
    }

    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /** Uniform in [min, max) */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  getSeed(): number {
    return this.state;
  }
}

export function createSeededRandom(seed: number): SeededRandom {
  return new SeededRandom(seed);
}
