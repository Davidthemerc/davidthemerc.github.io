import {exportStores,importStores} from './db.js';
export async function exportBackup(){const data=await exportStores();return {app:'Recipe Manager',version:'0.1.0',exportedAt:new Date().toISOString(),data};}
export async function importBackup(obj,replace=false){if(!obj||obj.app!=='Recipe Manager'||!obj.data)throw new Error('This is not a valid Recipe Manager backup.');await importStores(obj.data,{replace});}
