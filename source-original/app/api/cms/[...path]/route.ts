import {cmsAPI} from '../../../../lib/cms';
export const GET=(r:Request)=>cmsAPI(r,new URL(r.url).pathname.replace('/api/cms/',''));
export const POST=GET;
