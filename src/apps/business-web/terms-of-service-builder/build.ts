import { bullets, dateLong, type Section } from '../privacy-policy-generator/doc';
export interface T { name: string; site: string; email: string; place: string; kind: 'website' | 'shop' | 'app' | 'service'; accounts: boolean; content: boolean; payments: boolean; refunds: string; age: string; links: boolean; ip: boolean; changes: boolean }
export const START: T = { name: '', site: '', email: '', place: 'England and Wales', kind: 'website', accounts: false, content: false, payments: false, refunds: '14 days', age: '13', links: true, ip: true, changes: true };
export function build(t: T): { title: string; s: Section[] } {
  const n = t.name.trim() || '[Your name]', site = t.site.trim() || '[your website]', mail = t.email.trim() || '[your email]', place = t.place.trim() || '[your country]';
  const what = { website: 'website', shop: 'online shop', app: 'app', service: 'service' }[t.kind];
  const s: Section[] = [{ h: 'About these terms', p: [`These terms apply when you use ${site} (the ${what}), run by ${n}. By using it, you agree to them. If you do not agree, please do not use it.`, `Last changed on ${dateLong()}.`] }];
  if (t.age) s.push({ h: 'Who can use it', p: [`You must be at least ${t.age} years old. If you are under 18, ask a parent or guardian to read these terms with you.`] });
  if (t.accounts) s.push({ h: 'Your account', p: [bullets(['Give true and up-to-date details when you sign up.', 'Keep your password private. You are responsible for what happens in your account.', 'Tell us at once if someone else has used it.', 'We may close an account that breaks these terms.']).join('\n')] });
  if (t.payments) s.push({ h: 'Buying and paying', p: ['Prices are shown on the site and may change. The price you see when you order is the price you pay.', `If you change your mind, you can ask for your money back within ${t.refunds.trim() || '14 days'}. Write to ${mail} and we will explain how.`, 'Payments are handled by a payment company. We do not keep your full card details.'] });
  s.push({ h: 'How you can use it', p: ['Please do not:', bullets(['Break the law or help anyone else to.', 'Try to get into parts of the site that are not meant for you.', 'Send viruses or anything that could harm the site or other people.', 'Copy or collect large amounts of the site automatically.', 'Pretend to be someone else.']).join('\n')] });
  if (t.content) s.push({ h: 'What you post', p: ['You keep ownership of what you post. By posting it, you let us show it on the site and store it so the site can work.', 'You promise that what you post is yours to share and does not break the law or anyone’s rights. We may remove anything that does.'] });
  if (t.ip) s.push({ h: 'What belongs to us', p: [`The words, pictures, logos and design on the site belong to ${n} or the people who gave us permission to use them. You may view them and print a copy for yourself. You may not copy or sell them without asking first.`] });
  if (t.links) s.push({ h: 'Links to other sites', p: ['We may link to other websites. We do not control them and are not responsible for what is on them.'] });
  s.push({ h: 'No promises about the site', p: ['We try to keep the site working and correct, but it is provided as it is. It may be unavailable now and then, and we cannot promise it will be free of mistakes.'] });
  s.push({ h: 'Our responsibility', p: ['We are responsible for harm we cause by being careless, and for anything the law says we cannot limit, such as death or injury caused by our fault.', 'Apart from that, we are not responsible for losses that we could not have expected, or for lost profits or data.'] });
  if (t.changes) s.push({ h: 'Changes', p: ['We may update these terms. The new version goes on this page with a new date. If you keep using the site after that, you accept the changes.'] });
  s.push({ h: 'Ending things', p: ['You can stop using the site at any time. We can stop you using it if you break these terms.'] });
  s.push({ h: 'Which law applies', p: [`These terms follow the law of ${place}. Disagreements will be dealt with by the courts there, unless the law in your country says otherwise.`] });
  s.push({ h: 'Contact', p: [`${n}\n${mail}`] });
  return { title: `Terms of Service for ${n}`, s };
}
