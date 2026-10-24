<?php
declare(strict_types=1);

function article_categories(): array
{
    return ['Places', 'Relationships', 'Adventures', 'Savors', 'Artifacts', 'Dialogues'];
}

function canonical_article_category(string $value): ?string
{
    foreach (article_categories() as $category) {
        if (strcasecmp(trim($value), $category) === 0) {
            return $category;
        }
    }

    return null;
}

function clean_article_content(string $html): string
{
    if (!class_exists(DOMDocument::class)) {
        return '<p>' . nl2br(htmlspecialchars($html, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')) . '</p>';
    }

    $previous = libxml_use_internal_errors(true);
    $source = new DOMDocument('1.0', 'UTF-8');
    $source->loadHTML('<?xml encoding="UTF-8"><!DOCTYPE html><html><body><div id="article-source">' . $html . '</div></body></html>', LIBXML_NONET | LIBXML_HTML_NODEFDTD);
    libxml_clear_errors();
    libxml_use_internal_errors($previous);

    $sourceRoot = $source->getElementById('article-source');
    if (!$sourceRoot) {
        return '';
    }

    $clean = new DOMDocument('1.0', 'UTF-8');
    $output = '';
    foreach ($sourceRoot->childNodes as $child) {
        $safeNode = clean_article_node($child, $clean);
        if ($safeNode !== null) {
            $output .= $clean->saveHTML($safeNode);
        }
    }

    return $output;
}

function article_image_url(?string $path): ?string
{
    if (!$path || !preg_match('~^uploads/articles/[a-f0-9]{32}\.(jpg|png|webp)$~', $path)) {
        return null;
    }

    return '/' . $path;
}

function article_gallery_paths(?string $encodedPaths): array
{
    if (!$encodedPaths) {
        return [];
    }

    $paths = json_decode($encodedPaths, true);
    if (!is_array($paths)) {
        return [];
    }

    return array_values(array_unique(array_filter(
        $paths,
        static fn($path): bool => is_string($path) && article_image_url($path) !== null
    )));
}

function clean_article_node(DOMNode $node, DOMDocument $target): ?DOMNode
{
    if ($node instanceof DOMText) {
        return $target->createTextNode($node->nodeValue ?? '');
    }

    if (!$node instanceof DOMElement) {
        return null;
    }

    $tag = strtolower($node->tagName);
    if (in_array($tag, ['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'template'], true)) {
        return null;
    }

    $allowed = ['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'blockquote', 'br', 'a'];
    if (!in_array($tag, $allowed, true)) {
        $fragment = $target->createDocumentFragment();
        foreach ($node->childNodes as $child) {
            $safeChild = clean_article_node($child, $target);
            if ($safeChild !== null) {
                $fragment->appendChild($safeChild);
            }
        }
        return $fragment;
    }

    $element = $target->createElement($tag);
    if ($tag === 'a') {
        $href = trim($node->getAttribute('href'));
        if (safe_article_href($href)) {
            $element->setAttribute('href', $href);
            if (preg_match('/^([a-z][a-z0-9+.-]*):/i', $href, $matches) && in_array(strtolower($matches[1]), ['http', 'https'], true)) {
                $element->setAttribute('rel', 'nofollow noopener noreferrer');
            }
        }
    }

    foreach ($node->childNodes as $child) {
        $safeChild = clean_article_node($child, $target);
        if ($safeChild !== null) {
            $element->appendChild($safeChild);
        }
    }

    return $element;
}

function safe_article_href(string $href): bool
{
    if ($href === '' || str_contains($href, chr(92))) {
        return false;
    }

    for ($index = 0, $length = strlen($href); $index < $length; $index++) {
        if (ord($href[$index]) <= 0x20) {
            return false;
        }
    }

    if (preg_match('/^([a-z][a-z0-9+.-]*):/i', $href, $matches)) {
        return in_array(strtolower($matches[1]), ['http', 'https', 'mailto', 'tel'], true);
    }

    return !str_starts_with($href, '//');
}