import { useEffect, useMemo, useRef, useState } from "react";
import {
  PiArrowRight,
  PiArrowLeft,
  PiCheck,
  PiCloudArrowUp,
  PiCrop,
  PiDownloadSimple,
  PiImageSquare,
  PiPalette,
  PiPencilSimple,
  PiRectangle,
  PiSquare,
  PiArrowClockwise,
  PiShieldCheck,
  PiSparkle,
  PiTextAa,
  PiX,
} from "react-icons/pi";
import { buildPrompt } from "./prompt-builder";
import illustrationPreview from "./assets/style-preview-illustration-v3.png";
import chinesePreview from "./assets/style-preview-chinese-v3.png";
import comicPreview from "./assets/style-preview-comic-v3.png";

const styleOptions = [
  { id: "illustration", label: "插画", desc: "扁平复古旅行纪念插画", image: illustrationPreview },
  { id: "chinese", label: "国风", desc: "水墨淡彩与宣纸肌理", image: chinesePreview },
  { id: "comic", label: "漫画", desc: "鲜明线稿与赛璐璐平涂", image: comicPreview },
];

const formatOptions = [
  { id: "portrait", label: "竖版", ratioLabel: "4:5", cssRatio: "4 / 5", cropWidth: "320px", uploadWidth: "430px", previewWidth: "min(460px, 88vw, 48vh)", generation: { size: "1728x2304", width: 1728, height: 2304 }, canvas: { width: 1200, height: 1500 }, hint: "人物、建筑、街景" },
  { id: "square", label: "方形", ratioLabel: "1:1", cssRatio: "1 / 1", cropWidth: "390px", uploadWidth: "520px", previewWidth: "min(560px, 88vw, 58vh)", generation: { size: "2048x2048", width: 2048, height: 2048 }, canvas: { width: 1400, height: 1400 }, hint: "合照、食物、近景" },
  { id: "landscape", label: "横版", ratioLabel: "4:3", cssRatio: "4 / 3", cropWidth: "540px", uploadWidth: "760px", previewWidth: "min(720px, 88vw, 65vh)", generation: { size: "2304x1728", width: 2304, height: 1728 }, canvas: { width: 1600, height: 1200 }, hint: "风景、全景、多人合照" },
];

const templateOptions = [
  { id: "white", label: "浅色说明栏", desc: "浅色标题栏，经典旅行纪念卡", previewFormat: "landscape" },
  { id: "dark", label: "深色标题栏", desc: "深色标题栏追加在插画下方", previewFormat: "landscape" },
  { id: "collector", label: "细框收藏卡", desc: "主题衬纸与双线装帧", previewFormat: "portrait" },
];

const themeOptions = [
  { id: "classic", label: "米白 · 复古绿", paper: "#F6EEDB", accent: "#173F3B" },
  { id: "wine", label: "奶油白 · 酒红", paper: "#FFF8E8", accent: "#7A263A" },
  { id: "navy", label: "暖灰 · 海军蓝", paper: "#D8D3C8", accent: "#203A5F" },
  { id: "kraft", label: "牛皮纸 · 深棕", paper: "#C69A63", accent: "#3B2416" },
];

function getTheme(theme = "classic") {
  return themeOptions.find((item) => item.id === theme) || themeOptions[0];
}

