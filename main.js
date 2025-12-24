import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://zvfotmlfwglwysqbximn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2Zm90bWxmd2dsd3lzcWJ4aW1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NzA2MjEsImV4cCI6MjA4MTU0NjYyMX0.vUTtOAi8bXmDv5t-T0v7Nm1GLPdk1yozLZW-YLn8nG8';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper to build clean course URL
function buildCourseUrl(level, slug) {
  if (!level) return `/curso/${slug}`;

  let segment = level.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with dash
    .replace(/-+/g, '-') // Remove double dashes
    .replace(/^-|-$/g, ''); // Remove leading/trailing dashes

  return `/curso/${segment}/${slug}`;
}
window.buildCourseUrl = buildCourseUrl;


document.addEventListener('DOMContentLoaded', () => {
  console.log('FICV Main JS Running');

  // --- CMS INTEGRATION (Supabase) ---
  async function loadCMSContent() {
    try {
      const { data, error } = await supabase.from('site_content').select('item_key, content_value');
      if (data) {
        // Convert array to map
        const contentMap = {};
        data.forEach(item => {
          contentMap[item.item_key] = item.content_value;
        });
        applyContent(contentMap);
      }
    } catch (e) {
      console.log('CMS Offline', e);
    }
  }

  function applyContent(data) {
    // Find all elements with data-cms-key
    const elements = document.querySelectorAll('[data-cms-key]');
    elements.forEach(el => {
      const key = el.getAttribute('data-cms-key');
      if (data[key]) {
        const val = data[key];
        const tag = el.tagName.toLowerCase();
        if (tag === 'img') {
          el.src = val;
        } else if (tag === 'div' && el.style.backgroundImage) {
          el.style.backgroundImage = `url('${val}')`;
        } else {
          el.innerText = val;
        }
      }
    });

    // Handle HREF links
    const linkElements = document.querySelectorAll('[data-cms-href]');
    linkElements.forEach(el => {
      const key = el.getAttribute('data-cms-href');
      let val = data[key];

      if (val && val !== '#' && val.trim() !== '') {
        // Ensure Protocol
        if (!val.startsWith('http') && !val.startsWith('mailto:') && !val.startsWith('tel:')) {
          val = 'https://' + val;
        }
        el.href = val;
        el.style.display = 'inline-flex'; // Ensure visible if valid
        // Explicitly handle click to bypass any odd behavior
        el.onclick = (e) => {
          e.preventDefault();
          window.open(val, '_blank');
        };
      } else {
        el.removeAttribute('href'); // Remove if invalid
        // Optional: el.style.opacity = '0.5';
      }
    });

    if (data['color_primary']) document.documentElement.style.setProperty('--color-primary', data['color_primary']);
    if (data['color_secondary']) document.documentElement.style.setProperty('--color-secondary', data['color_secondary']);
  }

  loadCMSContent();
  loadNews();

  async function loadNews() {
    try {
      const { data: news, error } = await supabase
        .from('news')
        .select('*')
        .order('publish_date', { ascending: false })
        .limit(3);

      if (news && news.length > 0) {
        const newsContainer = document.querySelector('.news-grid');
        if (newsContainer) {
          newsContainer.innerHTML = ''; // Clear hardcoded
          news.forEach(item => {
            const date = new Date(item.publish_date).toLocaleDateString('pt-BR');
            // Fallback if slug is missing (legacy items not yet saved in new admin)
            const slug = item.slug || '#';
            const onclickAttr = item.slug ? `onclick="window.location.href='/news/${item.slug}'" style="cursor:pointer;"` : '';

            newsContainer.innerHTML += `
                      <article class="news-card" ${onclickAttr}>
                        <div class="news-image">
                          <img src="${item.image_url || 'https://via.placeholder.com/600x400?text=Sem+Imagem'}" alt="${item.title}">
                        </div>
                        <div class="news-content">
                          <h3>${item.title}</h3>
                          <div class="news-date">
                            <i class="fas fa-calendar-alt"></i> ${date}
                          </div>
                        </div>
                      </article>
                    `;
          });
        }
      }
    } catch (err) {
      console.error("Erro news", err);
    }
  }

  // --- Offcanvas Menu ---
  const menuTrigger = document.querySelector('.menu-trigger');
  const closeMenu = document.querySelector('.close-menu');
  const offcanvasMenu = document.querySelector('.offcanvas-menu');

  if (menuTrigger && offcanvasMenu) {
    menuTrigger.addEventListener('click', () => {
      offcanvasMenu.classList.add('active');
    });

    if (closeMenu) {
      closeMenu.addEventListener('click', () => {
        offcanvasMenu.classList.remove('active');
      });
    }

    // Close when clicking outside (optional/simple version)
    document.addEventListener('click', (e) => {
      if (!offcanvasMenu.contains(e.target) && !menuTrigger.contains(e.target) && offcanvasMenu.classList.contains('active')) {
        offcanvasMenu.classList.remove('active');
      }
    });
  }

  loadHeroSlides();
  loadCourses();
  loadWhyFICV();
  loadFeatures();
  loadProfessors();
  loadPartners();
  loadPolos();

  // --- Partners Loader ---
  async function loadPartners() {
    try {
      const { data } = await supabase.from('partners').select('*').order('display_order', { ascending: true });
      if (data && data.length > 0) {
        const marquee = document.querySelector('.partners-marquee');
        if (marquee) {
          const itemsHtml = data.map(p => `
                      <div class="partner-item" title="${p.name}">
                          <div class="partner-logo-custom">
                              <img src="${p.image_url}" alt="${p.name}" style="height:50px; max-width:180px; object-fit:contain; filter:brightness(0) invert(1);"> 
                              ${!p.image_url ? `<span>${p.name}</span>` : ''}
                          </div>
                      </div>
                  `).join('');
          /* Note: filter: brightness(0) invert(1) makes black logos white, suitable for dark background. 
             Remove if logos are already white or colored. Adjust as needed. */

          marquee.innerHTML = itemsHtml + itemsHtml + itemsHtml + itemsHtml;
        }
      }
    } catch (e) {
      console.error("Erro Partners", e);
    }
  }

  // --- Professors Loader ---
  async function loadProfessors() {
    try {
      const { data } = await supabase.from('professors').select('*').order('display_order', { ascending: true });
      if (data && data.length > 0) {
        const marquee = document.querySelector('.professors-marquee');
        if (marquee) {
          // Generate items HTML matching exact current structure
          const itemsHtml = data.map(p => `
                    <div class="prof-item">
                      <img src="${p.image_url}" alt="${p.name}" title="${p.name}">
                      <div class="prof-overlay">
                        <div class="prof-name">${p.name}</div>
                      </div>
                    </div>
                `).join('');

          // Duplicate for smooth loop
          marquee.innerHTML = itemsHtml + itemsHtml + itemsHtml + itemsHtml;
        }
      }
    } catch (e) {
      console.error("Erro Professors", e);
    }
  }

  // --- Features Loader ---
  async function loadFeatures() {
    try {
      const { data, error } = await supabase.from('features').select('*').order('display_order', { ascending: true });
      if (data && data.length > 0) {
        const grid = document.querySelector('.feature-grid');
        grid.innerHTML = data.map(item => `
                <div class="flip-card">
                    <div class="flip-card-inner">
                        <div class="flip-card-front">
                            <img src="${item.icon_url}" class="feature-icon-svg" style="width: 64px; height: 64px; object-fit: contain;">
                            <div class="feature-text-group">
                                <span class="feature-line-1">${item.title_1}</span>
                                <span class="feature-line-2">${item.title_2}</span>
                            </div>
                        </div>
                        <div class="flip-card-back">
                            <p>${item.description}</p>
                        </div>
                    </div>
                </div>
              `).join('');
      }
    } catch (e) {
      console.error("Erro Features", e);
    }
  }

  // --- Why FICV Loader ---
  async function loadWhyFICV() {
    try {
      const { data, error } = await supabase.from('site_content').select('*').eq('section', 'about');
      if (data && data.length > 0) {
        const content = {};
        data.forEach(item => content[item.item_key] = item.content_value);

        // Update Image
        if (content['about_image']) document.querySelector('.why-ficv-split .image-col img').src = content['about_image'];

        // Update Title
        const titleEl = document.querySelector('.why-ficv-split h2');
        if (content['about_title_prefix'] || content['about_title_highlight']) {
          titleEl.innerHTML = `${content['about_title_prefix'] || 'Por que a'} <span>${content['about_title_highlight'] || 'FICV?'}</span>`;
        }

        // Update Description
        if (content['about_description']) document.querySelector('.why-ficv-split .text-col p').innerHTML = content['about_description'];

        // Update List
        // Assuming list items are single text lines
        if (content['about_list_1']) {
          const el = document.querySelector('.why-ficv-split .feature-list-simple .item:nth-child(1) span');
          if (el) el.innerText = content['about_list_1'];
        }
        if (content['about_list_2']) {
          const el = document.querySelector('.why-ficv-split .feature-list-simple .item:nth-child(2) span');
          if (el) el.innerText = content['about_list_2'];
        }

        // Update Button
        const btn = document.querySelector('.why-ficv-split .btn');
        if (content['about_button_text']) btn.innerText = content['about_button_text'];
        if (content['about_button_link']) btn.href = content['about_button_link'];
      }
    } catch (e) {
      console.error("Erro About", e);
    }
  }

  // --- Courses Logic (Filter + Drag) ---
  let allCourses = [];

  async function loadCourses() {
    try {
      const { data, error } = await supabase.from('courses').select('*').eq('is_active', true).order('display_order', { ascending: true });

      if (data && data.length > 0) {
        allCourses = data;
        populateFilters();
        renderCourses(allCourses);
        initDragScroll(); // Initialize drag after content is loaded
      }
    } catch (e) {
      console.error("Erro Courses", e);
    }
  }

  function populateFilters() {
    // Get unique values and filter out empty ones
    const levels = [...new Set(allCourses.map(c => c.level).filter(Boolean))];
    const modalities = [...new Set(allCourses.map(c => c.modality).filter(Boolean))];

    const levelSelect = document.getElementById('filterLevel');
    const modalitySelect = document.getElementById('filterModality');

    if (levelSelect) {
      // Clear current apart from first
      while (levelSelect.options.length > 1) { levelSelect.remove(1); }

      levels.forEach(l => {
        const normL = l.trim().normalize("NFC");
        const opt = document.createElement('option');
        opt.value = normL;
        opt.textContent = normL;
        levelSelect.appendChild(opt);
      });
      levelSelect.addEventListener('change', filterCourses);
    }

    if (modalitySelect) {
      while (modalitySelect.options.length > 1) { modalitySelect.remove(1); }

      modalities.forEach(m => {
        const normM = m.trim().normalize("NFC");
        const opt = document.createElement('option');
        opt.value = normM;
        opt.textContent = normM;
        modalitySelect.appendChild(opt);
      });
      modalitySelect.addEventListener('change', filterCourses);
    }
  }

  function filterCourses() {
    const levelSelect = document.getElementById('filterLevel');
    const modalitySelect = document.getElementById('filterModality');

    if (!levelSelect || !modalitySelect) return;

    const levelVal = levelSelect.value.trim().normalize("NFC");
    const modalityVal = modalitySelect.value.trim().normalize("NFC");

    const filtered = allCourses.filter(c => {
      const cLevel = (c.level || '').trim().normalize("NFC");
      const cModality = (c.modality || '').trim().normalize("NFC");

      const levelMatch = !levelVal || cLevel === levelVal;
      const modalityMatch = !modalityVal || cModality === modalityVal;

      return levelMatch && modalityMatch;
    });

    renderCourses(filtered);
  }

  function renderCourses(list) {
    const track = document.querySelector('.courses-track');
    if (!track) return;

    // Reset transform if it was set by old logic
    track.style.transform = 'none';

    if (list.length === 0) {
      track.innerHTML = '<div style="color:#fff; padding:20px;">Nenhum curso encontrado com estes filtros.</div>';
      return;
    }

    track.innerHTML = list.map(course => {
      // Standardize Clean URL: /level/slug (Absolute path to avoid duplication)
      const url = buildCourseUrl(course.level, course.slug);

      return `
                <div class="course-card">
                  <a href="${url}" class="course-card-link" draggable="false" style="text-decoration:none; color:inherit; display:block; height:100%;">
                      <div class="course-image-wrapper">
                        <img src="${course.image_url || 'https://via.placeholder.com/400x300?text=Curso'}" alt="${course.name}" draggable="false">
                        <span class="course-tag">${course.modality || ''}</span>
                      </div>
                      <span class="course-category">${course.level || ''}</span>
                      <h4>${course.name}</h4>
                  </a>
                </div>
            `;
    }).join('');
  }

  function initDragScroll() {
    const slider = document.getElementById('coursesSliderWrapper');
    if (!slider) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    slider.addEventListener('mousedown', (e) => {
      isDown = true;
      slider.style.cursor = 'grabbing';
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => {
      isDown = false;
      slider.style.cursor = 'grab';
    });

    slider.addEventListener('mouseup', () => {
      isDown = false;
      slider.style.cursor = 'grab';
    });

    slider.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 2; // Scroll-fast
      slider.scrollLeft = scrollLeft - walk;
    });

    // Touch support
    slider.addEventListener('touchstart', (e) => {
      isDown = true;
      startX = e.touches[0].pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('touchend', () => {
      isDown = false;
    });

    slider.addEventListener('touchmove', (e) => {
      if (!isDown) return;
      const x = e.touches[0].pageX - slider.offsetLeft;
      const walk = (x - startX) * 2;
      slider.scrollLeft = scrollLeft - walk; // Normalize scroll speed for touch
    });
  }

  // --- Hero Slides Loader ---
  async function loadHeroSlides() {
    try {
      const { data, error } = await supabase.from('slides').select('*').order('display_order', { ascending: true });
      if (data && data.length > 0) {
        const sliderContainer = document.querySelector('.hero-slider');

        const slidesHTML = data.map((slide, index) => `
                  <div class="slide ${index === 0 ? 'active' : ''}">
                    <div class="split-hero">
                      <div class="hero-content reveal fade-right ${index === 0 ? 'active' : ''}">
                        <h2>${slide.title || ''} <br><span class="highlight">${slide.title_highlight || ''}</span></h2>
                        <h3 style="margin-top:10px">${slide.subtitle || ''}</h3>
                        <p>${slide.description || ''}</p>
                        <a href="${slide.button_link || '#'}" class="btn btn-primary btn-large">${slide.button_text || 'Saiba Mais'}</a>
                      </div>
                      <div class="hero-image reveal fade-left ${index === 0 ? 'active' : ''}">
                        <img src="${slide.image_url}" alt="${slide.title}">
                      </div>
                    </div>
                  </div>
              `).join('');

        sliderContainer.innerHTML = slidesHTML;
        initHeroSlider();
      } else {
        initHeroSlider();
      }
    } catch (e) {
      console.error("Erro slides", e);
      initHeroSlider();
    }
  }

  // --- Polos Data Loader ---
  const stateNames = {
    'ac': 'Acre', 'al': 'Alagoas', 'ap': 'Amapá', 'am': 'Amazonas', 'ba': 'Bahia', 'ce': 'Ceará',
    'df': 'Distrito Federal', 'es': 'Espírito Santo', 'go': 'Goiás', 'ma': 'Maranhão', 'mt': 'Mato Grosso',
    'ms': 'Mato Grosso do Sul', 'mg': 'Minas Gerais', 'pa': 'Pará', 'pb': 'Paraíba', 'pr': 'Paraná',
    'pe': 'Pernambuco', 'pi': 'Piauí', 'rj': 'Rio de Janeiro', 'rn': 'Rio Grande do Norte',
    'rs': 'Rio Grande do Sul', 'ro': 'Rondônia', 'rr': 'Roraima', 'sc': 'Santa Catarina',
    'sp': 'São Paulo', 'se': 'Sergipe', 'to': 'Tocantins'
  };

  async function loadPolos() {
    try {
      const { data, error } = await supabase.from('polos').select('*').eq('active', true);
      if (data && data.length > 0) {
        const byState = {};

        data.forEach(p => {
          const state = p.state_code.toLowerCase();
          if (!byState[state]) byState[state] = { name: stateNames[state] || state.toUpperCase(), cities: {} };

          const city = p.city;
          if (!byState[state].cities[city]) byState[state].cities[city] = [];

          byState[state].cities[city].push(p);
        });

        // Populate global polosData
        Object.keys(byState).forEach(stateCode => {
          const stateObj = byState[stateCode];
          const citiesList = Object.keys(stateObj.cities).map(cityName => ({
            name: cityName,
            items: stateObj.cities[cityName]
          }));
          polosData[stateCode] = {
            name: stateObj.name,
            cities: citiesList
          };
        });
        console.log('Polos Loaded', polosData);
      }
    } catch (e) {
      console.error("Erro Polos Fetch", e);
    }
  }

  // --- Hero Slider Logic ---
  function initHeroSlider() {
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.querySelector('.prev-slide');
    const nextBtn = document.querySelector('.next-slide');
    let currentSlide = 0;
    let slideInterval;

    function showSlide(index) {
      slides.forEach((slide, i) => {
        slide.classList.remove('active');
        if (i === index) {
          slide.classList.add('active');
          const reveals = slide.querySelectorAll('.reveal');
          reveals.forEach(el => {
            el.classList.remove('active');
            void el.offsetWidth;
            el.classList.add('active');
          });
        }
      });
    }

    function nextSlide() {
      currentSlide = (currentSlide + 1) % slides.length;
      showSlide(currentSlide);
    }

    function prevSlide() {
      currentSlide = (currentSlide - 1 + slides.length) % slides.length;
      showSlide(currentSlide);
    }

    // Re-attach listeners properly
    if (prevBtn && nextBtn) {
      // Clone to remove old listeners if any
      const newPrev = prevBtn.cloneNode(true);
      const newNext = nextBtn.cloneNode(true);
      prevBtn.parentNode.replaceChild(newPrev, prevBtn);
      nextBtn.parentNode.replaceChild(newNext, nextBtn);

      newPrev.addEventListener('click', () => {
        clearInterval(slideInterval);
        prevSlide();
        slideInterval = setInterval(nextSlide, 5000);
      });
      newNext.addEventListener('click', () => {
        clearInterval(slideInterval);
        nextSlide();
        slideInterval = setInterval(nextSlide, 5000);
      });
    }

    if (slides.length > 0) {
      if (slideInterval) clearInterval(slideInterval);
      slideInterval = setInterval(nextSlide, 5000);
      showSlide(0);
    }
  }

  // SCROLL REVEAL ANIMATIONS
  function initScrollAnimations() {
    const reveals = document.querySelectorAll('.reveal');

    const observerOptions = {
      threshold: 0.15, // Trigger when 15% visible
      rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add('active');
        // Optional: Stop observing once revealed
        observer.unobserve(entry.target);
      });
    }, observerOptions);

    reveals.forEach(el => {
      observer.observe(el);
    });
  }

  // STICKY HEADER
  function initStickyHeader() {
    const header = document.getElementById('main-header');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });

  }

  // SCROLL INDICATOR FADE OUT
  function initScrollIndicator() {
    const scrollIndicator = document.querySelector('.scroll-down');
    if (scrollIndicator) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
          scrollIndicator.style.opacity = '0';
          scrollIndicator.style.transition = 'opacity 0.5s';
          scrollIndicator.style.pointerEvents = 'none'; // Prevent clicks when hidden
        } else {
          scrollIndicator.style.opacity = '1';
          scrollIndicator.style.pointerEvents = 'auto';
        }
      });
    }
  }

  // SMOOTH SCROLL FOR ANCHOR LINKS
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const targetSection = document.querySelector(targetId);
        if (targetSection) {
          targetSection.scrollIntoView({
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // --- Courses Slider (Auto Scroll Left) ---
  const track = document.querySelector('.courses-track');
  let scrollAmount = 0;
  const speed = 1; // Pixels per frame

  function scrollCourses() {
    if (!track) return;
    scrollAmount -= speed;
    const firstCard = track.firstElementChild;
    if (firstCard) {
      const cardStyle = getComputedStyle(firstCard);
      const cardWidth = firstCard.offsetWidth + parseInt(cardStyle.marginLeft) + parseInt(cardStyle.marginRight) + 30; // 30 gap

      if (Math.abs(scrollAmount) >= cardWidth) {
        track.appendChild(firstCard); // Move first to last
        scrollAmount += cardWidth;
        track.style.transition = 'none';
        track.style.transform = `translateX(${scrollAmount}px)`;
        setTimeout(() => {
          track.style.transition = 'transform 0.5s linear'; // Restore transition
        }, 50);
      } else {
        // track.style.transform = `translateX(${scrollAmount}px)`;
      }
    }
  }

  if (track) {
    let scrollInterval = setInterval(() => {
      const cards = track.querySelectorAll('.course-card');
      if (cards.length > 3) { // Only scroll if we have enough cards to make it look like a slider
        const firstCard = cards[0];
        const cardWidth = firstCard.offsetWidth + 30; // approx gap
        track.style.transition = 'transform 0.8s ease-in-out';
        track.style.transform = `translateX(-${cardWidth}px)`;

        setTimeout(() => {
          track.style.transition = 'none';
          track.style.transform = 'translateX(0)';
          track.appendChild(firstCard);
        }, 800);
      } else {
        // Reset transform if not scrolling
        track.style.transform = 'none';
        track.style.transition = 'none';
      }
    }, 4000);
  }

  // --- Load Interactive Map & Data ---
  const polosData = {
    // Mock Data Generator for demonstration
  };

  // Specific data override for PB (example)
  polosData['pb'] = {
    name: "Paraíba",
    cities: [
      {
        name: "João Pessoa",
        items: [
          {
            name: "Polo Bessa",
            address: "Av. Gov. Flávio Ribeiro Coutinho, 500",
            phone: "(83) 3030-3030",
            email: "bessa@ficv.edu.br",
            schedule: "Seg a Sex: 14h às 22h"
          },
          {
            name: "Polo Centro",
            address: "Pça. Pedro Américo, 70",
            phone: "(83) 3222-2222",
            email: "centro@ficv.edu.br",
            schedule: "Seg a Sex: 08h às 18h"
          },
          {
            name: "Polo Mangabeira",
            address: "Av. Hilton Souto Maior, 3000",
            phone: "(83) 3333-3333",
            email: "mangabeira@ficv.edu.br",
            schedule: "Seg a Sex: 13h às 21h"
          }
        ]
      },
      {
        name: "Campina Grande",
        items: [
          {
            name: "Polo Prata",
            address: "Rua Rodrigues Alves, 400",
            phone: "(83) 3344-4444",
            email: "cg@ficv.edu.br",
            schedule: "Seg a Sex: 09h às 20h"
          }
        ]
      }
    ]
  };


  const mapContainer = document.querySelector('.polos-image-map');
  const modalOverlay = document.getElementById('polosModalOverlay');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalTitle = document.getElementById('modalStateTitle');
  const listContainer = document.getElementById('polosListContainer');
  const searchInput = document.getElementById('poloSearchInput');
  let currentPolosData = null; // Store current state data for filtering

  if (mapContainer) {
    fetch('/images/brazil.svg')
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.text();
      })
      .then(svgText => {
        mapContainer.innerHTML = svgText;
        setTimeout(initMapInteraction, 100);
      })
      .catch(error => console.error('Error loading map:', error));
  }

  function initMapInteraction() {
    const paths = document.querySelectorAll('.polos-image-map path');
    if (paths.length === 0) return;

    // Tooltip logic
    let tooltip = document.querySelector('.map-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'map-tooltip';
      document.querySelector('.polos-image-map').appendChild(tooltip);
    }

    paths.forEach(path => {
      path.addEventListener('mouseenter', (e) => {
        const stateName = path.getAttribute('aria-label') || path.getAttribute('name') || path.id.toUpperCase();
        tooltip.textContent = `Ver polos em ${stateName}`;
        tooltip.classList.add('active');
        positionTooltip(e, tooltip);
      });

      path.addEventListener('mousemove', (e) => {
        positionTooltip(e, tooltip);
      });

      path.addEventListener('mouseleave', () => {
        tooltip.classList.remove('active');
      });

      // Click Event to Open Modal
      path.addEventListener('click', () => {
        const stateCode = path.id.toLowerCase();
        const stateName = path.getAttribute('aria-label') || path.getAttribute('name') || stateCode.toUpperCase();

        openPolosModal(stateCode, stateName);
      });
    });

    // Pre-select Paraíba (PB)
    const pbPath = document.querySelector('.polos-image-map path[id="pb"]') || document.querySelector('.polos-image-map path[id="PB"]');
    if (pbPath) {
      pbPath.classList.add('active-state');
    }
  }

  function positionTooltip(e, tooltip) {
    const parent = document.querySelector('.polos-image-map');
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    let left = e.clientX - rect.left;
    let top = e.clientY - rect.top - 30;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  // --- Modal Logic ---

  function openPolosModal(stateCode, stateName) {
    modalTitle.textContent = `Polos em ${stateName}`;
    searchInput.value = ''; // Reset search

    // Get Data
    let data = polosData[stateCode];
    if (!data) {
      // If no data exists for this state, create empty structure to trigger "Coming Soon" message
      data = {
        name: stateName,
        cities: []
      };
    }
    currentPolosData = data; // Save for filtering

    renderPolosList(data);
    modalOverlay.classList.add('active');
  }

  function closePolosModal() {
    modalOverlay.classList.remove('active');
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closePolosModal);
  }

  // Close when clicking outside modal
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closePolosModal();
      }
    });
  }

  // Render List with Interaction
  function renderPolosList(data, filterText = '') {
    listContainer.innerHTML = '';

    const cities = data.cities;
    let hasResults = false;

    // Special check for empty state (no polos registered at all)
    // Only if we are not filtering (initial view)
    if (cities.length === 0 && filterText === '') {
      listContainer.innerHTML = '<div class="polo-list-state-msg" style="text-align:center; padding: 20px; font-size: 1.1rem; color: var(--color-text);">Aguarde, em breve novos polos da FICV nesta região.</div>';
      return;
    }

    cities.forEach(city => {
      // Filter logic
      // Check if city name matches OR if any item matches
      const cityMatches = city.name.toLowerCase().includes(filterText.toLowerCase());
      const matchingItems = city.items.filter(item =>
        item.name.toLowerCase().includes(filterText.toLowerCase()) ||
        item.address.toLowerCase().includes(filterText.toLowerCase())
      );

      if (cityMatches || matchingItems.length > 0) {
        hasResults = true;

        const cityGroup = document.createElement('div');
        cityGroup.className = 'city-group';

        const cityHeader = document.createElement('div');
        cityHeader.className = 'city-header';
        cityHeader.textContent = city.name;
        cityGroup.appendChild(cityHeader);

        // If city matches, show all. If not, show only matching items.
        // Actually, usually user wants to see everything in a city if searching for city.
        // Let's iterate items to display.
        const itemsToShow = cityMatches ? city.items : matchingItems;

        itemsToShow.forEach(item => {
          const poloItem = document.createElement('div');
          poloItem.className = 'polo-item';

          // Detail HTML
          let detailsHtml = `
             <div class="polo-details-content">
                <div class="polo-detail-row"><i class="fas fa-phone"></i> <span>${item.phone}</span></div>
                <div class="polo-detail-row"><i class="fas fa-envelope"></i> <span>${item.email}</span></div>
                <div class="polo-detail-row"><i class="fas fa-clock"></i> <span>${item.schedule}</span></div>
                ${item.maps_link ? `<div class="polo-detail-row" style="margin-top:5px"><a href="${item.maps_link}" target="_blank" style="color:var(--color-secondary); font-size:0.85rem">Ver no Google Maps <i class="fas fa-external-link-alt" style="width:auto; font-size: 0.7rem"></i></a></div>` : ''}
             </div>
          `;

          poloItem.innerHTML = `
              <div class="polo-info">
                  <strong>${item.name}</strong>
                  <span>${item.address}</span>
              </div>
              <div class="polo-actions">
                  <button class="btn-small toggle-details-btn">Ver Detalhes</button>
              </div>
              ${detailsHtml}
          `;

          // Toggle Event
          const toggleBtn = poloItem.querySelector('.toggle-details-btn');
          toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const parent = e.target.closest('.polo-item');
            parent.classList.toggle('expanded');

            if (parent.classList.contains('expanded')) {
              e.target.textContent = 'Fechar';
              e.target.style.background = 'var(--color-secondary)';
              e.target.style.color = '#000';
            } else {
              e.target.textContent = 'Ver Detalhes';
              e.target.style.background = 'transparent';
              e.target.style.color = 'var(--color-secondary)';
            }
          });

          cityGroup.appendChild(poloItem);
        });

        listContainer.appendChild(cityGroup);
      }
    });

    if (!hasResults && filterText !== '') {
      listContainer.innerHTML = '<div class="polo-list-state-msg">Nenhum polo encontrado para essa busca.</div>';
    }
  }

  // Search Listener
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      if (currentPolosData) {
        renderPolosList(currentPolosData, e.target.value);
      }
    });
  }

  initStickyHeader();
  initSmoothScroll();
  initScrollIndicator();
});
