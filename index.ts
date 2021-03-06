// While preparing for your first round interview with Asana, you start exploring Luna, Asana's in-house framework for automating Web application creation. For practice - and fun! - you decide to implement a simple HTML-to-Luna converter.

// To keep things straightforward, you will only consider 4 HTML tags: div, p, b, img. Here's how valid HTML is constructed:

// an empty string is valid HTML;
// <img /> is valid HTML (note the whitespace character between img and /);
// if HTML is valid HTML, then <div>HTML</div>, <p>HTML</p> and
// <b>HTML</b> are all valid.
// if HTML1 and HTML2 are both valid HTML, then HTML1HTML2 is valid HTML.
// For example, <div><p><img /></p><b></b></div> is valid HTML, but <div><p></div> is invalid.

// The conversion of each tag from HTML to Luna format is performed as follows:

// <div><arg1><arg2>...</div> → DIV([arg1, arg2, arg3, ... ]);
// <p><arg1><arg2>...</p> → P([arg1, arg2, arg3, ... ]);
// <b><arg1><arg2>...</b> → B([arg1, arg2, arg3, ... ]);
// <img /> → IMG({})
// Example

// For html = "<div><img /></div>", the output should be htmlToLuna(html) = "DIV([IMG({})])";
// For html = "<div><p><img /></p><b></b></div>", the output should be htmlToLuna(html) = "DIV([P([IMG({})]), B([])])";
// For html = "<div><p></p><p></p><p></p></div>", the output should be htmlToLuna(html) = "DIV([P([]), P([]), P([])])";
// For html = "<div><img /><b></b><img /></div>", the output should be htmlToLuna(html) = "DIV([IMG({}), B([]), IMG({})])".
// Input/Output
// [execution time limit] 5 seconds (ts)

// [input] string html: Valid HTML, containing only these 4 tags: div, p, b, img.

// Guaranteed constraints: 0 ≤ html.length ≤ 6 · 104.

// [output] string: The given HTML converted into the Luna format.
import * as fs from "fs";

type TagNames = "div" | "/div" | "p" | "/p" | "b" | "/b" | "img /";

class TagNode {
  name: string;
  children: TagNode[] | null;

  constructor(name: TagNames, children: TagNode[] | null) {
    this.name = name;
    this.children = children;
  }

  addChild(child: TagNode) {
    this.children = this.children ? [...this.children, child] : [child];
  }

  forEachChild(callback: (child: TagNode) => void) {
    this.children?.forEach((child) => callback(child));
  }
}

class Converter {
  head: TagNode[] = [];

  closingTags: { [key: string]: string } = {
    html: "/html",
    head: "/head",
    body: "/body",
    section: "/section",
    article: "/article",
    button: "/button",
    div: "/div",
    p: "/p",
    span: "/span",
    b: "/b",
  };

  parse(html: string) {
    const parentStack: TagNode[] = [];
    const closingTagStack: string[] = [];

    while (html) {
      const [tag, newHtml] = this.getNextTag(html);
      html = newHtml;

      const node = this.createNode(tag);

      // If the node is the closing tag at the front of stack
      if (node.name === closingTagStack[0]) {
        if (parentStack.length >= 2) {
          parentStack[1].addChild(parentStack[0]);
        } else {
          this.head.push(parentStack[0]);
        }
        parentStack.shift();
        closingTagStack.shift();

        // Stop execution of current loop
        continue;
      } else if (this.closingTags[node.name]) {
        // If node is an opening tag, add it to closing stack
        closingTagStack.unshift(this.closingTags[node.name]);
      }

      if (node.children !== null) {
        // Node is an opening tag
        parentStack.unshift(node);
      } else {
        // Node is img tag
        if (parentStack[0]) {
          parentStack[0].addChild(node);
        } else {
          this.head.push(node);
        }
      }
    }

    return this.head;
  }

  /**
   *
   * @param options 1) compress - if set to true, the returned string will not have '\n' in it.
   */
  formatHTML(options: { compress: boolean } = { compress: false }) {
    const { compress } = options;
    let res = "";
    let level = 1;

    const formatNode = (node: TagNode, level: number, opening: boolean) => {
      let r = "";

      if (!compress) r += Array(level).join("   ");
      r += opening ? `<${node.name}>` : `</${node.name}>`;
      if (!compress) r += "\n";

      return r;
    };

    const loopChildren = (node: TagNode) => {
      let r = "";

      r += formatNode(node, level, true);

      node.forEachChild((child) => {
        if (child.children) {
          level++;
          r += loopChildren(child);
        } else {
          // Image tag
          r += formatNode(child, level + 1, true);
        }
      });

      r += formatNode(node, level, false);

      if (level > 1) level--;

      return r;
    };

    for (let parent of this.head) {
      if (parent.children) {
        res += loopChildren(parent);
      } else {
        res += formatNode(parent, level, true);
      }
    }

    res = res.replace(/\n+$/, "");
    return res;
  }

  prettyPrint() {
    let res = "";
    let level = 1;

    const loopChildren = (node: TagNode) => {
      const gap = Array(level).join("  ");

      let r = gap + (level > 1 ? "└── " : "") + `${node.name}\n`;

      node.children?.forEach((child) => {
        if (child.children) {
          level++;
          r += loopChildren(child);
        } else {
          // Image tag
          r += gap + "  └── " + `${child.name.substring(0, child.name.indexOf("/"))}\n`;
        }
      });

      if (level > 1) level--;
      return r;
    };

    for (let parent of this.head) {
      if (parent.children) {
        res += loopChildren(parent);
      } else {
        res += `${parent.name.substring(0, parent.name.indexOf("/"))}\n`;
      }
    }

    res = res.replace(/\n+$/, "");
    console.log(res);
  }

  createNode(tag: string) {
    const tagName = tag.replace(/[\<\>]+/g, "").trim() as TagNames;
    const isVoidElement = tagName.indexOf("/") > -1;

    return new TagNode(tagName, isVoidElement ? null : []);
  }

  /**
   *
   * @param html
   * @returns an array containing two values: the next html tag and the new HTML after the tag has been removed
   */
  getNextTag(html: string) {
    const endOfTag = html.indexOf(">");
    const tag = html.substring(0, endOfTag + 1);
    const newHTML = html.substring(endOfTag + 1);
    return [tag, newHTML];
  }
}

// fs.readFile("./example.html", "utf8", (err, data) => {
//   if (err) throw err;

//   const c = new Converter();
//   const ast = c.parse(data);
//   console.table(ast);

//   const formattedHTML = c.formatHTML();

//   fs.writeFile("./example.html", formattedHTML, (err) => {
//     if (err) throw err;
//   });
// });

const c = new Converter();

const ast = c.parse(
  `<head><meta class="classNameHere"/> <meta /> </head><body><div> <span></span>   <img /> <b> <p><img /><b><img /><img /><div>   <br />   <section></section>      <p><img />         <p><img/></p>         </p></div></b></p></b><img /></div><div><p>         <img /><b><img /></b></p><img /></div><p><div><b><img /></b><img /></div></p><img /><p></p></body>`
);

console.table(ast);

c.formatHTML();

c.formatHTML({ compress: true });

c.prettyPrint();
