const c=require('crypto');const s='super-secret-jwt-token-with-at-least-32-characters-long';
const b=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
const sign=p=>{const h=b({alg:'HS256',typ:'JWT'}),q=b(p);return h+'.'+q+'.'+c.createHmac('sha256',s).update(h+'.'+q).digest('base64url')};
const exp=Math.floor(Date.now()/1000)+10*365*86400;
console.log('ANON='+sign({iss:'supabase-local',role:'anon',exp}));console.log('SERVICE='+sign({iss:'supabase-local',role:'service_role',exp}));
