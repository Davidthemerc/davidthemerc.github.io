export function route(){const h=location.hash.replace(/^#/,'')||'home';const [name,...parts]=h.split('/');return {name,parts};}
export function go(path){location.hash=path;}
