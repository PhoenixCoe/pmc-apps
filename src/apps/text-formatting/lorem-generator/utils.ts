export type Flavour = 'latin' | 'startup' | 'legal' | 'medical';
export type Unit = 'paragraphs' | 'sentences' | 'words';

const BANKS: Record<Flavour, string[]> = {
  latin: 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum curabitur pretium tincidunt lacus nulla gravida orci a odio nullam varius turpis et commodo pharetra'.split(' '),
  startup: 'synergy disrupt pivot scalable runway stakeholder bandwidth ecosystem leverage onboarding roadmap sprint agile pipeline traction unicorn growth-loop monetise iterate frictionless seamless platform vertical horizontal cross-functional deliverable alignment north-star user-centric data-driven mission-critical best-in-class low-hanging-fruit value-add touchpoint paradigm stack MVP funnel churn retention cohort burn-rate seed series-A moat network-effect product-market-fit go-to-market ideation holistic turnkey'.split(' '),
  legal: 'hereinafter whereas notwithstanding pursuant indemnify covenant liability jurisdiction thereof herein hereby aforementioned agreement party parties clause provision obligation remedy remedy damages warranty representation termination assignment severability waiver arbitration governing confidential disclosure amendment consent liable indemnification counterpart statute construed binding enforceable successors licensee licensor lessor lessee tenancy tort negligence'.split(' '),
  medical: 'patient diagnosis symptom treatment prognosis chronic acute therapy dosage clinical examination referral assessment cardiovascular respiratory neurological gastrointestinal hypertension inflammation prescription outpatient inpatient consultation specimen biopsy radiology pathology anaesthesia rehabilitation immunisation haemoglobin lesion benign vital signs follow-up contraindication adverse recovery monitoring screening'.split(' '),
};

// Small seeded generator: the same seed + options always give the same text, so server and browser agree.
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface LoremOptions { flavour: Flavour; unit: Unit; count: number; seed: number; classicStart: boolean; html: boolean }

export function generate(o: LoremOptions): string {
  const bank = BANKS[o.flavour];
  const rand = rng(o.seed);
  const pick = () => bank[Math.floor(rand() * bank.length)];
  const count = Math.max(1, Math.min(o.count, o.unit === 'words' ? 5000 : 200));
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const sentence = (): string => {
    const n = 7 + Math.floor(rand() * 11);
    const w: string[] = [];
    for (let i = 0; i < n; i++) {
      let word = pick();
      if (w.length && w[w.length - 1] === word) word = pick();
      w.push(word);
    }
    if (n > 9) w[Math.floor(n / 2) + Math.floor(rand() * 2)] += ',';
    return cap(w.join(' ')) + '.';
  };

  if (o.unit === 'words') {
    const w: string[] = [];
    const lead = o.classicStart && o.flavour === 'latin' ? ['lorem', 'ipsum', 'dolor', 'sit', 'amet'] : [];
    for (let i = 0; i < count; i++) w.push(lead[i] ?? pick());
    return w.join(' ');
  }
  const paragraph = () => Array.from({ length: 3 + Math.floor(rand() * 4) }, sentence).join(' ');
  let out: string[] = o.unit === 'sentences' ? Array.from({ length: count }, sentence) : Array.from({ length: count }, paragraph);
  if (o.classicStart && o.flavour === 'latin') out[0] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' + out[0].replace(/^[^.]*\.\s?/, '');
  if (o.unit === 'sentences') return o.html ? `<p>${out.join(' ')}</p>` : out.join(' ');
  return o.html ? out.map((p) => `<p>${p}</p>`).join('\n') : out.join('\n\n');
}
