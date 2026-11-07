/**
 * The first-visit page-load sequence on the home page: the logo builds, slides aside, APPS arrives with the line under it,
 * then the black panel shrinks up into the hero. Runs from an inline script so the page never flashes before it starts.
 * Plays once per browser session. Skipped with "calm" motion, with reduced-motion on, or by clicking or pressing a key.
 * With scripting off nothing is hidden: the CSS only hides things once <html> has the "intro" class.
 */
export const INTRO_SCRIPT = `(function(){try{var d=document.documentElement,s=window.sessionStorage;
if(d.dataset.motion==='calm'||matchMedia('(prefers-reduced-motion: reduce)').matches||s.getItem('pmc:intro')){return}
s.setItem('pmc:intro','1');d.classList.add('intro');var t=[];
function end(){t.forEach(clearTimeout);d.classList.add('settle','done');removeEventListener('pointerdown',end);removeEventListener('keydown',end)}
function skip(){d.classList.add('skip');end()}
addEventListener('pointerdown',skip);addEventListener('keydown',skip);
requestAnimationFrame(function(){requestAnimationFrame(function(){d.classList.add('go')})});
t.push(setTimeout(function(){d.classList.add('settle')},3050));
t.push(setTimeout(end,4100));
}catch(e){document.documentElement.classList.remove('intro')}})();`;
