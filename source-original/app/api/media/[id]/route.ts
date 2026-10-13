import {serveMedia} from '../../../../lib/cms';
export const GET=(r:Request)=>serveMedia(r,new URL(r.url).pathname.split('/').pop()||'');
