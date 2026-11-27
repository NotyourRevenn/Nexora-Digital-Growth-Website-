/**
 * NEXORA DIGITAL x XOLIO JAVASCRIPT ENGINE
 * Handles interactive components, navigation, scrollspy,
 * case studies carousel, pricing toggles, FAQs, and WhatsApp integrations.
 */

document.addEventListener('DOMContentLoaded', () => {

  // --- 0. Adaptive Theme Engine (Dark & Light Mode) ---
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const mobileThemeToggleBtn = document.getElementById('mobileThemeToggleBtn');

  function initTheme() {
    const savedTheme = localStorage.getItem('nexora-theme');
    if (savedTheme === 'dark') {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
    } else {
      // Light Theme (Celadon Porcelain & Nordic Sage) is the default landing theme
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
    }
  }

  function toggleTheme() {
    const isDark = document.body.classList.contains('dark-theme');
    if (isDark) {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      localStorage.setItem('nexora-theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
      localStorage.setItem('nexora-theme', 'dark');
    }
  }

  if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
  if (mobileThemeToggleBtn) mobileThemeToggleBtn.addEventListener('click', toggleTheme);
  initTheme();

  // --- 1. Sticky Navigation & Scroll State ---
  const siteHeader = document.getElementById('siteHeader');
  const backToTopBtn = document.getElementById('backToTopBtn');

  window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY;

    // Header sticky shadow & blur
    if (scrollPos > 40) {
      siteHeader.classList.add('scrolled');
    } else {
      siteHeader.classList.remove('scrolled');
    }

    // Back to top button visibility
    if (backToTopBtn) {
      if (scrollPos > 400) {
        backToTopBtn.classList.add('show');
      } else {
        backToTopBtn.classList.remove('show');
      }
    }
  });

  // Smooth scroll back to top
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // --- 2. ScrollSpy: Synchronize Active Nav Link With Visible Section ---
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.desktop-nav .nav-link');
  const drawerLinks = document.querySelectorAll('.drawer-links .drawer-link');

  function updateActiveNavLink() {
    const scrollY = window.pageYOffset;

    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute('id');

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        // Desktop nav links
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });

        // Mobile drawer links
        drawerLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveNavLink);
  updateActiveNavLink(); // Initial sync on load

  // --- 3. Mobile Drawer Navigation ---
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const mobileDrawerOverlay = document.getElementById('mobileDrawerOverlay');
  const drawerCloseBtn = document.getElementById('drawerCloseBtn');

  function openDrawer() {
    mobileDrawer.classList.add('open');
    mobileDrawerOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    mobileDrawer.classList.remove('open');
    mobileDrawerOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (mobileToggle) mobileToggle.addEventListener('click', openDrawer);
  if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);
  if (mobileDrawerOverlay) mobileDrawerOverlay.addEventListener('click', closeDrawer);

  drawerLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // --- 4. Project Showcase (Case Studies) Carousel Sync ---
  const showcaseCards = document.querySelectorAll('.showcase-card');
  const prevBtn = document.getElementById('showcasePrevBtn');
  const nextBtn = document.getElementById('showcaseNextBtn');
  let currentCardIndex = 0;

  function highlightShowcaseCard(index) {
    showcaseCards.forEach((card, i) => {
      if (i === index) {
        card.classList.add('active-focus');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        card.classList.remove('active-focus');
      }
    });
  }

  if (prevBtn && nextBtn && showcaseCards.length > 0) {
    nextBtn.addEventListener('click', () => {
      currentCardIndex = (currentCardIndex + 1) % showcaseCards.length;
      highlightShowcaseCard(currentCardIndex);
    });

    prevBtn.addEventListener('click', () => {
      currentCardIndex = (currentCardIndex - 1 + showcaseCards.length) % showcaseCards.length;
      highlightShowcaseCard(currentCardIndex);
    });
  }

  // --- 5. FAQ Accordion: Seamless Synchronization ---
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question-btn');
    const answerBlock = item.querySelector('.faq-answer-block');

    if (questionBtn && answerBlock) {
      questionBtn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close other FAQs smoothly
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
            const otherAnswer = otherItem.querySelector('.faq-answer-block');
            if (otherAnswer) otherAnswer.style.maxHeight = null;
          }
        });

        // Toggle clicked FAQ
        if (isActive) {
          item.classList.remove('active');
          answerBlock.style.maxHeight = null;
        } else {
          item.classList.add('active');
          answerBlock.style.maxHeight = answerBlock.scrollHeight + 'px';
        }
      });
    }
  });

  // Open first FAQ by default
  if (faqItems.length > 0) {
    const firstFaq = faqItems[0];
    firstFaq.classList.add('active');
    const firstAnswer = firstFaq.querySelector('.faq-answer-block');
    if (firstAnswer) firstAnswer.style.maxHeight = firstAnswer.scrollHeight + 'px';
  }

  // --- 6. Pricing Toggle Switch (Monthly vs. Annual) ---
  const pricingToggleBtn = document.getElementById('pricingToggleBtn');
  const starterPrice = document.getElementById('starterPrice');
  const growthPrice = document.getElementById('growthPrice');
  const premiumPrice = document.getElementById('premiumPrice');
  const pricePeriodElements = document.querySelectorAll('.price-period');

  let isAnnual = false;

  if (pricingToggleBtn) {
    pricingToggleBtn.addEventListener('click', () => {
      isAnnual = !isAnnual;
      pricingToggleBtn.classList.toggle('active', isAnnual);

      if (isAnnual) {
        if (starterPrice) starterPrice.textContent = '19,999';
        if (growthPrice) growthPrice.textContent = '39,999';
        if (premiumPrice) premiumPrice.textContent = '79,999';
        pricePeriodElements.forEach(el => el.textContent = '/ sprint (Annual Retainer)');
      } else {
        if (starterPrice) starterPrice.textContent = '24,999';
        if (growthPrice) growthPrice.textContent = '49,999';
        if (premiumPrice) premiumPrice.textContent = '99,999';
        pricePeriodElements.forEach(el => el.textContent = '/ sprint');
      }
    });
  }

  // --- 7. Interactive Proposal Modal ---
  const proposalModal = document.getElementById('proposalModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalPlanName = document.getElementById('modalPlanName');
  const modalPlanSelect = document.getElementById('modalPlanSelect');
  const openModalBtns = document.querySelectorAll('[data-open-modal]');

  function openProposalModal(planName) {
    if (modalPlanName) modalPlanName.textContent = planName || 'Growth Plan';
    if (modalPlanSelect && planName) {
      modalPlanSelect.value = planName;
    }
    if (proposalModal) {
      proposalModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeProposalModal() {
    if (proposalModal) {
      proposalModal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  openModalBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const plan = btn.getAttribute('data-plan') || 'Growth Plan';
      openProposalModal(plan);
    });
  });

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeProposalModal);
  if (proposalModal) {
    proposalModal.addEventListener('click', (e) => {
      if (e.target === proposalModal) closeProposalModal();
    });
  }

  // Close modal on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProposalModal();
      closeDrawer();
    }
  });

  // --- 8. Asynchronous Form Submission to Database (No forced WhatsApp redirect) ---
  const consultationForm = document.getElementById('consultationForm');
  const consultationSuccessBox = document.getElementById('consultationSuccessBox');
  const consultationSuccessMsg = document.getElementById('consultationSuccessMsg');

  if (consultationForm) {
    consultationForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('cName')?.value || 'Guest';
      const email = document.getElementById('cEmail')?.value || '';
      const phone = document.getElementById('cPhone')?.value || '';
      const goal = document.getElementById('cGoal')?.value || 'General Scaling';
      const notes = document.getElementById('cNotes')?.value || '';

      const submitBtn = document.getElementById('consultationSubmitBtn') || consultationForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Saving to CRM...</span> <i class="fa-solid fa-circle-notch fa-spin"></i>';
      }

      try {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            phone,
            goal,
            notes,
            source: 'Consultation Form'
          })
        });

        const data = await res.json();

        if (res.ok) {
          // Success: Display on-page confirmation
          if (consultationSuccessBox) {
            if (consultationSuccessMsg) {
              consultationSuccessMsg.textContent = `Thank you, ${name}! Your proposal request has been logged into our CRM system (Lead #${data.lead_id}). Our lead strategist will review your brand details and reach out within 4 hours.`;
            }
            consultationSuccessBox.style.display = 'block';
            consultationForm.reset();
            consultationSuccessBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        } else {
          alert(data.message || 'Error submitting request. Please try again.');
        }
      } catch (err) {
        // Fallback if running offline without server
        if (consultationSuccessBox) {
          consultationSuccessBox.style.display = 'block';
          consultationForm.reset();
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }
    });
  }

  const modalForm = document.getElementById('modalForm');
  const modalSuccessBox = document.getElementById('modalSuccessBox');

  if (modalForm) {
    modalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('mName')?.value || 'Guest';
      const phone = document.getElementById('mPhone')?.value || '';
      const plan = document.getElementById('modalPlanSelect')?.value || 'Growth Plan';

      const submitBtn = document.getElementById('modalSubmitBtn') || modalForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Saving Request...</span> <i class="fa-solid fa-circle-notch fa-spin"></i>';
      }

      try {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            phone,
            goal: plan,
            budget: plan,
            source: 'Proposal Modal: ' + plan
          })
        });

        if (res.ok) {
          if (modalSuccessBox) modalSuccessBox.style.display = 'block';
          modalForm.reset();
          setTimeout(() => {
            closeProposalModal();
            if (modalSuccessBox) modalSuccessBox.style.display = 'none';
          }, 2000);
        } else {
          closeProposalModal();
        }
      } catch (err) {
        if (modalSuccessBox) modalSuccessBox.style.display = 'block';
        modalForm.reset();
        setTimeout(() => {
          closeProposalModal();
          if (modalSuccessBox) modalSuccessBox.style.display = 'none';
        }, 2000);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }
    });
  }

  // Newsletter Form
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('newsletterEmail');
      const email = emailInput?.value?.trim();
      const submitBtn = newsletterForm.querySelector('button[type="submit"]');

      if (email) {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
        }

        try {
          const res = await fetch('/api/newsletter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          const data = await res.json();
          alert(data.message || `Subscribed successfully!`);
          newsletterForm.reset();
        } catch (err) {
          alert(`Subscribed successfully!`);
          newsletterForm.reset();
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Subscribe Free</span>';
          }
        }
      }
    });
  }

  // --- 9. Interactive Magnetic Neon Cursor ---
  const cursorDot = document.getElementById('cursorDot');
  const cursorGlow = document.getElementById('cursorGlow');

  if (cursorDot && cursorGlow && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let dotX = mouseX, dotY = mouseY;
    let glowX = mouseX, glowY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function renderCursor() {
      // Lerp physics for smooth follow
      dotX += (mouseX - dotX) * 0.7;
      dotY += (mouseY - dotY) * 0.7;
      glowX += (mouseX - glowX) * 0.18;
      glowY += (mouseY - glowY) * 0.18;

      cursorDot.style.left = `${dotX}px`;
      cursorDot.style.top = `${dotY}px`;
      cursorGlow.style.left = `${glowX}px`;
      cursorGlow.style.top = `${glowY}px`;

      requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);

    // Expand glow on clickable elements
    const interactiveTargets = document.querySelectorAll('a, button, input, select, textarea, .orbit-node, .service-card, .price-card, .showcase-card, .industry-chip');
    interactiveTargets.forEach(el => {
      el.addEventListener('mouseenter', () => cursorGlow.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => cursorGlow.classList.remove('cursor-hover'));
    });
  }

  // --- 10. Interactive Constellation Canvas in Hero ---
  const heroCanvas = document.getElementById('heroCanvas');
  if (heroCanvas) {
    const ctx = heroCanvas.getContext('2d');
    let width = heroCanvas.width = heroCanvas.offsetWidth;
    let height = heroCanvas.height = heroCanvas.offsetHeight;

    window.addEventListener('resize', () => {
      if (!heroCanvas) return;
      width = heroCanvas.width = heroCanvas.offsetWidth;
      height = heroCanvas.height = heroCanvas.offsetHeight;
    });

    const particles = [];
    const particleCount = Math.min(Math.floor(width / 25), 45);
    const colors = ['rgba(52, 211, 153, 0.75)', 'rgba(16, 185, 129, 0.75)', 'rgba(5, 150, 105, 0.7)'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2 + 1.2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    let heroMouseX = -1000, heroMouseY = -1000;
    const heroSection = document.getElementById('home');
    if (heroSection) {
      heroSection.addEventListener('mousemove', (e) => {
        const rect = heroCanvas.getBoundingClientRect();
        heroMouseX = e.clientX - rect.left;
        heroMouseY = e.clientY - rect.top;
      });
      heroSection.addEventListener('mouseleave', () => {
        heroMouseX = -1000;
        heroMouseY = -1000;
      });
    }

    function animateCanvas() {
      ctx.clearRect(0, 0, width, height);

      // Update & draw particles
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Mouse repulsion
        const dx = p.x - heroMouseX;
        const dy = p.y - heroMouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const angle = Math.atan2(dy, dx);
          const force = (120 - dist) / 120;
          p.x += Math.cos(angle) * force * 2;
          p.y += Math.sin(angle) * force * 2;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Connect nearby particles
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist2 = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist2 < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${0.25 * (1 - dist2 / 100)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      });

      requestAnimationFrame(animateCanvas);
    }
    requestAnimationFrame(animateCanvas);
  }

  // --- 11. Typing & Cycling Text in Hero Headline ---
  const cyclingText = document.getElementById('cyclingText');
  if (cyclingText) {
    const words = [
      'Data-Driven',
      'High-ROAS',
      'Viral Short-Form',
      'Omnichannel',
      'Compounding'
    ];
    let wordIndex = 0;
    let charIndex = words[0].length;
    let isDeleting = true;
    let typingSpeed = 100;

    function typeCycle() {
      const currentWord = words[wordIndex];

      if (isDeleting) {
        charIndex--;
        typingSpeed = 50;
      } else {
        charIndex++;
        typingSpeed = 90;
      }

      cyclingText.textContent = currentWord.substring(0, charIndex);

      if (!isDeleting && charIndex === currentWord.length) {
        isDeleting = true;
        typingSpeed = 2200; // Pause at full word
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        typingSpeed = 400; // Pause before typing new word
      }

      setTimeout(typeCycle, typingSpeed);
    }
    setTimeout(typeCycle, 2000);
  }

  // --- 12. 3D Tilt with Specular Glare on Cards ---
  const tiltCards = document.querySelectorAll('.service-card, .price-card, .showcase-card, .process-card');
  tiltCards.forEach(card => {
    // Inject glare element
    const glare = document.createElement('div');
    glare.className = 'card-glare';
    card.appendChild(glare);

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -7;
      const rotateY = ((x - centerX) / centerX) * 7;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      glare.style.opacity = '1';
      glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 0.18) 0%, transparent 60%)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      glare.style.opacity = '0';
    });
  });

  // --- 13. Interactive ROI & Revenue Simulator Engine ---
  const budgetSlider = document.getElementById('budgetSlider');
  const budgetDisplayVal = document.getElementById('budgetDisplayVal');
  const projectedRevenue = document.getElementById('projectedRevenue');
  const projectedRoas = document.getElementById('projectedRoas');
  const projectedOrders = document.getElementById('projectedOrders');
  const netProfitMultiplier = document.getElementById('netProfitMultiplier');
  const simulatorCtaBtn = document.getElementById('simulatorCtaBtn');
  const industryChips = document.querySelectorAll('.industry-chip');

  let currentRoas = 4.8;
  let currentCpa = 320;
  let currentMult = 380;
  let currentIndustryName = 'D2C E-Commerce';

  function formatRupees(num) {
    return '₹' + Math.round(num).toLocaleString('en-IN');
  }

  function updateSimulator() {
    if (!budgetSlider) return;
    const spend = parseFloat(budgetSlider.value);
    
    // Format spend display
    if (budgetDisplayVal) {
      budgetDisplayVal.textContent = formatRupees(spend);
    }

    // Calculations
    const revenue = spend * currentRoas;
    const orders = Math.round(spend / currentCpa);

    if (projectedRevenue) projectedRevenue.textContent = formatRupees(revenue);
    if (projectedRoas) projectedRoas.textContent = `${currentRoas.toFixed(1)}x`;
    if (projectedOrders) projectedOrders.textContent = orders.toLocaleString('en-IN');
    if (netProfitMultiplier) netProfitMultiplier.textContent = `+${currentMult}% Net Growth Trajectory`;

    // Update Simulator CTA target to smooth on-page proposal submission
    if (simulatorCtaBtn) {
      simulatorCtaBtn.href = '#contact';
      simulatorCtaBtn.onclick = () => {
        const cNotes = document.getElementById('cNotes');
        if (cNotes) {
          cNotes.value = `Simulator Projection: ${formatRupees(spend)} monthly budget in ${currentIndustryName} (Projected ${formatRupees(revenue)} revenue at ${currentRoas.toFixed(1)}x ROAS).`;
        }
      };
    }
  }

  if (budgetSlider) {
    budgetSlider.addEventListener('input', updateSimulator);
  }

  industryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      industryChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentRoas = parseFloat(chip.dataset.roas || 4.8);
      currentCpa = parseFloat(chip.dataset.cpa || 320);
      currentMult = parseInt(chip.dataset.mult || 380);
      currentIndustryName = chip.querySelector('span')?.textContent || 'General';
      updateSimulator();
    });
  });

  // Initial simulator calculation
  updateSimulator();

  // --- 14. Interactive Orbital Channel Inspector in About Section ---
  const orbitalCenterText = document.getElementById('orbitalCenterText');
  const orbitalCenterLogo = document.getElementById('orbitalCenterLogo');
  const orbitalCenter = document.getElementById('orbitalCenter');
  const orbitNodes = document.querySelectorAll('.orbit-node');

  if (orbitalCenterText && orbitNodes.length) {
    const originalContent = orbitalCenterText.innerHTML;

    function activateOrbitNode(node) {
      const channel = node.dataset.channel || 'Growth';
      const stat = node.dataset.stat || 'High ROAS';
      const color = node.dataset.color || 'var(--primary)';

      orbitalCenterText.innerHTML = `<span style="font-size: 0.72rem; opacity: 0.85; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;">${channel}</span><br><strong style="color: ${color}; font-size: 0.85rem; font-weight: 800;">${stat}</strong>`;
      if (orbitalCenter) {
        orbitalCenter.style.boxShadow = `0 0 35px ${color}88`;
        orbitalCenter.style.borderColor = color;
      }
    }

    function resetOrbitHub() {
      orbitalCenterText.innerHTML = originalContent;
      if (orbitalCenter) {
        orbitalCenter.style.boxShadow = '';
        orbitalCenter.style.borderColor = '';
      }
    }

    orbitNodes.forEach(node => {
      node.addEventListener('mouseenter', () => activateOrbitNode(node));
      node.addEventListener('mouseleave', resetOrbitHub);
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        activateOrbitNode(node);
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.orbit-node') && !e.target.closest('.orbital-center')) {
        resetOrbitHub();
      }
    });
  }

});