const fontGroups = [
  {
    label: "中文字体 · 15款",
    fonts: [
      { value: '"Noto Sans SC", sans-serif', label: "现代黑体", googleFamily: null },
      { value: '"Noto Serif SC", serif', label: "典雅宋体", googleFamily: "Noto+Serif+SC:wght@400;600;700;800" },
      { value: '"Ma Shan Zheng", cursive', label: "马善政毛笔", googleFamily: "Ma+Shan+Zheng" },
      { value: '"ZCOOL XiaoWei", serif', label: "站酷小薇", googleFamily: "ZCOOL+XiaoWei" },
      { value: '"ZCOOL QingKe HuangYou", sans-serif', label: "站酷庆科黄油体", googleFamily: "ZCOOL+QingKe+HuangYou" },
      { value: '"ZCOOL KuaiLe", cursive', label: "站酷快乐体", googleFamily: "ZCOOL+KuaiLe" },
      { value: '"Long Cang", cursive', label: "龙藏体", googleFamily: "Long+Cang" },
      { value: '"Liu Jian Mao Cao", cursive', label: "刘建毛草", googleFamily: "Liu+Jian+Mao+Cao" },
      { value: '"Zhi Mang Xing", cursive', label: "志莽行书", googleFamily: "Zhi+Mang+Xing" },
      { value: '"LXGW WenKai", "Kaiti SC", serif', label: "霞鹜文楷", googleFamily: "LXGW+WenKai" },
      { value: '"Noto Sans TC", sans-serif', label: "繁体黑体", googleFamily: "Noto+Sans+TC:wght@400;600;700;800" },
      { value: '"Noto Serif TC", serif', label: "繁体宋体", googleFamily: "Noto+Serif+TC:wght@400;600;700;800" },
      { value: '"Songti SC", "Noto Serif SC", serif', label: "系统宋体", googleFamily: null },
      { value: '"Kaiti SC", "STKaiti", serif', label: "系统楷体", googleFamily: null },
      { value: '"PingFang SC", "Noto Sans SC", sans-serif', label: "苹方黑体", googleFamily: null },
    ],
  },
  {
    label: "English Fonts · 15",
    fonts: [
      { value: 'Nunito, "Noto Sans SC", sans-serif', label: "Nunito · Rounded", googleFamily: null },
      { value: 'Montserrat, "Noto Sans SC", sans-serif', label: "Montserrat · Modern", googleFamily: "Montserrat:wght@500;600;700;800" },
      { value: '"Playfair Display", serif', label: "Playfair · Editorial", googleFamily: "Playfair+Display:wght@500;600;700;800" },
      { value: '"Cormorant Garamond", serif', label: "Cormorant · Elegant", googleFamily: "Cormorant+Garamond:wght@500;600;700" },
      { value: '"Bebas Neue", sans-serif', label: "Bebas Neue · Poster", googleFamily: "Bebas+Neue" },
      { value: 'Oswald, sans-serif', label: "Oswald · Condensed", googleFamily: "Oswald:wght@500;600;700" },
      { value: 'Lora, serif', label: "Lora · Literary", googleFamily: "Lora:wght@500;600;700" },
      { value: 'Merriweather, serif', label: "Merriweather · Classic", googleFamily: "Merriweather:wght@400;700;900" },
      { value: '"Libre Baskerville", serif', label: "Libre Baskerville · Heritage", googleFamily: "Libre+Baskerville:wght@400;700" },
      { value: '"DM Sans", sans-serif', label: "DM Sans · Clean", googleFamily: "DM+Sans:wght@500;600;700" },
      { value: 'Poppins, sans-serif', label: "Poppins · Geometric", googleFamily: "Poppins:wght@500;600;700;800" },
      { value: 'Raleway, sans-serif', label: "Raleway · Refined", googleFamily: "Raleway:wght@500;600;700;800" },
      { value: '"Abril Fatface", serif', label: "Abril Fatface · Bold", googleFamily: "Abril+Fatface" },
      { value: 'Cinzel, serif', label: "Cinzel · Monumental", googleFamily: "Cinzel:wght@500;600;700;800" },
      { value: 'Caveat, cursive', label: "Caveat · Handwritten", googleFamily: "Caveat:wght@500;600;700" },
    ],
  },
];

const fontOptions = fontGroups.flatMap((group) => group.fonts);

