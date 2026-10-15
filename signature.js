const $=i=>document.getElementById(i);
function draw(){
  $('s-n').textContent=$('n').value.trim();
  $('s-t').textContent=$('t').value.trim();
  const p=$('p').value.trim(), e=$('e').value.trim();
  $('s-p').textContent=p; $('s-p').href='tel:'+p.replace(/[^0-9+]/g,'').replace(/^0/,'+44');
  $('s-e').textContent=e; $('s-e').href='mailto:'+e;
}
['n','t','p','e'].forEach(i=>$(i).addEventListener('input',draw)); draw();
// The logo is 166 x 55 at 100%. Width and height are written as attributes too, because Outlook reads those.
function size(){
  const pct=Number($('z').value), w=Math.round(166*pct/100), h=Math.round(55*pct/100), img=$('s-logo');
  img.setAttribute('width',w); img.setAttribute('height',h); img.style.width=w+'px'; img.style.height=h+'px';
  $('zo').textContent=pct+'%';
}
$('z').addEventListener('input',size); size();
$('copy').addEventListener('click',async()=>{
  const el=$('sig'); let ok=false;
  try{
    await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([el.innerHTML],{type:'text/html'}),'text/plain':new Blob([el.innerText],{type:'text/plain'})})]); ok=true;
  }catch(err){
    const r=document.createRange(); r.selectNodeContents(el); const s=getSelection(); s.removeAllRanges(); s.addRange(r);
    try{ok=document.execCommand('copy')}catch(e2){} s.removeAllRanges();
  }
  $('done').textContent=ok?'Copied. Now paste it into Outlook.':'Could not copy. Select the signature above and copy it yourself.';
});
