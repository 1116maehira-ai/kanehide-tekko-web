import {json,publicPosts} from '../../../lib/cms';
export async function GET(){try{return json({posts:await publicPosts()});}catch(e){console.error('content unavailable',e);return json({error:'記事を読み込めませんでした。'},503);}}
