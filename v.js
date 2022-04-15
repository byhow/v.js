/** @jsx h */
require("@babel/core").transform("code", {
  presets: ["@babel/preset-react"],
});

/**
 * Create POJO from virtual dom tree
 * 
 * @param {*} type
 * @param {*} props
 * @param {*} children
 * @returns 
 */
function h(type, props, ...children) {
  return { type, props, children };
}

/**
 * Create DOM nodes from virtual dom node
 * 
 * @param {*} node 
 * @returns 
 */
function createElement(node) {
  if (typeof node === 'string') {
    return document.createTextNode(node);
  }
  const $el = document.createElement(node.type);
  node.children
    .map(createElement)
    .forEach($el.appendChild.bind($el));
  return $el;
}

/**
 * Update DOM tree
 * 
 * @param {HTMLElement} $parent 
 * @param {ChildNode} newNode 
 * @param {*} oldNode 
 * @param {Integer} index
 */
function updateElement($parent, newNode, oldNode, index=0) {
  if (!oldNode) {
    // when there is no old node and just need to add new node
    $parent.appendChild(
      createElement(newNode)
    );
  } else if (!newNode) {
    // when we need to remove the old node
    $parent.removeChild(
      $parent.childNodes[index]
    );
  } else if (changed(newNode, oldNode)) {
    // when we replace child
    $parent.replaceChild(
      createElement(newNode), 
      $parent.childNodes[index]
    );
  } else if (newNode.type) {
    // needs to recursively diff children as well
    const newLen = newNode.children.length;
    const oldLen = oldNode.children.length;
    for (let i = 0; i < newLen || i < oldLen; i++) {
      updateElement(
        $parent.childNodes[index],
        newNode.children[i],
        oldNode.children[i],
        i
      )
    }
  }
} 

/**
 * Compare if 2 nodes to see if one changed for both elem
 * and text nodes
 * 
 * @param {*} node1 
 * @param {*} node2 
 * @returns 
 */
function changed(node1, node2) {
  return typeof node1 !== typeof node2 || 
    typeof node1 === 'string' && node1 !== node2 ||
    node1.type !== node2.type
}


const a = (
  <ul className="list">
    <li>item 1</li>
    <li>item 2</li>
  </ul>
);

const b = (
  <ul className="list">
    <li>item 1</li>
    <li>hello!</li>
  </ul>
)

const $root = document.getElementById('root');
const $reload = document.getElementById('reload');

updateElement($root, a);
$reload.addEventListener('click', () => {
  updateElement($root, b, a);
});
