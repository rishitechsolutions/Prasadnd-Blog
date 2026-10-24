document.addEventListener('DOMContentLoaded', () => {
    const editor = document.querySelector('[data-article-editor]');
    const contentField = document.querySelector('[data-article-content]');
    const form = document.querySelector('[data-article-form]');
    const titleField = document.querySelector('[name="title"]');
    const slugField = document.querySelector('[name="slug"]');
    const imageField = document.querySelector('[name="image"]');
    const imagePreview = document.querySelector('[data-image-preview]');
    const galleryField = document.querySelector('[data-gallery-input]');
    const galleryPreview = document.querySelector('[data-gallery-preview]');
    let slugWasEdited = Boolean(slugField?.value);

    const makeSlug = value => value.normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 255);

    if (slugField) {
        slugField.addEventListener('input', () => { slugWasEdited = true; });
    }
    if (titleField && slugField) {
        titleField.addEventListener('input', () => {
            if (!slugWasEdited) slugField.value = makeSlug(titleField.value);
        });
    }

    document.querySelectorAll('[data-editor-command]').forEach(button => {
        button.addEventListener('mousedown', event => event.preventDefault());
        button.addEventListener('click', () => {
            if (!editor) return;
            const command = button.dataset.editorCommand;
            if (command === 'link') {
                const url = window.prompt('Enter a web address or email link');
                if (url) document.execCommand('createLink', false, url);
                return;
            }
            document.execCommand(command, false, button.dataset.editorValue || null);
            editor.focus();
        });
    });

    if (form && editor && contentField) {
        form.addEventListener('submit', () => { contentField.value = editor.innerHTML; });
    }

    if (imageField && imagePreview) {
        imageField.addEventListener('change', () => {
            const file = imageField.files?.[0];
            if (!file) return;
            const nextUrl = URL.createObjectURL(file);
            const previousUrl = imagePreview.dataset.objectUrl;
            imagePreview.src = nextUrl;
            imagePreview.hidden = false;
            imagePreview.dataset.objectUrl = nextUrl;
            if (previousUrl) URL.revokeObjectURL(previousUrl);
        });
    }

    if (galleryField && galleryPreview) {
        let previewUrls = [];
        galleryField.addEventListener('change', () => {
            previewUrls.forEach(url => URL.revokeObjectURL(url));
            previewUrls = [];
            galleryPreview.replaceChildren();

            const files = Array.from(galleryField.files || []);
            const keptImages = Array.from(document.querySelectorAll('[data-gallery-current-item] input[type="checkbox"]'))
                .filter(checkbox => !checkbox.checked).length;
            const limit = Number(galleryField.dataset.galleryLimit || 8);
            if (keptImages + files.length > limit) {
                window.alert(`Keep no more than ${limit} gallery photos in total.`);
                galleryField.value = '';
                return;
            }

            files.forEach((file, index) => {
                const url = URL.createObjectURL(file);
                previewUrls.push(url);
                const item = document.createElement('figure');
                item.className = 'admin-gallery-item';
                const image = document.createElement('img');
                image.src = url;
                image.alt = `Selected gallery image ${index + 1}`;
                item.append(image);
                galleryPreview.append(item);
            });
        });
    }

    document.querySelectorAll('[data-delete-form]').forEach(deleteForm => {
        deleteForm.addEventListener('submit', event => {
            if (!window.confirm('Delete this article permanently?')) event.preventDefault();
        });
    });
});