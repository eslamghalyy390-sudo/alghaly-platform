'use client';
import {useEffect,useState} from 'react';
import {api} from '../lib';

export function PageHeader({title,subtitle,action}:{title:string;subtitle?:string;action?:React.ReactNode}){
  return <div className="section-head"><div><h2 style={{margin:'0 0 5px'}}>{title}</h2>{subtitle&&<div className="muted">{subtitle}</div>}</div>{action}</div>
}
export function Modal({title,onClose,children,wide=false}:{title:string;onClose:()=>void;children:React.ReactNode;wide?:boolean}){
 return <div className="modal"><div className="modalbox" style={wide?{width:'min(900px,96vw)'}:undefined}><div className="section-head"><h3>{title}</h3><button className="btn secondary" onClick={onClose}>×</button></div>{children}</div></div>
}
export function StatusBadge({children,tone='blue'}:{children:React.ReactNode;tone?:'green'|'orange'|'red'|'blue'}){return <span className={`badge ${tone}`}>{children}</span>}
export function SearchBox({value,onChange,placeholder='بحث...'}:{value:string;onChange:(v:string)=>void;placeholder?:string}){return <input className="input" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>} 
export function useResource<T=any>(path:string){const[data,setData]=useState<T[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''); const load=()=>{setLoading(true);api(path).then(x=>setData(Array.isArray(x)?x:[])).catch(e=>setError(e.message)).finally(()=>setLoading(false))}; useEffect(load,[]); return {data,setData,loading,error,load};}
export async function removeResource(path:string){await api(path,{method:'DELETE'})}