function ensureFontLoaded(font) {
  if (!font?.googleFamily) return Promise.resolve();
  const id = `font-${font.googleFamily.replace(/[^a-z0-9]/gi, "-")}`;
  const existing = document.getElementById(id);
  if (existing?.dataset.loaded === "true") return Promise.resolve();
  return new Promise((resolve) => {
    const link = existing || document.createElement("link");
    let settled = false;
    const finish = () => { if (!settled) { settled = true; link.dataset.loaded = "true"; resolve(); } };
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${font.googleFamily}&display=swap`;
    link.onload = finish;
    link.onerror = finish;
    if (!existing) document.head.appendChild(link);
    window.setTimeout(finish, 2500);
  });
}

async function imageSourceToDataUrl(source) {
  if (source?.startsWith("data:image/")) return source;
  const response = await fetch(source);
  if (!response.ok) throw new Error("无法读取上传的照片");
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("无法读取上传的照片"));
    reader.readAsDataURL(blob);
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("无法压缩上传照片"));
    reader.readAsDataURL(blob);
  });
}

function canvasToJpegBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("无法压缩上传照片")), "image/jpeg", quality);
  });
}

async function encodeReferenceForUpload(canvas) {
  const maxBytes = 2.7 * 1024 * 1024;
  for (const quality of [.86, .78, .7]) {
    const blob = await canvasToJpegBlob(canvas, quality);
    if (blob.size <= maxBytes) return blobToDataUrl(blob);
  }

  const reduced = document.createElement("canvas");
  const scale = Math.min(1, 1400 / Math.max(canvas.width, canvas.height));
  reduced.width = Math.round(canvas.width * scale);
  reduced.height = Math.round(canvas.height * scale);
  reduced.getContext("2d").drawImage(canvas, 0, 0, reduced.width, reduced.height);
  return blobToDataUrl(await canvasToJpegBlob(reduced, .76));
}

async function renderReferenceImage(source, selectedFormat, crop) {
  const dataUrl = await imageSourceToDataUrl(source);
  const image = await new Promise((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("无法处理上传的照片"));
    element.src = dataUrl;
  });
  const generation = selectedFormat.generation;
  const outputScale = Math.min(1, 1800 / Math.max(generation.width, generation.height));
  const width = Math.round(generation.width * outputScale);
  const height = Math.round(generation.height * outputScale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  const quarterTurns = Math.round((crop.rotation || 0) / 90) % 2;
  const rotatedWidth = quarterTurns ? image.naturalHeight : image.naturalWidth;
  const rotatedHeight = quarterTurns ? image.naturalWidth : image.naturalHeight;
  const scale = Math.max(width / rotatedWidth, height / rotatedHeight) * (crop.zoom || 1);
  const renderedWidth = rotatedWidth * scale;
  const horizontalOverflow = Math.max(0, renderedWidth - width);
  const offsetX = ((50 - (crop.x ?? 50)) / 50) * horizontalOverflow / 2;

  context.save();
  context.translate(width / 2 + offsetX, height / 2);
  context.rotate((crop.rotation || 0) * Math.PI / 180);
  context.drawImage(image, -image.naturalWidth * scale / 2, -image.naturalHeight * scale / 2, image.naturalWidth * scale, image.naturalHeight * scale);
  context.restore();
  return encodeReferenceForUpload(canvas);
}

const templateLayerPresets = {
  white: {
    caption: { x: 50, y: 85.2, size: 36, color: "#102522", weight: 800, fontFamily: '"Bebas Neue", sans-serif' },
    date: { x: 50, y: 92.4, size: 11, color: "#102522", weight: 700, fontFamily: 'Montserrat, "Noto Sans SC", sans-serif' },
  },
  dark: {
    caption: { x: 50, y: 85.2, size: 36, color: "#fff4d8", weight: 800, fontFamily: '"Bebas Neue", sans-serif' },
    date: { x: 50, y: 92.5, size: 11, color: "#fff4d8", weight: 700, fontFamily: 'Montserrat, "Noto Sans SC", sans-serif' },
  },
  collector: {
    caption: { x: 50, y: 84.2, size: 34, color: "#102522", weight: 800, fontFamily: '"Bebas Neue", sans-serif' },
    date: { x: 50, y: 92.2, size: 10, color: "#102522", weight: 700, fontFamily: 'Montserrat, "Noto Sans SC", sans-serif' },
  },
};

function createTemplateLayers(template = "white", fields = { caption: "KIYOMIZU-DERA, KYOTO", date: "AUTUMN SPLENDOR IN OLD JAPAN" }, theme = "classic") {
  const preset = templateLayerPresets[template] || templateLayerPresets.white;
  const palette = getTheme(theme);
  const textColor = template === "dark" ? palette.paper : palette.accent;
  return [
    { id: "caption", label: "主标题", text: fields.caption, align: "center", visible: Boolean(fields.caption), ...preset.caption, color: textColor },
    { id: "date", label: "副标题", text: fields.date, align: "center", visible: Boolean(fields.date), ...preset.date, color: textColor },
  ];
}

const initialLayers = createTemplateLayers();

function getStickerRatio(selectedFormat, template) {
  return `${selectedFormat.canvas.width} / ${selectedFormat.canvas.height * 1.25}`;
}

function getPreviewFontSize(layer, compact, template) {
  if (!compact) return `${layer.size}px`;
  if (template === "collector") return layer.id === "caption" ? "7px" : "4px";
  return layer.id === "caption" ? `${Math.max(layer.size * .52, 15)}px` : `${Math.max(layer.size * .7, 8)}px`;
}

function getPreviewTop(layer, compact, template) {
  if (compact && template === "collector") {
    return layer.id === "caption" ? 82.7 : 89.5;
  }
  return layer.y;
}

function Logo({ onClick }) {
  return (
    <button className="logo" onClick={onClick} aria-label="回到首页">
      <span className="logo-mark"><PiImageSquare /></span>
      <span>RefriSticker</span>
    </button>
  );
}

function Header({ onHome, onStart }) {
  return (
    <header className="site-header">
      <Logo onClick={onHome} />
      <nav aria-label="主导航">
        <button onClick={() => { onHome(); setTimeout(() => document.querySelector("#examples")?.scrollIntoView({ behavior: "smooth" }), 0); }}>作品示例</button>
        <button onClick={() => { onHome(); setTimeout(() => document.querySelector("#how")?.scrollIntoView({ behavior: "smooth" }), 0); }}>使用方法</button>
        <button className="nav-cta" onClick={onStart}>开始制作</button>
      </nav>
    </header>
  );
}

function StickerCard({ image = "/assets/kyoto-illustration-v2.png", compact = false, layers = initialLayers, onLayerPointerDown, activeLayer, format = "portrait", template = "white", theme = "classic" }) {
  const selectedFormat = formatOptions.find((item) => item.id === format) || formatOptions[0];
  const stickerRatio = getStickerRatio(selectedFormat, template);
  const palette = getTheme(theme);
  return (
    <div className={`sticker-card format-${format} template-${template} theme-${theme} ${compact ? "compact" : ""}`} style={{ aspectRatio: stickerRatio, "--theme-paper": palette.paper, "--theme-accent": palette.accent }} data-format={format} data-template={template} data-theme={theme}>
      <div className="sticker-art-frame"><img src={image} alt="京都旅行插画冰箱贴" /></div>
      <div className="sticker-caption-band" aria-hidden="true" />
      {layers.map((layer) => layer.visible && (
        <div
          key={layer.id}
          className={`sticker-layer layer-${layer.id} ${activeLayer === layer.id ? "active" : ""}`}
          style={{ left: `${layer.x}%`, top: `${getPreviewTop(layer, compact, template)}%`, fontSize: getPreviewFontSize(layer, compact, template), color: layer.color, textAlign: layer.align, fontWeight: layer.weight, fontFamily: layer.fontFamily }}
          onPointerDown={(event) => onLayerPointerDown?.(event, layer.id)}
        >
          {layer.text}
        </div>
      ))}
    </div>
  );
}

function TemplateSelector({ template, setTemplate, image, format, theme = "classic", compact = false }) {
  return <div className={`template-grid ${compact ? "compact" : ""}`}>
    {templateOptions.map((option) => {
      const previewFormat = compact ? format : option.previewFormat;
      const previewLayers = createTemplateLayers(option.id, undefined, theme);
      return <button key={option.id} className={`template-option ${template === option.id ? "selected" : ""}`} onClick={() => setTemplate(option.id)}>
        <div className="template-preview"><StickerCard image={image} layers={previewLayers} format={previewFormat} template={option.id} theme={theme} compact /></div>
        <span><strong>{option.label}</strong><small>{option.desc}</small></span>
        {template === option.id && <PiCheck className="template-check" />}
      </button>;
    })}
  </div>;
}

function ThemeSelector({ theme, setTheme, compact = false }) {
  return <div className={`theme-grid ${compact ? "compact" : ""}`}>
    {themeOptions.map((option) => <button key={option.id} className={`theme-option ${theme === option.id ? "selected" : ""}`} onClick={() => setTheme(option.id)}>
      <span className="theme-swatch" style={{ "--swatch-paper": option.paper, "--swatch-accent": option.accent }}><i /><i /></span>
      <span>{option.label}</span>
      {theme === option.id && <PiCheck />}
    </button>)}
  </div>;
}

function Home({ onStart }) {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><PiSparkle /> 把旅途留在日常里</span>
          <h1>把旅行照片，<br />变成<span>专属冰箱贴</span>。</h1>
          <p>上传照片，选择风格，写下文案，<br />生成只属于你的旅行纪念。</p>
          <button className="primary large" onClick={onStart}>制作我的冰箱贴 <PiArrowRight /></button>
          <div className="memory-stamp">COLLECT<br />MEMORIES</div>
        </div>
        <div className="hero-visual" aria-label="原照片和冰箱贴效果对比">
          <div className="before-panel">
            <img src="/assets/kyoto-photo.png" alt="京都旅行原照片" />
            <span className="image-label">原图</span>
          </div>
          <div className="compare-arrow"><PiArrowRight /></div>
          <div className="after-panel">
            <img className="hero-result-mockup" src="/assets/kyoto-magnet-hero-v1.png" alt="京都旅行异形冰箱贴效果图" />
            <span className="image-label result">效果图</span>
          </div>
        </div>
      </section>

      <section className="home-details">
        <div className="style-showcase" id="examples">
          <h2><PiImageSquare /> 多种风格，随心选择</h2>
          <div className="style-row">
            {styleOptions.map((style) => (
              <button key={style.id} className="style-mini" onClick={onStart}>
                <div className="mini-sticker"><img src={style.image} alt={`${style.label}风格示例`} /></div>
                <strong>{style.label === "插画" ? "复古旅行海报" : style.label === "国风" ? "水彩手绘" : "极简线条"}</strong>
              </button>
            ))}
          </div>
        </div>
        <div className="steps" id="how">
          <h2><PiSparkle /> 三步完成你的专属冰箱贴</h2>
          <div className="step-row">
            {[
              [PiCloudArrowUp, "上传照片", "选择你喜欢的旅行照片"],
              [PiCrop, "选择版型", "竖版、方形或横版"],
              [PiPalette, "风格与文案", "选风格，写下旅行记忆"],
            ].map(([Icon, title, text], index) => (
              <div className="step-item" key={title}>
                <span className="step-icon"><Icon /></span>
                <div><b>{index + 1}</b><strong>{title}</strong><p>{text}</p></div>
                {index < 2 && <PiArrowRight className="step-arrow" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <div><PiShieldCheck /><span><strong>隐私优先</strong>照片 24 小时后自动删除</span></div>
        <div><PiSparkle /><span><strong>三种艺术风格</strong>每一张都有独特气质</span></div>
        <div><PiDownloadSimple /><span><strong>一键下载</strong>保留你的旅行记忆</span></div>
      </section>
      <footer>© 2026 RefriSticker · 隐私说明 · 用户协议</footer>
    </main>
  );
}

function UploadStep({ imageUrl, setImageUrl, crop, setCrop, format, setFormat, onNext }) {
  const inputRef = useRef(null);
  const [showCrop, setShowCrop] = useState(false);
  const [warning, setWarning] = useState("");
  const selectedFormat = formatOptions.find((item) => item.id === format) || formatOptions[0];

  const readFile = (file) => {
    if (!file) return;
    if (!/image\/(jpeg|png|webp|heic|heif)/.test(file.type)) { setWarning("请上传 JPG、JPEG、PNG、WEBP 或 HEIC 格式的照片"); return; }
    if (file.size >= 15 * 1024 * 1024) { setWarning("照片需小于 15MB，请压缩后重试"); return; }
    setWarning("");
    const reader = new FileReader();
    reader.onload = () => { setImageUrl(reader.result); setShowCrop(true); };
    reader.onerror = () => setWarning("照片读取失败，请重新选择");
    reader.readAsDataURL(file);
  };

  return (
    <section className="create-card">
      <div className="section-heading"><span>01</span><div><h1>上传你的旅行照片</h1><p>选一张最能代表这趟旅程的照片，我们会把它变成独特的纪念。</p></div></div>
      <div
        className={`upload-zone ${imageUrl ? `has-image format-${format}` : ""}`}
        style={imageUrl ? { aspectRatio: selectedFormat.cssRatio, width: selectedFormat.uploadWidth, maxWidth: "100%", height: "auto", marginInline: "auto" } : undefined}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); readFile(e.dataTransfer.files[0]); }}
        onClick={() => inputRef.current?.click()}
      >
        {imageUrl ? <img src={imageUrl} alt={`${selectedFormat.label} ${selectedFormat.ratioLabel} 实时预览`} style={{ transform: `scale(${crop.zoom}) rotate(${crop.rotation}deg)`, objectPosition: `${crop.x}% ${crop.y}%` }} /> : <><PiCloudArrowUp /><h3>请上传照片</h3><p>点击或拖拽到这里 · 支持 JPG、JPEG、PNG · 小于 10MB</p><button className="secondary">选择照片</button></>}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png" hidden onChange={(e) => readFile(e.target.files[0])} />
      </div>
      {warning && <p className="form-warning">{warning}</p>}
      {imageUrl && <div className="upload-actions"><button className="secondary" onClick={() => setShowCrop(true)}><PiCrop /> 调整裁剪</button><button className="text-button" onClick={() => inputRef.current?.click()}>重新上传</button></div>}
      {imageUrl && <div className="format-section">
        <div className="format-heading"><div><span>02</span><strong>选择冰箱贴版型</strong></div><small>版型会同步应用到裁剪、预览和下载</small></div>
        <div className="format-grid">{formatOptions.map((option) => <button key={option.id} className={`format-option ${format === option.id ? "selected" : ""}`} onClick={() => { setFormat(option.id); setCrop({ zoom: 1, rotation: 0, x: 50, y: 50 }); setShowCrop(true); }}>
          {option.id === "square" ? <PiSquare className="format-icon" aria-hidden="true" /> : <PiRectangle className={`format-icon ${option.id === "portrait" ? "portrait-icon" : ""}`} aria-hidden="true" />}
          <span><strong>{option.label} {option.ratioLabel}</strong><small>{option.hint}</small></span>
          {format === option.id && <PiCheck />}
        </button>)}</div>
      </div>}
      <div className="privacy-note"><PiShieldCheck /> 原图与生成结果将在 24 小时后自动删除</div>
      <button className="primary next" disabled={!imageUrl} onClick={onNext}>下一步，选择风格 <PiArrowRight /></button>

      {showCrop && <div className="modal-backdrop" onClick={() => setShowCrop(false)}>
        <div className="crop-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head"><div><h2>裁剪照片 · {selectedFormat.label} {selectedFormat.ratioLabel}</h2><p>画面会按照所选冰箱贴版型裁剪</p></div><button onClick={() => setShowCrop(false)}><PiX /></button></div>
          <div className={`crop-frame format-${format}`} style={{ aspectRatio: selectedFormat.cssRatio, width: selectedFormat.cropWidth, maxWidth: "100%" }}><img src={imageUrl} alt={`${selectedFormat.label}裁剪预览`} style={{ transform: `scale(${crop.zoom}) rotate(${crop.rotation}deg)`, objectPosition: `${crop.x}% ${crop.y}%` }} /></div>
          <label>缩放 <input type="range" min="1" max="2" step=".05" value={crop.zoom} onChange={(e) => setCrop({ ...crop, zoom: Number(e.target.value) })} /></label>
          <label>水平位置 <input type="range" min="0" max="100" value={crop.x} onChange={(e) => setCrop({ ...crop, x: Number(e.target.value) })} /></label>
          <button className="secondary" onClick={() => setCrop({ ...crop, rotation: (crop.rotation + 90) % 360 })}><PiArrowClockwise /> 旋转 90°</button>
          <button className="primary" onClick={() => setShowCrop(false)}>使用这个画面 <PiCheck /></button>
        </div>
      </div>}
    </section>
  );
}

function DetailsStep({ style, setStyle, fields, setFields, format, template, setTemplate, theme, setTheme, onBack, onGenerate }) {
  const selectedFormat = formatOptions.find((item) => item.id === format) || formatOptions[0];
  return (
    <section className="create-card details-card">
      <button className="back-button" onClick={onBack}><PiArrowLeft /> 返回上传</button>
      <div className="format-summary"><span>{selectedFormat.label} {selectedFormat.ratioLabel}</span><small>当前冰箱贴版型</small></div>
      <div className="section-heading"><span>03</span><div><h1>选择你喜欢的风格</h1><p>同一张照片，也可以有完全不同的旅行气质。</p></div></div>
      <div className="style-grid">
        {styleOptions.map((option) => <button key={option.id} className={`style-card ${style === option.id ? "selected" : ""}`} onClick={() => setStyle(option.id)}>
          <img src={option.image} alt={`${option.label}风格`} />
          <div><strong>{option.label}</strong><p>{option.desc}</p></div>
          {style === option.id && <span className="check"><PiCheck /></span>}
        </button>)}
      </div>
      <div className="section-heading compact-heading"><span>04</span><div><h2>选择纪念卡模板</h2><p>模板只改变边框、标题栏和排版，不影响 AI 插画内容。</p></div></div>
      <TemplateSelector template={template} setTemplate={setTemplate} image={styleOptions.find((item) => item.id === style)?.image} format={format} theme={theme} />
      <div className="section-heading compact-heading text-heading"><span>05</span><div><h2>选择配色主题</h2><p>四套经过设计的配色会同步应用到边框、标题栏和文字。</p></div></div>
      <ThemeSelector theme={theme} setTheme={setTheme} />
      <div className="section-heading compact-heading text-heading"><span>06</span><div><h2>写下这趟旅行</h2><p>使用粗窄体主标题与小号副标题，匹配复古旅行纪念卡。</p></div></div>
      <div className="form-grid">
        <label className="full">主标题 <span>选填 · 推荐使用地点英文名</span><div className="input-wrap"><PiPencilSimple /><input value={fields.caption} maxLength={60} onChange={(e) => setFields({ ...fields, caption: e.target.value })} placeholder="例如：KIYOMIZU-DERA, KYOTO" /></div></label>
        <label className="full">副标题 <span>选填 · 一句旅行短句</span><input value={fields.date} maxLength={60} onChange={(e) => setFields({ ...fields, date: e.target.value })} placeholder="例如：AUTUMN SPLENDOR IN OLD JAPAN" /></label>
      </div>
      <button className="primary generate" onClick={onGenerate}><PiSparkle /> 生成冰箱贴</button>
    </section>
  );
}

function Loading({ onCancel, onRetry, prompt, error }) {
  if (error) return <section className="loading-screen generation-error"><div className="loading-art"><PiX /></div><span>生成没有完成</span><h1>这次没画出来</h1><p>{error}</p><div className="error-actions"><button className="secondary" onClick={onCancel}>返回调整</button><button className="primary" onClick={onRetry}>重新生成</button></div></section>;
  return <section className="loading-screen"><div className="loading-art"><PiSparkle /></div><span>AI 旅行画师正在工作</span><h1>正在绘制你的冰箱贴</h1><p>每一次生成都像重新翻开一段旅程</p><button className="text-button" onClick={onCancel}>取消生成</button></section>;
}

function Editor({ style, fields, imageUrl, generatedImage, layers, setLayers, format, template, setTemplate, theme, setTheme, onBack, onStyleChange }) {
  const [active, setActive] = useState("caption");
  const [history, setHistory] = useState([layers]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [toast, setToast] = useState("");
  const previewRef = useRef(null);
  const selectedStyle = styleOptions.find((item) => item.id === style) || styleOptions[0];
  const resultImage = generatedImage || selectedStyle.image;
  const selectedFormat = formatOptions.find((item) => item.id === format) || formatOptions[0];
  const stickerRatio = getStickerRatio(selectedFormat, template);
  const current = layers.find((item) => item.id === active);
  const palette = getTheme(theme);

  const commitLayers = (next) => {
    setLayers(next);
    const nextHistory = history.slice(0, historyIndex + 1).concat([next]);
    setHistory(nextHistory.slice(-20));
    setHistoryIndex(Math.min(nextHistory.length - 1, 19));
  };
  const updateLayer = (patch, commit = false) => {
    const next = layers.map((item) => item.id === active ? { ...item, ...patch } : item);
    commit ? commitLayers(next) : setLayers(next);
  };
  const onLayerPointerDown = (event, id) => {
    event.preventDefault(); setActive(id);
    const startX = event.clientX, startY = event.clientY;
    const original = layers.find((item) => item.id === id);
    const bounds = previewRef.current.getBoundingClientRect();
    const onMove = (moveEvent) => setLayers((prev) => prev.map((item) => item.id === id ? { ...item, x: Math.max(10, Math.min(90, original.x + (moveEvent.clientX - startX) / bounds.width * 100)), y: Math.max(78, Math.min(94, original.y + (moveEvent.clientY - startY) / bounds.height * 100)) } : item));
    const onUp = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); setHistory((h) => h.concat([layers]).slice(-20)); };
    window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp);
  };
  const undo = () => { if (historyIndex > 0) { setHistoryIndex(historyIndex - 1); setLayers(history[historyIndex - 1]); } };
  const redo = () => { if (historyIndex < history.length - 1) { setHistoryIndex(historyIndex + 1); setLayers(history[historyIndex + 1]); } };
  const setTextColor = (color) => commitLayers(layers.map((item) => item.id === active ? { ...item, color } : item));

  const changeTemplate = (nextTemplate) => {
    setTemplate(nextTemplate);
    const nextLayers = createTemplateLayers(nextTemplate, {
      caption: layers.find((item) => item.id === "caption")?.text || fields.caption,
      date: layers.find((item) => item.id === "date")?.text || fields.date,
    }, theme);
    commitLayers(nextLayers);
    setActive("caption");
  };

  const changeTheme = (nextTheme) => {
    setTheme(nextTheme);
    const nextLayers = createTemplateLayers(template, {
      caption: layers.find((item) => item.id === "caption")?.text || fields.caption,
      date: layers.find((item) => item.id === "date")?.text || fields.date,
    }, nextTheme).map((layer) => {
      const existing = layers.find((item) => item.id === layer.id);
      return { ...layer, visible: existing?.visible ?? layer.visible, fontFamily: existing?.fontFamily || layer.fontFamily, size: existing?.size || layer.size };
    });
    commitLayers(nextLayers);
  };

  const download = async () => {
    await Promise.all(layers.filter((layer) => layer.visible).map((layer) => ensureFontLoaded(fontOptions.find((font) => font.value === layer.fontFamily))));
    await Promise.race([document.fonts?.ready || Promise.resolve(), new Promise((resolve) => window.setTimeout(resolve, 2500))]);
    const canvas = document.createElement("canvas"); canvas.width = selectedFormat.canvas.width; canvas.height = Math.round(selectedFormat.canvas.height * 1.25);
    const ctx = canvas.getContext("2d");
    const img = new Image(); img.crossOrigin = "anonymous"; img.src = resultImage;
    await img.decode();
    const inset = Math.round(Math.min(canvas.width, canvas.height) * (template === "dark" ? .018 : .027));
    const innerWidth = canvas.width - inset * 2, innerHeight = canvas.height - inset * 2;
    const radius = Math.round(Math.min(canvas.width, canvas.height) * .022);
    ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, canvas.width, canvas.height, radius); ctx.clip();
    ctx.fillStyle = template === "dark" ? palette.accent : palette.paper; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const imageHeight = Math.round(innerHeight * (template === "dark" ? .8 : template === "collector" ? .735 : .775));
    ctx.drawImage(img, 0, 0, img.width, img.height, inset, inset, innerWidth, imageHeight);
    const bandY = inset + imageHeight;
    const bandHeight = canvas.height - inset - bandY;
    ctx.fillStyle = template === "dark" ? palette.accent : palette.paper; ctx.fillRect(inset, bandY, innerWidth, bandHeight);
    ctx.strokeStyle = palette.accent; ctx.lineWidth = Math.max(4, Math.round(canvas.width * .004));
    if (template === "collector") {
      ctx.strokeRect(inset, inset, innerWidth, innerHeight);
      const ruleGap = Math.round(bandHeight * .16);
      ctx.beginPath(); ctx.moveTo(inset + ruleGap, bandY + ruleGap); ctx.lineTo(canvas.width - inset - ruleGap, bandY + ruleGap); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(inset + ruleGap, canvas.height - inset - ruleGap); ctx.lineTo(canvas.width - inset - ruleGap, canvas.height - inset - ruleGap); ctx.stroke();
    } else if (template === "white") {
      ctx.strokeRect(inset, inset, innerWidth, innerHeight);
      ctx.beginPath(); ctx.moveTo(inset, bandY); ctx.lineTo(canvas.width - inset, bandY); ctx.stroke();
    }
    const fontScale = Math.min(canvas.width, canvas.height) / 460;
    layers.filter((l) => l.visible).forEach((l) => {
      ctx.fillStyle = l.color; ctx.textAlign = l.align || "center"; ctx.textBaseline = "middle";
      let fontSize = l.size * fontScale; const maxWidth = innerWidth * .9;
      do { ctx.font = `${l.weight} ${fontSize}px ${l.fontFamily || "sans-serif"}`; fontSize -= 1; } while (ctx.measureText(l.text).width > maxWidth && fontSize > 16);
      ctx.fillText(l.text, canvas.width * l.x / 100, canvas.height * l.y / 100, maxWidth);
    });
    ctx.restore();
    const link = document.createElement("a"); link.download = `RefriSticker-${selectedFormat.ratioLabel.replace(":", "x")}.png`; link.href = canvas.toDataURL("image/png"); link.click();
    setToast("图片已下载，旅途记忆保存好啦"); setTimeout(() => setToast(""), 2600);
  };

  return <main className="editor-page">
    <div className="editor-top"><button className="back-button" onClick={onBack}><PiArrowLeft /> 返回</button><div className="editor-actions"><button disabled={historyIndex <= 0} onClick={undo}>撤销</button><button disabled={historyIndex >= history.length - 1} onClick={redo}>重做</button><button className="secondary" onClick={onStyleChange}><PiPalette /> 重新生成</button><button className="primary" onClick={download}><PiDownloadSimple /> 下载图片</button></div></div>
    <div className="editor-layout">
      <aside className="layer-panel">
        <div><span className="eyebrow"><PiPencilSimple /> 文字编辑</span><h2>写下你的旅行记忆</h2><p>选择文字层后，可直接在画面上拖动位置。</p></div>
        <div className="editor-template-control"><span>纪念卡模板</span><TemplateSelector template={template} setTemplate={changeTemplate} image={resultImage} format={format} theme={theme} compact /></div>
        <div className="editor-template-control theme-control"><span>配色主题</span><ThemeSelector theme={theme} setTheme={changeTheme} compact /></div>
        <div className="layer-list">{layers.map((layer) => <button key={layer.id} className={active === layer.id ? "active" : ""} onClick={() => setActive(layer.id)}><PiTextAa /><span><strong>{layer.label}</strong><small>{layer.text || "未填写"}</small></span><input type="checkbox" checked={layer.visible} onChange={(e) => { e.stopPropagation(); commitLayers(layers.map((item) => item.id === layer.id ? { ...item, visible: e.target.checked } : item)); }} /></button>)}</div>
        {current && <div className="layer-controls">
          <label>文字内容<input value={current.text} onChange={(e) => updateLayer({ text: e.target.value })} onBlur={() => commitLayers(layers)} /></label>
          <label>字体<select value={current.fontFamily} onChange={(e) => { const font = fontOptions.find((item) => item.value === e.target.value); updateLayer({ fontFamily: e.target.value }, true); ensureFontLoaded(font); }}>{fontGroups.map((group) => <optgroup key={group.label} label={group.label}>{group.fonts.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}</optgroup>)}</select></label>
          <label>字号 <span>{current.size}px</span><input type="range" min="9" max="48" value={current.size} onChange={(e) => updateLayer({ size: Number(e.target.value) })} onMouseUp={() => commitLayers(layers)} /></label>
          <div className="color-control">
            <div className="color-row"><span>颜色</span>{["#173f3b", "#234a70", "#b55c43", "#fffdf5"].map((color) => <button key={color} aria-label={`颜色 ${color}`} className={current.color.toLowerCase() === color ? "selected" : ""} style={{ background: color }} onClick={() => setTextColor(color)} />)}<label className="custom-color" title="自定义取色"><input type="color" aria-label="自定义文字颜色" value={current.color} onChange={(e) => setTextColor(e.target.value)} /><PiPalette /></label></div>
          </div>
          <div className="align-row"><button onClick={() => updateLayer({ x: 50 }, true)}>水平居中</button><button onClick={() => updateLayer({ y: active === "date" ? 91 : 83 }, true)}>置于文案区</button></div>
        </div>}
      </aside>
      <section className="preview-workspace">
        <div className="source-pill"><img src={imageUrl || "/assets/kyoto-photo.png"} alt="原始照片" /> {selectedFormat.label} {selectedFormat.ratioLabel}</div>
        <div className={`preview-frame format-${format} template-${template}`} style={{ aspectRatio: stickerRatio, width: selectedFormat.previewWidth }} ref={previewRef}><StickerCard image={resultImage} layers={layers} activeLayer={active} onLayerPointerDown={onLayerPointerDown} format={format} template={template} theme={theme} /></div>
        <p><PiShieldCheck /> 虚线范围内为安全打印区域</p>
      </section>
    </div>
    {toast && <div className="toast"><PiCheck /> {toast}</div>}
  </main>;
}

export function App() {
  const [screen, setScreen] = useState("home");
  const [step, setStep] = useState(1);
  const [imageUrl, setImageUrl] = useState("");
  const [crop, setCrop] = useState({ zoom: 1, rotation: 0, x: 50, y: 50 });
  const [format, setFormat] = useState("portrait");
  const [style, setStyle] = useState("illustration");
  const [template, setTemplate] = useState("white");
  const [theme, setTheme] = useState("classic");
  const [fields, setFields] = useState({ caption: "KIYOMIZU-DERA, KYOTO", date: "AUTUMN SPLENDOR IN OLD JAPAN" });
  const [layers, setLayers] = useState(initialLayers);
  const [generationPrompt, setGenerationPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState("");
  const [generationError, setGenerationError] = useState("");
  const generationController = useRef(null);

  useEffect(() => () => generationController.current?.abort(), []);
  const syncLayers = () => setLayers(createTemplateLayers(template, fields, theme));
  const start = () => { setScreen("create"); setStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const generate = async () => {
    const prompt = buildPrompt({ style, format });
    const selectedFormat = formatOptions.find((item) => item.id === format) || formatOptions[0];
    setGenerationPrompt(prompt);
    setGenerationError("");
    syncLayers();
    setStep(3);
    generationController.current?.abort();
    const controller = new AbortController();
    generationController.current = controller;
    try {
      const image = await renderReferenceImage(imageUrl, selectedFormat, crop);
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, image, style, ...selectedFormat.generation }),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "图片生成失败，请稍后重试");
      setGeneratedImage(result.image);
      setScreen("editor");
    } catch (error) {
      if (error.name !== "AbortError") setGenerationError(error.message || "图片生成失败，请稍后重试");
    } finally {
      if (generationController.current === controller) generationController.current = null;
    }
  };
  const cancel = () => { generationController.current?.abort(); generationController.current = null; setGenerationError(""); setStep(2); };

  return <div className="app-shell">
    {screen !== "editor" && <Header onHome={() => setScreen("home")} onStart={start} />}
    {screen === "home" && <Home onStart={start} />}
    {screen === "create" && <main className="create-page">
      <div className="create-progress"><span className={step >= 1 ? "active" : ""}><b>1</b> 照片与版型</span><i /><span className={step >= 2 ? "active" : ""}><b>2</b> 文案与风格</span><i /><span className={step >= 3 ? "active" : ""}><b>3</b> 生成作品</span></div>
      {step === 1 && <UploadStep imageUrl={imageUrl} setImageUrl={setImageUrl} crop={crop} setCrop={setCrop} format={format} setFormat={setFormat} onNext={() => setStep(2)} />}
      {step === 2 && <DetailsStep style={style} setStyle={setStyle} fields={fields} setFields={setFields} format={format} template={template} setTemplate={setTemplate} theme={theme} setTheme={setTheme} onBack={() => setStep(1)} onGenerate={generate} />}
      {step === 3 && <Loading onCancel={cancel} onRetry={generate} prompt={generationPrompt} error={generationError} />}
    </main>}
    {screen === "editor" && <Editor style={style} fields={fields} imageUrl={imageUrl} generatedImage={generatedImage} layers={layers} setLayers={setLayers} format={format} template={template} setTemplate={setTemplate} theme={theme} setTheme={setTheme} onBack={() => { setScreen("create"); setStep(2); }} onStyleChange={() => { setScreen("create"); setStep(2); }} />}
  </div>;
}
