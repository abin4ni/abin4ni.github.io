// StudyOS A4 correction sheets. Render one reusable canvas at print resolution.
const studyReviewPdf=(()=>{
  const width=595.28,height=841.89,scale=2.5,margin=42,top=61,bottom=height-45;
  const fontFamily='"PingFang TC","Microsoft JhengHei","LINE Seed TW",Arial,"Cambria Math",sans-serif';
  const styles={
    title:{size:23,leading:35,weight:700,color:'#3b2418'},
    heading:{size:12,leading:20,weight:700,color:'#3b2418'},
    body:{size:11,leading:17,weight:400,color:'#262422'},
    meta:{size:10,leading:16,weight:400,color:'#584a40'},
    folio:{size:9,leading:14,weight:400,color:'#66564a'},
  };
  const words=typeof Intl.Segmenter==='function'?new Intl.Segmenter('zh-Hant',{granularity:'word'}):null;
  const graphemes=typeof Intl.Segmenter==='function'?new Intl.Segmenter('zh-Hant',{granularity:'grapheme'}):null;
  const segments=(value,segmenter)=>segmenter?[...segmenter.segment(value)].map(part=>part.segment):Array.from(value);
  function setStyle(ctx,style){
    ctx.font=style.weight+' '+style.size+'px '+fontFamily;
    ctx.fillStyle=style.color;
  }
  function wrap(ctx,value,maxWidth){
    const lines=[];
    for(const paragraph of String(value).split(/\r\n?|\n/)){
      const lineStart=lines.length;
      let line='';
      for(const token of segments(paragraph,words)){
        if(ctx.measureText(line+token).width<=maxWidth){
          line+=token;
          continue;
        }
        if(line.trim())lines.push(line.trimEnd());
        line='';
        if(!token.trim())continue;
        if(ctx.measureText(token).width<=maxWidth){line=token;continue;}
        for(const unit of segments(token,graphemes)){
          if(line&&ctx.measureText(line+unit).width>maxWidth){
            lines.push(line);
            line='';
          }
          line+=unit;
        }
      }
      if(line||lines.length===lineStart)lines.push(line.trimEnd());
    }
    return lines;
  }
  function paginate(ctx,{paper,rows,withExplanations}){
    const pages=[[]];
    let y=top;
    const contentWidth=width-margin*2;
    const gap=height=>({height});
    const rule={height:18,rule:true};
    const noteLines=[{height:17,rule:true},{height:17,rule:true}];
    function textLines(value,style=styles.body,indent=0,firstPrefix='',hanging=0){
      setStyle(ctx,style);
      const wrapped=wrap(ctx,value,contentWidth-indent-hanging);
      return wrapped.map((text,index)=>({
        text:(index===0?firstPrefix:'')+text,style,height:style.leading,indent:indent+(index===0?0:hanging)
      }));
    }
    function pageBreak(){
      pages.push([]);
      y=top;
    }
    function ensure(need){
      if(y>top&&need>bottom-y)pageBreak();
    }
    const measure=lines=>lines.reduce((sum,line)=>sum+line.height,0);
    function place(lines){
      for(const line of lines){
        if(line.text===undefined&&!line.rule&&y+line.height>bottom)continue;
        ensure(line.height);
        pages.at(-1).push({...line,y});
        y+=line.height;
      }
    }
    place([
      ...textLines('試卷訂正 · '+paper.scope,styles.title),
      ...textLines(paper.subject+'　·　'+paper.year+' 年度　·　'+paper.school,styles.heading),
      ...textLines('作答日期 '+paper.date+'　·　共 '+rows.length+' 題',styles.meta),
      rule,
    ]);
    let previousGroup=null;
    for(const question of rows){
      const core=[
        ...textLines(question.number+'　·　'+question.status,styles.heading),
        ...textLines(question.stem),
        ...question.hints.flatMap(hint=>textLines(hint,styles.meta)),
        ...question.options.flatMap(option=>textLines(option.text,styles.body,4,option.code+'.  ',20)),
        gap(4),
      ];
      const answers=[
        ...textLines('我的答案　'+question.response,styles.meta),
        ...textLines('正解　'+question.answer,styles.meta),
      ];
      const explanation=withExplanations&&question.explanation?[
        gap(5),...textLines('詳解',styles.heading),...textLines(question.explanation)
      ]:[];
      const correction=[gap(6),...textLines('訂正筆記',styles.meta),...noteLines];
      const whole=measure(core)+measure(answers)+measure(explanation)+measure(correction);
      if(question.group&&question.group!==previousGroup){
        const groupHeading=textLines('共用題組　'+question.group.label,styles.heading);
        const groupText=textLines(question.group.text);
        const groupSize=measure(groupHeading)+measure(groupText)+9;
        // Keep a short passage with its first question when both fit on an A4 page.
        if(groupSize+whole<=bottom-top)ensure(groupSize+whole);
        else ensure(measure(groupHeading)+measure(groupText.slice(0,2)));
        place([...groupHeading,...groupText,gap(9)]);
      }
      previousGroup=question.group;
      if(whole<=bottom-top)ensure(whole);
      else{
        const coreSize=measure(core);
        ensure(coreSize<=bottom-top?coreSize:measure(core.slice(0,3)));
      }
      place(core);
      if(measure(answers)<=bottom-top)ensure(measure(answers));
      place(answers);
      if(explanation.length){
        ensure(measure(explanation.slice(0,3)));
        place(explanation);
      }
      ensure(measure(correction));
      place(correction);
      if(y+12<=bottom)place([gap(12)]);
    }
    return pages;
  }
  function drawPage(ctx,lines,i,count){
    ctx.fillStyle='#fff';
    ctx.fillRect(0,0,width+1,height+1);
    ctx.textBaseline='alphabetic';
    setStyle(ctx,styles.folio);
    ctx.fillText('StudyOS  /  試卷訂正',margin,37);
    const pageNumber=(i+1)+' / '+count;
    ctx.fillText(pageNumber,width-margin-ctx.measureText(pageNumber).width,height-23);
    ctx.strokeStyle='#c5b8a9';
    ctx.lineWidth=.45;
    for(const line of lines){
      if(line.rule){
        ctx.beginPath();
        ctx.moveTo(margin,line.y+7);
        ctx.lineTo(width-margin,line.y+7);
        ctx.stroke();
      }else if(line.text!==undefined){
        setStyle(ctx,line.style);
        ctx.fillText(line.text,margin+line.indent,line.y+line.style.size);
      }
    }
  }
  function jpeg(canvas){
    return new Promise((resolve,reject)=>{
      canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Canvas export failed')),'image/jpeg',.92);
    });
  }
  function packPdf(images,pixelWidth,pixelHeight){
    const encoder=new TextEncoder(),parts=[],offsets=[0];
    let length=0;
    function append(...values){
      for(const value of values){
        const part=typeof value==='string'?encoder.encode(value):value;
        parts.push(part);
        length+=part instanceof Blob?part.size:part.byteLength;
      }
    }
    function object(id,...body){
      offsets[id]=length;
      append(id+' 0 obj\n',...body,'\nendobj\n');
    }
    append('%PDF-1.4\n',new Uint8Array([37,226,227,207,211,10]));
    object(1,'<< /Type /Catalog /Pages 2 0 R >>');
    const pageIds=images.map((_,i)=>3+i*3);
    object(2,'<< /Type /Pages /Count '+images.length+' /Kids ['+pageIds.map(id=>id+' 0 R').join(' ')+'] >>');
    const paint='q\n'+width+' 0 0 '+height+' 0 0 cm\n/Im0 Do\nQ\n';
    for(const [i,image] of images.entries()){
      const id=pageIds[i],imageId=id+1,streamId=id+2;
      object(id,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+width+' '+height+
        '] /Resources << /XObject << /Im0 '+imageId+' 0 R >> >> /Contents '+streamId+' 0 R >>');
      object(imageId,'<< /Type /XObject /Subtype /Image /Width '+pixelWidth+' /Height '+pixelHeight+
        ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+image.size+' >>\nstream\n',image,'\nendstream');
      object(streamId,'<< /Length '+paint.length+' >>\nstream\n'+paint+'endstream');
    }
    const xref=length;
    append('xref\n0 '+offsets.length+'\n0000000000 65535 f \n');
    for(const offset of offsets.slice(1))append(String(offset).padStart(10,'0')+' 00000 n \n');
    append('trailer\n<< /Size '+offsets.length+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n');
    return new Blob(parts,{type:'application/pdf'});
  }
  async function create(model,signal){
    if(document.fonts)await Promise.allSettled([
      document.fonts.load('400 11px "LINE Seed TW"','訂正'),
      document.fonts.load('700 12px "LINE Seed TW"','試卷'),
    ]);
    if(signal.aborted)throw new DOMException('Cancelled','AbortError');
    const canvas=document.createElement('canvas');
    canvas.width=Math.ceil(width*scale);
    canvas.height=Math.ceil(height*scale);
    const pixelWidth=canvas.width,pixelHeight=canvas.height;
    const ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx)throw new Error('Canvas is unavailable');
    ctx.setTransform(pixelWidth/width,0,0,pixelHeight/height,0,0);
    try{
      const pages=paginate(ctx,model),images=[];
      for(const [index,lines] of pages.entries()){
        if(signal.aborted)throw new DOMException('Cancelled','AbortError');
        drawPage(ctx,lines,index,pages.length);
        images.push(await jpeg(canvas));
      }
      return packPdf(images,pixelWidth,pixelHeight);
    }finally{
      canvas.width=1;
      canvas.height=1;
    }
  }
  return {create};
})();

