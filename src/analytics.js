const SITE_URL='https://riceai88.github.io/awesome-paper-research-skills/';

const TRACKER_URL='https://cloud.umami.is/script.js';
const WEBSITE_ID='f9eb8025-865b-4ddb-b00e-510bb13e56f5';
let started=false;

export function startAnalytics() {
 const site=new URL(SITE_URL);
 if(started || location.origin!==site.origin || !location.pathname.startsWith(site.pathname) || navigator.webdriver)return;
 started=true;
 // Keep the incoming campaign even if the visitor filters before the tracker loads.
 const entryURL=location.pathname+location.search,entryTitle=document.title,referrer=document.referrer;
 const script=document.createElement('script');
 script.src=TRACKER_URL;
 script.async=true;
 script.defer=true;
 script.dataset.websiteId=WEBSITE_ID;
 // This directory uses hash state for filters; count only the document entry.
 script.dataset.autoTrack='false';
 script.dataset.domains=site.hostname;
 script.addEventListener('load',()=>{
  try {
   Promise.resolve(window.umami?.track(props=>({...props,url:entryURL,title:entryTitle,referrer}))).catch(()=>{});
  } catch { /* Analytics must never interrupt browsing. */ }
 },{once:true});
 document.head.append(script);
}
