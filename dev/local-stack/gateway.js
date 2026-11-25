// Passerelle locale de test imitant l'API Supabase (auth, rest, storage minimal).
// Uniquement pour les tests ; en production c'est Supabase qui fournit tout ça.
const http=require('http'),crypto=require('crypto'),fs=require('fs'),path=require('path'),{Pool}=require('pg'),Busboy=require('busboy');
const SECRET='super-secret-jwt-token-with-at-least-32-characters-long';
const pool=new Pool({connectionString:'postgres://postgres@127.0.0.1:54322/postgres'});
const ROOT='/tmp/storage';fs.mkdirSync(ROOT,{recursive:true});
function verify(t){try{const[h,p,s]=t.split('.');const e=crypto.createHmac('sha256',SECRET).update(h+'.'+p).digest('base64url');if(e!==s)return null;const o=JSON.parse(Buffer.from(p,'base64url'));if(o.exp&&o.exp<Date.now()/1000)return null;return o}catch{return null}}
function cors(res){res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE,OPTIONS')}
function proxy(req,res,port,strip){const o=http.request({host:'127.0.0.1',port,path:req.url.slice(strip.length)||'/',method:req.method,headers:{...req.headers,host:'127.0.0.1:'+port}},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res)});o.on('error',e=>{res.writeHead(502);res.end(String(e))});req.pipe(o)}
async function asUser(claims,fn){const c=await pool.connect();try{await c.query('begin');await c.query("select set_config('role',$1,true), set_config('request.jwt.claims',$2,true)",[claims.role==='service_role'?'service_role':'authenticated',JSON.stringify(claims)]);const r=await fn(c);await c.query('commit');return r}catch(e){await c.query('rollback');throw e}finally{c.release()}}
const json=(res,code,o)=>{res.writeHead(code,{'content-type':'application/json'});res.end(JSON.stringify(o))};
http.createServer(async(req,res)=>{cors(res);if(req.method==='OPTIONS'){res.writeHead(204);return res.end()}
 if(req.url.startsWith('/auth/v1'))return proxy(req,res,9999,'/auth/v1');
 if(req.url.startsWith('/rest/v1'))return proxy(req,res,3001,'/rest/v1');
 const u=new URL(req.url,'http://x');let m;
 try{
 if((m=u.pathname.match(/^\/storage\/v1\/object\/sign\/([^/]+)\/(.+)$/))){const [_,bucket,name]=m;const key=decodeURIComponent(name);
   if(req.method==='GET'){const t=verify(u.searchParams.get('token')||'');if(!t||t.url!==bucket+'/'+key)return json(res,400,{error:'invalid token'});const f=path.join(ROOT,bucket,key);if(!fs.existsSync(f))return json(res,404,{error:'not found'});res.writeHead(200,{'content-type':t.mime||'application/octet-stream'});return fs.createReadStream(f).pipe(res)}
   const claims=verify((req.headers.authorization||'').replace('Bearer ',''));if(!claims)return json(res,401,{error:'unauthorized'});
   const row=await asUser(claims,c=>c.query('select metadata from storage.objects where bucket_id=$1 and name=$2',[bucket,key]));if(!row.rows.length)return json(res,404,{statusCode:'404',error:'not_found',message:'Object not found'});
   let body='';for await(const ch of req)body+=ch;const exp=(JSON.parse(body||'{}').expiresIn)||60;
   const h=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),p=Buffer.from(JSON.stringify({url:bucket+'/'+key,mime:row.rows[0].metadata?.mimetype,exp:Math.floor(Date.now()/1000)+exp})).toString('base64url');
   const tok=h+'.'+p+'.'+crypto.createHmac('sha256',SECRET).update(h+'.'+p).digest('base64url');
   return json(res,200,{signedURL:`/object/sign/${bucket}/${encodeURI(key)}?token=${tok}`})}
 if((m=u.pathname.match(/^\/storage\/v1\/object\/([^/]+)\/(.+)$/))&&(req.method==='POST'||req.method==='PUT')){const [_,bucket,name]=m;const key=decodeURIComponent(name);
   const claims=verify((req.headers.authorization||'').replace('Bearer ',''));if(!claims)return json(res,401,{error:'unauthorized'});
   const b=(await pool.query('select * from storage.buckets where id=$1',[bucket])).rows[0];if(!b)return json(res,404,{error:'bucket not found'});
   const chunks=[];let mime=req.headers['content-type'];
   if((mime||'').startsWith('multipart/form-data')){await new Promise((ok,ko)=>{const bb=Busboy({headers:req.headers});bb.on('file',(n,f,info)=>{mime=info.mimeType;f.on('data',d=>chunks.push(d))});bb.on('close',ok);bb.on('error',ko);req.pipe(bb)})}else{for await(const ch of req)chunks.push(ch)}
   const buf=Buffer.concat(chunks);if(b.file_size_limit&&buf.length>b.file_size_limit)return json(res,413,{statusCode:'413',error:'Payload too large',message:'The object exceeded the maximum allowed size'});
   if(b.allowed_mime_types&&!b.allowed_mime_types.includes(mime))return json(res,415,{statusCode:'415',error:'invalid_mime_type',message:`mime type ${mime} is not supported`});
   try{await asUser(claims,c=>c.query('insert into storage.objects(bucket_id,name,owner,metadata) values($1,$2,$3,$4)',[bucket,key,claims.sub,{mimetype:mime,size:buf.length}]))}catch(e){return json(res,403,{statusCode:'403',error:'Unauthorized',message:'new row violates row-level security policy'})}
   const f=path.join(ROOT,bucket,key);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,buf);return json(res,200,{Key:bucket+'/'+key,Id:key})}
 if((m=u.pathname.match(/^\/storage\/v1\/object\/([^/]+)$/))&&req.method==='DELETE'){const bucket=m[1];const claims=verify((req.headers.authorization||'').replace('Bearer ',''));if(!claims)return json(res,401,{error:'unauthorized'});
   let body='';for await(const ch of req)body+=ch;const {prefixes=[]}=JSON.parse(body||'{}');
   const r=await asUser(claims,c=>c.query('delete from storage.objects where bucket_id=$1 and name = any($2) returning name',[bucket,prefixes]));
   for(const x of r.rows){try{fs.unlinkSync(path.join(ROOT,bucket,x.name))}catch{}}return json(res,200,r.rows)}
 json(res,404,{error:'not found'})}catch(e){console.error(e);json(res,500,{error:String(e)})}
}).listen(54321,'127.0.0.1',()=>console.log('gateway on 54321'));
