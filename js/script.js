// Tự cập nhật năm trong footer
const yearEl = document.getElementById('footer-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
/* ── Dark / Light mode ────────────────────────────────────── */
(function () {
  const HTML     = document.documentElement;
  const STORAGE_KEY = 'ag_theme';
 
  // Áp dụng theme đã lưu ngay khi load (trước khi render)
  // → tránh flash of wrong theme
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light') {
    HTML.classList.add('theme-light');
  }
 
  function toggleTheme() {
    const isLight = HTML.classList.toggle('theme-light');
    localStorage.setItem(STORAGE_KEY, isLight ? 'light' : 'dark');
 
    // Cập nhật aria-label cho tất cả nút toggle trên trang
    document.querySelectorAll('.darkmode-btn').forEach(btn => {
      btn.setAttribute(
        'aria-label',
        isLight ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'
      );
      btn.setAttribute('title', isLight ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng');
    });
  }
 
  // Gắn sự kiện cho tất cả nút toggle khi DOM sẵn sàng
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.darkmode-btn').forEach(btn => {
      btn.addEventListener('click', toggleTheme);
 
      // Đặt aria-label đúng với trạng thái hiện tại
      const isLight = HTML.classList.contains('theme-light');
      btn.setAttribute(
        'aria-label',
        isLight ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'
      );
    });
  });
})();
 
/* ── Năm footer ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
 
/* ── Kiểm tra đăng nhập — hiển thị tên user trên header ──── */
document.addEventListener('DOMContentLoaded', function () {
  const user = JSON.parse(localStorage.getItem('ag_current_user') || 'null');
  const loginBtn  = document.querySelector('.btn-ghost[href*="auth"]');
  const signupBtn = document.querySelector('.btn-primary[href*="auth"]');
 
  if (user && loginBtn && signupBtn) {
    // Thay 2 nút bằng tên user + nút đăng xuất
    const wrapper = loginBtn.parentElement;
    loginBtn.remove();
    signupBtn.remove();
 
    const userEl = document.createElement('div');
    userEl.className = 'header-user';
    userEl.innerHTML = `
      <span class="header-username">${user.name.split(' ').pop()}</span>
      <a href="pages/profile.html" class="btn btn-ghost" aria-label="Trang cá nhân">Tài khoản</a>
      <button class="btn btn-ghost logout-btn" aria-label="Đăng xuất">Đăng xuất</button>
    `;
    wrapper.appendChild(userEl);
 
    wrapper.querySelector('.logout-btn').addEventListener('click', function () {
      localStorage.removeItem('ag_current_user');
      window.location.reload();
    });
  }
});
/* ============================================================
   home.js — AuraGate
   JS riêng cho trang chủ: lịch, counter, lọc danh mục, search
   ============================================================ */

/* ── Dữ liệu sự kiện mẫu ── */
const EVENTS_DATA = [
  { id:1, title:'Đêm nhạc Acoustic Underground', date:'2026-05-15', time:'19:30', city:'hanoi', category:'music',      price:'250.000 ₫' },
  { id:2, title:'Vietnam Tech Summit 2025',       date:'2026-06-20', time:'08:00', city:'hcm',   category:'conference', price:'500.000 ₫' },
  { id:3, title:'UI/UX Design Bootcamp',          date:'2026-05-20', time:'09:00', city:'hanoi', category:'workshop',   price:'350.000 ₫' },
  { id:4, title:'Hanoi Marathon 2025',            date:'2026-06-01', time:'05:30', city:'hanoi', category:'sport',      price:'200.000 ₫' },
  { id:5, title:'Jazz & Wine Evening',            date:'2026-06-07', time:'20:00', city:'hcm',   category:'music',      price:'450.000 ₫' },
  { id:6, title:'Triển lãm Nghệ thuật Đương đại', date:'2026-06-10', time:'10:00', city:'danang',category:'expo',       price:'Miễn phí'  },
  { id:7, title:'Startup Weekend Hanoi',          date:'2026-06-14', time:'08:00', city:'hanoi', category:'conference', price:'150.000 ₫' },
  { id:8, title:'EDM Rave Night',                 date:'2026-06-21', time:'21:00', city:'hcm',   category:'music',      price:'300.000 ₫' },
  { id:9, title:'Photography Workshop',           date:'2026-05-15', time:'14:00', city:'hanoi', category:'workshop',   price:'180.000 ₫' },
  { id:10,title:'Da Nang Food Festival',          date:'2026-06-20', time:'11:00', city:'danang',category:'expo',       price:'Miễn phí'  },
];

