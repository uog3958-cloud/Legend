import React, { useState, useMemo, useEffect, useRef } from 'react';
import ArticleCard from '../components/ArticleCard';
import { ARTICLES } from '../constants';
import { fetchWeatherByCity, WeatherData, REGIONS } from '../services/weatherService';
import ArticlePage from './ArticlePage'; // 인터랙티브 컴포넌트 호출용

interface HomePageProps {
  onArticleSelect: (id: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  viewingArticleId: string | null;
  onCloseArticle: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ 
  onArticleSelect, 
  selectedCategory, 
  setSelectedCategory,
  viewingArticleId,
  onCloseArticle
}) => {
  const [allArticles, setAllArticles] = useState(ARTICLES);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [displayLimit, setDisplayLimit] = useState(8);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const CATEGORY_ORDER = ['HOME', '국내', '해외', '스포츠', '엔터', '경제', '가장 인기 있는', '인터랙티브'];
  const FALLBACK_NEWS_IMG = 'https://images.unsplash.com/photo-1585829365234-781f8c4847c1?q=80&w=1000&auto=format&fit=crop';

  const [isWritePanelOpen, setIsWritePanelOpen] = useState<boolean>(false);
  const [writeForm, setWriteForm] = useState({
    title: '',
    source: '',
    imageStyle: '실사 뉴스',
    body: ''
  });

  const IMAGE_STYLES = [
    { label: '실사 뉴스 (기본값)', value: '실사 뉴스' },
    { label: '일러스트', value: '일러스트' },
    { label: '다큐멘터리 톤', value: '다큐멘터리 톤' },
    { label: '아트/컨셉 이미지', value: '아트/컨셉 이미지' }
  ];

  const backgroundColor = isDarkMode ? '#1f2b3a' : '#fcfcfc';
  const paperColor = isDarkMode ? '#1a2430' : '#ffffff';
  const accentColor = isDarkMode ? '#1a6361' : '#00928e'; 
  const textColor = isDarkMode ? 'text-[#FFFFFF]' : 'text-zinc-900';
  const borderColor = isDarkMode ? 'border-zinc-700' : 'border-gray-200';
  const inputBorderColor = isDarkMode ? 'border-zinc-600' : 'border-zinc-800';

  useEffect(() => {
    const formatTime = () => {
      const now = new Date();
      const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
      return `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 (${weekDays[now.getDay()]}) ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    };
    setCurrentTime(formatTime());
    const timer = setInterval(() => setCurrentTime(formatTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredArticles = useMemo(() => {
    let result = allArticles;

    // [지시사항 1, 4] HOME 탭에서 인터랙티브와 일반 기사 혼합 배치 (1:2 비율)
    if (selectedCategory === 'HOME') {
      const interactive = allArticles.filter(a => a.category === '인터랙티브');
      const general = allArticles.filter(a => a.category !== '인터랙티브');
      
      const mixed = [];
      let iIdx = 0;
      let gIdx = 0;
      
      // 패턴: 1 Interactive, 2 General 교차
      while (iIdx < interactive.length || gIdx < general.length) {
        if (iIdx < interactive.length) {
          mixed.push(interactive[iIdx++]);
        }
        if (gIdx < general.length) {
          mixed.push(general[gIdx++]);
        }
        if (gIdx < general.length) {
          mixed.push(general[gIdx++]);
        }
      }
      return mixed;
    }

    // [지시사항 4] '가장 인기 있는' 탭에서는 카테고리가 '인터랙티브'인 기사 제외 로직 유지
    if (selectedCategory === '가장 인기 있는') {
      result = allArticles.filter(article => article.category !== '인터랙티브');
    } else if (selectedCategory !== 'HOME') {
      result = allArticles.filter(article => article.category === selectedCategory);
    }
    return result;
  }, [selectedCategory, allArticles]);

  const displayedArticles = useMemo(() => {
    return filteredArticles.slice(0, displayLimit);
  }, [filteredArticles, displayLimit]);

  const viewingArticle = useMemo(() => 
    viewingArticleId ? allArticles.find(a => a.id === viewingArticleId) : null
  , [viewingArticleId, allArticles]);

  const handleCreateArticle = () => {
    if (!writeForm.title.trim() || !writeForm.body.trim()) return;
    const newArticle = {
      id: `custom-${Date.now()}`,
      title: writeForm.title,
      category: '국내',
      summary: writeForm.body.slice(0, 100) + '...',
      thumbnail: FALLBACK_NEWS_IMG,
      lead: writeForm.title,
      body: [writeForm.body],
      caption: `[출처: ${writeForm.source || '동아일분'}] AI가 생성한 ${writeForm.imageStyle} 스타일 기사입니다.`
    };
    setAllArticles([newArticle, ...allArticles]);
    setWriteForm({ title: '', source: '', imageStyle: '실사 뉴스', body: '' });
    setIsWritePanelOpen(false);
  };

  return (
    <div className="min-h-screen transition-colors duration-300 relative overflow-x-hidden main-layout" style={{ backgroundColor }}>
      
      {/* 기사 쓰기 슬라이드 패널 (출처, 이미지 스타일 입력란 보존) */}
      <aside 
        className={`fixed top-0 right-0 h-full w-full max-w-lg shadow-2xl z-[300] transform transition-transform duration-500 ease-in-out p-6 md:p-10 flex flex-col border-l ${borderColor} ${isWritePanelOpen ? 'translate-x-0' : 'translate-x-full'}`} 
        style={{ backgroundColor: paperColor }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold tracking-tight headline-text ${textColor}`}>기사 생성</h2>
          <button onClick={() => setIsWritePanelOpen(false)} className="p-1 hover:bg-black/5 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isDarkMode ? 'text-zinc-400' : 'text-zinc-800'}>
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
          <div className="space-y-1.5">
            <label className={`text-[11px] font-bold uppercase meta-text ${isDarkMode ? 'text-zinc-300' : 'text-zinc-900'}`}>핵심 주제</label>
            <input 
              type="text" 
              placeholder="예: 화성 탐사의 미래" 
              value={writeForm.title} 
              onChange={(e) => setWriteForm({...writeForm, title: e.target.value})} 
              className={`w-full bg-transparent border ${inputBorderColor} px-4 py-3 text-sm rounded-lg outline-none focus:border-[#00928e] transition-colors ${textColor}`} 
            />
          </div>

          <div className="space-y-1.5">
            <label className={`text-[11px] font-bold uppercase meta-text ${isDarkMode ? 'text-zinc-300' : 'text-zinc-900'}`}>이미지 스타일 ▽</label>
            <div className="relative">
              <select 
                value={writeForm.imageStyle} 
                onChange={(e) => setWriteForm({...writeForm, imageStyle: e.target.value})} 
                className={`w-full bg-transparent border ${inputBorderColor} px-4 py-3 text-sm rounded-lg outline-none focus:border-[#00928e] transition-colors appearance-none ${textColor}`}
              >
                {IMAGE_STYLES.map(style => (
                  <option key={style.value} value={style.value} className={isDarkMode ? 'bg-zinc-800 text-white' : 'bg-white text-black'}>
                    {style.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={`text-[11px] font-bold uppercase meta-text ${isDarkMode ? 'text-zinc-300' : 'text-zinc-900'}`}>기사 내용</label>
            <textarea 
              rows={12} 
              placeholder="기사의 본문 내용을 입력하세요." 
              value={writeForm.body} 
              onChange={(e) => setWriteForm({...writeForm, body: e.target.value})} 
              className={`w-full bg-transparent border ${inputBorderColor} p-4 text-sm rounded-lg outline-none focus:border-[#00928e] transition-colors resize-none body-text ${textColor}`} 
            />
          </div>

          <div className="space-y-1.5">
            <label className={`text-[11px] font-bold uppercase meta-text ${isDarkMode ? 'text-zinc-300' : 'text-zinc-900'}`}>출처</label>
            <input 
              type="text" 
              placeholder="예: 과학동아, 로이터 통신 등" 
              value={writeForm.source} 
              onChange={(e) => setWriteForm({...writeForm, source: e.target.value})} 
              className={`w-full bg-transparent border ${inputBorderColor} px-4 py-3 text-sm rounded-lg outline-none focus:border-[#00928e] transition-colors ${textColor}`} 
            />
          </div>
        </div>
        <button 
          onClick={handleCreateArticle} 
          className="w-full py-4 mt-6 text-white font-bold text-[13px] rounded-lg shadow-lg hover:brightness-110 active:scale-[0.99] transition-all border-t border-white/20 uppercase tracking-widest" 
          style={{ backgroundColor: accentColor }}
        >
          기사 등록
        </button>
      </aside>

      {/* 기사 상세 내용 오버레이 (가독성 로직 보존) */}
      <div 
        className={`fixed inset-0 z-[400] transition-all duration-700 ${viewingArticle ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCloseArticle} />
        <div className={`absolute inset-x-0 bottom-0 top-[10%] rounded-t-[30px] shadow-[0_-20px_50px_rgba(0,0,0,0.2)] overflow-hidden transition-colors flex flex-col`} style={{ backgroundColor: paperColor }}>
          {viewingArticle && (
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
              <button 
                onClick={onCloseArticle} 
                className="fixed top-[12%] right-8 z-[500] p-4 bg-zinc-900 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              
              {viewingArticle.category === '인터랙티브' || viewingArticle.isInteractive ? (
                <ArticlePage article={viewingArticle} onBack={onCloseArticle} />
              ) : (
                <div className="max-w-4xl mx-auto py-20 px-6 md:px-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <header className="mb-12 text-center">
                    <span className="text-[#00928e] border border-[#00928e]/30 px-3 py-1 text-[10px] font-black rounded-[4px] uppercase meta-text">{viewingArticle.category}</span>
                    <h2 className={`text-4xl md:text-5xl headline-text font-black leading-[1.2] mt-8 tracking-tighter ${textColor}`}>{viewingArticle.title}</h2>
                    <div className="h-0.5 w-16 bg-[#00928e] mx-auto mt-8" />
                  </header>
                  {viewingArticle.thumbnail && (
                    <figure className="mb-12">
                      <div className="aspect-video overflow-hidden shadow-2xl border border-gray-100 rounded-[12px]">
                        <img src={viewingArticle.thumbnail} className="w-full h-full object-cover" />
                      </div>
                    </figure>
                  )}
                  <div className={`space-y-8 text-lg md:text-xl body-text leading-[2.0] ${textColor}`}>
                    {viewingArticle.body.map((p, i) => <p key={i}>{p}</p>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 상단 GNB (중앙 정렬 준수) */}
      <div className={`border-b ${borderColor} py-2 px-4 flex flex-wrap justify-center items-center text-[11px] gap-4 bg-transparent backdrop-blur-md sticky top-0 z-[70] transition-colors w-full`} style={{ backgroundColor: isDarkMode ? 'rgba(31, 43, 58, 0.8)' : 'rgba(255, 255, 255, 0.8)' }}>
        <div className="max-w-[1200px] w-full flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className={`flex items-center gap-1 border ${borderColor} px-2 py-0.5 rounded text-gray-500 hover:bg-black/5 transition-all shadow-sm active:scale-[0.98] border-t-white/30 meta-text`}
              style={{ backgroundColor: paperColor }}
            >
              <div className={`w-2 h-2 rounded-full ${!isDarkMode ? 'bg-zinc-400' : 'bg-[#00928e]'}`}></div>
              바탕색전환
            </button>
          </div>
          <div className={`text-[14px] font-bold tabular-nums meta-text ${isDarkMode ? 'text-zinc-300' : 'text-gray-800'}`}>{currentTime}</div>
        </div>
      </div>

      <header className={`max-w-[1200px] mx-auto px-4 md:px-10 pt-10 pb-6 text-center`}>
        <h1 className={`text-2xl md:text-5xl headline-text font-black tracking-[0.25em] mb-4 cursor-pointer ${textColor}`} style={{ WebkitTextStroke: '0.8px currentColor' }} onClick={() => { setSelectedCategory('HOME'); onCloseArticle(); setDisplayLimit(8); }}>동아 일분</h1>
        <div className="w-full h-[1px] mb-4" style={{ backgroundColor: accentColor }} />
        <div className="flex justify-between items-center text-[11px] font-bold text-gray-400 uppercase meta-text px-1">
          <span>제 2025-0520호</span>
          <span className={`normal-case italic body-text ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>일분 만에 쓰고, 일분 만에 읽는 뉴스</span>
          <span className={`${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>INTELLIGENT DAILY</span>
        </div>
      </header>

      <nav className={`border-b ${borderColor} shadow-sm transition-colors mb-2`} style={{ backgroundColor: paperColor }}>
        <div className="max-w-[1200px] mx-auto px-4 md:px-10 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
            {CATEGORY_ORDER.map(cat => (
              <button key={cat} onClick={() => { setSelectedCategory(cat); onCloseArticle(); setDisplayLimit(8); }} className={`pb-1 transition-all text-[13px] font-black whitespace-nowrap headline-text ${selectedCategory === cat ? 'border-b-2' : 'hover:opacity-70'} ${isDarkMode ? 'text-white' : 'text-zinc-800'}`} style={{ borderBottomColor: selectedCategory === cat ? accentColor : 'transparent', color: selectedCategory === cat ? accentColor : undefined }}>{cat}</button>
            ))}
          </div>
          <button 
            onClick={() => setIsWritePanelOpen(true)} 
            className="text-white px-5 py-2 text-xs font-bold rounded-[4px] transition-all ml-4 flex-shrink-0 shadow-lg hover:-translate-y-[2px] active:scale-[0.98] border-t border-white/30 meta-text" 
            style={{ backgroundColor: accentColor }}
          >
            기사 쓰기
          </button>
        </div>
      </nav>

      {/* 메인 지면 레이아웃 (중앙 정렬 및 정돈된 그리드) */}
      <main className="max-w-[1200px] mx-auto px-4 md:px-10 py-12 min-h-[600px] transition-colors" style={{ backgroundColor }}>
        
        {/* '인터랙티브' 탭 전용 레이아웃: 와이드 카드 리스트 (16:9 비율 고정) */}
        {selectedCategory === '인터랙티브' ? (
          <div className="space-y-12 animate-in fade-in duration-700">
            <div className="flex items-center gap-4 mb-4">
              <span className={`text-[12px] font-black uppercase meta-text tracking-[0.4em] ${isDarkMode ? 'text-[#FFFFFF]' : 'text-zinc-900'}`}>Interactive Experience Journal</span>
              <div className={`h-[1px] flex-1 ${borderColor} opacity-30`}></div>
            </div>
            {displayedArticles.map((article) => (
              <div 
                key={article.id}
                className={`relative cursor-pointer group rounded-xl overflow-hidden shadow-2xl transition-all duration-700 hover:-translate-y-2 active:scale-[0.99] border-t border-white/20 flex flex-col md:flex-row min-h-[300px] md:min-h-[400px] ${isDarkMode ? 'bg-[#2a3746]' : 'bg-[#FDFDFD]'}`}
                onClick={() => onArticleSelect(article.id)}
              >
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
                
                {/* 이미지 영역: 16:9 비율 유지 (규격 통일) */}
                <div className="w-full md:w-3/5 relative overflow-hidden aspect-video">
                  <img src={article.thumbnail} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent md:bg-gradient-to-r md:from-black/60 md:to-transparent" />
                </div>
                
                {/* 텍스트 영역: 40% (2/5) */}
                <div className="w-full md:w-2/5 p-8 md:p-12 flex flex-col justify-center relative z-10">
                  <span className="text-[10px] font-black bg-[#00928e] text-white px-3 py-1 rounded-[4px] uppercase meta-text mb-4 self-start tracking-widest shadow-lg">Deep Interactive</span>
                  <h2 className={`text-xl md:text-3xl headline-text font-black leading-tight mb-4 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{article.title}</h2>
                  <p className={`text-sm md:text-base body-text line-clamp-4 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>{article.summary}</p>
                  <div className="mt-8 flex items-center gap-2 group/btn">
                     <span className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all group-hover/btn:mr-2 ${isDarkMode ? 'text-[#00F0FF]' : 'text-[#00928e]'}`}>Experience Now</span>
                     <svg className={`transition-all group-hover/btn:translate-x-1 ${isDarkMode ? 'text-[#00F0FF]' : 'text-[#00928e]'}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* [지시사항 1, 3] 일반 탭 및 HOME 레이아웃 (교차 배치 대응) */
          <div className="animate-in fade-in duration-700">
            {/* 상단 헤드라인 영역 (HOME 탭 등에서 노출, 첫 번째 기사는 항상 인터랙티브) */}
            {displayedArticles.length > 0 && (
              <div className="mb-16">
                <div className="flex items-center gap-4 mb-8">
                  <span className={`text-[12px] font-black uppercase meta-text tracking-[0.4em] ${isDarkMode ? 'text-[#FFFFFF]' : 'text-zinc-900'}`}>
                    {displayedArticles[0].category === '인터랙티브' ? 'Interactive Top Story' : 'Current Headlines'}
                  </span>
                  <div className={`h-[1px] flex-1 ${borderColor} opacity-30`}></div>
                </div>
                
                <div 
                  className={`relative cursor-pointer group rounded-xl overflow-hidden shadow-2xl transition-all duration-700 hover:-translate-y-2 active:scale-[0.99] border-t border-white/20 min-h-[400px] flex flex-col md:flex-row ${isDarkMode ? 'bg-[#2a3746]' : 'bg-[#FDFDFD]'}`}
                  onClick={() => onArticleSelect(displayedArticles[0].id)}
                >
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
                  <div className="w-full md:w-3/5 relative overflow-hidden aspect-video">
                    <img src={displayedArticles[0].thumbnail} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent md:bg-gradient-to-r md:from-black/40 md:to-transparent" />
                  </div>
                  <div className="w-full md:w-2/5 p-8 md:p-12 flex flex-col justify-center relative z-10">
                    <span className="text-[10px] font-black bg-[#00928e] text-white px-3 py-1 rounded-[4px] uppercase meta-text mb-4 self-start tracking-widest shadow-lg">Feature Report</span>
                    <h2 className={`text-2xl md:text-4xl headline-text font-black leading-tight mb-6 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{displayedArticles[0].title}</h2>
                    <p className={`text-sm md:text-base body-text line-clamp-4 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>{displayedArticles[0].summary}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 정돈된 그리드 섹션: 3열 레이아웃 (인터랙티브와 일반 기사 혼합) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {displayedArticles.slice(1).map((article) => (
                <ArticleCard key={article.id} article={article} onClick={onArticleSelect} isDarkMode={isDarkMode} />
              ))}
            </div>
          </div>
        )}

        {/* 더 보기 버튼 (Curated List 관리) */}
        {filteredArticles.length > displayLimit && (
          <div className="mt-20 flex justify-center">
            <button 
              onClick={() => setDisplayLimit(prev => prev + 6)}
              className={`px-12 py-4 rounded-full font-black text-[12px] tracking-[0.3em] uppercase transition-all shadow-xl hover:-translate-y-1 active:scale-95 border border-white/20 ${isDarkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-900 text-white'}`}
            >
              Read More Articles
            </button>
          </div>
        )}

        {displayedArticles.length === 0 && (
          <div className="py-40 text-center">
            <p className={`text-lg font-serif italic ${isDarkMode ? 'text-zinc-500' : 'text-zinc-300'}`}>현재 카테고리에 준비된 기사가 없습니다.</p>
          </div>
        )}
      </main>

      <footer className={`border-t py-20 transition-colors duration-300 ${borderColor}`} style={{ backgroundColor }}>
        <div className="max-w-[1200px] mx-auto px-4 md:px-10 flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
          <div className="flex flex-col gap-3">
            <h2 className={`text-3xl headline-text font-black tracking-widest ${isDarkMode ? 'text-zinc-300' : 'text-zinc-400'}`}>동아 일분</h2>
            <div className="text-[10px] font-black meta-text text-zinc-500 uppercase tracking-[0.5em]">EST. 2024 • THE NEXT FRONTIER OF JOURNALISM</div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="text-[10px] font-bold text-zinc-400 uppercase meta-text tracking-widest">© 2025 ALL RIGHTS RESERVED</div>
            <p className="text-[9px] text-zinc-500 meta-text italic">Powered by Intelligent Design</p>
          </div>
        </div>
      </footer>

      <style>{`
        /* 사이트 기본 폰트 정책 */
        .main-layout { 
          font-family: 'Noto Sans KR', sans-serif !important; 
        }
        
        /* 헤드라인(제목) 폰트 정책 */
        .headline-text { 
          font-family: 'Noto Serif KR', serif !important; 
          font-weight: 700 !important;
          letter-spacing: -0.03em !important;
        }
        
        /* 본문 및 요약 폰트 정책 */
        .body-text { 
          font-family: 'Noto Sans KR', sans-serif !important; 
          font-weight: 400 !important;
          line-height: 1.85 !important;
          letter-spacing: -0.015em !important;
        }
        
        /* 메타 정보 폰트 정책 */
        .meta-text {
          font-family: 'Noto Sans KR', sans-serif !important;
          font-weight: 700 !important;
          letter-spacing: 0.08em !important;
          text-transform: uppercase;
        }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #00928e33; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default HomePage;