(function(){
  'use strict';

  const PRICE_REQUEST_TEXT = 'Цена по запросу';
  const SERIES_MIN_ITEMS = 2;
  const SERIES_MAX_ITEMS_PER_CARD = 10;
  const PAGE_BOTTOM_SAFE_ZONE_MM = 6;
  const FIT_TOLERANCE_PX = 2;
  const DEFAULT_SECTION_OPTIONS = {
    image:true,
    article:true,
    description:true,
    specs:true,
    price:true
  };
  const LAYOUT_TITLES = {
    original:'Оригинальный макет',
    technical:'Техническая карточка',
    compact:'Компактная сетка',
    list:'Список с миниатюрой',
    price:'Прайс-лист'
  };

  let root = null;
  let pageNo = 1;
  let pageBottomSafeZonePx = null;

  const esc = (s)=>String(s ?? '').replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
  const compactText = (s)=>String(s ?? '').replace(/\s+/g,' ').trim();
  const formatPrice = (price)=>{
    const value = compactText(price || PRICE_REQUEST_TEXT);
    return /^цена\b/i.test(value) ? value : `Цена ${value}`;
  };

  function slug(s){
    return compactText(s).toLowerCase().replace(/[^a-zа-яё0-9]+/gi,'-').replace(/^-|-$/g,'').slice(0,50);
  }

  function pickColor(i){
    return ['#F0B000','#405C6B','#2F77A4','#78924B','#C24B38','#128A84','#D58729','#6E5BA8','#8A9A5B','#7E858B'][i%10];
  }

  function colorClass(color){
    const hex = compactText(color || '#FFB800').match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    return hex ? `accent-${hex[1].toLowerCase()}` : 'accent-default';
  }

  function normalizeCatalog(input){
    input = input || {};
    const settings = Object.assign({
      layout:'original',
      logoPath:'assets/flagman-logo.png',
      logoCoofixPath:'assets/coofix-logo.png',
      symbolPath:'assets/flagman-symbol.png',
      groupSeries:true,
      seriesMinItems:SERIES_MIN_ITEMS,
      seriesMaxItemsPerCard:SERIES_MAX_ITEMS_PER_CARD
    }, input.settings || {});
    const out = {
      brand: input.brand || {name:'FLAGMAN', subtitle:'Профессиональный инструмент'},
      settings,
      sections: []
    };
    (input.sections || []).forEach((section, sectionIndex)=>{
      const sectionId = String(section.id || slug(section.title) || `section-${sectionIndex+1}`);
      const normalizedSection = {
        id: sectionId,
        title: compactText(section.title || `Категория ${sectionIndex+1}`),
        color: section.color || pickColor(sectionIndex),
        layout: section.layout || settings.layout || 'original',
        description: compactText(section.description || ''),
        visible: section.visible !== false,
        show: Object.assign({}, DEFAULT_SECTION_OPTIONS, section.show || {}),
        count: Number(section.count) || 0,
        products: []
      };
      (section.products || []).forEach((product, productIndex)=>{
        const p = Object.assign({}, product);
        p.id = String(p.id || p.article || `${sectionId}-${productIndex+1}`).replace(/\s+/g,'-');
        p.article = compactText(p.article || '');
        p.title = compactText(p.title || 'Без названия');
        p.price = compactText(p.price || '');
        p.image = compactText(p.image || '');
        p.description = compactText(p.description || '');
        p.visible = p.visible !== false;
        p.section = sectionId;
        p.sort = Number.isFinite(Number(p.sort)) ? Number(p.sort) : productIndex * 10;
        p.specs = (p.specs || []).map((it, idx)=>({
          key: compactText(it && it.key || ''),
          value: compactText(it && it.value || ''),
          important: Boolean(it && it.important) || idx < 4
        })).filter(it=>it.key || it.value);
        normalizedSection.products.push(p);
      });
      normalizedSection.products.sort((a,b)=>(a.sort||0)-(b.sort||0));
      out.sections.push(normalizedSection);
    });
    if(!out.settings.layout){
      out.settings.layout = out.sections[0]?.layout || 'original';
    }
    return out;
  }

  function visibleProducts(section){
    return (section.products || []).filter(p=>p.visible !== false);
  }

  function specsForLayout(product){
    return (product.specs || []).filter(x=>x.key || x.value);
  }

  function ensureRoot(){
    root = document.getElementById('catalog');
    if(!root){
      root = document.createElement('main');
      root.id = 'catalog';
      document.body.prepend(root);
    }
    return root;
  }

  function footer(){
    return `<div class="footer"><span><b>FLAGMAN</b> · инструменты, оснастка и расходные материалы</span><span>${String(pageNo++).padStart(2,'0')}</span></div>`;
  }

  function displayLogoPath(logoPath){
    const path = compactText(logoPath || 'assets/flagman-logo.png').replace(/\\/g,'/');
    return /(^|\/)flagman-logo\.png$/i.test(path) ? path.replace(/flagman-logo\.png$/i, 'flagman-logo-cropped.png') : path;
  }

  function header(label, logoPath){
    const displayLogo = displayLogoPath(logoPath);
    return `<div class="header"><div class="brand"><img class="brand-logo" src="${esc(displayLogo)}" alt="FLAGMAN"></div><div class="section-label">${esc(label || 'Каталог продукции')}</div></div>`;
  }

  function coverHtml(data){
    const logoPath = displayLogoPath(data.settings.logoPath || 'assets/flagman-logo.png');
    const logoCoofixPath = 'assets/coofix-logo.png';
    return `<section class="page cover brand-cover"><div class="cover-pattern"></div><div class="cover-grid"></div><div class="cover-content logo"><div class="cover-brand-row"><div class="cover-logo-panel"><img class="cover-logo-img" src="${esc(logoPath)}" alt="FLAGMAN"></div><div class="cover-coofix-panel"><img class="cover-logo-img" src="${esc(logoCoofixPath)}" alt="COOFIX"></div></div><div class="cover-partner-pill"><span class="cover-partner-pill partner-span">Партнёр COOFIX</span><span>FLAGMAN представляет инструменты производителя COOFIX</span></div><div class="cover-kicker">Профессиональные инструменты<br>и расходные материалы</div><h1><span>Каталог</span><span>продукции</span></h1><p>Подборка инструмента, оснастки и расходников COOFIX для строительства, ремонта, монтажа и хозяйственных задач.</p><div class="cover-assurance"><div><b>PRO</b><span>Профессиональное качество</span></div><div><b>2 года</b><span>Гарантия на весь ассортимент</span></div></div><div class="cover-tags"><span>электроинструмент</span><span>оснастка</span><span>расходники</span></div></div><div class="cover-side-card"><b>FLAGMAN × COOFIX</b><span>FLAGMAN является дилером COOFIX — производителя инструментов, представленных в этом каталоге.</span></div><div class="cover-year">${new Date().getFullYear()}</div></section>`;
  }

  function backCoverHtml(data){
    const logoPath = displayLogoPath(data.settings.logoPath || 'assets/flagman-logo.png');
    const sections = (data.sections || []).filter(s=>s.visible !== false);
    const totalProducts = sections.reduce((sum, section)=>sum + visibleProducts(section).length, 0);
    return `<section class="page back-cover"><div class="back-pattern"></div><div class="back-logo-panel"><img class="back-logo-img" src="${esc(logoPath)}" alt="FLAGMAN"></div><div class="back-content"><div class="back-kicker">Свяжитесь с нами</div><h2>Подберём нужные позиции под вашу задачу</h2><p>Сообщите артикулы или пришлите список работ — поможем выбрать инструмент, расходники и подготовим предложение.</p><div class="back-contact-card"><div><span>Телефон</span><b>+7 911 399-16-44</b></div><div><span>Почта</span><b>flagman.60@bk.ru</b></div></div></div><div class="back-meta"><span>${sections.length} разделов</span><span>${totalProducts} позиций</span><span>FLAGMAN</span></div></section>`;
  }

  function tocHtml(data, sections, layout){
    const items = sections.map((s,i)=>`<div class="toc-item ${colorClass(s.color)}"><div class="toc-dot"></div><div><b>${esc(s.title)}</b><span>${visibleProducts(s).length || s.count || 0} позиций</span></div><strong>${String(i+1).padStart(2,'0')}</strong></div>`).join('');
    return `<section class="page toc"><div class="content"><h2>Содержание</h2><p class="toc-lead">Основные группы товаров для быстрого подбора: инструмент, оборудование, оснастка, защита и хозяйственные решения.</p><div class="toc-grid">${items}</div></div>${footer()}</section>`;
  }

  function sectionCoverHtml(section, index, logoPath){
    const products = visibleProducts(section);
    const description = section.description ? esc(section.description) : 'Короткая подборка товаров для рабочих задач: основные позиции, артикулы, характеристики и цены.';
    return `<section class="page section-cover ${colorClass(section.color)}"><img class="section-logo" src="${esc(displayLogoPath(logoPath))}" alt="FLAGMAN"><div class="section-cover-content"><div class="section-index">Раздел ${String(index+1).padStart(2,'0')}</div><h2>${esc(section.title)}</h2><p>${description}</p><div class="count-badge">${products.length} позиций</div></div></section>`;
  }

  function productImageHtml(product, className='print-img'){
    if(!product.image) return '';
    return `<img class="${className}" src="${esc(product.image)}" alt="${esc(product.title)}">`;
  }

  function normalizeImagePath(image){
    return compactText(image).replace(/\\/g,'/').replace(/\?.*$/,'').replace(/#.*$/,'').toLowerCase();
  }

  function isSeriesPlaceholderImage(image, settings={}){
    const normalized = normalizeImagePath(image);
    if(!normalized) return true;
    const symbolPath = normalizeImagePath(settings.symbolPath || 'assets/flagman-symbol.png');
    return normalized === symbolPath || /(^|\/)flagman-symbol\./i.test(normalized) || /(^|\/)(placeholder|no-photo|no_image|no-image)\./i.test(normalized);
  }

  function titleTokens(title){
    return compactText(title).toLowerCase().replace(/ё/g,'е').match(/[a-zа-я0-9]{3,}/g) || [];
  }

  function tokenStem(token){
    return token.replace(/(ами|ями|ого|ему|ыми|ими|ая|ое|ые|ий|ый|ой|ую|ых|их|ам|ям|ах|ях|ом|ем|ов|ев|ей|ки|ка|ку|ок|а|я|ы|и|е|у)$/i,'').slice(0,7);
  }

  function titleStemSet(title){
    const ignore = new Set(['для','при','над','под','без','или','как','что','это','шт']);
    return new Set(titleTokens(title).map(tokenStem).filter(x=>x && x.length >= 3 && !ignore.has(x)));
  }

  function titlesLookLikeOneSeries(products){
    const titles = [...new Set(products.map(p=>compactText(p.title)).filter(Boolean))];
    if(titles.length <= 1) return true;
    const sets = titles.map(titleStemSet).filter(set=>set.size);
    if(sets.length <= 1) return true;
    let common = new Set(sets[0]);
    sets.slice(1).forEach(set=>{
      common = new Set([...common].filter(x=>set.has(x)));
    });
    if(common.size >= 2) return true;
    return sets.every(set=>{
      const overlap = [...set].filter(x=>sets[0].has(x)).length;
      return overlap >= Math.min(2, Math.min(set.size, sets[0].size));
    });
  }

  function commonSeriesTitle(products){
    const titles = products.map(p=>compactText(p.title)).filter(Boolean);
    const uniqueTitles = [...new Set(titles)];
    if(!uniqueTitles.length) return 'Серия товаров';
    if(uniqueTitles.length === 1) return uniqueTitles[0];
    const tokenLists = uniqueTitles.map(titleTokens);
    const common = [];
    const minLen = Math.min(...tokenLists.map(list=>list.length));
    for(let i=0;i<minLen;i++){
      const stem = tokenStem(tokenLists[0][i]);
      if(tokenLists.every(list=>tokenStem(list[i]) === stem)) common.push(tokenLists[0][i]);
      else break;
    }
    if(common.length >= 2) return common.join(' ');
    return uniqueTitles.sort((a,b)=>a.length-b.length)[0];
  }

  function specMap(product){
    const map = new Map();
    (product.specs || []).forEach(spec=>{
      const key = compactText(spec && spec.key || '');
      const value = compactText(spec && spec.value || '');
      if(!key && !value) return;
      const normalizedKey = key.toLowerCase().replace(/ё/g,'е');
      if(!map.has(normalizedKey)) map.set(normalizedKey, {key:key || 'Характеристика', value});
    });
    return map;
  }

  function specKeyPriority(key){
    const k = String(key || '').toLowerCase().replace(/ё/g,'е');
    if(/размер|диаметр|длина|ширина|высота|толщина|глубина|сечение|зернист|объем|объ[её]м|вес|масса|количество|шт|посад|квадрат|резьба|цвет|емкость|ёмкость/.test(k)) return 0;
    if(/мощност|напряж|скорост|момент|патрон|материал|тип|ручк|рукоят/.test(k)) return 1;
    return 2;
  }

  function analyzeSeriesSpecs(products){
    const maps = products.map(specMap);
    const keyInfo = new Map();
    maps.forEach(map=>{
      map.forEach((spec, normalizedKey)=>{
        if(!keyInfo.has(normalizedKey)) keyInfo.set(normalizedKey, {key: spec.key, values: [], present: 0});
        const info = keyInfo.get(normalizedKey);
        info.values.push(spec.value);
        info.present += 1;
      });
    });
    const diff = [];
    const common = [];
    keyInfo.forEach((info, normalizedKey)=>{
      const values = info.values.map(compactText).filter(Boolean);
      const uniqueValues = [...new Set(values.map(v=>v.toLowerCase().replace(/ё/g,'е')))];
      if(info.present === products.length && uniqueValues.length === 1){
        common.push({key:info.key, value:values[0]});
      }else{
        diff.push({normalizedKey, key:info.key, score:specKeyPriority(info.key), filled:values.length});
      }
    });
    diff.sort((a,b)=>a.score-b.score || b.filled-a.filled || a.key.localeCompare(b.key, 'ru'));
    common.sort((a,b)=>specKeyPriority(a.key)-specKeyPriority(b.key));
    return {diffKeys: diff.slice(0, 3), commonSpecs: common.slice(0, 3)};
  }

  function seriesVariantText(product, diffKeys){
    const map = specMap(product);
    const parts = diffKeys.map(info=>{
      const spec = map.get(info.normalizedKey);
      const value = compactText(spec && spec.value || '');
      return value ? `${info.key}: ${value}` : '';
    }).filter(Boolean);
    if(parts.length) return parts.join(' · ');
    return compactText(product.title || 'Вариант');
  }

  function chunkArray(items, size){
    const chunks = [];
    for(let i=0;i<items.length;i+=size) chunks.push(items.slice(i, i + size));
    return chunks;
  }

  function createSeriesUnits(products, section, fullGroupSize){
    const settings = (window.FLAGMAN_CATALOG_DATA && window.FLAGMAN_CATALOG_DATA.settings) || {};
    const maxItems = Math.max(4, Number(settings.seriesMaxItemsPerCard || SERIES_MAX_ITEMS_PER_CARD));
    const chunks = chunkArray(products, maxItems);
    const title = commonSeriesTitle(products);
    const analysis = analyzeSeriesSpecs(products);
    return chunks.map((chunk, chunkIndex)=>({
      type:'series',
      section: section.id,
      title,
      image: products[0]?.image || '',
      products: chunk,
      fullProducts: products,
      totalCount: fullGroupSize || products.length,
      chunkIndex,
      chunkStart: chunkIndex * maxItems + 1,
      chunkEnd: chunkIndex * maxItems + chunk.length,
      diffKeys: analysis.diffKeys,
      commonSpecs: analysis.commonSpecs
    }));
  }

  function buildSeriesLayoutUnits(section, products, layout){
    const settings = (window.FLAGMAN_CATALOG_DATA && window.FLAGMAN_CATALOG_DATA.settings) || {};
    if(settings.groupSeries === false || layout === 'price') return products.map((product, order)=>({type:'product', product, order}));
    const minItems = Math.max(2, Number(settings.seriesMinItems || SERIES_MIN_ITEMS));
    const imageGroups = new Map();
    const consumed = new Set();
    products.forEach((product, order)=>{
      product.__layoutOrder = order;
      if(isSeriesPlaceholderImage(product.image, settings)) return;
      const key = normalizeImagePath(product.image);
      if(!imageGroups.has(key)) imageGroups.set(key, []);
      imageGroups.get(key).push(product);
    });
    const entries = [];
    imageGroups.forEach(group=>{
      if(group.length < minItems) return;
      let clusters = [];
      if(titlesLookLikeOneSeries(group)){
        clusters = [group];
      }else{
        group.forEach(product=>{
          let target = clusters.find(cluster=>titlesLookLikeOneSeries(cluster.concat(product)));
          if(!target){
            target = [];
            clusters.push(target);
          }
          target.push(product);
        });
      }
      clusters.forEach(cluster=>{
        if(cluster.length < minItems) return;
        cluster.forEach(product=>consumed.add(product));
        const order = Math.min(...cluster.map(product=>product.__layoutOrder || 0));
        createSeriesUnits(cluster, section, cluster.length).forEach((unit, offset)=>entries.push({order: order + offset / 100, unit}));
      });
    });
    products.forEach((product, order)=>{
      if(!consumed.has(product)) entries.push({order, unit:{type:'product', product, order}});
      delete product.__layoutOrder;
    });
    entries.sort((a,b)=>a.order-b.order);
    return entries.map(entry=>entry.unit);
  }

  function seriesCardHtml(unit, section, layout){
    const show = Object.assign({}, DEFAULT_SECTION_OPTIONS, section.show || {});
    const title = unit.title || 'Серия товаров';
    const totalText = unit.totalCount > unit.products.length ? `${unit.chunkStart}–${unit.chunkEnd} из ${unit.totalCount}` : `${unit.products.length} вариантов`;
    const commonHtml = unit.commonSpecs && unit.commonSpecs.length
      ? `<div class="series-common">${unit.commonSpecs.map(x=>`<span><b>${esc(x.key)}</b>: ${esc(x.value)}</span>`).join('')}</div>`
      : '';
    const variants = unit.products.map(product=>{
      const article = show.article ? `<span class="series-article">${esc(product.article || '—')}</span>` : '';
      const diff = `<span class="series-diff">${esc(seriesVariantText(product, unit.diffKeys || []))}</span>`;
      const price = show.price ? `<span class="series-price">${esc(product.price || PRICE_REQUEST_TEXT)}</span>` : '';
      return `<div class="series-variant">${article}${diff}${price}</div>`;
    }).join('');
    const img = show.image && unit.image ? `<img class="series-img" src="${esc(unit.image)}" alt="${esc(title)}">` : '<div class="no-img">Фото не указано</div>';
    const manyClass = unit.products.length > 6 ? ' series-variants-two' : '';
    const chunkLabel = unit.totalCount > unit.products.length ? `<span class="series-chunk">${esc(totalText)}</span>` : '';
    return `<article class="series-card layout-${esc(layout)}"><div class="series-image-box">${img}</div><div class="series-body"><div class="series-head"><div><div class="series-kicker">Серия</div><h3>${esc(title)}</h3></div><div class="series-count">${esc(totalText)}</div></div>${commonHtml}<div class="series-variants${manyClass}">${variants}</div>${chunkLabel}</div></article>`;
  }

  function productCardHtml(product, section, layout){
    const show = Object.assign({}, DEFAULT_SECTION_OPTIONS, section.show || {});
    const specs = show.specs ? specsForLayout(product) : [];
    const specHtml = specs.length ? `<div class="specs">${specs.map(x=>`<div class="spec spec-row"><b class="spec-key">${esc(x.key || 'Характеристика')}</b><span class="spec-value">${esc(x.value || '—')}</span></div>`).join('')}</div>` : '';
    const desc = show.description && product.description ? `<p class="desc">${esc(product.description)}</p>` : '';
    const code = show.article && product.article ? `<div class="code product-code">${esc(product.article)}</div>` : '';
    const identity = `<div class="product-identity"><h3 class="product-title">${esc(product.title)}</h3></div>`;
    const price = show.price ? `<div class="price product-price">${esc(formatPrice(product.price))}</div>` : '';
    const meta = price || code ? `<div class="product-meta">${price}${code}</div>` : '';
    const img = show.image ? productImageHtml(product) : '';
    const body = `<div class="card-body card-text">${identity}${desc}${specHtml}${meta}</div>`;
    if(layout === 'original'){
      return `<article class="product-card original"><div class="image-box">${img || '<div class="no-img">Фото не указано</div>'}</div>${body}</article>`;
    }
    if(layout === 'list'){
      return `<article class="product-card list">${img ? `<div class="image-box">${img}</div>` : '<div class="image-box no-photo-box"><div class="no-img">—</div></div>'}${body}</article>`;
    }
    return `<article class="product-card ${esc(layout)}">${body}${img ? `<div class="image-box">${img}</div>` : ''}</article>`;
  }

  function priceRowHtml(product, section){
    const show = Object.assign({}, DEFAULT_SECTION_OPTIONS, section.show || {});
    const specs = show.specs ? specsForLayout(product) : [];
    const specHtml = specs.length ? `<div class="price-specs">${specs.map(x=>`<div class="price-spec"><b>${esc(x.key || 'Характеристика')}</b><span>${esc(x.value || '—')}</span></div>`).join('')}</div>` : '<span class="muted-dash">—</span>';
    const img = show.image && product.image ? `<img class="table-img" src="${esc(product.image)}" alt="${esc(product.title)}">` : '';
    return `<div class="price-row"><div class="price-cell price-photo">${img}</div><div class="price-cell price-article">${show.article ? esc(product.article || '—') : ''}</div><div class="price-cell price-name"><b>${esc(product.title)}</b>${show.description && product.description ? `<span class="price-desc">${esc(product.description)}</span>` : ''}</div><div class="price-cell price-spec-cell">${specHtml}</div><div class="price-cell price-value">${show.price ? esc(product.price || PRICE_REQUEST_TEXT) : ''}</div></div>`;
  }

  function htmlToElement(html){
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    return tpl.content.firstElementChild;
  }

  function layoutColumns(layout){
    return (layout === 'original' || layout === 'technical' || layout === 'compact') ? 2 : 1;
  }

  function createProductsPage(section, layout, logoPath){
    const page = document.createElement('section');
    page.className = `page products-page layout-${layout} ${colorClass(section.color)}`;
    if(layout === 'price'){
      page.innerHTML = `${header(section.title, logoPath)}<div class="content"><div class="price-list"><div class="price-list-header"><div>Фото</div><div>Артикул</div><div>Название</div><div>Характеристики</div><div>Цена</div></div></div></div>${footer()}`;
    }else{
      page.innerHTML = `${header(section.title, logoPath)}<div class="content product-flow"></div>${footer()}`;
    }
    return page;
  }

  function makeRow(units, section, layout, variant='auto'){
    const row = document.createElement('div');
    const hasSeries = units.some(unit=>unit && unit.type === 'series');
    const isWide = hasSeries || variant === 'wide' || units.length === 1;
    row.className = `product-row${isWide ? ' single wide' : ''}${hasSeries ? ' series-row' : ''}`;
    units.forEach(unit=>{
      if(unit && unit.type === 'series'){
        row.appendChild(htmlToElement(seriesCardHtml(unit, section, layout)));
      }else{
        const product = unit && unit.type === 'product' ? unit.product : unit;
        row.appendChild(htmlToElement(productCardHtml(product, section, layout)));
      }
    });
    return row;
  }

  function mmToPx(mm){
    const probe = document.createElement('div');
    probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;height:${mm}mm;width:0;`;
    document.body.appendChild(probe);
    const px = probe.getBoundingClientRect().height;
    probe.remove();
    return px || mm * 96 / 25.4;
  }

  function ensureSafeZonePx(){
    if(pageBottomSafeZonePx == null) pageBottomSafeZonePx = mmToPx(PAGE_BOTTOM_SAFE_ZONE_MM);
    return pageBottomSafeZonePx;
  }

  function lockRowHeight(row){
    const cards = Array.from(row.querySelectorAll('.product-card'));
    cards.forEach(card=>{ card.style.minHeight = ''; });
    const maxHeight = Math.max(0, ...cards.map(card=>card.getBoundingClientRect().height));
    if(maxHeight){
      const locked = Math.ceil(maxHeight);
      cards.forEach(card=>{ card.style.minHeight = `${locked}px`; });
    }
  }

  function flowHeight(flow){
    const children = Array.from(flow.children);
    if(!children.length) return 0;
    const first = children[0].getBoundingClientRect();
    const last = children[children.length - 1].getBoundingClientRect();
    return last.bottom - first.top;
  }

  function pageFits(page, layout){
    const content = page.querySelector('.content');
    if(!content) return true;
    const safePx = ensureSafeZonePx();
    if(layout === 'price'){
      const list = page.querySelector('.price-list');
      if(!list) return true;
      return list.getBoundingClientRect().height <= content.clientHeight - safePx + FIT_TOLERANCE_PX;
    }
    const flow = page.querySelector('.product-flow');
    if(!flow) return true;
    return flowHeight(flow) <= content.clientHeight - safePx + FIT_TOLERANCE_PX;
  }

  function finalBalancedPlans(units, startIndex, columns){
    if(columns !== 2) return null;
    const rest = units.slice(startIndex);
    if(rest.some(unit=>unit.type === 'series')) return null;
    if(rest.length < 1 || rest.length > 4) return null;
    if(rest.length === 1) return [[rest[0]]];
    if(rest.length === 2) return [[rest[0]], [rest[1]]];
    if(rest.length === 3) return [[rest[0], rest[1]], [rest[2]]];
    return [[rest[0], rest[1]], [rest[2]], [rest[3]]];
  }

  function tryFinalBalancedRows(page, units, unitIndex, section, layout, columns){
    const flow = page.querySelector('.product-flow');
    const plans = finalBalancedPlans(units, unitIndex, columns);
    if(!flow || !plans) return null;
    const rows = [];
    plans.forEach(group=>{
      const row = makeRow(group, section, layout, group.length === 1 ? 'wide' : 'auto');
      flow.appendChild(row);
      lockRowHeight(row);
      rows.push(row);
    });
    if(pageFits(page, layout)) return plans;
    rows.forEach(row=>row.remove());
    return null;
  }

  function nextRowUnits(units, index, columns){
    const current = units[index];
    if(!current) return [];
    if(current.type === 'series') return [current];
    if(columns === 2 && units[index + 1] && units[index + 1].type !== 'series'){
      return [current, units[index + 1]];
    }
    return [current];
  }

  function renderCardProductPages(section, products, layout, logoPath){
    const columns = layoutColumns(layout);
    const units = buildSeriesLayoutUnits(section, products, layout);
    let index = 0;
    while(index < units.length){
      const page = createProductsPage(section, layout, logoPath);
      root.appendChild(page);
      const flow = page.querySelector('.product-flow');
      let rowsOnPage = 0;
      const finalPlans = tryFinalBalancedRows(page, units, index, section, layout, columns);
      if(finalPlans){
        index = units.length;
        continue;
      }
      while(index < units.length){
        const rowUnits = nextRowUnits(units, index, columns);
        const count = rowUnits.length;
        const row = makeRow(rowUnits, section, layout);
        flow.appendChild(row);
        lockRowHeight(row);
        if(pageFits(page, layout)){
          index += count;
          rowsOnPage += 1;
          continue;
        }
        row.remove();
        if(columns === 2 && count === 2){
          const wideRow = makeRow([units[index]], section, layout, 'wide');
          flow.appendChild(wideRow);
          lockRowHeight(wideRow);
          if(pageFits(page, layout) || rowsOnPage === 0){
            if(!pageFits(page, layout)) page.classList.add('has-oversize-row');
            index += 1;
            rowsOnPage += 1;
            break;
          }
          wideRow.remove();
        }
        if(rowsOnPage === 0){
          const forcedRow = makeRow([units[index]], section, layout, 'wide');
          flow.appendChild(forcedRow);
          lockRowHeight(forcedRow);
          page.classList.add('has-oversize-row');
          index += 1;
        }
        break;
      }
    }
  }

  function renderPricePages(section, products, logoPath){
    let index = 0;
    while(index < products.length){
      const page = createProductsPage(section, 'price', logoPath);
      root.appendChild(page);
      const list = page.querySelector('.price-list');
      let rowsOnPage = 0;
      while(index < products.length){
        const row = htmlToElement(priceRowHtml(products[index], section));
        list.appendChild(row);
        if(pageFits(page, 'price')){
          index += 1;
          rowsOnPage += 1;
          continue;
        }
        row.remove();
        if(rowsOnPage === 0){
          list.appendChild(row);
          page.classList.add('has-oversize-row');
          index += 1;
        }
        break;
      }
    }
  }

  function renderProductPages(section, layout, logoPath){
    const products = visibleProducts(section);
    if(!products.length) return;
    if(layout === 'price'){
      renderPricePages(section, products, logoPath);
    }else{
      renderCardProductPages(section, products, layout, logoPath);
    }
  }

  function addPrintTip(){
    if(document.querySelector('.print-tip')) return;
    const tip = document.createElement('div');
    tip.className = 'print-tip';
    tip.innerHTML = 'Готово к печати в PDF: A4, масштаб 100%, печать фона. <button type="button">Печать / PDF</button>';
    tip.querySelector('button').addEventListener('click', ()=>window.print());
    document.body.appendChild(tip);
  }

  function renderCatalog(rawData){
    const data = normalizeCatalog(rawData);
    const layout = data.settings.layout || 'original';
    const logoPath = displayLogoPath(data.settings.logoPath || 'assets/flagman-logo.png');
    const sections = data.sections.filter(s=>s.visible !== false);
    pageNo = 1;
    pageBottomSafeZonePx = null;
    ensureRoot();
    root.innerHTML = '';
    root.insertAdjacentHTML('beforeend', coverHtml(data));
    root.insertAdjacentHTML('beforeend', tocHtml(data, sections, layout));
    sections.forEach((section, index)=>{
      root.insertAdjacentHTML('beforeend', sectionCoverHtml(section, index, logoPath));
      renderProductPages(section, layout, logoPath);
    });
    root.insertAdjacentHTML('beforeend', backCoverHtml(data));
    window.__CATALOG_RENDERED__ = true;
    addPrintTip();
  }

  function showMissingDataError(){
    ensureRoot();
    root.innerHTML = '<section class="page"><div class="content"><h1>Данные каталога не загружены</h1><p>Положите файл <b>catalog-data.js</b> рядом с этой страницей и откройте каталог через локальный сервер или браузер, разрешающий локальные скрипты.</p></div></section>';
  }

  function boot(){
    if(!window.FLAGMAN_CATALOG_DATA){
      showMissingDataError();
      return;
    }
    renderCatalog(window.FLAGMAN_CATALOG_DATA);
  }

  window.FLAGMAN_RENDER_CATALOG = renderCatalog;
  window.printCatalog = ()=>window.print();

  document.addEventListener('DOMContentLoaded',()=>{
    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready.catch(()=>{}) : Promise.resolve();
    const loadReady = document.readyState === 'complete' ? Promise.resolve() : new Promise(resolve=>window.addEventListener('load', resolve, {once:true}));
    Promise.all([fontsReady, loadReady]).then(boot);
  });
})();
