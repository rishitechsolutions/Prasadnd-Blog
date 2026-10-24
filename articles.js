(() => {
    const grid = document.querySelector('.beyond-articles-grid');
    if (!grid) return;

    const svgNamespace = 'http://www.w3.org/2000/svg';
    const makeElement = (tag, className, text) => {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    };

    const applyCurrentCategory = () => {
        const selected = new URLSearchParams(window.location.search).get('category') || '';
        document.querySelectorAll('.beyond-category-btn').forEach(button => {
            button.classList.toggle('active', (button.dataset.category || '') === selected);
        });
        document.querySelectorAll('.beyond-article-item[data-category]').forEach(item => {
            item.classList.toggle('filtered-out', Boolean(selected) && selected !== item.dataset.category);
        });
    };

    const addCategoryFilters = categories => {
        const filter = document.querySelector('.beyond-category-filter');
        if (!filter) return;

        const available = new Set(Array.from(filter.querySelectorAll('.beyond-category-btn'), button => button.dataset.category || ''));
        categories.forEach(category => {
            if (typeof category !== 'string' || !category || available.has(category)) return;
            const button = makeElement('a', 'beyond-category-btn', category);
            button.dataset.category = category;
            button.href = `beyond-work.html?category=${encodeURIComponent(category)}`;
            filter.append(button);
            available.add(category);
        });
    };

    const createCard = article => {
        const card = makeElement('a', 'beyond-article-item');
        card.dataset.category = article.category || '';
        card.href = `article.php?slug=${encodeURIComponent(article.slug)}`;
        card.setAttribute('aria-label', `Read ${article.title}`);

        const imageWrap = makeElement('div', 'beyond-article-image scroll-animate');
        if (article.image_path) {
            const image = document.createElement('img');
            image.src = article.image_path;
            image.alt = article.title || 'Article cover';
            image.loading = 'lazy';
            image.addEventListener('error', () => image.remove(), { once: true });
            imageWrap.append(image);
        }

        const overlay = makeElement('div', 'article-image-overlay');
        const publishedDate = article.published_at ? new Date(`${article.published_at.replace(' ', 'T')}Z`) : null;
        const dateText = publishedDate && !Number.isNaN(publishedDate.valueOf())
            ? ` · ${publishedDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}`
            : '';
        overlay.append(makeElement('span', 'article-meta', `${article.category || 'Beyond Work'}${dateText}`));
        imageWrap.append(overlay);

        const hoverIcon = makeElement('div', 'article-hover-icon');
        const icon = document.createElementNS(svgNamespace, 'svg');
        icon.setAttribute('width', '24');
        icon.setAttribute('height', '24');
        icon.setAttribute('viewBox', '0 0 24 24');
        icon.setAttribute('fill', 'none');
        icon.setAttribute('stroke', 'currentColor');
        icon.setAttribute('stroke-width', '2');
        const circle = document.createElementNS(svgNamespace, 'circle');
        circle.setAttribute('cx', '12');
        circle.setAttribute('cy', '12');
        circle.setAttribute('r', '10');
        const path = document.createElementNS(svgNamespace, 'path');
        path.setAttribute('d', 'M12 8l4 4-4 4M8 12h8');
        icon.append(circle, path);
        hoverIcon.append(icon);
        imageWrap.append(hoverIcon);

        const content = makeElement('div', 'beyond-article-content');
        content.append(makeElement('h4', 'scroll-animate scroll-animate-delay-1', article.title || 'Untitled article'));
        content.append(makeElement('p', 'beyond-article-excerpt scroll-animate scroll-animate-delay-2', article.excerpt || ''));
        content.append(makeElement('span', 'beyond-read-more', 'Read More'));
        card.append(imageWrap, content);
        return card;
    };

    fetch('/api/articles.php', { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
        .then(response => {
            if (!response.ok) throw new Error('Articles are unavailable.');
            return response.json();
        })
        .then(payload => {
            if (!Array.isArray(payload.articles)) return;
            addCategoryFilters(Array.isArray(payload.categories) ? payload.categories : []);
            const cards = payload.articles.map(createCard);
            grid.prepend(...cards);
            applyCurrentCategory();
            if (typeof window.initScrollAnimations === 'function') window.initScrollAnimations();
        })
        .catch(error => console.error('Could not load published articles:', error));
})();