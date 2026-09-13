import os
import html
import xml.etree.ElementTree as ET
from pathlib import Path
from datetime import datetime


POSTS_DIR = Path("posts")
BLOG_DIR = Path("blog")

BLOG_DIR.mkdir(exist_ok=True)


def text(element):
    if element is None:
        return ""

    return "".join(element.itertext()).strip()


def generate_content(content):
    output = []

    if content is None:
        return ""

    for element in content:

        if element.tag == "paragraph":
            output.append(
                f"<p>{html.escape(text(element))}</p>"
            )

        elif element.tag == "heading":
            output.append(
                f"<h2>{html.escape(text(element))}</h2>"
            )

        elif element.tag == "subheading":
            output.append(
                f"<h3>{html.escape(text(element))}</h3>"
            )

        elif element.tag == "quote":
            output.append(
                f"<blockquote>{html.escape(text(element))}</blockquote>"
            )

        elif element.tag == "image":
            src = html.escape(element.get("src", ""))
            alt = html.escape(element.get("alt", ""))

            output.append(
                f"""
                <figure>
                    <img src="../{src}" alt="{alt}">
                </figure>
                """
            )

    return "\n".join(output)


def generate_post(xml_file):
    tree = ET.parse(xml_file)
    root = tree.getroot()

    title = text(root.find("title"))
    slug = text(root.find("slug"))
    date = text(root.find("date"))
    description = text(root.find("description"))

    content = generate_content(root.find("content"))

    page = f"""<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>{html.escape(title)} - Joe Rickwood</title>

    <meta
        name="description"
        content="{html.escape(description)}"
    >

    <link rel="stylesheet" href="../stylesheet.css">

</head>

<body>

<main class="container">

    <article class="blog-post">

        <a href="../index.html" class="blog-back">
            ← BACK
        </a>

        <header class="blog-header">

            <div class="eyebrow">
                BLOG
            </div>

            <h1>
                {html.escape(title)}
            </h1>

            <div class="blog-date">
                {html.escape(date)}
            </div>

        </header>

        <div class="blog-content">

            {content}

        </div>

    </article>

</main>

<footer>
</footer>

</body>

</html>
"""

    output_file = BLOG_DIR / f"{slug}.html"

    output_file.write_text(
        page,
        encoding="utf-8"
    )

    print(f"Generated {output_file}")


def generate_index(posts):
    cards = []

    for post in posts:

        title = text(post.find("title"))
        slug = text(post.find("slug"))
        date = text(post.find("date"))
        description = text(post.find("description"))

        cards.append(
            f"""
            <a href="{slug}.html" class="blog-card">

                <div class="blog-card-date">
                    {html.escape(date)}
                </div>

                <h3>
                    {html.escape(title)}
                </h3>

                <p>
                    {html.escape(description)}
                </p>

                <span class="blog-read">
                    READ ARTICLE →
                </span>

            </a>
            """
        )

    cards_html = "\n".join(cards)

    page = f"""<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>Blog - Joe Rickwood</title>

    <link rel="stylesheet" href="../stylesheet.css">

</head>

<body>

<main class="container">

    <section class="hero">

        <div class="eyebrow">
            JOE RICKWOOD
        </div>

        <h1>
            BLOG
        </h1>

        <p class="intro">
            Thoughts, development logs and other things
            I've been working on.
        </p>

        <div class="links">

            <a href="../index.html" class="link blue">
                ← HOME
            </a>

        </div>

    </section>

    <section class="section">

        <div class="blog-list">

            {cards_html}

        </div>

    </section>

</main>

<footer>
</footer>

</body>

</html>
"""

    (BLOG_DIR / "index.html").write_text(
        page,
        encoding="utf-8"
    )


def main():

    posts = []

    for xml_file in POSTS_DIR.glob("*.xml"):

        tree = ET.parse(xml_file)
        root = tree.getroot()

        posts.append(root)

        generate_post(xml_file)

    posts.sort(
        key=lambda post: text(post.find("date")),
        reverse=True
    )

    generate_index(posts)


if __name__ == "__main__":
    main()