document.addEventListener('DOMContentLoaded', function () {

  /* ── 1. LỊCH THÁNG ──────────────────────────────────────── */
  const calGrid     = document.getElementById('cal-grid');
  const calTitle    = document.getElementById('cal-title');
  const calPrev     = document.getElementById('cal-prev');
  const calNext     = document.getElementById('cal-next');
  const calEventList = document.getElementById('cal-event-list');
  const calSelDate  = document.getElementById('cal-selected-date');
  const calCount    = document.getElementById('cal-event-count');

  if (!calGrid) return;

  const today    = new Date();
  let   viewYear = today.getFullYear();
  let   viewMonth= today.getMonth(); // 0-based
  let   selectedDate = null;

  const VI_MONTHS = [
    'Tháng 1','Tháng 2','Tháng 3','Tháng 4',
    'Tháng 5','Tháng 6','Tháng 7','Tháng 8',
    'Tháng 9','Tháng 10','Tháng 11','Tháng 12',
  ];

  // Lấy tập ngày có sự kiện trong tháng
  function getEventDates(year, month) {
    const set = new Set();
    EVENTS_DATA.forEach(ev => {
      const d = new Date(ev.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        set.add(d.getDate());
      }
    });
    return set;
  }

  function renderCalendar(year, month) {
    calTitle.textContent = `${VI_MONTHS[month]} ${year}`;
    calGrid.innerHTML = '';

    const firstDay = new Date(year, month, 1).getDay(); // 0=CN
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const eventDates = getEventDates(year, month);

    // Ô trống đầu tháng
    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('div');
      empty.className = 'cal-day cal-empty';
      empty.setAttribute('aria-hidden', 'true');
      calGrid.appendChild(empty);
    }

    // Các ngày
    for (let d = 1; d <= daysInMonth; d++) {
      const cell = document.createElement('div');
      cell.className = 'cal-day';
      cell.setAttribute('role', 'gridcell');

      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      cell.setAttribute('aria-label', `${d} ${VI_MONTHS[month]} ${year}`);
      cell.dataset.date = dateStr;

      // Số ngày
      const num = document.createElement('span');
      num.textContent = d;
      cell.appendChild(num);

      // Chấm sự kiện
      if (eventDates.has(d)) {
        const dot = document.createElement('span');
        dot.className = 'cal-dot';
        dot.setAttribute('aria-hidden', 'true');
        cell.appendChild(dot);
      }

      // Hôm nay
      const isToday = (d === today.getDate() && month === today.getMonth() && year === today.getFullYear());
      if (isToday) cell.classList.add('cal-today');

      // Ngày đã qua
      const cellDate = new Date(year, month, d);
      if (cellDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
        cell.classList.add('cal-past');
        cell.setAttribute('aria-disabled', 'true');
      } else {
        cell.setAttribute('tabindex', '0');
        cell.addEventListener('click', () => selectDate(dateStr, d, month, year));
        cell.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectDate(dateStr, d, month, year);
          }
        });
      }

      // Đang chọn
      if (selectedDate === dateStr) cell.classList.add('cal-selected');

      calGrid.appendChild(cell);
    }
  }

  function selectDate(dateStr, day, month, year) {
    selectedDate = dateStr;

    // Cập nhật UI ô ngày
    document.querySelectorAll('.cal-day.cal-selected').forEach(el => el.classList.remove('cal-selected'));
    const target = calGrid.querySelector(`[data-date="${dateStr}"]`);
    if (target) target.classList.add('cal-selected');

    // Tiêu đề sidebar
    const dateObj = new Date(dateStr);
    const options = { weekday:'long', day:'numeric', month:'long' };
    calSelDate.textContent = dateObj.toLocaleDateString('vi-VN', options);

    // Lọc sự kiện
    const dayEvents = EVENTS_DATA.filter(ev => ev.date === dateStr);
    calCount.textContent = dayEvents.length ? `${dayEvents.length} sự kiện` : '';

    calEventList.innerHTML = '';

    if (dayEvents.length === 0) {
      calEventList.innerHTML = `
        <li class="cal-empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8"  y1="2" x2="8"  y2="6"/>
            <line x1="3"  y1="10" x2="21" y2="10"/>
          </svg>
          <p>Không có sự kiện vào ngày này</p>
        </li>`;
      return;
    }

    dayEvents.forEach(ev => {
      const li = document.createElement('li');
      li.className = 'cal-event-item';
      li.innerHTML = `
        <span class="cal-event-name">${ev.title}</span>
        <span class="cal-event-time">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          ${ev.time} · ${ev.price}
        </span>
        <a href="pages/event-detail.html?id=${ev.id}"
           class="btn btn-primary btn-sm cal-event-book"
           aria-label="Đặt vé ${ev.title}">Đặt vé</a>
      `;
      calEventList.appendChild(li);
    });
  }

  // Điều hướng tháng
  calPrev.addEventListener('click', () => {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderCalendar(viewYear, viewMonth);
  });

  calNext.addEventListener('click', () => {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderCalendar(viewYear, viewMonth);
  });

  renderCalendar(viewYear, viewMonth);

  /* ── 2. ĐẾM SỐ THỐNG KÊ ─────────────────────────────────── */
  function animateCounter(el, target, duration) {
    const start = performance.now();
    const update = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Easing: ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString('vi-VN');
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  // Chỉ chạy khi hero vào viewport
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.stat-number[data-target]').forEach(el => {
          const target = parseInt(el.dataset.target, 10);
          animateCounter(el, target, 1800);
          delete el.dataset.target; // chỉ chạy 1 lần
        });
        statsObserver.disconnect();
      }
    });
  }, { threshold: 0.5 });

  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) statsObserver.observe(heroStats);

  /* ── 3. DANH MỤC CHIP LỌC ───────────────────────────────── */
  const chips = document.querySelectorAll('.chip');
  const eventCards = document.querySelectorAll('.event-card[data-category]');

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      // Cập nhật chip active
      chips.forEach(c => {
        c.classList.remove('chip-active');
        c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('chip-active');
      chip.setAttribute('aria-pressed', 'true');

      const cat = chip.dataset.category;

      // Lọc cards sắp diễn ra
      eventCards.forEach(card => {
        const show = cat === 'all' || card.dataset.category === cat;
        card.style.display = show ? '' : 'none';
      });
    });
  });

  /* ── 4. GỢI Ý TÌM KIẾM ──────────────────────────────────── */
  const searchInput = document.getElementById('search-input');
  const suggestionTags = document.querySelectorAll('.suggestion-tag');

  suggestionTags.forEach(tag => {
    tag.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = tag.textContent.trim();
        searchInput.focus();
      }
    });
  });

  /* ── 5. SUBMIT FORM TÌM KIẾM ────────────────────────────── */
  const searchForm = document.querySelector('.hero-search');
  if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const keyword = searchInput ? searchInput.value.trim() : '';
      const city = document.getElementById('city-select')?.value || '';
      const params = new URLSearchParams();
      if (keyword) params.set('q', keyword);
      if (city)    params.set('city', city);
      window.location.href = `pages/events.html${params.toString() ? '?' + params : ''}`;
    });
  }
});
/* ── Ngôn ngữ VI / EN ─────────────────────────────────────── */
(function () {
  const LANG_KEY = 'ag_lang';
  const saved = localStorage.getItem(LANG_KEY) || 'vi';
 
  function applyLang(lang) {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      const labelEl = btn.querySelector('[aria-hidden="true"]') || btn;
      labelEl.textContent = lang === 'vi' ? 'VI' : 'EN';
      btn.setAttribute('aria-label', lang === 'vi'
        ? 'Chuyển sang tiếng Anh'
        : 'Switch to Vietnamese');
      btn.setAttribute('title', lang === 'vi'
        ? 'Chuyển sang tiếng Anh'
        : 'Switch to Vietnamese');
    });
    document.documentElement.lang = lang === 'vi' ? 'vi' : 'en';
  }
 
  function toggleLang() {
    const current = localStorage.getItem(LANG_KEY) || 'vi';
    const next = current === 'vi' ? 'en' : 'vi';
    localStorage.setItem(LANG_KEY, next);
    applyLang(next);
  }
 
  document.addEventListener('DOMContentLoaded', function () {
    applyLang(saved);
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', toggleLang);
    });
  });
})();