(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ECU9=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const HEX=n=>'0x'+(n>>>0).toString(16).toUpperCase().padStart(8,'0');
  const view=b=>new DataView(b.buffer,b.byteOffset,b.byteLength);
  const u32=(b,a)=>view(b).getUint32(a,false);
  function sha256(input){
    const b=input instanceof Uint8Array?input:new Uint8Array(input);
    const size=Math.ceil((b.length+9)/64)*64,p=new Uint8Array(size);p.set(b);p[b.length]=128;
    const d=view(p),bitLength=b.length*8;d.setUint32(size-8,Math.floor(bitLength/4294967296),false);d.setUint32(size-4,bitLength>>>0,false);
    const k=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    const h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],w=new Uint32Array(64),rr=(x,n)=>(x>>>n)|(x<<(32-n));
    for(let offset=0;offset<size;offset+=64){
      for(let i=0;i<16;i++)w[i]=d.getUint32(offset+i*4,false);
      for(let i=16;i<64;i++){const a=w[i-15],b=w[i-2];w[i]=(w[i-16]+(rr(a,7)^rr(a,18)^(a>>>3))+w[i-7]+(rr(b,17)^rr(b,19)^(b>>>10)))>>>0;}
      let [a,b,c,e0,e,f,g,j]=h;
      for(let i=0;i<64;i++){const t1=(j+(rr(e,6)^rr(e,11)^rr(e,25))+((e&f)^(~e&g))+k[i]+w[i])>>>0,t2=((rr(a,2)^rr(a,13)^rr(a,22))+((a&b)^(a&c)^(b&c)))>>>0;j=g;g=f;f=e;e=(e0+t1)>>>0;e0=c;c=b;b=a;a=(t1+t2)>>>0;}
      [a,b,c,e0,e,f,g,j].forEach((x,i)=>{h[i]=(h[i]+x)>>>0;});
    }
    return h.map(x=>x.toString(16).padStart(8,'0')).join('');
  }
  function parseNumber(value){
    if(typeof value==='number'){if(!Number.isFinite(value))throw new Error('Informe um número finito.');return value;}
    const s=String(value).trim().replace(',','.');
    if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(s))throw new Error('Valor numérico inválido: '+String(value).slice(0,50));
    const n=Number(s);if(!Number.isFinite(n))throw new Error('Informe um número finito.');return n;
  }
  function parseBlock(text){
    const lines=String(text).trim().split(/\r?\n/);
    if(!lines[0])throw new Error('Bloco vazio.');
    const sep=lines.some(x=>x.includes('\t'))?'\t':lines.some(x=>x.includes(';'))?';':null;
    const block=lines.map(line=>(sep?line.split(sep):line.trim().split(/\s+/)).map(parseNumber));
    if(block.some(row=>row.length!==block[0].length))throw new Error('O bloco deve ser retangular.');
    return block;
  }
  function rectIndices(cols,r0,c0,r1,c1){
    const result=[];
    for(let r=Math.min(r0,r1);r<=Math.max(r0,r1);r++)for(let c=Math.min(c0,c1);c<=Math.max(c0,c1);c++)result.push(r*cols+c);
    return result;
  }
  function checkImage(b){
    if(!(b instanceof Uint8Array)||b.length!==0x200000)throw new Error('Tamanho esperado: 2 MiB (2097152 bytes).');
    const bounds=[0x140008,0x17FFE8,0x07D1C8,0x0844C8];
    if([0x15BD80,0x15BD7C,0x15BD84,0x15BD78].some((a,i)=>u32(b,a)!==bounds[i])||u32(b,0x15BD88)!==1||u32(b,0x10030)!==0x10238||u32(b,0x10034)!==0x74A44||u32(b,0x1608C8)!==0x10040)throw new Error('Metadados do checksum não correspondem ao perfil 9M55AD.');
    let principal=0,boot=0,vid=0;
    for(const [start,end] of [[bounds[0],bounds[1]],[bounds[2],bounds[3]]])for(let a=start;a<end;a+=4)principal=(principal+u32(b,a))>>>0;
    for(let a=0x10238;a<0x10238+0x74A44-3;a+=0x40)boot=(boot+u32(b,a))>>>0;
    const d=view(b);for(let a=0x100C0;a<0x10140;a+=2)vid=(vid+d.getUint16(a,false))&65535;
    const p={valid:principal===1,actual:principal,target:1,compensation:u32(b,0x15BD8C),field:0x15BD8C};
    const bt={valid:boot===u32(b,0x10038),actual:boot,target:u32(b,0x10038)};
    const vd={valid:vid===0&&b[0x100D5]===0x2A,actual:vid,target:0,marker:b[0x100D5]};
    return {principal:p,boot:bt,vid:vd,ok:p.valid&&bt.valid&&vd.valid};
  }
  function validateProfile(profile,b){
    if(!(b instanceof Uint8Array)||b.length!==profile.bytes)throw new Error('Tamanho incompatível: esta ECU usa 2 MiB.');
    const marker=profile.firmwareMarker;
    if(Array.from(b.slice(marker.address,marker.address+marker.text.length)).map(x=>String.fromCharCode(x)).join('')!==marker.text)throw new Error('Arquivo de outra estratégia: identificador 9M55AD ausente.');
    for(const g of profile.guards)for(let i=0;i<g.hex.length/2;i++)if(b[g.address+i]!==parseInt(g.hex.slice(i*2,i*2+2),16))throw new Error('Estrutura divergente do perfil fixo em '+HEX(g.address)+'.');
    if(sha256(b.slice(...profile.codeRange))!==profile.codeSHA256)throw new Error('Código de outra estratégia ou modificado: perfil fixo incompatível.');
    checkImage(b);
    for(const m of profile.maps)for(const a of m.addresses)if(!Number.isFinite(view(b).getFloat32(a,false)))throw new Error('Valor não finito na tabela '+m.name+'.');
  }
  function encode64(bytes){let s='';for(let i=0;i<bytes.length;i+=16384)s+=String.fromCharCode.apply(null,bytes.subarray(i,i+16384));return btoa(s);}
  function decode64(s){
    if(typeof s!=='string'||s.length>3000000||s.length%4||/[^A-Za-z0-9+/=]/.test(s))throw new Error('BIN embutida inválida.');
    let raw;try{raw=atob(s);}catch{throw new Error('BIN embutida inválida.');}
    if(raw.length!==0x200000)throw new Error('Tamanho da BIN embutida inválido.');
    const b=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)b[i]=raw.charCodeAt(i);return b;
  }
  class Editor {
    constructor(profile,bytes,filename='9M55AD.bin'){
      const source=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
      validateProfile(profile,source);this.profile=profile;this.maps=profile.maps;
      this.filename=String(filename).slice(0,200);this.referenceFilename=this.filename;
      this.base=source.slice();this.loaded=source.slice();this.current=source.slice();this.comparisonMode=false;
      this.baseSHA256=sha256(this.base);this.sourceSHA256=this.baseSHA256;this.history=[];this.future=[];this.revision=0;
      this.byId=new Map(this.maps.map(m=>[m.id,m]));this.allowed=new Set([0x15BD8C,0x15BD8D,0x15BD8E,0x15BD8F]);
      for(const m of this.maps)for(const a of m.addresses)for(let i=0;i<4;i++)this.allowed.add(a+i);
    }
    static compare(profile,original,modified,referenceFilename='original.bin',modifiedFilename='modificada.bin'){
      const reference=original instanceof Uint8Array?original:new Uint8Array(original);
      validateProfile(profile,reference);
      const editor=new Editor(profile,modified,modifiedFilename);
      editor.base=reference.slice();editor.baseSHA256=sha256(editor.base);
      editor.referenceFilename=String(referenceFilename).slice(0,200);editor.comparisonMode=true;return editor;
    }
    get canUndo(){return this.history.length>0;} get canRedo(){return this.future.length>0;}
    map(id){const m=this.byId.get(id);if(!m)throw new Error('Mapa não encontrado.');return m;}
    bytes(){return this.current.slice();}
    value(id,index,source='current'){
      const m=this.map(id);if(!Number.isInteger(index)||index<0||index>=m.addresses.length)throw new Error('Célula fora do mapa.');
      return view(source==='base'?this.base:this.current).getFloat32(m.addresses[index],false);
    }
    isChanged(id,index){const a=this.map(id).addresses[index];return [0,1,2,3].some(i=>this.base[a+i]!==this.current[a+i]);}
    mapStats(id){const m=this.map(id);let min=Infinity,max=-Infinity,changed=0;
      m.addresses.forEach((a,i)=>{const v=this.value(id,i);min=Math.min(min,v);max=Math.max(max,v);if(this.isChanged(id,i))changed++;});return {min,max,changed,cells:m.addresses.length};}
    changes(){const result=[];for(let i=0;i<this.current.length;i++)if(this.base[i]!==this.current[i])result.push({address:i,before:this.base[i],after:this.current[i]});return result;}
    sourceChanges(){const result=[];for(let i=0;i<this.current.length;i++)if(this.loaded[i]!==this.current[i])result.push({address:i,before:this.loaded[i],after:this.current[i]});return result;}
    comparisonSummary(){let totalBytes=0,editableBytes=0,outsideEditableBytes=0;
      for(let i=0;i<this.current.length;i++)if(this.base[i]!==this.current[i]){totalBytes++;if(this.allowed.has(i))editableBytes++;else outsideEditableBytes++;}
      return {totalBytes,editableBytes,outsideEditableBytes};}
    _commit(values,label){
      const patches=[];
      for(const [address,value] of values){if(!this.allowed.has(address))throw new Error('Endereço não permitido.');if(!Number.isInteger(value)||value<0||value>255)throw new Error('Byte inválido.');if(this.current[address]!==value)patches.push({address,before:this.current[address],after:value});}
      if(!patches.length)return false;
      for(const p of patches)this.current[p.address]=p.after;
      this.history.push({label,patches});this.future=[];this.revision++;return true;
    }
    setCells(id,cells,label='Editar células'){
      const m=this.map(id),values=new Map();
      for(const c of cells){
        if(!Number.isInteger(c.index)||c.index<0||c.index>=m.addresses.length)throw new Error('Célula fora do mapa.');
        const n=Math.fround(parseNumber(c.value));if(!Number.isFinite(n))throw new Error('Valor excede o formato float32 finito.');
        const raw=new Uint8Array(4);view(raw).setFloat32(0,n,false);
        for(let i=0;i<4;i++)values.set(m.addresses[c.index]+i,raw[i]);
      }
      return this._commit(values,label);
    }
    apply(id,indices,operation,argument){
      const n=parseNumber(argument),ops={set:()=>n,add:v=>v+n,percent:v=>v*(1+n/100),multiply:v=>v*n};
      if(!ops[operation])throw new Error('Operação desconhecida.');
      return this.setCells(id,indices.map(index=>({index,value:ops[operation](this.value(id,index))})),operation+' '+n);
    }
    restore(id,indices){const m=this.map(id),values=new Map();for(const i of indices){this.value(id,i);const a=m.addresses[i];for(let j=0;j<4;j++)values.set(a+j,this.base[a+j]);}return this._commit(values,'Restaurar seleção');}
    paste(id,start,text){
      const m=this.map(id),block=parseBlock(text),r=Math.floor(start/m.nx),c=start%m.nx;
      this.value(id,start);if(r+block.length>m.ny||c+block[0].length>m.nx)throw new Error('O bloco não cabe nos limites do mapa.');
      return this.setCells(id,block.flatMap((row,y)=>row.map((value,x)=>({index:(r+y)*m.nx+c+x,value}))),'Colar bloco');
    }
    undo(){const tx=this.history.pop();if(!tx)return false;for(const p of tx.patches)this.current[p.address]=p.before;this.future.push(tx);this.revision++;return true;}
    redo(){const tx=this.future.pop();if(!tx)return false;for(const p of tx.patches)this.current[p.address]=p.after;this.history.push(tx);this.revision++;return true;}
    checksums(){return checkImage(this.current);}
    _repaired(){const temp=this.current.slice(),s=checkImage(temp);if(!s.boot.valid||!s.vid.valid)throw new Error('Exportação bloqueada: boot ou VID inválido. O editor não altera essas regiões.');
      view(temp).setUint32(0x15BD8C,(s.principal.compensation+1-s.principal.actual)>>>0,false);
      const result=checkImage(temp);if(!result.ok)throw new Error('Não foi possível validar os três checksums.');return {bytes:temp,checksums:result};}
    calculateChecksum(){const repaired=this._repaired(),values=new Map();for(let i=0x15BD8C;i<0x15BD90;i++)values.set(i,repaired.bytes[i]);this._commit(values,'Corrigir checksum principal');return this.checksums();}
    exportBIN(){this.calculateChecksum();return {bytes:this.bytes(),checksums:this.checksums(),sha256:sha256(this.current)};}
    project(){return JSON.stringify({schema:'ecu9-project',version:2,profile:this.profile.id,filename:this.filename,
      referenceFilename:this.referenceFilename,comparisonMode:this.comparisonMode,baseSHA256:this.baseSHA256,
      sourceSHA256:this.sourceSHA256,sourceBase64:encode64(this.loaded),
      referenceBase64:this.comparisonMode?encode64(this.base):null,
      patches:this.sourceChanges().map(p=>({address:p.address,value:p.after}))});}
    static fromProject(profile,text){
      if(typeof text!=='string'||text.length>12000000)throw new Error('Projeto muito grande ou inválido.');
      let p;try{p=JSON.parse(text);}catch{throw new Error('JSON de projeto inválido.');}
      if(!p||p.schema!=='ecu9-project'||![1,2].includes(p.version)||p.profile!==profile.id)throw new Error('Formato de projeto incompatível.');
      let editor;
      if(p.version===1){
        const source=decode64(p.base64);if(sha256(source)!==p.baseSHA256)throw new Error('SHA256 da base do projeto não confere: integridade inválida.');
        editor=new Editor(profile,source,p.filename);
      }else{
        if(typeof p.comparisonMode!=='boolean')throw new Error('Modo de comparação inválido no projeto.');
        const source=decode64(p.sourceBase64);if(sha256(source)!==p.sourceSHA256)throw new Error('SHA256 da modificada não confere: integridade inválida.');
        if(p.comparisonMode){
          const reference=decode64(p.referenceBase64);if(sha256(reference)!==p.baseSHA256)throw new Error('SHA256 da original não confere: integridade inválida.');
          editor=Editor.compare(profile,reference,source,p.referenceFilename,p.filename);
        }else{
          if(p.referenceBase64!==null||p.baseSHA256!==p.sourceSHA256)throw new Error('SHA256 da base ou estrutura de referência inválidos.');
          editor=new Editor(profile,source,p.filename);
        }
      }
      if(!Array.isArray(p.patches)||p.patches.length>editor.allowed.size)throw new Error('Lista de alterações inválida.');
      const patches=new Map();for(const item of p.patches){if(!item||!Number.isInteger(item.address)||!editor.allowed.has(item.address))throw new Error('Endereço não permitido no projeto.');if(patches.has(item.address))throw new Error('Endereço duplicado no projeto.');if(!Number.isInteger(item.value)||item.value<0||item.value>255)throw new Error('Byte inválido no projeto.');patches.set(item.address,item.value);}
      const temp=editor.current.slice();for(const [a,v] of patches)temp[a]=v;
      validateProfile(profile,temp);editor._commit(patches,'Carregar projeto');return editor;
    }
    report(){const maps=[];for(const m of this.maps){const cells=[];m.addresses.forEach((a,i)=>{if(this.isChanged(m.id,i))cells.push({address:HEX(a),row:Math.floor(i/m.nx),column:i%m.nx,before:this.value(m.id,i,'base'),after:this.value(m.id,i)});});if(cells.length)maps.push({id:m.id,name:m.name,unit:m.unit,cells});}
      return {profile:this.profile.name,filename:this.filename,referenceFilename:this.referenceFilename,
        comparisonMode:this.comparisonMode,baseSHA256:this.baseSHA256,sourceSHA256:this.sourceSHA256,
        currentSHA256:sha256(this.current),checksums:this.checksums(),comparison:this.comparisonSummary(),
        sessionEdits:this.sourceChanges(),maps,bytes:this.changes(),scope:'Integridade de arquivo; não valida desempenho ou segurança mecânica.'};}
  }
  return {Editor,sha256,parseNumber,parseBlock,rectIndices,checkImage,HEX};
});
